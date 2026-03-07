'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/app/contexts/AuthContext'
import Link from 'next/link'
import { api } from '@/app/lib/api'
import Modal from './components/Modal'
import { toast } from 'react-hot-toast'  // ← AJOUTER
import { useRouter } from 'next/navigation'  // ← AJOUTER

// Interface pour les données de l'API
interface PublicShop {
  id: string
  name: string
  slug: string
  description: string | null
  category: string
  total_products: number
  total_orders?: number
  total_revenue?: number
  is_active: boolean
  created_at: string
}

interface PlatformStats {
  total_shops: number
  total_products: number
  total_orders: number
  total_revenue: number  // en euros
  total_sellers: number
}

export default function HomePage() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()  // ← AJOUTER
  const [shops, setShops] = useState<PublicShop[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [apiError, setApiError] = useState<string>('')
  const [stats, setStats] = useState<PlatformStats>({
    total_shops: 0,
    total_products: 0,
    total_orders: 0,
    total_revenue: 0,
    total_sellers: 0
  })
  const [showSellerModal, setShowSellerModal] = useState(false)

  const handleCreateShop = () => {
    if (!isAuthenticated) {
      // Utilisateur non connecté
      toast((t) => (
        <div className="flex flex-col gap-2">
          <p className="font-medium">🔐 Connexion requise</p>
          <p className="text-sm text-gray-200">Vous devez être connecté pour créer une boutique.</p>
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => {
                toast.dismiss(t.id)
                router.push('/auth/login?redirect=/seller/dashboard/create')
              }}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
            >
              Se connecter
            </button>
            <button
              onClick={() => {
                toast.dismiss(t.id)
                router.push('/auth/register')
              }}
              className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300"
            >
              S'inscrire
            </button>
          </div>
        </div>
      ), {
        duration: 8000,
        position: 'top-center',
      })
      return
    }

    // Utilisateur connecté mais pas vendeur
    if (!user?.is_seller) {
      setShowSellerModal(true)
      return
    }

    // Utilisateur déjà vendeur
    router.push('/seller/dashboard/create')
  }

  useEffect(() => {
    loadFeaturedShops()
    loadPlatformStats()
  }, [])

  const loadFeaturedShops = async () => {
    setIsLoading(true)
    setApiError('')
    
    try {
      console.log('🔄 Chargement des boutiques...')
      const response = await api.getPublicShops(6)
      console.log('📦 Réponse API:', response)
      
      if (response.error) {
        console.error('❌ Erreur API:', response.error)
        setApiError(response.error)
        setShops(getMockShops())
      } else if (response.data && Array.isArray(response.data)) {
        console.log(`✅ ${response.data.length} boutiques chargées`)
        setShops(response.data)
      } else {
        console.warn('⚠️ Données API invalides')
        setShops(getMockShops())
      }
    } catch (err: any) {
      console.error('💥 Erreur inattendue:', err)
      setApiError(err.message || 'Erreur de chargement')
      setShops(getMockShops())
    } finally {
      setIsLoading(false)
    }
  }

  const loadPlatformStats = async () => {
    try {
      // Utilisez getPublicPlatformStats() si c'est le nom correct
      const response = await api.getPlatformStats()
      if (response.data) {
        setStats({
          total_shops: response.data.total_shops,
          total_products: response.data.total_products,
          total_orders: response.data.total_orders,
          total_revenue: response.data.total_revenue,
          total_sellers: response.data.total_sellers
        })
      }
    } catch (err) {
      console.error('Erreur chargement stats:', err)
    }
  }

  const getMockShops = (): PublicShop[] => {
    return [
      {
        id: "demo-1",
        name: "Benshop (Demo)",
        slug: "benshop",
        description: "Visitez /shop/benshop pour voir les produits",
        category: "general",
        total_products: 3,
        is_active: true,
        created_at: new Date().toISOString()
      },
      {
        id: "demo-2",
        name: "TechZone",
        slug: "techzone",
        description: "Électronique et gadgets innovants",
        category: "electronique",
        total_products: 8,
        is_active: true,
        created_at: new Date().toISOString()
      },
      {
        id: "demo-3",
        name: "FashionStyle",
        slug: "fashionstyle",
        description: "Mode et vêtements tendance",
        category: "vestimentaire",
        total_products: 12,
        is_active: true,
        created_at: new Date().toISOString()
      }
    ]
  }

  const formatRevenue = (amount: number): string => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M`
    }
    if (amount >= 1000) {
      return `${(amount / 1000).toFixed(1)}k`
    }
    return amount.toString()
  }

  const getCategoryColor = (category: string) => {
    switch(category?.toLowerCase()) {
      case 'electronique': return 'bg-gradient-to-r from-blue-500 to-cyan-500'
      case 'vestimentaire': return 'bg-gradient-to-r from-purple-500 to-pink-500'
      case 'bijoux': return 'bg-gradient-to-r from-yellow-500 to-amber-500'
      case 'nourriture': return 'bg-gradient-to-r from-green-500 to-emerald-500'
      case 'maison': return 'bg-gradient-to-r from-orange-500 to-red-500'
      default: return 'bg-gradient-to-r from-gray-600 to-gray-700'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative z-10 py-8 sm:py-12 md:py-20">
            <main className="mx-auto">
              <div className="text-center">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 px-4 py-2 rounded-full mb-6 sm:mb-8 text-sm font-medium">
                  <span className="flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                  </span>
                  Plateforme 100% gratuite pour commencer
                </div>

                <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                  <span className="block">Vendez vos produits</span>
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                    sans complexité
                  </span>
                </h1>
                
                <p className="mt-4 text-lg text-gray-600 sm:text-xl max-w-2xl mx-auto">
                  Créez votre boutique en ligne professionnelle en quelques minutes. 
                  Pas de compétences techniques nécessaires.
                </p>

                {/* Stats en temps réel - AMÉLIORÉES */}
                <div className="mt-8 flex flex-wrap justify-center gap-6 sm:gap-8">
                  <div className="text-center px-4">
                    <div className="text-2xl sm:text-3xl font-bold text-gray-900">
                      {stats.total_shops.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500">Boutiques actives</div>
                  </div>
                  <div className="text-center px-4">
                    <div className="text-2xl sm:text-3xl font-bold text-gray-900">
                      {stats.total_products.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500">Produits en ligne</div>
                  </div>
                  <div className="text-center px-4">
                    <div className="text-2xl sm:text-3xl font-bold text-gray-900">
                      {stats.total_orders.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500">Commandes traitées</div>
                  </div>
                  <div className="text-center px-4">
                    <div className="text-2xl sm:text-3xl font-bold text-gray-900">
                      {formatRevenue(stats.total_revenue)}€
                    </div>
                    <div className="text-sm text-gray-500">Chiffre d'affaires</div>
                  </div>
                </div>
                
                {/* Actions principales */}
                <div className="mt-8 max-w-md mx-auto">
                  {isAuthenticated ? (
                    <div className="space-y-4">
                      <div className="text-center">
                        <p className="text-lg font-medium text-gray-900">
                          Bienvenue {user?.full_name || user?.username} !
                        </p>
                        <p className="text-gray-600 mt-1">
                          {user?.is_seller 
                            ? 'Gérez votre boutique depuis votre tableau de bord'
                            : 'Lancez votre première boutique gratuitement'}
                        </p>
                      </div>
                      
                      {user?.is_seller ? (
                        <Link
                          href="/seller/dashboard"
                          className="block w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                        >
                          📊 Accéder au tableau de bord
                        </Link>
                      ) : (
                        <Link
                          href="/seller/dashboard/create"
                          className="block w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                        >
                          🚀 Créer ma boutique gratuite
                        </Link>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Link
                          href="/auth/register"
                          className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                        >
                          Créer un compte
                        </Link>
                        <Link
                          href="/shop/all"
                          className="flex-1 px-6 py-4 bg-white border-2 border-blue-600 text-blue-600 rounded-xl font-bold text-center hover:bg-blue-50 transition-all duration-300 hover:-translate-y-1"
                        >
                          Explorer
                        </Link>
                      </div>
                      <p className="text-sm text-gray-500">
                        Déjà un compte ?{' '}
                        <Link href="/auth/login" className="text-blue-600 hover:text-blue-800 font-medium">
                          Connectez-vous
                        </Link>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>

      {/* Section Boutiques - AMÉLIORÉE */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Boutiques en vedette
            </h2>
            <p className="mt-4 text-xl text-gray-600">
              Découvrez les créateurs et entrepreneurs qui vendent sur ShopTonik
            </p>
            {shops.length > 0 && shops[0].id.startsWith('demo-') && (
              <div className="mt-2 text-sm text-gray-500">
                (Exemples de boutiques - inscrivez-vous pour voir les réelles)
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 rounded-2xl h-64"></div>
                </div>
              ))}
            </div>
          ) : apiError ? (
            <div className="text-center py-12 bg-yellow-50 rounded-2xl">
              <div className="text-yellow-600 mb-4">⚠️</div>
              <p className="text-gray-700 mb-2">Données temporairement indisponibles</p>
              <p className="text-sm text-gray-500">Utilisation des exemples de boutiques</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                {shops.map(shop => (
                  <Link
                    key={shop.id}
                    href={`/shop/${shop.slug}`}
                    className="group bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                  >
                    {/* Header avec gradient */}
                    <div className={`h-2 ${getCategoryColor(shop.category)}`}></div>
                    
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                            {shop.name}
                          </h3>
                          {shop.category && shop.category !== 'general' && (
                            <span className="inline-block mt-2 px-3 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                              {shop.category}
                            </span>
                          )}
                        </div>
                        <div className="text-2xl">
                          {shop.category === 'bijoux' ? '💎' :
                           shop.category === 'electronique' ? '📱' :
                           shop.category === 'vestimentaire' ? '👕' : '🛍️'}
                        </div>
                      </div>
                      
                      <p className="text-gray-600 mb-4 text-sm line-clamp-2">
                        {shop.description || 'Découvrez une sélection de produits uniques'}
                      </p>
                      
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div className="flex items-center text-sm text-gray-500">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z" />
                            <path fillRule="evenodd" d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd" />
                          </svg>
                          <span>
                            {shop.total_products} produit{shop.total_products !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <span className="text-blue-600 font-medium text-sm group-hover:underline flex items-center">
                          Visiter
                          <svg className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              
              <div className="text-center">
                <Link
                  href="/shop/all"
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-gray-900 to-gray-700 text-white rounded-xl font-medium hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                >
                  Voir toutes les boutiques
                  <svg className="ml-2 w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Pourquoi ShopTonik */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Simple. Professionnel. Efficace.
            </h2>
            <p className="mt-4 text-xl text-gray-600">
              Tout ce dont vous avez besoin pour vendre en ligne
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Gratuit au démarrage</h3>
              <p className="text-gray-600">
                Créez votre boutique sans frais initiaux. Payez seulement quand vous vendez.
              </p>
            </div>
            
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Paiement sécurisé</h3>
              <p className="text-gray-600">
                Transactions cryptées. L&apos;argent va directement sur votre compte.
              </p>
            </div>
            
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Installation rapide</h3>
              <p className="text-gray-600">
                Votre boutique en ligne en moins de 5 minutes. Aucune compétence technique.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            Prêt à commencer ?
          </h2>
          <p className="text-blue-100 mb-8">
            Rejoignez notre communauté d'entrepreneurs. Aucun engagement, pas de carte bancaire requise.
          </p>
          <button
            onClick={handleCreateShop}
            className="inline-block bg-white text-blue-600 hover:bg-gray-100 px-8 py-3 rounded-lg font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
          >
            {isAuthenticated ? 'Créer ma boutique' : 'Commencer gratuitement'}
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <div className="text-white font-medium mb-1">ShopTonik</div>
              <div className="text-gray-400 text-sm">Powered by Blessed Wing Tech</div>
            </div>
            
            <div className="flex items-center space-x-6">
              <Link 
                href="/privacy" 
                className="text-gray-400 hover:text-white text-sm transition-colors"
              >
                Politique de confidentialité
              </Link>
              <Link 
                href="/terms" 
                className="text-gray-400 hover:text-white text-sm transition-colors"
              >
                CGU
              </Link>
              <div className="text-gray-400 text-sm">
                © {new Date().getFullYear()} BitTonik
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Modal pour devenir vendeur */}
      <Modal
        isOpen={showSellerModal}
        onClose={() => setShowSellerModal(false)}
        onConfirm={() => {
          setShowSellerModal(false)
          router.push('/become-seller')
        }}
        title="Devenir vendeur"
        type="info"
        confirmText="Devenir vendeur"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Pour créer une boutique, vous devez d'abord devenir vendeur.
          </p>
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">Ce qui vous attend :</h4>
            <ul className="space-y-2 text-sm text-blue-700">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                Créez votre propre boutique personnalisée
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                Ajoutez et gérez vos produits facilement
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                Suivez vos commandes et votre chiffre d'affaires
              </li>
            </ul>
          </div>
          <p className="text-sm text-gray-500">
            Devenir vendeur est gratuit et ne prend que quelques minutes.
          </p>
        </div>
      </Modal>
    </div>
  )
}