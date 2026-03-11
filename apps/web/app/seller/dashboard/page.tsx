'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/app/contexts/AuthContext'
import { api } from '@/app/lib/api'
import Link from 'next/link'

interface Shop {
  id: string
  name: string
  slug: string
  description: string | null
  owner_id: string
  created_at: string
}

interface DashboardStats {
  total_shops: number
  total_products: number
  total_orders: number
  total_revenue: number
}

export default function SellerDashboard() {
  const { user } = useAuth()
  const [shops, setShops] = useState<Shop[]>([])
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setIsLoading(true)
    try {
      const shopsResponse = await api.getMyShops()
      if (shopsResponse.data) {
        setShops(shopsResponse.data as Shop[])

        let totalStats: DashboardStats = {
          total_shops: shopsResponse.data.length,
          total_products: 0,
          total_orders: 0,
          total_revenue: 0
        }

        for (const shop of shopsResponse.data) {
          try {
            const statsResponse = await api.getShopStats(shop.slug)
            if (statsResponse.data?.stats) {
              totalStats.total_products += statsResponse.data.stats.total_products || 0
              totalStats.total_orders += statsResponse.data.stats.total_orders || 0
              totalStats.total_revenue += statsResponse.data.stats.total_revenue || 0
            }
          } catch (err) {
            console.error(`Erreur pour ${shop.name}:`, err)
          }
        }

        setStats(totalStats)
      }
    } catch (err) {
      console.error('Erreur:', err)
      setError('Erreur lors du chargement des données')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement du dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* En-tête */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Dashboard Vendeur
        </h1>
        <p className="mt-2 text-gray-600">
          Bienvenue, {user?.full_name || user?.username} 👋
        </p>
      </div>

      {/* Stats */}
      {stats && shops.length > 0 && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon="🏪"
            label="Boutiques"
            value={stats.total_shops}
            color="blue"
          />
          <StatCard
            icon="📦"
            label="Produits"
            value={stats.total_products}
            color="green"
          />
          <StatCard
            icon="🛒"
            label="Commandes"
            value={stats.total_orders}
            color="yellow"
          />
          <StatCard
            icon="💰"
            label="Revenus"
            value={`${stats.total_revenue ? stats.total_revenue.toFixed(2) : "0.00"} €`}
            color="purple"
          />
        </div>
      )}

      {/* Création de boutique */}
      <div className="mt-8">
        <div className={`rounded-lg p-6 ${
          shops.length === 0 
            ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200' 
            : 'bg-white border border-gray-200'
        }`}>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {shops.length === 0 ? '🚀 Lancez votre première boutique !' : '✨ Créer une nouvelle boutique'}
              </h2>
              <p className="text-gray-600 mt-1">
                {shops.length === 0 
                  ? 'Commencez à vendre en créant votre première boutique en ligne.'
                  : 'Développez votre activité avec une nouvelle boutique.'}
              </p>
            </div>
            <Link
              href="/seller/dashboard/create"
              className="flex-shrink-0 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all"
            >
              {shops.length === 0 ? '➕ Créer ma première boutique' : '➕ Nouvelle boutique'}
            </Link>
          </div>
        </div>
      </div>

      {/* Liste des boutiques */}
      <div className="mt-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Mes boutiques ({shops.length})
        </h2>
        
        {shops.length === 0 ? (
          <EmptyShopsState />
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {shops.map((shop) => (
              <ShopCard key={shop.id} shop={shop} />
            ))}
          </div>
        )}
      </div>

      {/* Actions rapides */}
      {shops.length > 0 && <QuickActions />}
    </div>
  )
}

// Composants auxiliaires
function StatCard({ icon, label, value, color }: any) {
    const colors: Record<string, string> = {
      blue: 'bg-blue-100 text-blue-600',
      green: 'bg-green-100 text-green-600',
      yellow: 'bg-yellow-100 text-yellow-600',
      purple: 'bg-purple-100 text-purple-600',
    }

    const colorClass = colors[color] || 'bg-gray-100 text-gray-600'

    return (
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="p-5">
          <div className="flex items-center">
            <div className={`flex-shrink-0 h-10 w-10 rounded-full ${colorClass} flex items-center justify-center`}>
              <span>{icon}</span>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">{label}</dt>
                <dd className="text-lg font-medium text-gray-900">{value}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>
    )
}


function ShopCard({ shop }: { shop: Shop }) {
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
      <div className="p-6">
        <h3 className="text-lg font-medium text-gray-900">{shop.name}</h3>
        {shop.description && (
          <p className="mt-2 text-gray-600 text-sm line-clamp-2">{shop.description}</p>
        )}
        <div className="mt-4 flex justify-between items-center">
          <span className="text-sm text-gray-500">
            Créée le {new Date(shop.created_at).toLocaleDateString('fr-FR')}
          </span>
          <div className="flex space-x-2">
            <Link href={`/seller/dashboard/${shop.slug}`}
              className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
            >
              Gérer
            </Link>
            <Link
              href={`/shop/${shop.slug}`}
              className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              target="_blank"
            >
              Voir
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function EmptyShopsState() {
  return (
    <div className="bg-white shadow rounded-lg p-12 text-center">
      <div className="text-6xl mb-4">🏪</div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        Vous n'avez pas encore de boutique
      </h3>
      <p className="text-gray-500 mb-6">
        Créez votre première boutique et commencez à vendre vos produits !
      </p>
      <Link
        href="/seller/dashboard/create"
        className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
      >
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Créer ma première boutique
      </Link>
    </div>
  )
}

function QuickActions() {
  return (
    <div className="mt-8">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Actions rapides
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <ActionLink
            href="/seller/products"
            icon="📦"
            label="Gérer les produits"
            color="green"
          />
          <ActionLink
            href="/seller/orders"
            icon="🛒"
            label="Voir les commandes"
            color="yellow"
          />
          <ActionLink
            href="/seller/settings"
            icon="⚙️"
            label="Paramètres"
            color="gray"
          />
        </div>
      </div>
    </div>
  )
}

function ActionLink({ href, icon, label, color }: any) {
  const colors: Record<string, string> = {
    green: 'text-green-600 bg-green-100',
    yellow: 'text-yellow-600 bg-yellow-100',
    gray: 'text-gray-600 bg-gray-100',
  }

  const colorClass = colors[color] || 'bg-gray-100 text-gray-600'

  return (
    <Link
      href={href}
      className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow"
    >
      <div className="flex items-center">
        <div className={`h-10 w-10 rounded-full ${colorClass} flex items-center justify-center mr-3`}>
          <span>{icon}</span>
        </div>
        <span className="font-medium">{label}</span>
      </div>
    </Link>
  )
}