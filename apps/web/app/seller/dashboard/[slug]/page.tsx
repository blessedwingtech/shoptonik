'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/app/lib/api'

export default function ShopDashboard() {
  const params = useParams()
  const router = useRouter()
  const shopSlug = params.slug as string

  const [shop, setShop] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)
  const [recentProducts, setRecentProducts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    if (shopSlug) {
      loadShopData()
    }
  }, [shopSlug])

  const loadShopData = async () => {
    setIsLoading(true)
    try {
      // Charger les infos de la boutique
      const shopResponse = await api.getShopBySlug(shopSlug)
      if (shopResponse.data) {
        setShop(shopResponse.data)
      } else {
        // Rediriger si boutique non trouvée
        router.push('/seller/dashboard')
        return
      }

      // Charger les statistiques
      const statsResponse = await api.getShopStats(shopSlug)
      if (statsResponse.data?.stats) {
        setStats(statsResponse.data.stats)
      }

      // Charger les produits récents
      const productsResponse = await api.getShopProducts(shopSlug, {
        limit: 5,
        sort_by: 'created_at',
        sort_order: 'desc'
      })
      if (productsResponse.data) {
        setRecentProducts(productsResponse.data)
      }
    } catch (err) {
      console.error('Erreur chargement dashboard:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const refreshData = () => {
    loadShopData()
  }

  // Fonction pour formater le prix
  // const formatPrice = (price: number) => {
  //   return (price / 100).toFixed(2) + ' €'
  // }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center"> 
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement du dashboard...</p>       
        </div>
      </div>
    )
  }

  if (!shop) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center"> 
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Boutique non trouvée</h2>      
          <Link
            href="/seller/dashboard"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            Retour au tableau de bord
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header avec navigation */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Link
                  href="/seller/dashboard"
                  className="text-gray-500 hover:text-gray-700"
                >
                  ← Retour
                </Link>
                <h1 className="text-3xl font-bold text-gray-900">
                  {shop.name}
                </h1>
              </div>
              <p className="text-gray-600">
                {shop.description || 'Tableau de bord de votre boutique'}        
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={refreshData}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                ↻ Actualiser
              </button>
              <Link
                href={`/shop/${shopSlug}`}
                target="_blank"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
              >
                Voir la boutique
              </Link>
            </div>
          </div>

          {/* Navigation tabs */}
          <div className="mt-6 border-b border-gray-200">
            <nav className="flex space-x-8 overflow-x-auto">
              {['overview', 'products', 'orders', 'analytics', 'settings'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-1 py-4 text-sm font-medium border-b-2 whitespace-nowrap ${
                    activeTab === tab
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab === 'overview' && '📊 Vue d\'ensemble'}
                  {tab === 'products' && '📦 Produits'}
                  {tab === 'orders' && '📋 Commandes'}
                  {tab === 'analytics' && '📈 Analytics'}
                  {tab === 'settings' && '⚙️ Paramètres'}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Vue d'ensemble */}
        {activeTab === 'overview' && (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow p-6 border-l-4 border-blue-500">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-700">Produits</h3>      
                  <span className="text-2xl">📦</span>
                </div>
                <p className="text-3xl font-bold">{stats?.total_products || 0}</p>
                <Link
                  href={`/seller/products?shop=${shopSlug}`}
                  className="text-blue-600 text-sm hover:text-blue-700 mt-2 inline-block"
                >
                  Gérer les produits →
                </Link>
              </div>

              <div className="bg-white rounded-xl shadow p-6 border-l-4 border-green-500">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-700">Commandes</h3>     
                  <span className="text-2xl">📋</span>
                </div>
                <p className="text-3xl font-bold">{stats?.total_orders || 0}</p> 
                <Link
                  href={`/seller/orders?shop=${shopSlug}`}
                  className="text-green-600 text-sm hover:text-green-700 mt-2 inline-block"
                >
                  Voir les commandes →
                </Link>
              </div>

              <div className="bg-white rounded-xl shadow p-6 border-l-4 border-purple-500">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-700">Visiteurs</h3>     
                  <span className="text-2xl">👁️</span>
                </div>
                <p className="text-3xl font-bold">{stats?.total_visitors?.toLocaleString() || 0}</p>
                <div className="text-gray-500 text-sm mt-2">
                  {stats?.conversion_rate ? `${stats.conversion_rate}% taux de conversion` : 'Aucune donnée'}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow p-6 border-l-4 border-orange-500">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-700">Revenu</h3>        
                  <span className="text-2xl">💰</span>
                </div>
                <p className="text-3xl font-bold">
                  {stats?.total_revenue?.toFixed(2) || "0.00"}€
                </p>
                <div className="text-gray-500 text-sm mt-2">
                  {shop.created_at && `Depuis ${new Date(shop.created_at).toLocaleDateString()}`}
                </div>
              </div>
              <div className="bg-white rounded-xl shadow p-6 border-l-4 border-teal-500">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-700">Valeur du stock</h3>
                  <span className="text-2xl">📦</span>
                </div>
                <p className="text-3xl font-bold">
                  {stats?.stock_value?.toFixed(2) || "0.00"}€
                </p>
                <p className="text-gray-500 text-sm mt-2">
                  Basé sur {stats?.total_products || 0} produits
                </p>
              </div>
            </div>

            {/* Produits récents et Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Produits récents */}
              <div className="bg-white rounded-xl shadow p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold">Produits récents</h2>
                  <Link
                    href={`/seller/products?shop=${shopSlug}`}
                    className="text-blue-600 text-sm hover:text-blue-700"
                  >
                    Voir tous →
                  </Link>
                </div>
                {recentProducts.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-gray-400 mb-4">📦</div>
                    <p className="text-gray-500">Aucun produit pour l'instant</p>
                    <Link
                      href={`/seller/products?shop=${shopSlug}`}
                      className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                    >
                      Créer votre premier produit
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentProducts.map(product => (
                      <div key={product.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          {product.images && product.images.length > 0 ? (
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className="h-12 w-12 rounded object-cover mr-3"
                            />
                          ) : (
                            <div className="h-12 w-12 bg-gray-200 rounded flex items-center justify-center mr-3">
                              <span className="text-gray-400">📦</span>
                            </div>
                          )}
                          <div>
                            <h4 className="font-medium text-gray-900">{product.name}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-sm font-medium text-green-600">
                                {product.formatted_price}
                              </span>
                              {product.has_discount && (
                                <span className="text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded">
                                  -{product.discount_percentage}%
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            product.is_active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {product.is_active ? 'Actif' : 'Inactif'}
                          </span>
                          <Link
                            href={`/product/${product.id}`}
                            target="_blank"
                            className="text-blue-600 hover:text-blue-700 text-sm"
                            title="Voir en boutique"
                          >
                            👁️
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-xl shadow p-6">
                <h2 className="text-xl font-bold mb-6">Actions rapides</h2>        
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Link
                    href={`/seller/products?shop=${shopSlug}`}
                    className="p-4 border-2 border-dashed border-blue-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 text-center transition-colors flex flex-col items-center justify-center"
                  >
                    <div className="text-2xl mb-2">➕</div>
                    <div className="font-medium">Ajouter produit</div>
                  </Link>

                  <Link
                    href={`/seller/products?shop=${shopSlug}`}
                    className="p-4 border-2 border-dashed border-green-300 rounded-lg hover:border-green-500 hover:bg-green-50 text-center transition-colors flex flex-col items-center justify-center"
                  >
                    <div className="text-2xl mb-2">✏️</div>
                    <div className="font-medium">Gérer produits</div>
                  </Link>

                  <Link
                    href={`/seller/orders?shop=${shopSlug}`}
                    className="p-4 border-2 border-dashed border-orange-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 text-center transition-colors flex flex-col items-center justify-center"
                  >
                    <div className="text-2xl mb-2">📋</div>
                    <div className="font-medium">Voir commandes</div>
                  </Link>

                  <Link
                    href={`/seller/dashboard/${shopSlug}?tab=analytics`}
                    onClick={() => setActiveTab('analytics')}
                    className="p-4 border-2 border-dashed border-purple-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 text-center transition-colors flex flex-col items-center justify-center"
                  >
                    <div className="text-2xl mb-2">📈</div>
                    <div className="font-medium">Analytics</div>
                  </Link>
                  <Link
                    href={`/seller/dashboard/${shopSlug}/finances`}
                    className="p-4 border-2 border-dashed border-teal-300 rounded-lg hover:border-teal-500 hover:bg-teal-50 text-center transition-colors flex flex-col items-center justify-center"
                  >
                    <div className="text-2xl mb-2">💰</div>
                    <div className="font-medium">Finances</div>
                  </Link>
                </div>
              </div>
            </div>

            {/* Shop Info */}
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-xl font-bold mb-4">Informations boutique</h2>  
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="mb-3">
                    <p className="text-sm text-gray-500">Nom de la boutique</p>  
                    <p className="font-medium text-lg">{shop.name}</p>
                  </div>
                  <div className="mb-3">
                    <p className="text-sm text-gray-500">URL de la boutique</p>  
                    <Link
                      href={`/shop/${shop.slug}`}
                      target="_blank"
                      className="font-medium text-blue-600 hover:text-blue-700"  
                    >
                      shoptonik.com/shop/{shop.slug}
                    </Link>
                  </div>
                </div>
                <div>
                  <div className="mb-3">
                    <p className="text-sm text-gray-500">Catégorie</p>
                    <p className="font-medium">{shop.category || 'Non spécifiée'}</p>
                  </div>
                  <div className="mb-3">
                    <p className="text-sm text-gray-500">Date de création</p>    
                    <p className="font-medium">
                      {new Date(shop.created_at).toLocaleDateString('fr-FR', {   
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
{/* Section Contact Info dans le tableau de bord */}
<div className="bg-white rounded-xl shadow p-6 mb-8">
  <h2 className="text-xl font-bold mb-4">📞 Informations de contact</h2>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {shop.email && (
      <div>
        <p className="text-sm text-gray-500">Email</p>
        <p className="font-medium">{shop.email}</p>
      </div>
    )}
    {shop.phone && (
      <div>
        <p className="text-sm text-gray-500">Téléphone</p>
        <p className="font-medium">{shop.phone}</p>
      </div>
    )}
    {shop.address && (
      <div>
        <p className="text-sm text-gray-500">Adresse</p>
        <p className="font-medium">{shop.address}</p>
      </div>
    )}
    {(shop.city || shop.country) && (
      <div>
        <p className="text-sm text-gray-500">Localisation</p>
        <p className="font-medium">
          {shop.city}{shop.city && shop.country ? ', ' : ''}{shop.country}
        </p>
      </div>
    )}
    {shop.website && (
      <div className="md:col-span-2">
        <p className="text-sm text-gray-500">Site web</p>
        <a 
          href={shop.website} 
          target="_blank" 
          rel="noopener noreferrer"
          className="font-medium text-blue-600 hover:text-blue-700"
        >
          {shop.website}
        </a>
      </div>
    )}
  </div>
  
  {/* Réseaux sociaux */}
  {(shop.instagram || shop.facebook || shop.twitter) && (
    <div className="mt-6">
      <h3 className="text-lg font-semibold mb-3">📱 Réseaux sociaux</h3>
      <div className="flex space-x-4">
        {shop.instagram && (
          <a 
            href={`https://instagram.com/${shop.instagram.replace('@', '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-pink-600 hover:text-pink-700"
          >
            Instagram: {shop.instagram}
          </a>
        )}
        {shop.facebook && (
          <a 
            href={`https://facebook.com/${shop.facebook}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-700"
          >
            Facebook
          </a>
        )}
        {shop.twitter && (
          <a 
            href={`https://twitter.com/${shop.twitter.replace('@', '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-500"
          >
            Twitter: {shop.twitter}
          </a>
        )}
      </div>
    </div>
  )}
</div>


{/* Section "À propos" - Nouveau */}
{(
  shop.about_story || 
  shop.about_mission || 
  shop.about_values || 
  shop.about_commitments
) && (
  <div className="bg-white rounded-xl shadow p-6 mb-8">
    <h2 className="text-xl font-bold mb-4">📖 Page "À propos"</h2>
    <div className="space-y-6">
      {shop.about_story && (
        <div>
          <h3 className="font-semibold text-gray-700 mb-2">Notre histoire</h3>
          <p className="text-gray-600 whitespace-pre-line">{shop.about_story}</p>
        </div>
      )}
      {shop.about_mission && (
        <div>
          <h3 className="font-semibold text-gray-700 mb-2">Notre mission</h3>
          <p className="text-gray-600 whitespace-pre-line">{shop.about_mission}</p>
        </div>
      )}
      {shop.about_values && (
        <div>
          <h3 className="font-semibold text-gray-700 mb-2">Nos valeurs</h3>
          <p className="text-gray-600 whitespace-pre-line">{shop.about_values}</p>
        </div>
      )}
      {shop.about_commitments && (
        <div>
          <h3 className="font-semibold text-gray-700 mb-2">Nos engagements</h3>
          <p className="text-gray-600 whitespace-pre-line">{shop.about_commitments}</p>
        </div>
      )}
    </div>
  </div>
)}

{/* Informations pratiques - Nouveau */}
{(
  shop.business_hours || 
  shop.shipping_info || 
  shop.return_policy || 
  shop.payment_methods
) && (
  <div className="bg-white rounded-xl shadow p-6 mb-8">
    <h2 className="text-xl font-bold mb-4">📋 Informations pratiques</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {shop.business_hours && (
        <div>
          <h3 className="font-semibold text-gray-700 mb-2">Horaires d'ouverture</h3>
          <p className="text-gray-600 whitespace-pre-line">{shop.business_hours}</p>
        </div>
      )}
      {shop.shipping_info && (
        <div>
          <h3 className="font-semibold text-gray-700 mb-2">Livraison</h3>
          <p className="text-gray-600 whitespace-pre-line">{shop.shipping_info}</p>
        </div>
      )}
      {shop.return_policy && (
        <div>
          <h3 className="font-semibold text-gray-700 mb-2">Retours</h3>
          <p className="text-gray-600 whitespace-pre-line">{shop.return_policy}</p>
        </div>
      )}
      {shop.payment_methods && (
        <div>
          <h3 className="font-semibold text-gray-700 mb-2">Paiements acceptés</h3>
          <p className="text-gray-600 whitespace-pre-line">{shop.payment_methods}</p>
        </div>
      )}
    </div>
  </div>
)}

{/* Images "À propos" - Nouveau */}
{(shop.about_image1_url || shop.about_image2_url) && (
  <div className="bg-white rounded-xl shadow p-6 mb-8">
    <h2 className="text-xl font-bold mb-4">🖼️ Images de présentation</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {shop.about_image1_url && (
        <div>
          <p className="text-sm text-gray-500 mb-2">Image 1</p>
          <div className="relative h-48 rounded-lg overflow-hidden">
            <img
              src={shop.about_image1_url}
              alt="Présentation boutique"
              className="w-full h-full object-cover"
            />
          </div>
          <p className="text-xs text-gray-400 mt-2 truncate">{shop.about_image1_url}</p>
        </div>
      )}
      {shop.about_image2_url && (
        <div>
          <p className="text-sm text-gray-500 mb-2">Image 2</p>
          <div className="relative h-48 rounded-lg overflow-hidden">
            <img
              src={shop.about_image2_url}
              alt="Présentation produits"
              className="w-full h-full object-cover"
            />
          </div>
          <p className="text-xs text-gray-400 mt-2 truncate">{shop.about_image2_url}</p>
        </div>
      )}
    </div>
  </div>
)}

        {/* Onglet Produits */}
        {activeTab === 'products' && (
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Produits</h2>
                <p className="text-gray-600 mt-1">
                  Gérez les produits de {shop.name}
                </p>
              </div>
              <Link
                href={`/seller/products?shop=${shopSlug}`}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
              >
                Gérer tous les produits →
              </Link>
            </div>
            
            <div className="mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="text-sm text-blue-700">Produits actifs</div>
                  <div className="text-2xl font-bold mt-1">
                    {recentProducts.filter(p => p.is_active).length}
                  </div>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="text-sm text-green-700">En vedette</div>
                  <div className="text-2xl font-bold mt-1">
                    {recentProducts.filter(p => p.is_featured).length}
                  </div>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="text-sm text-purple-700">Numériques</div>
                  <div className="text-2xl font-bold mt-1">
                    {recentProducts.filter(p => p.is_digital).length}
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center py-8">
              <div className="text-gray-400 text-4xl mb-4">📦</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Gestion complète des produits
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Utilisez la page dédiée pour gérer tous vos produits, ajouter des images, gérer les stocks et configurer les variations.
              </p>
              <Link
                href={`/seller/products?shop=${shopSlug}`}
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Accéder à la gestion des produits
              </Link>
            </div>
          </div>
        )}

        {/* Autres onglets */}
        {activeTab === 'orders' && (
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-bold mb-4">📋 Commandes</h2>
            <p className="text-gray-600">
              Cette section sera bientôt disponible. En attendant, utilisez le lien dans le menu principal.
            </p>
            <Link
              href={`/seller/orders?shop=${shopSlug}`}
              className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Voir les commandes →
            </Link>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-bold mb-4">📈 Analytics</h2>
            <p className="text-gray-600">
              Statistiques détaillées de votre boutique. Section en développement.
            </p>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-bold mb-4">⚙️ Paramètres</h2>
            <p className="text-gray-600">
              Configurez les paramètres de votre boutique. Section en développement.
            </p>
            <Link
              href={`/seller/dashboard/${shopSlug}/settings`}
              className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Accéder aux paramètres →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
