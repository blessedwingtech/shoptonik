'use client'

import { useState, useEffect } from 'react'
import { api } from '@/app/lib/api'
import { useAuth } from '@/app/contexts/AuthContext'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { CreditCard, Landmark, Smartphone, Truck } from 'lucide-react'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

// Dans StripePaymentForm, améliorez la gestion d'erreurs
const handleStripeError = (error: any): string => {
  switch (error.code) {
    case 'card_declined':
      return "Votre carte a été refusée. Veuillez utiliser une autre carte."
    case 'expired_card':
      return "Votre carte a expiré. Vérifiez la date."
    case 'incorrect_cvc':
      return "Le code de sécurité est incorrect."
    case 'processing_error':
      return "Erreur de traitement. Réessayez."
    default:
      return error.message || "Une erreur est survenue"
  }
}

interface PaymentMethodsProps {
  shopSlug: string
  total: number
  shopId: string
  onSuccess: (orderId: string) => void
  onError: (error: string) => void
  shippingAddress: any
  customerName?: string
  customerEmail?: string
  customerPhone?: string
}

// Composant StripePaymentForm
// REMPLACEZ le composant StripePaymentForm actuel (lignes ~20-86) par celui-ci
function StripePaymentForm({ 
  total, 
  onSuccess, 
  onError,
  existingOrderId,   
  clientSecret  
}: any) {
  const stripe = useStripe()
  const elements = useElements()
  const [processing, setProcessing] = useState(false)
  const [isStripeReady, setIsStripeReady] = useState(false)

  // 👇 ATTENDRE QUE STRIPE SOIT PRÊT
  useEffect(() => {
    if (stripe && elements) {
      setIsStripeReady(true)
    }
  }, [stripe, elements])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // 👇 VÉRIFIER QUE STRIPE EST PRÊT
    if (!stripe || !elements || !isStripeReady) {
      onError('Le système de paiement n\'est pas encore prêt. Veuillez patienter.')
      return
    }
    
    setProcessing(true)

    try {
      console.log('🔐 Confirmation du paiement...')
      const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/checkout/stripe-return?order_id=${existingOrderId}`,
        },
        redirect: 'if_required',
      })

      if (confirmError) {
        // throw new Error(confirmError.message)
        throw new Error(handleStripeError(confirmError))
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        console.log('✅ Paiement réussi!')
        onSuccess(existingOrderId)
      } else {
        onError('Paiement non confirmé')
      }

    } catch (err: any) {
      console.error('❌ Erreur:', err)
      onError(err.message)
    } finally {
      setProcessing(false)
    }
  }

  if (!clientSecret) {
    return (
      <div className="text-center py-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Initialisation du paiement...</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <button
        type="submit"
        disabled={!stripe || processing || !isStripeReady}
        className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
      >
        {processing ? 'Traitement...' : !isStripeReady ? 'Chargement...' : `Confirmer le paiement de ${total.toFixed(2)} €`}
      </button>
    </form>
  )
}

// function StripePaymentForm({ 
//   total, 
//   shopSlug, 
//   shopId,
//   onSuccess, 
//   onError,
//   token,
//   shippingAddress,
//   customerName,
//   customerEmail,
//   customerPhone,
//   existingOrderId,   
//   clientSecret  
// }: any) {
//   const stripe = useStripe()
//   const elements = useElements()
//   const [processing, setProcessing] = useState(false) 

 
//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault()
    
//     if (!stripe || !elements || !clientSecret) return
    
//     setProcessing(true)

//     try {
//       console.log('🔐 Confirmation du paiement...')
//       const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
//         elements,
//         confirmParams: {
//           return_url: `${window.location.origin}/checkout/stripe-return?order_id=${existingOrderId}`,
//         },
//         redirect: 'if_required',
//       })

//       if (confirmError) {
//         throw new Error(confirmError.message)
//       }

//       if (paymentIntent && paymentIntent.status === 'succeeded') {
//         console.log('✅ Paiement réussi!')
//         onSuccess(existingOrderId)
//       } else {
//         onError('Paiement non confirmé')
//       }

//     } catch (err: any) {
//       console.error('❌ Erreur:', err)
//       onError(err.message)
//     } finally {
//       setProcessing(false)
//     }
//   }

//   if (!clientSecret) {
//     return (
//       <div className="text-center py-4">
//         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
//         <p className="mt-2 text-gray-600">Initialisation du paiement...</p>
//       </div>
//     )
//   }

//   return (
//     <form onSubmit={handleSubmit} className="space-y-4">
//       <PaymentElement />
//       <button
//         type="submit"
//         disabled={!stripe || processing}
//         className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
//       >
//         {processing ? 'Traitement...' : `Confirmer le paiement de ${total.toFixed(2)} €`}
//       </button>
//     </form>
//   )
// }

// Composant principal

export default function PaymentMethods({ 
  shopSlug, 
  total, 
  shopId, 
  onSuccess, 
  onError, 
  shippingAddress,
  customerName,
  customerEmail,
  customerPhone
}: PaymentMethodsProps) {
  const { user, token } = useAuth()
  const [selectedMethod, setSelectedMethod] = useState('cash_on_delivery')
  const [loading, setLoading] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState(customerPhone || '')
  const [acceptedMethods, setAcceptedMethods] = useState<string[]>([])
  const [showStripeForm, setShowStripeForm] = useState(false)
  const [orderIdForStripe, setOrderIdForStripe] = useState<string | null>(null)  // ← AJOUTEZ CET ÉTAT
  
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  // Vérifier si on revient d'un paiement
  useEffect(() => {
    const verifyPaymentOnReturn = async (orderId: string, provider: string) => {
      try {
        const response = await fetch(
          `/api/v1/payments/verify-${provider}/${orderId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        )
        
        const data = await response.json()
        
        if (data.status === 'successful' || data.status === 'completed') {
          onSuccess(orderId)
        } else {
          onError('Paiement non confirmé')
        }
      } catch (err) {
        onError('Erreur de vérification')
      }
    }

    const pendingOrderId = localStorage.getItem('pending_order_id')
    const provider = localStorage.getItem('payment_provider')
    
    if (pendingOrderId && provider && window.location.search.includes('transactionId')) {
      verifyPaymentOnReturn(pendingOrderId, provider)
      localStorage.removeItem('pending_order_id')
      localStorage.removeItem('payment_provider')
    }
  }, [token, onSuccess, onError])

  // Charger les méthodes acceptées par la boutique
  useEffect(() => {
    const loadShop = async () => {
      try {
        const response = await api.getPublicShop(shopSlug)
        if (response.data) {
          //console.log('✅ Boutique chargée:', response.data)
          setAcceptedMethods(response.data.accepted_payment_methods || [])
        }
      } catch (err) {
        console.error('Erreur chargement boutique:', err)
      }
    }
    loadShop()
  }, [shopSlug])
  
  // Fonction pour MonCash/NatCash
  // const handleMobileMoney = async () => {
  //   if (!token) {
  //     onError('Vous devez être connecté')
  //     return
  //   }

  //   if (!phoneNumber) {
  //     onError('Numéro de téléphone requis')
  //     return
  //   }

  //   setLoading(true)
  //   try {
  //     console.log('📝 Création de la commande...')
  //     const orderResponse = await fetch('/api/v1/checkout/process', {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //         'Authorization': `Bearer ${token}`
  //       },
  //       body: JSON.stringify({
  //         shop_slug: shopSlug,
  //         payment_method: selectedMethod,
  //         payment_details: { 
  //           phone: phoneNumber,
  //           status: 'pending' 
  //         },
  //         shipping_address: shippingAddress,
  //         customer_name: customerName,
  //         customer_email: customerEmail,
  //         customer_phone: phoneNumber
  //       }),
  //     })

  //     if (!orderResponse.ok) {
  //       const error = await orderResponse.json()
  //       throw new Error(error.detail || 'Erreur création commande')
  //     }

  //     const orderData = await orderResponse.json()
  //     const orderId = orderData.order_id
  //     console.log('✅ Commande créée:', orderId)

  //     const endpoint = selectedMethod === 'moncash' 
  //       ? '/api/v1/payments/create-moncash-payment'
  //       : '/api/v1/payments/create-natcash-payment'

  //     const paymentResponse = await fetch(endpoint, {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //         'Authorization': `Bearer ${token}`
  //       },
  //       body: JSON.stringify({
  //         amount: total,
  //         order_id: orderId,
  //         phone: phoneNumber,
  //         shop_id: shopId
  //       }),
  //     })

  //     if (!paymentResponse.ok) {
  //       const error = await paymentResponse.json()
  //       throw new Error(error.detail || `Erreur création paiement ${selectedMethod}`)
  //     }

  //     const paymentData = await paymentResponse.json()
  //     console.log('✅ Paiement créé:', paymentData)

  //     if (paymentData.redirect_url) {
  //       localStorage.setItem('pending_order_id', orderId)
  //       localStorage.setItem('payment_provider', selectedMethod)
  //       window.location.href = paymentData.redirect_url
  //     } else {
  //       throw new Error('URL de redirection manquante')
  //     }

  //   } catch (err: any) {
  //     console.error('❌ Erreur:', err)
  //     onError(err.message)
  //   } finally {
  //     setLoading(false)
  //   }
  // }
  const handleMobileMoney = async () => {
  if (!token) {
    onError('Vous devez être connecté')
    return
  }

  if (!phoneNumber) {
    onError('Numéro de téléphone requis')
    return
  }

  setLoading(true)
  try {
    console.log('📝 Création de la commande...')
    const orderResponse = await fetch('/api/v1/checkout/process', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        shop_slug: shopSlug,
        payment_method: selectedMethod,
        payment_details: { 
          phone: phoneNumber,
          status: 'pending' 
        },
        shipping_address: shippingAddress,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: phoneNumber
      }),
    })

    if (!orderResponse.ok) {
      const error = await orderResponse.json()
      throw new Error(error.detail || 'Erreur création commande')
    }

    const orderData = await orderResponse.json()
    const orderId = orderData.order_id
    console.log('✅ Commande créée, ID:', orderId)

    const endpoint = selectedMethod === 'moncash' 
      ? '/api/v1/payments/create-moncash-payment'
      : '/api/v1/payments/create-natcash-payment'

    console.log(`📤 Envoi à ${endpoint} avec:`, {
      amount: total,
      order_id: orderId,
      phone: phoneNumber,
      shop_id: shopId
    })

    const paymentResponse = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        amount: total,
        order_id: orderId,  // ← C'EST BIEN LÀ !
        phone: phoneNumber,
        shop_id: shopId
      }),
    })

    if (!paymentResponse.ok) {
      const error = await paymentResponse.json()
      console.error('❌ Réponse erreur:', error)
      throw new Error(error.detail || `Erreur création paiement ${selectedMethod}`)
    }

    const paymentData = await paymentResponse.json()
    console.log('✅ Paiement créé:', paymentData)

    if (paymentData.redirect_url) {
      localStorage.setItem('pending_order_id', orderId)
      localStorage.setItem('payment_provider', selectedMethod)
      window.location.href = paymentData.redirect_url
    } else {
      throw new Error('URL de redirection manquante')
    }

  } catch (err: any) {
    console.error('❌ Erreur:', err)
    onError(err.message)
  } finally {
    setLoading(false)
  }
}

  const handleCashOnDelivery = async () => {
    if (!token) {
      onError('Vous devez être connecté')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/v1/checkout/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          shop_slug: shopSlug,
          payment_method: 'cash_on_delivery',
          payment_details: {},
          shipping_address: shippingAddress,
          customer_name: customerName,
          customer_email: customerEmail,
          customer_phone: customerPhone || phoneNumber
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Erreur paiement')
      }

      const data = await response.json()
      onSuccess(data.order_id)
    } catch (err: any) {
      onError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Dans handleCardPayment - REMPLACEZ cette fonction
const handleCardPayment = async () => {
  if (!token) {
    onError('Vous devez être connecté')
    return
  }
  
  setLoading(true)
  try {
    // 1. Créer la commande
    const orderResponse = await fetch('/api/v1/checkout/process', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        shop_slug: shopSlug,
        payment_method: 'card',
        payment_details: { status: 'pending' },
        shipping_address: shippingAddress,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone
      }),
    })

    if (!orderResponse.ok) {
      throw new Error('Erreur création commande')
    }

    const orderData = await orderResponse.json()
    const newOrderId = orderData.order_id
    
    // 2. ⚠️ CRÉER LE PAYMENTINTENT (ce qui manque)
    const intentResponse = await fetch('/api/v1/payments/create-payment-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        amount: total,
        order_id: newOrderId,
        shop_id: shopId
      }),
    })

    if (!intentResponse.ok) {
      const error = await intentResponse.json()
      throw new Error(error.detail || 'Erreur création paiement')
    }

    const intentData = await intentResponse.json()
    
    // 3. Stocker l'order_id ET le clientSecret
    setOrderIdForStripe(newOrderId)
    setClientSecret(intentData.client_secret)  // ← IMPORTANT
    setShowStripeForm(true)

  } catch (err: any) {
    onError(err.message)
  } finally {
    setLoading(false)
  }
}

  const handlePayment = async () => {
    if (selectedMethod === 'cash_on_delivery') {
      await handleCashOnDelivery()
    } else if (selectedMethod === 'card') {
      await handleCardPayment()
    } else if (selectedMethod === 'moncash' || selectedMethod === 'natcash') {
      await handleMobileMoney()
    }
  }
  
  // Toutes les méthodes disponibles
  // const allMethods = [
  //   { id: 'card', label: 'Carte bancaire', icon: '💳', description: 'Visa, Mastercard' },
  //   { id: 'paypal', label: 'PayPal', icon: '🅿️', description: 'Paiement sécurisé' },
  //   { id: 'moncash', label: 'MonCash', icon: '📱', description: 'Paiement mobile Haïti' },
  //   { id: 'natcash', label: 'NatCash', icon: '📱', description: 'Paiement mobile Haïti' },
  //   { id: 'cash_on_delivery', label: 'Paiement à la livraison', icon: '💵', description: 'Payez à la réception' }
  // ]

  const allMethods = [
    { id: 'card', label: 'Carte bancaire', icon: CreditCard, description: 'Visa, Mastercard' },
    { id: 'paypal', label: 'PayPal', icon: Landmark, description: 'Paiement sécurisé' },
    { id: 'moncash', label: 'MonCash', icon: Smartphone, description: 'Paiement mobile Haïti' },
    { id: 'natcash', label: 'NatCash', icon: Smartphone, description: 'Paiement mobile Haïti' },
    { id: 'cash_on_delivery', label: 'Paiement à la livraison', icon: Truck, description: 'Payez à la réception' }
  ]
  
  // Filtrer selon ce que la boutique accepte
  const availableMethods = allMethods.filter(method => 
    acceptedMethods.includes(method.id) || method.id === 'cash_on_delivery'
  )
  
  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-4">
      <h3 className="text-lg font-medium">Mode de paiement</h3>
      
      <div className="space-y-2">
        {/* {availableMethods.length === 0 ? (
          <p className="text-gray-500">Chargement des méthodes de paiement...</p>
        ) : (
          availableMethods.map(method => (
            <label 
              key={method.id} 
              className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedMethod === method.id 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'hover:bg-gray-50'
              }`}
            >
              <input
                type="radio"
                name="payment"
                value={method.id}
                checked={selectedMethod === method.id}
                onChange={(e) => {
                  setSelectedMethod(e.target.value)
                  setShowStripeForm(false)
                }}
                className="mr-3"
              />
              <div className="flex-1">
                <span className="font-medium">{method.label}</span>
                {method.description && (
                  <span className="text-sm text-gray-500 ml-2">({method.description})</span>
                )}
              </div>
              <div className="flex space-x-1">
                <span className="text-2xl">{method.icon}</span>
              </div>
            </label>
          ))
        )} */}
        {availableMethods.map(method => {
          const Icon = method.icon
          return (
            <label key={method.id} className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
              selectedMethod === method.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
            }`}>
              <input
                type="radio"
                name="payment"
                value={method.id}
                checked={selectedMethod === method.id}
                onChange={(e) => {
                  setSelectedMethod(e.target.value)
                  setShowStripeForm(false)
                }}
                className="mr-3"
              />
              <Icon className="w-5 h-5 mr-3 text-gray-600" />
              <div className="flex-1">
                <span className="font-medium">{method.label}</span>
                {method.description && (
                  <span className="text-sm text-gray-500 ml-2">({method.description})</span>
                )}
              </div>
            </label>
          )
        })}
      </div>
      
      {/* Champs pour MonCash/NatCash */}
      {(selectedMethod === 'moncash' || selectedMethod === 'natcash') && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <label className="block text-sm font-medium text-blue-800 mb-1">
            📱 Numéro de téléphone {selectedMethod === 'moncash' ? 'MonCash' : 'NatCash'}
          </label>
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="+509 XX XX XXXX"
            className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
          <p className="text-xs text-blue-600 mt-1">
            Vous serez redirigé vers {selectedMethod === 'moncash' ? 'MonCash' : 'NatCash'} pour confirmer le paiement
          </p>
        </div>
      )}

      {/* Formulaire Stripe */}
      {/* {selectedMethod === 'card' && showStripeForm && clientSecret && (
        <div className="mt-4 p-4 border rounded-lg bg-gray-50">
          <Elements 
              stripe={stripePromise}
              // 👇 VOICI LA LIGNE À AJOUTER
              options={{
                clientSecret: clientSecret, // Le clientSecret vient de votre état
                appearance: { theme: 'stripe' } // Optionnel mais recommandé
              }}
            >
            <StripePaymentForm 
              total={total}
              shopSlug={shopSlug}
              shopId={shopId}
              onSuccess={onSuccess}
              onError={onError}
              token={token}
              shippingAddress={shippingAddress}
              customerName={customerName}
              customerEmail={customerEmail}
              customerPhone={customerPhone}
              existingOrderId={orderIdForStripe}  // ← PASSEZ L'ORDER_ID ICI
              clientSecret={clientSecret}
            />
          </Elements>
        </div>
      )} */}
      {/* Formulaire Stripe - MODIFIEZ CETTE PARTIE */}
      {selectedMethod === 'card' && showStripeForm && clientSecret && (
        <div className="mt-4 p-4 border rounded-lg bg-gray-50">
          <Elements 
            stripe={stripePromise}
            options={{
              clientSecret: clientSecret,
              appearance: { theme: 'stripe' }
            }}
          >
            <StripePaymentForm 
              total={total}
              onSuccess={onSuccess}
              onError={onError}
              existingOrderId={orderIdForStripe}
              clientSecret={clientSecret}
            />
          </Elements>
        </div>
      )}
      
      <button
        onClick={handlePayment}
        disabled={
          loading || 
          ((selectedMethod === 'moncash' || selectedMethod === 'natcash') && !phoneNumber) ||
          (selectedMethod === 'card' && showStripeForm)
        }
        className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-lg mt-6"
      >
        {loading ? (
          <span className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            Traitement...
          </span>
        ) : (
          selectedMethod === 'card' && showStripeForm ? 'Formulaire de paiement ci-dessus' : `Payer ${total.toFixed(2)} €`
        )}
      </button>

      {!token && (
        <p className="text-sm text-red-600 text-center">
          ⚠️ Vous devez être connecté pour payer
        </p>
      )}
    </div>
  )
}