'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/app/contexts/AuthContext'
import { api } from '@/app/lib/api'

// Catégories
const SHOP_CATEGORIES = [
  { value: '', label: 'Sélectionner une catégorie' },
  { value: 'mode', label: 'Mode & Vêtements' },
  { value: 'artisanat', label: 'Artisanat' },
  { value: 'decoration', label: 'Décoration' },
  { value: 'bijoux', label: 'Bijoux & Accessoires' },
  { value: 'cosmetique', label: 'Cosmétiques & Beauté' },
  { value: 'alimentation', label: 'Alimentation' },
  { value: 'informatique', label: 'Informatique & Électronique' },
  { value: 'livres', label: 'Livres & Papeterie' },
  { value: 'sport', label: 'Sport & Loisirs' },
  { value: 'enfant', label: 'Enfant & Bébé' },
  { value: 'maison', label: 'Maison & Jardin' },
  { value: 'autre', label: 'Autre' }
]

// Devises
const CURRENCIES = [
  { value: 'EUR', label: 'Euro (€)' },
  { value: 'USD', label: 'Dollar US ($)' },
  { value: 'GBP', label: 'Livre Sterling (£)' },
  { value: 'CAD', label: 'Dollar Canadien (C$)' },
  { value: 'CHF', label: 'Franc Suisse (CHF)' },
  { value: 'JPY', label: 'Yen Japonais (¥)' }
]

// Langues
const LANGUAGES = [
  { value: 'fr', label: 'Français' },
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
  { value: 'de', label: 'Deutsch' },
  { value: 'it', label: 'Italiano' }
]

// Fuseaux horaires
const TIMEZONES = [
  { value: 'Europe/Paris', label: 'Europe/Paris (CET)' },
  { value: 'Europe/London', label: 'Europe/London (GMT)' },
  { value: 'America/New_York', label: 'America/New_York (EST)' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles (PST)' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo (JST)' },
  { value: 'Australia/Sydney', label: 'Australia/Sydney (AEDT)' }
]

interface ShopSettingsData {
  // Informations de base
  name: string
  description: string
  category: string
  
  // Configuration
  currency: string
  language: string
  timezone: string
  
  // Branding
  logo_url: string
  primary_color: string
  secondary_color: string
  
  // Contact (Nouveau)
  email: string
  phone: string
  address: string
  city: string
  country: string
  postal_code: string
  
  // Réseaux sociaux (Nouveau)
  website: string
  instagram: string
  facebook: string
  twitter: string
  
  // SEO (Nouveau)
  meta_title: string
  meta_description: string
  
  // Status
  is_active: boolean
  // Champs "À propos"
  about_story: string
  about_mission: string
  about_values: string
  about_commitments: string
  
  // Informations supplémentaires
  business_hours: string
  shipping_info: string
  return_policy: string
  payment_methods: string
  
  // Images pour la page "À propos"
  about_image1_url: string
  about_image2_url: string

  accepted_payment_methods: string[]
}

