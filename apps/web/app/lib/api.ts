const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
console.log("🌍 API_URL =", API_URL)

// apps/web/app/lib/api.ts - À AJOUTER VERS LE DÉBUT

export interface User {
  id: string
  email: string
  username: string
  full_name: string | null
  phone: string | null
  avatar: string | null
  is_seller: boolean
  is_active: boolean
  total_shops: number
  created_at: string
  updated_at?: string
  seller_requested_at?: string | null
  seller_approved_at?: string | null
}

export interface UserUpdate {
  full_name?: string
  email?: string
  username?: string
  phone?: string
  avatar?: string
}

export interface PasswordChange {
  current_password: string
  new_password: string
}

// Type pour la réponse du profil
export interface UserProfileResponse extends User {}

export interface ApiResponse<T> {
  data?: T
  error?: string
  status: 'success' | 'error'  // Changez ceci
  statusCode?: number 
}

export interface SellerRequest {
  id: string
  username: string
  email: string
  full_name: string | null
  company_name: string | null
  vat_number: string | null
  address: string | null
  phone: string | null
  requested_at: string
}
export interface ProductCategory {
  value: string
  label: string
}
// Dans api.ts, après SellerRequest
export interface SellerRequestStatusResponse {
  status: 'none' | 'pending' | 'approved' | 'rejected'
  request?: SellerRequest  // La demande si elle existe
}
 
// ===== Types réutilisables =====
// export interface Shop {
//   id: string
//   name: string
//   slug: string
//   description: string | null
//   category: string | null
//   owner_id: string
  
//   // Configuration
//   currency: string
//   language: string
//   timezone: string
  
//   // Branding
//   logo_url: string | null
//   banner_url: string | null
//   primary_color: string
//   secondary_color: string
  
//   // Contact
//   email: string | null
//   phone: string | null
//   address: string | null
//   city: string | null
//   country: string | null
//   postal_code: string | null
  
//   // Réseaux sociaux
//   website: string | null
//   instagram: string | null
//   facebook: string | null
//   twitter: string | null
  
//   // SEO
//   meta_title: string | null
//   meta_description: string | null
  
//   // Status et stats
//   is_active: boolean
//   is_verified: boolean
//   subscription_plan: string
//   total_products: number
//   total_orders: number
//   total_revenue: number
//   total_visitors: number
  
//   // Timestamps
//   created_at: string
//   updated_at: string
  
//   // NOUVEAUX CHAMPS - Page "À propos"
//   about_story: string | null
//   about_mission: string | null
//   about_values: string | null
//   about_commitments: string | null
  
//   // Informations supplémentaires
//   business_hours: string | null
//   shipping_info: string | null
//   return_policy: string | null
//   payment_methods: string | null
  
//   // Images pour la page "À propos"
//   about_image1_url: string | null
//   about_image2_url: string | null
  
//   // Propriétés calculées (optionnel)
//   dashboard_url?: string
//   public_url?: string
// }


export interface Shop {
  id: string
  name: string
  slug: string
  description: string | null
  category: string | null
  owner_id: string
  
  // Configuration
  currency: string
  language: string
  timezone: string
  
  // Branding
  logo_url: string | null
  banner_url: string | null
  primary_color: string
  secondary_color: string
  
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
  
  // SEO
  meta_title: string | null
  meta_description: string | null
  
  // Status et stats
  is_active: boolean
  is_verified: boolean
  subscription_plan: string
  total_products: number
  total_orders: number
  total_revenue: number
  total_visitors: number
  
  // ✅ AJOUTER ICI - Moyens de paiement acceptés
  accepted_payment_methods: string[]  // ← NOUVEAU
  
  // Timestamps
  created_at: string
  updated_at: string
  
  // NOUVEAUX CHAMPS - Page "À propos"
  about_story: string | null
  about_mission: string | null
  about_values: string | null
  about_commitments: string | null
  
  // Informations supplémentaires
  business_hours: string | null
  shipping_info: string | null
  return_policy: string | null
  payment_methods: string | null
  
  // Images pour la page "À propos"
  about_image1_url: string | null
  about_image2_url: string | null
  
  // Propriétés calculées (optionnel)
  dashboard_url?: string
  public_url?: string
}

// ===== Types pour les produits =====
export interface ProductVariation {
  name: string
  options: string[]
  [key: string]: any
}

export interface ProductDimensions {
  length?: number
  width?: number
  height?: number
  [key: string]: any
}

