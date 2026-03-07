import stripe
import logging
from typing import Optional, Dict, Any, Tuple
from app.core.config import settings

logger = logging.getLogger(__name__)

class StripeService:
    def __init__(self):
        stripe.api_key = settings.stripe_secret_key
        self.webhook_secret = settings.stripe_webhook_secret or ''
    
    async def create_payment_intent(
        self,
        amount: float,
        currency: str = "eur",
        order_id: Optional[str] = None,
        customer_email: Optional[str] = None,
        metadata: Optional[Dict] = None
    ) -> Tuple[bool, Dict[str, Any]]:
        """Crée une intention de paiement Stripe"""
        try:
            amount_in_cents = int(amount * 100)
            
            if metadata is None:
                metadata = {}
            if order_id:
                metadata["order_id"] = order_id
            
            intent = stripe.PaymentIntent.create(
                amount=amount_in_cents,
                currency=currency,
                receipt_email=customer_email,
                metadata=metadata,
                automatic_payment_methods={"enabled": True},
            )
            
            return True, {
                "client_secret": intent.client_secret,
                "payment_intent_id": intent.id,
                "amount": amount,
                "currency": currency,
                "status": intent.status
            }
            
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error: {str(e)}")
            return False, {"error": str(e)}

            