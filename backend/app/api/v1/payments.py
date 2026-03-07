from datetime import datetime

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request
import stripe
from sqlalchemy.orm import Session
from typing import Optional
import logging

from app.core.database import get_db
from app.dependencies import get_current_user
from app.models import User, Order, Shop
from app.services.payment_service import PaymentService
from app.core.config import settings

router = APIRouter(prefix="/payments", tags=["payments"])
logger = logging.getLogger(__name__)
payment_service = PaymentService()

# backend/app/api/v1/payments.py - MODIFIEZ create-payment-intent

@router.post("/create-payment-intent")
async def create_payment_intent(
    request: dict,
    current_user: Optional[User] = Depends(get_current_user)
):
    """
    Crée une intention de paiement Stripe
    """
    amount = request.get("amount")
    order_id = request.get("order_id")  # ← Important
    shop_id = request.get("shop_id")

    if not amount or amount <= 0:
        raise HTTPException(400, "Montant invalide")

    # Utiliser votre PaymentService existant
    success, result = await payment_service._process_stripe_payment(
        amount=amount,
        currency="eur",
        customer=current_user,
        order_id=order_id,  # ← Passer l'order_id
        metadata={
            "order_id": order_id,
            "shop_id": shop_id,
            "user_id": current_user.id if current_user else None
        }
    )

    if not success:
        raise HTTPException(400, result.get("error", "Erreur de paiement"))

    # 🔥 LIER LE PAYMENT_INTENT À LA COMMANDE
    if success and result.get("payment_intent_id"):
        # Mettre à jour la commande avec le payment_intent_id
        from app.models import Order
        db = next(get_db())  # Obtenir une session
        order = db.query(Order).filter(Order.id == order_id).first()
        if order:
            order.payment_id = result["payment_intent_id"]
            db.commit()
        db.close()

    return result

# @router.post("/create-payment-intent")
# async def create_payment_intent(
#     request: dict,
#     current_user: Optional[User] = Depends(get_current_user)
# ):
#     """
#     Crée une intention de paiement Stripe
#     """
#     amount = request.get("amount") 
#     order_id = request.get("order_id")
#     shop_id = request.get("shop_id")
    
#     if not amount or amount <= 0:
#         raise HTTPException(400, "Montant invalide")
     
    
#     # Utiliser votre PaymentService existant
#     success, result = await payment_service._process_stripe_payment(
#         amount=amount,
#         currency="eur",
#         customer=current_user,
#         order_id=order_id
#     )
    
#     if not success:
#         raise HTTPException(400, result.get("error", "Erreur de paiement"))
    
#     return result

@router.post("/confirm-payment")
async def confirm_payment(
    request: dict
):
    """
    Confirme un paiement (pour 3D Secure)
    """
    payment_intent_id = request.get("payment_intent_id")
    
    if not payment_intent_id:
        raise HTTPException(400, "payment_intent_id requis")
    
    try:
        intent = stripe.PaymentIntent.retrieve(payment_intent_id)
        
        return {
            "payment_intent_id": intent.id,
            "status": intent.status,
            "client_secret": intent.client_secret if intent.status == "requires_action" else None
        }
    except stripe.error.StripeError as e:
        raise HTTPException(400, str(e))

@router.post("/webhook")
async def stripe_webhook(
    request: Request
):
    """
    Webhook pour les événements Stripe
    """
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    
    if not sig_header:
        raise HTTPException(400, "Signature manquante")
    
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.stripe_webhook_secret or ''
        )
        
        # Traiter l'événement
        if event.type == 'payment_intent.succeeded':
            payment_intent = event.data.object
            logger.info(f"Paiement réussi: {payment_intent.id}")
            # Mettre à jour votre base de données ici
            
        elif event.type == 'payment_intent.payment_failed':
            payment_intent = event.data.object
            logger.error(f"Paiement échoué: {payment_intent.id}")
        
        return {"status": "success", "event": event.type}
        
    except ValueError as e:
        raise HTTPException(400, str(e))
    except stripe.error.SignatureVerificationError as e:
        raise HTTPException(400, "Signature invalide")

 
