"""
Endpoints pour le checkout et validation du panier
"""
from fastapi import APIRouter, Depends, HTTPException, Request
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
import uuid

from ...dependencies import get_current_user_or_none, get_db, get_current_user_optional
from ...models import Cart, CartItem, Shop, User, Product

router = APIRouter(prefix="/checkout", tags=["checkout"])

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
