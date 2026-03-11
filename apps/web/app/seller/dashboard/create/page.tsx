'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/contexts/AuthContext'
import { api } from '@/app/lib/api'
import Link from 'next/link'  // ← CORRECTION : importez Link depuis next/link, pas lucide-react

// Catégories importées depuis notre API ou définies ici
const SHOP_CATEGORIES = [
  { value: '', label: 'Choisir une catégorie' },
  { value: 'electronique', label: 'Électronique & High-Tech' },
  { value: 'mode', label: 'Mode & Vêtements' },
  { value: 'bijoux', label: 'Bijoux & Accessoires' },
  { value: 'maison', label: 'Maison & Déco' },
  { value: 'beaute', label: 'Beauté & Cosmétiques' },
  { value: 'art', label: 'Art & Créations' },
  { value: 'enfant', label: 'Enfant & Bébé' },
  { value: 'sport', label: 'Sport & Loisirs' },
  { value: 'alimentation', label: 'Alimentation & Boissons' },
  { value: 'sante', label: 'Santé & Bien-être' },
  { value: 'autre', label: 'Autre' }
]

export default function CreateShopPage() {
  const router = useRouter()
  const { token } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      setError('Le nom de la boutique est requis')
      return
    }

    if (!formData.category) {
      setError('Veuillez choisir une catégorie')
      return
    }

    setLoading(true)
    setError('')

    try {
      if (token) api.setToken(token)
      
      const response = await api.createShop({
        name: formData.name,
        description: formData.description || undefined,
        category: formData.category
      })
      
      if (response.data) {
        router.push(`/seller/dashboard/${response.data.slug}`)
      } else {
        setError(response.error || 'Erreur de création')
      }
    } catch (err: any) {
      setError(err.message || 'Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Créer votre boutique</h1>
          <p className="text-gray-600 mt-2">
            Donnez vie à votre projet e-commerce en quelques minutes
          </p>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom de la boutique *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="ex: TechZone, FashionStyle, Artisan Créatif..."
                required
                minLength={3}
                maxLength={100}
              />
              <p className="mt-2 text-sm text-gray-500">
                3 à 100 caractères. Ce nom sera visible par vos clients.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Catégorie principale *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                {SHOP_CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-sm text-gray-500">
                Aide vos clients à trouver votre boutique
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Décrivez ce que vous vendez, votre philosophie, votre histoire..."
                rows={4}
                maxLength={500}
              />
              <p className="mt-2 text-sm text-gray-500">
                Optionnel - 500 caractères maximum. Apparaîtra sur la page d'accueil de votre boutique.
              </p>
            </div>

            {/* ✅ SECTION DES CONDITIONS - CORRIGÉE ET BIEN PLACÉE */}
            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-start space-x-3">
                <div className="flex items-center h-5">
                  <input
                    id="terms"
                    name="terms"
                    type="checkbox"
                    required
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="terms" className="font-medium text-gray-700">
                    J'accepte les conditions *
                  </label>
                  <p className="text-gray-500 mt-1">
                    En créant une boutique, vous acceptez nos{' '}
                    <Link href="/legal/cgu" className="text-blue-600 hover:text-blue-800 hover:underline">
                      Conditions Générales d'Utilisation
                    </Link>{' '}
                    et notre{' '}
                    <Link href="/legal/confidentialite" className="text-blue-600 hover:text-blue-800 hover:underline">
                      Politique de Confidentialité
                    </Link>{' '}
                    en tant que Vendeur.
                  </p>
                </div>
              </div>
            </div>

            {/* BOUTONS */}
            <div className="flex space-x-4 pt-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading || !formData.name.trim() || !formData.category}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Création en cours...
                  </span>
                ) : (
                  'Créer la boutique'
                )}
              </button>
            </div>
          </form>

          <div className="mt-8 pt-8 border-t border-gray-200">
            <h3 className="font-medium text-gray-900 mb-3">💡 Conseils pour réussir</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <strong>Choisissez bien votre catégorie</strong> : Cela aide les clients à vous trouver
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <strong>Un nom mémorable</strong> : Simple, évocateur et facile à retenir
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <strong>Description engageante</strong> : Racontez votre histoire, vos valeurs
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <strong>Vous pourrez modifier tout cela plus tard</strong> dans les paramètres
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
