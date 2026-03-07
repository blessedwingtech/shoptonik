'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import CheckoutButton from './CheckoutButton'

interface CartSidebarProps {
  slug: string
  cart: any
}

export default function CartSidebar({ slug, cart }: CartSidebarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [localLoadingItems, setLocalLoadingItems] = useState<Set<string>>(new Set())
  const pathname = usePathname()
  const sidebarRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  

  console.log('=== CART SIDEBAR ===')
  console.log('slug reçu:', slug)
  console.log('cart reçu:', cart)
  console.log('cart items:', cart.cart?.items)
  console.log('cart count:', cart.cart?.items?.length || 0)

  // Écouter l'événement d'ouverture depuis la Navbar
  useEffect(() => {
    const handleOpenCart = () => setIsOpen(true)
    window.addEventListener('openCartSidebar', handleOpenCart)
    
    return () => {
      window.removeEventListener('openCartSidebar', handleOpenCart)
    }
  }, [])

  // Fermer quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Ne pas afficher sur la page de checkout
  if (pathname.includes('/checkout')) return null

  // Calculer les totaux
  const cartCount = cart.cart?.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0
  const cartSubtotal = cart.cart?.subtotal || 0
  const totalDiscount = cart.cart?.total_discount || 0
  const shippingCost = cart.cart?.shipping_cost || 0
  const grandTotal = cart.cart?.grand_total || cartSubtotal - totalDiscount + shippingCost

  // Formater le prix
  const formatPrice = (price: number | undefined) => {
    if (!price && price !== 0) return '0,00 €'
    return price.toFixed(2).replace('.', ',') + ' €'
  }

  // Fonctions pour gérer les items individuellement
  const handleIncreaseQuantity = async (itemId: string, currentQuantity: number, productStock: number) => {
    if (currentQuantity >= productStock) {
      alert(`Stock maximum atteint. Il ne reste que ${productStock} unités disponibles.`)
      return
    }
    
    setLocalLoadingItems(prev => new Set([...prev, itemId]))
    
    try {
      await cart.updateQuantity(itemId, currentQuantity + 1)
    } catch (err) {
      console.error('Erreur mise à jour:', err)
      alert('Erreur lors de la mise à jour de la quantité')
    } finally {
      setLocalLoadingItems(prev => {
        const newSet = new Set(prev)
        newSet.delete(itemId)
        return newSet
      })
    }
  }

  const handleDecreaseQuantity = async (itemId: string, currentQuantity: number) => {
    if (currentQuantity <= 1) return
    
    setLocalLoadingItems(prev => new Set([...prev, itemId]))
    
    try {
      await cart.updateQuantity(itemId, currentQuantity - 1)
    } catch (err) {
      console.error('Erreur mise à jour:', err)
      alert('Erreur lors de la mise à jour de la quantité')
    } finally {
      setLocalLoadingItems(prev => {
        const newSet = new Set(prev)
        newSet.delete(itemId)
        return newSet
      })
    }
  }

  const handleRemoveItem = async (itemId: string) => {
    if (!confirm('Supprimer ce produit du panier ?')) return
    
    setLocalLoadingItems(prev => new Set([...prev, itemId]))
    
    try {
      await cart.removeFromCart(itemId)
    } catch (err) {
      console.error('Erreur suppression:', err)
      alert('Erreur lors de la suppression')
    } finally {
      setLocalLoadingItems(prev => {
        const newSet = new Set(prev)
        newSet.delete(itemId)
        return newSet
      })
    }
  }

  // SI EN TRAIN DE CHARGER
  if (cart.isLoading && !cart.cart) {
    return (
      <div className="fixed right-4 bottom-4 z-40">
        <button
          className="bg-gray-500 text-white p-4 rounded-full shadow-lg flex items-center gap-2"
          disabled
        >
          <span>🛒</span>
          <span className="font-medium">Chargement...</span>
        </button>
      </div>
    )
  }

  return (
    <>
      {/* Bouton flottant */}
      <div className="fixed right-4 bottom-4 z-40">
        <button
          onClick={() => setIsOpen(true)}
          className={`p-4 rounded-full shadow-lg flex items-center gap-2 relative transition-all ${
            cartCount > 0 
              ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white' 
              : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white'
          }`}
          aria-label={`Ouvrir le panier (${cartCount} article${cartCount !== 1 ? 's' : ''})`}
        >
          <span className="text-xl">🛒</span>
          <span className="font-medium hidden sm:inline">
            Panier ({cartCount})
          </span>
          
          {cartCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold shadow-lg">
              {cartCount > 99 ? '99+' : cartCount}
            </span>
          )}
        </button>
      </div>

      {/* Modal du panier */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end">
          <div 
            ref={sidebarRef}
            className="bg-white w-full max-w-md h-[100dvh] shadow-2xl flex flex-col animate-slideIn overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* En-tête */}
            <div className="p-6 border-b border-gray-200 flex-shrink-0 bg-gradient-to-r from-blue-50 to-white">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {cart.cart?.shop_name ? `Panier - ${cart.cart.shop_name}` : 'Mon Panier'}
                  </h2>
                  {cartCount > 0 && (
                    <p className="text-gray-600 text-sm mt-1">
                      {cartCount} article{cartCount > 1 ? 's' : ''}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl p-1 hover:bg-gray-100 rounded-full w-10 h-10 flex items-center justify-center"
                  aria-label="Fermer le panier"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Contenu du panier - SCROLLABLE */}
            <div className="flex-1 min-h-0 overflow-y-auto p-6">
              {!cart.cart || cart.cart.items?.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-6xl mb-4">🛒</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Votre panier est vide
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Ajoutez des produits pour continuer
                  </p>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Continuer mes achats
                  </button>
                </div>
              ) : cart.isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-600 mt-2">Chargement du panier...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.cart.items.map((item: any) => {
                    const isLoading = localLoadingItems.has(item.id)
                    const productStock = item.product_stock || 99 // À récupérer de l'API
                    const canIncrease = item.quantity < productStock
                    const hasDiscount = item.product_has_discount && item.product_compare_price
                    
                    return (
                      <div key={item.id} className="flex gap-4 p-4 border border-gray-200 rounded-xl relative hover:border-blue-300 transition-colors bg-white">
                        {isLoading && (
                          <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center z-10 rounded-xl backdrop-blur-sm">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                          </div>
                        )}
                        
                        {/* Image */}
                        <div className="w-20 h-20 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {item.product_image ? (
                            <img 
                              src={item.product_image} 
                              alt={item.product_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-gray-400 text-2xl">📦</span>
                          )}
                        </div>

                        {/* Détails */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 truncate">
                            {item.product_name}
                          </h4>
                          
                          {/* Prix unitaire avec remise */}
                          <div className="flex items-center gap-2 mt-1">
                            <span className="font-medium text-gray-900">
                              {formatPrice(item.product_price)}
                            </span>
                            {hasDiscount && item.product_compare_price && (
                              <>
                                <span className="text-sm text-gray-500 line-through">
                                  {formatPrice(item.product_compare_price)}
                                </span>
                                <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded">
                                  -{item.product_discount_percentage || Math.round((item.product_compare_price - item.product_price) / item.product_compare_price * 100)}%
                                </span>
                              </>
                            )}
                          </div>
                          
                          {/* SKU et catégorie */}
                          {(item.product_sku || item.product_category) && (
                            <div className="text-xs text-gray-500 mt-1 space-x-2">
                              {item.product_sku && <span>Ref: {item.product_sku}</span>}
                              {item.product_category && <span>• {item.product_category}</span>}
                            </div>
                          )}
                          
                          {/* Variations sélectionnées */}
                          {item.selected_variations && Object.keys(item.selected_variations).length > 0 && (
                            <div className="mt-2 space-y-1">
                              {Object.entries(item.selected_variations).map(([key, value]) => (
                                <div key={key} className="text-xs text-gray-600 flex items-center gap-1">
                                  <span className="text-gray-500">{key}:</span>
                                  <span className="bg-gray-100 px-2 py-0.5 rounded">{value as string}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {/* Contrôles de quantité */}
                          <div className="flex items-center gap-2 mt-3">
                            <button
                              onClick={() => handleDecreaseQuantity(item.id, item.quantity)}
                              disabled={item.quantity <= 1 || isLoading}
                              className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 hover:border-gray-400 transition-colors"
                              aria-label="Réduire la quantité"
                            >
                              -
                            </button>
                            <span className="w-10 text-center font-medium text-gray-900">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => handleIncreaseQuantity(item.id, item.quantity, productStock)}
                              disabled={!canIncrease || isLoading}
                              className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 hover:border-gray-400 transition-colors"
                              aria-label="Augmenter la quantité"
                              title={!canIncrease ? `Stock maximum: ${productStock}` : ''}
                            >
                              +
                            </button>
                            
                            {/* Total pour cet article */}
                            <div className="ml-auto text-right">
                              <p className="font-bold text-lg whitespace-nowrap text-gray-900">
                                {formatPrice(item.total_price)}
                              </p>
                              {hasDiscount && (
                                <p className="text-xs text-green-600 whitespace-nowrap">
                                  Économie: {formatPrice((item.product_compare_price - item.product_price) * item.quantity)}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          {/* Message stock limité */}
                          {!canIncrease && (
                            <p className="text-red-500 text-xs mt-1">
                              Stock limité ({productStock} max)
                            </p>
                          )}
                        </div>

                        {/* Bouton suppression */}
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          disabled={isLoading}
                          className="absolute top-2 right-2 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                          aria-label="Supprimer l'article"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Résumé et paiement - Seulement si panier non vide */}
            {cart.cart?.items?.length > 0 && (
              <div className="p-6 border-t border-gray-200 bg-gradient-to-b from-gray-50 to-white flex-shrink-0">
                <div className="space-y-3 mb-6">
                  {/* Sous-total */}
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Sous-total</span>
                    <span className="font-medium text-gray-900">{formatPrice(cartSubtotal)}</span>
                  </div>
                  
                  {/* Remise */}
                  {totalDiscount > 0 && (
                    <div className="flex justify-between items-center text-green-600">
                      <span>Remise</span>
                      <span className="font-medium">-{formatPrice(totalDiscount)}</span>
                    </div>
                  )}
                  
                  {/* Livraison */}
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Livraison</span>
                    <span className="text-gray-900">
                      {shippingCost > 0 ? formatPrice(shippingCost) : 'À calculer'}
                    </span>
                  </div>
                  
                  {/* Séparateur */}
                  <div className="border-t border-gray-300 pt-3">
                    <div className="flex justify-between items-center text-lg font-bold">
                      <span className="text-gray-900">Total</span>
                      <span className="text-blue-600">{formatPrice(grandTotal)}</span>
                    </div>
                    {totalDiscount > 0 && (
                      <p className="text-sm text-green-600 mt-1 text-right">
                        Vous économisez {formatPrice(totalDiscount)} !
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  {/* <button
                    onClick={() => {
                      console.log('🚀 Navigation checkout')
                      
                      if (!slug) {
                        alert('Boutique non spécifiée')
                        return
                      }

                      if (!cart.cart || cart.cart.items.length === 0) {
                        alert('Panier vide')
                        return
                      }

                      router.push(`/checkout?shop=${slug}`)
                    }}
                    className="block w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3.5 rounded-xl font-medium text-lg shadow-lg hover:shadow-xl transition-all"
                  >
                    Passer la commande
                  </button> */}
                  <CheckoutButton 
                      shopSlug={slug}
                      disabled={cart.cart?.items?.length === 0}
                      className="block w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3.5 rounded-xl font-medium text-lg shadow-lg hover:shadow-xl transition-all"
                    />

                  <div className="flex gap-3">
                    <button
                      onClick={() => setIsOpen(false)}
                      className="flex-1 text-center py-3 text-gray-700 hover:text-gray-900 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                    >
                      Continuer mes achats
                    </button>
                    <button
                      onClick={() => cart.clearCart()}
                      className="px-4 py-3 text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 rounded-xl transition-colors font-medium"
                      title="Vider le panier"
                    >
                      Vider
                    </button>
                  </div>
                  
                  <p className="text-center text-xs text-gray-500 mt-4">
                    Livraison sous 4-7 jours ouvrés • Retours sous 30 jours
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Style pour l'animation */}
      <style jsx global>{`
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
    </>
  )
}
