'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/app/contexts/AuthContext'
import { api } from '@/app/lib/api'
import Link from 'next/link'

interface Order {
  id: string
  order_number: string
  customer_name: string
  customer_email: string
  total_amount: number
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  items: Array<{
    product_name: string
    quantity: number
    product_price: number
    total_price: number
  }>
  created_at: string
  payment_status: string
}

interface OrderStats {
  total_orders: number
  total_revenue: number
  pending_count: number
  processing_count: number
  shipped_count: number
  delivered_count: number
  cancelled_count: number
}

export default function SellerOrdersPage() {
  const { user } = useAuth()
  const [shops, setShops] = useState<any[]>([])
  const [selectedShop, setSelectedShop] = useState<string>('')
  const [orders, setOrders] = useState<Order[]>([])
  const [stats, setStats] = useState<OrderStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>('all')

  useEffect(() => {
    loadShops()
  }, [])

  useEffect(() => {
    if (selectedShop) {
      loadOrders()
      loadStats()
    }
  }, [selectedShop, filterStatus])

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
      // Implémentez cette fonction dans api.ts
      const response = await api.getShopOrders(selectedShop)
      console.log('📦 Commandes reçues:', response.data)
console.log('📦 payment_confirmed des commandes:', response.data.map((o: any) => o.payment_confirmed))
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
      // Implémentez cette fonction dans api.ts
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
      // Implémentez cette fonction dans api.ts
      await api.updateOrderStatus(selectedShop, orderId, status)
      loadOrders() // Recharger les commandes
      loadStats() // Recharger les stats
    } catch (err) {
      console.error('Erreur mise à jour statut:', err)
    }
  }

  const formatPrice = (amount: number) => {
  // Testez d'abord si c'est en centimes ou euros
  // Si amount > 1000, c'est probablement en centimes
  // Sinon, c'est en euros
  
  if (amount > 1000) {
    // Convertir centimes → euros
    return (amount / 100).toFixed(2) + ' €'
  } else {
    // Déjà en euros
    return amount.toFixed(2) + ' €'
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

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'En attente',
      processing: 'En traitement',
      shipped: 'Expédiée',
      delivered: 'Livrée',
      cancelled: 'Annulée'
    }
    return labels[status] || status
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Commandes</h1>
          <p className="mt-2 text-gray-600">
            Gérez les commandes de vos boutiques
          </p>
        </div>

        {/* Boutique sélection */}
        <div className="mb-6">
          <select
            value={selectedShop}
            onChange={(e) => setSelectedShop(e.target.value)}
            className="block w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md shadow-sm"
          >
            {shops.map(shop => (
              <option key={shop.id} value={shop.slug}>{shop.name}</option>
            ))}
          </select>
        </div>

        {/* Statistiques */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8">
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-sm text-gray-500">Total Commandes</div>
              <div className="text-2xl font-bold">{stats.total_orders}</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-sm text-gray-500">Chiffre d'affaires</div>
              <div className="text-2xl font-bold">{formatPrice(stats.total_revenue)}</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-sm text-gray-500">En attente</div>
              <div className="text-2xl font-bold text-yellow-600">{stats.pending_count}</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-sm text-gray-500">En traitement</div>
              <div className="text-2xl font-bold text-blue-600">{stats.processing_count}</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-sm text-gray-500">Expédiées</div>
              <div className="text-2xl font-bold text-purple-600">{stats.shipped_count}</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-sm text-gray-500">Livrées</div>
              <div className="text-2xl font-bold text-green-600">{stats.delivered_count}</div>
            </div>
          </div>
        )}

        {/* Filtres */}
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-4 py-2 rounded-md ${filterStatus === 'all' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border'}`}
          >
            Toutes
          </button>
          {['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-md ${filterStatus === status ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border'}`}
            >
              {getStatusLabel(status)}
            </button>
          ))}
        </div>

        {/* Liste des commandes */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement des commandes...</p>
          </div>
        ) : orders.length === 0 ? (
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
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {orders.map(order => (
                <li key={order.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex flex-col md:flex-row md:items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">
                            Commande #{order.order_number}
                          </h3>
                          <div className="mt-2 flex flex-wrap items-center gap-4">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                              {getStatusLabel(order.status)}
                            </span>
                            <span className="text-sm text-gray-500">
                              {formatDate(order.created_at)}
                            </span>
                            <span className="text-sm text-gray-500">
                              {order.customer_name} ({order.customer_email})
                            </span>
                          </div>
                          <div className="mt-3">
                            <h4 className="text-sm font-medium text-gray-700">Articles :</h4>
                            <ul className="mt-1 space-y-1">
                              {order.items.map((item, index) => (
                                <li key={index} className="text-sm text-gray-600">
                                  {item.quantity}x {item.product_name} - {formatPrice(item.total_price)}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                        <div className="mt-4 md:mt-0 md:ml-6">
                          <div className="text-xl font-bold text-gray-900">
                            {formatPrice(order.total_amount)}
                          </div>
                          <div className="text-sm text-gray-500">
                            Total TTC
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 md:mt-0 md:ml-4 flex space-x-2">
                      {order.status === 'pending' && (
                        <>
                          <button
                            onClick={() => updateOrderStatus(order.id, 'processing')}
                            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                          >
                            Traiter
                          </button>
                          <button
                            onClick={() => updateOrderStatus(order.id, 'cancelled')}
                            className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                          >
                            Annuler
                          </button>
                        </>
                      )}
                      {order.status === 'processing' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'shipped')}
                          className="px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700"
                        >
                          Marquer comme expédié
                        </button>
                      )}
                      {order.status === 'shipped' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'delivered')}
                          className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                        >
                          Marquer comme livré
                        </button>
                      )}
                      <Link
                        href={`/seller/orders/${order.id}`}
                        className="px-3 py-1 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
                      >
                        Détails
                      </Link>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
