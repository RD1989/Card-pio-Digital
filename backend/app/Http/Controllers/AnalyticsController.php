<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Restaurant;
use App\Models\RestaurantView;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AnalyticsController extends Controller
{
    /**
     * Register a public view for a restaurant.
     */
    public function view(Request $request): JsonResponse
    {
        $restaurant = $this->resolveRestaurant($request);

        if (!$restaurant) {
            return response()->json(['message' => 'Restaurant not found'], 404);
        }

        // Registrar o view real no banco de dados
        RestaurantView::create([
            'restaurant_id' => $restaurant->id,
            'ip_address' => $request->ip(),
        ]);

        return response()->json(['message' => 'View registered successfully'], 201);
    }

    /**
     * Register a new order intent (WhatsApp checkout) and check plan limits.
     */
    public function order(Request $request): JsonResponse
    {
        $restaurant = $this->resolveRestaurant($request);

        if (!$restaurant) {
            return response()->json(['message' => 'Restaurant not found'], 404);
        }

        $planConfig = $restaurant->planConfig;
        $orderLimit = $planConfig['features']['monthly_orders_limit'];

        if ($orderLimit !== -1) {
            $ordersThisMonth = $restaurant->orders()
                ->whereMonth('created_at', now()->month)
                ->whereYear('created_at', now()->year)
                ->count();

            if ($ordersThisMonth >= $orderLimit) {
                return response()->json([
                    'error' => 'PLAN_LIMIT_EXCEEDED',
                    'message' => 'O restaurante excedeu o limite de pedidos mensais do plano atual.',
                ], 403);
            }
        }

        // Register the order logic
        $restaurant->orders()->create([
            'total_amount' => $request->get('total_amount', 0),
            'items_count' => $request->get('items_count', 0),
        ]);

        return response()->json(['message' => 'Order registered successfully'], 201);
    }

    /**
     * Resolve restaurant from request parameters.
     */
    private function resolveRestaurant(Request $request): ?Restaurant
    {
        if ($request->has('slug')) {
            return Restaurant::where('slug', $request->slug)->first();
        }

        if ($request->has('restaurant_id')) {
            return Restaurant::find($request->restaurant_id);
        }

        // Fallback for MVP testing without parameters
        return Restaurant::first();
    }
}
