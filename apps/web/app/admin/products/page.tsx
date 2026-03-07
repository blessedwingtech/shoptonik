'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/app/contexts/AuthContext'
import { api } from '@/app/lib/api'
import Link from 'next/link'

interface Product {
  id: string
  name: string
  slug: string
  description: string | null
  price: number
  compare_price: number | null
  stock: number
  images: string[]
  category: string | null
  shop_id: string
  shop_name?: string
  shop_slug?: string
  owner_name?: string
  is_active: boolean
  is_featured: boolean
  is_digital: boolean
  view_count: number
  has_discount: boolean
  discount_percentage: number
  formatted_price: string
  formatted_compare_price: string | null
  created_at: string
}

export default function AdminProductsPage() {
  const { user } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [showProductModal, setShowProductModal] = useState(false)

  useEffect(() => {
    loadProducts()
  }, [statusFilter, searchTerm])

  const loadProducts = async () => {
    setIsLoading(true)
    setError('')
    try {
      const response = await api.getProducts({
        status: statusFilter,
        search: searchTerm || undefined
      })
      if (response.data) {
        setProducts(response.data)
      } else {
        setError(response.error || 'Erreur chargement des produits')
      }
    } catch (err: any) {
      setError(err.message || 'Erreur de connexion')
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleStatus = async (productId: string, productName: string, currentStatus: boolean) => {
    const action = currentStatus ? 'désactiver' : 'activer'
    if (!confirm(`Êtes-vous sûr de vouloir ${action} le produit "${productName}" ?`)) return

    setProcessing(productId)
    setError('')
    setSuccess('')

    try {
      const response = await api.toggleProductStatus(productId)

      if (response.statusCode === 200 || response.data) {
        setSuccess(`✅ Produit ${currentStatus ? 'désactivé' : 'activé'} avec succès`)
        loadProducts()
      } else {
        setError(response.error || 'Erreur lors de l\'opération')
      }
    } catch (err: any) {
      setError(err.message || 'Erreur de connexion')
    } finally {
      setProcessing(null)
    }
  }

  const handleToggleFeatured = async (productId: string, productName: string, currentStatus: boolean) => {
    const action = currentStatus ? 'retirer des vedettes' : 'mettre en vedette'
    if (!confirm(`Êtes-vous sûr de vouloir ${action} le produit "${productName}" ?`)) return

    setProcessing(productId)
    setError('')
    setSuccess('')

    try {
      const response = await api.toggleAdminProductFeatured(productId)

      if (response.statusCode === 200 || response.data) {
        setSuccess(`✅ Produit ${currentStatus ? 'retiré des' : 'ajouté aux'} vedettes avec succès`)
        loadProducts()
      } else {
        setError(response.error || 'Erreur lors de l\'opération')
      }
    } catch (err: any) {
      setError(err.message || 'Erreur de connexion')
    } finally {
      setProcessing(null)
    }
  }

  const handleDeleteProduct = async (productId: string, productName: string) => {
    if (!confirm(`⚠️ Êtes-vous sûr de vouloir SUPPRIMER définitivement le produit "${productName}" ? Cette action est irréversible.`)) return

    setProcessing(productId)
    setError('')
    setSuccess('')

    try {
      const response = await api.deleteProductById(productId)

      if (response.statusCode === 204 || response.data) {
        setSuccess(`✅ Produit "${productName}" supprimé avec succès`)
        loadProducts()
      } else {
        setError(response.error || 'Erreur lors de la suppression')
      }
    } catch (err: any) {
      setError(err.message || 'Erreur de connexion')
    } finally {
      setProcessing(null)
    }
  }

  const viewProductDetails = (product: Product) => {
    setSelectedProduct(product)
    setShowProductModal(true)
  }

  const formatPrice = (price: number) => {
    return (price / 100).toFixed(2) + ' €'
  }

  if (!user?.is_admin) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Accès non autorisé</h1>
          <p className="text-gray-600 mb-8">Cette page est réservée aux administrateurs.</p>
          <Link href="/" className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Retour à l'accueil
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Gestion des produits</h1>
          <p className="text-gray-600 mt-2">
            Gérez tous les produits de la plateforme
          </p>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}
        
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700">{success}</p>
          </div>
        )}

        {/* Filtres et recherche */}
        <div className="mb-6 bg-white rounded-lg shadow p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Rechercher par nom, description, boutique..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  🔍
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  statusFilter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Tous ({products.length})
              </button>
              <button
                onClick={() => setStatusFilter('active')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  statusFilter === 'active'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Actifs
              </button>
              <button
                onClick={() => setStatusFilter('inactive')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  statusFilter === 'inactive'
                    ? 'bg-gray-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Inactifs
              </button>
              <button
                onClick={loadProducts}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
              >
                ↻ Actualiser
              </button>
            </div>
          </div>
        </div>

        {/* Liste des produits */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement des produits...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">Aucun produit trouvé</h3>
            <p className="text-gray-600">
              {searchTerm 
                ? `Aucun produit ne correspond à "${searchTerm}"`
                : 'Aucun produit à afficher pour le moment.'}
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Effacer la recherche
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Produit
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Boutique
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Prix
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          {product.images && product.images.length > 0 ? (
                            <img 
                              src={product.images[0]} 
                              alt={product.name}
                              className="h-10 w-10 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                              📦
                            </div>
                          )}
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {product.name}
                              {product.is_featured && (
                                <span className="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                                  ⭐ Vedette
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-500">
                              {product.category || 'Non catégorisé'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{product.shop_name || '—'}</div>
                        <div className="text-sm text-gray-500">{product.owner_name || '—'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 font-bold">
                          {formatPrice(product.price)}
                        </div>
                        {product.has_discount && (
                          <div className="text-xs text-gray-500 line-through">
                            {formatPrice(product.compare_price || 0)}
                            <span className="ml-1 text-red-600">-{product.discount_percentage}%</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          product.stock > 0
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {product.stock > 0 ? `${product.stock} en stock` : 'Rupture'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          product.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {product.is_active ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-2">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => viewProductDetails(product)}
                              className="p-1 text-blue-600 hover:text-blue-800"
                              title="Voir détails"
                            >
                              👁️
                            </button>
                            <Link
                              href={`/product/${product.id}`}
                              target="_blank"
                              className="p-1 text-purple-600 hover:text-purple-800"
                              title="Voir en boutique"
                            >
                              🔗
                            </Link>
                            <button
                              onClick={() => handleToggleStatus(product.id, product.name, product.is_active)}
                              disabled={processing === product.id}
                              className={`p-1 ${
                                product.is_active 
                                  ? 'text-yellow-600 hover:text-yellow-800' 
                                  : 'text-green-600 hover:text-green-800'
                              } disabled:opacity-50`}
                              title={product.is_active ? 'Désactiver' : 'Activer'}
                            >
                              {product.is_active ? '⏸️' : '▶️'}
                            </button>
                            <button
                              onClick={() => handleToggleFeatured(product.id, product.name, product.is_featured)}
                              disabled={processing === product.id}
                              className={`p-1 ${
                                product.is_featured 
                                  ? 'text-yellow-600 hover:text-yellow-800' 
                                  : 'text-gray-600 hover:text-gray-800'
                              } disabled:opacity-50`}
                              title={product.is_featured ? 'Retirer vedette' : 'Mettre en vedette'}
                            >
                              ⭐
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(product.id, product.name)}
                              disabled={processing === product.id}
                              className="p-1 text-red-600 hover:text-red-800 disabled:opacity-50"
                              title="Supprimer"
                            >
                              🗑️
                            </button>
                          </div>
                          {processing === product.id && (
                            <div className="text-xs text-gray-500 animate-pulse">
                              Traitement...
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal détails produit */}
        {showProductModal && selectedProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold">Détails du produit</h3>
              </div>
              
              <div className="p-6">
                <div className="flex items-center mb-6">
                  {selectedProduct.images && selectedProduct.images.length > 0 ? (
                    <img 
                      src={selectedProduct.images[0]} 
                      alt={selectedProduct.name}
                      className="h-20 w-20 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="h-20 w-20 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
                      📦
                    </div>
                  )}
                  <div className="ml-4">
                    <h4 className="text-xl font-bold text-gray-900">{selectedProduct.name}</h4>
                    <p className="text-gray-600">{selectedProduct.slug}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500">Description</p>
                    <p className="font-medium">{selectedProduct.description || '—'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Boutique</p>
                    <p className="font-medium">{selectedProduct.shop_name || '—'}</p>
                    <p className="text-xs text-gray-500">{selectedProduct.owner_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Catégorie</p>
                    <p className="font-medium">{selectedProduct.category || 'Non catégorisé'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Prix</p>
                    <p className="font-bold text-lg text-gray-900">{formatPrice(selectedProduct.price)}</p>
                    {selectedProduct.has_discount && (
                      <p className="text-sm text-gray-500 line-through">
                        {formatPrice(selectedProduct.compare_price || 0)}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Stock</p>
                    <p className={`font-medium ${selectedProduct.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {selectedProduct.stock > 0 ? `${selectedProduct.stock} disponibles` : 'Rupture'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Créé le</p>
                    <p className="font-medium">{new Date(selectedProduct.created_at).toLocaleDateString('fr-FR')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Vues</p>
                    <p className="font-medium">{selectedProduct.view_count || 0}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500">Statut</p>
                    <div className="flex gap-1 mt-1">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        selectedProduct.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {selectedProduct.is_active ? 'Actif' : 'Inactif'}
                      </span>
                      {selectedProduct.is_featured && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                          ⭐ Vedette
                        </span>
                      )}
                      {selectedProduct.is_digital && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                          Numérique
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
                <button
                  onClick={() => setShowProductModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