export default function ShopSettingsPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [shop, setShop] = useState<any>(null)

  const [formData, setFormData] = useState<ShopSettingsData>({
    // Informations de base
    name: '',
    description: '',
    category: '',
    
    // Configuration
    currency: 'EUR',
    language: 'fr',
    timezone: 'Europe/Paris',
    
    // Branding
    logo_url: '',
    primary_color: '#3B82F6',
    secondary_color: '#8B5CF6',
    
    // Contact
    email: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    postal_code: '',
    
    // Réseaux sociaux
    website: '',
    instagram: '',
    facebook: '',
    twitter: '',
    
    // SEO
    meta_title: '',
    meta_description: '',
    
    // Status
    is_active: true,
    // 👇 NOUVEAUX CHAMPS (valeurs par défaut vides)
    about_story: '',
    about_mission: '',
    about_values: '',
    about_commitments: '',
    business_hours: '',
    shipping_info: '',
    return_policy: '',
    payment_methods: '',
    about_image1_url: '',
    about_image2_url: '',
    accepted_payment_methods: []
  })

  const shopSlug = params.slug as string

  useEffect(() => {
    if (shopSlug) {
      fetchShopData()
    }
  }, [shopSlug])

  const fetchShopData = async () => {
    if (!shopSlug) return
    
    setFetching(true)
    setError('')

    try {
      const response = await api.getShopBySlug(shopSlug)
        console.log("📥 Réponse complète API:", response) // 👈 AJOUTEZ CE LOG
    console.log("📥 Données de la boutique:", response.data) // 👈 AJOUTEZ CE LOG
      if (response.data) {
        setShop(response.data)
        // Affichez toutes les propriétés disponibles
      console.log("🔍 Propriétés disponibles:", Object.keys(response.data))
      console.log("🔍 Valeur de currency:", response.data.currency)
      console.log("🔍 Valeur de timezone:", response.data.timezone)
      console.log("🔍 Valeur de primary_color:", response.data.primary_color)
        // Remplir TOUS les champs avec les données de la boutique
        setFormData({
          name: response.data.name || '',
          description: response.data.description || '',
          category: response.data.category || '',
          
          currency: response.data.currency || 'EUR',
          language: response.data.language || 'fr',
          timezone: response.data.timezone || 'Europe/Paris',
          
          logo_url: response.data.logo_url || '',
          primary_color: response.data.primary_color || '#3B82F6',
          secondary_color: response.data.secondary_color || '#8B5CF6',
          
          // Ces champs peuvent ne pas exister dans votre API
          email: response.data.email || '',
          phone: response.data.phone || '',
          address: response.data.address || '',
          city: response.data.city || '',
          country: response.data.country || '',
          postal_code: response.data.postal_code || '',
          
          website: response.data.website || '',
          instagram: response.data.instagram || '',
          facebook: response.data.facebook || '',
          twitter: response.data.twitter || '',
          
          meta_title: response.data.meta_title || '',
          meta_description: response.data.meta_description || '',
          
          is_active: response.data.is_active !== false, // true par défaut
          // 👇 CHARGER LES NOUVEAUX CHAMPS
            about_story: response.data.about_story || '',
            about_mission: response.data.about_mission || '',
            about_values: response.data.about_values || '',
            about_commitments: response.data.about_commitments || '',
            business_hours: response.data.business_hours || '',
            shipping_info: response.data.shipping_info || '',
            return_policy: response.data.return_policy || '',
            payment_methods: response.data.payment_methods || '',
            about_image1_url: response.data.about_image1_url || '',
            about_image2_url: response.data.about_image2_url || '',
            accepted_payment_methods: response.data.accepted_payment_methods || []
        })
      } else {
        setError(response.error || 'Boutique non trouvée')
      }
    } catch (err: any) {
      setError(err.message || 'Erreur de chargement')
    } finally {
      setFetching(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    
    if (type === 'checkbox') {
      const target = e.target as HTMLInputElement
      setFormData(prev => ({
        ...prev,
        [name]: target.checked
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  const updateFormDataFromResponse = (shopData: any) => {
  setFormData({
    name: shopData.name || '',
    description: shopData.description || '',
    category: shopData.category || '',
    
    currency: shopData.currency || 'EUR',
    language: shopData.language || 'fr',
    timezone: shopData.timezone || 'Europe/Paris',
    
    logo_url: shopData.logo_url || '',
    primary_color: shopData.primary_color || '#3B82F6',
    secondary_color: shopData.secondary_color || '#8B5CF6',
    
    email: shopData.email || '',
    phone: shopData.phone || '',
    address: shopData.address || '',
    city: shopData.city || '',
    country: shopData.country || '',
    postal_code: shopData.postal_code || '',
    
    website: shopData.website || '',
    instagram: shopData.instagram || '',
    facebook: shopData.facebook || '',
    twitter: shopData.twitter || '',
    
    meta_title: shopData.meta_title || '',
    meta_description: shopData.meta_description || '',
    
    is_active: shopData.is_active !== false,
    // 👇 METTRE À JOUR LES NOUVEAUX CHAMPS
    about_story: shopData.about_story || '',
    about_mission: shopData.about_mission || '',
    about_values: shopData.about_values || '',
    about_commitments: shopData.about_commitments || '',
    business_hours: shopData.business_hours || '',
    shipping_info: shopData.shipping_info || '',
    return_policy: shopData.return_policy || '',
    payment_methods: shopData.payment_methods || '',
    about_image1_url: shopData.about_image1_url || '',
    about_image2_url: shopData.about_image2_url || '',
    accepted_payment_methods: formData.accepted_payment_methods
  })
}



const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()

  if (!formData.name.trim()) {
    setError('Le nom de la boutique est requis')
    return
  }

  setLoading(true)
  setError('')
  setSuccess('')

  // 👇 AJOUTEZ CE LOGGING DÉTAILLÉ
  const dataToSend = {
    // Informations de base
    name: formData.name,
    description: formData.description || null,
    category: formData.category || 'general',
    
    // Configuration
    currency: formData.currency,
    language: formData.language,
    timezone: formData.timezone,
    
    // Branding
    primary_color: formData.primary_color,
    secondary_color: formData.secondary_color,
    logo_url: formData.logo_url || null,
    
    // Contact
    email: formData.email || null,
    phone: formData.phone || null,
    address: formData.address || null,
    city: formData.city || null,
    country: formData.country || null,
    postal_code: formData.postal_code || null,
    
    // Réseaux sociaux
    website: formData.website || null,
    instagram: formData.instagram || null,
    facebook: formData.facebook || null,
    twitter: formData.twitter || null,
    
    // SEO
    meta_title: formData.meta_title || null,
    meta_description: formData.meta_description || null,
    
    // Status
    is_active: formData.is_active,
    accepted_payment_methods: formData.accepted_payment_methods,
     // 👇 INCLURE LES NOUVEAUX CHAMPS
    about_story: formData.about_story || null,
    about_mission: formData.about_mission || null,
    about_values: formData.about_values || null,
    about_commitments: formData.about_commitments || null,
    business_hours: formData.business_hours || null,
    shipping_info: formData.shipping_info || null,
    return_policy: formData.return_policy || null,
    payment_methods: formData.payment_methods || null,
    about_image1_url: formData.about_image1_url || null,
    about_image2_url: formData.about_image2_url || null
  }

  console.log("📤 === DONNÉES ENVOYÉES ===")
  console.log("Données brutes:", dataToSend)
  console.log("Secondary_color envoyée:", dataToSend.secondary_color)
  console.log("Type de secondary_color:", typeof dataToSend.secondary_color)
  console.log("========================")

  try {
    const response = await api.updateShop(shopSlug, dataToSend)
    
    console.log("📥 === RÉPONSE DU SERVEUR ===")
    console.log("Réponse complète:", response)
    console.log("Données retournées:", response.data)
    console.log("Secondary_color retournée:", response.data?.secondary_color)
    console.log("========================")
    
    if (response.data) {
      setSuccess('Paramètres mis à jour avec succès')
      // 👇 Mettre à jour IMMÉDIATEMENT le formulaire
  updateFormDataFromResponse(response.data)
      
      // Rafraîchir les données après un délai
      setTimeout(() => {
        fetchShopData()
      }, 1000)
    } else {
      setError(response.error || 'Erreur de mise à jour')
    }
  } catch (err: any) {
    console.error("❌ Erreur détaillée:", err)
    setError(err.message || 'Erreur de connexion')
  } finally {
    setLoading(false)
  }
}

  if (fetching) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des paramètres...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header avec navigation */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Paramètres de la boutique
              </h1>
              <p className="mt-2 text-gray-600">
                Gérez les informations et l'apparence de votre boutique
              </p>
            </div>
            <button
              onClick={() => router.push(`/seller/dashboard/${shopSlug}`)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              ← Retour au tableau de bord
            </button>
          </div>
        </div>

        {/* Messages d'erreur/succès */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">
              {typeof error === 'string' ? error : JSON.stringify(error)}
            </p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700">{success}</p>
          </div>
        )}

        {/* Formulaire de paramètres */}
        <div className="bg-white rounded-xl shadow p-6">
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Section 1: Informations de base */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Informations de base
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom de la boutique *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Catégorie
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {SHOP_CATEGORIES.map(cat => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Décrivez votre boutique en quelques phrases..."
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Configuration */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Configuration
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Devise
                  </label>
                  <select
                    name="currency"
                    value={formData.currency}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {CURRENCIES.map(currency => (
                      <option key={currency.value} value={currency.value}>
                        {currency.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Langue
                  </label>
                  <select
                    name="language"
                    value={formData.language}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {LANGUAGES.map(lang => (
                      <option key={lang.value} value={lang.value}>
                        {lang.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fuseau horaire
                  </label>
                  <select
                    name="timezone"
                    value={formData.timezone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {TIMEZONES.map(tz => (
                      <option key={tz.value} value={tz.value}>
                        {tz.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Section 3: Branding */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Branding
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Couleur primaire
                  </label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="color"
                      name="primary_color"
                      value={formData.primary_color}
                      onChange={handleInputChange}
                      className="w-12 h-12 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      name="primary_color"
                      value={formData.primary_color}
                      onChange={handleInputChange}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="#3B82F6"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Couleur secondaire
                  </label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="color"
                      name="secondary_color"
                      value={formData.secondary_color}
                      onChange={handleInputChange}
                      className="w-12 h-12 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      name="secondary_color"
                      value={formData.secondary_color}
                      onChange={handleInputChange}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="#8B5CF6"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Logo URL
                  </label>
                  <input
                    type="url"
                    name="logo_url"
                    value={formData.logo_url}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://exemple.com/logo.png"
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Moyens de paiement acceptés - À AJOUTER */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Moyens de paiement acceptés
              </h2>
              <div className="bg-gray-50 p-6 rounded-lg">
                <p className="text-sm text-gray-600 mb-4">
                  Sélectionnez les méthodes de paiement que vous acceptez dans votre boutique.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  
                  {/* Carte bancaire */}
                  <label className="flex items-center p-4 bg-white border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={formData.accepted_payment_methods?.includes('card') || false}
                      onChange={(e) => {
                        const current = formData.accepted_payment_methods || []
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            accepted_payment_methods: [...current, 'card']
                          })
                        } else {
                          setFormData({
                            ...formData,
                            accepted_payment_methods: current.filter(m => m !== 'card')
                          })
                        }
                      }}
                      className="h-4 w-4 text-blue-600 rounded border-gray-300 mr-3"
                    />
                    <div>
                      <span className="font-medium">Carte bancaire</span>
                      <p className="text-sm text-gray-500">Visa, Mastercard, etc.</p>
                    </div>
                  </label>

                  {/* PayPal */}
                  <label className="flex items-center p-4 bg-white border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={formData.accepted_payment_methods?.includes('paypal') || false}
                      onChange={(e) => {
                        const current = formData.accepted_payment_methods || []
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            accepted_payment_methods: [...current, 'paypal']
                          })
                        } else {
                          setFormData({
                            ...formData,
                            accepted_payment_methods: current.filter(m => m !== 'paypal')
                          })
                        }
                      }}
                      className="h-4 w-4 text-blue-600 rounded border-gray-300 mr-3"
                    />
                    <div>
                      <span className="font-medium">PayPal</span>
                      <p className="text-sm text-gray-500">Paiement sécurisé</p>
                    </div>
                  </label>

                  {/* MonCash */}
                  <label className="flex items-center p-4 bg-white border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={formData.accepted_payment_methods?.includes('moncash') || false}
                      onChange={(e) => {
                        const current = formData.accepted_payment_methods || []
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            accepted_payment_methods: [...current, 'moncash']
                          })
                        } else {
                          setFormData({
                            ...formData,
                            accepted_payment_methods: current.filter(m => m !== 'moncash')
                          })
                        }
                      }}
                      className="h-4 w-4 text-blue-600 rounded border-gray-300 mr-3"
                    />
                    <div>
                      <span className="font-medium">MonCash</span>
                      <p className="text-sm text-gray-500">Paiement mobile Haïti</p>
                    </div>
                  </label>

                  {/* NatCash */}
                  <label className="flex items-center p-4 bg-white border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={formData.accepted_payment_methods?.includes('natcash') || false}
                      onChange={(e) => {
                        const current = formData.accepted_payment_methods || []
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            accepted_payment_methods: [...current, 'natcash']
                          })
                        } else {
                          setFormData({
                            ...formData,
                            accepted_payment_methods: current.filter(m => m !== 'natcash')
                          })
                        }
                      }}
                      className="h-4 w-4 text-blue-600 rounded border-gray-300 mr-3"
                    />
                    <div>
                      <span className="font-medium">NatCash</span>
                      <p className="text-sm text-gray-500">Paiement mobile Haïti</p>
                    </div>
                  </label>

                  {/* Paiement à la livraison */}
                  <label className="flex items-center p-4 bg-white border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={formData.accepted_payment_methods?.includes('cash_on_delivery') || false}
                      onChange={(e) => {
                        const current = formData.accepted_payment_methods || []
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            accepted_payment_methods: [...current, 'cash_on_delivery']
                          })
                        } else {
                          setFormData({
                            ...formData,
                            accepted_payment_methods: current.filter(m => m !== 'cash_on_delivery')
                          })
                        }
                      }}
                      className="h-4 w-4 text-blue-600 rounded border-gray-300 mr-3"
                    />
                    <div>
                      <span className="font-medium">Paiement à la livraison</span>
                      <p className="text-sm text-gray-500">Espèces à la réception</p>
                    </div>
                  </label>

                </div>
              </div>
            </div>

            {/* Section 4: Contact */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Informations de contact
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email de contact
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Adresse
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ville
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Code postal
                  </label>
                  <input
                    type="text"
                    name="postal_code"
                    value={formData.postal_code}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pays
                  </label>
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Section 5: Réseaux sociaux */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Réseaux sociaux
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Site web
                  </label>
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Instagram
                  </label>
                  <input
                    type="text"
                    name="instagram"
                    value={formData.instagram}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="@nom_utilisateur"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Facebook
                  </label>
                  <input
                    type="text"
                    name="facebook"
                    value={formData.facebook}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nom de page Facebook"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Twitter/X
                  </label>
                  <input
                    type="text"
                    name="twitter"
                    value={formData.twitter}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="@nom_utilisateur"
                  />
                </div>
              </div>
            </div>

            {/* Section 6: SEO */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                SEO (Optimisation pour les moteurs de recherche)
              </h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meta Title (Titre pour SEO)
                  </label>
                  <input
                    type="text"
                    name="meta_title"
                    value={formData.meta_title}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Max 60 caractères"
                    maxLength={60}
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    {formData.meta_title.length}/60 caractères
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meta Description
                  </label>
                  <textarea
                    name="meta_description"
                    value={formData.meta_description}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={2}
                    placeholder="Max 160 caractères"
                    maxLength={160}
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    {formData.meta_description.length}/160 caractères
                  </p>
                </div>
              </div>
            </div>
            {/* Section 7: À propos et informations supplémentaires */}
            <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Page "À propos" et informations
            </h2>
            <div className="space-y-6">
                {/* Notre histoire */}
                <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notre histoire
                </label>
                <textarea
                    name="about_story"
                    value={formData.about_story}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={4}
                    placeholder="Racontez l'histoire de votre boutique..."
                />
                </div>

                {/* Notre mission */}
                <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notre mission
                </label>
                <textarea
                    name="about_mission"
                    value={formData.about_mission}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Quelle est la mission de votre boutique ?"
                />
                </div>

                {/* Nos valeurs */}
                <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nos valeurs
                </label>
                <textarea
                    name="about_values"
                    value={formData.about_values}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Quelles sont vos valeurs ? (écologique, local, artisanal, etc.)"
                />
                </div>

                {/* Nos engagements */}
                <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nos engagements
                </label>
                <textarea
                    name="about_commitments"
                    value={formData.about_commitments}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Quels sont vos engagements envers vos clients ?"
                />
                </div>

                {/* Grid pour les informations pratiques */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Horaires d'ouverture */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                    Horaires d'ouverture
                    </label>
                    <input
                    type="text"
                    name="business_hours"
                    value={formData.business_hours}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ex: Lun-Ven: 9h-18h, Sam: 10h-16h"
                    />
                </div>

                {/* Méthodes de paiement */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                    Méthodes de paiement acceptées
                    </label>
                    <input
                    type="text"
                    name="payment_methods"
                    value={formData.payment_methods}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ex: Carte bancaire, PayPal, Virement, Espèces"
                    />
                </div>

                {/* Informations de livraison */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                    Informations de livraison
                    </label>
                    <textarea
                    name="shipping_info"
                    value={formData.shipping_info}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Délais de livraison, frais de port, etc."
                    />
                </div>

                {/* Politique de retour */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                    Politique de retour
                    </label>
                    <textarea
                    name="return_policy"
                    value={formData.return_policy}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Conditions de retour, délai, frais, etc."
                    />
                </div>
                </div>

                {/* Images pour la page "À propos" */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                    Image 1 pour "À propos" (URL)
                    </label>
                    <input
                    type="url"
                    name="about_image1_url"
                    value={formData.about_image1_url}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://exemple.com/image1.jpg"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                    Image 2 pour "À propos" (URL)
                    </label>
                    <input
                    type="url"
                    name="about_image2_url"
                    value={formData.about_image2_url}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://exemple.com/image2.jpg"
                    />
                </div>
                </div>
            </div>
            </div>

            {/* Section 7: Status */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Status
              </h2>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                  Boutique active (visible publiquement)
                </label>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Décochez pour masquer temporairement votre boutique aux visiteurs
              </p>
            </div>

            {/* Boutons d'action */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <button
                type="button"
                onClick={() => fetchShopData()}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                disabled={loading}
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading || !formData.name.trim()}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sauvegarde en cours...' : 'Enregistrer les modifications'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
