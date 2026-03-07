'use client'

import Link from 'next/link'
import { useState } from 'react'

interface ProductCardProps {
  product: any
  slug: string
  addToCart: (slug: string, productId: string, quantity: number) => Promise<void>
  isLoadingAddToCart: boolean
  cart: any
}

export default function ProductCard({ product, slug, addToCart, isLoadingAddToCart, cart }: ProductCardProps) {
  const [localLoading, setLocalLoading] = useState(false)
  const [lastAddedProductId, setLastAddedProductId] = useState<string | null>(null)

  const cartItem = cart.cart?.items?.find((item: any) => item.product_id === product.id)
  const quantityInCart = cartItem?.quantity || 0
  const availableStock = product.stock - quantityInCart

  const handleAddToCart = async () => {
    if (availableStock <= 0) {
      alert(`Stock insuffisant!`)
      return
    }

    setLocalLoading(true)
    setLastAddedProductId(product.id)

    try {
      await addToCart(slug, product.id, 1)
    } catch (err: any) {
      console.error('Erreur ajout panier:', err)
      alert(err.message || 'Erreur lors de l\'ajout au panier')
    } finally {
      setLocalLoading(false)
      setTimeout(() => setLastAddedProductId(null), 1000)
    }
  }

  const formatPrice = (priceInCents: number) => {
    return (priceInCents / 100).toFixed(2) + ' €'
  }

  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-200 ${
      lastAddedProductId === product.id ? 'ring-2 ring-green-500 ring-opacity-50' : ''
    }`}>
      <Link href={`/product/${product.id}`} className="block">
        <div className="relative h-48 bg-gradient-to-br from-gray-50 to-gray-100">
          {product.images && product.images.length > 0 ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className="h-full w-full object-cover hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              <span className="text-gray-300 text-5xl">📦</span>
            </div>
          )}
          
          {/* Badges */}
          <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
            {product.is_featured && (
              <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">⭐ Vedette</span>
            )}
            {product.has_discount && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">-{product.discount_percentage}%</span>
            )}
          </div>

          {/* Quantité dans panier */}
          {quantityInCart > 0 && (
            <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
              {quantityInCart} dans le panier
            </div>
          )}

          {/* Stock faible */}
          {availableStock > 0 && availableStock <= 5 && (
            <div className="absolute bottom-2 left-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
              Plus que {availableStock}
            </div>
          )}

          {/* Rupture */}
          {availableStock <= 0 && (
            <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
              <span className="bg-red-500 text-white px-4 py-2 rounded-full text-sm font-bold">
                Rupture
              </span>
            </div>
          )}
        </div>
      </Link>

      <div className="p-4">
        {/* Catégorie et vues */}
        <div className="flex justify-between items-start mb-2">
          <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
            {product.category || 'Général'}
          </span>
          <span className="text-xs text-gray-500 flex items-center gap-1">
            👁️ {product.view_count || 0}
          </span>
        </div>

        {/* Nom */}
        <Link href={`/product/${product.id}`}>
          <h3 className="font-semibold text-lg mb-2 line-clamp-2 h-14 hover:text-blue-600 transition-colors">
            {product.name}
          </h3>
        </Link>

        {/* Boutique */}
        <p className="text-sm text-gray-500 mb-2">
          {product.shop_name}
        </p>

        {/* Description courte */}
        <p className="text-gray-600 text-sm mb-3 line-clamp-2 h-10">
          {product.description || 'Pas de description'}
        </p>

        {/* Tags - Cliquables */}
        {product.tags && product.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {product.tags.slice(0, 3).map((tag: string, index: number) => (
              <Link
                key={index}
                href={`/search/tag/${encodeURIComponent(tag)}`}
                className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded hover:bg-blue-100 hover:text-blue-600 transition-colors cursor-pointer"
                onClick={(e) => e.stopPropagation()}
              >
                {tag}
              </Link>
            ))}
            {product.tags.length > 3 && (
              <span className="text-xs text-gray-400">+{product.tags.length - 3}</span>
            )}
          </div>
        )}

        {/* Prix */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <span className="text-xl font-bold text-gray-900">
              {formatPrice(product.price)}
            </span>
            {product.has_discount && product.formatted_compare_price && (
              <div className="text-sm text-gray-500 line-through">
                {product.formatted_compare_price}
              </div>
            )}
          </div>
        </div>

        {/* Bouton Ajouter */}
        <button
          onClick={handleAddToCart}
          disabled={availableStock <= 0 || localLoading || isLoadingAddToCart}
          className={`w-full py-3 rounded-md font-medium transition-all ${
            availableStock <= 0
              ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
              : localLoading
                ? 'bg-green-600 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {localLoading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Ajout...
            </span>
          ) : availableStock <= 0 ? (
            'Rupture'
          ) : quantityInCart > 0 ? (
            `Ajouter + (${quantityInCart})`
          ) : (
            'Ajouter au panier'
          )}
        </button>
      </div>
    </div>
  )
}