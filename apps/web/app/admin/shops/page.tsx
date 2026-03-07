'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/app/contexts/AuthContext'
import { api } from '@/app/lib/api'
import Link from 'next/link'

interface Shop {
  id: string
  name: string
  slug: string
  description: string | null
  category: string | null
  owner_id: string
  owner_email?: string
  owner_username?: string
  is_active: boolean
  is_verified: boolean
  total_products: number
  total_orders: number
  total_revenue: number
  total_visitors: number
  created_at: string
  logo_url?: string | null
  banner_url?: string | null
}

export default function AdminShopsPage() {
  const { user } = useAuth()
  const [shops, setShops] = useState<Shop[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null)
  const [showShopModal, setShowShopModal] = useState(false)

  useEffect(() => {
    loadShops()
  }, [statusFilter, searchTerm])

  const loadShops = async () => {
    setIsLoading(true)
    setError('')
    try {
      const response = await api.getShops({
        status: statusFilter,
        search: searchTerm || undefined
      })
      if (response.data) {
        setShops(response.data)
      } else {
        setError(response.error || 'Erreur chargement des boutiques')
      }
    } catch (err: any) {
      setError(err.message || 'Erreur de connexion')
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleStatus = async (shopId: string, shopName: string, currentStatus: boolean) => {
    const action = currentStatus ? 'désactiver' : 'activer'
    if (!confirm(`Êtes-vous sûr de vouloir ${action} la boutique "${shopName}" ?`)) return

    setProcessing(shopId)
    setError('')
    setSuccess('')

    try {
      const response = await api.toggleShopStatus(shopId)

      if (response.statusCode === 200 || response.data) {
        setSuccess(`✅ Boutique ${currentStatus ? 'désactivée' : 'activée'} avec succès`)
        loadShops()
      } else {
        setError(response.error || 'Erreur lors de l\'opération')
      }
    } catch (err: any) {
      setError(err.message || 'Erreur de connexion')
    } finally {
      setProcessing(null)
    }
  }

  const handleToggleVerification = async (shopId: string, shopName: string, currentStatus: boolean) => {
    const action = currentStatus ? 'retirer la vérification à' : 'vérifier'
    if (!confirm(`Êtes-vous sûr de vouloir ${action} la boutique "${shopName}" ?`)) return

    setProcessing(shopId)
    setError('')
    setSuccess('')

    try {
      const response = await api.toggleShopVerification(shopId)

      if (response.statusCode === 200 || response.data) {
        setSuccess(`✅ Boutique ${currentStatus ? 'non vérifiée' : 'vérifiée'} avec succès`)
        loadShops()
      } else {
        setError(response.error || 'Erreur lors de l\'opération')
      }
    } catch (err: any) {
      setError(err.message || 'Erreur de connexion')
    } finally {
      setProcessing(null)
    }
  }

  const handleDeleteShop = async (shopId: string, shopName: string) => {
    if (!confirm(`⚠️ Êtes-vous sûr de vouloir SUPPRIMER définitivement la boutique "${shopName}" ? Cette action supprimera également tous ses produits et est irréversible.`)) return

    setProcessing(shopId)
    setError('')
    setSuccess('')

    try {
      const response = await api.deleteShop(shopId)

      if (response.statusCode === 204 || response.data) {
        setSuccess(`✅ Boutique "${shopName}" supprimée avec succès`)
        loadShops()
      } else {
        setError(response.error || 'Erreur lors de la suppression')
      }
    } catch (err: any) {
      setError(err.message || 'Erreur de connexion')
    } finally {
      setProcessing(null)
    }
  }

  const viewShopDetails = (shop: Shop) => {
    setSelectedShop(shop)
    setShowShopModal(true)
  }

  const formatRevenue = (revenue: number) => {
    return (revenue / 100).toFixed(2) + ' €'
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
          <h1 className="text-3xl font-bold text-gray-900">Gestion des boutiques</h1>
          <p className="text-gray-600 mt-2">
            Gérez toutes les boutiques de la plateforme
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
                  placeholder="Rechercher par nom, description, propriétaire..."
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
                Toutes ({shops.length})
              </button>
              <button
                onClick={() => setStatusFilter('active')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  statusFilter === 'active'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Actives
              </button>
              <button
                onClick={() => setStatusFilter('inactive')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  statusFilter === 'inactive'
                    ? 'bg-gray-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Inactives
              </button>
              <button
                onClick={loadShops}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
              >
                ↻ Actualiser
              </button>
            </div>
          </div>
        </div>

        {/* Liste des boutiques */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement des boutiques...</p>
          </div>
        ) : shops.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">🏪</div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">Aucune boutique trouvée</h3>
            <p className="text-gray-600">
              {searchTerm 
                ? `Aucune boutique ne correspond à "${searchTerm}"`
                : 'Aucune boutique à afficher pour le moment.'}
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
                      Boutique
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Propriétaire
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Catégorie
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stats
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {shops.map((shop) => (
                    <tr key={shop.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          {shop.logo_url ? (
                            <img 
                              src={shop.logo_url} 
                              alt={shop.name}
                              className="h-10 w-10 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                              {shop.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {shop.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {shop.slug}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{shop.owner_username || '—'}</div>
                        <div className="text-sm text-gray-500">{shop.owner_email || '—'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {shop.category || 'Général'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className={`px-2 py-1 text-xs rounded-full inline-block w-fit ${
                            shop.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {shop.is_active ? 'Actif' : 'Inactif'}
                          </span>
                          {shop.is_verified && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full inline-block w-fit">
                              ✓ Vérifié
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          <span className="font-medium">{shop.total_products || 0}</span> produits
                        </div>
                        <div className="text-sm text-gray-500">
                          CA: {formatRevenue(shop.total_revenue)}
                        </div>
                        <div className="text-xs text-gray-400">
                          {new Date(shop.created_at).toLocaleDateString('fr-FR')}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-2">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => viewShopDetails(shop)}
                              className="p-1 text-blue-600 hover:text-blue-800"
                              title="Voir détails"
                            >
                              👁️
                            </button>
                            <Link
                              href={`/shop/${shop.slug}`}
                              target="_blank"
                              className="p-1 text-purple-600 hover:text-purple-800"
                              title="Voir en boutique"
                            >
                              🔗
                            </Link>
                            <button
                              onClick={() => handleToggleStatus(shop.id, shop.name, shop.is_active)}
                              disabled={processing === shop.id}
                              className={`p-1 ${
                                shop.is_active 
                                  ? 'text-yellow-600 hover:text-yellow-800' 
                                  : 'text-green-600 hover:text-green-800'
                              } disabled:opacity-50`}
                              title={shop.is_active ? 'Désactiver' : 'Activer'}
                            >
                              {shop.is_active ? '⏸️' : '▶️'}
                            </button>
                            <button
                              onClick={() => handleToggleVerification(shop.id, shop.name, shop.is_verified)}
                              disabled={processing === shop.id}
                              className={`p-1 ${
                                shop.is_verified 
                                  ? 'text-blue-600 hover:text-blue-800' 
                                  : 'text-gray-600 hover:text-gray-800'
                              } disabled:opacity-50`}
                              title={shop.is_verified ? 'Retirer vérification' : 'Vérifier'}
                            >
                              ✓
                            </button>
                            <button
                              onClick={() => handleDeleteShop(shop.id, shop.name)}
                              disabled={processing === shop.id}
                              className="p-1 text-red-600 hover:text-red-800 disabled:opacity-50"
                              title="Supprimer"
                            >
                              🗑️
                            </button>
                          </div>
                          {processing === shop.id && (
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

        {/* Modal détails boutique */}
        {showShopModal && selectedShop && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold">Détails de la boutique</h3>
              </div>
              
              <div className="p-6">
                <div className="flex items-center mb-6">
                  {selectedShop.logo_url ? (
                    <img 
                      src={selectedShop.logo_url} 
                      alt={selectedShop.name}
                      className="h-16 w-16 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
                      {selectedShop.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="ml-4">
                    <h4 className="text-xl font-bold text-gray-900">{selectedShop.name}</h4>
                    <p className="text-gray-600">{selectedShop.slug}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500">Description</p>
                    <p className="font-medium">{selectedShop.description || '—'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Catégorie</p>
                    <p className="font-medium">{selectedShop.category || 'Général'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Propriétaire</p>
                    <p className="font-medium">{selectedShop.owner_username || '—'}</p>
                    <p className="text-xs text-gray-500">{selectedShop.owner_email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Créée le</p>
                    <p className="font-medium">{new Date(selectedShop.created_at).toLocaleDateString('fr-FR')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Statut</p>
                    <div className="flex gap-1 mt-1">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        selectedShop.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {selectedShop.is_active ? 'Actif' : 'Inactif'}
                      </span>
                      {selectedShop.is_verified && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          Vérifié
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{selectedShop.total_products || 0}</p>
                    <p className="text-xs text-gray-500">Produits</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{selectedShop.total_orders || 0}</p>
                    <p className="text-xs text-gray-500">Commandes</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">{formatRevenue(selectedShop.total_revenue)}</p>
                    <p className="text-xs text-gray-500">CA</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-orange-600">{selectedShop.total_visitors || 0}</p>
                    <p className="text-xs text-gray-500">Visiteurs</p>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
                <button
                  onClick={() => setShowShopModal(false)}
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