export interface Product {
  id: string
  name: string
  slug: string
  description: string | null
  price: number
  compare_price: number | null
  stock: number
  images: string[]
  category: string | null
  sku: string | null
  shop_id: string
  is_active: boolean
  is_featured: boolean
  is_digital: boolean
  digital_url: string | null
  weight_grams: number | null
  dimensions: ProductDimensions | null
  tags: string[]
  variations: ProductVariation[]
  meta_title: string | null
  meta_description: string | null
  view_count: number
  has_discount: boolean
  discount_percentage: number
  formatted_price: string
  formatted_compare_price: string | null
  is_available: boolean
  created_at: string
  updated_at: string
}

export interface ProductCreateData {
  name: string
  slug?: string
  description?: string | null
  price: number
  compare_price?: number | null
  stock: number
  images?: string[]
  category?: string | null
  sku?: string | null
  is_active?: boolean
  is_featured?: boolean
  is_digital?: boolean
  digital_url?: string | null
  weight_grams?: number | null
  dimensions?: ProductDimensions | null
  tags?: string[]
  variations?: ProductVariation[]
  meta_title?: string | null
  meta_description?: string | null
}

export interface ProductUpdateData {
  name?: string
  slug?: string
  description?: string | null
  price?: number
  compare_price?: number | null
  stock?: number
  images?: string[]
  category?: string | null
  sku?: string | null
  is_active?: boolean
  is_featured?: boolean
  is_digital?: boolean
  digital_url?: string | null
  weight_grams?: number | null
  dimensions?: ProductDimensions | null
  tags?: string[]
  variations?: ProductVariation[]
  meta_title?: string | null
  meta_description?: string | null
}

export interface ProductListResponse {
  products: Product[]
  total: number
  page: number
  per_page: number
  total_pages: number
}

// ===== Types pour les commandes =====
export interface OrderItem {
  product_name: string
  quantity: number
  unit_price: number
  total_price: number
}

// export interface Order {
//   id: string
//   order_number: string
//   customer_name: string
//   customer_email: string
//   total_amount: number
//   status: string
//   items: OrderItem[]
//   created_at: string
  
   
export interface Order {
  id: string
  order_number: string
  customer_name: string
  customer_email: string
  customer_phone?: string
  total_amount: number
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  items: Array<{
    product_name: string
    quantity: number
    product_price: number
    total_price: number
  }>
  created_at: string
  payment_status: string
  payment_method: string
  tracking_number?: string 
  shop_id?: string
}



export interface OrderStats {
  total_orders: number
  total_revenue: number
  pending_count: number
  processing_count: number
  shipped_count: number
  delivered_count: number
}

// ===== Types pour les produits PUBLICS =====
export interface PublicProduct {
  id: string
  name: string
  slug: string
  description: string | null
  price: number
  compare_price: number | null
  stock: number
  images: string[]
  category: string | null
  sku: string | null
  shop_id: string
  shop_slug: string  // ← NOUVEAU
  shop_name: string  // ← NOUVEAU
  is_digital: boolean
  digital_url: string | null
  weight_grams: number | null
  dimensions: ProductDimensions | null
  tags: string[]
  variations: ProductVariation[]
  meta_title: string | null
  meta_description: string | null
  view_count: number
  has_discount: boolean
  discount_percentage: number
  formatted_price: string
  formatted_compare_price: string | null
  is_available: boolean
  is_featured: boolean
  created_at: string
  updated_at: string
  
}

interface Api {
  // ... autres méthodes existantes
  
  // NOUVEAU: Mettre à jour une boutique
  updateShop(shopSlug: string, data: any): Promise<ApiResponse<Shop>>
  
  // NOUVEAU: Upload d'image pour logo boutique
  uploadShopLogo(shopSlug: string, file: File): Promise<ApiResponse<{ url: string }>>
}

class ApiClient {
  async getOrderDetails(shopSlug: string, orderId: string): Promise<ApiResponse<Order>> {
    return this.request<Order>(`/shops/${shopSlug}/orders/${orderId}`, {}, false)
  }
  async getPublicCategories(): Promise<ApiResponse<ProductCategory[]>> {
    return this.request<ProductCategory[]>(`/public/categories/products`, {}, false)
  }
  private token: string | null = null
  private refreshToken: string | null = null

  constructor() {
    this.loadToken()
  }

