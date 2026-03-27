<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Restaurant;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Super Admin (Dono do Sistema)
        User::create([
            'name' => 'Dono do Sistema',
            'email' => 'admin@cardapio.com',
            'password' => Hash::make('password'),
            'is_super_admin' => true,
        ]);

        // 2. Logista (Dono do Restaurante)
        $logista = User::create([
            'name' => 'Sashimi Master',
            'email' => 'loja@cardapio.com',
            'password' => Hash::make('password'),
            'is_super_admin' => false,
        ]);

        // 3. Restaurante
        $restaurant = Restaurant::create([
            'user_id' => $logista->id,
            'name' => 'Sashimi Master Premium',
            'slug' => 'sashimi-master',
            'whatsapp_number' => '5511999999999',
            'accent_color' => '#d4af37',
            'bio' => 'A autêntica culinária japonesa com um toque de modernidade e exclusividade.',
            'address' => 'Alameda Santos, 1200 - Jardins, SP',
            'logo_url' => 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=200',
            'banner_url' => 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=1200',
            'is_active' => true,
        ]);

        // 4. Categorias
        $catEntradas = Category::create(['restaurant_id' => $restaurant->id, 'name' => 'Entradas', 'sort_order' => 1]);
        $catPrincipal = Category::create(['restaurant_id' => $restaurant->id, 'name' => 'Pratos Principais', 'sort_order' => 2]);
        $catBebidas = Category::create(['restaurant_id' => $restaurant->id, 'name' => 'Bebidas', 'sort_order' => 3]);

        // 5. Produtos (12 produtos)
        $products = [
            // Entradas
            ['cat' => $catEntradas, 'name' => 'Sunomono Especial', 'desc' => 'Salada de pepino japonês com kani e gergelim.', 'price' => 18.90],
            ['cat' => $catEntradas, 'name' => 'Guioza de Lombo', 'desc' => '6 unidades de pastéis japoneses grelhados.', 'price' => 32.00],
            ['cat' => $catEntradas, 'name' => 'Harumaki de Queijo', 'desc' => 'Rolinho primavera crocante com queijo derretido.', 'price' => 15.00],
            ['cat' => $catEntradas, 'name' => 'Edamame com Flor de Sal', 'desc' => 'Grãos de soja verde cozidos no vapor.', 'price' => 22.00],
            
            // Principais
            ['cat' => $catPrincipal, 'name' => 'Combo Sashimi 20un', 'desc' => 'Seleção premium de salmão, atum e peixe branco.', 'price' => 89.90, 'upsell' => true],
            ['cat' => $catPrincipal, 'name' => 'Uramaki Filadélfia', 'desc' => '8 unidades de enrolado de salmão com cream cheese.', 'price' => 38.00],
            ['cat' => $catPrincipal, 'name' => 'Temaki Salmão Completo', 'desc' => 'Cone de alga com arroz, salmão e cebolinha.', 'price' => 35.00],
            ['cat' => $catPrincipal, 'name' => 'Nigiri Selection', 'desc' => 'Par de nigiris de salmão maçaricado com azeite de trufas.', 'price' => 24.00],
            ['cat' => $catPrincipal, 'name' => 'Hot Roll Crispy', 'desc' => '10 unidades de sushi frito com couve crispy e tarê.', 'price' => 45.00],
            ['cat' => $catPrincipal, 'name' => 'Carpaccio de Salmão', 'desc' => 'Lâminas finas de salmão com molho ponzu e ovas.', 'price' => 58.00, 'upsell' => true],
            
            // Bebidas
            ['cat' => $catBebidas, 'name' => 'Sake Junmai 750ml', 'desc' => 'Sake premium importado do Japão.', 'price' => 120.00],
            ['cat' => $catBebidas, 'name' => 'Suco Pink Lemonade', 'desc' => 'Refrescante limonada com frutas vermelhas.', 'price' => 14.00],
        ];

        foreach ($products as $p) {
            Product::create([
                'category_id' => $p['cat']->id,
                'name' => $p['name'],
                'description' => $p['desc'],
                'price' => $p['price'],
                'image_url' => 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=800',
                'is_available' => true,
                'is_upsell' => $p['upsell'] ?? false,
            ]);
        }
    }
}
