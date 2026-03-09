'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/app/lib/api'

// Types
interface Shop {
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

  primary_color: string
  secondary_color: string
  
  created_at: string
  updated_at: string
}

interface Stats {
  totalProducts: number
  totalCategories: number
  averagePrice: number
  inStock: number
  digitalProducts: number
  featuredProducts: number
  categories: [string, number][]
}

export default function AboutPage() {
  const params = useParams()
  const slug = params.slug as string

  const [shop, setShop] = useState<Shop | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeImage, setActiveImage] = useState<string | null>(null)
  

  useEffect(() => {
    loadShopInfo()
  }, [slug])

  // const loadShopInfo = async () => {
  //   try {
  //     const response = await api.getPublicShop(slug)
  //     if (response.data) {
  //       setShop(response.data)

  //       // Charger les produits pour les stats détaillées
  //       const productsResponse = await api.getPublicShopProducts(slug, { limit: 100 })
  //       if (productsResponse.data) {
  //         const products = productsResponse.data

  //         const activeProducts = products.filter(p => p.is_active)
  //         const totalPrice = activeProducts.reduce((sum, p) => sum + (p.price / 100), 0)

  //         const categories = activeProducts.reduce((acc, product) => {
  //           if (product.category) {
  //             acc[product.category] = (acc[product.category] || 0) + 1
  //           }
  //           return acc
  //         }, {} as Record<string, number>)

  //         setStats({
  //           totalProducts: activeProducts.length,
  //           totalCategories: Object.keys(categories).length,
  //           averagePrice: activeProducts.length > 0 ? totalPrice / activeProducts.length : 0,
  //           inStock: activeProducts.filter(p => p.stock > 0).length,
  //           digitalProducts: products.filter(p => p.is_digital).length,
  //           featuredProducts: products.filter(p => p.is_featured).length,
  //           categories: Object.entries(categories)
  //             .sort(([,a], [,b]) => b - a)
  //             .slice(0, 5)
  //         })
  //       }
  //     }
  //   } catch (err) {
  //     console.error('Erreur chargement boutique:', err)
  //   } finally {
  //     setIsLoading(false)
  //   }
  // }

  const loadShopInfo = async () => {
  try {
    const response = await api.getPublicShop(slug)
    if (response.data) {
      setShop(response.data)

      // Charger les produits pour les stats
      const productsResponse = await api.getPublicShopProducts(slug, { limit: 100 })
      if (productsResponse.data) {
        const products = productsResponse.data
  console.log('📦 Premier produit:', products[0])
  console.log('📦 Clés du premier produit:', Object.keys(products[0]))
  
  // Vérification spécifique
  products.forEach((p, i) => {
    console.log(`Produit ${i}: is_featured =`, p.is_featured, 'type =', typeof p.is_featured)
  })

        // Tous les produits sont actifs (l'API ne filtre que les actifs)
        const activeProducts = products
        const totalPrice = activeProducts.reduce((sum, p) => sum + (p.price / 100), 0)

        // Compter les catégories
        const categories = activeProducts.reduce((acc, product) => {
          if (product.category) {
            acc[product.category] = (acc[product.category] || 0) + 1
          }
          return acc
        }, {} as Record<string, number>)

        setStats({
          totalProducts: activeProducts.length,
          totalCategories: Object.keys(categories).length,
          averagePrice: activeProducts.length > 0 ? totalPrice / activeProducts.length : 0,
          inStock: activeProducts.filter(p => p.stock > 0).length, 
          digitalProducts: products.filter(p => p.is_digital).length,
          featuredProducts: products.filter(p => p.is_featured).length,
          categories: Object.entries(categories)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
        })
      }
    }
  } catch (err) {
    console.error('Erreur chargement boutique:', err)
  } finally {
    setIsLoading(false)
  }
}

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center py-20">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>        
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-8 w-8 bg-blue-600 rounded-full animate-pulse"></div>
              </div>
            </div>
            <p className="mt-6 text-gray-600 font-medium">Chargement de la boutique...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!shop) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-12 text-center border border-gray-100">
            <div className="text-7xl mb-6 animate-bounce">🏪</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Boutique non trouvée
            </h1>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Cette boutique n'existe pas ou a été supprimée.
            </p>
            <Link
              href="/shop/all"
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"     
            >
              <span>Explorer les boutiques</span>
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Navigation améliorée */}
        <nav className="mb-8 flex items-center space-x-2 text-sm">
          <Link
            href={`/shop/${slug}`}
            className="text-gray-500 hover:text-gray-700 transition-colors flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Accueil
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-gray-900 font-medium bg-white px-3 py-1 rounded-full shadow-sm">
            À propos
          </span>
        </nav>

        {/* Hero Section améliorée */}
        {/* Hero Section avec couleurs personnalisées */}
        <div 
          className="relative mb-12 overflow-hidden rounded-3xl"
          style={{
            background: `linear-gradient(135deg, ${shop.primary_color || '#3B82F6'} 0%, ${shop.secondary_color || '#8B5CF6'} 100%)`
          }}
        >      
          <div className="absolute inset-0 bg-black opacity-10"></div>
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-white opacity-10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-white opacity-10 rounded-full blur-3xl"></div>

          <div className="relative p-12 text-center">
            {shop.logo_url && (
              <div className="mb-6 inline-block">
                <img
                  src={shop.logo_url}
                  alt={shop.name}
                  className="h-24 w-24 rounded-2xl shadow-2xl border-4 border-white/50 object-cover"
                />
              </div>
            )}
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 tracking-tight">
              {shop.name}
            </h1>
            <p className="text-xl text-white/90 max-w-3xl mx-auto leading-relaxed">
              {shop.description || 'Bienvenue dans notre univers'}
            </p>
            {shop.category && (
              <div className="mt-6">
                <span className="inline-flex items-center px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-full text-sm font-medium">
                  <span className="mr-2">🏷️</span>
                  {shop.category}
                </span>
              </div>
            )}
          </div>
        </div>
        

        {/* Stats Cards - avec vérification */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            <div className="bg-white rounded-2xl shadow-lg p-6 transform hover:scale-105 transition-all duration-200 hover:shadow-xl">
              <div className="text-3xl mb-2">📦</div>
              <div className="text-2xl font-bold text-gray-900">{stats.totalProducts}</div>
              <div className="text-sm text-gray-500">Produits</div>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-6 transform hover:scale-105 transition-all duration-200 hover:shadow-xl">
              <div className="text-3xl mb-2">🏷️</div>
              <div className="text-2xl font-bold text-gray-900">{stats.totalCategories}</div>
              <div className="text-sm text-gray-500">Catégories</div>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-6 transform hover:scale-105 transition-all duration-200 hover:shadow-xl">
              <div className="text-3xl mb-2">⭐</div>
              <div className="text-2xl font-bold text-gray-900">{stats.featuredProducts}</div>
              <div className="text-sm text-gray-500">En vedette</div>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-6 transform hover:scale-105 transition-all duration-200 hover:shadow-xl">
              <div className="text-3xl mb-2">💰</div>
              <div className="text-2xl font-bold text-gray-900">{stats.averagePrice.toFixed(2)}€</div>
              <div className="text-sm text-gray-500">Prix moyen</div>
            </div>
          </div>
        )}

        {/* Grille principale */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Colonne principale - 2/3 */}
          <div className="lg:col-span-2 space-y-8">
            {/* Galerie d'images */}
            {(shop.about_image1_url || shop.about_image2_url) && (
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="p-8 border-b border-gray-100">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                    <span className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-2xl p-3 rounded-xl mr-4 shadow-lg">
                      📸
                    </span>
                    Notre univers en images
                  </h2>
                </div>
                <div className="p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {shop.about_image1_url && (
                      <div className="group cursor-pointer" onClick={() => setActiveImage(shop.about_image1_url!)}>
                        <div className="relative h-72 rounded-xl overflow-hidden shadow-lg">
                          <img
                            src={shop.about_image1_url}
                            alt="Présentation boutique"
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          <div className="absolute bottom-4 left-4 text-white transform translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
                            <p className="font-medium">Cliquez pour agrandir</p>
                          </div>
                        </div>
                      </div>
                    )}
                    {shop.about_image2_url && (
                      <div className="group cursor-pointer" onClick={() => setActiveImage(shop.about_image2_url!)}>
                        <div className="relative h-72 rounded-xl overflow-hidden shadow-lg">
                          <img
                            src={shop.about_image2_url}
                            alt="Ambiance boutique"
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          <div className="absolute bottom-4 left-4 text-white transform translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
                            <p className="font-medium">Cliquez pour agrandir</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Notre histoire */}
            {shop.about_story && (
              <div className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-shadow">
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-3xl">
                      📖
                    </div>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Notre histoire</h2>
                    <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                      {shop.about_story}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Notre mission */}
            {shop.about_mission && (
              <div className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-shadow">
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center text-3xl">
                      🎯
                    </div>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Notre mission</h2>
                    <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                      {shop.about_mission}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Nos valeurs */}
            {shop.about_values && (
              <div className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-shadow">
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center text-3xl">
                      💎
                    </div>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Nos valeurs</h2>
                    <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                      {shop.about_values}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Nos engagements */}
            {shop.about_commitments && (
              <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-2xl shadow-xl p-8 border border-red-100">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <span className="bg-red-500 text-white p-3 rounded-xl mr-4 text-2xl shadow-lg">
                    🤝
                  </span>
                  Nos engagements
                </h2>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {shop.about_commitments}
                </p>
              </div>
            )}
          </div>

          {/* Sidebar - 1/3 */}
          <div className="space-y-6">
            {/* Contact Card */}
            {(shop.email || shop.phone || shop.address || shop.website) && (
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6">
                  <h3 className="text-xl font-bold text-white flex items-center">
                    <span className="text-2xl mr-3">📞</span>
                    Contact
                  </h3>
                </div>

                <div className="p-6 space-y-4">
                  {shop.email && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Email</p>
                      <a
                        href={`mailto:${shop.email}`}
                        className="text-blue-600 hover:text-blue-700 font-medium inline-flex items-center group"
                      >
                        {shop.email}
                        <svg className="w-4 h-4 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </div>
                  )}

                  {shop.phone && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Téléphone</p>
                      <a
                        href={`tel:${shop.phone}`}
                        className="text-gray-900 font-medium hover:text-blue-600 transition-colors"
                      >
                        {shop.phone}
                      </a>
                    </div>
                  )}

                  {(shop.address || shop.city || shop.country) && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Adresse</p>
                      <address className="not-italic text-gray-900 font-medium leading-relaxed">
                        {shop.address && <div>{shop.address}</div>}
                        <div>
                          {shop.city}{shop.postal_code && `, ${shop.postal_code}`}
                        </div>
                        {shop.country && <div>{shop.country}</div>}
                      </address>
                    </div>
                  )}

                  {shop.website && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Site web</p>
                      <a
                        href={shop.website.startsWith('http') ? shop.website : `https://${shop.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 font-medium inline-flex items-center group"
                      >
                        {shop.website.replace(/^https?:\/\//, '')}
                        <svg className="w-4 h-4 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </div>
                  )}
                </div>

                {/* Réseaux sociaux */}
                {(shop.instagram || shop.facebook || shop.twitter) && (
                  <div className="border-t border-gray-100 p-6">
                    <p className="text-sm font-medium text-gray-700 mb-4">Suivez-nous</p>
                    <div className="flex flex-wrap gap-4">
                      {shop.instagram && (
                        <a
                          href={`https://instagram.com/${shop.instagram.replace('@', '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white hover:scale-110 transition-transform"
                          title="Instagram"
                        >
                          📸
                        </a>
                      )}
                      {shop.facebook && (
                        <a
                          href={shop.facebook.includes('facebook.com') ? shop.facebook : `https://facebook.com/${shop.facebook}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white hover:scale-110 transition-transform"
                          title="Facebook"
                        >
                          👍
                        </a>
                      )}
                      {shop.twitter && (
                        <a
                          href={`https://twitter.com/${shop.twitter.replace('@', '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-10 h-10 bg-black rounded-xl flex items-center justify-center text-white hover:scale-110 transition-transform"
                          title="Twitter/X"
                        >
                          🐦
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Informations pratiques */}
            {(shop.business_hours || shop.shipping_info || shop.return_policy || shop.payment_methods) && (
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="bg-gradient-to-r from-green-600 to-green-700 p-6">
                  <h3 className="text-xl font-bold text-white flex items-center">
                    <span className="text-2xl mr-3">⚙️</span>
                    Infos pratiques
                  </h3>
                </div>

                <div className="p-6 space-y-4">
                  {shop.business_hours && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Horaires</p>
                      <p className="text-gray-900 font-medium whitespace-pre-line">{shop.business_hours}</p>
                    </div>
                  )}
                  {shop.shipping_info && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Livraison</p>
                      <p className="text-gray-700 whitespace-pre-line">{shop.shipping_info}</p>
                    </div>
                  )}
                  {shop.return_policy && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Retours</p>
                      <p className="text-gray-700 whitespace-pre-line">{shop.return_policy}</p>
                    </div>
                  )}
                  {shop.payment_methods && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Paiement</p>
                      <p className="text-gray-700 whitespace-pre-line">{shop.payment_methods}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* CTA avec couleurs personnalisées */}
            <div 
              className="rounded-2xl shadow-xl p-8 text-white relative overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${shop.primary_color || '#3B82F6'} 0%, ${shop.secondary_color || '#8B5CF6'} 100%)`
              }}
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-white opacity-10 rounded-full -mr-20 -mt-20"></div>
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-white opacity-10 rounded-full -ml-20 -mb-20"></div>

              <div className="relative">
                <div className="text-5xl mb-4">✨</div>
                <h3 className="text-2xl font-bold mb-3">Prêt à commander ?</h3>
                <p className="text-white/90 mb-8 leading-relaxed">
                  Découvrez notre sélection de produits et vivez une expérience unique.
                </p>

                <div className="space-y-3">
                  <Link
                    href={`/shop/${slug}/products`}
                    className="block w-full bg-white text-center py-4 rounded-xl font-bold transform hover:scale-105 transition-all duration-200"
                    style={{ color: shop.primary_color || '#3B82F6' }}
                  >
                    Voir tous les produits
                  </Link>
                  <Link
                    href={`/shop/${slug}`}
                    className="block w-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 text-center py-4 rounded-xl font-bold transform hover:scale-105 transition-all duration-200 border border-white/30"
                  >
                    Retour à l'accueil
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center">
          <div className="inline-flex items-center px-6 py-3 bg-white rounded-full shadow-md">
            <span className="text-gray-400 mr-2">✨</span>
            <p className="text-gray-600">
              Boutique active depuis {new Date(shop.created_at).toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
        </footer>
      </div>

      {/* Modal pour agrandir les images */}
      {activeImage && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setActiveImage(null)}
        >
          <div className="relative max-w-5xl w-full h-full flex items-center">
            <img
              src={activeImage}
              alt="Agrandissement"
              className="w-full h-auto max-h-[90vh] object-contain rounded-2xl"
            />
            <button
              onClick={() => setActiveImage(null)}
              className="absolute top-4 right-4 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
