"""
Endpoints pour le checkout et validation du panier
"""
from fastapi import APIRouter, Depends, HTTPException, Request, BackgroundTasks
from pydantic import BaseModel
from app.models.wallet import SellerWallet
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any, List
import uuid
from datetime import datetime
import stripe

from ...dependencies import get_current_user_or_none, get_db, get_current_user
from ...models import Order, OrderItem, Cart, CartItem, Shop, User, Product
from ...models.transaction import Transaction, PaymentMethod, PaymentStatus, TransactionStatus, PaymentProvider
from ...services.payment_service import PaymentService
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/checkout", tags=["checkout"])
payment_service = PaymentService()

class CheckoutRequest(BaseModel):
    shop_slug: str
    payment_method: str
    payment_details: Dict[str, Any]
    shipping_address: Dict[str, Any]
    billing_address: Optional[Dict[str, Any]] = None
    customer_notes: Optional[str] = None
    save_payment_method: bool = False

# =====================================================================
# PARTIE 1: CODE EXISTANT - GARDE INTACT
# =====================================================================

@router.post("/initiate")
async def initiate_checkout(
    request: Request,
    shop_slug: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_or_none)
):
    """
    Valider le panier et vérifier l'authentification avant checkout
    """
    print(f"🔍 [CHECKOUT] Initiate checkout pour boutique: {shop_slug}")
    print(f"🔍 [CHECKOUT] Utilisateur connecté: {'Oui' if current_user else 'Non'}")
    print(f"🔍 [CHECKOUT] Début - shop_slug: {shop_slug}")
    print(f"🔍 [CHECKOUT] Headers Authorization: {request.headers.get('authorization')}")
    print(f"🔍 [CHECKOUT] current_user: {current_user}")
    print(f"🔍 [CHECKOUT] current_user.id: {current_user.id if current_user else None}")
    print(f"🔍 [CHECKOUT] is_authenticated: {current_user is not None}")
    
    # 1. Récupérer la boutique
    shop = db.query(Shop).filter(Shop.slug == shop_slug).first()
    if not shop:
        raise HTTPException(status_code=404, detail="Boutique non trouvée")
    
    # 2. Récupérer le panier
    session_id = request.cookies.get("cart_session_id")
    cart = None
    
    if current_user:
        cart = db.query(Cart).filter(
            Cart.user_id == current_user.id,
            Cart.shop_id == shop.id
        ).first()
        print(f"🔍 [CHECKOUT] Panier utilisateur trouvé: {cart.id if cart else 'Non'}")
    elif session_id:
        cart = db.query(Cart).filter(
            Cart.session_id == session_id,
            Cart.shop_id == shop.id
        ).first()
        print(f"🔍 [CHECKOUT] Panier session trouvé: {cart.id if cart else 'Non'}")
    
    if not cart or not cart.items:
        raise HTTPException(status_code=400, detail="Votre panier est vide")
    
    print(f"🔍 [CHECKOUT] Panier contient {len(cart.items)} articles")
    
    # 3. Vérifier les stocks
    items_summary = []
    subtotal = 0
    
    for item in cart.items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if not product:
            print(f"⚠️ [CHECKOUT] Produit {item.product_id} non trouvé")
            continue
            
        if product.stock < item.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Stock insuffisant pour {product.name}. Disponible: {product.stock}"
            )
        
        item_total = item.product_price * item.quantity
        subtotal += item_total
        
        items_summary.append({
            "product_id": product.id,
            "product_name": product.name,
            "product_price": item.product_price,
            "quantity": item.quantity,
            "total_price": item_total,
            "product_image": product.images[0] if product.images else None,
            "product_sku": product.sku,
            "max_stock": product.stock
        })
    
    # 4. Retourner la réponse selon l'authentification
    if current_user:
        # Utilisateur connecté - procéder directement
        print(f"✅ [CHECKOUT] Utilisateur connecté - checkout direct")
        return {
            "requires_login": False,
            "user": {
                "id": current_user.id,
                "email": current_user.email,
                "full_name": current_user.full_name or current_user.username
            },
            "cart_summary": {
                "items": items_summary,
                "subtotal": subtotal,
                "item_count": len(cart.items),
                "shop_id": shop.id,
                "shop_slug": shop.slug,
                "shop_name": shop.name
            }
        }
    else:
        # Utilisateur non connecté - demander la connexion
        print(f"🔐 [CHECKOUT] Utilisateur non connecté - demande de connexion")
        return {
            "requires_login": True,
            "redirect_url": "/auth/login",
            "callback_url": f"/checkout?shop={shop.slug}",
            "message": "Veuillez vous connecter pour finaliser votre commande",
            "cart_summary": {
                "items": items_summary,
                "subtotal": subtotal,
                "item_count": len(cart.items),
                "shop_id": shop.id,
                "shop_slug": shop.slug,
                "shop_name": shop.name
            },
            "guest_session_id": session_id
        }

