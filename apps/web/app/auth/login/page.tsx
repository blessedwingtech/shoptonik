// apps/web/app/auth/login/page.tsx
'use client'

import { useState, useEffect, Suspense } from 'react'  // ← AJOUTER Suspense
import { useAuth } from '@/app/contexts/AuthContext'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { api } from '@/app/lib/api'

// Composant qui utilise useSearchParams
function LoginContent() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isMergingCart, setIsMergingCart] = useState(false)

  const { login } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()  // ← useSearchParams est ici

  const redirectTo = searchParams.get('redirect') || '/seller/dashboard'
  const shouldMergeCart = searchParams.get('merge_cart') === 'true'

  useEffect(() => {
    const checkoutIntent = localStorage.getItem('checkout_intent')
    if (checkoutIntent) {
      console.log('Checkout en attente détecté')
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      await login(email, password)

      if (shouldMergeCart) {
        setIsMergingCart(true)
        const sessionId = localStorage.getItem('guest_cart_session')

        if (sessionId) {
          try {
            console.log(`🔄 Fusion du panier pour session: ${sessionId}`)
            await api.mergeGuestCart(sessionId)
            console.log('✅ Panier fusionné avec succès')
            localStorage.removeItem('guest_cart_session')
          } catch (mergeError: any) {
            console.error('❌ Erreur fusion panier:', mergeError)
          }
        }

        const checkoutIntent = localStorage.getItem('checkout_intent')
        if (checkoutIntent) {
          try {
            const intent = JSON.parse(checkoutIntent)
            if (Date.now() - intent.timestamp < 3600000) {
              console.log(`✅ Redirection vers checkout: ${intent.shopSlug}`)
              router.push(`/checkout?shop=${intent.shopSlug}`)
              localStorage.removeItem('checkout_intent')
              return
            }
          } catch (e) {
            console.error('❌ Erreur parsing checkout intent:', e)
          }
        }
      }

      console.log(`✅ Redirection vers: ${redirectTo}`)
      router.push(redirectTo)

    } catch (err: any) {
      setError(err.message || 'Échec de la connexion. Vérifiez vos identifiants.')
    } finally {
      setIsLoading(false)
      setIsMergingCart(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Connexion à votre compte
          </h2>
          {shouldMergeCart && (
            <p className="mt-2 text-center text-sm text-blue-600 font-medium">
              Votre panier sera sauvegardé dans votre compte après connexion
            </p>
          )}
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Adresse email"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Mot de passe</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Mot de passe"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading || isMergingCart}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {(isLoading || isMergingCart) ? (
                <span className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {isMergingCart ? 'Fusion du panier...' : 'Connexion...'}
                </span>
              ) : 'Se connecter'}
            </button>
          </div>

          <div className="text-center space-y-2">
            <Link
              href="/auth/register"
              className="text-sm text-blue-600 hover:text-blue-500 font-medium block"
            >
              Pas encore de compte ? Créer un compte
            </Link>
            <Link
              href="/"
              className="text-sm text-gray-600 hover:text-gray-900 block"
            >
              ← Retour à l'accueil
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

// Composant principal avec Suspense
export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}