  // ===== Gestion du token =====
  private loadToken(): void {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('shoptonik_token')
      this.refreshToken = localStorage.getItem('shoptonik_refresh_token')
      console.log('🔑 [API] Token chargé:', this.token ? 'OUI' : 'NON')
    }
  }

  private getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('shoptonik_token')
    }
    return this.token
  }

  setToken(token: string) {
    this.token = token
    if (typeof window !== 'undefined') {
      localStorage.setItem('shoptonik_token', token)
    }
  }

  setRefreshToken(refreshToken: string) {
    this.refreshToken = refreshToken
    if (typeof window !== 'undefined') {
      localStorage.setItem('shoptonik_refresh_token', refreshToken)
    }
  }

  clearToken() {
    this.token = null
    this.refreshToken = null
    if (typeof window !== 'undefined') {
      localStorage.removeItem('shoptonik_token')
      localStorage.removeItem('shoptonik_refresh_token')
      localStorage.removeItem('shoptonik_user')
    }
  }

  private async refreshAccessToken(): Promise<string | null> {
    if (!this.refreshToken) {
      console.log('❌ Pas de refresh token')
      return null
    }

    try {
      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${this.refreshToken}`
        },
      })

      if (!response.ok) {
        this.clearToken()
        return null
      }

      const data = await response.json()
      const newToken = data.access_token
      this.setToken(newToken)
      return newToken
    } catch (error) {
      console.error('Erreur refresh token:', error)
      this.clearToken()
      return null
    }
  }

 

  private async request<T>(
  endpoint: string, 
  options: RequestInit = {},
  retryOn401: boolean = true
): Promise<ApiResponse<T>> {
  console.log(`📤 ${options.method || 'GET'} ${endpoint}`)

  const headers = new Headers(options.headers)
  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  const token = this.getToken()
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include',
    })

    console.log(`📥 ${response.status} ${endpoint}`)
    // ✅ SOLUTION: Gérer le cas 204 No Content
    if (response.status === 204) {
      return { 
        data: undefined, 
        status: 'success', 
        statusCode: 204 
      }
    }

    // Gérer 401 - token expiré
    if (response.status === 401 && token && retryOn401) { // <-- Retirez "retryOnAuth", gardez "retryOn401"
      console.log('🔄 Token expiré, tentative de rafraîchissement...')
      const newToken = await this.refreshAccessToken()
      if (newToken) {
        // Réessayer avec le nouveau token
        headers.set('Authorization', `Bearer ${newToken}`)
        const retryResponse = await fetch(`${API_URL}${endpoint}`, {
          ...options,
          headers,
          credentials: 'include',
        })
        
        if (retryResponse.ok) {
          // ✅ Gérer aussi 204 pour le retry
          if (retryResponse.status === 204) {
            return { data: undefined, status: 'success', statusCode: 204 }
          }
          const data = await retryResponse.json()
          return { 
            data: data as T, 
            status: 'success', // <-- CHANGÉ : 'success' au lieu du code
            statusCode: retryResponse.status // <-- AJOUTÉ : code HTTP séparé
          }
        }
      }
      this.clearToken()
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login'
      }
      return { 
        error: 'Session expirée', 
        status: 'error', // <-- CHANGÉ : 'error' au lieu de 401
        statusCode: 401 // <-- AJOUTÉ : code HTTP séparé
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return {
        error: errorData.detail || `Erreur ${response.status}`,
        status: 'error', // <-- CHANGÉ : 'error' au lieu du code
        statusCode: response.status // <-- AJOUTÉ : code HTTP séparé
      }
    }

    const data = await response.json()
    return { 
      data: data as T, 
      status: 'success', // <-- CHANGÉ : 'success' au lieu du code
      statusCode: response.status // <-- AJOUTÉ : code HTTP séparé
    }
  } catch (error: any) {
    console.error('❌ Erreur API:', error)
    return { 
      error: error.message || 'Erreur de connexion', 
      status: 'error', // <-- CHANGÉ : 'error' au lieu de 500
      statusCode: 500 // <-- AJOUTÉ : code HTTP séparé
    }
  }
}


  // ===== Authentification =====
  async login(email: string, password: string) {
    console.log(`🔐 Login: ${email}`)
    
    const formData = new URLSearchParams()
    formData.append('username', email)
    formData.append('password', password)

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data?.detail || 'Login failed')
      }
      
      this.setToken(data.access_token)
      if (data.refresh_token) {
        this.setRefreshToken(data.refresh_token)
      }
      
      return data
    } catch (error: any) {
      console.error('Login error:', error)
      throw error
    }
  }

  async register(userData: {
    email: string
    username: string
    password: string
    full_name?: string
  }) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    })
  }

  async getCurrentUser() {
    return this.request<{
      id: string
      email: string
      username: string
      full_name: string | null
      is_seller: boolean
      is_active: boolean
      total_shops: number
      created_at: string
    }>('/auth/me')
  }

  // ===== Boutiques =====
  async createShop(shopData: { name: string; description?: string; category?: string }) {
    return this.request<Shop>('/shops/', {
      method: 'POST',
      body: JSON.stringify(shopData),
    })
  }

  async getMyShops() {
    return this.request<Shop[]>('/shops/')
  }

  async getShopBySlug(slug: string) {
    return this.request<Shop>(`/shops/${slug}`)
  }

  async getShopStats(shopSlug: string) {
    return this.request<{
      shop_id: string
      shop_name: string
      stats: {
        total_products: number
        total_orders: number
        total_revenue: number
        total_visitors: number
        conversion_rate: number
      }
      period: string
      updated_at: string
    }>(`/shops/${shopSlug}/stats`)
  }

  // ===== PRODUITS =====
  async createProduct(shopSlug: string, productData: ProductCreateData) {
    return this.request<Product>(`/shops/${shopSlug}/products`, {
      method: 'POST',
      body: JSON.stringify(productData),
    })
  }

  async getShopProducts(
    shopSlug: string,
    options: {
      page?: number
      per_page?: number
      category?: string
      is_active?: boolean
      is_featured?: boolean
      search?: string
      min_price?: number
      max_price?: number
      in_stock?: boolean 
    } = {}
  ) {
    const queryParams = new URLSearchParams()
    
    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value))
      }
    })
    
    const queryString = queryParams.toString()
    const url = `/shops/${shopSlug}/products${queryString ? `?${queryString}` : ''}`
    
    return this.request<Product[]>(url)
  }

  async getProductById(shopSlug: string, productId: string) {
    return this.request<Product>(`/shops/${shopSlug}/products/${productId}`)
  }

  async getProductBySlug(shopSlug: string, productSlug: string) {
    return this.request<Product>(`/shops/${shopSlug}/products/by-slug/${productSlug}`)
  }

  async updateProduct(
    shopSlug: string,
    productId: string,
    productData: ProductUpdateData
  ) {
    return this.request<Product>(`/shops/${shopSlug}/products/${productId}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    })
  }

  async updateProductStock(
    shopSlug: string,
    productId: string,
    quantity: number
  ) {
    return this.request<Product>(`/shops/${shopSlug}/products/${productId}/stock`, {
      method: 'PATCH',
      body: JSON.stringify({ quantity }),
    })
  }

  async deleteProduct(shopSlug: string, productId: string) {
    return this.request(`/shops/${shopSlug}/products/${productId}`, {
      method: 'DELETE',
    })
  }

  async toggleProductActive(shopSlug: string, productId: string) {
    return this.request<Product>(`/shops/${shopSlug}/products/${productId}/toggle-active`, {
      method: 'POST',
    })
  }

  async toggleProductFeatured(shopSlug: string, productId: string) {
    return this.request<Product>(`/shops/${shopSlug}/products/${productId}/toggle-featured`, {
      method: 'POST',
    })
  }

  async getProductStats(shopSlug: string, productId: string) {
    return this.request<{
      view_count: number
      stock_percentage: number
      has_discount: boolean
      discount_percentage: number
      is_available: boolean
      created_days_ago: number
      last_updated_days_ago: number
    }>(`/shops/${shopSlug}/products/${productId}/stats`)
  }

  

  // NOUVEAU (CORRECT)
