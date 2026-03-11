// apps/web/app/checkout/natcash-payment/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { api } from '@/app/lib/api'

// Ajoutez cette interface
interface NatCashResponse {
  success: boolean
  transaction_id?: string
  message?: string
}

export default function NatCashPaymentPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const orderId = searchParams.get('order_id') ?? ''
  const amount = searchParams.get('amount') ?? '0'
  const reference = searchParams.get('reference') ?? ''
  
  const [status, setStatus] = useState<'pending' | 'processing' | 'success'>('pending')
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [timeLeft, setTimeLeft] = useState(600)

  useEffect(() => {
    if (timeLeft <= 0) return
    const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000)
    return () => clearTimeout(timer)
  }, [timeLeft])

  const handleSimulateSuccess = async () => {
    if (!orderId || !reference) {
      console.error('OrderId ou reference manquant')
      return
    }
    setStatus('processing')
    
    try {
      const response = await api.confirmNatCashPayment({
        transaction_id: reference,
        order_id: orderId,
        phone: phone || '50934567890'
      }) as { data?: NatCashResponse }
      
      if (response.data?.success) {
        setStatus('success')
        setTimeout(() => router.push(`/order-confirmation/${orderId}`), 2000)
      }
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">📱</span>
          </div>
          <h1 className="text-2xl font-bold">Paiement NatCash</h1>
          <p className="text-gray-600 mt-1">{parseFloat(amount || '0').toFixed(2)} €</p>
          <p className="text-sm text-gray-500">Réf: {reference}</p>
        </div>

        <div className="mb-6 p-4 bg-yellow-50 rounded-lg text-center">
          <p className="text-sm text-yellow-800">Temps restant</p>
          <p className="text-2xl font-mono font-bold text-yellow-900">{formatTime(timeLeft)}</p>
        </div>

        {status === 'pending' && (
          <>
            <div className="space-y-4 mb-6">
              <input
                type="text"
                placeholder="Numéro NatCash (test)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              />
              <input
                type="text"
                placeholder="Code (test)"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            <button
              onClick={handleSimulateSuccess}
              className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
            >
              ✅ Simuler paiement réussi
            </button>
          </>
        )}

        {status === 'processing' && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4">Confirmation en cours...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">✅</span>
            </div>
            <h2 className="text-xl font-bold text-green-700 mb-2">Paiement réussi !</h2>
            <p className="text-gray-600">Redirection...</p>
          </div>
        )}
      </div>
    </div>
  )
}
