'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/app/contexts/AuthContext'
import { api } from '@/app/lib/api'
import Link from 'next/link'

interface SellerRequest {
  id: string
  username: string
  email: string
  full_name: string | null
  company_name: string | null
  vat_number: string | null
  address: string | null
  phone: string | null
  requested_at: string
}

export default function AdminSellerRequestsPage() {
  const { user } = useAuth()
  const [requests, setRequests] = useState<SellerRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [filter, setFilter] = useState<'all' | 'pending'>('pending')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadRequests()
  }, [])

  const loadRequests = async () => {
    setIsLoading(true)
    setError('')
    try {
      const response = await api.request('/seller/admin/pending')
      if (response.data) {
        setRequests(response.data)
      } else {
        setError(response.error || 'Erreur chargement des demandes')
      }
    } catch (err: any) {
      setError(err.message || 'Erreur de connexion')
    } finally {
      setIsLoading(false)
    }
  }

  const handleApprove = async (userId: string, userName: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir approuver la demande de ${userName} ?`)) return

    setProcessing(userId)
    setError('')
    setSuccess('')

    try {
      const response = await api.request(`/seller/admin/approve/${userId}`, {
        method: 'POST'
      })

      if (response.data) {
        setSuccess(`✅ Demande de ${userName} approuvée avec succès`)
        loadRequests() // Recharger la liste
      } else {
        setError(response.error || 'Erreur lors de l\'approbation')
      }
    } catch (err: any) {
      setError(err.message || 'Erreur de connexion')
    } finally {
      setProcessing(null)
    }
  }

  const handleReject = async (userId: string, userName: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir rejeter la demande de ${userName} ?`)) return

    setProcessing(userId)
    setError('')
    setSuccess('')

    try {
      const response = await api.request(`/seller/admin/reject/${userId}`, {
        method: 'POST'
      })

      if (response.data) {
        setSuccess(`✅ Demande de ${userName} rejetée`)
        loadRequests()
      } else {
        setError(response.error || 'Erreur lors du rejet')
      }
    } catch (err: any) {
      setError(err.message || 'Erreur de connexion')
    } finally {
      setProcessing(null)
    }
  }

  // Filtrer les demandes
  const filteredRequests = requests.filter(req => {
    const matchesSearch = 
      req.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (req.company_name || '').toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesSearch
  })

  if (!user?.is_admin) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Accès non autorisé
          </h1>
          <p className="text-gray-600 mb-8">
            Cette page est réservée aux administrateurs.
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retour à l'accueil
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Demandes vendeur
          </h1>
          <p className="text-gray-600 mt-2">
            Gérez les demandes de statut vendeur
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

        {/* Barre de recherche et filtres */}
        <div className="mb-6 bg-white rounded-lg shadow p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Rechercher par nom, email, entreprise..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  🔍
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('pending')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  filter === 'pending'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                En attente ({requests.length})
              </button>
              <button
                onClick={loadRequests}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
              >
                ↻ Actualiser
              </button>
            </div>
          </div>
        </div>

        {/* Liste des demandes */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement des demandes...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">
              {searchTerm ? '🔍' : '📭'}
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              {searchTerm 
                ? 'Aucun résultat trouvé'
                : 'Aucune demande en attente'
              }
            </h3>
            <p className="text-gray-600">
              {searchTerm 
                ? `Aucune demande ne correspond à "${searchTerm}"`
                : 'Il n\'y a pas de demandes de statut vendeur à traiter pour le moment.'
              }
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
                      Utilisateur
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Entreprise
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Demandé le
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                            {req.username.charAt(0).toUpperCase()}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {req.full_name || req.username}
                            </div>
                            <div className="text-sm text-gray-500">
                              {req.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 font-medium">
                          {req.company_name || '-'}
                        </div>
                        <div className="text-sm text-gray-500">
                          TVA: {req.vat_number || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {req.phone || '-'}
                        </div>
                        <div className="text-sm text-gray-500 max-w-xs truncate">
                          {req.address || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(req.requested_at).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleApprove(req.id, req.full_name || req.username)}
                            disabled={processing === req.id}
                            className="px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {processing === req.id ? (
                              <div className="flex items-center">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Traitement...
                              </div>
                            ) : (
                              'Approuver'
                            )}
                          </button>
                          <button
                            onClick={() => handleReject(req.id, req.full_name || req.username)}
                            disabled={processing === req.id}
                            className="px-3 py-1.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {processing === req.id ? (
                              <div className="flex items-center">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Traitement...
                              </div>
                            ) : (
                              'Rejeter'
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pied de tableau avec stats */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm">
                <div className="text-gray-700">
                  <span className="font-medium">{filteredRequests.length}</span> demande(s) en attente
                </div>
                <div className="text-gray-500">
                  Dernière mise à jour: {new Date().toLocaleTimeString('fr-FR')}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}