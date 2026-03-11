// apps/web/app/hooks/useCart.ts
import { useState, useEffect } from 'react'
import { api, type Product } from '../lib/api'

// Interface pour le panier
interface CartItem {
  id: string
  product_id: string
  product_name: string
  product_price: number
  product_compare_price?: number
  product_has_discount?: boolean
  product_discount_percentage?: number
  product_image?: string
  product_slug?: string
  product_is_digital?: boolean
  quantity: number
  total_price: number
  product_sku?: string
  product_category?: string
  product_variations?: any[]
  selected_variations?: Record<string, string>
}

interface Cart {
  id: string
  shop_id: string
  shop_slug?: string
  shop_name?: string
  items: CartItem[]
  total_items: number
  subtotal: number
  total_discount?: number
  shipping_cost?: number
  grand_total?: number
}

interface AddToCartOptions {
  variations?: Record<string, string>
  customizations?: Record<string, any>
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

      if (response.error && response.statusCode === 400) {
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
        // Enrichir les données du panier
        const enrichedCart = {
          ...response.data,
          total_discount: calculateTotalDiscount(response.data.items || []),
          grand_total: calculateGrandTotal(response.data)
        }
        setCart(enrichedCart)
        console.log('✅ useCart - Panier chargé:', {
          id: enrichedCart.id,
          itemsCount: enrichedCart.items?.length || 0,
          shopSlug: enrichedCart.shop_slug,
          totalDiscount: enrichedCart.total_discount,
          grandTotal: enrichedCart.grand_total
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

  // Calculer la remise totale
  const calculateTotalDiscount = (items: CartItem[]): number => {
    return items.reduce((sum, item) => {
      if (item.product_has_discount && item.product_compare_price) {
        const discountPerItem = item.product_compare_price - item.product_price
        return sum + (discountPerItem * item.quantity)
      }
      return sum
    }, 0)
  }

  // Calculer le total général
  const calculateGrandTotal = (cartData: Cart): number => {
    const subtotal = cartData.subtotal || 0
    const discount = calculateTotalDiscount(cartData.items || [])
    const shipping = cartData.shipping_cost || 0
    return Math.max(0, subtotal - discount + shipping)
  }

  // Ajouter au panier
  const addToCart = async (
    shopSlug: string, 
    productId: string, 
    quantity: number = 1,
    options: AddToCartOptions = {}
  ) => {
    console.log('🛒 useCart - addToCart:', { shopSlug, productId, quantity, options })
    
    setIsLoading(true)
    setError('')
    
    try {
      const body: any = { 
        product_id: productId, 
        quantity 
      }
      
      // Ajouter les variations si fournies
      if (options.variations && Object.keys(options.variations).length > 0) {
        body.variations = options.variations
      }
      
      // Ajouter les personnalisations si fournies
      if (options.customizations && Object.keys(options.customizations).length > 0) {
        body.customizations = options.customizations
      }
      
      const response = await api.addToCart(shopSlug, productId, quantity)
      
      console.log('🛒 useCart - Produit ajouté, réponse:', response)
      
      if (response.data) {
        // Recharger le panier
        await loadCart(shopSlug)
        console.log('✅ useCart - Panier rechargé après ajout')
        
        // Émettre un événement personnalisé pour notifier l'ajout
        window.dispatchEvent(new CustomEvent('cartItemAdded', { 
          detail: { productId, quantity, shopSlug }
        }))
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

  // Vérifier si un produit est dans le panier
  const isProductInCart = (productId: string): boolean => {
    if (!cart?.items) return false
    return cart.items.some(item => item.product_id === productId)
  }

  // Obtenir la quantité d'un produit dans le panier
  const getProductQuantity = (productId: string): number => {
    if (!cart?.items) return 0
    const item = cart.items.find(item => item.product_id === productId)
    return item ? item.quantity : 0
  }

  // Obtenir le total d'économie (remise)
  const getTotalSavings = (): number => {
    if (!cart?.items) return 0
    return calculateTotalDiscount(cart.items)
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

  // Écouter les mises à jour du panier depuis d'autres composants
  useEffect(() => {
    const handleCartUpdate = () => {
      if (slug) {
        console.log('🛒 useCart - Événement cartUpdated reçu')
        loadCart(slug)
      }
    }
    
    window.addEventListener('cartUpdated', handleCartUpdate)
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate)
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
    // Nouvelles méthodes utilitaires
    isProductInCart,
    getProductQuantity,
    getTotalSavings,
    // Méthode utilitaire pour debug
    debug: () => ({
      slug,
      cart,
      isLoading,
      error,
      cartItems: cart?.items || [],
      cartCount: cart?.items?.length || 0,
      totalSavings: getTotalSavings(),
      grandTotal: cart?.grand_total
    })
  }
}
