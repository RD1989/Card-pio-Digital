<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Restaurant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CategoryController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        $restaurant = $this->resolveRestaurant($request);

        if (!$restaurant) {
            return response()->json([], 200);
        }

        return response()->json(
            $restaurant->categories()->withCount('products')->get()
        );
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', Category::class);
        $restaurant = Auth::user()->restaurant;
        
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'sort_order' => 'nullable|integer',
        ]);

        $category = $restaurant->categories()->create($validated);

        return response()->json($category, 201);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Category $category): JsonResponse
    {
        $this->authorize('update', $category);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'sort_order' => 'nullable|integer',
        ]);

        $category->update($validated);

        return response()->json($category);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Category $category): JsonResponse
    {
        $this->authorize('delete', $category);
        $category->delete();

        return response()->json(null, 204);
    }

    /**
     * Resolve restaurant from auth or request parameters.
     */
    private function resolveRestaurant(Request $request): ?Restaurant
    {
        if (Auth::check()) {
            return Auth::user()->restaurant;
        }

        if ($request->has('restaurant_id')) {
            return Restaurant::find($request->restaurant_id);
        }

        if ($request->has('slug')) {
            return Restaurant::where('slug', $request->slug)->first();
        }

        // Fallback para o primeiro apenas em ambiente de teste ou desenvolvimento inicial
        // No futuro, isso deve ser removido em favor de subdomínios ou slugs obrigatórios
        return Restaurant::first();
    }
}
