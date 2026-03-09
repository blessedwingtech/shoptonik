// apps/web/app/become-seller/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/app/contexts/AuthContext'
import { api } from '@/app/lib/api'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function BecomeSellerPage() {
  const { user, updateUser } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [requestStatus, setRequestStatus] = useState<'none' | 'pending' | 'approved'>('none')
  
  const [formData, setFormData] = useState({
    company_name: '',
    vat_number: '',
    address: '',
    phone: ''
  })

  useEffect(() => {
    checkRequestStatus()
  }, [])

  const checkRequestStatus = async () => {
    try {
      const response = await api.getSellerRequestStatus()
      if (response.data) {
        setRequestStatus(response.data.status)
      }
    } catch (err) {
      console.error('Erreur vérification statut:', err)
    }
  }

  // Si déjà vendeur, rediriger
  if (user?.is_seller) {
    router.push('/seller/dashboard')
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      // const response = await api.request('/seller/request', {
      //   method: 'POST',
      //   body: JSON.stringify(formData)
      // })
      const response = await api.submitSellerRequest(formData)

      if (response.data) {
        setSuccess('✅ Demande envoyée avec succès ! Un administrateur va l\'examiner.')
        setRequestStatus('pending')
      } else {
        setError(response.error || 'Erreur lors de la demande')
      }
    } catch (err: any) {
      setError(err.message || 'Erreur de connexion')
    } finally {
      setIsLoading(false)
    }
  }

  if (requestStatus === 'pending') {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-yellow-500 px-6 py-8 text-center">
              <div className="text-5xl mb-4">⏳</div>
              <h1 className="text-2xl font-bold text-white mb-2">
                Demande en cours
              </h1>
              <p className="text-yellow-100">
                Votre demande est en cours d'examen par nos équipes
              </p>
            </div>
            
            <div className="p-6 text-center">
              <p className="text-gray-600 mb-6">
                Vous serez notifié par email dès que votre demande sera traitée.
                Cela peut prendre jusqu'à 48h ouvrées.
              </p>
              
              <Link
                href="/profile"
                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Retour au profil
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* En-tête */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-8 text-center">
            <div className="text-5xl mb-4">👑</div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Devenir vendeur
            </h1>
            <p className="text-blue-100">
              Lancez votre boutique et commencez à vendre
            </p>
          </div>

          {/* Messages */}
          {error && (
            <div className="mx-6 mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700">{error}</p>
            </div>
          )}
          
          {success && (
            <div className="mx-6 mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700">{success}</p>
            </div>
          )}

          {/* Formulaire */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-800 mb-2">Processus d'approbation :</h3>
              <ul className="space-y-2 text-sm text-blue-700">
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">1️⃣</span>
                  Vous remplissez ce formulaire de demande
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">2️⃣</span>
                  Un administrateur examine votre demande (48h max)
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">3️⃣</span>
                  Vous recevez une notification par email
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">4️⃣</span>
                  Vous pouvez créer votre/vos boutique(s)
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom de votre entreprise
                </label>
                <input
                  type="text"
                  value={formData.company_name}
                  onChange={(e) => setFormData({...formData, company_name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Ma Super Boutique"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Numéro de TVA
                </label>
                <input
                  type="text"
                  value={formData.vat_number}
                  onChange={(e) => setFormData({...formData, vat_number: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="FR12345678901"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adresse professionnelle
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Adresse de votre entreprise"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="+33 6 12 34 56 78"
                  required
                />
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <p className="text-sm text-gray-500 mb-4">
                En devenant vendeur, vous acceptez nos conditions générales de vente et vous vous engagez à fournir des informations exactes.
              </p>
              
              <div className="flex space-x-4">
                <Link
                  href="/profile"
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-center"
                >
                  Annuler
                </Link>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50"
                >
                  {isLoading ? 'Envoi...' : 'Envoyer la demande'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}