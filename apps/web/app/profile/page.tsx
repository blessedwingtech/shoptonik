'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/app/contexts/AuthContext'
import { api } from '@/app/lib/api'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import AvatarUploader from '@/app/components/AvatarUploader'
import { toast } from 'react-hot-toast'
import ConfirmationModal from '../components/ConfirmationModal'
//import ConfirmModal from '@/app/components/ConfirmModal' // À créer

export default function ProfilePage() {
  const { user, updateUser, logout, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isProfileLoading, setIsProfileLoading] = useState(true)
  const [showAvatarUploader, setShowAvatarUploader] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  })
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    username: '',
    phone: '',
    avatar: ''
  })
  const [activeTab, setActiveTab] = useState('profile')

  // ✅ Charger le profil depuis l'API
  useEffect(() => {
    const loadUserProfile = async () => {
      if (formData.email && formData.username) {
        return
      }
      
      setIsProfileLoading(true)
      try {
        const response = await api.getProfile()
        if (response.data) {
          const currentUserStr = JSON.stringify(user)
          const newUserStr = JSON.stringify(response.data)
          
          if (currentUserStr !== newUserStr) {
            updateUser(response.data)
          }
          
          setFormData({
            full_name: response.data.full_name || '',
            email: response.data.email || '',
            username: response.data.username || '',
            phone: response.data.phone || '',
            avatar: response.data.avatar || ''
          })
        }
      } catch (error) {
        console.error('Erreur chargement profil:', error)
        toast.error('Erreur lors du chargement du profil')
      } finally {
        setIsProfileLoading(false)
      }
    }

    if (user && !formData.email) {
      loadUserProfile()
    } else if (!user) {
      setIsProfileLoading(false)
    }
  }, [user, formData.email])

  // ✅ Redirection si non connecté
  useEffect(() => {
  // Attendre que l'auth ait fini de charger avant de décider
  if (!authLoading && !user) {
    router.push('/auth/login')
  }
}, [user, authLoading, router])
  // useEffect(() => {
  //   if (!user) {
  //     router.push('/auth/login')
  //   }
  // }, [user, router])

  // ✅ Mettre à jour le formulaire quand user change
  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        email: user.email || '',
        username: user.username || '',
        phone: user.phone || '',
        avatar: user.avatar || ''
      })
    }
  }, [user])


  if (authLoading) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Vérification de votre session...</p>
      </div>
    </div>
  )
}

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    const loadingToast = toast.loading('Mise à jour de votre profil...')
    
    try {
      const response = await api.updateProfile(formData)
      toast.dismiss(loadingToast)
      
      if (response.data) {
        updateUser(response.data)
        setFormData({
          full_name: response.data.full_name || '',
          email: response.data.email || '',
          username: response.data.username || '',
          phone: response.data.phone || '',
          avatar: response.data.avatar || ''
        })
        toast.success('✅ Profil mis à jour avec succès', {
          duration: 3000,
          icon: '👤'
        })
      }
    } catch (error) {
      toast.dismiss(loadingToast)
      console.error('Erreur mise à jour:', error)
      toast.error('❌ Erreur lors de la mise à jour du profil', {
        duration: 4000
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAvatarUpload = async (url: string) => {
    setFormData({ ...formData, avatar: url })
    setShowAvatarUploader(false)
    
    const loadingToast = toast.loading('Mise à jour de votre photo...')
    
    try {
      const updateData = {
        ...formData,
        avatar: url
      }
      
      const response = await api.updateProfile(updateData)
      toast.dismiss(loadingToast)
      
      if (response.data) {
        updateUser(response.data)
        
        const profileResponse = await api.getProfile()
        if (profileResponse.data) {
          updateUser(profileResponse.data)
          setFormData({
            full_name: profileResponse.data.full_name || '',
            email: profileResponse.data.email || '',
            username: profileResponse.data.username || '',
            phone: profileResponse.data.phone || '',
            avatar: profileResponse.data.avatar || ''
          })
        }
        
        toast.success('✅ Photo de profil mise à jour', {
          duration: 3000,
          icon: '📸'
        })
      }
    } catch (error) {
      toast.dismiss(loadingToast)
      console.error('Erreur mise à jour avatar:', error)
      toast.error('❌ Erreur lors de la mise à jour', {
        duration: 4000
      })
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')

    if (passwordData.new_password !== passwordData.confirm_password) {
      setPasswordError('Les mots de passe ne correspondent pas')
      return
    }
    if (passwordData.new_password.length < 6) {
      setPasswordError('Le mot de passe doit contenir au moins 6 caractères')
      return
    }

    setIsLoading(true)
    const loadingToast = toast.loading('Modification du mot de passe...')
    
    try {
      const response = await api.changePassword(
        passwordData.current_password,
        passwordData.new_password
      )
      
      toast.dismiss(loadingToast)
      
      if (response.statusCode === 200) {
        setPasswordSuccess('✅ Mot de passe modifié avec succès')
        setPasswordData({
          current_password: '',
          new_password: '',
          confirm_password: ''
        })
        toast.success('✅ Mot de passe modifié avec succès', {
          duration: 3000
        })
      } else {
        setPasswordError(response.error || 'Erreur lors du changement')
        toast.error(response.error || 'Erreur lors du changement', {
          duration: 4000
        })
      }
    } catch (error: any) {
      toast.dismiss(loadingToast)
      setPasswordError(error.message || 'Erreur lors du changement')
      toast.error(error.message || 'Erreur lors du changement', {
        duration: 4000
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    const loadingToast = toast.loading('Suppression du compte en cours...')
    try {
      // Logique de suppression du compte
      // await api.deleteAccount()
      toast.dismiss(loadingToast)
      toast.success('Compte supprimé avec succès', {
        duration: 3000
      })
      logout()
    } catch (error) {
      toast.dismiss(loadingToast)
      toast.error('Erreur lors de la suppression du compte', {
        duration: 4000
      })
    }
  }

  // Redirection si non connecté
  if (!user) {
    return null
  }

  // Loader pendant le chargement
  if (isProfileLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement de votre profil...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header avec bouton admin */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mon profil</h1>
            <p className="text-gray-600 mt-2">
              Gérez vos informations personnelles et vos préférences
            </p>
          </div>
          {user?.is_seller && (
            <Link
              href="/my-orders"
              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 border-t border-gray-100"
              >
              <span className="mr-3 text-lg">📦</span>
              <div>
                <p className="font-medium">Mes commandes</p>
                <p className="text-xs text-gray-500">Suivre mes achats</p>
              </div>
            </Link>
          )}
          
          {user?.is_admin && (
            <Link
              href="/admin/dashboard"
              className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <span className="mr-2">⚙️</span>
              Admin
            </Link>
          )}
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6 overflow-x-auto" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('profile')}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'profile'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                👤 Informations personnelles
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'security'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                🔒 Sécurité
              </button>
              {user?.is_seller && (
                <button
                  onClick={() => setActiveTab('seller')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === 'seller'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  📊 Espace vendeur
                </button> 
              )}
 
              <button
                onClick={() => setActiveTab('preferences')}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'preferences'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                ⚙️ Préférences
              </button>
            </nav>
            
            {!user?.is_seller && (
              <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">Devenir vendeur</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Créez votre propre boutique et commencez à vendre
                    </p>
                  </div>
                  <Link
                    href="/become-seller"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 whitespace-nowrap"
                  >
                    Devenir vendeur
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Contenu des tabs */}
          <div className="p-6">
            {activeTab === 'profile' && (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Avatar avec upload */}
                <div className="flex items-center space-x-6">
                  {formData.avatar ? (
                    <img 
                      src={formData.avatar} 
                      alt="Avatar"
                      className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
                      {user?.username?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <button
                      type="button"
                      onClick={() => setShowAvatarUploader(true)}
                      className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Changer la photo
                    </button>
                    <p className="text-xs text-gray-500 mt-1">
                      Format JPG, PNG. Max 2Mo.
                    </p>
                  </div>
                </div>

                {/* Formulaire */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom complet
                    </label>
                    <input
                      type="text"
                      value={formData.full_name}
                      onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Votre nom complet"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom d'utilisateur
                    </label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({...formData, username: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Téléphone
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      placeholder="+33 6 12 34 56 78"
                    />
                  </div>
                </div>

                {/* Stats utilisateur */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Statistiques</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Membre depuis</p>
                      <p className="font-medium">
                        {new Date(user.created_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Boutiques</p>
                      <p className="font-medium">{user.total_shops || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Type de compte</p>
                      <p className="font-medium">
                        {user.is_seller ? 'Vendeur' : 'Acheteur'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Statut</p>
                      <p className="font-medium text-green-600">Actif</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Mise à jour...
                      </>
                    ) : (
                      'Enregistrer les modifications'
                    )}
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Changer le mot de passe</h3>
                  
                  {passwordError && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                      {passwordError}
                    </div>
                  )}
                  
                  {passwordSuccess && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                      {passwordSuccess}
                    </div>
                  )}
                  
                  <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Mot de passe actuel
                      </label>
                      <input
                        type="password"
                        value={passwordData.current_password}
                        onChange={(e) => setPasswordData({...passwordData, current_password: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nouveau mot de passe
                      </label>
                      <input
                        type="password"
                        value={passwordData.new_password}
                        onChange={(e) => setPasswordData({...passwordData, new_password: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        required
                        minLength={6}
                      />
                      <p className="text-xs text-gray-500 mt-1">Minimum 6 caractères</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confirmer le mot de passe
                      </label>
                      <input
                        type="password"
                        value={passwordData.confirm_password}
                        onChange={(e) => setPasswordData({...passwordData, confirm_password: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {isLoading ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
                    </button>
                  </form>
                </div>

                <div className="border-t pt-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-4">Double authentification</h4>
                  <div className="flex items-center justify-between max-w-md">
                    <div>
                      <p className="text-gray-900">Authentification à deux facteurs</p>
                      <p className="text-sm text-gray-500">Ajoutez une couche de sécurité supplémentaire</p>
                    </div>
                    <button
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Configurer
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'seller' && user?.is_seller && (
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-blue-800">
                    Vous avez un compte vendeur. Accédez à votre espace pour gérer vos boutiques et produits.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Accès rapide</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Link
                      href="/seller/dashboard"
                      className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors group"
                    >
                      <div className="flex items-center">
                        <span className="text-3xl mr-4">📊</span>
                        <div>
                          <p className="font-medium group-hover:text-blue-600">Dashboard vendeur</p>
                          <p className="text-sm text-gray-500">Vue d'ensemble de votre activité</p>
                        </div>
                      </div>
                    </Link>
                    
                    <Link
                      href="/seller/products"
                      className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors group"
                    >
                      <div className="flex items-center">
                        <span className="text-3xl mr-4">📦</span>
                        <div>
                          <p className="font-medium group-hover:text-blue-600">Gestion des produits</p>
                          <p className="text-sm text-gray-500">Ajoutez et modifiez vos produits</p>
                        </div>
                      </div>
                    </Link>
                    
                    <Link
                      href="/seller/orders"
                      className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors group"
                    >
                      <div className="flex items-center">
                        <span className="text-3xl mr-4">📋</span>
                        <div>
                          <p className="font-medium group-hover:text-blue-600">Commandes</p>
                          <p className="text-sm text-gray-500">Suivez vos ventes</p>
                        </div>
                      </div>
                    </Link>
                    
                    <Link
                      href="/seller/settings"
                      className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors group"
                    >
                      <div className="flex items-center">
                        <span className="text-3xl mr-4">⚙️</span>
                        <div>
                          <p className="font-medium group-hover:text-blue-600">Paramètres vendeur</p>
                          <p className="text-sm text-gray-500">Configuration de votre compte</p>
                        </div>
                      </div>
                    </Link>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Statistiques vendeur</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-2xl font-bold text-blue-600">{user.total_shops || 0}</p>
                      <p className="text-xs text-gray-500">Boutiques</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-600">-</p>
                      <p className="text-xs text-gray-500">Produits</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-purple-600">-</p>
                      <p className="text-xs text-gray-500">Commandes</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-orange-600">-</p>
                      <p className="text-xs text-gray-500">CA total</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-3">
                    Les statistiques détaillées sont disponibles dans votre dashboard
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'preferences' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Préférences</h3>
                  
                  <div className="space-y-4 max-w-md">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Notifications par email</p>
                        <p className="text-sm text-gray-500">Recevoir des notifications</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Langue</p>
                        <p className="text-sm text-gray-500">Langue de l'interface</p>
                      </div>
                      <select className="px-3 py-2 border border-gray-300 rounded-lg">
                        <option>Français</option>
                        <option>English</option>
                        <option>Español</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Devise</p>
                        <p className="text-sm text-gray-500">Devise par défaut</p>
                      </div>
                      <select className="px-3 py-2 border border-gray-300 rounded-lg">
                        <option>EUR (€)</option>
                        <option>USD ($)</option>
                        <option>GBP (£)</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Mode sombre</p>
                        <p className="text-sm text-gray-500">Activer le thème sombre</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-4">Zone dangereuse</h4>
                  <div className="flex items-center justify-between max-w-md">
                    <div>
                      <p className="text-gray-900 text-red-600">Supprimer mon compte</p>
                      <p className="text-sm text-gray-500">Cette action est irréversible</p>
                    </div>
                    <button
                      className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
                      onClick={() => setShowDeleteModal(true)}
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Avatar Uploader Modal */}
      {showAvatarUploader && (
        <AvatarUploader
          currentAvatar={formData.avatar}
          username={user.username}
          onUpload={handleAvatarUpload}
          onClose={() => setShowAvatarUploader(false)}
        />
      )}

      {/* Modal de confirmation de suppression */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteAccount}
        title="Supprimer mon compte"
        message="Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible et toutes vos données seront perdues."
        confirmText="Supprimer définitivement"
        type="danger"
      />
    </div>
  )
}
