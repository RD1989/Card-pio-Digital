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
