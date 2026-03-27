<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use App\Models\Restaurant;

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

        $restaurant->fill($validated);
        $restaurant->save();

        return response()->json([
            'message' => 'Configurações de branding atualizadas com sucesso!',
            'restaurant' => $restaurant->fresh()
        ]);
    }

    /**
     * Get specific restaurant settings.
     */
    public function show(Request $request): JsonResponse
    {
        return response()->json($request->user()->restaurant);
    }

    /**
     * Public endpoint: get restaurant data by slug (no auth required).
     */
    public function showPublic(string $slug): JsonResponse
    {
        $restaurant = Restaurant::where('slug', $slug)->first();

        if (!$restaurant) {
            return response()->json(['message' => 'Restaurante não encontrado.'], 404);
        }

        return response()->json([
            'name' => $restaurant->name,
            'slug' => $restaurant->slug,
            'bio' => $restaurant->bio,
            'address' => $restaurant->address,
            'logo_url' => $restaurant->logo_url,
            'banner_url' => $restaurant->banner_url,
            'accent_color' => $restaurant->accent_color,
            'whatsapp_number' => $restaurant->whatsapp_number,
            'social_links' => $restaurant->social_links,
        ]);
    }

    /**
     * List all restaurants for super admin.
     */
    public function index(Request $request): JsonResponse
    {
        if (!$request->user()->is_super_admin) {
            return response()->json(['message' => 'Não autorizado.'], 403);
        }

        $restaurants = Restaurant::with('user:id,name,email')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($r) {
                return [
                    'id' => $r->id,
                    'name' => $r->user->name,
                    'email' => $r->user->email,
                    'created_at' => $r->created_at,
                    'is_active' => $r->is_active,
                    'restaurant' => [
                        'id' => $r->id,
                        'name' => $r->name,
                        'slug' => $r->slug,
                    ]
                ];
            });

        return response()->json($restaurants);
    }

    /**
     * Toggle restaurant active status.
     */
    public function toggleStatus(Request $request, Restaurant $restaurant): JsonResponse
    {
        if (!$request->user()->is_super_admin) {
            return response()->json(['message' => 'Não autorizado.'], 403);
        }

        $restaurant->is_active = !$restaurant->is_active;
        $restaurant->save();

        return response()->json([
            'message' => 'Status atualizado.',
            'is_active' => $restaurant->is_active
        ]);
    }
}
