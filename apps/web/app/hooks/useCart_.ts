// apps/web/app/hooks/useCart.ts
import { useState, useEffect } from 'react'
import { api } from '../lib/api'
 

// Interface pour le panier
interface CartItem {
  id: string
  product_id: string
  product_name: string
  product_price: number
  product_image?: string
  quantity: number
  total_price: number
}

interface Cart {
  id: string
  shop_id: string
  shop_slug?: string
  shop_name?: string
  items: CartItem[]
  total_items: number
  subtotal: number
}

export const useCart = (slug?: string) => {
  const [cart, setCart] = useState<Cart | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>('')

  // Charger le panier avec logs
  const loadCart = async (shopSlug: string) => {
    console.log('🛒 useCart - loadCart appelé avec slug:', shopSlug)
    
    // Vérification améliorée
  if (!shopSlug || shopSlug.trim() === '' || shopSlug === 'all') {
    console.warn('⚠️ useCart - Slug invalide, retour panier vide')
    setCart(null)
    setError('')
    setIsLoading(false)
    return
  }
    
    setIsLoading(true)
    setError('')
    
    try {
      console.log('🛒 useCart - Appel API getCart...')
      const response = await api.getCart(shopSlug)

      if (response.error && response.status === 400) {
        console.warn('⚠️ useCart - API a rejeté le slug:', response.error)
        setCart(null)
        setError('')
        return
      }
      
      console.log('🛒 useCart - Réponse API:', {
        status: 'success',
        data: response.data,
        error: response.error
      })
      
      if (response.data) {
        setCart(response.data)
        console.log('✅ useCart - Panier chargé:', {
          id: response.data.id,
          itemsCount: response.data.items?.length || 0,
          shopSlug: response.data.shop_slug
        })
      } else if (response.error) {
        console.warn('⚠️ useCart - Erreur dans la réponse:', response.error)
        setError(response.error)
        setCart(null)
      }
    } catch (err: any) {
      console.error('❌ useCart - Exception:', err.message || err)
      setError(err.message || 'Erreur de chargement du panier')
      setCart(null)
    } finally {
      setIsLoading(false)
    }
  }

  // Ajouter au panier
  const addToCart = async (shopSlug: string, productId: string, quantity: number = 1) => {
    console.log('🛒 useCart - addToCart:', { shopSlug, productId, quantity })
    
    setIsLoading(true)
    setError('')
    
    try {
      const response = await api.addToCart(shopSlug, productId, quantity)
      
      console.log('🛒 useCart - Produit ajouté, réponse:', response)
      
      if (response.data) {
        // Recharger le panier
        await loadCart(shopSlug)
        console.log('✅ useCart - Panier rechargé après ajout')
      }
      return response
    } catch (err: any) {
      console.error('❌ useCart - Erreur ajout panier:', err)
      setError(err.message || 'Erreur lors de l\'ajout au panier')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  // Mettre à jour la quantité
  const updateQuantity = async (itemId: string, quantity: number) => {
    console.log('🛒 useCart - updateQuantity:', { itemId, quantity })
    
    if (!cart) {
      console.warn('⚠️ useCart - Pas de panier pour updateQuantity')
      return
    }
    
    setIsLoading(true)
    setError('')
    
    try {
      await api.updateCartItem(itemId, quantity)
      await loadCart(cart.shop_slug || cart.shop_id)
      console.log('✅ useCart - Quantité mise à jour')
    } catch (err: any) {
      console.error('❌ useCart - Erreur mise à jour quantité:', err)
      setError(err.message || 'Erreur lors de la mise à jour')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  // Supprimer du panier
  const removeFromCart = async (itemId: string) => {
    console.log('🛒 useCart - removeFromCart:', { itemId })
    
    if (!cart) {
      console.warn('⚠️ useCart - Pas de panier pour removeFromCart')
      return
    }
    
    setIsLoading(true)
    setError('')
    
    try {
      await api.removeCartItem(itemId)
      await loadCart(cart.shop_slug || cart.shop_id)
      console.log('✅ useCart - Article supprimé')
    } catch (err: any) {
      console.error('❌ useCart - Erreur suppression:', err)
      setError(err.message || 'Erreur lors de la suppression')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  // Vider le panier
  const clearCart = async () => {
    console.log('🛒 useCart - clearCart')
    
    if (!cart) {
      console.warn('⚠️ useCart - Pas de panier pour clearCart')
      return
    }
    
    setIsLoading(true)
    setError('')
    
    try {
      await api.clearCart(cart.shop_slug || cart.shop_id)
      setCart(null)
      console.log('✅ useCart - Panier vidé')
    } catch (err: any) {
      console.error('❌ useCart - Erreur vidage panier:', err)
      setError(err.message || 'Erreur lors du vidage du panier')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  // Effet pour charger le panier au montage
  useEffect(() => {
    if (slug) {
      console.log('🛒 useCart - useEffect, slug:', slug)
      loadCart(slug)
    } else {
      console.log('🛒 useCart - useEffect, slug est undefined')
    }
  }, [slug])

  return {
    cart,
    isLoading,
    error,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    refreshCart: () => {
      console.log('🛒 useCart - refreshCart appelé')
      return slug ? loadCart(slug) : Promise.resolve()
    },
    // Méthode utilitaire pour debug
    debug: () => ({
      slug,
      cart,
      isLoading,
      error,
      cartItems: cart?.items || [],
      cartCount: cart?.items?.length || 0
    })
  }
}