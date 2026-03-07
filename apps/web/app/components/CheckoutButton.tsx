// apps/web/app/components/CheckoutButton.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/contexts/AuthContext'
import { api } from '@/app/lib/api'

interface CheckoutButtonProps {
  shopSlug: string
  className?: string
  disabled?: boolean
  children?: React.ReactNode
}

const getCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
};

export default function CheckoutButton({ 
  shopSlug, 
  className = "",
  disabled = false,
  children = 'Passer la commande'
}: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const { isAuthenticated, user } = useAuth()
  const router = useRouter()

  const handleCheckout = async () => {
    if (loading || disabled) return
    
    console.log(`🛒 [CheckoutButton] Début checkout pour: ${shopSlug}`);
    setLoading(true);
    
    try {
      const response = await api.initiateCheckout(shopSlug);
      console.log(`📥 [CheckoutButton] Réponse:`, response);
      
      if (response.data) {
        if (response.data.requires_login) {
          // Sauvegarder l'intention de checkout
          localStorage.setItem('checkout_intent', JSON.stringify({
            shopSlug,
            timestamp: Date.now(),
            cart_summary: response.data.cart_summary
          }));
          
          // Sauvegarder le session_id pour la fusion
          if (response.data.guest_session_id) {
            localStorage.setItem('guest_cart_session', response.data.guest_session_id);
          }
          
          // Afficher modal
          setShowLoginModal(true);
        } else {
          // Utilisateur connecté - rediriger vers checkout
          console.log(`✅ [CheckoutButton] Utilisateur connecté, redirection vers checkout`);
          router.push(`/checkout?shop=${shopSlug}`);
        }
      } else {
        console.error(`❌ [CheckoutButton] Erreur:`, response.error);
        alert(response.error || 'Erreur lors de la préparation du checkout');
      }
    } catch (error: any) {
      console.error('❌ [CheckoutButton] Exception:', error);
      alert('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  }

 
const handleLoginRedirect = () => {
  console.log(`🔐 [CheckoutButton] Redirection vers login`);
  
  // Lire le cookie de session directement
  const sessionId = getCookie('cart_session_id');
  console.log(`🍪 [CheckoutButton] Session ID du cookie: ${sessionId}`);
  
  // Sauvegarder pour la fusion
  if (sessionId) {
    localStorage.setItem('guest_cart_session', sessionId);
  }
  
  // Sauvegarder l'intention de checkout
  localStorage.setItem('checkout_intent', JSON.stringify({
    shopSlug,
    timestamp: Date.now(),
    sessionId: sessionId,
    mergeCart: true
  }));
  
  router.push(`/auth/login?redirect=/checkout?shop=${shopSlug}&merge_cart=true`);
  setShowLoginModal(false);
};

  const handleContinueAsGuest = () => {
    console.log(`👤 [CheckoutButton] Continuer en tant qu'invité`);
    router.push(`/checkout?shop=${shopSlug}`);
    setShowLoginModal(false);
  }

  const handleCancel = () => {
    // Nettoyer les données temporaires
    localStorage.removeItem('checkout_intent');
    localStorage.removeItem('guest_cart_session');
    setShowLoginModal(false);
  }

  return (
    <>
      <button
        onClick={handleCheckout}
        disabled={loading || disabled}
        className={`px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors ${className}`}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            Préparation...
          </span>
        ) : (
          children
        )}
      </button>

      {/* Modal de connexion */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center text-blue-600 text-2xl mx-auto mb-4">
                🔒
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Connexion requise
              </h3>
              <p className="text-gray-600 mb-4">
                Connectez-vous pour finaliser votre commande et bénéficier de votre historique d'achats.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                <p className="font-medium mb-1">🎁 Avantages de la connexion :</p>
                <ul className="text-left space-y-1">
                  <li>• Suivi de vos commandes</li>
                  <li>• Historique d'achats</li>
                  <li>• Paiements plus rapides</li>
                  <li>• Offres spéciales</li>
                </ul>
              </div>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={handleLoginRedirect}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <span>👤</span>
                Se connecter / S'inscrire
              </button>
              
              <button
                onClick={handleContinueAsGuest}
                className="w-full py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 hover:border-gray-400 transition-all flex items-center justify-center gap-2"
              >
                <span>🚀</span>
                Continuer sans compte
              </button>
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={handleCancel}
                className="w-full text-center text-gray-500 hover:text-gray-700 text-sm"
              >
                Retour au panier
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
