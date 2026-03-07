const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

export interface ApiResponse<T> {
  data?: T
  error?: string
  status: number
}

// ===== Types réutilisables =====
export interface Shop {
  id: string
  name: string
  slug: string
  description: string | null
  category: string | null
  owner_id: string
  total_products?: number
  total_orders?: number
  total_revenue?: number
  total_visitors?: number
  created_at: string
  updated_at?: string
}

export interface Product {
  id: string
  name: string
  description: string | null
  price: number
  stock: number
  images: string[]
  category: string | null
  sku: string | null
  shop_id: string
  created_at: string
  updated_at: string
}

// ===== Types pour les commandes =====
export interface OrderItem {
  product_name: string
  quantity: number
  unit_price: number
  total_price: number
}

export interface Order {
  id: string
  order_number: string
  customer_name: string
  customer_email: string
  total_amount: number
  status: string
  items: OrderItem[]
  created_at: string
}

export interface OrderStats {
  total_orders: number
  total_revenue: number
  pending_count: number
  processing_count: number
  shipped_count: number
  delivered_count: number
}

class ApiClient {
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
      console.log('🔑 [API] Token chargé au démarrage:', this.token ? 'OUI' : 'NON')
    }
  }

  private getToken(): string | null {
    // TOUJOURS lire depuis localStorage pour être sûr
    if (typeof window !== 'undefined') {
      const freshToken = localStorage.getItem('shoptonik_token')
      if (freshToken !== this.token) {
        console.log('🔄 [API] Token mis à jour depuis localStorage')
        this.token = freshToken
      }
      return freshToken
    }
    return this.token
  }

  setToken(token: string) {
    this.token = token
    if (typeof window !== 'undefined') {
      localStorage.setItem('shoptonik_token', token)
      console.log('💾 [API] Token sauvegardé dans localStorage')
    }
  }

   // AJOUTER CETTE MÉTHODE APRÈS setToken
  setRefreshToken(refreshToken: string) {
    this.refreshToken = refreshToken
    if (typeof window !== 'undefined') {
      localStorage.setItem('shoptonik_refresh_token', refreshToken)
      console.log('💾 [API] Refresh token sauvegardé')
    }
  }

    clearToken() {
    this.token = null
    this.refreshToken = null  // <-- AJOUTER CETTE LIGNE
    if (typeof window !== 'undefined') {
      localStorage.removeItem('shoptonik_token')
      localStorage.removeItem('shoptonik_refresh_token')  // <-- AJOUTER
      localStorage.removeItem('shoptonik_user')
      console.log('🧹 [API] Token nettoyé')
    }
  }

    // AJOUTER CETTE MÉTHODE COMPLÈTE
  private async refreshAccessToken(): Promise<string | null> {
    if (!this.refreshToken) {
      console.log('❌ [API] Pas de refresh token disponible')
      return null
    }

    console.log('🔄 [API] Tentative de rafraîchissement du token...')

    try {
      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${this.refreshToken}`
        },
      })

      const data = await response.json()
      
      if (!response.ok) {
        console.error('❌ [API] Échec du rafraîchissement:', data)
        this.clearToken()
        return null
      }

      const newToken = data.access_token
      this.setToken(newToken)
      console.log('✅ [API] Token rafraîchi avec succès')
      
      return newToken
    } catch (error: any) {
      console.error('❌ [API] Erreur lors du rafraîchissement:', error)
      this.clearToken()
      return null
    }
  }

  // ===== Méthode utilitaire pour debug =====
  getCurrentToken(): string | null {
    return this.token
  }

  // ===== Requête générique =====
private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  console.log(`🌐 [API] Requête vers: ${endpoint}`)

  // ===== Définir les endpoints publics COMPLETS =====
  const PUBLIC_ENDPOINTS = {
    GET: [
      '/public',
      '/public/shops',
      '/public/shops/', // Tous les GET sous /public
      '/orders/track',  // Suivi de commande
      '/auth/refresh',  // Rafraîchissement token
    ],
    POST: [
      '/auth/login',
      '/auth/register',
      '/auth/refresh',  // Permettre POST pour refresh
    ]
  }

  // Vérifier si l'endpoint est public
  const method = options.method || 'GET'
  const isPublicEndpoint = PUBLIC_ENDPOINTS[method as keyof typeof PUBLIC_ENDPOINTS]?.some(path => 
    endpoint.startsWith(path)
  )

  // Règles spéciales pour le panier :
  const isCartEndpoint = endpoint.startsWith('/cart/')
  const isGetCart = method === 'GET' && isCartEndpoint
  const isAddToCart = method === 'POST' && isCartEndpoint
  
  // Panier : GET est public, POST nécessite auth (ou cookie de session)
  if (isCartEndpoint) {
    if (isGetCart) {
      // GET /cart/:slug - PUBLIC (mais utilise le cookie de session)
      console.log(`🛒 [API] Panier GET - Publique (avec session)`)
    } else {
      // POST/PUT/DELETE cart - besoin d'authentification OU de session
      console.log(`🛒 [API] Panier ${method} - Nécessite session`)
    }
  }

  // ===== Headers =====
  const headers = new Headers(options.headers)
  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  // Récupérer le token JWT (pour auth user)
  const token = this.getToken()
  
  // Récupérer le cookie de session pour les guests
  const sessionCookie = document.cookie
    .split('; ')
    .find(row => row.startsWith('cart_session_id='))
    ?.split('=')[1]

  console.log(`🔐 [API] JWT Token:`, token ? `OUI` : 'NON')
  console.log(`🍪 [API] Session cookie:`, sessionCookie ? 'OUI' : 'NON')

  // ===== Logique d'authentification =====
  if (token && !isPublicEndpoint) {
    // User authentifié → envoyer Bearer token
    headers.set('Authorization', `Bearer ${token}`)
    console.log(`✅ [API] Authorization: Bearer token`)
  } else if (sessionCookie && isCartEndpoint && !isPublicEndpoint) {
    // Guest avec session → envoyer cookie si c'est une action sur le panier
    headers.set('X-Session-ID', sessionCookie)
    console.log(`✅ [API] Session ID envoyé pour panier`)
  }

  // Pour les endpoints publics sans auth
  if (isPublicEndpoint) {
    console.log(`🚫 [API] Endpoint public → pas d'Authorization nécessaire`)
  }

  try {
    console.log(`📤 [API] Envoi ${method}: ${API_URL}${endpoint}`)
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include', // IMPORTANT pour les cookies
    })

    console.log(`📥 [API] Réponse ${response.status} de ${endpoint}`)
    
    // Gérer les réponses non-JSON (comme les réponses vides)
    let data = null
    const contentType = response.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
      data = await response.json()
    }

    if (!response.ok) {
      console.log(`❌ [API] Erreur ${response.status}:`, data)

      // Gestion 401 : rafraîchir le token si c'est un JWT expiré
      if (response.status === 401 && token && !isPublicEndpoint) {
        console.warn('⚠️ [API] Token expiré → tentative refresh')
        const newToken = await this.refreshAccessToken()
        if (newToken) {
          headers.set('Authorization', `Bearer ${newToken}`)
          const retryResponse = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers,
            credentials: 'include',
          })
          
          if (retryResponse.ok) {
            const retryData = await retryResponse.json().catch(() => null)
            return { data: retryData as T, status: retryResponse.status }
          }
        }
        this.clearToken()
        // Rediriger vers login si nécessaire
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/login'
        }
      }

      return {
        error: data?.detail || data?.message || `Erreur ${response.status}: ${response.statusText}`,
        status: response.status,
      }
    }

    console.log(`✅ [API] Succès pour ${endpoint}`)
    return { data: data as T, status: response.status }
  } catch (error: any) {
    console.error('❌ [API] Erreur de connexion:', error)
    return { error: error.message || 'Erreur de connexion au serveur', status: 500 }
  }
}




  // ===== Authentification =====
   async login(email: string, password: string) {
    console.log(`🔐 [API] Tentative login: ${email}`)
    
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
        console.error('❌ [API] Login échoué:', data)
        throw new Error(data?.detail || 'Login failed')
      }
      
      console.log('✅ [API] Login réussi, token reçu')
      this.setToken(data.access_token)
      
      // ⭐⭐ AJOUTER CETTE LIGNE POUR SAUVEGARDER LE REFRESH TOKEN ⭐⭐
      if (data.refresh_token) {
        this.setRefreshToken(data.refresh_token)
      }
      
      return data
    } catch (error: any) {
      console.error('❌ [API] Exception login:', error)
      throw error
    }
  }

  async register(userData: {
    email: string
    username: string
    password: string
    full_name?: string
  }) {
    console.log(`👤 [API] Inscription: ${userData.email}`)
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    })
  }

  async getCurrentUser() {
    console.log('👤 [API] Récupération utilisateur courant')
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

  // Dans api.ts, ajoutez après getMyShops()
async getShopStats(shopSlug: string) {
  console.log(`📊 [API] Stats boutique: ${shopSlug}`)
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

  // ===== Produits =====
  async createProduct(shopSlug: string, productData: {
    name: string
    description?: string
    price: number
    stock: number
    images?: string[]
    category?: string
    sku?: string
  }) {
    return this.request<Product>(`/shops/${shopSlug}/products`, {
      method: 'POST',
      body: JSON.stringify(productData),
    })
  }

  async getShopProducts(shopSlug: string, publicView: boolean = true) {
    return this.request<Product[]>(`/shops/${shopSlug}/products?public=${publicView}`)
  }

  // ===== Dashboard =====
  async getDashboardStats(shopSlug: string) {
    return this.getShopStats(shopSlug)
  }

  // ===== Commandes (vendeur) =====
  async getShopOrders(shopSlug: string) {
    console.log(`📦 [API] Commandes boutique: ${shopSlug}`)
    return this.request<Order[]>(`/shops/${shopSlug}/orders`)
  }

  async getOrderStats(shopSlug: string) {
    console.log(`📊 [API] Stats commandes: ${shopSlug}`)
    return this.request<OrderStats>(`/shops/${shopSlug}/orders/stats`)
  }

  async updateOrderStatus(shopSlug: string, orderId: string, status: string) {
    return this.request(`/shops/${shopSlug}/orders/${orderId}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    })
  }

  // ===== Upload =====
  async uploadImage(file: File) {
    const formData = new FormData()
    formData.append('file', file)
    return this.request<{ url: string }>('/upload', {
      method: 'POST',
      body: formData,
    })
  }

  // ===== Utilitaires =====
  isAuthenticated(): boolean {
    return !!this.getToken()
  }

  // ===== COMMANDES CLIENTS =====
  async createOrder(orderData: any): Promise<ApiResponse<any>> {
    console.log('🛒 [API] Création commande')
    return this.request<Order>('/orders/', {
      method: 'POST',
      body: JSON.stringify(orderData),
    })
  }

  async getMyOrders() {
    console.log('📋 [API] Mes commandes')
    return this.request<Order[]>('/orders/my-orders')
  }

  async getOrderById(orderId: string) {
    return this.request<Order>(`/orders/${orderId}`)
  }

  async trackOrder(orderNumber: string, email: string) {
    return this.request<Order>(`/orders/track/${orderNumber}?email=${encodeURIComponent(email)}`)
  }

  // ===== PANIER =====
  async getCart(slug: string) {
    console.log(`🛒 [API] Panier boutique: ${slug}`)
    return this.request<any>(`/cart/${slug}`)
  }

  async addToCart(slug: string, productId: string, quantity: number = 1) {
    console.log(`🛒 [API] Ajout ${productId} x${quantity} à ${slug}`)
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
    console.log(`🗑️ [API] Vider panier: ${slug}`)
    return this.request(`/cart/${slug}`, {
      method: 'DELETE'
    })
  }

  // ===== BOUTIQUES PUBLIQUES =====
  async getPublicShop(slug: string) {
    console.log(`🏪 [API] Boutique publique: ${slug}`)
    return this.request<Shop>(`/public/shops/${slug}`)
  }

  async getPublicShops(limit: number = 6) {
    return this.request<Shop[]>(`/public/shops?limit=${limit}`)
  }
 

  async getPublicShopProducts(slug: string) {
    console.log(`📦 [API] Produits boutique publique: ${slug}`)
    return this.request<Product[]>(`/public/shops/${slug}/products`)
  }

  // ===== RECHERCHE =====
  async searchProducts(query: string, shopSlug?: string) {
    const url = shopSlug 
      ? `/public/shops/${shopSlug}/products/search?q=${encodeURIComponent(query)}`
      : `/public/products/search?q=${encodeURIComponent(query)}`
    return this.request<Product[]>(url)
  }

  // ===== TEST =====
  async testAuth() {
    console.log('🧪 [API] Test authentification')
    return this.request('/auth/me')
  }
}

export const api = new ApiClient()