'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { api } from '@/app/lib/api'

// Catégories avec étiquettes françaises
const CATEGORIES = [
  { value: 'all', label: 'Toutes les boutiques' },
  { value: 'electronique', label: 'Électronique' },
  { value: 'mode', label: 'Mode & Vêtements' },
  { value: 'bijoux', label: 'Bijoux & Accessoires' },
  { value: 'maison', label: 'Maison & Déco' },
  { value: 'beaute', label: 'Beauté & Cosmétiques' },
  { value: 'art', label: 'Art & Créations' },
  { value: 'enfant', label: 'Enfant & Bébé' },
  { value: 'sport', label: 'Sport & Loisirs' },
  { value: 'alimentation', label: 'Alimentation & Boissons' },
  { value: 'sante', label: 'Santé & Bien-être' },
  { value: 'livre', label: 'Livres & Médias' },
  { value: 'jeu', label: 'Jeux & Jouets' },
  { value: 'jardin', label: 'Jardin & Bricolage' },
  { value: 'voyage', label: 'Voyage' },
  { value: 'autre', label: 'Autres catégories' }
]

// Fonction pour obtenir l'icône selon la catégorie
const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'electronique': return '📱'
    case 'mode': return '👕'
    case 'bijoux': return '💎'
    case 'maison': return '🏠'
    case 'beaute': return '💄'
    case 'art': return '🎨'
    case 'enfant': return '👶'
    case 'sport': return '⚽'
    case 'alimentation': return '🍎'
    case 'sante': return '❤️'
    case 'livre': return '📚'
    case 'jeu': return '🎮'
    case 'jardin': return '🌿'
    case 'voyage': return '✈️'
    default: return '🛍️'
  }
}

