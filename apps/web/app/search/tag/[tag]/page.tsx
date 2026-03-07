'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { api } from '@/app/lib/api'
import Link from 'next/link'
import ProductCard from '@/app/components/ProductCard'
import { useCart } from '@/app/hooks/useCart'
import CartSidebar from '@/app/components/CartSidebar'
import toast from 'react-hot-toast'
import ConfirmationModal from '@/app/components/ConfirmationModal'

export default function TagSearchPage() {
  const params = useParams()
  const router = useRouter()
  const tag = params.tag as string
  const decodedTag = decodeURIComponent(tag)
  
  const [products, setProducts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [sortBy, setSortBy] = useState('relevance')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalProducts, setTotalProducts] = useState(0)
  const limit = 12
  
  // État pour le panier actif (produit en cours d'ajout)
  const [activeShopSlug, setActiveShopSlug] = useState<string | null>(null)
  const [showCartModal, setShowCartModal] = useState(false)
  const [pendingProduct, setPendingProduct] = useState<{
    product: any
    shopSlug: string
  } | null>(null)
  
  // Hook panier - on utilise un panier global mais on gère les boutiques dynamiquement
  const cart = useCart(activeShopSlug || '')

  useEffect(() => {
    loadProductsByTag()
  }, [tag, sortBy, page])

 const loadProductsByTag = async () => {
  setIsLoading(true)
  try {
    console.log('🔍 Recherche par tag:', decodedTag)
    
    const response = await api.getProductsByTag(decodedTag, {
      sort_by: sortBy,
      page: page,
      limit: limit
    })
    
    console.log('📥 Réponse reçue:', response)
    
    if (response.data) {
      setProducts(response.data.products || [])
      setTotalPages(response.data.pagination?.pages || 1)
      setTotalProducts(response.data.pagination?.total || 0)
    }
  } catch (error) {
    console.error('❌ Erreur chargement produits par tag:', error)
    toast.error('Erreur lors du chargement des produits')
  } finally {
    setIsLoading(false)
  }
}

  const handleAddToCart = async (product: any, shopSlug: string) => {
    try {
      // Vérifier le stock
      if (product.stock <= 0) {
        toast.error('Ce produit est en rupture de stock')
        return
      }

      // Changer le panier actif pour cette boutique
      setActiveShopSlug(shopSlug)
      
      // Attendre un peu que le panier soit initialisé
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Ajouter au panier
      await cart.addToCart(shopSlug, product.id, 1)
      
      // Notification de succès
      toast.success(
        <div>
          <strong>{product.name}</strong>
          <br />
          <span className="text-sm">Ajouté au panier de <span className="font-semibold">{product.shop_name}</span></span>
        </div>,
        {
          duration: 4000,
          icon: '🛒',
          style: {
            background: '#10b981',
            color: 'white',
          },
        }
      )
      
      // Proposer d'ouvrir le panier
      setPendingProduct({ product, shopSlug })
      setShowCartModal(true)
      
    } catch (error: any) {
      console.error('❌ Erreur ajout panier:', error)
      
      if (error.message?.includes('Stock') || error.message?.includes('stock')) {
        toast.error(`Stock insuffisant pour ${product.name}`)
      } else {
        toast.error(`Erreur lors de l'ajout de ${product.name} au panier`)
      }
    }
  }

  const handleOpenCart = () => {
    setShowCartModal(false)
    // Déclencher l'ouverture du CartSidebar
    window.dispatchEvent(new CustomEvent('openCartSidebar'))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* En-tête */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Link 
              href="/search" 
              className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
            >
              ← Retour à la recherche
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Produits avec le tag : <span className="text-blue-600">{decodedTag}</span>
          </h1>
          <p className="text-gray-600 mt-2">
            {totalProducts} produit{totalProducts !== 1 ? 's' : ''} trouvé{totalProducts !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Tri */}
        <div className="mb-6 flex justify-end">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="relevance">Pertinence</option>
            <option value="newest">Plus récents</option>
            <option value="price_asc">Prix croissant</option>
            <option value="price_desc">Prix décroissant</option>
            <option value="popular">Plus populaires</option>
          </select>
        </div>

        {/* Liste des produits */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement des produits...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">🏷️</div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              Aucun produit trouvé
            </h3>
            <p className="text-gray-600 mb-6">
              Aucun produit ne porte le tag "{decodedTag}" pour le moment.
            </p>
            <Link
              href="/search"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retour à la recherche
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map(product => (
                <div key={product.id} className="relative">
                  <ProductCard
                    product={product}
                    slug={product.shop_slug}
                    addToCart={async () => handleAddToCart(product, product.shop_slug)}
                    isLoadingAddToCart={cart.isLoading && activeShopSlug === product.shop_slug}
                    cart={cart}
                  />
                  {/* Badge boutique */}
                  <div className="absolute top-2 right-2 z-10 bg-white/90 backdrop-blur-sm text-xs font-medium text-gray-700 px-2 py-1 rounded-full shadow-sm border border-gray-200">
                    {product.shop_name}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex justify-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 hover:bg-gray-50 transition-colors"
                >
                  Précédent
                </button>
                <span className="px-4 py-2">
                  Page {page} sur {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 hover:bg-gray-50 transition-colors"
                >
                  Suivant
                </button>
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Modal de confirmation */}
      <ConfirmationModal
        isOpen={showCartModal}
        onClose={() => setShowCartModal(false)}
        onConfirm={handleOpenCart}
        title="Produit ajouté !"
        message={`Le produit a été ajouté au panier de ${pendingProduct?.product?.shop_name}. Voulez-vous voir votre panier ?`}
        confirmText="Voir le panier"
        cancelText="Continuer mes achats"
        type="info"
      />

      {/* CartSidebar - Uniquement si un panier est actif */}
      {activeShopSlug && (
        <CartSidebar 
          key={activeShopSlug} 
          slug={activeShopSlug} 
          cart={cart} 
        />
      )}
    </div>
  )
}