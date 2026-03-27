<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\RegisterRequest;
use App\Models\User;
use App\Models\Restaurant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    /**
     * @param RegisterRequest $request
     * @return JsonResponse
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        try {
            $slug = Str::slug($request->validated('restaurant_name'));
            
            // Verifica se o slug já existe
            if (Restaurant::where('slug', $slug)->exists()) {
                return response()->json([
                    'message' => 'Este nome de restaurante já está em uso ou é muito similar a um existente.',
                    'errors' => ['restaurant_name' => ['O nome do restaurante já está em uso.']]
                ], 422);
            }

            return DB::transaction(function () use ($request, $slug) {
                $user = User::create([
                    'name' => $request->validated('name'),
                    'email' => $request->validated('email'),
                    'password' => Hash::make($request->validated('password')),
                ]);

                $restaurant = Restaurant::create([
                    'user_id' => $user->id,
                    'name' => $request->validated('restaurant_name'),
                    'slug' => $slug,
                    'whatsapp_number' => '', // Configurado posteriormente no onboarding
                ]);

                return response()->json([
                    'token' => $user->createToken('auth_token')->plainTextToken,
                    'user' => $user->load('restaurant'),
                ], 201);
            });
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erro ao processar o registro. Tente novamente.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * @param Request $request
     * @return JsonResponse
     */
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Credenciais inválidas'], 401);
        }

        return response()->json([
            'token' => $user->createToken('auth_token')->plainTextToken,
            'user' => $user->load('restaurant'),
        ]);
    }
}
