import type { Product } from '../types';

export const categories = [
  "Todos",
  "Lançamentos",
  "Hambúrgueres",
  "Acompanhamentos",
  "Bebidas",
  "Sobremesas"
];

export const products: Product[] = [
  {
    id: 1,
    name: "Smash Burger Pro",
    description: "Blend especial 120g, queijo prato, cebola caramelizada e pão artesanal.",
    price: 28.90,
    image: "https://images.unsplash.com/photo-1510709638350-ef2b1cbdcc95?q=80&w=800",
    category: "Lançamentos",
    is_available: true,
    is_upsell: true,
    tags: ["Novidade", "Promoção"]
  },
  {
    id: 2,
    name: "Classic Burger",
    description: "Hambúrguer bovino 160g, queijo cheddar e maionese artesanal.",
    price: 32.00,
    original_price: 38.00,
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=800",
    category: "Hambúrgueres",
    is_available: true,
    tags: ["Mais Pedido"]
  },
  {
    id: 3,
    name: "Coca-Cola 350ml",
    description: "Lata gelada.",
    price: 7.00,
    image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=800",
    category: "Bebidas",
    is_available: true,
    is_upsell: true
  },
  {
    id: 4,
    name: "Veggie Delight",
    description: "Hambúrguer de grão de bico, alface e tomate.",
    price: 30.00,
    image: "https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=800",
    category: "Hambúrgueres",
    is_available: false,
    tags: ["Vegano"]
  }
];
