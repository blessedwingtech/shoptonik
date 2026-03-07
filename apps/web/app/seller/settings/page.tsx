'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/app/contexts/AuthContext'
import { api } from '@/app/lib/api'
import { useRouter } from 'next/navigation'

interface UserSettings {
  email: string
  username: string
  full_name: string | null
  current_password: string
  new_password: string
  confirm_password: string
}

interface Shop {
  id: string
  slug: string
  name: string
}

interface User {
  email: string
  username: string
  full_name: string | null
  shops?: Shop[]
}

export default function SellerSettingsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [activeSection, setActiveSection] = useState('profile')
  const [settings, setSettings] = useState<UserSettings>({
    email: '',
    username: '',
    full_name: '',
    current_password: '',
    new_password: '',
    confirm_password: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    if (user) {
      setSettings({
        email: user.email,
        username: user.username,
        full_name: user.full_name || '',
        current_password: '',
        new_password: '',
        confirm_password: ''
      })
    }
  }, [user])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setSettings(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage({ type: '', text: '' })

    try {
      const response = await api.put('/user/profile', {
        email: settings.email,
        username: settings.username,
        full_name: settings.full_name
      })
      
      setMessage({ type: 'success', text: 'Profil mis à jour avec succès!' })
      
      // Réinitialiser les champs de mot de passe
      setSettings(prev => ({
        ...prev,
        current_password: '',
        new_password: '',
        confirm_password: ''
      }))
    } catch (err: any) {
      setMessage({ 
        type: 'error', 
        text: err.response?.data?.message || 'Erreur lors de la mise à jour du profil' 
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (settings.new_password !== settings.confirm_password) {
      setMessage({ type: 'error', text: 'Les mots de passe ne correspondent pas' })
      return
    }
    
    if (settings.new_password.length < 8) {
      setMessage({ type: 'error', text: 'Le nouveau mot de passe doit faire au moins 8 caractères' })
      return
    }

    setIsLoading(true)
    setMessage({ type: '', text: '' })

    try {
      const response = await api.put('/user/password', {
        current_password: settings.current_password,
        new_password: settings.new_password
      })
      
      setMessage({ type: 'success', text: 'Mot de passe changé avec succès!' })
      
      // Réinitialiser les champs
      setSettings(prev => ({
        ...prev,
        current_password: '',
        new_password: '',
        confirm_password: ''
      }))
    } catch (err: any) {
      setMessage({ 
        type: 'error', 
        text: err.response?.data?.message || 'Erreur lors du changement de mot de passe' 
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleShopSettingsClick = () => {
    if (user?.shops && user.shops.length > 0) {
      router.push(`/seller/dashboard/${user.shops[0].slug}/settings`)
    } else {
      router.push('/seller/dashboard/create')
    }
  }

  // Navigation items
  const navItems = [
    { id: 'profile', label: 'Profil', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
    { id: 'security', label: 'Sécurité', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' },
    { id: 'notifications', label: 'Notifications', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
    { id: 'billing', label: 'Facturation', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { id: 'shop', label: 'Paramètres boutique', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Paramètres du compte
          </h1>
          <p className="mt-2 text-gray-600">
            Gérez vos informations personnelles et vos préférences
          </p>
        </div>

        {/* Message */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-md ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Navigation latérale */}
          <div className="lg:col-span-1">
            <nav className="space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full text-left border-l-4 px-3 py-2 flex items-center text-sm font-medium ${
                    activeSection === item.id
                      ? 'bg-blue-50 border-blue-500 text-blue-700'
                      : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <svg 
                    className={`mr-3 h-5 w-5 ${
                      activeSection === item.id ? 'text-blue-500' : 'text-gray-400'
                    }`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                  </svg>
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Contenu principal */}
          <div className="lg:col-span-2">
            {/* Section Profil */}
            {activeSection === 'profile' && (
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                  Informations du profil
                </h2>
                <form onSubmit={handleProfileUpdate}>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                        Adresse email
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={settings.email}
                        onChange={handleInputChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                        Nom d'utilisateur
                      </label>
                      <input
                        type="text"
                        id="username"
                        name="username"
                        value={settings.username}
                        onChange={handleInputChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
                        Nom complet
                      </label>
                      <input
                        type="text"
                        id="full_name"
                        name="full_name"
                        value={settings.full_name || ''}
                        onChange={handleInputChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                    <div className="pt-4">
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                      >
                        {isLoading ? 'Mise à jour...' : 'Mettre à jour le profil'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}

            {/* Section Sécurité */}
            {activeSection === 'security' && (
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                  Changer le mot de passe
                </h2>
                <form onSubmit={handlePasswordUpdate}>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="current_password" className="block text-sm font-medium text-gray-700">
                        Mot de passe actuel
                      </label>
                      <input
                        type="password"
                        id="current_password"
                        name="current_password"
                        value={settings.current_password}
                        onChange={handleInputChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="new_password" className="block text-sm font-medium text-gray-700">
                        Nouveau mot de passe
                      </label>
                      <input
                        type="password"
                        id="new_password"
                        name="new_password"
                        value={settings.new_password}
                        onChange={handleInputChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        required
                      />
                      <p className="mt-1 text-xs text-gray-500">Minimum 8 caractères</p>
                    </div>
                    <div>
                      <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700">
                        Confirmer le nouveau mot de passe
                      </label>
                      <input
                        type="password"
                        id="confirm_password"
                        name="confirm_password"
                        value={settings.confirm_password}
                        onChange={handleInputChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        required
                      />
                    </div>
                    <div className="pt-4">
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                      >
                        {isLoading ? 'Changement...' : 'Changer le mot de passe'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}

            {/* Section Boutique */}
            {activeSection === 'shop' && (
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                  Paramètres de votre boutique
                </h2>
                
                <div className="space-y-4">
                  <p className="text-gray-600">
                    Gérez les informations, l'apparence et la configuration de votre boutique.
                  </p>
                  
                  <button
                    onClick={handleShopSettingsClick}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {user?.shops && user.shops.length > 0 
                      ? 'Gérer les paramètres de la boutique'
                      : 'Créer une boutique'}
                  </button>
                </div>
              </div>
            )}

            {/* Sections vides pour les autres onglets */}
            {activeSection === 'notifications' && (
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                  Préférences de notifications
                </h2>
                <p className="text-gray-600">Section en cours de développement...</p>
              </div>
            )}

            {activeSection === 'billing' && (
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                  Facturation et abonnement
                </h2>
                <p className="text-gray-600">Section en cours de développement...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}