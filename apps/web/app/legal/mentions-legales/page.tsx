import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Mentions Légales - ShopTonik',
  description: 'Mentions légales de la plateforme ShopTonik',
}

export default function MentionsLegalesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Mentions Légales
          </h1>
          <p className="text-gray-600">
            Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8 space-y-8">
          
          {/* Éditeur */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Éditeur de la Plateforme</h2>
            <div className="space-y-1 text-gray-700">
              <p><strong>Raison sociale :</strong> ShopTonik</p>
              <p><strong>Forme juridique :</strong> [SARL/SAS/...]</p>
              <p><strong>Capital social :</strong> [montant] €</p>
              <p><strong>Siège social :</strong> [Adresse complète]</p>
              <p><strong>Numéro SIREN :</strong> [numéro]</p>
              <p><strong>Numéro de TVA intracommunautaire :</strong> [numéro]</p>
              <p><strong>Directeur de la publication :</strong> [Nom du responsable]</p>
              <p><strong>Email :</strong> <a href="mailto:contact@shoptonik.com" className="text-blue-600 hover:underline">contact@shoptonik.com</a></p>
              <p><strong>Téléphone :</strong> [numéro]</p>
            </div>
          </section>

          {/* Hébergement */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Hébergement</h2>
            <div className="space-y-1 text-gray-700">
              <p><strong>Hébergeur :</strong> [Nom de l'hébergeur]</p>
              <p><strong>Adresse :</strong> [Adresse de l'hébergeur]</p>
              <p><strong>Téléphone :</strong> [Téléphone de l'hébergeur]</p>
              <p><strong>Site web :</strong> <a href="https://..." className="text-blue-600 hover:underline" target="_blank">[URL]</a></p>
            </div>
          </section>

          {/* Propriété intellectuelle */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Propriété intellectuelle</h2>
            <p className="text-gray-700 leading-relaxed">
              L'ensemble des éléments composant le site ShopTonik (textes, graphismes, logo, icônes, 
              sons, logiciels) sont la propriété exclusive de ShopTonik ou de ses partenaires. 
              Toute reproduction, distribution, modification, adaptation, retransmission ou publication, 
              même partielle, de ces différents éléments est strictement interdite sans l'accord exprès 
              par écrit de ShopTonik.
            </p>
          </section>

          {/* Données personnelles */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Données personnelles</h2>
            <p className="text-gray-700 leading-relaxed">
              La plateforme ShopTonik collecte et traite des données personnelles conformément à sa 
              <Link href="/legal/confidentialite" className="text-blue-600 hover:underline mx-1">
                Politique de Confidentialité
              </Link>
              . Conformément au RGPD, vous disposez de droits sur vos données.
            </p>
          </section>

          {/* Cookies */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Cookies</h2>
            <p className="text-gray-700 leading-relaxed">
              La navigation sur la plateforme est susceptible de provoquer l'installation de cookies. 
              Vous pouvez vous opposer à l'enregistrement de ces cookies en configurant votre navigateur.
            </p>
          </section>

          {/* Limitation de responsabilité */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Limitation de responsabilité</h2>
            <p className="text-gray-700 leading-relaxed">
              ShopTonik ne saurait être tenu responsable des dommages directs ou indirects causés au 
              matériel de l'utilisateur, lors de l'accès au site, et résultant soit de l'utilisation 
              d'un matériel ne répondant pas aux spécifications indiquées, soit de l'apparition d'un bug 
              ou d'une incompatibilité.
            </p>
          </section>

          {/* Droit applicable */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Droit applicable</h2>
            <p className="text-gray-700 leading-relaxed">
              Les présentes mentions légales sont soumises au droit français. En cas de litige, 
              les tribunaux français seront seuls compétents.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Contact</h2>
            <p className="text-gray-700 leading-relaxed">
              Pour toute question concernant les mentions légales, vous pouvez nous contacter :<br />
              Email : <a href="mailto:legal@shoptonik.com" className="text-blue-600 hover:underline">legal@shoptonik.com</a><br />
              Adresse : [Adresse postale]
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
