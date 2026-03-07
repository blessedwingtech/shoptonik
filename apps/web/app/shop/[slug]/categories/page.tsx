// apps/web/app/shop/[slug]/categories/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/app/lib/api'

export default function CategoriesPage() {
  const params = useParams()
  const slug = params.slug as string
  
  const [categories, setCategories] = useState<string[]>([])
  const [productsByCategory, setProductsByCategory] = useState<Record<string, any[]>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [shopInfo, setShopInfo] = useState<any>(null)

  useEffect(() => {
    loadShopData()
  }, [slug])

  const loadShopData = async () => {
    try {
      // Charger les informations de la boutique
      const shopResponse = await api.getPublicShop(slug)
      if (shopResponse.data) {
        setShopInfo(shopResponse.data)
      }

      // Charger les produits
      const productsResponse = await api.getPublicShopProducts(slug)
      if (productsResponse.data) {
        const products = productsResponse.data
        
        // Extraire les catégories uniques
        const uniqueCategories = Array.from(new Set(
          products
            .map(p => p.category || 'Non catégorisé')
            .filter(Boolean)
        ))
        setCategories(uniqueCategories)

        // Grouper les produits par catégorie
        const grouped: Record<string, any[]> = {}
        uniqueCategories.forEach(category => {
          grouped[category] = products.filter(p => 
            (p.category || 'Non catégorisé') === category
          )
        })
        setProductsByCategory(grouped)
      }
    } catch (err) {
      console.error('Erreur chargement catégories:', err)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement des catégories...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Catégories - {shopInfo?.name || 'Boutique'}
          </h1>
          <p className="text-gray-600 mt-2">
            Parcourez nos produits par catégorie
          </p>
        </div>

        {/* Navigation */}
        <div className="mb-8">
          <nav className="flex space-x-4">
            <Link 
              href={`/shop/${slug}`}
              className="text-gray-600 hover:text-blue-600"
            >
              Accueil
            </Link>
            <span className="text-gray-400">/</span>
            <Link 
              href={`/shop/${slug}/products`}
              className="text-gray-600 hover:text-blue-600"
            >
              Tous les produits
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-blue-600 font-medium">Catégories</span>
          </nav>
        </div>

        {/* Liste des catégories */}
        {categories.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-8 text-center">
            <div className="text-gray-400 text-6xl mb-4">📂</div>
            <h2 className="text-xl font-medium text-gray-900 mb-2">
              Aucune catégorie disponible
            </h2>
            <p className="text-gray-600 mb-4">
              Cette boutique n'a pas encore organisé ses produits en catégories.
            </p>
            <Link
              href={`/shop/${slug}/products`}
              className="inline-block text-blue-600 hover:text-blue-800 font-medium"
            >
              Voir tous les produits →
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {categories.map(category => (
              <div key={category} className="bg-white rounded-xl shadow overflow-hidden">
                {/* En-tête de catégorie */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-4 border-b">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">{category}</h2>
                      <p className="text-gray-600 text-sm mt-1">
                        {productsByCategory[category]?.length || 0} produit{productsByCategory[category]?.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <Link
                      href={`/shop/${slug}/products?category=${encodeURIComponent(category)}`}
                      className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                    >
                      Voir tout →
                    </Link>
                  </div>
                </div>

                {/* Produits de la catégorie (limités à 4) */}
                <div className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    {productsByCategory[category]?.slice(0, 4).map(product => (
                      <Link
                        key={product.id}
                        href={`/product/${product.id}`} 
                        className="group border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="aspect-square bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                          {product.images && product.images.length > 0 ? (
                            <img 
                              src={product.images[0]} 
                              alt={product.name}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <div className="text-gray-400 text-3xl">📦</div>
                          )}
                        </div>
                        <h3 className="font-medium text-gray-900 group-hover:text-blue-600 line-clamp-1">
                          {product.name}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {product.description || 'Pas de description'}
                        </p>
                        <div className="flex justify-between items-center mt-3">
                          <span className="font-bold text-gray-900">
                            {(product.price / 100).toFixed(2)} €
                          </span>
                          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                            {product.stock > 0 ? 'En stock' : 'Rupture'}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>

                  {/* Voir plus si plus de 4 produits */}
                  {productsByCategory[category]?.length > 4 && (
                    <div className="mt-6 text-center">
                      <Link
                        href={`/shop/${slug}/products?category=${encodeURIComponent(category)}`}
                        className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Voir les {productsByCategory[category].length - 4} autres produits
                        <svg className="ml-1 w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stats */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Résumé</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{categories.length}</div>
              <div className="text-sm text-gray-600">Catégories</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {Object.values(productsByCategory).reduce((sum, prods) => sum + (prods?.length || 0), 0)}
              </div>
              <div className="text-sm text-gray-600">Produits total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {Object.values(productsByCategory).filter(prods => prods && prods.length > 0).length}
              </div>
              <div className="text-sm text-gray-600">Catégories avec produits</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {Math.max(...Object.values(productsByCategory).map(prods => prods?.length || 0))}
              </div>
              <div className="text-sm text-gray-600">Plus grande catégorie</div>
            </div>
          </div>
        </div>

        {/* Retour */}
        <div className="mt-8">
          <Link
            href={`/shop/${slug}/products`}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Retour à tous les produits
          </Link>
        </div>
      </div>
    </div>
  )
}
