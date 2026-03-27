<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class RestaurantController extends Controller
{
    /**
     * Update the restaurant's branding and information.
     */
    public function update(Request $request): JsonResponse
    {
        $user = $request->user();
        $restaurant = $user->restaurant;

        if (!$restaurant) {
            return response()->json(['message' => 'Restaurante não encontrado.'], 404);
        }

        $validated = $request->validate([
            'name' => 'sometimes|nullable|string|max:255',
            'accent_color' => 'sometimes|nullable|string|max:10',
            'whatsapp_number' => 'sometimes|nullable|string|max:20',
            'social_links' => 'sometimes|nullable|array',
            'bio' => 'sometimes|nullable|string|max:500',
            'address' => 'sometimes|nullable|string|max:255',
        ]);

        // Handle Logo Upload
        if ($request->hasFile('logo')) {
            if ($restaurant->logo_url) {
                Storage::disk('public')->delete(str_replace('/storage/', '', $restaurant->logo_url));
            }
            $path = $request->file('logo')->store('logos', 'public');
            $restaurant->logo_url = Storage::url($path);
        }

        // Handle Banner Upload
        if ($request->hasFile('banner')) {
            if ($restaurant->banner_url) {
                Storage::disk('public')->delete(str_replace('/storage/', '', $restaurant->banner_url));
            }
            $path = $request->file('banner')->store('banners', 'public');
            $restaurant->banner_url = Storage::url($path);
        }

        $restaurant->update($validated);

        return response()->json([
            'message' => 'Configurações de branding atualizadas com sucesso!',
            'restaurant' => $restaurant
        ]);
    }

    /**
     * Get specific restaurant settings.
     */
    public function show(Request $request): JsonResponse
    {
        return response()->json($request->user()->restaurant);
    }
}