@router.post("/create-moncash-payment")
async def create_moncash_payment(
    request: dict,
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)  # ← AJOUTEZ db
):
    """
    Crée un paiement MonCash et retourne l'URL de redirection
    """
    try:
        amount = request.get("amount")
        order_id = request.get("order_id")
        phone = request.get("phone")
        shop_id = request.get("shop_id")
        
        if not amount or amount <= 0:
            raise HTTPException(400, "Montant invalide")
        
        # ✅ Récupérer l'objet shop depuis la base de données
        shop = db.query(Shop).filter(Shop.id == shop_id).first()
        if not shop:
            raise HTTPException(404, "Boutique non trouvée")
        
        payment_service = PaymentService()
        
        # ✅ Passer l'objet shop (pas seulement shop_id)
        success, result = await payment_service._process_moncash_payment(
            amount=amount,
            currency="HTG",
            phone=phone,
            shop=shop,  # ← CORRIGÉ : on passe l'objet shop
            order_id=order_id
        )
        
        if not success:
            raise HTTPException(400, result.get("error", "Erreur MonCash"))
        
        return {
            "success": True,
            "redirect_url": result["redirect_url"],
            "order_id": result["order_id"],
            "provider": "moncash"
        }
        
    except Exception as e:
        logger.error(f"MonCash payment error: {str(e)}")
        raise HTTPException(500, str(e))

