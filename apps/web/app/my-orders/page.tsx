// apps/web/app/my-orders/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/app/contexts/AuthContext'
import { api } from '@/app/lib/api'
import Link from 'next/link'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export default function MyOrdersPage() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user) {
      loadOrders()
    }
  }, [user])

  const loadOrders = async () => {
    try {
      const response = await api.getMyOrders()
      if (response.data) {
        setOrders(response.data)
      } else if (response.error) {
        setError(response.error)
      }
    } catch (err: any) {
      console.error('Erreur chargement commandes:', err)
      setError('Erreur lors du chargement de vos commandes')
    } finally {
      setIsLoading(false)
    }
  }

  const formatPrice = (amount: number) => {
    // Si amount > 1000, c'est probablement en centimes
    if (amount > 1000 && amount < 1000000) {
      return (amount / 100).toFixed(2) + ' €'
    }
    return amount.toFixed(2) + ' €'
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd MMMM yyyy à HH:mm', { locale: fr })
    } catch {
      return dateString
    }
  }

  const getStatusInfo = (status: string) => {
    const statusMap: Record<string, { label: string, color: string }> = {
      pending: { label: '⏳ En attente', color: 'bg-yellow-100 text-yellow-800' },
      processing: { label: '🔧 En traitement', color: 'bg-blue-100 text-blue-800' },
      shipped: { label: '🚚 Expédiée', color: 'bg-purple-100 text-purple-800' },
      delivered: { label: '✅ Livrée', color: 'bg-green-100 text-green-800' },
      cancelled: { label: '❌ Annulée', color: 'bg-red-100 text-red-800' }
    }
    return statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-800' }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Connectez-vous</h1>
          <p className="text-gray-600 mb-6">Vous devez être connecté pour voir vos commandes.</p>
          <Link
            href="/auth/login"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Se connecter
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* En-tête */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mes commandes</h1>
            <p className="text-gray-600 mt-1">
              Bonjour {user.full_name || user.username}, voici votre historique d'achats.
            </p>
          </div>
          <button
            onClick={() => loadOrders()}
            disabled={isLoading}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm disabled:opacity-50"
          >
            {isLoading ? 'Actualisation...' : '🔄 Actualiser'}
          </button>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement de vos commandes...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="text-gray-400 text-6xl mb-4">📦</div>
            <h2 className="text-xl font-medium text-gray-900 mb-2">Aucune commande</h2>
            <p className="text-gray-600 mb-6">Vous n'avez pas encore passé de commande.</p>
            <Link
              href="/"
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Découvrir les boutiques
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => {
              const statusInfo = getStatusInfo(order.status)
              return (
                <div key={order.id} className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
                  {/* En-tête de la commande */}
                  <div className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Commande #{order.order_number}
                        </h3>
                        <div className="flex items-center gap-3 mt-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                          <span className="text-sm text-gray-500">
                            {formatDate(order.created_at)}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900">
                          {formatPrice(order.total_amount)}
                        </div>
                        <div className="text-sm text-gray-500">
                          Paiement : {order.payment_method === 'cash_on_delivery' ? 'À la livraison' : 'En ligne'}
                        </div>
                      </div>
                    </div>

                    {/* Informations client */}
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-700 mb-2">Informations de livraison</h4>
                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">
                            <span className="font-medium">Nom :</span> {order.customer_name}
                          </p>
                          <p className="text-gray-600">
                            <span className="font-medium">Email :</span> {order.customer_email}
                          </p>
                          {order.customer_phone && (
                            <p className="text-gray-600">
                              <span className="font-medium">Téléphone :</span> {order.customer_phone}
                            </p>
                          )}
                        </div>
                        {order.customer_address && (
                          <div>
                            <p className="text-gray-600">
                              <span className="font-medium">Adresse :</span><br />
                              {order.customer_address.street}<br />
                              {order.customer_address.postal_code} {order.customer_address.city}<br />
                              {order.customer_address.country}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Articles */}
                    <div className="mt-4">
                      <h4 className="font-medium text-gray-700 mb-2">Articles commandés</h4>
                      <div className="space-y-2">
                        {order.items?.map((item: any, index: number) => (
                          <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                            <div className="flex items-center gap-3">
                              {item.product_image && (
                                <img src={item.product_image} alt={item.product_name} className="w-12 h-12 object-cover rounded" />
                              )}
                              <div>
                                <p className="font-medium">{item.product_name}</p>
                                <p className="text-sm text-gray-500">Quantité : {item.quantity}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">{formatPrice(item.total_price)}</p>
                              <p className="text-sm text-gray-500">{formatPrice(item.product_price)} / unité</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4 border-t border-gray-100 mt-4">
                      <Link
                        href={`/order-confirmation/${order.id}`}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                      >
                        Voir les détails
                      </Link>
                      {order.shop && (
                        <Link
                            href={`/shop/${order.shop.slug || order.shop_id}`}  // ← Utilisez slug si disponible
                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm"
                        >
                            Voir la boutique
                        </Link>
                        )}
                      {order.tracking_number && (
                        <div className="ml-auto text-sm text-gray-600">
                          Suivi : {order.tracking_number}
                        </div>
                      )}
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