async getPublicShop(slug: string) {
  return this.request<Shop>(`/shops/public/shops/${slug}`, {}, false)
}
// Dans api.ts, ajoutez :
async getPublicShopById(shopId: string) {
  return this.request<Shop>(`/public/shops/id/${shopId}`, {}, false)
}


// NOUVEAU (CORRECT pour les produits d'une boutique)
// async getPublicShopProducts(
//   shopSlug: string,
//   options: any = {}
// ): Promise<ApiResponse<s[]>> {
//   const queryParams = new URLSearchParams()
  
//   Object.entries(options).forEach(([key, value]) => {
//     if (value !== undefined && value !== null) {
//       queryParams.append(key, String(value))
//     }
//   })
  
//   const queryString = queryParams.toString()
//   const url = `/shops/public/shops/${shopSlug}/products${queryString ? `?${queryString}` : ''}`
  
//   console.log("📤 [API] GET Public Shop Products:", url) // Pour debug
//   return this.request<Product[]>(url, {}, false)
// }


  // ===== Dashboard =====
  async getDashboardStats(shopSlug: string) {
    return this.getShopStats(shopSlug)
  }

  // ===== Commandes =====
  async getShopOrders(shopSlug: string) {
    return this.request<Order[]>(`/shops/${shopSlug}/orders`)
  }

  async getOrderStats(shopSlug: string) {
    return this.request<OrderStats>(`/shops/${shopSlug}/orders/stats`)
  }

  async updateOrderStatus(shopSlug: string, orderId: string, status: string) {
    return this.request(`/shops/${shopSlug}/orders/${orderId}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    })
  }

  

  // ===== Panier =====
  async getCart(slug: string) {
    return this.request<any>(`/cart/${slug}`, {}, false)
  }

  async addToCart(slug: string, productId: string, quantity: number = 1) {
    return this.request<any>(`/cart/${slug}/items`, {
      method: 'POST',
      body: JSON.stringify({ product_id: productId, quantity })
    })
  }

  async updateCartItem(itemId: string, quantity: number) {
    return this.request(`/cart/items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity })
    })
  }

  async removeCartItem(itemId: string) {
    return this.request(`/cart/items/${itemId}`, {
      method: 'DELETE'
    })
  }

  async clearCart(slug: string) {
    return this.request(`/cart/${slug}`, {
      method: 'DELETE'
    })
  }

  // ===== Boutiques publiques =====
  // async getPublicShop(slug: string) {
  //   return this.request<Shop>(`/public/shops/${slug}`, {}, false)
  // }

  // async getPublicShops(limit: number = 6) {
  //   return this.request<Shop[]>(`/public/shops?limit=${limit}`, {}, false)
  // }
  async getPublicShops(limit: number = 6) {
    return this.request<Shop[]>(`/shops/public/shops?limit=${limit}`, {}, false)
  }

  // ===== Commandes clients =====
  async createOrder(orderData: any) {
    return this.request<Order>('/orders/', {
      method: 'POST',
      body: JSON.stringify(orderData),
    })
  }

  async getMyOrders() {
    return this.request<Order[]>('/orders/my-orders')
  }

  async getOrderById(orderId: string) {
    return this.request<Order>(`/orders/${orderId}`)
  }

  async trackOrder(orderNumber: string, email: string) {
    return this.request<Order>(
      `/orders/track/${orderNumber}?email=${encodeURIComponent(email)}`,
      {},
      false
    )
  }

  // ===== Utilitaires =====
  isAuthenticated(): boolean {
    return !!this.getToken()
  }

  // ===== TEST =====
  async testAuth() {
    return this.request('/auth/me')
  }

  // Ajoutez ces méthodes :

