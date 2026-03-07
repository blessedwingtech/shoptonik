# backend/app/api/v1/webhooks/stripe.py - VERSION CORRIGÉE
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from datetime import datetime
import stripe

from app.core.config import settings
from app.core.database import get_db
from app.models.transaction import Transaction
from app.models.wallet import SellerWallet

router = APIRouter(prefix="/webhooks", tags=["webhooks"])

@router.post("/stripe")
async def stripe_webhook(
    request: Request,
    db: Session = Depends(get_db)
):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.stripe_webhook_secret
        )
        print(f"✅ Webhook reçu: {event.type}")  # ← LOG POUR DEBUG
    except ValueError:
        raise HTTPException(400, "Invalid payload")
    except stripe.error.SignatureVerificationError:
        raise HTTPException(400, "Invalid signature")

    if event.type == "payment_intent.succeeded":
        payment_intent = event.data.object
        print(f"💰 PaymentIntent réussi: {payment_intent.id}")  # ← LOG

        # Récupérer la transaction
        transaction = db.query(Transaction).filter(
            Transaction.provider_payment_id == payment_intent.id
        ).first()

        if transaction:
            print(f"✅ Transaction trouvée: {transaction.id}")  # ← LOG
            print(f"👤 Seller ID: {transaction.seller_id}")  # ← LOG
            print(f"💰 Montant vendeur: {transaction.seller_amount}")  # ← LOG

            transaction.payment_status = "completed"
            transaction.transaction_status = "paid"
            transaction.paid_at = datetime.utcnow()

            # Mettre à jour le wallet du vendeur
            wallet = db.query(SellerWallet).filter(
                SellerWallet.seller_id == transaction.seller_id
            ).first()

            if wallet:
                print(f"💰 Wallet trouvé, ancien pending: {wallet.pending_balance}")  # ← LOG
                wallet.pending_balance += transaction.seller_amount
                wallet.total_earned += transaction.seller_amount
                print(f"💰 Nouveau pending: {wallet.pending_balance}")  # ← LOG
            else:
                print(f"⚠️ Wallet non trouvé pour seller {transaction.seller_id}")  # ← LOG

            db.commit()
            print(f"✅ Transaction {transaction.id} mise à jour avec succès")  # ← LOG
        else:
            print(f"❌ Transaction non trouvée pour payment_intent {payment_intent.id}")  # ← LOG

    return {"status": "success"}
