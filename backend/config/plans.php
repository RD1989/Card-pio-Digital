<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Planos e Limites de Assinatura
    |--------------------------------------------------------------------------
    */

    'free' => [
        'name' => 'Iniciante',
        'price' => 0,
        'features' => [
            'products_limit' => 5,
            'monthly_orders_limit' => 15,
            'custom_colors' => false,
            'priority_support' => false,
        ]
    ],

    'starter' => [
        'name' => 'Starter',
        'price' => 29.90,
        'features' => [
            'products_limit' => 30,
            'monthly_orders_limit' => 100,
            'custom_colors' => true,
            'priority_support' => false,
        ]
    ],

    'pro' => [
        'name' => 'Pro Business',
        'price' => 59.90,
        'features' => [
            // -1 represents unlimited
            'products_limit' => -1,
            'monthly_orders_limit' => -1,
            'custom_colors' => true,
            'priority_support' => true,
        ]
    ],
];
