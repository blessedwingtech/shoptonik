'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/app/lib/api'
import { useAuth } from '@/app/contexts/AuthContext'

export default function SellerFinancesPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const slug = params.slug as string
  
  const [shop, setShop] = useState<any>(null)
  const [wallet, setWallet] = useState<any>(null)
  const [transactions, setTransactions] = useState<any[]>([])
  const [withdrawals, setWithdrawals] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [period, setPeriod] = useState('month')
  const [stats, setStats] = useState<any>(null)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawMethod, setWithdrawMethod] = useState('bank')
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 1 })

  useEffect(() => {
    if (slug) {
      loadShopData()
      loadFinancialData()
    }
  }, [slug, period, pagination.page])

  const loadShopData = async () => {
    try {
      const response = await api.getShopBySlug(slug)
      if (response.data) {
        setShop(response.data)
      }
    } catch (err) {
      console.error('Erreur chargement boutique:', err)
    }
  }

  const loadFinancialData = async () => {
    setIsLoading(true)
    try {
      // Charger le portefeuille
      const walletRes = await api.getSellerWallet()
      if (walletRes.data) {
        setWallet(walletRes.data)
      }

      // Charger les transactions
      const transactionsRes = await api.getSellerTransactions({ 
        period, 
        page: pagination.page 
      })
      if (transactionsRes.data) {
        setTransactions(transactionsRes.data.transactions || [])
        setStats(transactionsRes.data.stats)
        setPagination(prev => ({
          ...prev,
          total: transactionsRes.data.pagination?.total || 0,
          pages: transactionsRes.data.pagination?.pages || 1
        }))
      }

      // Charger l'historique des retraits
      const withdrawalsRes = await api.getWithdrawalHistory()
      if (withdrawalsRes.data) {
        setWithdrawals(withdrawalsRes.data)
      }
    } catch (err) {
      console.error('Erreur chargement données financières:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleWithdrawRequest = async () => {
    const amount = parseFloat(withdrawAmount)
    if (isNaN(amount) || amount <= 0) {
      alert('Montant invalide')
      return
    }

    if (wallet && amount > wallet.balance) {
      alert(`Solde insuffisant. Disponible: ${wallet.balance.toFixed(2)}€`)
      return
    }

    if (amount < 10) {
      alert('Le montant minimum de retrait est de 10€')
      return
    }

    try {
      const response = await api.requestWithdrawal({
        amount,
        method: withdrawMethod,
        account_details: { 
          // En simulation, on met des infos fictives
          bank_name: 'Banque de démonstration',
          account_holder: user?.full_name || user?.username
        }
      })

      if (response.data) {
        alert('✅ Demande de retrait envoyée avec succès')
        setShowWithdrawModal(false)
        setWithdrawAmount('')
        // Recharger les données
        loadFinancialData()
      } else {
        alert(response.error || 'Erreur lors de la demande')
      }
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la demande')
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

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      processing: 'bg-blue-100 text-blue-800',
      failed: 'bg-red-100 text-red-800',
      withdrawn: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'En attente',
      paid: 'Payé',
      processing: 'En traitement',
      failed: 'Échoué',
      withdrawn: 'Retiré',
      completed: 'Complété'
    }
    return labels[status] || status
  }

  const getPaymentMethodIcon = (method: string) => {
    const icons: Record<string, string> = {
      card: '💳',
      paypal: '🅿️',
      moncash: '📱',
      natcash: '📱',
      cash_on_delivery: '💵',
      bank: '🏦'
    }
    return icons[method] || '💰'
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des données financières...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* En-tête */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Link
                  href={`/seller/dashboard/${slug}`}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ← Retour
                </Link>
                <h1 className="text-3xl font-bold text-gray-900">
                  Finances
                </h1>
              </div>
              <p className="text-gray-600">
                {shop?.name} • Gérez vos revenus et transactions
              </p>
            </div>
            <button
              onClick={loadFinancialData}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
            >
              <span>↻</span> Actualiser
            </button>
          </div>
        </div>

        {/* Mode simulation */}
        <div className="mb-6 bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-lg">
          <p className="font-medium">🔧 Données stats importantes</p>
          <p className="text-sm mt-1">
            Les montants affichés sont les transactions effectuéees....
          </p>
        </div>

        {/* Cartes de solde */}
        {wallet && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 shadow border border-green-200">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-green-600 mb-1">Solde disponible</p>
                  <p className="text-3xl font-bold text-gray-900">{wallet.balance?.toFixed(2)} €</p>
                </div>
                <span className="text-3xl">💰</span>
              </div>
              <button
                onClick={() => setShowWithdrawModal(true)}
                disabled={wallet.balance < 10}
                className="mt-4 w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                Retirer des fonds
              </button>
            </div>

            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-6 shadow border border-yellow-200">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-yellow-600 mb-1">En attente</p>
                  <p className="text-3xl font-bold text-gray-900">{wallet.pending_balance?.toFixed(2)} €</p>
                </div>
                <span className="text-3xl">⏳</span>
              </div>
              <p className="text-xs text-gray-500 mt-4">Délai de rétractation: 14 jours</p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 shadow border border-blue-200">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-blue-600 mb-1">Total gagné</p>
                  <p className="text-3xl font-bold text-gray-900">{wallet.total_earned?.toFixed(2)} €</p>
                </div>
                <span className="text-3xl">🏆</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 shadow border border-purple-200">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-purple-600 mb-1">Total retiré</p>
                  <p className="text-3xl font-bold text-gray-900">{wallet.total_withdrawn?.toFixed(2)} €</p>
                </div>
                <span className="text-3xl">💸</span>
              </div>
            </div>
          </div>
        )}

        {/* Statistiques de la période */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 mb-1">Ventes ({period})</p>
              <p className="text-2xl font-bold">{stats.period_sales || 0}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 mb-1">Chiffre d'affaires</p>
              <p className="text-2xl font-bold text-green-600">
                {stats.period_revenue?.toFixed(2) || '0.00'} €
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 mb-1">Commission plateforme</p>
              <p className="text-2xl font-bold text-orange-600">
                {stats.period_fees?.toFixed(2) || '0.00'} €
              </p>
            </div>
          </div>
        )}

        {/* Filtres de période */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'week', label: 'Cette semaine' },
              { value: 'month', label: 'Ce mois' },
              { value: 'year', label: 'Cette année' },
              { value: 'all', label: 'Tout' }
            ].map(p => (
              <button
                key={p.value}
                onClick={() => {
                  setPeriod(p.value)
                  setPagination(prev => ({ ...prev, page: 1 }))
                }}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  period === p.value 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Historique des transactions */}
        <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-xl font-semibold text-gray-900">Historique des transactions</h2>
          </div>

          {transactions.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📊</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Aucune transaction
              </h3>
              <p className="text-gray-600">
                Les transactions apparaîtront ici quand vous aurez des ventes.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Commande
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Méthode
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Montant
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Commission
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Net
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Statut
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transactions.map((tx: any) => (
                      <tr key={tx.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(tx.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          #{tx.order_number || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className="flex items-center gap-1">
                            <span>{getPaymentMethodIcon(tx.payment_method)}</span>
                            <span>
                              {tx.payment_method === 'card' && 'Carte'}
                              {tx.payment_method === 'paypal' && 'PayPal'}
                              {tx.payment_method === 'moncash' && 'MonCash'}
                              {tx.payment_method === 'natcash' && 'NatCash'}
                              {tx.payment_method === 'cash_on_delivery' && 'Livraison'}
                            </span>
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {tx.amount?.toFixed(2)} €
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          -{tx.platform_fee_amount?.toFixed(2)} €
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                          +{tx.seller_amount?.toFixed(2)} €
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(tx.transaction_status)}`}
                          title={tx.transaction_status === 'pending' ? 'En attente de confirmation de paiement' : ''}>
                            {getStatusLabel(tx.transaction_status)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Page {pagination.page} sur {pagination.pages}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                      disabled={pagination.page <= 1}
                      className="px-3 py-1 border rounded-md disabled:opacity-50 hover:bg-gray-50"
                    >
                      Précédent
                    </button>
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                      disabled={pagination.page >= pagination.pages}
                      className="px-3 py-1 border rounded-md disabled:opacity-50 hover:bg-gray-50"
                    >
                      Suivant
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Historique des retraits */}
        {withdrawals.length > 0 && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-xl font-semibold text-gray-900">Historique des retraits</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Référence
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Méthode
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Montant
                    </th>
                    <th>Frais</th>  
                    <th>Net reçu</th>   
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {withdrawals.map((wd: any) => (
                    <tr key={wd.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(wd.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {wd.reference}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="flex items-center gap-1">
                          <span>{getPaymentMethodIcon(wd.method)}</span>
                          <span>
                            {wd.method === 'bank' && 'Virement'}
                            {wd.method === 'paypal' && 'PayPal'}
                            {wd.method === 'moncash' && 'MonCash'}
                          </span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {wd.amount?.toFixed(2)} €
                      </td>
                      <td className="text-red-600">-{wd.fee?.toFixed(2)} €</td>  
                      <td className="text-green-600 font-medium">{wd.net_amount?.toFixed(2)} €</td> 
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(wd.status)}`}>
                          {getStatusLabel(wd.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal de retrait */}
        {showWithdrawModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Retirer des fonds</h3>
                <button
                  onClick={() => setShowWithdrawModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Montant à retirer
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="0.00"
                    min="10"
                    max={wallet?.balance}
                    step="0.01"
                    className="w-full px-3 py-2 border rounded-lg pr-12 focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="absolute right-3 top-2 text-gray-500">€</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Solde disponible: {wallet?.balance?.toFixed(2)} € • Minimum: 10 €
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Méthode de retrait
                </label>
                <select
                  value={withdrawMethod}
                  onChange={(e) => setWithdrawMethod(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="bank">🏦 Virement bancaire (2-3 jours)</option>
                  <option value="paypal">🅿️ PayPal (24-48h)</option>
                  <option value="moncash">📱 MonCash (Instantané)</option>
                </select>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <p className="text-sm text-blue-800">
                  <span className="font-bold">🔧 Mode simulation</span>
                  <br />
                  En mode test, les retraits sont simulés. Aucun virement réel n'est effectué.
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleWithdrawRequest}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Confirmer le retrait
                </button>
                <button
                  onClick={() => setShowWithdrawModal(false)}
                  className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
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