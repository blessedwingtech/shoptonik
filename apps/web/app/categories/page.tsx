// apps/web/app/categories/page.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { api } from '@/app/lib/api'

export default function AllCategoriesPage() {
  const [categories, setCategories] = useState<string[]>([])
  const [shopsByCategory, setShopsByCategory] = useState<Record<string, any[]>>({})
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      const shopsResponse = await api.getPublicShops(50) // Augmentez la limite
      if (shopsResponse.data) {
        const shops = shopsResponse.data
        
        // Extraire toutes les catégories uniques
        const allCategories = Array.from(new Set(
          shops
            .map(shop => shop.category)
            .filter(cat => cat && cat.trim() !== '') // Filtre les catégories vides
            .filter(cat => cat.toLowerCase() !== 'general') // Exclut 'general'
        ))
        setCategories(allCategories.sort()) // Trie par ordre alphabétique

        // Grouper les boutiques par catégorie
        const grouped: Record<string, any[]> = {}
        allCategories.forEach(category => {
          grouped[category] = shops.filter(shop => shop.category === category)
        })
        setShopsByCategory(grouped)
      }
    } catch (err) {
      console.error('Erreur chargement catégories:', err)
      // Données de fallback
      setCategories(['Électronique', 'Mode', 'Bijoux', 'Maison', 'Art', 'Sport'])
      setShopsByCategory({
        'Électronique': [{id: '1', name: 'TechShop', slug: 'techshop'}],
        'Mode': [{id: '2', name: 'FashionStore', slug: 'fashionstore'}],
        'Bijoux': [{id: '3', name: 'JewelBox', slug: 'jewelbox'}],
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* En-tête */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Explorer par catégories
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Découvrez nos boutiques organisées par centres d'intérêt
          </p>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement des catégories...</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow">
            <div className="text-gray-400 text-6xl mb-4">📂</div>
            <h2 className="text-xl font-medium text-gray-900 mb-2">
              Aucune catégorie disponible
            </h2>
            <p className="text-gray-600 mb-6">
              Les boutiques n'ont pas encore défini leurs catégories.
            </p>
            <Link
              href="/shop/all"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
            >
              Voir toutes les boutiques
            </Link>
          </div>
        ) : (
          <>
            {/* Grille des catégories */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {categories.map(category => {
                const shopsCount = shopsByCategory[category]?.length || 0
                const icon = getCategoryIcon(category)
                
                return (
                  <Link
                    key={category}
                    href={`/shop/all?category=${encodeURIComponent(category)}`}
                    className="group bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                  >
                    {/* Header coloré */}
                    <div className={`h-2 ${getCategoryColor(category)}`}></div>
                    
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h2 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                            {category}
                          </h2>
                        </div>
                        <div className="text-3xl">
                          {icon}
                        </div>
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-4">
                        {shopsCount} boutique{shopsCount !== 1 ? 's' : ''} dans cette catégorie
                      </p>
                      
                      {/* Boutiques populaires */}
                      {shopsByCategory[category]?.slice(0, 2).map(shop => (
                        <div key={shop.id} className="flex items-center mb-2 last:mb-0">
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                            <span className="text-xs font-medium">
                              {shop.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {shop.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {shop.total_products || 0} produits
                            </p>
                          </div>
                        </div>
                      ))}
                      
                      {shopsCount > 2 && (
                        <p className="text-xs text-gray-500 mt-2">
                          + {shopsCount - 2} autre{shopsCount - 2 > 1 ? 's' : ''} boutique{shopsCount - 2 > 1 ? 's' : ''}
                        </p>
                      )}
                      
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <span className="text-blue-600 font-medium text-sm group-hover:underline">
                          Explorer cette catégorie →
                        </span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>

            {/* Stats */}
            <div className="mt-10 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 text-center">
                Vue d'ensemble
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl shadow text-center">
                  <div className="text-2xl font-bold text-blue-600">{categories.length}</div>
                  <div className="text-sm text-gray-600">Catégories</div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {Object.values(shopsByCategory).reduce((sum, shops) => sum + (shops?.length || 0), 0)}
                  </div>
                  <div className="text-sm text-gray-600">Boutiques total</div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {Math.max(...Object.values(shopsByCategory).map(shops => shops?.length || 0))}
                  </div>
                  <div className="text-sm text-gray-600">Plus populaire</div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {Math.round(Object.values(shopsByCategory).reduce((sum, shops) => sum + (shops?.length || 0), 0) / categories.length)}
                  </div>
                  <div className="text-sm text-gray-600">Moyenne par catégorie</div>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="mt-10 text-center">
              <Link
                href="/shop/all"
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Voir toutes les boutiques
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// Fonction pour obtenir l'icône selon la catégorie
function getCategoryIcon(category: string): string {
  const lowerCategory = category.toLowerCase()
  
  if (lowerCategory.includes('électronique') || lowerCategory.includes('tech')) return '📱'
  if (lowerCategory.includes('mode') || lowerCategory.includes('fashion') || lowerCategory.includes('vetement')) return '👕'
  if (lowerCategory.includes('bijou') || lowerCategory.includes('joyau')) return '💎'
  if (lowerCategory.includes('maison') || lowerCategory.includes('décoration')) return '🏠'
  if (lowerCategory.includes('art') || lowerCategory.includes('artisanat')) return '🎨'
  if (lowerCategory.includes('sport') || lowerCategory.includes('fitness')) return '⚽'
  if (lowerCategory.includes('livre') || lowerCategory.includes('culture')) return '📚'
  if (lowerCategory.includes('nourriture') || lowerCategory.includes('aliment')) return '🍎'
  if (lowerCategory.includes('beauté') || lowerCategory.includes('cosmétique')) return '💄'
  if (lowerCategory.includes('enfant') || lowerCategory.includes('bébé')) return '👶'
  
  return '🛍️'
}

// Fonction pour obtenir la couleur selon la catégorie
function getCategoryColor(category: string): string {
  const lowerCategory = category.toLowerCase()
  
  if (lowerCategory.includes('électronique') || lowerCategory.includes('tech')) return 'bg-blue-500'
  if (lowerCategory.includes('mode') || lowerCategory.includes('fashion') || lowerCategory.includes('vetement')) return 'bg-purple-500'
  if (lowerCategory.includes('bijou') || lowerCategory.includes('joyau')) return 'bg-yellow-500'
  if (lowerCategory.includes('maison') || lowerCategory.includes('décoration')) return 'bg-green-500'
  if (lowerCategory.includes('art') || lowerCategory.includes('artisanat')) return 'bg-red-500'
  if (lowerCategory.includes('sport') || lowerCategory.includes('fitness')) return 'bg-orange-500'
  
  return 'bg-gray-500'
}