async uploadImage(file: File): Promise<ApiResponse<{ url: string }>> {
  const formData = new FormData()
  formData.append('file', file)
  
  return this.request<{ url: string }>('/upload/single', {
    method: 'POST',
    body: formData,
  })
}

async uploadMultipleImages(files: File[]): Promise<ApiResponse<{ urls: string[] }>> {
  const formData = new FormData()
  files.forEach(file => {
    formData.append('files', file)
  })
  
  return this.request<{ urls: string[] }>('/upload/multiple', {
    method: 'POST',
    body: formData,
  })
}

async uploadProductImages(shopId: string, files: File[]): Promise<ApiResponse<{ urls: string[] }>> {
  const formData = new FormData()
  files.forEach(file => {
    formData.append('files', file)
  })
  
  return this.request<{ urls: string[] }>(`/upload/products/${shopId}`, {
    method: 'POST',
    body: formData,
  })
}

// ===== PRODUITS PUBLICS (sans auth) =====
// (Vous avez déjà certaines méthodes, ajoutez celles-ci)

async getPublicProductById(productId: string): Promise<ApiResponse<PublicProduct>> {
  return this.request<PublicProduct>(
    `/public/products/${productId}`,
    {},
    false // Pas de retry sur 401 pour les endpoints publics
  )
}

async getPublicProductByShopAndSlug(shopSlug: string, productSlug: string): Promise<ApiResponse<PublicProduct>> {
  return this.request<PublicProduct>(
    `/public/shops/${shopSlug}/products/${productSlug}`,
    {},
    false // Pas de retry sur 401 pour public
  )
}

async getPublicShopProducts(
  shopSlug: string,
  options: {
    page?: number
    per_page?: number
    category?: string
    featured?: boolean
    is_active?: boolean
    digital?: boolean
    min_price?: number
    max_price?: number
    in_stock?: boolean
    tag?: string
    search?: string
    sort_by?: 'created_at' | 'name' | 'price' | 'view_count'
    sort_order?: 'asc' | 'desc'
  } = {}
): Promise<ApiResponse<PublicProduct[]>> {
  const queryParams = new URLSearchParams()
  
  Object.entries(options).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      queryParams.append(key, String(value))
    }
  })
  
  const queryString = queryParams.toString()
  const url = `/public/shops/${shopSlug}/products${queryString ? `?${queryString}` : ''}`
  
  return this.request<PublicProduct[]>(url, {}, false)
}