@router.post("/merge-cart")
async def merge_guest_cart(
    request: Request,
    session_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_or_none)
):
    """
    Fusionner le panier guest avec le compte utilisateur après connexion
    """
    print(f"🔄 [CHECKOUT] Fusion du panier pour session: {session_id}")
    
    if not current_user:
        raise HTTPException(status_code=401, detail="Utilisateur non connecté")
    
    if not session_id:
        print("⚠️ [CHECKOUT] Pas de session ID fourni")
        return {"message": "Aucun panier à fusionner"}
    
    # Récupérer tous les paniers session de cet utilisateur
    session_carts = db.query(Cart).filter(
        Cart.session_id == session_id,
        Cart.user_id == None  # Uniquement les paniers guest
    ).all()
    
    if not session_carts:
        print("⚠️ [CHECKOUT] Aucun panier session trouvé")
        return {"message": "Aucun panier à fusionner"}
    
    print(f"🔍 [CHECKOUT] {len(session_carts)} paniers session à fusionner")
    
    merged_items = 0
    
    for session_cart in session_carts:
        # Vérifier si l'utilisateur a déjà un panier pour cette boutique
        user_cart = db.query(Cart).filter(
            Cart.user_id == current_user.id,
            Cart.shop_id == session_cart.shop_id
        ).first()
        
        if not user_cart:
            # Créer un panier utilisateur
            user_cart = Cart(
                user_id=current_user.id,
                shop_id=session_cart.shop_id,
                session_id=None
            )
            db.add(user_cart)
            db.flush()
            print(f"🛒 [CHECKOUT] Panier créé pour utilisateur {current_user.id}")
        
        # Fusionner les items
        for session_item in session_cart.items:
            # Vérifier si l'item existe déjà dans le panier utilisateur
            existing_item = db.query(CartItem).filter(
                CartItem.cart_id == user_cart.id,
                CartItem.product_id == session_item.product_id
            ).first()
            
            if existing_item:
                # Mettre à jour la quantité
                existing_item.quantity += session_item.quantity
                # Vérifier le stock
                product = db.query(Product).filter(Product.id == session_item.product_id).first()
                if existing_item.quantity > product.stock:
                    existing_item.quantity = product.stock
                    print(f"⚠️ [CHECKOUT] Quantité ajustée au stock max: {product.stock}")
            else:
                # Créer un nouvel item
                new_item = CartItem(
                    cart_id=user_cart.id,
                    product_id=session_item.product_id,
                    product_name=session_item.product_name,
                    product_price=session_item.product_price,
                    product_image=session_item.product_image,
                    product_sku=session_item.product_sku,
                    quantity=session_item.quantity
                )
                db.add(new_item)
            
            merged_items += 1
        
        # Supprimer le panier session
        db.delete(session_cart)
        print(f"🗑️ [CHECKOUT] Panier session {session_cart.id} supprimé")
    
    db.commit()
    
    print(f"✅ [CHECKOUT] {merged_items} articles fusionnés pour l'utilisateur {current_user.email}")
    
    return {
        "message": f"{merged_items} articles fusionnés dans votre panier",
        "merged_items": merged_items
    }

# =====================================================================
# PARTIE 2: NOUVEAUX ENDPOINTS POUR PAIEMENT
# =====================================================================

async def update_stock_after_payment(db: Session, items: List[CartItem]):
    """Met à jour les stocks après paiement confirmé"""
    for item in items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if product:
            product.stock -= item.quantity
    db.commit()
    print(f"✅ [STOCK] Stocks mis à jour pour {len(items)} produits")

