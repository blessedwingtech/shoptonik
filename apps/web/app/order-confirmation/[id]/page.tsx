// apps/web/app/order-confirmation/[id]/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/app/contexts/AuthContext'
import { api } from '@/app/lib/api'
import Link from 'next/link'

export default function OrderConfirmationPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [shopNames, setShopNames] = useState<Record<string, string>>({})

  const orderId = params.id as string

  const getImageUrl = (url: string | null | undefined) => {
    if (!url) return null
    if (url.startsWith('http')) return url
    // Si l'URL est relative (commence par /uploads), ajoutez le domaine du backend
    return `${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '')}${url}`
    }

  useEffect(() => {
    if (orderId) {
      loadOrder()
    }
  }, [orderId])

  const loadOrder = async () => {
    setLoading(true)
    try {
      const response = await api.getOrderById(orderId)
      if (response.data) {
        setOrder(response.data)
        // Charger le nom de la boutique si shop_id existe
        if (response.data.shop_id && !shopNames[response.data.shop_id]) {
          loadShopName(response.data.shop_id)
        }
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

  const loadShopName = async (shopId: string) => {
    try {
      const response = await api.getPublicShop(shopId)
      if (response.data) {
        //setShopNames(prev => ({ ...prev, [shopId]: response.data.name }))
        setShopNames(prev => ({ ...prev, [shopId]: response.data?.name || '' }))
      }
    } catch (err) {
      console.error('Erreur chargement boutique:', err)
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
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Paris'
    })
  }

  const getStatusInfo = (status: string) => {
    const statusMap: Record<string, { label: string, color: string }> = {
      pending: { label: 'En attente de confirmation', color: 'bg-yellow-100 text-yellow-800' },
      processing: { label: 'En cours de préparation', color: 'bg-blue-100 text-blue-800' },
      shipped: { label: 'Expédiée', color: 'bg-purple-100 text-purple-800' },
      delivered: { label: 'Livrée', color: 'bg-green-100 text-green-800' },
      cancelled: { label: 'Annulée', color: 'bg-red-100 text-red-800' }
    }
    return statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-800' }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement de votre commande...</p>
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
          <Link href="/my-orders" className="text-blue-600 hover:text-blue-800">
            ← Retour à mes commandes
          </Link>
        </div>
      </div>
    )
  }

  const statusInfo = getStatusInfo(order.status)

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Message de confirmation */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Merci pour votre commande !
          </h1>
          <p className="text-gray-600">
            Votre commande #{order.order_number} a été enregistrée avec succès.
          </p>
        </div>

        {/* Statut */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold mb-2">Statut de la commande</h2>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
                {statusInfo.label}
              </span>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Commandé le</p>
              <p className="font-medium">{formatDate(order.created_at)}</p>
            </div>
          </div>
        </div>

        {/* Récapitulatif des articles */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Vos articles</h2>
          <div className="space-y-4">
            {order.items?.map((item: any, index: number) => {
                // Utiliser la fonction getImageUrl pour construire l'URL complète
                const imageUrl = getImageUrl(item.product_image)
                
                return (
                    <div key={index} className="flex items-start gap-4 pb-4 border-b last:border-0">
                    {imageUrl ? (
                        <img 
                        src={imageUrl} 
                        alt={item.product_name} 
                        className="w-16 h-16 object-cover rounded"
                        onError={(e) => {
                            // En cas d'erreur de chargement, cacher l'image et afficher le fallback
                            e.currentTarget.style.display = 'none'
                            const fallback = e.currentTarget.parentElement?.querySelector('.fallback')
                            if (fallback) fallback.classList.remove('hidden')
                        }}
                        />
                    ) : null}
                    
                    {/* Fallback (caché par défaut si imageUrl existe) */}
                    <div className={`w-16 h-16 bg-gray-100 rounded flex items-center justify-center ${imageUrl ? 'hidden' : ''} fallback`}>
                        <span className="text-gray-400 text-2xl">📦</span>
                    </div>
                    
                    <div className="flex-1">
                        <h3 className="font-medium">{item.product_name}</h3>
                        <p className="text-sm text-gray-600">Quantité: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                        <p className="font-medium">{formatPrice(item.total_price)}</p>
                        <p className="text-sm text-gray-500">{formatPrice(item.product_price)} / unité</p>
                    </div>
                    </div>
                )
                })}
          </div>
        </div>

        {/* Informations de livraison */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Livraison</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-500 mb-1">Adresse de livraison</p>
              <p className="font-medium">{order.customer_name}</p>
              <p className="text-gray-600">{order.customer_address?.street}</p>
              <p className="text-gray-600">
                {order.customer_address?.postal_code} {order.customer_address?.city}
              </p>
              <p className="text-gray-600">{order.customer_address?.country}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Contact</p>
              <p className="text-gray-600">{order.customer_email}</p>
              {order.customer_phone && (
                <p className="text-gray-600">{order.customer_phone}</p>
              )}
              {order.tracking_number && (
                <>
                  <p className="text-sm text-gray-500 mt-3 mb-1">Numéro de suivi</p>
                  <p className="font-mono text-gray-600">{order.tracking_number}</p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Récapitulatif des montants */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Récapitulatif</h2>
          <div className="space-y-2 max-w-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Sous-total</span>
              <span>{formatPrice(order.subtotal || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Livraison</span>
              <span>{formatPrice(order.shipping_fee || 0)}</span>
            </div>
            {order.tax_amount > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">TVA</span>
                <span>{formatPrice(order.tax_amount)}</span>
              </div>
            )}
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span className="text-xl text-blue-600">{formatPrice(order.total_amount)}</span>
              </div>
            </div>
            <div className="text-sm text-gray-500 mt-2">
              Paiement : {order.payment_method === 'cash_on_delivery' ? 'À la livraison' : 'En ligne'}
            </div>
          </div>
        </div>

        {/* Boutique */}
        {order.shop_id && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Vendeur</h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{order.shop.name || 'Boutique'}</p>
                <Link 
                href={`/shop/${order.shop?.slug}`}
                className="text-sm text-blue-600 hover:text-blue-800"
                >
                Voir la boutique →
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-center gap-4">
          <Link
            href="/my-orders"
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Voir toutes mes commandes
          </Link>
          <Link
            href="/"
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            Continuer mes achats
          </Link>
        </div>
      </div>
    </div>
  )
}