// Alias pour la page de détail (facilite l'utilisation)
async getProductDetail(productId: string): Promise<ApiResponse<PublicProduct>> {
  return this.getPublicProductById(productId)
}

 async updateShop(shopSlug: string, data: any) {
    // Utilisez l'endpoint PUT de votre backend
    return this.request<Shop>(`/shops/${shopSlug}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }
  
  async uploadShopLogo(shopSlug: string, file: File) {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', 'shop_logo')
    
    return this.request<{ url: string }>(`/shops/${shopSlug}/upload-logo`, {
      method: 'POST',
      body: formData,
    })
  }

  // Dans apps/web/app/lib/api.ts, ajoutez ces méthodes à la classe ApiClient:

async initiateCheckout(shopSlug: string) {
  console.log(`🛒 [API] Initiate checkout pour: ${shopSlug}`);
  return this.request<any>(`/checkout/initiate?shop_slug=${encodeURIComponent(shopSlug)}`, {
    method: 'POST',
  }, false);
}

// ===== PAIEMENT =====
async processCheckout(checkoutData: any) {
  console.log(`💳 [API] Process checkout pour: ${checkoutData.shop_slug}`);
  return this.request<any>('/checkout/process', {
    method: 'POST',
    body: JSON.stringify(checkoutData),
  });
}


async mergeGuestCart(sessionId: string) {
  console.log(`🔄 [API] Fusion panier session: ${sessionId}`);
  return this.request<{message: string, merged_items: number}>('/checkout/merge-cart', {
    method: 'POST',
    body: JSON.stringify({ session_id: sessionId }),
  });
}

  

// Ces méthodes existent déjà, elles sont correctes
async getProfile() {
  return this.request<UserProfileResponse>('/auth/profile')
}

async updateProfile(data: UserUpdate) {
  return this.request<UserProfileResponse>('/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(data)
  })
}

async changePassword(currentPassword: string, newPassword: string) {
  return this.request('/auth/profile/change-password', {
    method: 'POST',
    body: JSON.stringify({
      current_password: currentPassword,
      new_password: newPassword
    })
  })
}


async uploadAvatar(file: File): Promise<ApiResponse<{ url: string }>> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('type', 'avatar')
  
   return this.request<{ url: string }>('/upload/avatar', {
    method: 'POST',
    body: formData,
  })
}

// Dans la classe ApiClient, avec les autres méthodes

async getPendingSellerRequests() {
  return this.request<SellerRequest[]>('/seller/admin/pending', {}, false)
}

async approveSellerRequest(userId: string) {
  return this.request(`/seller/admin/approve/${userId}`, {
    method: 'POST'
  }, false)
}

async rejectSellerRequest(userId: string) {
  return this.request(`/seller/admin/reject/${userId}`, {
    method: 'POST'
  }, false)
}

// Dans api.ts, avec les autres méthodes seller
// Dans api.ts, avec les autres méthodes seller
async getSellerRequestStatus(): Promise<ApiResponse<SellerRequestStatusResponse>> {
  return this.request<SellerRequestStatusResponse>('/seller/request/status', {}, false)
}

async submitSellerRequest(data: {
  company_name: string
  vat_number: string
  address: string
  phone: string
}) {
  return this.request('/seller/request', {
    method: 'POST',
    body: JSON.stringify(data)
  }, false)
}

async getPlatformStats() {
  return this.request('/public/stats', {}, false)  // Route publique
}
// Dans la classe ApiClient

async getAdminStats() {
  return this.request<{
    total_users: number
    total_sellers: number
    total_shops: number
    total_products: number
    total_orders: number
    total_revenue: number
    pending_requests: number
  }>('/admin/stats', {}, false)
}

// 👇 AJOUTEZ ICI LES MÉTHODES DE PAYOUTS
async getPendingWithdrawals() {
  return this.request<any[]>('/admin/payouts/pending', {}, false)
}

async approveWithdrawal(withdrawalId: string) {
  return this.request(`/admin/payouts/${withdrawalId}/approve`, {
    method: 'POST'
  }, false)
}

async rejectWithdrawal(withdrawalId: string, reason: string) {
  const queryParams = new URLSearchParams({ reason })
  return this.request(`/admin/payouts/${withdrawalId}/reject?${queryParams}`, {
    method: 'POST'
  }, false)
}

async getWithdrawalsHistory(params?: {
  status?: 'pending' | 'completed' | 'rejected'
  page?: number
  limit?: number
}) {
  const queryParams = new URLSearchParams()
  if (params?.status) queryParams.append('status', params.status)
  if (params?.page) queryParams.append('page', params.page.toString())
  if (params?.limit) queryParams.append('limit', params.limit.toString())
  
  const queryString = queryParams.toString()
  const url = `/admin/payouts${queryString ? `?${queryString}` : ''}`
  
  return this.request<any[]>(url, {}, false)
}


// async getUsers(params?: { role?: string; search?: string; page?: number }) {
//   const queryParams = new URLSearchParams()
//   if (params?.role) queryParams.append('role', params.role)
//   if (params?.search) queryParams.append('search', params.search)
//   if (params?.page) queryParams.append('page', params.page.toString())
  
//   return this.request<any[]>(`/admin/users?${queryParams}`, {}, false)
// }




// ===== ADMIN - UTILISATEURS =====
async getUsers(params?: { 
  role?: 'all' | 'sellers' | 'buyers' | 'admins'
  search?: string
  page?: number
  limit?: number
}) {
  const queryParams = new URLSearchParams()
  if (params?.role) queryParams.append('role', params.role)
  if (params?.search) queryParams.append('search', params.search)
  if (params?.page) queryParams.append('page', params.page.toString())
  if (params?.limit) queryParams.append('limit', params.limit.toString())
  
  const queryString = queryParams.toString()
  const url = `/admin/users${queryString ? `?${queryString}` : ''}`
  
  return this.request<any[]>(url, {}, false)
}

async getUserById(userId: string) {
  return this.request<any>(`/admin/users/${userId}`, {}, false)
}

async toggleUserStatus(userId: string) {
  return this.request(`/admin/users/${userId}/toggle-status`, {
    method: 'POST'
  }, false)
}

async toggleUserSellerStatus(userId: string) {
  return this.request(`/admin/users/${userId}/toggle-seller`, {
    method: 'POST'
  }, false)
}

async toggleUserAdminStatus(userId: string) {
  return this.request(`/admin/users/${userId}/toggle-admin`, {
    method: 'POST'
  }, false)
}

async deleteUser(userId: string) {
  return this.request(`/admin/users/${userId}`, {
    method: 'DELETE'
  }, false)
}

// ===== ADMIN - BOUTIQUES =====
async getShops(params?: {
  status?: 'all' | 'active' | 'inactive'
  search?: string
  page?: number
  limit?: number
}) {
  const queryParams = new URLSearchParams()
  if (params?.status) queryParams.append('status', params.status)
  if (params?.search) queryParams.append('search', params.search)
  if (params?.page) queryParams.append('page', params.page.toString())
  if (params?.limit) queryParams.append('limit', params.limit.toString())
  
  const queryString = queryParams.toString()
  const url = `/admin/shops${queryString ? `?${queryString}` : ''}`
  
  return this.request<any[]>(url, {}, false)
}

async getShopById(shopId: string) {
  return this.request<any>(`/admin/shops/${shopId}`, {}, false)
}

async toggleShopStatus(shopId: string) {
  return this.request(`/admin/shops/${shopId}/toggle-status`, {
    method: 'POST'
  }, false)
}

async toggleShopVerification(shopId: string) {
  return this.request(`/admin/shops/${shopId}/toggle-verified`, {
    method: 'POST'
  }, false)
}

async deleteShop(shopId: string) {
  return this.request(`/admin/shops/${shopId}`, {
    method: 'DELETE'
  }, false)
}

// ===== ADMIN - PRODUITS =====
async getProducts(params?: {
  status?: 'all' | 'active' | 'inactive'
  search?: string
  shopId?: string
  page?: number
  limit?: number
}) {
  const queryParams = new URLSearchParams()
  if (params?.status) queryParams.append('status', params.status)
  if (params?.search) queryParams.append('search', params.search)
  if (params?.shopId) queryParams.append('shop_id', params.shopId)
  if (params?.page) queryParams.append('page', params.page.toString())
  if (params?.limit) queryParams.append('limit', params.limit.toString())
  
  const queryString = queryParams.toString()
  const url = `/admin/products${queryString ? `?${queryString}` : ''}`
  
  return this.request<any[]>(url, {}, false)
}

// async getProductById(productId: string) {
//   return this.request<any>(`/admin/products/${productId}`, {}, false)
// }
async getAdminProductById(productId: string) {
  console.log(`🔍 API getAdminProductById: ${productId}`)
  return this.request<any>(`/admin/products/${productId}`, {}, false)
}

async toggleProductStatus(productId: string) {
  return this.request(`/admin/products/${productId}/toggle-status`, {
    method: 'POST'
  }, false)
}

async toggleAdminProductFeatured(productId: string) {
  return this.request(`/admin/products/${productId}/toggle-featured`, {
    method: 'POST'
  }, false)
}

async adminDeleteProduct(productId: string) {
  return this.request(`/admin/products/${productId}`, {
    method: 'DELETE'
  }, false)
}

// Dans la classe ApiClient, avec les autres méthodes admin

async deleteProductById(productId: string) {
  return this.request(`/admin/products/${productId}`, {
    method: 'DELETE'
  }, false)
}
 

// ===== PORTEFEUILLE VENDEUR =====
async getSellerWallet() {
  return this.request<any>('/seller/wallet', {}, false)
}

async getSellerTransactions(params?: { period?: string; page?: number }) {
  const queryString = new URLSearchParams(params as any).toString()
  return this.request<any>(`/seller/wallet/transactions${queryString ? `?${queryString}` : ''}`, {}, false)
}

async requestWithdrawal(data: { amount: number; method: string; account_details?: any }) {
  return this.request<any>('/seller/wallet/withdrawals/request', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

async getWithdrawalHistory() {
  return this.request<any[]>('/seller/wallet/withdrawals', {}, false)
}
// async getSellerTransactions(params?: { period?: string; page?: number }) {
//   const queryParams = new URLSearchParams()
//   if (params?.period) queryParams.append('period', params.period)
//   if (params?.page) queryParams.append('page', params.page.toString())
  
//   const queryString = queryParams.toString()
//   return this.request<any>(`/seller/transactions${queryString ? `?${queryString}` : ''}`, {}, false)
// }

// async requestWithdrawal(data: { amount: number; method: string; account_details?: any }) {
//   return this.request<any>('/seller/withdrawals/request', {
//     method: 'POST',
//     body: JSON.stringify(data),
//   })
// }

// async getWithdrawalHistory() {
//   return this.request<any[]>('/seller/withdrawals', {}, false)
// }


// Dans apps/web/app/lib/api.ts

// Remplacez la méthode searchProducts existante par celle-ci
async searchProducts(params: {
  q?: string
  category?: string
  min_price?: number
  max_price?: number
  in_stock?: boolean
  tags?: string
  sort_by?: string
  page?: number
  limit?: number
}) {
  try {
    const queryParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, String(value))
      }
    })
    
    const url = `/public/search/products?${queryParams.toString()}`
    console.log('🔍 API searchProducts:', `${API_URL}${url}`)
    
    // Utiliser fetch directement pour éviter les problèmes avec this.request
    const response = await fetch(`${API_URL}${url}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const data = await response.json()
    return {
      status: 'success' as const,
      data: data,
      statusCode: response.status
    }
  } catch (error: any) {
    console.error('❌ Erreur searchProducts:', error)
    return {
      status: 'error' as const,
      error: error.message || 'Erreur de recherche',
      statusCode: 500
    }
  }
}

