'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/app/contexts/AuthContext'
import { api } from '@/app/lib/api'
import Link from 'next/link'

interface User {
  id: string
  email: string
  username: string
  full_name: string | null
  is_seller: boolean
  is_admin: boolean
  is_active: boolean
  total_shops: number
  total_orders: number
  created_at: string
  phone?: string | null
  avatar?: string | null
}

export default function AdminUsersPage() {
  const { user } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'sellers' | 'buyers' | 'admins'>('all')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showUserModal, setShowUserModal] = useState(false)

  useEffect(() => {
    loadUsers()
  }, [roleFilter, searchTerm])

  const loadUsers = async () => {
    setIsLoading(true)
    setError('')
    try {
      const response = await api.getUsers({
        role: roleFilter,
        search: searchTerm || undefined
      })
      if (response.data) {
        setUsers(response.data)
      } else {
        setError(response.error || 'Erreur chargement des utilisateurs')
      }
    } catch (err: any) {
      setError(err.message || 'Erreur de connexion')
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleStatus = async (userId: string, userName: string, currentStatus: boolean) => {
    const action = currentStatus ? 'désactiver' : 'activer'
    if (!confirm(`Êtes-vous sûr de vouloir ${action} l'utilisateur ${userName} ?`)) return

    setProcessing(userId)
    setError('')
    setSuccess('')

    try {
      const response = await api.toggleUserStatus(userId)

      if (response.statusCode === 200 || response.data) {
        setSuccess(`✅ Utilisateur ${currentStatus ? 'désactivé' : 'activé'} avec succès`)
        loadUsers()
      } else {
        setError(response.error || 'Erreur lors de l\'opération')
      }
    } catch (err: any) {
      setError(err.message || 'Erreur de connexion')
    } finally {
      setProcessing(null)
    }
  }

  const handleToggleSeller = async (userId: string, userName: string, currentStatus: boolean) => {
    const action = currentStatus ? 'retirer le statut vendeur à' : 'donner le statut vendeur à'
    if (!confirm(`Êtes-vous sûr de vouloir ${action} ${userName} ?`)) return

    setProcessing(userId)
    setError('')
    setSuccess('')

    try {
      const response = await api.toggleUserSellerStatus(userId)

      if (response.statusCode === 200 || response.data) {
        setSuccess(`✅ Statut vendeur ${currentStatus ? 'retiré' : 'donné'} avec succès`)
        loadUsers()
      } else {
        setError(response.error || 'Erreur lors de l\'opération')
      }
    } catch (err: any) {
      setError(err.message || 'Erreur de connexion')
    } finally {
      setProcessing(null)
    }
  }

  const handleToggleAdmin = async (userId: string, userName: string, currentStatus: boolean) => {
    const action = currentStatus ? 'retirer les droits admin à' : 'donner les droits admin à'
    if (!confirm(`Êtes-vous sûr de vouloir ${action} ${userName} ?`)) return

    setProcessing(userId)
    setError('')
    setSuccess('')

    try {
      const response = await api.toggleUserAdminStatus(userId)

      if (response.statusCode === 200 || response.data) {
        setSuccess(`✅ Droits admin ${currentStatus ? 'retirés' : 'donnés'} avec succès`)
        loadUsers()
      } else {
        setError(response.error || 'Erreur lors de l\'opération')
      }
    } catch (err: any) {
      setError(err.message || 'Erreur de connexion')
    } finally {
      setProcessing(null)
    }
  }

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`⚠️ Êtes-vous sûr de vouloir SUPPRIMER définitivement l'utilisateur ${userName} ? Cette action est irréversible.`)) return

    setProcessing(userId)
    setError('')
    setSuccess('')

    try {
      const response = await api.deleteUser(userId)

      if (response.statusCode === 204 || response.data) {
        setSuccess(`✅ Utilisateur ${userName} supprimé avec succès`)
        loadUsers()
      } else {
        setError(response.error || 'Erreur lors de la suppression')
      }
    } catch (err: any) {
      setError(err.message || 'Erreur de connexion')
    } finally {
      setProcessing(null)
    }
  }

  const viewUserDetails = (user: User) => {
    setSelectedUser(user)
    setShowUserModal(true)
  }

  if (!user?.is_admin) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Accès non autorisé</h1>
          <p className="text-gray-600 mb-8">Cette page est réservée aux administrateurs.</p>
          <Link href="/" className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Retour à l'accueil
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Gestion des utilisateurs</h1>
          <p className="text-gray-600 mt-2">
            Gérez tous les utilisateurs de la plateforme
          </p>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}
        
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700">{success}</p>
          </div>
        )}

        {/* Filtres et recherche */}
        <div className="mb-6 bg-white rounded-lg shadow p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Rechercher par nom, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  🔍
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setRoleFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  roleFilter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Tous ({users.length})
              </button>
              <button
                onClick={() => setRoleFilter('sellers')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  roleFilter === 'sellers'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Vendeurs
              </button>
              <button
                onClick={() => setRoleFilter('admins')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  roleFilter === 'admins'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Admins
              </button>
              <button
                onClick={loadUsers}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
              >
                ↻ Actualiser
              </button>
            </div>
          </div>
        </div>

        {/* Liste des utilisateurs */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement des utilisateurs...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">👥</div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">Aucun utilisateur trouvé</h3>
            <p className="text-gray-600">
              {searchTerm 
                ? `Aucun utilisateur ne correspond à "${searchTerm}"`
                : 'Aucun utilisateur à afficher pour le moment.'}
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Effacer la recherche
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Utilisateur
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rôle
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stats
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                            {u.username.charAt(0).toUpperCase()}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {u.full_name || u.username}
                            </div>
                            <div className="text-sm text-gray-500">
                              @{u.username}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{u.email}</div>
                        <div className="text-sm text-gray-500">{u.phone || '—'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          {u.is_admin && (
                            <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full inline-block w-fit">
                              Admin
                            </span>
                          )}
                          {u.is_seller && !u.is_admin && (
                            <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full inline-block w-fit">
                              Vendeur
                            </span>
                          )}
                          {!u.is_seller && !u.is_admin && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full inline-block w-fit">
                              Acheteur
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          u.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {u.is_active ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          <span className="font-medium">{u.total_shops || 0}</span> boutique(s)
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(u.created_at).toLocaleDateString('fr-FR')}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-2">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => viewUserDetails(u)}
                              className="p-1 text-blue-600 hover:text-blue-800"
                              title="Voir détails"
                            >
                              👁️
                            </button>
                            <button
                              onClick={() => handleToggleStatus(u.id, u.username, u.is_active)}
                              disabled={processing === u.id}
                              className={`p-1 ${
                                u.is_active 
                                  ? 'text-yellow-600 hover:text-yellow-800' 
                                  : 'text-green-600 hover:text-green-800'
                              } disabled:opacity-50`}
                              title={u.is_active ? 'Désactiver' : 'Activer'}
                            >
                              {u.is_active ? '⏸️' : '▶️'}
                            </button>
                            <button
                              onClick={() => handleToggleSeller(u.id, u.username, u.is_seller)}
                              disabled={processing === u.id || u.is_admin}
                              className={`p-1 ${
                                u.is_seller 
                                  ? 'text-purple-600 hover:text-purple-800' 
                                  : 'text-gray-600 hover:text-gray-800'
                              } disabled:opacity-50 disabled:cursor-not-allowed`}
                              title={u.is_seller ? 'Retirer vendeur' : 'Rendre vendeur'}
                            >
                              👑
                            </button>
                            <button
                              onClick={() => handleToggleAdmin(u.id, u.username, u.is_admin)}
                              disabled={processing === u.id || u.id === user?.id}
                              className={`p-1 ${
                                u.is_admin 
                                  ? 'text-red-600 hover:text-red-800' 
                                  : 'text-gray-600 hover:text-gray-800'
                              } disabled:opacity-50 disabled:cursor-not-allowed`}
                              title={u.is_admin ? 'Retirer admin' : 'Rendre admin'}
                            >
                              ⚙️
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u.id, u.username)}
                              disabled={processing === u.id || u.id === user?.id}
                              className="p-1 text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Supprimer"
                            >
                              🗑️
                            </button>
                          </div>
                          {processing === u.id && (
                            <div className="text-xs text-gray-500 animate-pulse">
                              Traitement...
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal détails utilisateur */}
        {showUserModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold">Détails de l'utilisateur</h3>
              </div>
              
              <div className="p-6">
                <div className="flex items-center mb-6">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
                    {selectedUser.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="ml-4">
                    <h4 className="text-xl font-bold text-gray-900">{selectedUser.full_name || selectedUser.username}</h4>
                    <p className="text-gray-600">@{selectedUser.username}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 md:col-span-1">
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{selectedUser.email}</p>
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <p className="text-sm text-gray-500">Téléphone</p>
                    <p className="font-medium">{selectedUser.phone || '—'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Membre depuis</p>
                    <p className="font-medium">{new Date(selectedUser.created_at).toLocaleDateString('fr-FR')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Statut</p>
                    <p className={`font-medium ${selectedUser.is_active ? 'text-green-600' : 'text-red-600'}`}>
                      {selectedUser.is_active ? 'Actif' : 'Inactif'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Rôles</p>
                    <div className="flex gap-1 mt-1">
                      {selectedUser.is_admin && <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">Admin</span>}
                      {selectedUser.is_seller && <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">Vendeur</span>}
                      {!selectedUser.is_seller && !selectedUser.is_admin && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Acheteur</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Boutiques</p>
                    <p className="font-medium">{selectedUser.total_shops || 0}</p>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
                <button
                  onClick={() => setShowUserModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
