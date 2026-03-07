'use client'

import { useState, useEffect } from 'react'
import { api } from '@/app/lib/api'
import Link from 'next/link'

interface PlatformStats {
  total_users: number
  total_sellers: number
  total_shops: number
  total_products: number
  total_orders: number
  total_revenue: number
  pending_requests: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<PlatformStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [recentActivity, setRecentActivity] = useState<any[]>([])

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setIsLoading(true)
    try {
      // Charger les stats globales
      const statsResponse = await api.getAdminStats()
      if (statsResponse.data) {
        setStats(statsResponse.data)
      }

      // Charger les demandes en attente
      const requestsResponse = await api.getPendingSellerRequests()
      if (requestsResponse.data) {
        setRecentActivity(requestsResponse.data.slice(0, 5))
      }
    } catch (error) {
      console.error('Erreur chargement dashboard:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const statCards = [
    { 
      title: 'Utilisateurs', 
      value: stats?.total_users || 0, 
      icon: '👥', 
      color: 'bg-blue-500',
      href: '/admin/users'
    },
    { 
      title: 'Vendeurs', 
      value: stats?.total_sellers || 0, 
      icon: '👑', 
      color: 'bg-purple-500',
      href: '/admin/users?role=seller'
    },
    { 
      title: 'Boutiques', 
      value: stats?.total_shops || 0, 
      icon: '🏪', 
      color: 'bg-green-500',
      href: '/admin/shops'
    },
    { 
      title: 'Produits', 
      value: stats?.total_products || 0, 
      icon: '📦', 
      color: 'bg-orange-500',
      href: '/admin/products'
    },
    { 
      title: 'Commandes', 
      value: stats?.total_orders || 0, 
      icon: '📋', 
      color: 'bg-red-500',
      href: '/admin/orders'
    },
    { 
      title: 'CA total', 
      value: `${(stats?.total_revenue || 0).toFixed(2)} €`, 
      icon: '💰', 
      color: 'bg-yellow-500',
      href: '/admin/orders'
    },
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement du dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Admin</h1>
        <p className="text-gray-600 mt-2">
          Bienvenue dans votre espace d'administration
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {statCards.map((stat, index) => (
          <Link
            key={index}
            href={stat.href}
            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow group"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center text-white text-2xl group-hover:scale-110 transition-transform`}>
                {stat.icon}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Demandes en attente */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Demandes en attente</h2>
          <Link
            href="/admin/seller-requests"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Voir tout →
          </Link>
        </div>

        {recentActivity.length === 0 ? (
          <p className="text-center text-gray-500 py-8">
            Aucune demande en attente
          </p>
        ) : (
          <div className="space-y-4">
            {recentActivity.map((request) => (
              <div
                key={request.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                    {request.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="ml-4">
                    <p className="font-medium text-gray-900">{request.full_name || request.username}</p>
                    <p className="text-sm text-gray-500">{request.email}</p>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  {new Date(request.requested_at).toLocaleDateString('fr-FR')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions rapides */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href="/admin/users"
          className="bg-blue-50 p-4 rounded-lg hover:bg-blue-100 transition-colors"
        >
          <div className="text-2xl mb-2">👥</div>
          <h3 className="font-medium text-blue-900">Gérer les utilisateurs</h3>
          <p className="text-sm text-blue-700">Voir, modifier, suspendre</p>
        </Link>

        <Link
          href="/admin/shops"
          className="bg-green-50 p-4 rounded-lg hover:bg-green-100 transition-colors"
        >
          <div className="text-2xl mb-2">🏪</div>
          <h3 className="font-medium text-green-900">Gérer les boutiques</h3>
          <p className="text-sm text-green-700">Valider, modérer</p>
        </Link>

        <Link
          href="/admin/seller-requests"
          className="bg-purple-50 p-4 rounded-lg hover:bg-purple-100 transition-colors"
        >
          <div className="text-2xl mb-2">👑</div>
          <h3 className="font-medium text-purple-900">Demandes vendeur</h3>
          <p className="text-sm text-purple-700">{stats?.pending_requests || 0} en attente</p>
        </Link>

        <Link
          href="/admin/settings"
          className="bg-orange-50 p-4 rounded-lg hover:bg-orange-100 transition-colors"
        >
          <div className="text-2xl mb-2">⚙️</div>
          <h3 className="font-medium text-orange-900">Paramètres</h3>
          <p className="text-sm text-orange-700">Configuration plateforme</p>
        </Link>
        
        <Link
          href="/admin/audit"
          className="bg-indigo-50 p-4 rounded-lg hover:bg-indigo-100 transition-colors"
        >
          <div className="text-2xl mb-2">📋</div>
          <h3 className="font-medium text-indigo-900">Journal d'audit</h3>
          <p className="text-sm text-indigo-700">Traçabilité des actions</p>
        </Link>
      </div>
    </div>
  )
}