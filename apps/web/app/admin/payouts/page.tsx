'use client'

import { useState, useEffect } from 'react'
import { api } from '@/app/lib/api'
import { useAuth } from '@/app/contexts/AuthContext'
import Link from 'next/link'

interface Withdrawal {
  id: string
  seller_id: string
  seller_name?: string
  amount: number
  method: string
  account_details: string
  reference: string
  status: 'pending' | 'completed' | 'rejected'
  created_at: string
  processed_at?: string
  notes?: string
}

export default function AdminPayoutsPage() {
  const { user } = useAuth()
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [filter, setFilter] = useState<'pending' | 'all'>('pending')
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null)

  useEffect(() => {
    loadWithdrawals()
  }, [filter])

  const loadWithdrawals = async () => {
    setIsLoading(true)
    setError('')
    try {
      let response
      if (filter === 'pending') {
        response = await api.getPendingWithdrawals()
      } else {
        response = await api.getWithdrawalsHistory()
      }
      
      if (response.data) {
        setWithdrawals(response.data)
      } else {
        setError(response.error || 'Erreur chargement')
      }
    } catch (err: any) {
      setError(err.message || 'Erreur de connexion')
    } finally {
      setIsLoading(false)
    }
  }

  const handleApprove = async (withdrawalId: string) => {
    if (!confirm('Approuver ce retrait ? Le vendeur sera notifié.')) return
    
    setProcessing(withdrawalId)
    setError('')
    setSuccess('')
    
    try {
      const response = await api.approveWithdrawal(withdrawalId)
      
      if (response.data) {
        setSuccess('✅ Retrait approuvé avec succès')
        loadWithdrawals()
      } else {
        setError(response.error || 'Erreur lors de l\'approbation')
      }
    } catch (err: any) {
      setError(err.message || 'Erreur de connexion')
    } finally {
      setProcessing(null)
    }
  }

  const handleReject = async (withdrawalId: string) => {
    if (!rejectReason.trim()) {
      alert('Veuillez saisir un motif de rejet')
      return
    }
    
    setProcessing(withdrawalId)
    setError('')
    setSuccess('')
    
    try {
      const response = await api.rejectWithdrawal(withdrawalId, rejectReason)
      
      if (response.data) {
        setSuccess('✅ Retrait rejeté')
        setShowRejectModal(null)
        setRejectReason('')
        loadWithdrawals()
      } else {
        setError(response.error || 'Erreur lors du rejet')
      }
    } catch (err: any) {
      setError(err.message || 'Erreur de connexion')
    } finally {
      setProcessing(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getMethodIcon = (method: string) => {
    const icons: Record<string, string> = {
      bank: '🏦',
      paypal: '🅿️',
      moncash: '📱',
      natcash: '📱'
    }
    return icons[method] || '💰'
  }

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'En attente',
      completed: 'Approuvé',
      rejected: 'Rejeté'
    }
    return labels[status] || status
  }

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
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Gestion des retraits
            </h1>
            <p className="text-gray-600 mt-2">
              Approuvez ou rejetez les demandes de retrait des vendeurs
            </p>
          </div>
          <button
            onClick={loadWithdrawals}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <span>↻</span> Actualiser
          </button>
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

        {/* Filtres */}
        <div className="mb-6 bg-white rounded-lg shadow p-4">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                filter === 'pending'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              En attente
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Tous
            </button>
          </div>
        </div>

        {/* Liste des retraits */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement...</p>
          </div>
        ) : withdrawals.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">💰</div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              Aucune demande de retrait
            </h3>
            <p className="text-gray-600">
              {filter === 'pending' 
                ? 'Il n\'y a pas de demandes en attente pour le moment.'
                : 'Aucun historique de retrait.'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vendeur
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Méthode
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Montant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Référence
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
                  {withdrawals.map((wd) => (
                    <tr key={wd.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(wd.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {wd.seller_name || wd.seller_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="flex items-center gap-1">
                          <span>{getMethodIcon(wd.method)}</span>
                          <span>
                            {wd.method === 'bank' && 'Virement'}
                            {wd.method === 'paypal' && 'PayPal'}
                            {wd.method === 'moncash' && 'MonCash'}
                          </span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {wd.amount.toFixed(2)} €
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {wd.reference}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(wd.status)}`}>
                          {getStatusLabel(wd.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {wd.status === 'pending' && (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleApprove(wd.id)}
                              disabled={processing === wd.id}
                              className="px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50"
                            >
                              {processing === wd.id ? '...' : 'Approuver'}
                            </button>
                            <button
                              onClick={() => setShowRejectModal(wd.id)}
                              disabled={processing === wd.id}
                              className="px-3 py-1.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50"
                            >
                              Rejeter
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal de rejet */}
        {showRejectModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 max-w-md w-full">
              <h3 className="text-xl font-bold mb-4">Rejeter le retrait</h3>
              <p className="text-gray-600 mb-4">
                Veuillez indiquer le motif du rejet :
              </p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg mb-4"
                rows={3}
                placeholder="Ex: Informations bancaires incorrectes, délai non respecté..."
              />
              <div className="flex space-x-3">
                <button
                  onClick={() => handleReject(showRejectModal)}
                  disabled={!rejectReason.trim()}
                  className="flex-1 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  Confirmer le rejet
                </button>
                <button
                  onClick={() => {
                    setShowRejectModal(null)
                    setRejectReason('')
                  }}
                  className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
