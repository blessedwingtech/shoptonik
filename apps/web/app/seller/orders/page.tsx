// apps/web/app/seller/orders/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/app/contexts/AuthContext'
import { api, type Order} from '@/app/lib/api'
import Link from 'next/link'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale' 

 

 

export default function SellerOrdersPage() {
  const { user } = useAuth()
  const [shops, setShops] = useState<any[]>([])
  const [selectedShop, setSelectedShop] = useState<string>('')
  const [orders, setOrders] = useState<Order[]>([])
  const [stats, setStats] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [showPendingOnly, setShowPendingOnly] = useState(false)

  useEffect(() => {
    loadShops()
  }, [])

  useEffect(() => {
    if (selectedShop) {
      loadOrders()
      loadStats()
    }
  }, [selectedShop, filterStatus, showPendingOnly])

  const loadShops = async () => {
    try {
      const response = await api.getMyShops()
      if (response.data && response.data.length > 0) {
        setShops(response.data)
        setSelectedShop(response.data[0].slug)
      }
    } catch (err) {
      console.error('Erreur chargement boutiques:', err)
    }
  }

  const loadOrders = async () => {
    setIsLoading(true)
    try {
      const response = await api.getShopOrders(selectedShop)
      if (response.data) {
        let filteredOrders = response.data
        if (filterStatus !== 'all') {
          filteredOrders = response.data.filter((order: Order) => order.status === filterStatus)
        }
        setOrders(filteredOrders)
      }
    } catch (err) {
      console.error('Erreur chargement commandes:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const response = await api.getOrderStats(selectedShop)
      if (response.data) {
        setStats(response.data)
      }
    } catch (err) {
      console.error('Erreur chargement stats:', err)
    }
  }

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      await api.updateOrderStatus(selectedShop, orderId, status)
      loadOrders()
      loadStats()
    } catch (err) {
      console.error('Erreur mise à jour statut:', err)
    }
  }

  const formatPrice = (amount: number) => {
    if (amount > 1000 && amount < 1000000) {
      return (amount / 100).toFixed(2) + ' €'
    }
    return amount.toFixed(2) + ' €'
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd MMM yyyy à HH:mm', { locale: fr })
    } catch {
      return dateString
    }
  }

  const getStatusInfo = (status: string) => {
    const statusMap: Record<string, { label: string, color: string }> = {
      pending: { label: 'En attente', color: 'bg-yellow-100 text-yellow-800' },
      processing: { label: 'En traitement', color: 'bg-blue-100 text-blue-800' },
      shipped: { label: 'Expédiée', color: 'bg-purple-100 text-purple-800' },
      delivered: { label: 'Livrée', color: 'bg-green-100 text-green-800' },
      cancelled: { label: 'Annulée', color: 'bg-red-100 text-red-800' }
    }
    return statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-800' }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Commandes</h1>
          <p className="mt-2 text-gray-600">Gérez les commandes de vos boutiques</p>
        </div>

        {/* Sélection boutique */}
        <div className="mb-6 flex flex-wrap gap-4 items-center">
          <select
            value={selectedShop}
            onChange={(e) => setSelectedShop(e.target.value)}
            className="block w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md shadow-sm"
          >
            {shops.map(shop => (
              <option key={shop.id} value={shop.slug}>{shop.name}</option>
            ))}
          </select>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showPendingOnly}
              onChange={(e) => setShowPendingOnly(e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-sm text-gray-700">Afficher uniquement les commandes en attente</span>
          </label>
        </div>

        {/* Statistiques */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
            <StatCard label="Total" value={stats.total_orders} color="text-gray-900" />
            <StatCard label="CA" value={formatPrice(stats.total_revenue)} color="text-green-600" />
            <StatCard label="En attente" value={stats.pending_count} color="text-yellow-600" />
            <StatCard label="En traitement" value={stats.processing_count} color="text-blue-600" />
            <StatCard label="Expédiées" value={stats.shipped_count} color="text-purple-600" />
            <StatCard label="Livrées" value={stats.delivered_count} color="text-green-600" />
          </div>
        )}

        {/* Filtres */}
        <div className="mb-6 flex flex-wrap gap-2">
          <FilterButton
            label="Toutes"
            active={filterStatus === 'all'}
            onClick={() => setFilterStatus('all')}
          />
          {['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map(status => (
            <FilterButton
              key={status}
              label={getStatusInfo(status).label}
              active={filterStatus === status}
              onClick={() => setFilterStatus(status)}
            />
          ))}
        </div>

        {/* Liste des commandes */}
        {isLoading ? (
          <LoadingSpinner />
        ) : orders.length === 0 ? (
          <EmptyState filterStatus={filterStatus} getStatusLabel={(s) => getStatusInfo(s).label} />
        ) : (
          <div className="space-y-4">
            {orders.map(order => {
              const statusInfo = getStatusInfo(order.status)
              return (
                <div key={order.id} className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="p-6">
                    {/* En-tête commande */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Commande #{order.order_number}
                        </h3>
                        <div className="flex flex-wrap items-center gap-3 mt-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                          <span className="text-sm text-gray-500">
                            {formatDate(order.created_at)}
                          </span>
                          <span className="text-sm text-gray-500">
                            {order.payment_method === 'cash_on_delivery' ? 'Paiement à la livraison' : 'Paiement en ligne'}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900">
                          {formatPrice(order.total_amount)}
                        </div>
                        <div className="text-sm text-gray-500">Total TTC</div>
                      </div>
                    </div>

                    {/* Informations client */}
                    <div className="grid md:grid-cols-2 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">Client</h4>
                        <p className="text-sm">{order.customer_name}</p>
                        <p className="text-sm">{order.customer_email}</p>
                        {order.customer_phone && (
                          <p className="text-sm">📞 {order.customer_phone}</p>
                        )}
                      </div>
                      {order.tracking_number && (
                        <div>
                          <h4 className="font-medium text-gray-700 mb-2">Suivi</h4>
                          <p className="text-sm">📦 {order.tracking_number}</p>
                        </div>
                      )}
                    </div>

                    {/* Articles */}
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-700 mb-2">Articles</h4>
                      <div className="space-y-2">
                        {order.items.map((item: { product_name: string; quantity: number; product_price: number; total_price: number }, index: number) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span>
                              {item.quantity}x {item.product_name}
                            </span>
                            <span className="font-medium">{formatPrice(item.total_price)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200">
                      {order.status === 'pending' && (
                        <>
                          <ActionButton
                            onClick={() => updateOrderStatus(order.id, 'processing')}
                            color="blue"
                            label="Traiter"
                          />
                          <ActionButton
                            onClick={() => updateOrderStatus(order.id, 'cancelled')}
                            color="red"
                            label="Annuler"
                          />
                        </>
                      )}
                      {order.status === 'processing' && (
                        <ActionButton
                          onClick={() => updateOrderStatus(order.id, 'shipped')}
                          color="purple"
                          label="Marquer expédié"
                        />
                      )}
                      {order.status === 'shipped' && (
                        <ActionButton
                          onClick={() => updateOrderStatus(order.id, 'delivered')}
                          color="green"
                          label="Marquer livré"
                        />
                      )}
                      <Link
                        href={`/seller/orders/${order.id}`}
                        className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                      >
                        Détails complets
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// Composants auxiliaires
const StatCard = ({ label, value, color }: { label: string, value: any, color: string }) => (
  <div className="bg-white p-4 rounded-lg shadow">
    <div className="text-sm text-gray-500">{label}</div>
    <div className={`text-xl font-bold ${color}`}>{value}</div>
  </div>
)

const FilterButton = ({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-md text-sm ${
      active 
        ? 'bg-blue-600 text-white' 
        : 'bg-white text-gray-700 border hover:bg-gray-50'
    }`}
  >
    {label}
  </button>
)

const ActionButton = ({ onClick, color, label }: { onClick: () => void, color: string, label: string }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 text-sm bg-${color}-600 text-white rounded-md hover:bg-${color}-700`}
  >
    {label}
  </button>
)

const LoadingSpinner = () => (
  <div className="text-center py-12">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
    <p className="mt-4 text-gray-600">Chargement des commandes...</p>
  </div>
)

const EmptyState = ({ filterStatus, getStatusLabel }: { filterStatus: string, getStatusLabel: (s: string) => string }) => (
  <div className="bg-white rounded-lg shadow p-8 text-center">
    <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
    <h3 className="text-lg font-medium text-gray-900 mb-2">
      Aucune commande trouvée
    </h3>
    <p className="text-gray-500">
      {filterStatus === 'all' 
        ? "Vous n'avez pas encore de commandes." 
        : `Aucune commande avec le statut "${getStatusLabel(filterStatus)}"`}
    </p>
  </div>
)
