<?php

namespace App\Services;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Exception;

class MenuAIExtractorService
{
    /**
     * Extrai dados de uma imagem de cardápio e salva no banco de dados.
     *
     * @param string $imagePath Caminho local da imagem
     * @param int $restaurantId ID do restaurante dono do cardápio
     * @return bool
     * @throws Exception
     */
    public function extractAndSave(string $imagePath, int $restaurantId): bool
    {
        try {
            // 1. Converter imagem para Base64
            $imageData = base64_encode(file_get_contents($imagePath));
            $extension = pathinfo($imagePath, PATHINFO_EXTENSION);
            $mimeType = match($extension) {
                'png' => 'image/png',
                'jpg', 'jpeg' => 'image/jpeg',
                'webp' => 'image/webp',
                default => 'image/jpeg',
            };

            /** @var \Illuminate\Http\Client\Response $response */
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . config('services.openrouter.key'),
                'HTTP-Referer' => config('app.url'),
                'X-Title' => config('app.name'),
            ])->post('https://openrouter.ai/api/v1/chat/completions', [
                'model' => 'google/gemini-flash-1.5', // Sugestão veloz e econômica para visão
                'messages' => [
                    [
                        'role' => 'system',
                        'content' => 'Você é um extrator de dados de cardápios. Analise a imagem fornecida e retorne EXCLUSIVAMENTE um JSON válido, sem markdown, sem explicações extras. O JSON deve seguir a estrutura: {"categorias": [{"nome": "Nome da Categoria", "produtos": [{"nome": "Nome do Prato", "descricao": "Ingredientes", "preco": 25.50}]}]}. Formate os preços apenas como números (floats).'
                    ],
                    [
                        'role' => 'user',
                        'content' => [
                            [
                                'type' => 'text',
                                'text' => 'Extraia os dados deste cardápio:'
                            ],
                            [
                                'type' => 'image_url',
                                'image_url' => [
                                    'url' => "data:{$mimeType};base64,{$imageData}"
                                ]
                            ]
                        ]
                    ]
                ]
            ]);

            if ($response->failed()) {
                Log::error("Falha na OpenRouter: " . $response->status() . " - " . $response->body());
                throw new Exception("Falha na API OpenRouter (Status {$response->status()}): " . $response->body());
            }

            $result = $response->json();
            $content = $result['choices'][0]['message']['content'] ?? null;

            if (!$content) {
                throw new Exception("A IA não retornou conteúdo válido.");
            }

            // Limpa possíveis marrons de markdown caso a IA ignore o system prompt
            $jsonString = str_replace(['```json', '```'], '', $content);
            $data = json_decode($jsonString, true);

            if (json_last_error() !== JSON_ERROR_NONE) {
                throw new Exception("Erro ao decodificar JSON da IA: " . json_last_error_msg());
            }

            // 3. Persistência no Banco de Dados
            DB::beginTransaction();

            foreach ($data['categorias'] as $catData) {
                $category = Category::create([
                    'restaurant_id' => $restaurantId,
                    'name' => $catData['nome'],
                    'sort_order' => 0 // Pode ser ajustado depois
                ]);

                foreach ($catData['produtos'] as $prodData) {
                    Product::create([
                        'category_id' => $category->id,
                        'name' => $prodData['nome'],
                        'description' => $prodData['descricao'] ?? null,
                        'price' => (float) ($prodData['preco'] ?? 0),
                        'is_available' => true
                    ]);
                }
            }

            DB::commit();
            return true;

        } catch (Exception $e) {
            DB::rollBack();
            Log::error("Erro no MenuAIExtractorService: " . $e->getMessage());
            throw $e;
        }
    }
}
