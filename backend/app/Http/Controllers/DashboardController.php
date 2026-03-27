<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Product;
use App\Models\Restaurant;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    /**
     * Retorna os dados do dashboard (Admin ou Lojista).
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->is_super_admin) {
            return $this->getAdminDashboard();
        }

        return $this->getMerchantDashboard($user);
    }

    private function getAdminDashboard(): JsonResponse
    {
        $totalLojistas = Restaurant::count();
        $assinantesMes = Restaurant::where('created_at', '>=', now()->subDays(30))->count();
        $receitaEstimada = $totalLojistas * 150; // Mock: R$ 150 por assinatura ativa
        $qrScans = $totalLojistas * 85; // Mock: 85 scans médios por loja

        // Gráfico de adesões por mês (Últimos 6 meses)
        $chartData = Restaurant::select(
            DB::raw('strftime("%m", created_at) as month'),
            DB::raw('count(*) as value')
        )
        ->where('created_at', '>=', now()->subMonths(6))
        ->groupBy('month')
        ->orderBy('month')
        ->get()
        ->map(function ($item) {
            $months = [
                '01' => 'Jan', '02' => 'Fev', '03' => 'Mar', '04' => 'Abr',
                '05' => 'Mai', '06' => 'Jun', '07' => 'Jul', '08' => 'Ago',
                '09' => 'Set', '10' => 'Out', '11' => 'Nov', '12' => 'Dez'
            ];
            return [
                'name' => $months[$item->month] ?? $item->month,
                'value' => (int) $item->value
            ];
        });

        // Caso o banco esteja zerado, enviar array vazio ou dados zerados pro chart
        if ($chartData->isEmpty()) {
            $month = now()->format('m');
            $months = ['01'=>'Jan','02'=>'Fev','03'=>'Mar','04'=>'Abr','05'=>'Mai','06'=>'Jun','07'=>'Jul','08'=>'Ago','09'=>'Set','10'=>'Out','11'=>'Nov','12'=>'Dez'];
            $chartData = [
                ['name' => $months[$month], 'value' => $totalLojistas]
            ];
        }

        return response()->json([
            'role' => 'admin',
            'stats' => [
                [
                    'label' => 'Total Lojistas',
                    'value' => (string) $totalLojistas,
                    'trend' => '+12%'
                ],
                [
                    'label' => 'Novos Assinantes (30d)',
                    'value' => (string) $assinantesMes,
                    'trend' => '+5%'
                ],
                [
                    'label' => 'Scan de QR Codes',
                    'value' => number_format($qrScans, 0, ',', '.'),
                    'trend' => '+25%'
                ],
                [
                    'label' => 'Receita Estimada',
                    'value' => 'R$ ' . number_format($receitaEstimada, 2, ',', '.'),
                    'trend' => '+8%'
                ]
            ],
            'chartTitle' => 'Crescimento de Assinaturas',
            'chartData' => $chartData
        ]);
    }

    private function getMerchantDashboard(User $user): JsonResponse
    {
        $restaurantId = $user->restaurant->id ?? 0;

        $totalProdutos = Product::where('restaurant_id', $restaurantId)->count();
        $produtosAtivos = Product::where('restaurant_id', $restaurantId)->where('is_active', true)->count();
        $totalCategorias = Category::where('restaurant_id', $restaurantId)->count();
        $visitasCardapio = \App\Models\RestaurantView::where('restaurant_id', $restaurantId)->count();
        
        $chartData = \App\Models\RestaurantView::select(
            DB::raw('strftime("%m", created_at) as month'),
            DB::raw('count(*) as value')
        )
        ->where('restaurant_id', $restaurantId)
        ->where('created_at', '>=', now()->subMonths(6))
        ->groupBy('month')
        ->orderBy('month')
        ->get()
        ->map(function ($item) {
            $months = [
                '01' => 'Jan', '02' => 'Fev', '03' => 'Mar', '04' => 'Abr',
                '05' => 'Mai', '06' => 'Jun', '07' => 'Jul', '08' => 'Ago',
                '09' => 'Set', '10' => 'Out', '11' => 'Nov', '12' => 'Dez'
            ];
            return [
                'name' => $months[$item->month] ?? $item->month,
                'value' => (int) $item->value
            ];
        });

        if ($chartData->isEmpty()) {
            $month = now()->format('m');
            $months = ['01'=>'Jan','02'=>'Fev','03'=>'Mar','04'=>'Abr','05'=>'Mai','06'=>'Jun','07'=>'Jul','08'=>'Ago','09'=>'Set','10'=>'Out','11'=>'Nov','12'=>'Dez'];
            $chartData = collect([
                ['name' => $months[$month], 'value' => $visitasCardapio]
            ]);
        }

        return response()->json([
            'role' => 'merchant',
            'stats' => [
                [
                    'label' => 'Total de Categorias',
                    'value' => (string) $totalCategorias,
                    'trend' => null
                ],
                [
                    'label' => 'Total de Produtos',
                    'value' => (string) $totalProdutos,
                    'trend' => null
                ],
                [
                    'label' => 'Produtos Ativos',
                    'value' => (string) $produtosAtivos,
                    'trend' => null
                ],
                [
                    'label' => 'Visualizações do Cardápio',
                    'value' => (string) $visitasCardapio,
                    'trend' => '+15%'
                ]
            ],
            'chartTitle' => 'Visualizações do Cardápio (Últimos Meses)',
            'chartData' => $chartData
        ]);
    }
}