// Ajoutez aussi cette méthode pour la recherche instantanée
async instantSearch(q: string, limit: number = 6) {
  try {
    const url = `/public/search/instant?q=${encodeURIComponent(q)}&limit=${limit}`
    console.log('⚡ API instantSearch:', `${API_URL}${url}`)
    
    const response = await fetch(`${API_URL}${url}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const data = await response.json()
    return {
      status: 'success' as const,
      data: data,
      statusCode: response.status
    }
  } catch (error: any) {
    console.error('❌ Erreur instantSearch:', error)
    return {
      status: 'error' as const,
      error: error.message || 'Erreur de recherche',
      statusCode: 500
    }
  }
}

async getSearchSuggestions(q: string, category?: string, limit: number = 5) {
  const params = new URLSearchParams({ q, limit: String(limit) })
  if (category) params.append('category', category)
  
  return this.request<any>(`/public/search/suggestions?${params.toString()}`, {}, false)
}


// Dans la classe ApiClient, ajoutez :

async getProductsByTag(
  tag: string,
  options: {
    sort_by?: string
    page?: number
    limit?: number
  } = {}
): Promise<ApiResponse<any>> {
  try {
    const queryParams = new URLSearchParams()
    
    if (options.sort_by) queryParams.append('sort_by', options.sort_by)
    if (options.page) queryParams.append('page', options.page.toString())
    if (options.limit) queryParams.append('limit', options.limit.toString())
    
    const queryString = queryParams.toString()
    const url = `/public/products/tag/${encodeURIComponent(tag)}${queryString ? `?${queryString}` : ''}`
    
    console.log(`📤 [API] GET Products by tag: ${url}`)
    
    const response = await fetch(`${API_URL}${url}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const data = await response.json()
    return {
      status: 'success' as const,
      data: data,
      statusCode: response.status
    }
  } catch (error: any) {
    console.error('❌ Erreur getProductsByTag:', error)
    return {
      status: 'error' as const,
      error: error.message || 'Erreur de recherche par tag',
      statusCode: 500
    }
  }
}


// Dans apps/web/app/lib/api.ts (classe ApiClient)

async getAuditLogs(params?: URLSearchParams): Promise<ApiResponse<any>> {
  const url = `/admin/audit${params ? `?${params.toString()}` : ''}`
  return this.request<any>(url, {}, false)
}

async getAuditStats(): Promise<ApiResponse<any>> {
  return this.request<any>('/admin/audit/stats', {}, false)
}


async confirmNatCashPayment(data: { transaction_id: string, order_id: string, phone: string }) {
  return this.request('/checkout/confirm/natcash', {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

}

export const api = new ApiClient()
