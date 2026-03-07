import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Politique de Confidentialité - ShopTonik',
  description: 'Découvrez comment ShopTonik collecte, utilise et protège vos données personnelles',
}

export default function ConfidentialitePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Politique de Confidentialité
          </h1>
          <p className="text-gray-600">
            Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8 space-y-8">
          
          {/* Introduction */}
          <section>
            <p className="text-gray-700 leading-relaxed">
              Chez ShopTonik, nous accordons une importance capitale à la protection de vos données personnelles. 
              La présente politique de confidentialité vous informe de la manière dont nous collectons, utilisons 
              et protégeons vos informations lorsque vous utilisez notre plateforme.
            </p>
          </section>

          {/* Responsable du traitement */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Responsable du traitement</h2>
            <p className="text-gray-700 leading-relaxed">
              Le responsable du traitement des données est ShopTonik, dont le siège social est situé à [<a href='https://bwt.bittonik.com/contact'>adresse</a>]. 
              Pour toute question relative à vos données, vous pouvez nous contacter à :{' '}
              <a href="mailto:privacy@shoptonik.com" className="text-blue-600 hover:underline">
                privacy@shoptonik.com
              </a>
            </p>
          </section>

          {/* Données collectées */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Données que nous collectons</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">2.1 Données d'inscription</h3>
                <ul className="list-disc pl-6 text-gray-700">
                  <li>Email</li>
                  <li>Nom d'utilisateur</li>
                  <li>Nom complet (optionnel)</li>
                  <li>Mot de passe (chiffré)</li>
                </ul>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-2">2.2 Données de profil</h3>
                <ul className="list-disc pl-6 text-gray-700">
                  <li>Photo de profil (avatar)</li>
                  <li>Numéro de téléphone</li>
                  <li>Adresse (livraison/facturation)</li>
                  <li>Préférences</li>
                </ul>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-2">2.3 Données de navigation</h3>
                <ul className="list-disc pl-6 text-gray-700">
                  <li>Adresse IP</li>
                  <li>Type de navigateur</li>
                  <li>Pages visitées</li>
                  <li>Durée des sessions</li>
                  <li>Cookies</li>
                </ul>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-2">2.4 Données de transaction</h3>
                <ul className="list-disc pl-6 text-gray-700">
                  <li>Historique des commandes</li>
                  <li>Méthodes de paiement (via prestataire)</li>
                  <li>Adresses de livraison</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Finalités du traitement */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Finalités du traitement</h2>
            <p className="text-gray-700 mb-2">Vos données sont utilisées pour :</p>
            <ul className="list-disc pl-6 space-y-1 text-gray-700">
              <li>Gérer votre compte et vous identifier</li>
              <li>Traiter vos commandes et paiements</li>
              <li>Assurer la livraison des produits</li>
              <li>Améliorer et personnaliser votre expérience</li>
              <li>Communiquer avec vous (notifications, service client)</li>
              <li>Prévenir la fraude et sécuriser la plateforme</li>
              <li>Respecter nos obligations légales</li>
            </ul>
          </section>

          {/* Base légale */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Base légale du traitement</h2>
            <p className="text-gray-700 mb-2">Le traitement de vos données repose sur :</p>
            <ul className="list-disc pl-6 space-y-1 text-gray-700">
              <li>L'exécution du contrat (utilisation de la plateforme, achats)</li>
              <li>Votre consentement (cookies, communications marketing)</li>
              <li>Nos obligations légales (facturation, lutte contre la fraude)</li>
              <li>Notre intérêt légitime (amélioration des services)</li>
            </ul>
          </section>

          {/* Destinataires */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Destinataires des données</h2>
            <p className="text-gray-700 mb-2">Vos données peuvent être partagées avec :</p>
            <ul className="list-disc pl-6 space-y-1 text-gray-700">
              <li><strong>Les Vendeurs :</strong> pour le traitement des commandes</li>
              <li><strong>Les prestataires techniques :</strong> hébergement, paiement, livraison</li>
              <li><strong>Les autorités :</strong> sur requête légale</li>
            </ul>
          </section>

          {/* Transferts hors UE */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Transferts hors UE</h2>
            <p className="text-gray-700 leading-relaxed">
              Certains de nos prestataires peuvent être situés hors de l'Union Européenne. Dans ce cas, 
              nous nous assurons que des garanties appropriées sont mises en place (clauses contractuelles types, 
              Privacy Shield, etc.).
            </p>
          </section>

          {/* Durée de conservation */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Durée de conservation</h2>
            <p className="text-gray-700 mb-2">Vos données sont conservées :</p>
            <ul className="list-disc pl-6 space-y-1 text-gray-700">
              <li><strong>Compte actif :</strong> toute la durée de l'utilisation</li>
              <li><strong>Données de transaction :</strong> 10 ans (obligation légale)</li>
              <li><strong>Cookies :</strong> 13 mois maximum</li>
              <li><strong>Logs techniques :</strong> 6 mois</li>
            </ul>
          </section>

          {/* Vos droits */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Vos droits (RGPD)</h2>
            <p className="text-gray-700 mb-2">Conformément au RGPD, vous disposez des droits suivants :</p>
            <ul className="list-disc pl-6 space-y-1 text-gray-700">
              <li><strong>Droit d'accès :</strong> obtenir une copie de vos données</li>
              <li><strong>Droit de rectification :</strong> corriger vos données</li>
              <li><strong>Droit à l'effacement :</strong> demander la suppression</li>
              <li><strong>Droit à la limitation :</strong> restreindre le traitement</li>
              <li><strong>Droit à la portabilité :</strong> récupérer vos données</li>
              <li><strong>Droit d'opposition :</strong> vous opposer au traitement</li>
              <li><strong>Retrait du consentement :</strong> à tout moment</li>
            </ul>
            <p className="text-gray-700 mt-4">
              Pour exercer vos droits, contactez-nous à{' '}
              <a href="mailto:privacy@shoptonik.com" className="text-blue-600 hover:underline">
                privacy@shoptonik.com
              </a>
              . Vous avez également le droit d'introduire une réclamation auprès de la CNIL.
            </p>
          </section>
          // Section "8. Vos droits (RGPD et autres juridictions)"
<section>
  <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Vos droits selon votre localisation</h2>
  
  <div className="space-y-4">
    <div>
      <h3 className="font-medium text-gray-900">🌍 Pour les résidents de l'Union Européenne (RGPD)</h3>
      <p className="text-gray-700">Vous disposez des droits d'accès, rectification, effacement, limitation, portabilité et opposition.</p>
    </div>
    
    <div>
      <h3 className="font-medium text-gray-900">🇺🇸 Pour les résidents des États-Unis (CCPA/CPRA)</h3>
      <p className="text-gray-700">Vous avez le droit de savoir quelles données sont collectées, de demander leur suppression et de refuser la vente de vos données.</p>
    </div>
    
    <div>
      <h3 className="font-medium text-gray-900">🇧🇷 Pour les résidents du Brésil (LGPD)</h3>
      <p className="text-gray-700">Vous disposez de droits similaires au RGPD, incluant la confirmation de l'existence du traitement et l'accès aux données.</p>
    </div>
    
    <div>
      <h3 className="font-medium text-gray-900">🇭🇹 Pour les résidents d'Haïti</h3>
      <p className="text-gray-700">Nous nous engageons à protéger vos données conformément aux standards internationaux et à la loi haïtienne sur la protection des données.</p>
    </div>
    
    <p className="text-gray-700 mt-4">
      Pour exercer vos droits, quel que soit votre pays, contactez-nous à{' '}
      <a href="mailto:privacy@shoptonik.com" className="text-blue-600 hover:underline">privacy@shoptonik.com</a>.
      Nous traiterons votre demande dans les délais légaux applicables à votre région.
    </p>
  </div>
</section>

          {/* Sécurité */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Sécurité</h2>
            <p className="text-gray-700 leading-relaxed">
              Nous mettons en œuvre toutes les mesures techniques et organisationnelles appropriées pour 
              garantir la sécurité de vos données : chiffrement, accès restreint, audits réguliers, etc.
            </p>
          </section>

          {/* Cookies */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Cookies</h2>
            <p className="text-gray-700 leading-relaxed">
              Nous utilisons des cookies pour améliorer votre expérience, analyser le trafic et personnaliser 
              le contenu. Vous pouvez gérer vos préférences de cookies dans les paramètres de votre navigateur.
            </p>
          </section>

          {/* Mineurs */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">11. Protection des mineurs</h2>
            <p className="text-gray-700 leading-relaxed">
              Nos services ne sont pas destinés aux personnes de moins de 16 ans. Nous ne collectons pas 
              sciemment de données de mineurs sans consentement parental.
            </p>
          </section>

          {/* Modifications */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">12. Modifications</h2>
            <p className="text-gray-700 leading-relaxed">
              Nous pouvons modifier cette politique de confidentialité. La version actualisée sera publiée 
              sur cette page avec la date de mise à jour.
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

