// apps/web/app/contexts/AuthContext.tsx

'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '../lib/api';

const API_BASE_URL = 'http://localhost:8000/api/v1';
//const API_BASE_URL = 'http://10.70.51.229:8000/api/v1';

interface User {
  id: string
  email: string
  username: string
  full_name: string | null
  is_seller: boolean
  is_active: boolean
  created_at: string
  total_shops: number  // ← AJOUTEZ CE CHAMP (important pour la redirection)
  phone?: string | null
  avatar?: string | null 
  is_admin?: boolean 
  seller_requested_at?: string | null
  seller_approved_at?: string | null
}

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (userData: RegisterData) => Promise<void>
  logout: () => void
  updateUser: (userData: User) => void
  isAuthenticated: boolean
}

interface RegisterData {
  email: string
  username: string
  password: string
  full_name?: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// ✅ Fonction utilitaire pour déterminer la redirection (en dehors du composant)
const determineRedirectPath = (user: User): string => {
  // Si checkout en attente
  const checkoutIntent = localStorage.getItem('checkout_intent')
  if (checkoutIntent) {
    try {
      const intent = JSON.parse(checkoutIntent)
      if (Date.now() - intent.timestamp < 3600000) {
        return `/checkout?shop=${intent.shopSlug}`
      }
    } catch (e) {
      console.error('Erreur parsing checkout intent:', e)
    }
  }

  // Utilisateur admin
  if (user.is_admin) {
    return '/admin/dashboard'
  }

  // Vendeur avec boutiques
  if (user.is_seller && user.total_shops > 0) {
    return '/seller/dashboard'
  }

  // Vendeur sans boutique
  if (user.is_seller) {
    return '/seller/dashboard/create'
  }

  // Acheteur normal
  return '/'
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = () => {
      const storedToken = localStorage.getItem('shoptonik_token')
      const storedUser = localStorage.getItem('shoptonik_user')

      if (storedToken && storedUser) {
        setToken(storedToken)
        setUser(JSON.parse(storedUser))
        api.setToken(storedToken)
      }
      setIsLoading(false)
    }

    if (typeof window !== 'undefined') {
      checkAuth()
    } else {
      setIsLoading(false)
    }
  }, [])

  const updateUser = (userData: User) => {
    setUser(userData)
    localStorage.setItem('shoptonik_user', JSON.stringify(userData))
  }

  const login = async (email: string, password: string) => {
    try {
      const formData = new URLSearchParams()
      formData.append('username', email)
      formData.append('password', password)

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString()
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || 'Login failed')
      }

      const data = await response.json()

      localStorage.setItem('shoptonik_token', data.access_token)
      localStorage.setItem('shoptonik_user', JSON.stringify(data.user))

      setToken(data.access_token)
      setUser(data.user)
      api.setToken(data.access_token)

      // Vérifier le checkout en attente
      const checkoutIntent = localStorage.getItem('checkout_intent')
      if (checkoutIntent) {
        try {
          const intent = JSON.parse(checkoutIntent)
          if (Date.now() - intent.timestamp < 3600000) {
            const sessionId = localStorage.getItem('guest_cart_session')
            if (sessionId) {
              try {
                await api.mergeGuestCart(sessionId)
                localStorage.removeItem('guest_cart_session')
              } catch (mergeError) {
                console.error('Erreur fusion panier:', mergeError)
              }
            }
            
            router.push(`/checkout?shop=${intent.shopSlug}`)
            localStorage.removeItem('checkout_intent')
            return
          }
        } catch (e) {
          console.error('Erreur parsing checkout intent:', e)
        }
      }

      // ✅ Utilisation de la fonction de redirection intelligente
      const redirectPath = determineRedirectPath(data.user)
      router.push(redirectPath)

    } catch (error: any) {
      console.error('Login error:', error)
      throw error
    }
  }

  const register = async (userData: RegisterData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        console.error('Backend registration error:', data)
        const msg = data.detail?.[0]?.msg || JSON.stringify(data)
        throw new Error(msg)
      }

      if (!data.access_token) {
        throw new Error('No access token received')
      }

      localStorage.setItem('shoptonik_token', data.access_token)
      localStorage.setItem('shoptonik_user', JSON.stringify(data.user))

      setToken(data.access_token)
      setUser(data.user)

      // ✅ Pour l'inscription, on peut aussi utiliser la même logique
      const redirectPath = determineRedirectPath(data.user)
      router.push(redirectPath)

    } catch (error: any) {
      console.error('Registration error:', error)
      throw error
    }
  }

  const logout = () => {
    localStorage.removeItem('shoptonik_token')
    localStorage.removeItem('shoptonik_user')
    setToken(null)
    setUser(null)
    router.push('/auth/login')
  }

  const value = {
    user,
    token,
    isLoading,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated: !!token
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
