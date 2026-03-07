'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/app/lib/api'

interface SearchFilters {
  category: string
  minPrice: number
  maxPrice: number
  inStock: boolean
  sortBy: string
}

interface Product {
  id: string
  name: string
  slug: string
  description: string
  price: number
  compare_price: number | null
  images: string[]
  category: string
  tags: string[]
  shop_name: string
  shop_slug: string
  formatted_price: string
  formatted_compare_price: string | null
  has_discount: boolean
  discount_percentage: number
  is_available: boolean
}

export default function SearchPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const query = searchParams.get('q') || ''
  const categoryParam = searchParams.get('category') || 'all'
  
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 1 })
  const [availableFilters, setAvailableFilters] = useState({
    categories: [] as string[],
    minPriceAvailable: 0,
    maxPriceAvailable: 100000
  })
  
  const [filters, setFilters] = useState<SearchFilters>({
    category: categoryParam !== 'all' ? categoryParam : '',
    minPrice: 0,
    maxPrice: 100000,
    inStock: false,
    sortBy: 'relevance'
  })

  useEffect(() => {
    if (query) {
      loadResults()
    }
  }, [query, filters, pagination.page])

  const loadResults = async () => {
    setIsLoading(true)
    try {
      const params: any = {
        q: query,
        page: pagination.page,
        limit: 20,
        sort_by: filters.sortBy
      }

      if (filters.category) {
        params.category = filters.category
      }
      if (filters.minPrice > 0) {
        params.min_price = filters.minPrice
      }
      if (filters.maxPrice < 100000) {
        params.max_price = filters.maxPrice
      }
      if (filters.inStock) {
        params.in_stock = true
      }

      const response = await api.searchProducts(params)
      if (response.data) {
        setProducts(response.data.products || [])
        setPagination(response.data.pagination || { page: 1, total: 0, pages: 1 })
        setAvailableFilters(response.data.filters || {
          categories: [],
          minPriceAvailable: 0,
          maxPriceAvailable: 100000
        })
      }
    } catch (err) {
      console.error('Erreur recherche:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPagination(prev => ({ ...prev, page: 1 })) // Reset à la page 1
  }

  const formatPrice = (price: number) => {
    return (price / 100).toFixed(2) + ' €'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Résultats pour "{query}"
          </h1>
          <p className="text-gray-600">
            {pagination.total} produit(s) trouvé(s)
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filtres */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow p-6 sticky top-4">
              <h2 className="font-semibold text-lg mb-4">Filtres</h2>
              
              {/* Catégorie */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Catégorie
                </label>
                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Toutes</option>
                  {availableFilters.categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Prix - Version corrigée */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prix
                </label>
                <div className="space-y-2">
                  <input
                    type="range"
                    min={0}
                    max={Math.max(1, (availableFilters.maxPriceAvailable || 100000) / 100)}
                    value={Math.min(filters.maxPrice / 100, (availableFilters.maxPriceAvailable || 100000) / 100)}
                    onChange={(e) => handleFilterChange('maxPrice', Number(e.target.value) * 100)}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>{formatPrice(filters.minPrice)}</span>
                    <span>{formatPrice(filters.maxPrice)}</span>
                  </div>
                </div>
              </div>

              {/* En stock */}
              <div className="mb-6">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={filters.inStock}
                    onChange={(e) => handleFilterChange('inStock', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600"
                  />
                  <span className="text-sm text-gray-700">En stock uniquement</span>
                </label>
              </div>

              {/* Tri */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trier par
                </label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="relevance">Pertinence</option>
                  <option value="price_asc">Prix croissant</option>
                  <option value="price_desc">Prix décroissant</option>
                  <option value="newest">Plus récents</option>
                  <option value="popular">Plus populaires</option>
                </select>
              </div>

              <button
                onClick={() => {
                  setFilters({
                    category: '',
                    minPrice: 0,
                    maxPrice: 100000,
                    inStock: false,
                    sortBy: 'relevance'
                  })
                }}
                className="w-full py-2 text-sm text-blue-600 hover:text-blue-700 border border-blue-600 rounded-md hover:bg-blue-50"
              >
                Réinitialiser les filtres
              </button>
            </div>
          </div>

          {/* Résultats */}
          <div className="flex-1">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Recherche en cours...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  Aucun produit trouvé
                </h3>
                <p className="text-gray-600">
                  Essayez avec d'autres mots-clés ou modifiez vos filtres.
                </p>
              </div>
            ) : (
              <>
                {/* Grille de produits */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map(product => (
                    <Link
                      key={product.id}
                      href={`/product/${product.id}`}
                      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all group"
                    >
                      {/* Image */}
                      <div className="relative h-48 bg-gray-100">
                        {product.images && product.images.length > 0 ? (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-gray-400 text-4xl">📦</span>
                          </div>
                        )}
                        
                        {/* Badges */}
                        {product.has_discount && (
                          <span className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                            -{product.discount_percentage}%
                          </span>
                        )}
                      </div>

                      {/* Contenu */}
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 flex-1">
                            {product.name}
                          </h3>
                          <span className="text-sm text-gray-500 ml-2 whitespace-nowrap">
                            {product.shop_name}
                          </span>
                        </div>

                        {/* Description courte */}
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {product.description}
                        </p>

                        {/* Tags */}
                        {product.tags && product.tags.length > 0 && (
  <div className="flex flex-wrap gap-1 mb-3">
    {product.tags.slice(0, 3).map((tag: string, index: number) => (
      <span
        key={index}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          router.push(`/search/tag/${encodeURIComponent(tag)}`)
        }}
        className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded hover:bg-blue-100 hover:text-blue-600 transition-colors cursor-pointer"
      >
        {tag}
      </span>
    ))}
    {product.tags.length > 3 && (
      <span className="text-xs text-gray-400">+{product.tags.length - 3}</span>
    )}
  </div>
)}

                        {/* Prix */}
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-xl font-bold text-gray-900">
                              {product.formatted_price}
                            </span>
                            {product.has_discount && product.formatted_compare_price && (
                              <span className="text-sm text-gray-500 line-through ml-2">
                                {product.formatted_compare_price}
                              </span>
                            )}
                          </div>
                          {!product.is_available && (
                            <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                              Rupture
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Pagination */}
                {pagination.pages > 1 && (
                  <div className="mt-8 flex justify-center gap-2">
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                      disabled={pagination.page <= 1}
                      className="px-4 py-2 border rounded-md disabled:opacity-50 hover:bg-gray-50"
                    >
                      Précédent
                    </button>
                    <span className="px-4 py-2">
                      Page {pagination.page} sur {pagination.pages}
                    </span>
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                      disabled={pagination.page >= pagination.pages}
                      className="px-4 py-2 border rounded-md disabled:opacity-50 hover:bg-gray-50"
                    >
                      Suivant
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

