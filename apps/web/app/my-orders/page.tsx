'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/app/contexts/AuthContext'
import { api } from '@/app/lib/api'
import Link from 'next/link'

export default function MyOrdersPage() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

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
      }
    } catch (err) {
      console.error('Erreur chargement commandes:', err)
    } finally {
      setIsLoading(false)
    }
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
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Mes commandes</h1>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement de vos commandes...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-gray-400 text-6xl mb-4">📦</div>
            <h2 className="text-xl font-medium text-gray-900 mb-2">Aucune commande</h2>
            <p className="text-gray-600 mb-6">Vous n'avez pas encore passé de commande.</p>
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Découvrir les boutiques
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map(order => (
              <div key={order.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Commande #{order.order_number}
                      </h3>
                      <p className="text-gray-600 text-sm mt-1">
                        Passée le {new Date(order.created_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <div className="mt-2 md:mt-0">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {order.status === 'pending' ? 'En attente' :
                         order.status === 'processing' ? 'En traitement' :
                         order.status === 'shipped' ? 'Expédiée' : 'Livrée'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-500">Montant total</p>
                      <p className="text-xl font-bold">{(order.total_amount || 0).toFixed(2)} €</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Articles</p>
                      <p className="font-medium">
                        {Array.isArray(order.items) ? order.items.length : 0} article(s)
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Boutique</p>
                      {order.shop ? (
                        <Link 
                          href={`/shop/${order.shop.slug || order.shop.id}`}
                          className="font-medium text-blue-600 hover:text-blue-800"
                        >
                          {order.shop.name}
                        </Link>
                      ) : (
                        <p className="font-medium">Boutique</p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Link
                      href={`/order-confirmation/${order.id}`}
                      className="flex-1 text-center py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      Voir les détails
                    </Link>
                    <Link
                      href={`/shop/${order.shop?.slug || ''}`}
                      className="flex-1 text-center py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                        onClick={(e) => {
                          if (!order.shop?.slug) {
                            e.preventDefault()
                            alert('Information boutique non disponible')
                          }
                        }}
                      >
                      Voir la boutique
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
