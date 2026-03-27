<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\SystemSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SystemSettingController extends Controller
{
    /**
     * Display a listing of system settings.
     */
    public function index(): JsonResponse
    {
        return response()->json(
            SystemSetting::all()->pluck('value', 'key')
        );
    }

    /**
     * Update system settings in batch.
     */
    public function update(Request $request): JsonResponse
    {
        if (!$request->user()->is_super_admin) {
            return response()->json(['message' => 'Acesso negado. Apenas administradores podem alterar configurações globais.'], 403);
        }

        $settings = $request->all();
        
        foreach ($settings as $key => $value) {
            SystemSetting::updateOrCreate(
                ['key' => $key],
                ['value' => is_array($value) ? json_encode($value) : (string) $value]
            );
        }

        return response()->json([
            'message' => 'Configurações atualizadas com sucesso'
        ]);
    }
}
