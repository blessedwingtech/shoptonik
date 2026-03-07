// apps/web/app/lib/constants.ts
export const PAYMENT_MESSAGES = {
  INIT: "Préparation du paiement sécurisé...",
  PROCESSING: "Traitement en cours...",
  SUCCESS: "Paiement réussi ! Redirection...",
  ERROR: {
    CARD_DECLINED: "Votre carte a été refusée. Vérifiez vos informations.",
    INSUFFICIENT_FUNDS: "Fonds insuffisants",
    EXPIRED_CARD: "Carte expirée",
    INVALID_CVC: "Code de sécurité invalide",
    CONNECTION: "Problème de connexion. Réessayez.",
    GENERIC: "Une erreur est survenue"
  }
}
