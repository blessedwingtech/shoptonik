// apps/web/app/admin/audit/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { api } from '@/app/lib/api'

interface AuditLog {
  id: string
  user_id: string
  user_email: string
  action: string
  resource_type: string
  resource_id: string
  old_values: any
  new_values: any
  ip_address: string
  user_agent: string
  timestamp: string
  status: string
  error_message: string
  shop_id: string
}

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 1 })
  const [filters, setFilters] = useState({
    user_id: '',
    action: '',
    resource_type: '',
    shop_id: '',
    start_date: '',
    end_date: ''
  })
  const [stats, setStats] = useState<any>({})

  useEffect(() => {
    loadLogs()
    loadStats()
  }, [pagination.page])

  const loadLogs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: '50'
      })
      
      if (filters.user_id) params.append('user_id', filters.user_id)
      if (filters.action) params.append('action', filters.action)
      if (filters.resource_type) params.append('resource_type', filters.resource_type)
      if (filters.shop_id) params.append('shop_id', filters.shop_id)
      if (filters.start_date) params.append('start_date', filters.start_date)
      if (filters.end_date) params.append('end_date', filters.end_date)
      
      const response = await api.getAuditLogs(params)
      if (response.data) {
        setLogs(response.data.logs || [])
        setPagination(response.data.pagination || { page: 1, total: 0, pages: 1 })
      }
    } catch (error) {
      console.error('Erreur chargement logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const response = await api.getAuditStats()
      if (response.data) {
        setStats(response.data)
      }
    } catch (error) {
      console.error('Erreur chargement stats:', error)
    }
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const applyFilters = () => {
    setPagination(prev => ({ ...prev, page: 1 }))
    loadLogs()
  }

  const resetFilters = () => {
    setFilters({
      user_id: '',
      action: '',
      resource_type: '',
      shop_id: '',
      start_date: '',
      end_date: ''
    })
    setPagination(prev => ({ ...prev, page: 1 }))
    setTimeout(loadLogs, 100)
  }

  const getActionBadge = (action: string) => {
    const colors: Record<string, string> = {
      CREATE: 'bg-green-100 text-green-800',
      UPDATE: 'bg-blue-100 text-blue-800',
      DELETE: 'bg-red-100 text-red-800',
      LOGIN: 'bg-purple-100 text-purple-800',
      LOGOUT: 'bg-gray-100 text-gray-800',
    }
    return colors[action] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Journal d'Audit
        </h1>

        {/* Statistiques */}
        <div className="grid grid-cols-6 gap-4 mb-6">
          {Object.entries(stats).map(([action, count]) => (
            <div key={action} className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-500">{action}</div>
              <div className="text-2xl font-bold">{String(count)}</div>
            </div>
          ))}
        </div>

        {/* Filtres */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Filtres</h2>
          <div className="grid grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="User ID"
              value={filters.user_id}
              onChange={(e) => handleFilterChange('user_id', e.target.value)}
              className="px-3 py-2 border rounded"
            />
            <select
              value={filters.action}
              onChange={(e) => handleFilterChange('action', e.target.value)}
              className="px-3 py-2 border rounded"
            >
              <option value="">Toutes actions</option>
              <option value="CREATE">Création</option>
              <option value="UPDATE">Modification</option>
              <option value="DELETE">Suppression</option>
              <option value="LOGIN">Connexion</option>
              <option value="LOGOUT">Déconnexion</option>
            </select>
            <select
              value={filters.resource_type}
              onChange={(e) => handleFilterChange('resource_type', e.target.value)}
              className="px-3 py-2 border rounded"
            >
              <option value="">Toutes ressources</option>
              <option value="user">Utilisateur</option>
              <option value="shop">Boutique</option>
              <option value="product">Produit</option>
              <option value="order">Commande</option>
            </select>
            <input
              type="text"
              placeholder="Shop ID"
              value={filters.shop_id}
              onChange={(e) => handleFilterChange('shop_id', e.target.value)}
              className="px-3 py-2 border rounded"
            />
            <input
              type="date"
              value={filters.start_date}
              onChange={(e) => handleFilterChange('start_date', e.target.value)}
              className="px-3 py-2 border rounded"
            />
            <input
              type="date"
              value={filters.end_date}
              onChange={(e) => handleFilterChange('end_date', e.target.value)}
              className="px-3 py-2 border rounded"
            />
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={applyFilters}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Appliquer les filtres
            </button>
            <button
              onClick={resetFilters}
              className="px-4 py-2 border rounded hover:bg-gray-50"
            >
              Réinitialiser
            </button>
          </div>
        </div>

        {/* Tableau des logs */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Utilisateur</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ressource</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Détails</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString('fr-FR')}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div>{log.user_email || 'System'}</div>
                        <div className="text-xs text-gray-500">{log.user_id}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getActionBadge(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{log.resource_type}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 font-mono">{log.resource_id}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{log.ip_address}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs">
                        {log.action === 'CREATE' && log.new_values && (
                          <div className="truncate">
                            Création: {JSON.stringify(log.new_values).substring(0, 50)}...
                          </div>
                        )}
                        {log.action === 'UPDATE' && (
                          <div className="space-y-1">
                            {log.old_values && (
                              <div className="text-xs text-red-600 truncate">
                                Ancien: {JSON.stringify(log.old_values).substring(0, 30)}...
                              </div>
                            )}
                            {log.new_values && (
                              <div className="text-xs text-green-600 truncate">
                                Nouveau: {JSON.stringify(log.new_values).substring(0, 30)}...
                              </div>
                            )}
                          </div>
                        )}
                        {log.action === 'DELETE' && log.old_values && (
                          <div className="text-xs text-red-600 truncate">
                            Supprimé: {JSON.stringify(log.old_values).substring(0, 50)}...
                          </div>
                        )}
                        {log.action === 'LOGIN' && (
                          <div className="text-xs">
                            {log.status === 'success' ? 'Succès' : `Échec: ${log.error_message}`}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          log.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="px-6 py-4 border-t flex justify-between items-center">
                <button
                  onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                  disabled={pagination.page === 1}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  Précédent
                </button>
                <span>
                  Page {pagination.page} sur {pagination.pages}
                </span>
                <button
                  onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                  disabled={pagination.page === pagination.pages}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  Suivant
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

