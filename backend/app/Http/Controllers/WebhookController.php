<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Models\Restaurant;

class WebhookController extends Controller
{
    /**
     * Recebe notificações de pagamento da Fí Bank.
     * Quando um pagamento é confirmado, atualiza automaticamente o plano do restaurante.
     */
    public function fibank(Request $request): JsonResponse
    {
        // Valida o webhook secret da Fí Bank
        $webhookSecret = config('services.fibank.webhook_secret') 
            ?? \App\Models\SystemSetting::where('key', 'fibank_webhook_secret')->value('value');

        $signature = $request->header('X-Fibank-Signature') ?? $request->header('X-Webhook-Signature');

        if ($webhookSecret && $signature) {
            $expected = hash_hmac('sha256', $request->getContent(), $webhookSecret);
            if (!hash_equals($expected, $signature)) {
                return response()->json(['message' => 'Assinatura inválida.'], 401);
            }
        }

        $event = $request->input('event');
        $data  = $request->input('data', []);

        \Log::info('[Fí Bank Webhook] Evento recebido', ['event' => $event, 'data' => $data]);

        switch ($event) {
            case 'subscription.activated':
            case 'payment.approved':
                $this->handlePaymentApproved($data);
                break;

            case 'subscription.cancelled':
            case 'subscription.expired':
                $this->handleSubscriptionExpired($data);
                break;

            default:
                \Log::info('[Fí Bank Webhook] Evento não tratado', ['event' => $event]);
        }

        return response()->json(['message' => 'Webhook processado.'], 200);
    }

    /**
     * Ativa o plano após pagamento confirmado.
     */
    private function handlePaymentApproved(array $data): void
    {
        $restaurantId = $data['metadata']['restaurant_id'] ?? null;
        $plan         = $data['metadata']['plan'] ?? null;

        if (!$restaurantId || !$plan) {
            \Log::warning('[Fí Bank] Webhook sem restaurant_id ou plan nos metadados.', $data);
            return;
        }

        $restaurant = Restaurant::find($restaurantId);
        if ($restaurant) {
            $restaurant->update(['plan' => $plan]);
            \Log::info("[Fí Bank] Plano '{$plan}' ativado para restaurante #{$restaurantId}.");
        }
    }

    /**
     * Volta ao plano free quando a assinatura vence ou é cancelada.
     */
    private function handleSubscriptionExpired(array $data): void
    {
        $restaurantId = $data['metadata']['restaurant_id'] ?? null;

        if (!$restaurantId) return;

        $restaurant = Restaurant::find($restaurantId);
        if ($restaurant) {
            $restaurant->update(['plan' => 'free']);
            \Log::info("[Fí Bank] Plano resetado para 'free' — restaurante #{$restaurantId}.");
        }
    }
}
