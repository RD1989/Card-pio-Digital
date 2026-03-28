<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\SystemSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class AIController extends Controller
{
    /**
     * Proxy seguro para a OpenRouter API.
     * A chave nunca é exposta ao frontend.
     */
    public function chat(Request $request): JsonResponse
    {
        $request->validate([
            'messages' => 'required|array',
            'messages.*.role' => 'required|in:user,assistant,system',
            'messages.*.content' => 'required|string',
        ]);

        $apiKey = SystemSetting::where('key', 'ai_api_key')->value('value');
        $model  = SystemSetting::where('key', 'ai_model')->value('value') ?? 'google/gemini-flash-1.5';

        if (!$apiKey) {
            return response()->json([
                'error' => 'AI_NOT_CONFIGURED',
                'message' => 'A chave da OpenRouter não está configurada. Acesse o Painel do Administrador → Config. IA.',
            ], 503);
        }

        try {
            $response = Http::withHeaders([
                'Authorization'  => "Bearer {$apiKey}",
                'HTTP-Referer'   => config('app.url'),
                'X-Title'        => 'Cardápio Digital SaaS',
                'Content-Type'   => 'application/json',
            ])->timeout(30)->post('https://openrouter.ai/api/v1/chat/completions', [
                'model'    => $model,
                'messages' => $request->input('messages'),
            ]);

            if ($response->failed()) {
                return response()->json([
                    'error'   => 'AI_API_ERROR',
                    'message' => 'Erro ao comunicar com a OpenRouter. Verifique a chave da API.',
                    'details' => $response->json(),
                ], $response->status());
            }

            $result = $response->json();
            $content = $result['choices'][0]['message']['content'] ?? null;

            return response()->json([
                'content' => $content,
                'model'   => $result['model'] ?? $model,
                'usage'   => $result['usage'] ?? null,
            ]);

        } catch (\Illuminate\Http\Client\ConnectionException $e) {
            return response()->json([
                'error'   => 'CONNECTION_ERROR',
                'message' => 'Não foi possível conectar à OpenRouter. Verifique sua conexão.',
            ], 503);
        }
    }

    /**
     * Analisa imagem de cardápio via Vision (OCR com IA).
     * Ideal para o recurso de "Importar Menu por Foto".
     */
    public function analyzeImage(Request $request): JsonResponse
    {
        $request->validate([
            'image_base64' => 'required|string',
            'prompt' => 'nullable|string|max:1000',
        ]);

        $apiKey = SystemSetting::where('key', 'ai_api_key')->value('value');
        $model  = SystemSetting::where('key', 'ai_model')->value('value') ?? 'google/gemini-flash-1.5';

        if (!$apiKey) {
            return response()->json([
                'error' => 'AI_NOT_CONFIGURED',
                'message' => 'A chave da OpenRouter não está configurada.',
            ], 503);
        }

        $prompt = $request->input('prompt', 
            'Analise esta imagem de um cardápio/menu de restaurante. ' .
            'Extraia todos os produtos que aparecem, com nome, descrição e preço. ' .
            'Retorne SOMENTE um JSON válido no formato: ' .
            '{"products": [{"name": "string", "description": "string", "price": number, "category": "string"}]}'
        );

        try {
            $response = Http::withHeaders([
                'Authorization' => "Bearer {$apiKey}",
                'HTTP-Referer'  => config('app.url'),
                'X-Title'       => 'Cardápio Digital SaaS - Vision',
            ])->timeout(60)->post('https://openrouter.ai/api/v1/chat/completions', [
                'model' => $model,
                'messages' => [
                    [
                        'role' => 'user',
                        'content' => [
                            [
                                'type' => 'text',
                                'text' => $prompt,
                            ],
                            [
                                'type' => 'image_url',
                                'image_url' => [
                                    'url' => 'data:image/jpeg;base64,' . $request->input('image_base64'),
                                ],
                            ],
                        ],
                    ],
                ],
            ]);

            if ($response->failed()) {
                return response()->json([
                    'error'   => 'AI_API_ERROR',
                    'message' => 'Erro ao processar imagem via IA.',
                    'details' => $response->json(),
                ], $response->status());
            }

            $result  = $response->json();
            $content = $result['choices'][0]['message']['content'] ?? '';

            // Tenta extrair o JSON da resposta
            preg_match('/\{.*\}/s', $content, $matches);
            $jsonStr = $matches[0] ?? $content;

            $parsed = json_decode($jsonStr, true);

            return response()->json([
                'products' => $parsed['products'] ?? [],
                'raw'      => $content,
            ]);

        } catch (\Illuminate\Http\Client\ConnectionException $e) {
            return response()->json([
                'error'   => 'CONNECTION_ERROR',
                'message' => 'Timeout ao conectar à OpenRouter.',
            ], 503);
        }
    }

    /**
     * Testa a conexão com a OpenRouter para diagnosticar a configuração.
     * Acessível apenas por super admins.
     */
    public function testConnection(Request $request): JsonResponse
    {
        if (!$request->user()->is_super_admin) {
            return response()->json(['message' => 'Acesso negado.'], 403);
        }

        $apiKey = SystemSetting::where('key', 'ai_api_key')->value('value');

        if (!$apiKey) {
            return response()->json([
                'status' => 'error',
                'message' => 'Nenhuma chave de API configurada.',
            ]);
        }

        try {
            $response = Http::withHeaders([
                'Authorization' => "Bearer {$apiKey}",
            ])->timeout(10)->get('https://openrouter.ai/api/v1/auth/key');

            if ($response->successful()) {
                $data = $response->json();
                return response()->json([
                    'status'  => 'ok',
                    'message' => 'Conexão com OpenRouter estabelecida com sucesso.',
                    'label'   => $data['data']['label'] ?? 'N/A',
                    'usage'   => $data['data']['usage'] ?? 0,
                    'limit'   => $data['data']['limit'] ?? null,
                    'model'   => SystemSetting::where('key', 'ai_model')->value('value') ?? 'não configurado',
                ]);
            }

            return response()->json([
                'status'  => 'error',
                'message' => 'Chave de API inválida ou sem permissão.',
                'details' => $response->json(),
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Falha ao conectar: ' . $e->getMessage(),
            ], 503);
        }
    }
}
