// apps/web/app/types/shop.ts
export interface Shop {
  id: string
  name: string
  slug: string
  description: string | null
  category: string | null
  logo_url: string | null
  
  // Contact
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  country: string | null
  postal_code: string | null
  
  // Réseaux sociaux
  website: string | null
  instagram: string | null
  facebook: string | null
  twitter: string | null
  
  // À propos
  about_story: string | null
  about_mission: string | null
  about_values: string | null
  about_commitments: string | null
  
  // Infos pratiques
  business_hours: string | null
  shipping_info: string | null
  return_policy: string | null
  payment_methods: string | null
  
  // Images
  about_image1_url: string | null
  about_image2_url: string | null
  
  // Stats
  total_products: number
  total_orders: number
  total_revenue: number
  total_visitors: number
  
  created_at: string
  updated_at: string
}

export interface Stats {
  totalProducts: number
  totalCategories: number
  averagePrice: number
  inStock: number
  digitalProducts: number
  featuredProducts: number
  categories: [string, number][]
}

export interface SocialLinks {
  instagram?: string
  facebook?: string
  twitter?: string
  website?: string
}

export interface ContactInfo {
  email?: string
  phone?: string
  address?: string
  city?: string
  country?: string
  postal_code?: string
}

export interface PracticalInfo {
  business_hours?: string
  shipping_info?: string
  return_policy?: string
  payment_methods?: string
}

export interface CommitmentCard {
  icon: string
  title: string
  description: string
}
