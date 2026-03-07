import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Conditions Générales d\'Utilisation - ShopTonik',
  description: 'Conditions générales d\'utilisation de la plateforme ShopTonik pour les acheteurs et les vendeurs',
}

export default function CGUPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Conditions Générales d'Utilisation
          </h1>
          <p className="text-gray-600">
            Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8 space-y-8">
          
          {/* Préambule */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Préambule</h2>
            <p className="text-gray-700 leading-relaxed">
              Les présentes conditions générales d'utilisation (CGU) régissent l'accès et l'utilisation 
              de la plateforme ShopTonik, accessible via le site web shoptonik.com et ses applications mobiles. 
              En utilisant nos services, vous acceptez pleinement et sans réserve les présentes CGU.
            </p>
          </section>

          {/* Définitions */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Définitions</h2>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>Plateforme :</strong> Le site web et les applications mobiles ShopTonik.</li>
              <li><strong>Utilisateur :</strong> Toute personne utilisant la Plateforme.</li>
              <li><strong>Acheteur :</strong> Utilisateur qui achète des produits sur la Plateforme.</li>
              <li><strong>Vendeur :</strong> Utilisateur qui vend des produits sur la Plateforme.</li>
              <li><strong>Boutique :</strong> Espace dédié à un Vendeur sur la Plateforme.</li>
              <li><strong>Produit :</strong> Bien ou service proposé à la vente par un Vendeur.</li>
            </ul>
          </section>

          {/* Acceptation */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Acceptation des CGU</h2>
            <p className="text-gray-700 leading-relaxed">
              L'utilisation de la Plateforme implique l'acceptation pleine et entière des présentes CGU. 
              Cette acceptation est matérialisée par une case à cocher lors de la création d'un compte. 
              L'Utilisateur reconnaît en avoir pris connaissance et les accepter sans réserve.
            </p>
          </section>

          {/* Inscription et compte */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Inscription et compte utilisateur</h2>
            <p className="text-gray-700 mb-2">Pour utiliser nos services, vous devez créer un compte en fournissant :</p>
            <ul className="list-disc pl-6 mb-2 space-y-1 text-gray-700">
              <li>Une adresse email valide</li>
              <li>Un nom d'utilisateur</li>
              <li>Un mot de passe sécurisé</li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              Vous êtes responsable de la confidentialité de vos identifiants. Toute activité réalisée depuis 
              votre compte est réputée émaner de votre personne. En cas de perte ou vol, vous devez en informer 
              immédiatement ShopTonik.
            </p>
          </section>

          {/* Utilisation de la Plateforme */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Utilisation de la Plateforme</h2>
            <p className="text-gray-700 mb-2">En tant qu'Utilisateur, vous vous engagez à :</p>
            <ul className="list-disc pl-6 mb-4 space-y-1 text-gray-700">
              <li>Fournir des informations exactes et à jour</li>
              <li>Ne pas usurper l'identité d'un tiers</li>
              <li>Ne pas perturber le fonctionnement de la Plateforme</li>
              <li>Respecter les droits de propriété intellectuelle</li>
              <li>Ne pas diffuser de contenu illicite ou inapproprié</li>
            </ul>
          </section>

          {/* Vendeurs */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Dispositions spécifiques aux Vendeurs</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">6.1 Création d'une Boutique</h3>
                <p className="text-gray-700">
                  Tout Utilisateur peut devenir Vendeur en créant une Boutique. Il s'engage à fournir 
                  des informations exactes sur son identité et son activité.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-2">6.2 Obligations du Vendeur</h3>
                <ul className="list-disc pl-6 space-y-1 text-gray-700">
                  <li>Garantir que les Produits sont conformes à la description</li>
                  <li>Respecter les délais de livraison annoncés</li>
                  <li>Gérer le stock de façon sincère</li>
                  <li>Répondre aux questions des Acheteurs dans un délai raisonnable</li>
                  <li>Se conformer à la législation en vigueur</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-2">6.3 Produits interdits</h3>
                <p className="text-gray-700">Sont notamment interdits :</p>
                <ul className="list-disc pl-6 space-y-1 text-gray-700">
                  <li>Les produits contrefaits</li>
                  <li>Les armes et munitions</li>
                  <li>Les produits illicites ou réglementés</li>
                  <li>Les contenus violents ou haineux</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Transactions et paiements */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Transactions et paiements</h2>
            <p className="text-gray-700 mb-2">
              Les transactions entre Acheteurs et Vendeurs sont sécurisées via notre partenaire de paiement.
            </p>
            <ul className="list-disc pl-6 space-y-1 text-gray-700">
              <li>Les prix sont affichés en Euros (€) toutes taxes comprises</li>
              <li>Le paiement est dû à la commande</li>
              <li>ShopTonik perçoit une commission sur chaque vente</li>
              <li>Les Vendeurs reçoivent leurs fonds après validation de la commande</li>
            </ul>
          </section>

          {/* Livraison */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Livraison</h2>
            <p className="text-gray-700 mb-2">
              Les modalités de livraison sont définies par chaque Vendeur. Le Vendeur s'engage à :
            </p>
            <ul className="list-disc pl-6 space-y-1 text-gray-700">
              <li>Indiquer clairement les délais et frais de livraison</li>
              <li>Assurer un suivi de la commande</li>
              <li>Garantir l'emballage adapté des produits</li>
            </ul>
          </section>

          {/* Retours et remboursements */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Retours et remboursements</h2>
            <p className="text-gray-700 mb-2">
              Conformément à la législation, l'Acheteur dispose d'un délai de rétractation de 14 jours 
              pour les produits physiques (hors exceptions légales).
            </p>
            <p className="text-gray-700">
              En cas de produit non conforme ou endommagé, l'Acheteur peut demander un remboursement ou un échange.
            </p>
          </section>

          {/* Propriété intellectuelle */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Propriété intellectuelle</h2>
            <p className="text-gray-700 mb-2">
              ShopTonik est propriétaire des éléments de la Plateforme (design, code, base de données). 
              Les Vendeurs conservent la propriété de leurs contenus (descriptions, images) mais accordent 
              à ShopTonik une licence d'utilisation pour le fonctionnement de la Plateforme.
            </p>
          </section>

          {/* Responsabilité */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">11. Responsabilité</h2>
            <p className="text-gray-700 mb-2">
              ShopTonik agit comme intermédiaire entre Acheteurs et Vendeurs. Notre responsabilité ne peut 
              être engagée pour :
            </p>
            <ul className="list-disc pl-6 space-y-1 text-gray-700">
              <li>Les actes des Vendeurs</li>
              <li>Les défauts des produits</li>
              <li>Les litiges entre Utilisateurs</li>
              <li>Les interruptions temporaires du service</li>
            </ul>
          </section>

          {/* Suspension et résiliation */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">12. Suspension et résiliation</h2>
            <p className="text-gray-700 mb-2">
              ShopTonik peut suspendre ou résilier un compte en cas de :
            </p>
            <ul className="list-disc pl-6 space-y-1 text-gray-700">
              <li>Violation des CGU</li>
              <li>Activité frauduleuse</li>
              <li>Inactivité prolongée</li>
              <li>Demande de l'Utilisateur</li>
            </ul>
          </section>

          {/* Modifications */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">13. Modifications des CGU</h2>
            <p className="text-gray-700 leading-relaxed">
              ShopTonik se réserve le droit de modifier les CGU à tout moment. Les Utilisateurs seront 
              informés des modifications substantielles. L'utilisation continue de la Plateforme après 
              modification vaut acceptation.
            </p>
          </section>

          {/* Loi applicable */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">14. Loi applicable</h2>
            <p className="text-gray-700 leading-relaxed">
              Les présentes CGU sont soumises au droit français. En cas de litige, les tribunaux français 
              seront seuls compétents.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">15. Contact</h2>
            <p className="text-gray-700 leading-relaxed">
              Pour toute question relative aux CGU, vous pouvez nous contacter à :{' '}
              <a href="mailto:contact@bittonik.com" className="text-blue-600 hover:underline">
                legal@bittonik.com
              </a>
            </p>
          </section>

          <div className="border-t pt-6 text-center text-sm text-gray-500">
            <p>© {new Date().getFullYear()} ShopTonik. Tous droits réservés.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