# backend/app/api/v1/checkout.py - MODIFIEZ process_checkout (lignes ~140-200)

@router.post("/process")
async def process_checkout(
    checkout_data: CheckoutRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    ENDPOINT PROTÉGÉ - Crée une commande en attente de confirmation
    """
    print(f"🔍 [CHECKOUT PROCESS] Début pour boutique: {checkout_data.shop_slug}")
    
    # 1. Vérifier que l'utilisateur est connecté
    if not current_user:
        raise HTTPException(401, "Vous devez être connecté")
    
    # 2. Récupérer la boutique
    shop = db.query(Shop).filter(
        Shop.slug == checkout_data.shop_slug,
        Shop.is_active == True
    ).first()
    
    if not shop:
        raise HTTPException(404, "Boutique non trouvée")
    
    # 3. Vérifier que la boutique accepte ce mode de paiement
    accepted_methods = shop.accepted_payment_methods or []
    if checkout_data.payment_method not in accepted_methods:
        raise HTTPException(400, f"La boutique n'accepte pas le paiement par {checkout_data.payment_method}")
    
    # 4. Récupérer le panier
    cart = db.query(Cart).filter(
        Cart.user_id == current_user.id,
        Cart.shop_id == shop.id
    ).first()
    
    if not cart or not cart.items:
        raise HTTPException(400, "Votre panier est vide")
    
    # 5. Vérifier les stocks
    for item in cart.items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if product.stock < item.quantity:
            raise HTTPException(400, f"Stock insuffisant pour {product.name}")
    
    # 6. Calculer les totaux
    subtotal = sum(item.product_price * item.quantity for item in cart.items)
    shipping_fee = 4.99
    total = subtotal + shipping_fee
    
    # 7. Créer la commande (MAINTENANT AVEC payment_confirmed=False)
    order_number = f"ORD-{datetime.utcnow().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
    
    order = Order(
        order_number=order_number,
        shop_id=shop.id,
        customer_id=current_user.id,
        customer_name=current_user.full_name or current_user.username,
        customer_email=current_user.email,
        customer_phone=current_user.phone,
        customer_address=checkout_data.shipping_address,
        items=[{
            "id": item.id,
            "product_id": item.product_id,
            "product_name": item.product_name,
            "product_price": item.product_price,
            "quantity": item.quantity,
            "total_price": item.product_price * item.quantity
        } for item in cart.items],
        subtotal=subtotal,
        shipping_fee=shipping_fee,
        tax_amount=0,
        total_amount=total,
        shipping_address=checkout_data.shipping_address,
        payment_method=checkout_data.payment_method,
        payment_status="pending_confirmation",  # ← CHANGÉ
        status="pending",
        notes=checkout_data.customer_notes,
        payment_confirmed=False  # ← NOUVEAU
    )
    
    db.add(order)
    db.flush()  # Pour obtenir l'ID sans commit
    
    # 8. Traiter le paiement (avec l'order_id)
    success, payment_data = await payment_service.process_payment(
        method=checkout_data.payment_method,
        amount=total,
        currency="EUR",
        shop=shop,
        customer=current_user,
        order_id=order.id,  # ← AJOUTEZ CECI dans payment_service
        **checkout_data.payment_details
    )
    
    if not success:
        # Si le paiement échoue immédiatement, supprimer la commande
        db.delete(order)
        db.commit()
        raise HTTPException(400, f"Échec du paiement: {payment_data.get('error')}")
    
    # 9. Créer la transaction
    platform_fee_percentage = 5.0
    platform_fee_amount = total * (platform_fee_percentage / 100)
    seller_amount = total - platform_fee_amount
    
    provider_map = {
        "card": PaymentProvider.STRIPE,
        "paypal": PaymentProvider.PAYPAL,
        "moncash": PaymentProvider.MONCASH,
        "natcash": PaymentProvider.NATCASH,
        "cash_on_delivery": PaymentProvider.MANUAL
    }
    
    transaction = Transaction(
        order_id=order.id,
        shop_id=shop.id,
        seller_id=shop.owner_id,
        customer_id=current_user.id,
        amount=total,
        platform_fee=platform_fee_percentage,
        platform_fee_amount=platform_fee_amount,
        seller_amount=seller_amount,
        payment_fee=payment_data.get("fee", 0.0),
        net_amount=seller_amount - payment_data.get("fee", 0.0),
        payment_method=checkout_data.payment_method,
        payment_provider=provider_map.get(checkout_data.payment_method, PaymentProvider.MANUAL),
        payment_status=PaymentStatus.PROCESSING,
        transaction_status=TransactionStatus.PENDING,
        provider_payment_id=payment_data.get("payment_intent_id") or payment_data.get("payment_id"),
        provider_charge_id=payment_data.get("charge_id"),
        phone_number=checkout_data.payment_details.get("phone"),
        local_reference=payment_data.get("reference"),
        metadata=payment_data
    )
    
    db.add(transaction)
    
    # ✅ NE PAS VIDER LE PANNIER NI SUPPRIMER LE STOCK MAINTENANT
    # On garde le panier jusqu'à confirmation du paiement
    
    db.commit()
    
    # 10. Retourner la réponse
    response = {
        "order_id": order.id,
        "order_number": order.order_number,
        "total": total,
        "payment_method": checkout_data.payment_method,
        "payment_status": "pending_confirmation",
        "requires_action": True  # ← Toujours true sauf cash_on_delivery
    }
    
    if checkout_data.payment_method == "card" and payment_data.get("client_secret"):
        response["client_secret"] = payment_data["client_secret"]
        response["payment_intent_id"] = payment_data["payment_intent_id"]
    
    elif checkout_data.payment_method == "paypal" and payment_data.get("approval_url"):
        response["approval_url"] = payment_data["approval_url"]
        response["payment_id"] = payment_data["payment_id"]
    
    elif checkout_data.payment_method in ["moncash", "natcash"] and payment_data.get("redirect_url"):
        response["redirect_url"] = payment_data["redirect_url"]
        response["reference"] = payment_data.get("reference")
    
    elif checkout_data.payment_method == "cash_on_delivery":
        # Pour cash_on_delivery, confirmation immédiate
        order.payment_confirmed = True
        order.payment_status = "paid"
        
        # ✅ NE PAS CRÉDITER LE WALLET
        # wallet.pending_balance += seller_amount  ← À SUPPRIMER !
        
        # ✅ MAIS METTRE À JOUR LES STATS DE LA BOUTIQUE
        shop.total_orders += 1
        # ⚠️ total_revenue sera mis à jour à la livraison
        
        response["requires_action"] = False
        response["payment_status"] = "paid"
    
    return response



# @router.post("/process")
# async def process_checkout(
#     checkout_data: CheckoutRequest,
#     background_tasks: BackgroundTasks,
#     db: Session = Depends(get_db),
#     current_user: User = Depends(get_current_user)  # ← obligatoire ici
# ):
#     """
#     ENDPOINT PROTÉGÉ - Traite réellement le paiement
#     Nécessite d'être connecté
#     """
#     print(f"🔍 [CHECKOUT PROCESS] Début pour boutique: {checkout_data.shop_slug}")
    
#     # 1. Vérifier que l'utilisateur est connecté (déjà fait par la dépendance)
#     if not current_user:
#         raise HTTPException(401, "Vous devez être connecté")
    
#     # 2. Récupérer la boutique
#     shop = db.query(Shop).filter(
#         Shop.slug == checkout_data.shop_slug,
#         Shop.is_active == True
#     ).first()
    
#     if not shop:
#         raise HTTPException(404, "Boutique non trouvée")
    
#     # 3. Vérifier que la boutique accepte ce mode de paiement
#     accepted_methods = shop.accepted_payment_methods or []
#     if checkout_data.payment_method not in accepted_methods:
#         raise HTTPException(400, f"La boutique n'accepte pas le paiement par {checkout_data.payment_method}")
#     # if checkout_data.payment_method not in shop.accepted_payment_methods:
#     #     raise HTTPException(400, f"La boutique n'accepte pas le paiement par {checkout_data.payment_method}")
    
#     # 4. Récupérer le panier
#     cart = db.query(Cart).filter(
#         Cart.user_id == current_user.id,
#         Cart.shop_id == shop.id
#     ).first()
    
#     if not cart or not cart.items:
#         raise HTTPException(400, "Votre panier est vide")
    
#     # 5. Vérifier les stocks
#     for item in cart.items:
#         product = db.query(Product).filter(Product.id == item.product_id).first()
#         if product.stock < item.quantity:
#             raise HTTPException(400, f"Stock insuffisant pour {product.name}")
    
#     # 6. Calculer les totaux
#     subtotal = sum(item.product_price * item.quantity for item in cart.items)
#     shipping_fee = 4.99
#     total = subtotal + shipping_fee
    
#     # 7. Traiter le paiement
#     success, payment_data = await payment_service.process_payment(
#         method=checkout_data.payment_method,
#         amount=total,
#         currency="EUR",
#         shop=shop,
#         customer=current_user,
#         **checkout_data.payment_details
#     )
    
#     if not success:
#         raise HTTPException(400, f"Échec du paiement: {payment_data.get('error')}")
    
#     # 8. Créer la commande
#     order_number = f"ORD-{datetime.utcnow().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
    
#     order = Order(
#         order_number=order_number,
#         shop_id=shop.id,
#         customer_id=current_user.id,
#         customer_name=current_user.full_name or current_user.username,
#         customer_email=current_user.email,
#         customer_phone=current_user.phone,
#         customer_address=checkout_data.shipping_address,
#         items=[{
#             "id": item.id,
#             "product_id": item.product_id,
#             "product_name": item.product_name,
#             "product_price": item.product_price,
#             "quantity": item.quantity,
#             "total_price": item.product_price * item.quantity
#         } for item in cart.items],
#         subtotal=subtotal,
#         shipping_fee=shipping_fee,
#         tax_amount=0,
#         total_amount=total,
#         shipping_address=checkout_data.shipping_address,
#         payment_method=checkout_data.payment_method,
#         payment_status="pending" if payment_data.get("requires_action", False) else "paid",
#         status="pending",
#         notes=checkout_data.customer_notes
#     )
    
#     db.add(order)
#     db.flush()
    
#     # 9. Créer la transaction
#     platform_fee_percentage = 5.0
#     platform_fee_amount = total * (platform_fee_percentage / 100)
#     seller_amount = total - platform_fee_amount
    
#     provider_map = {
#         "card": PaymentProvider.STRIPE,
#         "paypal": PaymentProvider.PAYPAL,
#         "moncash": PaymentProvider.MONCASH,
#         "natcash": PaymentProvider.NATCASH,
#         "cash_on_delivery": PaymentProvider.MANUAL
#     }
    
#     transaction = Transaction(
#         order_id=order.id,
#         shop_id=shop.id,
#         seller_id=shop.owner_id,
#         customer_id=current_user.id,
#         amount=total,
#         platform_fee=platform_fee_percentage,
#         platform_fee_amount=platform_fee_amount,
#         seller_amount=seller_amount,
#         payment_fee=payment_data.get("fee", 0.0),
#         net_amount=seller_amount - payment_data.get("fee", 0.0),
#         payment_method=checkout_data.payment_method,
#         payment_provider=provider_map.get(checkout_data.payment_method, PaymentProvider.MANUAL),
#         payment_status=PaymentStatus.PROCESSING if payment_data.get("requires_action") else PaymentStatus.COMPLETED,
#         transaction_status=TransactionStatus.PENDING,
#         provider_payment_id=payment_data.get("payment_intent_id") or payment_data.get("payment_id"),
#         provider_charge_id=payment_data.get("charge_id"),
#         phone_number=checkout_data.payment_details.get("phone"),
#         local_reference=payment_data.get("reference"),
#         metadata=payment_data
#     )
    
#     db.add(transaction)
    
#     # 10. Vider le panier
#     db.query(CartItem).filter(CartItem.cart_id == cart.id).delete()
#     db.delete(cart)
    
#     # 11. Mettre à jour les stocks
#     background_tasks.add_task(update_stock_after_payment, db, cart.items)
    
#     db.commit()
    
#     # 12. Retourner la réponse
#     response = {
#         "order_id": order.id,
#         "order_number": order.order_number,
#         "total": total,
#         "payment_method": checkout_data.payment_method,
#         "payment_status": transaction.payment_status,
#         "requires_action": payment_data.get("requires_action", False)
#     }
    
#     if checkout_data.payment_method == "card" and payment_data.get("client_secret"):
#         response["client_secret"] = payment_data["client_secret"]
#         response["payment_intent_id"] = payment_data["payment_intent_id"]
    
#     elif checkout_data.payment_method == "paypal" and payment_data.get("approval_url"):
#         response["approval_url"] = payment_data["approval_url"]
#         response["payment_id"] = payment_data["payment_id"]
    
#     elif checkout_data.payment_method in ["moncash", "natcash"] and payment_data.get("reference"):
#         response["reference"] = payment_data["reference"]
#         response["confirmation_code"] = payment_data.get("confirmation_code")
    
#     return response

@router.post("/confirm")
async def confirm_payment(
    payment_intent_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Confirme un paiement après 3D Secure ou action requise"""
    
    transaction = db.query(Transaction).filter(
        Transaction.provider_payment_id == payment_intent_id
    ).first()
    
    if not transaction:
        raise HTTPException(404, "Transaction non trouvée")
    
    # Vérifier le statut du paiement
    if transaction.payment_method == "card":
        try:
            payment_intent = stripe.PaymentIntent.retrieve(payment_intent_id)
            
            if payment_intent.status == "succeeded":
                transaction.payment_status = PaymentStatus.COMPLETED
                transaction.transaction_status = TransactionStatus.PAID
                transaction.paid_at = datetime.utcnow()

                wallet = db.query(SellerWallet).filter(
                    SellerWallet.seller_id == transaction.seller_id
                ).first()
                
                if wallet:
                    wallet.pending_balance += transaction.seller_amount
                    wallet.total_earned += transaction.seller_amount
                
                # Mettre à jour la commande
                order = db.query(Order).filter(Order.id == transaction.order_id).first()
                order.payment_status = "paid"
                order.status = "processing"
                
                db.commit()
                
                return {"success": True, "order_id": order.id}
        except Exception as e:
            print(f"❌ [CONFIRM] Erreur Stripe: {e}")
            raise HTTPException(400, f"Erreur de confirmation: {str(e)}")
    
    return {"success": False, "message": "Paiement non confirmé"}

@router.post("/webhook/{provider}")
async def payment_webhook(
    provider: str,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Endpoint pour les webhooks des providers de paiement
    """
    payload = await request.json()
    
    # Vérifier la signature (selon le provider)
    # ...
    
    result = await payment_service.handle_webhook(provider, payload)
    
    if result.get("event") == "payment_success":
        # Mettre à jour la transaction
        transaction = db.query(Transaction).filter(
            Transaction.provider_payment_id == result["payment_intent_id"]
        ).first()
        
        if transaction:
            transaction.payment_status = PaymentStatus.COMPLETED
            transaction.transaction_status = TransactionStatus.PAID
            transaction.paid_at = datetime.utcnow()
            
            order = db.query(Order).filter(Order.id == transaction.order_id).first()
            order.payment_status = "paid"
            order.status = "processing"
            
            db.commit()
            print(f"✅ [WEBHOOK] Transaction {transaction.id} mise à jour")
    
    return {"received": True}


# backend/app/api/v1/checkout.py - AJOUTEZ À LA FIN

# @router.post("/confirm/{provider}")
# async def confirm_payment(
#     provider: str,
#     request: dict,
#     background_tasks: BackgroundTasks,
#     db: Session = Depends(get_db)
# ):
#     """
#     Endpoint unifié pour confirmer les paiements
#     Appelé par webhook (Stripe) ou par retour utilisateur (MonCash/NatCash)
#     """
#     print(f"🔐 [CONFIRM] Confirmation paiement {provider}")
    
#     # 1. Récupérer les identifiants selon le provider
#     if provider == "stripe":
#         payment_intent_id = request.get("payment_intent_id")
#         if not payment_intent_id:
#             raise HTTPException(400, "payment_intent_id requis")
        
#         # Vérifier avec Stripe
#         payment_intent = stripe.PaymentIntent.retrieve(payment_intent_id)
#         if payment_intent.status != "succeeded":
#             raise HTTPException(400, "Paiement non confirmé")
        
#         # Trouver la commande
#         order = db.query(Order).filter(
#             Order.payment_id == payment_intent_id
#         ).first()
        
#     elif provider == "moncash":
#         transaction_id = request.get("transactionId")
#         order_id = request.get("order_id")
        
#         if not transaction_id or not order_id:
#             raise HTTPException(400, "Paramètres manquants")
        
#         # Vérifier avec MonCash
#         payment_service = PaymentService()
#         result = await payment_service.verify_moncash_transaction(transaction_id)
        
#         if result.get("status") != "successful":
#             raise HTTPException(400, "Paiement non confirmé")
        
#         order = db.query(Order).filter(Order.id == order_id).first()
    
#     elif provider == "natcash":
#         # À implémenter selon API NatCash
#         pass
    
#     else:
#         raise HTTPException(400, f"Provider {provider} non supporté")
    
#     if not order:
#         raise HTTPException(404, "Commande non trouvée")
    
#     # 2. Vérifier que la commande n'est pas déjà confirmée
#     if order.payment_confirmed:
#         return {"success": True, "order_id": order.id, "already_confirmed": True}
    
#     # 3. Confirmer la commande
#     order.payment_confirmed = True
#     order.payment_status = "paid"
#     order.status = "processing"
    
#     # 4. Récupérer le panier (toujours existant car pas encore supprimé)
#     cart = db.query(Cart).filter(
#         Cart.user_id == order.customer_id,
#         Cart.shop_id == order.shop_id
#     ).first()

#     # ✅ RÉCUPÉRER LA TRANSACTION
#     transaction = db.query(Transaction).filter(
#         Transaction.order_id == order.id
#     ).first()
    
#     if transaction:
#         # ✅ METTRE À JOUR LE STATUT DE LA TRANSACTION
#         transaction.payment_status = PaymentStatus.COMPLETED
#         transaction.transaction_status = TransactionStatus.PAID
#         transaction.paid_at = datetime.utcnow()
        
#         # ✅ CRÉDITER LE WALLET ICI AUSSI (sécuritaire)
#         wallet = db.query(SellerWallet).filter(
#             SellerWallet.seller_id == transaction.seller_id
#         ).first()
#         if wallet:
#             wallet.pending_balance += transaction.seller_amount
#             wallet.total_earned += transaction.seller_amount
    
#     # ✅ Confirmer la commande
#     order.payment_confirmed = True
#     order.payment_status = "paid"
#     order.status = "processing"
    
#     if cart:
#         # 5. Finaliser la commande
#         await finalize_order(order, cart, db, background_tasks)
    
#     db.commit()
    
#     return {
#         "success": True,
#         "order_id": order.id,
#         "order_number": order.order_number
#     }

@router.post("/confirm/{provider}")
async def confirm_payment(
    provider: str,
    request: dict,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Endpoint unifié pour confirmer les paiements
    Appelé par webhook (Stripe) ou par retour utilisateur (MonCash/NatCash)
    """
    print(f"🔐 [CONFIRM] Confirmation paiement {provider}")
    
    # 1. Récupérer les identifiants selon le provider
    if provider == "stripe":
        payment_intent_id = request.get("payment_intent_id")
        if not payment_intent_id:
            raise HTTPException(400, "payment_intent_id requis")
        
        # Vérifier avec Stripe
        payment_intent = stripe.PaymentIntent.retrieve(payment_intent_id)
        if payment_intent.status != "succeeded":
            raise HTTPException(400, "Paiement non confirmé")
        
        # Trouver la commande
        order = db.query(Order).filter(
            Order.payment_id == payment_intent_id
        ).first()
        
    elif provider == "moncash":
        transaction_id = request.get("transactionId")
        order_id = request.get("order_id")
        
        if not transaction_id or not order_id:
            raise HTTPException(400, "Paramètres manquants")
        
        # Vérifier avec MonCash
        payment_service = PaymentService()
        result = await payment_service.verify_moncash_transaction(transaction_id)
        
        if result.get("status") != "successful":
            raise HTTPException(400, "Paiement non confirmé")
        
        order = db.query(Order).filter(Order.id == order_id).first()
    
    elif provider == "natcash":
        # ✅ IMPLÉMENTATION POUR NATCASH
        transaction_id = request.get("transaction_id")
        order_id = request.get("order_id")
        phone = request.get("phone")
        
        if not transaction_id or not order_id:
            raise HTTPException(400, "transaction_id et order_id requis")
        
        logger.info(f"💰 NatCash confirmation - transaction: {transaction_id}, order: {order_id}")
        
        # Pour les tests, on simule une confirmation réussie
        # Dans un cas réel, vous appelleriez l'API NatCash ici
        order = db.query(Order).filter(Order.id == order_id).first()
        
        if not order:
            raise HTTPException(404, "Commande non trouvée")
        
        # Optionnel : Stocker les infos de la transaction
        # La transaction sera mise à jour plus tard avec le bloc commun
        
    else:
        raise HTTPException(400, f"Provider {provider} non supporté")
    
    if not order:
        raise HTTPException(404, "Commande non trouvée")
    
    # 2. Vérifier que la commande n'est pas déjà confirmée
    if order.payment_confirmed:
        return {"success": True, "order_id": order.id, "already_confirmed": True}
    
    # 3. Récupérer la transaction associée
    transaction = db.query(Transaction).filter(
        Transaction.order_id == order.id
    ).first()
    
    if not transaction:
        raise HTTPException(404, "Transaction non trouvée pour cette commande")
    
    # 4. Mettre à jour le statut de la transaction
    transaction.payment_status = PaymentStatus.COMPLETED
    transaction.transaction_status = TransactionStatus.PAID
    transaction.paid_at = datetime.utcnow()
    
    # Ajouter les infos spécifiques au provider
    if provider == "natcash":
        transaction.local_reference = request.get("transaction_id")
        transaction.phone_number = request.get("phone")
    
    # 5. Créditer le wallet (pending_balance)
    wallet = db.query(SellerWallet).filter(
        SellerWallet.seller_id == transaction.seller_id
    ).first()
    
    if wallet:
        wallet.pending_balance += transaction.seller_amount
        wallet.total_earned += transaction.seller_amount
        logger.info(f"💰 Wallet crédité: +{transaction.seller_amount}€ (pending)")
    
    # 6. Confirmer la commande
    order.payment_confirmed = True
    order.payment_status = "paid"
    order.status = "processing"
    
    # 7. Récupérer le panier et finaliser la commande
    cart = db.query(Cart).filter(
        Cart.user_id == order.customer_id,
        Cart.shop_id == order.shop_id
    ).first()

    if cart:
        await finalize_order(order, cart, db, background_tasks)
    
    db.commit()
    
    logger.info(f"✅ Paiement {provider} confirmé pour commande {order.id}")
    
    return {
        "success": True,
        "order_id": order.id,
        "order_number": order.order_number
    }




async def finalize_order(order: Order, cart: Cart, db: Session, background_tasks: BackgroundTasks = None):
    """Finalise la commande après confirmation du paiement"""

    # 1. Mettre à jour les stocks
    for item in cart.items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if product:
            product.stock -= item.quantity

    # 2. Vider le panier
    db.query(CartItem).filter(CartItem.cart_id == cart.id).delete()
    db.delete(cart)

    # 3. ✅ CRÉDITER LE WALLET EN ATTENTE (pending_balance)
    wallet = db.query(SellerWallet).filter(
        SellerWallet.seller_id == order.shop.owner_id
    ).first()
    
    if wallet:
        # Récupérer la transaction
        transaction = db.query(Transaction).filter(
            Transaction.order_id == order.id
        ).first()
        
        if transaction:
            # Montant net pour le vendeur (après frais)
            seller_amount = transaction.seller_amount
            
            # Mettre en attente jusqu'à livraison
            wallet.pending_balance += seller_amount
            wallet.total_earned += seller_amount

    # 4. Mettre à jour les stats de la boutique (UNIQUEMENT le compteur de commandes)
    shop = db.query(Shop).filter(Shop.id == order.shop_id).first()
    if shop:
        shop.total_orders += 1
        # ⚠️ NE PAS AJOUTER total_revenue ici (sera fait à la livraison)

    print(f"✅ [FINALIZE] Commande {order.id} finalisée")
