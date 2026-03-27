<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Category;
use App\Models\Restaurant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ProductController extends Controller
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

        $query = Product::whereHas('category', function ($q) use ($restaurant) {
            $q->where('restaurant_id', $restaurant->id);
        });

        if ($request->has('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        $products = $query->with('category')->orderBy('sort_order')->get();

        return response()->json($products);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', Product::class);

        $validated = $request->validate([
            'category_id' => 'required|exists:categories,id',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'original_price' => 'nullable|numeric|min:0',
            'image_url' => 'nullable|string',
            'is_available' => 'boolean',
            'is_upsell' => 'boolean',
            'tags' => 'nullable|array',
            'sort_order' => 'nullable|integer',
        ]);

        // Verify category belongs to user's restaurant
        $category = Category::findOrFail($validated['category_id']);
        if ($category->restaurant_id !== Auth::user()->restaurant->id) {
            return response()->json(['message' => 'Categoria inválida para este restaurante.'], 403);
        }

        $product = Product::create($validated);

        return response()->json($product, 201);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Product $product): JsonResponse
    {
        $this->authorize('update', $product);

        $validated = $request->validate([
            'category_id' => 'sometimes|required|exists:categories,id',
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'sometimes|required|numeric|min:0',
            'original_price' => 'nullable|numeric|min:0',
            'image_url' => 'nullable|string',
            'is_available' => 'boolean',
            'is_upsell' => 'boolean',
            'tags' => 'nullable|array',
            'sort_order' => 'nullable|integer',
        ]);

        if (isset($validated['category_id'])) {
            $category = Category::findOrFail($validated['category_id']);
            if ($category->restaurant_id !== Auth::user()->restaurant->id) {
                return response()->json(['message' => 'Categoria inválida.'], 403);
            }
        }

        $product->update($validated);

        return response()->json($product);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Product $product): JsonResponse
    {
        $this->authorize('delete', $product);
        $product->delete();

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

        return Restaurant::first();
    }
}
