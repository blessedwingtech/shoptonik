'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/app/contexts/AuthContext'
import { api } from '@/app/lib/api'
import Link from 'next/link'

interface OrderDetails {
  id: string
  order_number: string
  customer_name: string
  customer_email: string
  customer_phone?: string
  customer_address: {
    street: string
    city: string
    postal_code: string
    country: string
    additional_info?: string
  }
  items: Array<{
    product_name: string
    quantity: number
    product_price: number
    total_price: number
    product_image?: string
    product_sku?: string
  }>
  subtotal: number
  shipping_fee: number
  tax_amount: number
  total_amount: number
  payment_method: string
  payment_status: string
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  notes?: string
  created_at: string
  updated_at: string
}

export default function OrderDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [order, setOrder] = useState<OrderDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updating, setUpdating] = useState(false)

  const orderId = params.id as string

  useEffect(() => {
    if (orderId) {
      loadOrderDetails()
    }
  }, [orderId])

  const loadOrderDetails = async () => {
    setLoading(true)
    try {
      // Note: Vous devez d'abord sélectionner une boutique
      // Pour l'instant, on utilise la première boutique du vendeur
      const shopsResponse = await api.getMyShops()
      if (!shopsResponse.data || shopsResponse.data.length === 0) {
        setError('Aucune boutique trouvée')
        return
      }

      const shopSlug = shopsResponse.data[0].slug
      const response = await api.request<any>(`/shops/${shopSlug}/orders/${orderId}`)
      
      if (response.data) {
        setOrder(response.data)
      } else {
        setError('Commande non trouvée')
      }
    } catch (err) {
      console.error('Erreur chargement commande:', err)
      setError('Erreur lors du chargement de la commande')
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (newStatus: string) => {
    if (!order) return
    
    setUpdating(true)
    try {
      const shopsResponse = await api.getMyShops()
      const shopSlug = shopsResponse.data![0].slug
      
      await api.updateOrderStatus(shopSlug, order.id, newStatus)
      setOrder({ ...order, status: newStatus as any })
    } catch (err) {
      console.error('Erreur mise à jour statut:', err)
    } finally {
      setUpdating(false)
    }
  }

  const formatPrice = (amount: number) => {
    if (amount > 1000) {
      return (amount / 100).toFixed(2) + ' €'
    }
    return amount.toFixed(2) + ' €'
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

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      card: 'Carte bancaire',
      cash_on_delivery: 'Paiement à la livraison',
      moncash: 'MonCash',
      natcash: 'NatCash',
      paypal: 'PayPal'
    }
    return labels[method] || method
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement de la commande...</p>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-3xl mx-auto px-4">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
            {error || 'Commande non trouvée'}
          </div>
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-800"
          >
            ← Retour
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-800"
          >
            ← Retour aux commandes
          </button>
          <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(order.status)}`}>
            {getStatusLabel(order.status)}
          </span>
        </div>

        {/* Titre */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Commande #{order.order_number}
          </h1>
          // Dans MyOrdersPage, remplacez la ligne de date par :

<p className="text-gray-600 text-sm mt-1">
  Passée le {new Date(order.created_at).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Paris'  // Forcer le fuseau horaire français
  })}
</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Colonne principale */}
          <div className="md:col-span-2 space-y-6">
            {/* Articles */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Articles commandés</h2>
              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div key={index} className="flex items-start gap-4 pb-4 border-b last:border-0">
                    {item.product_image ? (
                      <img
                        src={item.product_image}
                        alt={item.product_name}
                        className="w-16 h-16 object-cover rounded"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center">
                        <span className="text-gray-400">📦</span>
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-medium">{item.product_name}</h3>
                      {item.product_sku && (
                        <p className="text-sm text-gray-500">SKU: {item.product_sku}</p>
                      )}
                      <p className="text-sm text-gray-600">
                        {item.quantity} × {formatPrice(item.product_price)}
                      </p>
                    </div>
                    <div className="font-medium">
                      {formatPrice(item.total_price)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions (si commande non livrée/annulée) */}
            {order.status !== 'delivered' && order.status !== 'cancelled' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Actions</h2>
                <div className="flex flex-wrap gap-3">
                  {order.status === 'pending' && (
                    <>
                      <button
                        onClick={() => updateOrderStatus('processing')}
                        disabled={updating}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                      >
                        Traiter la commande
                      </button>
                      <button
                        onClick={() => updateOrderStatus('cancelled')}
                        disabled={updating}
                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                      >
                        Annuler la commande
                      </button>
                    </>
                  )}
                  {order.status === 'processing' && (
                    <button
                      onClick={() => updateOrderStatus('shipped')}
                      disabled={updating}
                      className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
                    >
                      Marquer comme expédiée
                    </button>
                  )}
                  {order.status === 'shipped' && (
                    <button
                      onClick={() => updateOrderStatus('delivered')}
                      disabled={updating}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                    >
                      Marquer comme livrée
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Colonne latérale */}
          <div className="space-y-6">
            {/* Client */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Client</h2>
              <div className="space-y-2">
                <p className="font-medium">{order.customer_name}</p>
                <p className="text-sm text-gray-600">{order.customer_email}</p>
                {order.customer_phone && (
                  <p className="text-sm text-gray-600">{order.customer_phone}</p>
                )}
              </div>
            </div>

            {/* Adresse de livraison */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Adresse de livraison</h2>
              <div className="space-y-1 text-sm text-gray-600">
                <p>{order.customer_address.street}</p>
                <p>{order.customer_address.postal_code} {order.customer_address.city}</p>
                <p>{order.customer_address.country}</p>
                {order.customer_address.additional_info && (
                  <p className="mt-2 text-gray-500">{order.customer_address.additional_info}</p>
                )}
              </div>
            </div>

            {/* Paiement */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Paiement</h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Méthode</span>
                  <span className="font-medium">{getPaymentMethodLabel(order.payment_method)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Statut</span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    order.payment_status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {order.payment_status === 'paid' ? 'Payé' : 'En attente'}
                  </span>
                </div>
              </div>
            </div>

            {/* Récapitulatif */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Récapitulatif</h2>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Sous-total</span>
                  <span>{formatPrice(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Livraison</span>
                  <span>{formatPrice(order.shipping_fee)}</span>
                </div>
                {order.tax_amount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">TVA</span>
                    <span>{formatPrice(order.tax_amount)}</span>
                  </div>
                )}
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span className="text-lg">{formatPrice(order.total_amount)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            {order.notes && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Notes</h2>
                <p className="text-gray-600">{order.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
