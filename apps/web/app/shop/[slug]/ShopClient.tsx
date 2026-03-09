'use client'
import { Globe, Link2, Instagram, Facebook, Twitter } from 'lucide-react';
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { api } from '@/app/lib/api'
import CartSidebar from '@/app/components/CartSidebar'
import Link from 'next/link'
import { useCart } from '@/app/hooks/useCart'
import Image from 'next/image'

// ProductCard mis à jour avec tous les nouveaux champs
function ProductCard({ product, slug, addToCart, isLoadingAddToCart, cart, primaryColor, secondaryColor }: any) {
  const [localLoading, setLocalLoading] = useState(false)
  const [lastAddedProductId, setLastAddedProductId] = useState<string | null>(null)

  // Trouver la quantité de ce produit dans le panier
  const cartItem = cart.cart?.items?.find((item: any) => item.product_id === product.id)
  const quantityInCart = cartItem?.quantity || 0

  // Calculer le stock disponible réel (stock original - déjà dans le panier)    
  const availableStock = product.stock - quantityInCart

  const handleAddToCart = async () => {
    // Vérifier le stock disponible
    if (availableStock <= 0) {
      alert(`Stock insuffisant! Il ne reste que ${product.stock} unités.`)       
      return
    }

    setLocalLoading(true)
    setLastAddedProductId(product.id)

    try {
      await addToCart(slug, product.id, 1)
      console.log('Produit ajouté avec succès')
    } catch (err: any) {
      console.error('Erreur lors de l\'ajout au panier:', err)
      if (err.message?.includes('Stock') || err.message?.includes('stock') ||    
          err.message?.includes('insuffisant')) {
        alert(`Erreur: ${err.message}`)
      } else {
        alert('Erreur lors de l\'ajout au panier')
      }
    } finally {
      setLocalLoading(false)
      setTimeout(() => setLastAddedProductId(null), 1000)
    }
  }

  // Formater le prix
  const formatPrice = (priceInCents: number) => {
    return (priceInCents / 100).toFixed(2) + ' €'
  }

  // Style dynamique pour le bouton
  const buttonStyle = {
    background: `linear-gradient(135deg, ${primaryColor || '#3B82F6'} 0%, ${secondaryColor || '#8B5CF6'} 100%)`
  }

  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-200 ${
      lastAddedProductId === product.id ? 'ring-2 ring-green-500 ring-opacity-50' : ''
    }`}>
      {/* En-tête avec badges */}
      <div className="relative h-48 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center overflow-hidden">
        <Link href={`/product/${product.id}`} className="absolute inset-0 z-10">
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
        </Link>
        
        {/* Badges superposés */}
        <div className="absolute top-2 left-2 z-20 flex flex-col gap-1">
          {product.is_featured && (
            <span className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white text-xs px-2 py-1 rounded-full shadow-sm flex items-center gap-1">
              ⭐ Vedette
            </span>
          )}
          {product.has_discount && (
            <span className="bg-gradient-to-r from-red-500 to-red-600 text-white text-xs px-2 py-1 rounded-full shadow-sm">
              -{product.discount_percentage}%
            </span>
          )}
          {product.is_digital && (
            <span className="bg-gradient-to-r from-purple-500 to-purple-600 text-white text-xs px-2 py-1 rounded-full shadow-sm">
              📦 Numérique
            </span>
          )}
        </div>

        {/* Indicateur de stock */}
        {quantityInCart > 0 && (
          <div className="absolute top-2 right-2 z-20 bg-blue-500 text-white text-xs px-2 py-1 rounded-full shadow-md">
            {quantityInCart} dans le panier
          </div>
        )}

        {availableStock > 0 && availableStock <= 5 && (
          <div className="absolute bottom-2 left-2 z-20 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs px-2 py-1 rounded-full shadow-md">
            Plus que {availableStock}
          </div>
        )}

        {availableStock <= 0 && (
          <div className="absolute inset-0 z-20 bg-black bg-opacity-60 flex items-center justify-center">
            <span className="bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
              Rupture de stock
            </span>
          </div>
        )}
      </div>

      <div className="p-4">
        {/* Catégorie et vues */}
        <div className="flex justify-between items-start mb-2">
          <Link href={`/shop/${slug}/products?category=${product.category}`}>
            <span 
              className="text-xs font-medium px-2 py-1 rounded transition-colors"
              style={{ 
                backgroundColor: `${primaryColor}20`, 
                color: primaryColor || '#3B82F6' 
              }}
            >
              {product.category || 'Général'}
            </span>
          </Link>
          <div className="text-xs text-gray-500 flex items-center gap-1" title={`${product.view_count} vues`}>
            👁️ {product.view_count}
          </div>
        </div>

        {/* Nom du produit */}
        <Link href={`/product/${product.id}`}>
          <h3 
            className="font-semibold text-lg mb-2 line-clamp-2 h-14 hover:underline transition-colors"
            style={{ color: primaryColor || '#3B82F6' }}
          >
            {product.name}
          </h3>
        </Link>

        {/* Description */}
        <p className="text-gray-600 text-sm mb-3 line-clamp-2 h-10">
          {product.description || 'Pas de description'}
        </p>

        {/* Tags */}
        {product.tags && Array.isArray(product.tags) && product.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {product.tags.slice(0, 3).map((tag: any, index: number) => (
              <span
                key={index}
                className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded hover:bg-gray-200 transition-colors cursor-default"
              >
                {typeof tag === 'string' ? tag : 'Tag'}
              </span>
            ))}
            {product.tags.length > 3 && (
              <span className="text-xs text-gray-400">+{product.tags.length - 3}</span>
            )}
          </div>
        )}

        {/* Prix et stock */}
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
          <span className={`text-sm font-medium ${
            availableStock > 5 ? 'text-green-600' :
            availableStock > 0 ? 'text-orange-600' : 'text-red-600'
          }`}>
            {availableStock > 0 ?
              `${availableStock} disponible${availableStock !== 1 ? 's' : ''}` : 
              'Rupture'
            }
          </span>
        </div>

        {/* Bouton Ajouter au panier */}
        <button
          onClick={handleAddToCart}
          disabled={availableStock <= 0 || localLoading || isLoadingAddToCart}   
          className={`w-full py-3 rounded-md font-medium transition-all duration-200 relative overflow-hidden shadow-sm hover:shadow-md ${
            availableStock <= 0
              ? 'bg-gray-100 text-gray-500 cursor-not-allowed border border-gray-200'
              : localLoading
                ? 'text-white'
                : 'text-white hover:opacity-90'
          }`}
          style={availableStock > 0 ? buttonStyle : {}}
        >
          {localLoading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Ajouté !
            </span>
          ) : availableStock <= 0 ? (
            'Rupture de stock'
          ) : quantityInCart > 0 ? (
            <div className="flex items-center justify-center gap-2">
              <span>🛒</span>
              Ajouter + ({quantityInCart} déjà)
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <span>🛒</span>
              Ajouter au panier
            </div>
          )}

          {/* Effet de clic visuel */}
          {lastAddedProductId === product.id && !localLoading && (
            <div className="absolute inset-0 bg-green-400 opacity-0 animate-ping"></div>
          )}
        </button>

        {/* Lien vers la page produit */}
        <Link
          href={`/product/${product.id}`} 
          className="block text-center text-sm mt-3 hover:underline"
          style={{ color: primaryColor || '#3B82F6' }}
        >
          Voir les détails →
        </Link>
      </div>
    </div>
  )
}

export default function ShopClient({ slug }: { slug: string }) {
  const [shop, setShop] = useState<any>(null)
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([])
  const [recentProducts, setRecentProducts] = useState<any[]>([])
  const [isLoadingShop, setIsLoadingShop] = useState(true)
  const [activeTab, setActiveTab] = useState<'featured' | 'recent'>('featured')

  // UN SEUL useCart pour toute la page !
  const cart = useCart(slug)

  useEffect(() => {
    loadShop()
    loadFeaturedProducts()
    loadRecentProducts()
  }, [slug])

  const loadShop = async () => {
    try {
      const response = await api.getPublicShop(slug)
      if (response.data) {
        setShop(response.data)
      }
    } catch (err) {
      console.error('Erreur chargement boutique:', err)
    }
  }

  const loadFeaturedProducts = async () => {
    try {
      const response = await api.getPublicShopProducts(slug, {
        featured: true,
        limit: 8,
        is_active: true
      })
      if (response.data) {
        setFeaturedProducts(response.data)
      }
    } catch (err) {
      console.error('Erreur chargement produits vedettes:', err)
    }
  }

  const loadRecentProducts = async () => {
    try {
      const response = await api.getPublicShopProducts(slug, {
        sort_by: 'created_at',
        sort_order: 'desc',
        limit: 8,
        is_active: true
      })
      if (response.data) {
        setRecentProducts(response.data)
      }
    } catch (err) {
      console.error('Erreur chargement produits récents:', err)
    } finally {
      setIsLoadingShop(false)
    }
  }

  if (isLoadingShop) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center"> 
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement de la boutique...</p>     
        </div>
      </div>
    )
  }

  if (!shop) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center"> 
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🏪</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Boutique non trouvée</h1>
          <p className="text-gray-600 mb-8">Cette boutique n'existe pas ou a été supprimée.</p>     
          <Link
            href="/shop/all"
            className="inline-block px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all"
          >
            Découvrir d'autres boutiques
          </Link>
        </div>
      </div>
    )
  }

  const primaryColor = shop.primary_color || '#3B82F6'
  const secondaryColor = shop.secondary_color || '#8B5CF6'

  // Styles dynamiques
  const heroStyle = {
    background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`
  }

  const buttonStyle = {
    backgroundColor: primaryColor,
    '--tw-ring-color': primaryColor
  } as React.CSSProperties

  const outlineButtonStyle = {
    color: primaryColor,
    borderColor: primaryColor
  }

  const activeTabStyle = {
    backgroundColor: primaryColor,
    color: 'white'
  }

  const inactiveTabStyle = {
    color: primaryColor,
    borderColor: primaryColor,
    backgroundColor: 'white'
  }

  const ctaStyle = {
    background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero section avec couleurs dynamiques */}
      <div style={heroStyle} className="text-white">
        <div className="max-w-7xl mx-auto px-4 py-12 md:py-20">
          <div className="text-center">
            <div className="inline-block bg-white/20 backdrop-blur-sm rounded-full p-3 mb-6">
              <span className="text-3xl">🏪</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {shop.name}
            </h1>
            <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
              {shop.description || 'Découvrez nos produits de qualité'}
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href={`/shop/${slug}/products`}
                className="px-6 py-3 bg-white font-semibold rounded-full hover:bg-gray-100 shadow-lg hover:shadow-xl transition-all"
                style={{ color: primaryColor }}
              >
                Voir tous les produits
              </Link>
              {shop.category && (
                <span className="px-4 py-3 bg-white/20 backdrop-blur-sm rounded-full font-medium">
                  🏷️ {shop.category}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats rapides */}
      <div className="max-w-7xl mx-auto px-4 -mt-6">
        <div className="bg-white rounded-xl shadow-lg p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4">
            <div className="text-2xl font-bold mb-2" style={{ color: primaryColor }}>
              {shop.total_products || 0}
            </div>
            <div className="text-gray-600 text-sm">Produits</div>
          </div>
          <div className="text-center p-4">
            <div className="text-2xl font-bold mb-2" style={{ color: secondaryColor }}>
              {shop.total_orders || 0}
            </div>
            <div className="text-gray-600 text-sm">Commandes</div>
          </div>
          <div className="text-center p-4">
            <div className="text-2xl text-purple-600 font-bold mb-2">
              {shop.total_visitors?.toLocaleString() || 0}
            </div>
            <div className="text-gray-600 text-sm">Visiteurs</div>
          </div>
          <div className="text-center p-4">
            <div className="text-2xl text-orange-600 font-bold mb-2">
              {shop.created_at ? new Date(shop.created_at).getFullYear() : '2024'}
            </div>
            <div className="text-gray-600 text-sm">Depuis</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="max-w-7xl mx-auto px-4 mt-8">
        <nav className="flex flex-wrap gap-2 justify-center">
          <Link
            href={`/shop/${slug}`}
            className="px-4 py-2 text-white rounded-full font-medium"
            style={{ backgroundColor: primaryColor }}
          >
            Accueil
          </Link>
          <Link
            href={`/shop/${slug}/products`}
            className="px-4 py-2 bg-white border rounded-full font-medium hover:bg-gray-50"
            style={{ color: primaryColor, borderColor: primaryColor }}
          >
            Tous les produits
          </Link>
          <Link
            href={`/shop/${slug}/categories`}
            className="px-4 py-2 bg-white border rounded-full font-medium hover:bg-gray-50"
            style={{ color: primaryColor, borderColor: primaryColor }}
          >
            Catégories
          </Link>
          <Link
            href={`/shop/${slug}/about`}
            className="px-4 py-2 bg-white border rounded-full font-medium hover:bg-gray-50"
            style={{ color: primaryColor, borderColor: primaryColor }}
          >
            À propos
          </Link>
        </nav>
      </div>

      {/* Contenu principal */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Onglets produits */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('featured')}
                className="px-6 py-2 rounded-full font-medium transition-all"
                style={activeTab === 'featured' ? activeTabStyle : inactiveTabStyle}
              >
                ⭐ En vedette
              </button>
              <button
                onClick={() => setActiveTab('recent')}
                className="px-6 py-2 rounded-full font-medium transition-all"
                style={activeTab === 'recent' ? activeTabStyle : inactiveTabStyle}
              >
                🆕 Nouveautés
              </button>
            </div>
            <Link
              href={`/shop/${slug}/products`}
              className="font-medium flex items-center gap-2 hover:underline"
              style={{ color: primaryColor }}
            >
              Voir tout
              <span>→</span>
            </Link>
          </div>

          {/* Produits */}
          {activeTab === 'featured' && featuredProducts.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl shadow">
              <div className="text-5xl mb-4">⭐</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Aucun produit en vedette
              </h3>
              <p className="text-gray-600 mb-6">
                Le vendeur n'a pas encore mis de produits en avant.
              </p>
            </div>
          ) : activeTab === 'recent' && recentProducts.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl shadow">
              <div className="text-5xl mb-4">📦</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Aucun produit récent
              </h3>
              <p className="text-gray-600 mb-6">
                Cette boutique n'a pas encore ajouté de produits.
              </p>
              <Link
                href={`/shop/${slug}/products`}
                className="inline-block px-6 py-3 text-white rounded-lg hover:opacity-90"
                style={{ backgroundColor: primaryColor }}
              >
                Découvrir tous les produits
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {(activeTab === 'featured' ? featuredProducts : recentProducts)
                .slice(0, 8)
                .map(product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    slug={slug}
                    addToCart={cart.addToCart}
                    isLoadingAddToCart={cart.isLoading}
                    cart={cart}
                    primaryColor={primaryColor}
                    secondaryColor={secondaryColor}
                  />
                ))}
            </div>
          )}
        </div>

        {/* Informations boutique détaillées */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6 text-center" style={{ color: primaryColor }}>
            Pourquoi acheter chez nous ?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl mx-auto mb-4 text-white"
                   style={{ backgroundColor: primaryColor }}>
                ⚡
              </div>
              <h3 className="font-bold text-lg mb-2">Traitement rapide</h3>
              <p className="text-gray-600">Commandes préparées sous 24-48h ouvrées</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl mx-auto mb-4 text-white"
                   style={{ backgroundColor: secondaryColor }}>
                🚚
              </div>
              <h3 className="font-bold text-lg mb-2">Livraison suivie</h3>
              <p className="text-gray-600">Suivi en temps réel de votre colis</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl mx-auto mb-4 text-white"
                   style={{ backgroundColor: primaryColor }}>
                ↩️
              </div>
              <h3 className="font-bold text-lg mb-2">Retours faciles</h3>
              <p className="text-gray-600">30 jours pour changer d'avis, frais inclus</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl mx-auto mb-4 text-white"
                   style={{ backgroundColor: secondaryColor }}>
                📞
              </div>
              <h3 className="font-bold text-lg mb-2">Support dédié</h3>
              <p className="text-gray-600">Réponse sous 24h à vos questions</p>
            </div>
          </div>
        </div>

        {/* Appel à action avec couleurs dynamiques */}
        <div style={ctaStyle} className="rounded-2xl p-8 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Prêt à faire vos achats ?</h2>
          <p className="text-xl mb-6 opacity-90 max-w-2xl mx-auto">
            Découvrez notre collection complète de produits soigneusement sélectionnés.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href={`/shop/${slug}/products`}
              className="px-8 py-3 bg-white font-bold rounded-full hover:bg-gray-100 shadow-lg hover:shadow-xl transition-all"
              style={{ color: primaryColor }}
            >
              Explorer tous les produits
            </Link>
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  document.querySelector('.cart-sidebar')?.classList.add('open')
                }
              }}
              className="px-8 py-3 bg-transparent border-2 border-white text-white font-bold rounded-full hover:bg-white/10 transition-all"
            >
              Voir mon panier ({cart.cart?.total_items || 0})
            </button>
          </div>
        </div>
      </main>

      {/* Informations de contact - NOUVELLE SECTION */}
      {(shop.email || shop.phone || shop.address || shop.city || shop.country || shop.website || shop.instagram || shop.facebook || shop.twitter) && (
        <div className="max-w-7xl mx-auto px-4 mt-8">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-6 text-center" style={{ color: primaryColor }}>
              📞 Contact & Informations
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Contact */}
              {(shop.email || shop.phone || shop.address || shop.city || shop.country) && (
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <span style={{ color: primaryColor }}>📍</span>
                    Nous contacter
                  </h3>
                  <div className="space-y-3">
                    {shop.email && (
                      <div className="flex items-center gap-3">
                        <span className="text-gray-400">✉️</span>
                        <a 
                          href={`mailto:${shop.email}`}
                          style={{ color: primaryColor }}
                          className="hover:underline"
                        >
                          {shop.email}
                        </a>
                      </div>
                    )}
                    {shop.phone && (
                      <div className="flex items-center gap-3">
                        <span className="text-gray-400">📱</span>
                        <a 
                          href={`tel:${shop.phone}`}
                          className="text-gray-700 hover:underline"
                          style={{ '--tw-hover-color': primaryColor } as React.CSSProperties}
                        >
                          {shop.phone}
                        </a>
                      </div>
                    )}
                    {(shop.address || shop.city || shop.country) && (
                      <div className="flex items-start gap-3">
                        <span className="text-gray-400 mt-1">🏠</span>
                        <div>
                          {shop.address && <p className="text-gray-700">{shop.address}</p>}
                          {(shop.city || shop.country) && (
                            <p className="text-gray-600">
                              {shop.city}{shop.city && shop.postal_code ? ` ${shop.postal_code}` : ''}
                              {shop.city && shop.country ? ', ' : ''}
                              {shop.country}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Réseaux sociaux & Site web */}
              {(shop.website || shop.instagram || shop.facebook || shop.twitter) && (
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <span style={{ color: secondaryColor }}>🌐</span>
                    Suivez-nous
                  </h3>
                  <div className="space-y-3">
                    {shop.website && (
                      <div className="flex items-center gap-3">
                        <Link2 className="w-5 h-5 text-gray-400" />
                        <a 
                          href={shop.website.startsWith('http') ? shop.website : `https://${shop.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: primaryColor }}
                          className="hover:underline"
                        >
                          Site web
                        </a>
                      </div>
                    )}
                    {shop.instagram && (
                      <div className="flex items-center gap-3">
                        <Instagram className="w-5 h-5 text-pink-500" />
                        <a 
                          href={`https://instagram.com/${shop.instagram.replace('@', '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-pink-600 hover:text-pink-700 hover:underline"
                        >
                          {shop.instagram}
                        </a>
                      </div>
                    )}
                    {shop.facebook && (
                      <div className="flex items-center gap-3">
                        <Facebook className="w-5 h-5 text-blue-600" />
                        <a 
                          href={shop.facebook.includes('facebook.com') ? shop.facebook : `https://facebook.com/${shop.facebook}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 hover:underline"
                        >
                          {shop.facebook.includes('facebook.com') ? 'Facebook' : shop.facebook}
                        </a>
                      </div>
                    )}
                    {shop.twitter && (
                      <div className="flex items-center gap-3">
                        <Twitter className="w-5 h-5 text-blue-400" />
                        <a 
                          href={`https://twitter.com/${shop.twitter.replace('@', '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-500 hover:underline"
                        >
                          {shop.twitter}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* À propos de la boutique */}
            {shop.description && (
              <div className="mt-8 pt-8 border-t border-gray-200">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <span style={{ color: secondaryColor }}>🏪</span>
                  À propos de {shop.name}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {shop.description}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Panier flottant */}
      <CartSidebar slug={slug} cart={cart} />
    </div>
  )
}