@router.post("/create-natcash-payment")
async def create_natcash_payment(
    request: dict,
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Crée un paiement NatCash"""
    try:
        # 🔍 LOGS DÉTAILLÉS
        logger.info("=" * 50)
        logger.info("🔍 [NATCASH] Requête reçue")
        logger.info(f"📦 Headers: {request.headers if hasattr(request, 'headers') else 'N/A'}")
        logger.info(f"📦 Body reçu: {request}")
        
        amount = request.get("amount")
        order_id = request.get("order_id")
        phone = request.get("phone")
        shop_id = request.get("shop_id")
        
        logger.info(f"📦 amount: {amount}")
        logger.info(f"📦 order_id: {order_id}")
        logger.info(f"📦 phone: {phone}")
        logger.info(f"📦 shop_id: {shop_id}")
        logger.info("=" * 50)
        
        if not amount or amount <= 0:
            raise HTTPException(400, "Montant invalide")
        
        if not order_id:
            raise HTTPException(400, "order_id requis - reçu: " + str(order_id))
        
        # ✅ Récupérer l'objet shop
        shop = db.query(Shop).filter(Shop.id == shop_id).first()
        if not shop:
            raise HTTPException(404, "Boutique non trouvée")
        
        payment_service = PaymentService()
        
        # ✅ Passer l'objet shop
        success, result = await payment_service._process_natcash_payment(
            amount=amount,
            currency="HTG",
            phone=phone,
            shop=shop,
            order_id=order_id
        )
        
        if not success:
            raise HTTPException(400, result.get("error", "Erreur NatCash"))
        
        return {
            "success": True,
            "redirect_url": result["redirect_url"],
            "order_id": result["order_id"],
            "provider": "natcash"
        }
        
    except Exception as e:
        logger.error(f"NatCash payment error: {str(e)}")
        raise HTTPException(500, str(e))
    

@router.post("/confirm-natcash")
async def confirm_natcash_payment(
    request: dict,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Confirme un paiement NatCash (simulation)
    """
    logger.info(f"💰 NatCash confirmation request: {request}")
    
    transaction_id = request.get("transaction_id")
    order_id = request.get("order_id")
    phone = request.get("phone")
    
    if not transaction_id or not order_id:
        raise HTTPException(400, "Paramètres manquants: transaction_id et order_id requis")
    
    # Récupérer la commande
    from app.models import Order, Transaction, Cart, SellerWallet
    from app.models.transaction import PaymentStatus, TransactionStatus
    
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(404, "Commande non trouvée")
    
    # Vérifier si déjà confirmée
    if order.payment_confirmed:
        return {"success": True, "already_confirmed": True}
    
    # Récupérer la transaction associée
    transaction = db.query(Transaction).filter(
        Transaction.order_id == order.id
    ).first()
    
    if not transaction:
        raise HTTPException(404, "Transaction non trouvée")
    
    # Mettre à jour la commande
    order.payment_confirmed = True
    order.payment_status = "paid"
    order.status = "processing"
    
    # Mettre à jour la transaction
    transaction.payment_status = PaymentStatus.COMPLETED
    transaction.transaction_status = TransactionStatus.PAID
    transaction.paid_at = datetime.utcnow()
    transaction.local_reference = transaction_id
    transaction.phone_number = phone
    
    # ✅ Créditer le wallet (pending_balance)
    wallet = db.query(SellerWallet).filter(
        SellerWallet.seller_id == transaction.seller_id
    ).first()
    
    if wallet:
        wallet.pending_balance += transaction.seller_amount
        wallet.total_earned += transaction.seller_amount
        logger.info(f"💰 Wallet crédité: +{transaction.seller_amount}€ (pending)")
    
    # Récupérer le panier
    cart = db.query(Cart).filter(
        Cart.user_id == order.customer_id,
        Cart.shop_id == order.shop_id
    ).first()
    
    # Finaliser la commande (vider panier, stocks)
    if cart:
        from app.api.v1.checkout import finalize_order
        await finalize_order(order, cart, db, background_tasks)
    
    db.commit()
    
    logger.info(f"✅ NatCash payment confirmed for order {order_id}")
    
    return {
        "success": True,
        "order_id": order.id,
        "order_number": order.order_number
    }


@router.get("/verify-moncash/{order_id}")
async def verify_moncash_payment(
    order_id: str,
    current_user: Optional[User] = Depends(get_current_user)
):
    """Vérifie le statut d'un paiement MonCash"""
    try:
        payment_service = PaymentService()
        result = await payment_service.verify_moncash_transaction(order_id)
        
        if "error" in result:
            raise HTTPException(400, result["error"])
        
        return result
        
    except Exception as e:
        logger.error(f"MonCash verification error: {str(e)}")
        raise HTTPException(500, str(e))

 
@router.post("/webhook/moncash")
async def moncash_webhook(request: Request, db: Session = Depends(get_db)):
    """Webhook pour les notifications MonCash"""
    try:
        payload = await request.json()
        logger.info(f"MonCash webhook received: {payload}")

        # Format typique du webhook MonCash
        transaction_id = payload.get("transactionId")
        order_id = payload.get("orderId")  # Attention: peut être différent
        status = payload.get("status") or payload.get("transactionStatus")
        
        # Nettoyer l'order_id (enlever le préfixe MC-)
        clean_order_id = order_id.replace('MC-', '') if order_id and order_id.startswith('MC-') else order_id

        if status == "successful" or status == "completed":
            # Mettre à jour la commande dans la base de données
            # order = db.query(Order).filter(Order.id == clean_order_id).first()
            # if order:
            #     order.payment_status = "paid"
            #     order.transaction_id = transaction_id
            #     db.commit()
            logger.info(f"✅ Paiement MonCash réussi pour commande {clean_order_id}")
        
        elif status == "failed":
            logger.error(f"❌ Paiement MonCash échoué pour commande {clean_order_id}")
            # Marquer la commande comme échouée

        return {"received": True, "status": status}

    except Exception as e:
        logger.error(f"MonCash webhook error: {str(e)}")
        return {"error": str(e)}, 400
    

 

@router.post("/refund")
async def refund_payment(
    request: dict,
    current_user: User = Depends(get_current_user)
):
    """
    Rembourse un paiement (admin/vendeur)
    """
    payment_intent_id = request.get("payment_intent_id")
    amount = request.get("amount")
    
    if not payment_intent_id:
        raise HTTPException(400, "payment_intent_id requis")
    
    # Vérifier les permissions (admin seulement pour l'instant)
    if not current_user.is_admin:
        raise HTTPException(403, "Permission refusée")
    
    try:
        refund_params = {
            "payment_intent": payment_intent_id,
        }
        
        if amount:
            refund_params["amount"] = int(amount * 100)
        
        refund = stripe.Refund.create(**refund_params)
        
        return {
            "refund_id": refund.id,
            "payment_intent_id": refund.payment_intent,
            "amount": refund.amount / 100,
            "status": refund.status
        }
    except stripe.error.StripeError as e:
        raise HTTPException(400, str(e))
    