// Fonction pour obtenir la couleur selon la catégorie
const getCategoryColor = (category: string) => {
  switch (category) {
    case 'electronique': return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'mode': return 'bg-purple-100 text-purple-800 border-purple-200'
    case 'bijoux': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'maison': return 'bg-green-100 text-green-800 border-green-200'
    case 'beaute': return 'bg-pink-100 text-pink-800 border-pink-200'
    case 'art': return 'bg-orange-100 text-orange-800 border-orange-200'
    case 'enfant': return 'bg-cyan-100 text-cyan-800 border-cyan-200'
    case 'sport': return 'bg-red-100 text-red-800 border-red-200'
    case 'alimentation': return 'bg-lime-100 text-lime-800 border-lime-200'
    default: return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

export default function AllShopsPage() {
  const [shops, setShops] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [error, setError] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'products'>('name')

  useEffect(() => {
    loadShops()
  }, [])

  const loadShops = async () => {
    try {
      setIsLoading(true)
      setError('')
      
      const response = await api.getPublicShops(100) // Plus de boutiques
      
      if (response.status === 'success' && response.data) {
        setShops(response.data)
      } else {
        setError(response.error || 'Erreur de chargement')
      }
    } catch (err: any) {
      setError('Impossible de charger les boutiques')
      console.error('Erreur:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Filtrer et trier les boutiques
  const filteredShops = shops
    .filter(shop => {
      const matchesCategory = selectedCategory === 'all' || 
        (shop.category || 'autre').toLowerCase() === selectedCategory.toLowerCase()
      
      const matchesSearch = 
        shop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (shop.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (shop.category || '').toLowerCase().includes(searchQuery.toLowerCase())
      
      return matchesCategory && matchesSearch
    })
    .sort((a, b) => {
      if (sortBy === 'products') {
        return (b.total_products || 0) - (a.total_products || 0)
      }
      // Tri par nom par défaut
      return a.name.localeCompare(b.name)
    })

  // Compter les boutiques par catégorie
  const categoryCounts = shops.reduce((acc, shop) => {
    const cat = shop.category || 'autre'
    acc[cat] = (acc[cat] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Ajouter "autre" aux catégories s'il y a des boutiques sans catégorie
  const otherCount = shops.filter(shop => !shop.category || shop.category === 'autre').length
  if (otherCount > 0) {
    categoryCounts['autre'] = otherCount
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Explorez toutes nos boutiques
          </h1>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <p className="text-gray-600 text-lg">
              Découvrez <span className="font-semibold text-blue-600">{shops.length}</span> boutiques uniques créées par des passionnés
            </p>
            
            {/* Tri */}
            <div className="flex items-center gap-3">
              <span className="text-gray-700 text-sm font-medium">Trier par :</span>
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setSortBy('name')}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    sortBy === 'name'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Nom
                </button>
                <button
                  onClick={() => setSortBy('products')}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    sortBy === 'products'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Nombre de produits
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Barre de recherche */}
        <div className="mb-8">
          <div className="relative max-w-2xl">
            <input
              type="text"
              placeholder="Rechercher une boutique, une catégorie, une description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
            />
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg">
              🔍
            </div>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Filtres par catégorie */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Filtrer par catégorie
            </h2>
            {selectedCategory !== 'all' && (
              <button
                onClick={() => setSelectedCategory('all')}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Tout effacer
              </button>
            )}
          </div>
          
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(cat => {
              const count = cat.value === 'all' 
                ? shops.length 
                : categoryCounts[cat.value] || 0
              
              // Ne pas afficher les catégories sans boutiques (sauf "toutes")
              if (cat.value !== 'all' && count === 0) return null
              
              const isSelected = selectedCategory === cat.value
              
              return (
                <button
                  key={cat.value}
                  onClick={() => setSelectedCategory(cat.value)}
                  className={`group flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all duration-200 ${
                    isSelected
                      ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-sm'
                      : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 shadow-sm'
                  }`}
                >
                  <span className="text-lg">{getCategoryIcon(cat.value)}</span>
                  <span className="font-medium">{cat.label}</span>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                    isSelected
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'
                  }`}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Indicateurs de filtres actifs */}
        {(selectedCategory !== 'all' || searchQuery) && (
          <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-blue-700 font-medium">Filtres actifs :</span>
              
              {selectedCategory !== 'all' && (
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm ${getCategoryColor(selectedCategory)}`}>
                  {getCategoryIcon(selectedCategory)}
                  {CATEGORIES.find(c => c.value === selectedCategory)?.label}
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className="ml-1 hover:opacity-70"
                  >
                    ✕
                  </button>
                </span>
              )}
              
              {searchQuery && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm bg-gray-100 text-gray-800 border border-gray-200">
                  🔍 Recherche : "{searchQuery}"
                  <button
                    onClick={() => setSearchQuery('')}
                    className="ml-1 hover:opacity-70"
                  >
                    ✕
                  </button>
                </span>
              )}
            </div>
          </div>
        )}

        {/* Résultats */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {filteredShops.length} boutique{filteredShops.length !== 1 ? 's' : ''} 
            {selectedCategory !== 'all' ? ' dans cette catégorie' : ''}
            {searchQuery ? ' correspondant à votre recherche' : ''}
          </h2>
          
          {filteredShops.length > 0 && (
            <div className="text-sm text-gray-500">
              Tri : {sortBy === 'name' ? 'Alphabétique' : 'Plus de produits'}
            </div>
          )}
        </div>

        {/* Liste des boutiques */}
        {isLoading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement des boutiques...</p>
          </div>
        ) : error ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-200">
            <div className="text-6xl mb-4">😔</div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              Impossible de charger les boutiques
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">{error}</p>
            <button
              onClick={loadShops}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
            >
              Réessayer
            </button>
          </div>
        ) : filteredShops.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-200">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              Aucune boutique trouvée
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {searchQuery 
                ? `Aucune boutique ne correspond à "${searchQuery}"`
                : selectedCategory !== 'all'
                ? `Aucune boutique dans la catégorie "${CATEGORIES.find(c => c.value === selectedCategory)?.label}"`
                : 'Aucune boutique disponible pour le moment'
              }
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <button
                onClick={() => {
                  setSearchQuery('')
                  setSelectedCategory('all')
                }}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
              >
                Voir toutes les boutiques
              </button>
              <button
                onClick={loadShops}
                className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                Actualiser
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredShops.map(shop => {
                const icon = getCategoryIcon(shop.category || 'autre')
                const categoryColor = getCategoryColor(shop.category || 'autre')
                
                return (
                  <Link
                    key={shop.id}
                    href={`/shop/${shop.slug}`}
                    className="group bg-white rounded-2xl shadow-sm border border-gray-200 hover:shadow-xl hover:border-blue-200 transition-all duration-300 hover:-translate-y-1 overflow-hidden"
                  >
                    <div className="p-6">
                      {/* En-tête avec catégorie */}
                      <div className="mb-4">
                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${categoryColor}`}>
                          <span>{icon}</span>
                          <span>{shop.category ? CATEGORIES.find(c => c.value === shop.category)?.label || shop.category : 'Divers'}</span>
                        </div>
                      </div>
                      
                      {/* Nom de la boutique */}
                      <h3 className="font-bold text-lg mb-3 group-hover:text-blue-600 transition-colors line-clamp-2">
                        {shop.name}
                      </h3>
                      
                      {/* Description */}
                      <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                        {shop.description || 'Découvrez une sélection de produits uniques et de qualité.'}
                      </p>
                      
                      {/* Stats et CTA */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <span>📦</span>
                            <span className="font-medium">{shop.total_products || 0}</span>
                            <span>produit{shop.total_products !== 1 ? 's' : ''}</span>
                          </div>
                        </div>
                        <div className="text-blue-600 font-medium text-sm group-hover:underline flex items-center gap-1">
                          Visiter
                          <span className="group-hover:translate-x-1 transition-transform">→</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
            
            {/* Info sur les résultats filtrés */}
            {filteredShops.length < shops.length && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <p className="text-gray-600 text-sm">
                    Affichage de <span className="font-semibold">{filteredShops.length}</span> boutique{filteredShops.length !== 1 ? 's' : ''} 
                    sur <span className="font-semibold">{shops.length}</span> 
                    {selectedCategory !== 'all' && ` dans la catégorie "${CATEGORIES.find(c => c.value === selectedCategory)?.label}"`}
                  </p>
                  
                  {selectedCategory !== 'all' || searchQuery ? (
                    <button
                      onClick={() => {
                        setSelectedCategory('all')
                        setSearchQuery('')
                      }}
                      className="px-4 py-2 text-sm text-blue-600 hover:text-blue-700 font-medium hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      Voir toutes les boutiques ({shops.length})
                    </button>
                  ) : null}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}