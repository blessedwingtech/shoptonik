'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useAuth } from '@/app/contexts/AuthContext'
import { api } from '@/app/lib/api'
import { useCart } from '@/app/hooks/useCart'
import Link from 'next/link'
import PaymentMethods from '@/app/components/PaymentMethods'

export default function CheckoutPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const slug = searchParams.get('shop')
  
  const [shop, setShop] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [paymentStep, setPaymentStep] = useState<'form' | 'payment'>('form')
  const [checkoutData, setCheckoutData] = useState<any>(null)
  
  // Utiliser le hook useCart
  const cart = useCart(slug || '')
  
  // Données du formulaire
  const [formData, setFormData] = useState({
    customer_name: user?.full_name || user?.username || '',
    customer_email: user?.email || '',
    customer_phone: user?.phone || '',
    street: '',
    city: '',
    postal_code: '',
    country: 'France',
    shipping_method: 'standard',
    notes: ''
  })

  const [hasLoadedCart, setHasLoadedCart] = useState(false)

  // Redirection si non connecté
  useEffect(() => {
    const checkAuthAndRedirect = () => {
      if (!isAuthenticated && slug) {
        console.log(`🔐 Utilisateur non connecté, sauvegarde de l'intention checkout`)
        
        localStorage.setItem('checkout_intent', JSON.stringify({
          shopSlug: slug,
          timestamp: Date.now(),
          from_checkout_page: true
        }))
        
        router.push(`/auth/login?redirect=/checkout?shop=${slug}&merge_cart=true`)
        return true
      }
      return false
    }

    const timer = setTimeout(() => {
      if (!isLoading && !checkAuthAndRedirect()) {
        // L'utilisateur est connecté, continuer normalement
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [isAuthenticated, slug, router, isLoading])

  useEffect(() => {
    if (!cart.isLoading) {
      setHasLoadedCart(true)
    }
  }, [cart.isLoading])

  useEffect(() => {
    if (hasLoadedCart && cart.cart && cart.cart.items.length === 0 && slug) {
      router.replace(`/shop/${slug}`)
    }
  }, [hasLoadedCart, cart.cart, slug, router])

  useEffect(() => {
    if (slug) {
      loadShop()
    }
  }, [slug])

  const loadShop = async () => {
    try {
      const response = await api.getPublicShop(slug!)
      if (response.data) {
        setShop(response.data)
      } else {
        setError('Boutique non trouvée')
      }
    } catch (err) {
      console.error('Erreur chargement boutique:', err)
      setError('Erreur lors du chargement de la boutique')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!slug || !shop || !cart.cart) {
      setError('Données manquantes')
      return
    }

    // Préparer les items
    const items = cart.cart.items.map((item: any) => ({
      product_id: item.product_id,
      product_name: item.product_name,
      product_price: Number(item.product_price),
      quantity: Number(item.quantity),
      total_price: Number(item.total_price),
      product_image: item.product_image || null,
      product_sku: item.product_sku || null
    }))

    const shippingFee = formData.shipping_method === 'express' ? 9.99 : 4.99
    const cartTotal = items.reduce((sum: number, item: any) => sum + item.total_price, 0)
    const total = cartTotal + shippingFee
    
    // Préparer toutes les données pour l'étape de paiement
    const checkoutDataToSave = {
      shop_slug: slug,
      shop_id: shop.id,
      shipping_address: {
        street: formData.street,
        city: formData.city,
        postal_code: formData.postal_code,
        country: formData.country,
        additional_info: null
      },
      customer_notes: formData.notes,
      items: items,
      shipping_fee: shippingFee,
      shipping_method: formData.shipping_method,
      customer_name: formData.customer_name,
      customer_email: formData.customer_email,
      customer_phone: formData.customer_phone,
      cart_id: cart.cart.id,
      cart_items: cart.cart.items,
      total: total,
      subtotal: cartTotal
    }
    
    // Sauvegarder dans le state
    setCheckoutData(checkoutDataToSave)
    
    // Sauvegarder aussi dans localStorage pour sécurité (en cas de refresh)
    localStorage.setItem('checkout_data', JSON.stringify(checkoutDataToSave))
    
    // Passer à l'étape de paiement
    setPaymentStep('payment')
  }

  const handlePaymentSuccess = (orderId: string) => {
    // Vider le panier
    api.clearCart(slug!)
    
    // Sauvegarder l'email pour la confirmation
    localStorage.setItem('checkout_email', formData.customer_email)
    
    // Nettoyer les données temporaires
    localStorage.removeItem('checkout_data')
    localStorage.removeItem('checkout_intent')
    
    // Rediriger vers confirmation
    router.push(`/order-confirmation/${orderId}`)
  }

  const handlePaymentError = (errorMessage: string) => {
    setError(errorMessage)
    setPaymentStep('form') // Retour au formulaire en cas d'erreur
  }

  if (isLoading || cart.isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!shop) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Boutique non trouvée</h1>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Retour à l'accueil
          </Link>
        </div>
      </div>
    )
  }

  if (!cart.cart || cart.cart.items?.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Votre panier est vide</h1>
          <Link
            href={`/shop/${slug}`}
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Retour à la boutique
          </Link>
        </div>
      </div>
    )
  }

  const cartTotal = cart.cart.items.reduce((sum: number, item: any) => sum + item.total_price, 0)
  const shippingFee = formData.shipping_method === 'express' ? 9.99 : 4.99
  const total = cartTotal + shippingFee

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {paymentStep === 'form' ? 'Finaliser votre commande' : 'Paiement'}
          </h1>
          <Link
            href={`/shop/${slug}`}
            className="text-blue-600 hover:text-blue-800"
          >
            ← Retour à la boutique
          </Link>
        </div>
        
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {paymentStep === 'form' ? (
          /* ÉTAPE 1: FORMULAIRE D'ADRESSAGE */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Formulaire */}
            <div className="lg:col-span-2">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Informations client */}
                <div className="bg-white p-6 rounded-lg shadow">
                  <h2 className="text-xl font-semibold mb-4">Informations personnelles</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nom complet *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.customer_name}
                        onChange={e => setFormData({...formData, customer_name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.customer_email}
                        onChange={e => setFormData({...formData, customer_email: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Téléphone
                      </label>
                      <input
                        type="tel"
                        value={formData.customer_phone}
                        onChange={e => setFormData({...formData, customer_phone: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Adresse de livraison */}
                <div className="bg-white p-6 rounded-lg shadow">
                  <h2 className="text-xl font-semibold mb-4">Adresse de livraison</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Rue et numéro *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.street}
                        onChange={e => setFormData({...formData, street: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Ville *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.city}
                          onChange={e => setFormData({...formData, city: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Code postal *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.postal_code}
                          onChange={e => setFormData({...formData, postal_code: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Pays
                      </label>
                      <select
                        value={formData.country}
                        onChange={e => setFormData({...formData, country: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="France">France</option>
                        <option value="Belgique">Belgique</option>
                        <option value="Suisse">Suisse</option>
                        <option value="Luxembourg">Luxembourg</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Mode de livraison */}
                <div className="bg-white p-6 rounded-lg shadow">
                  <h2 className="text-xl font-semibold mb-4">Mode de livraison</h2>
                  <div className="space-y-3">
                    <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="shipping"
                        value="standard"
                        checked={formData.shipping_method === 'standard'}
                        onChange={e => setFormData({...formData, shipping_method: e.target.value})}
                        className="mr-3"
                      />
                      <div className="flex-1">
                        <div className="font-medium">Livraison standard</div>
                        <div className="text-sm text-gray-600">4-7 jours ouvrés</div>
                      </div>
                      <div className="font-medium">4,99 €</div>
                    </label>
                    <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="shipping"
                        value="express"
                        checked={formData.shipping_method === 'express'}
                        onChange={e => setFormData({...formData, shipping_method: e.target.value})}
                        className="mr-3"
                      />
                      <div className="flex-1">
                        <div className="font-medium">Livraison express</div>
                        <div className="text-sm text-gray-600">1-2 jours ouvrés</div>
                      </div>
                      <div className="font-medium">9,99 €</div>
                    </label>
                  </div>
                </div>

                {/* Notes */}
                <div className="bg-white p-6 rounded-lg shadow">
                  <h2 className="text-xl font-semibold mb-4">Notes supplémentaires (optionnel)</h2>
                  <textarea
                    value={formData.notes}
                    onChange={e => setFormData({...formData, notes: e.target.value})}
                    placeholder="Instructions spéciales pour la livraison..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-md font-medium text-lg"
                >
                  Continuer vers le paiement
                </button>
              </form>
            </div>

            {/* Récapitulatif du panier */}
            <div className="lg:col-span-1">
              <div className="bg-white p-6 rounded-lg shadow sticky top-4">
                <h2 className="text-xl font-semibold mb-4">Récapitulatif</h2>
                <p className="text-sm text-gray-600 mb-4">Boutique: <span className="font-medium">{shop.name}</span></p>
                
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                  {cart.cart.items.map((item: any) => (
                    <div key={item.id} className="flex items-start gap-3 pb-3 border-b">
                      {item.product_image ? (
                        <img 
                          src={item.product_image} 
                          alt={item.product_name}
                          className="w-12 h-12 object-cover rounded"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                          <span className="text-gray-400">📦</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{item.product_name}</p>
                        <p className="text-gray-600 text-sm">
                          {item.quantity} × {item.product_price.toFixed(2)} €
                        </p>
                      </div>
                      <div className="font-medium">
                        {item.total_price.toFixed(2)} €
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 border-t pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span>Sous-total</span>
                    <span>{cartTotal.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Livraison ({formData.shipping_method === 'express' ? 'Express' : 'Standard'})</span>
                    <span>{shippingFee.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Total</span>
                    <span>{total.toFixed(2)} €</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ÉTAPE 2: PAIEMENT - Utilisation des données sauvegardées */
          checkoutData && (
            <div className="max-w-2xl mx-auto">
              <div className="bg-white rounded-lg shadow p-6 mb-4">
                <h2 className="text-xl font-semibold mb-4">Récapitulatif de votre commande</h2>
                <div className="space-y-2">
                  <p><span className="font-medium">Boutique:</span> {shop.name}</p>
                  <p><span className="font-medium">Client:</span> {checkoutData.customer_name}</p>
                  <p><span className="font-medium">Email:</span> {checkoutData.customer_email}</p>
                  <p><span className="font-medium">Téléphone:</span> {checkoutData.customer_phone || 'Non fourni'}</p>
                  <p><span className="font-medium">Adresse:</span> {checkoutData.shipping_address.street}, {checkoutData.shipping_address.city} {checkoutData.shipping_address.postal_code}</p>
                  <p><span className="font-medium">Livraison:</span> {checkoutData.shipping_method === 'express' ? 'Express' : 'Standard'} ({checkoutData.shipping_fee.toFixed(2)} €)</p>
                  <p className="text-lg font-bold border-t pt-2 mt-2">
                    Total à payer: {checkoutData.total.toFixed(2)} €
                  </p>
                </div>
              </div>
              
              <PaymentMethods
                shopSlug={slug!}
                total={checkoutData.total}
                shopId={shop.id}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
                shippingAddress={checkoutData.shipping_address}
                customerName={checkoutData.customer_name}
                customerEmail={checkoutData.customer_email}
                customerPhone={checkoutData.customer_phone}
              />
              
              <button
                onClick={() => setPaymentStep('form')}
                className="mt-4 text-blue-600 hover:text-blue-800"
              >
                ← Retour au formulaire
              </button>
            </div>
          )
        )}
      </div>
    </div>
  )
}