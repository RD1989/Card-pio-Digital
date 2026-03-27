<?php

use App\Http\Controllers\AuthController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Rotas públicas para o cardápio
Route::get('/categories', [\App\Http\Controllers\CategoryController::class, 'index']);
Route::get('/products', [\App\Http\Controllers\ProductController::class, 'index']);
Route::post('/analytics/view', [\App\Http\Controllers\AnalyticsController::class, 'view']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user()->load('restaurant');
    });

    Route::get('/dashboard', [\App\Http\Controllers\DashboardController::class, 'index']);

    Route::get('/settings', [\App\Http\Controllers\SystemSettingController::class, 'index']);
    Route::post('/settings', [\App\Http\Controllers\SystemSettingController::class, 'update']);

    Route::get('/restaurant', [\App\Http\Controllers\RestaurantController::class, 'show']);
    Route::post('/restaurant', [\App\Http\Controllers\RestaurantController::class, 'update']);

    Route::apiResource('categories', \App\Http\Controllers\CategoryController::class)->except(['index']);
    Route::apiResource('products', \App\Http\Controllers\ProductController::class)->except(['index']);
});
