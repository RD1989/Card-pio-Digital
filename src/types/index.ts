export interface User {
  id: number;
  name: string;
  email: string;
  is_super_admin?: boolean;
  restaurant?: {
    id: number;
    name: string;
    slug: string;
    logo_url?: string;
    banner_url?: string;
    accent_color?: string;
    bio?: string;
    address?: string;
    whatsapp_number?: string;
    social_links?: Record<string, string>;
    business_hours?: Record<string, any>;
  };
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Category {
  id: number;
  name: string;
  sort_order: number;
  products_count?: number;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  original_price?: number;
  image?: string;
  image_url?: string;
  category: string | Category;
  is_available: boolean;
  is_upsell?: boolean;
  tags?: string[];
}

export interface CartItem extends Product {
  quantity: number;
}
