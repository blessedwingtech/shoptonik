# backend/app/api/v1/seller/payments.py
from fastapi import APIRouter, Depends, HTTPException, Request
from app.services.audit import AuditService
from sqlalchemy.orm import Session
from typing import List

from ....dependencies import get_db, get_current_user
from ....models import User, Shop
from ....schemas.shop import PaymentMethodsUpdate

router = APIRouter(prefix="/payments", tags=["seller-payments"])

@router.get("/methods")
async def get_seller_payment_methods(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Récupère les méthodes de paiement configurées par le vendeur"""
    
    shops = db.query(Shop).filter(Shop.owner_id == current_user.id).all()
    
    return {
        "shops": [
            {
                "id": shop.id,
                "name": shop.name,
                "accepted_methods": shop.accepted_payment_methods,
                "stripe": {
                    "connected": shop.stripe_account_id is not None,
                    "status": shop.stripe_account_status
                },
                "paypal": {
                    "connected": shop.paypal_email is not None,
                    "email": shop.paypal_email
                },
                "moncash": {
                    "connected": shop.moncash_phone is not None,
                    "phone": shop.moncash_phone,
                    "verified": shop.moncash_verified
                }
            }
            for shop in shops
        ]
    }

@router.post("/shops/{shop_id}/stripe/connect")
async def connect_stripe_account(
    request:Request,
    shop_id: str,
    authorization_code: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Connecte un compte Stripe à la boutique"""
    
    shop = db.query(Shop).filter(
        Shop.id == shop_id,
        Shop.owner_id == current_user.id
    ).first()
    
    if not shop:
        raise HTTPException(404, "Boutique non trouvée")
    old_value = {
        "stripe_account_id": shop.stripe_account_id,
        "stripe_account_status": shop.stripe_account_status
    }
    # Échanger le code d'autorisation contre un compte Stripe
    try:
        response = stripe.OAuth.token(
            grant_type="authorization_code",
            code=authorization_code
        )
        
        shop.stripe_account_id = response.stripe_user_id
        shop.stripe_account_status = "active"
        
        db.commit()
        
        audit = AuditService(db)
        await audit.log_update(
            resource_type="shop_payment",
            resource_id=shop_id,
            old_values=old_value,
            new_values={
                "stripe_account_id": shop.stripe_account_id,
                "stripe_account_status": shop.stripe_account_status
            },
            user_id=current_user.id,
            user_email=current_user.email,
            request=request,
            shop_id=shop_id
        )
        
        return {"success": True, "account_id": response.stripe_user_id}
        
    except stripe.error.StripeError as e:
        audit = AuditService(db)
        await audit.log_update(
            resource_type="shop_payment",
            resource_id=shop_id,
            old_values=old_value,
            new_values={},
            user_id=current_user.id,
            user_email=current_user.email,
            request=request,
            shop_id=shop_id,
            status="failure",
            error_message=str(e)
        )
        raise HTTPException(400, str(e))

@router.post("/shops/{shop_id}/paypal/connect")
async def connect_paypal_account(
    request:Request,
    shop_id: str,
    paypal_email: str,
    merchant_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Connecte un compte PayPal à la boutique"""
    
    shop = db.query(Shop).filter(
        Shop.id == shop_id,
        Shop.owner_id == current_user.id
    ).first()
    
    if not shop:
        raise HTTPException(404, "Boutique non trouvée")
    
    old_value = {
        "paypal_email": shop.paypal_email,
        "paypal_merchant_id": shop.paypal_merchant_id
    }
    
    shop.paypal_email = paypal_email
    shop.paypal_merchant_id = merchant_id
    
    db.commit()
     
    audit = AuditService(db)
    await audit.log_update(
        resource_type="shop_payment",
        resource_id=shop_id,
        old_values=old_value,
        new_values={
            "paypal_email": shop.paypal_email,
            "paypal_merchant_id": shop.paypal_merchant_id
        },
        user_id=current_user.id,
        user_email=current_user.email,
        request=request,
        shop_id=shop_id
    )
    
    return {"success": True}

@router.post("/shops/{shop_id}/moncash/verify")
async def verify_moncash(
    request:Request,
    shop_id: str,
    phone: str,
    code: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Vérifie le numéro MonCash du vendeur"""
    
    shop = db.query(Shop).filter(
        Shop.id == shop_id,
        Shop.owner_id == current_user.id
    ).first()
    
    if not shop:
        raise HTTPException(404, "Boutique non trouvée")
    
    old_value = {
        "moncash_phone": shop.moncash_phone,
        "moncash_verified": shop.moncash_verified
    }
    
    # Vérifier le code (à implémenter avec API MonCash)
    # ...
    
    shop.moncash_phone = phone
    shop.moncash_verified = True
    
    # Ajouter MonCash aux méthodes acceptées
    if "moncash" not in shop.accepted_payment_methods:
        shop.accepted_payment_methods.append("moncash")
    
    db.commit()

    audit = AuditService(db)
    await audit.log_update(
        resource_type="shop_payment",
        resource_id=shop_id,
        old_values=old_value,
        new_values={
            "moncash_phone": shop.moncash_phone,
            "moncash_verified": shop.moncash_verified
        },
        user_id=current_user.id,
        user_email=current_user.email,
        request=request,
        shop_id=shop_id
    )
    
    return {"success": True}

