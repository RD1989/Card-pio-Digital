<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\AIController;
use App\Http\Controllers\WebhookController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Rotas públicas para o cardápio
Route::get('/categories', [\App\Http\Controllers\CategoryController::class, 'index']);
Route::get('/products', [\App\Http\Controllers\ProductController::class, 'index']);
Route::post('/analytics/view', [\App\Http\Controllers\AnalyticsController::class, 'view']);
Route::post('/analytics/order', [\App\Http\Controllers\AnalyticsController::class, 'order']);
Route::get('/restaurants/{slug}', [\App\Http\Controllers\RestaurantController::class, 'showPublic']);

// IA — proxy seguro para OpenRouter (autenticado)
// Webhook Fí Bank — público (validado via signature)
Route::post('/webhooks/fibank', [WebhookController::class, 'fibank']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user()->load('restaurant');
    });

    Route::get('/dashboard', [\App\Http\Controllers\DashboardController::class, 'index']);

    Route::get('/settings', [\App\Http\Controllers\SystemSettingController::class, 'index']);
    Route::post('/settings', [\App\Http\Controllers\SystemSettingController::class, 'update']);

    Route::get('/restaurant', [\App\Http\Controllers\RestaurantController::class, 'show']);
    Route::post('/restaurant', [\App\Http\Controllers\RestaurantController::class, 'update']);

    Route::get('/admin/clients', [\App\Http\Controllers\RestaurantController::class, 'index']);
    Route::post('/admin/clients/{restaurant}/toggle', [\App\Http\Controllers\RestaurantController::class, 'toggleStatus']);

    Route::apiResource('categories', \App\Http\Controllers\CategoryController::class)->except(['index']);
    Route::apiResource('products', \App\Http\Controllers\ProductController::class)->except(['index']);

    // IA — proxy seguro para OpenRouter
    Route::post('/ai/chat', [AIController::class, 'chat']);
    Route::post('/ai/image', [AIController::class, 'analyzeImage']);
    Route::get('/ai/test', [AIController::class, 'testConnection']);

    // Admin: gerenciamento de planos via painel
    Route::post('/admin/clients/{restaurant}/plan', [\App\Http\Controllers\RestaurantController::class, 'updatePlan']);
});
