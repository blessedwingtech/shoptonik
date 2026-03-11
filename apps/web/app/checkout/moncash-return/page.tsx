// apps/web/app/checkout/moncash-return/page.tsx
'use client'

import { useEffect, useState, Suspense } from 'react'  // ← AJOUTER Suspense
import { useSearchParams, useRouter } from 'next/navigation'
import { useAuth } from '@/app/contexts/AuthContext'

// Contenu principal qui utilise useSearchParams
function MoncashReturnContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { token } = useAuth()
  const [status, setStatus] = useState('verifying')
  const [error, setError] = useState('')

  useEffect(() => {
    const verifyPayment = async () => {
      const transactionId = searchParams.get('transactionId')
      const orderId = localStorage.getItem('pending_order_id')

      if (!transactionId || !orderId) {
        setError('Informations de paiement manquantes')
        setStatus('error')
        return
      }

      try {
        const response = await fetch(
          `/api/v1/payments/verify-moncash/${orderId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        )

        const data = await response.json()

        if (data.status === 'successful') {
          setStatus('success')
          localStorage.removeItem('pending_order_id')
          localStorage.removeItem('payment_provider')

          setTimeout(() => {
            router.push(`/order-confirmation/${orderId}`)
          }, 2000)
        } else {
          setError('Paiement non confirmé')
          setStatus('error')
        }
      } catch (err) {
        setError('Erreur de vérification')
        setStatus('error')
      }
    }

    verifyPayment()
  }, [searchParams, router, token])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
        {status === 'verifying' && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <h1 className="mt-4 text-xl font-semibold">Vérification de votre paiement...</h1>
            <p className="mt-2 text-gray-600">Veuillez patienter</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="text-6xl mb-4">✅</div>
            <h1 className="text-xl font-semibold text-green-600">Paiement réussi !</h1>
            <p className="mt-2 text-gray-600">Redirection vers la confirmation de commande...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="text-6xl mb-4">❌</div>
            <h1 className="text-xl font-semibold text-red-600">Erreur de paiement</h1>
            <p className="mt-2 text-gray-600">{error}</p>
            <button
              onClick={() => router.push('/checkout')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Retour au paiement
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// Composant principal exporté avec Suspense
export default function MoncashReturnPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    }>
      <MoncashReturnContent />
    </Suspense>
  )
}

