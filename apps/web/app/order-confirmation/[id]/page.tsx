'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/app/contexts/AuthContext'
import { api } from '@/app/lib/api'
import Link from 'next/link'

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
      // Vérifiez que la méthode existe
      if (!api.getMyOrders) {
        setError('Service indisponible')
        return
      }
      
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

  const refreshOrders = () => {
    setError('')
    setIsLoading(true)
    loadOrders()
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
        {/* En-tête avec bouton refresh */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mes commandes</h1>
            <p className="text-gray-600 mt-1">
              Bonjour {user.full_name || user.username}, voici votre historique d'achats.
            </p>
          </div>
          <button
            onClick={refreshOrders}
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
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/"
                className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Découvrir les boutiques
              </Link>
              <Link
                href="/shop/all"
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Explorer toutes les boutiques
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {orders.map(order => (
              <div key={order.id} className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow">
                {/* En-tête de la commande */}
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Commande #{order.order_number}
                      </h3>
                      <p className="text-gray-600 text-sm mt-1">
                        {new Date(order.created_at).toLocaleDateString('fr-FR', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                      order.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                      order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800' // cancelled
                    }`}>
                      {order.status === 'pending' ? '⏳ En attente' :
                       order.status === 'processing' ? '🔧 En traitement' :
                       order.status === 'shipped' ? '🚚 Expédiée' :
                       order.status === 'delivered' ? '✅ Livrée' : '❌ Annulée'}
                    </span>
                  </div>

                  {/* Résumé rapide */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-600">Articles</span>
                      <span className="font-medium">
                        {Array.isArray(order.items) ? order.items.length : 0} produit(s)
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Montant total</span>
                      <span className="text-xl font-bold text-gray-900">
                        {(order.total_amount || 0).toFixed(2)} €
                      </span>
                    </div>
                  </div>

                  {/* Aperçu des produits */}
                  <div className="mb-4">
                    <p className="text-sm text-gray-500 mb-2">Produits :</p>
                    <div className="space-y-2">
                      {Array.isArray(order.items) && order.items.slice(0, 2).map((item: any, index: number) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <span className="truncate flex-1 mr-2">
                            {item.product_name}
                            {item.quantity > 1 && ` (×${item.quantity})`}
                          </span>
                          <span className="font-medium whitespace-nowrap">
                            {item.total_price.toFixed(2)} €
                          </span>
                        </div>
                      ))}
                      {Array.isArray(order.items) && order.items.length > 2 && (
                        <p className="text-sm text-gray-500">
                          + {order.items.length - 2} autre(s) produit(s)
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4 border-t border-gray-100">
                    <Link
                      href={`/order-confirmation/${order.id}`}
                      className="flex-1 text-center py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                    >
                      Voir les détails
                    </Link>
                    {order.shop_id && (
                      <Link
                        href={`/shop/${order.shop_id}`}
                        className="flex-1 text-center py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm"
                      >
                        Voir la boutique
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Statistiques si commandes */}
        {orders.length > 0 && (
          <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Votre activité</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-lg shadow">
                <div className="text-2xl font-bold text-blue-600">{orders.length}</div>
                <div className="text-sm text-gray-600">Commandes totales</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <div className="text-2xl font-bold text-green-600">
                  {orders.filter(o => o.status === 'delivered').length}
                </div>
                <div className="text-sm text-gray-600">Commandes livrées</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <div className="text-2xl font-bold text-purple-600">
                  {orders.reduce((sum, order) => sum + (order.total_amount || 0), 0).toFixed(2)}€
                </div>
                <div className="text-sm text-gray-600">Dépensé au total</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <div className="text-2xl font-bold text-orange-600">
                  {orders.reduce((sum, order) => sum + (Array.isArray(order.items) ? order.items.length : 0), 0)}
                </div>
                <div className="text-sm text-gray-600">Produits achetés</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}