'use client'

import { useAuth } from '@/app/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'

export default function SellerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // ✅ AJOUTEZ isLoading
  const { user, isLoading } = useAuth()
  const router = useRouter()

  // ✅ MODIFIEZ le useEffect pour attendre isLoading
  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/auth/login')
      } else if (!user.is_seller) {
        router.push('/')
      }
    }
  }, [user, isLoading, router])

  // ✅ AJOUTEZ le loader pendant le chargement
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Vérification de votre session...</p>
        </div>
      </div>
    )
  }

  // ✅ Gardez votre vérification existante
  if (!user || !user.is_seller) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Vérification des accès...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Barre de navigation vendeur */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 py-3">
            <Link href="/seller/dashboard" className="text-gray-700 hover:text-blue-600">
              Dashboard
            </Link>
            <Link href="/seller/products" className="text-gray-700 hover:text-blue-600">
              Produits
            </Link>
            <Link href="/seller/orders" className="text-gray-700 hover:text-blue-600">
              Commandes
            </Link>
            <Link href="/seller/settings" className="text-gray-700 hover:text-blue-600">
              Paramètres
            </Link>
          </div>
        </div>
      </div>
      
      {/* Contenu principal */}
      <main>{children}</main>
    </div>
  )
}
