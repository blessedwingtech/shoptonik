"""
Endpoints pour les clients (création et consultation de leurs commandes)
"""
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
import uuid
# 4. Générer un numéro de commande unique
from datetime import datetime, timezone

from ...dependencies import get_current_user, get_db, get_current_user_optional 

from app.models.order import Order, OrderItem
from app.models.shop import Shop
from app.models.user import User
from app.models.product import Product 

router = APIRouter(prefix="/orders", tags=["customer-orders"])

@router.post("/validate")
async def validate_order(
    shop_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    Valider le panier avant création de commande
    Retourne les infos pour pré-remplir le checkout
    """
    # 1. Récupérer le panier
    # (Vous devez adapter avec votre logique de panier)
    
    # 2. Vérifier les stocks
    
    # 3. Calculer les totaux
    
    # 4. Retourner un résumé
    return {
        "valid": True,
        "items": [],  # Items du panier
        "subtotal": 0,
        "shipping_options": [],
        "customer_info": {}  # Infos si user connecté
    }

@router.post("/", response_model=OrderResponse)
async def create_order(
    order_data: OrderCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)  # ✅ CORRIGÉ
):
    """
    Créer une nouvelle commande
    - Client peut être connecté (alors customer_id = user.id)
    - Client peut être non connecté (guest checkout)
    """
    # 1. Vérifier que la boutique existe
    shop = db.query(Shop).filter(Shop.id == order_data.shop_id).first()
    if not shop:
        raise HTTPException(status_code=404, detail="Boutique non trouvée")
    
    # 2. Vérifier le stock et préparer les items
    order_items = []
    subtotal = 0
    
    for item in order_data.items:
        product = db.query(Product).filter(
            Product.id == item.product_id,
            Product.shop_id == shop.id
        ).first()
        
        if not product:
            raise HTTPException(status_code=404, detail=f"Produit {item.product_name} non trouvé")
        
        if product.stock < item.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Stock insuffisant pour {product.name}. Disponible: {product.stock}"
            )
        
        # Ajouter au sous-total
        item_total = item.product_price * item.quantity
        subtotal += item_total
        
        # Préparer l'item pour la commande
        order_items.append({
            "product_id": product.id,
            "product_name": product.name,
            "product_price": item.product_price,
            "product_sku": product.sku,
            "product_image": product.images[0] if product.images else None,
            "quantity": item.quantity,
            "total_price": item_total
        })
    
    # 3. Calculer les totaux
    shipping_fee = order_data.shipping_fee or 0
    tax_amount = order_data.tax_amount or 0
    total_amount = subtotal + shipping_fee + tax_amount
    
    timestamp = int(datetime.now(timezone.utc).timestamp())
    order_number = f"CMD-{timestamp}-{shop.slug[:4].upper()}"
    
    # 5. Créer la commande
    order = Order(
        id=str(uuid.uuid4()),
        order_number=order_number,
        shop_id=shop.id,
        customer_id=current_user.id if current_user else None,
        customer_name=order_data.customer_name,
        customer_email=order_data.customer_email,
        customer_phone=order_data.customer_phone,
        customer_address=order_data.customer_address.dict(),
        items=order_items,  # JSON des items
        subtotal=subtotal,
        shipping_fee=shipping_fee,
        tax_amount=tax_amount,
        total_amount=total_amount,
        shipping_method=order_data.shipping_method,
        shipping_address=order_data.shipping_address.dict() if order_data.shipping_address else None,
        payment_method=order_data.payment_method,
        status="pending",
        payment_status="pending",
        notes=order_data.notes
    )
    
    db.add(order)
    db.flush()  # Pour obtenir l'ID
    
    # 6. Créer les OrderItem et mettre à jour les stocks
    for item_data in order_items:
        # Créer OrderItem
        order_item = OrderItem(
            id=str(uuid.uuid4()),
            order_id=order.id,
            product_id=item_data["product_id"],
            product_name=item_data["product_name"],
            product_price=item_data["product_price"],
            product_sku=item_data["product_sku"],
            product_image=item_data["product_image"],
            quantity=item_data["quantity"],
            total_price=item_data["total_price"]
        )
        db.add(order_item)
        
        # Mettre à jour le stock
        product = db.query(Product).filter(Product.id == item_data["product_id"]).first()
        product.stock -= item_data["quantity"]
    
    db.commit()
    shop.total_orders = (shop.total_orders or 0) + 1
    shop.total_revenue = (shop.total_revenue or 0) + int(total_amount * 100)  # Convertir en centimes

    db.commit() 
    db.refresh(order)
    
    return order

@router.get("/my-orders", response_model=List[OrderResponse])
async def get_my_orders(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)  # ✅ get_current_user garantit déjà l'authentification
):
    """Récupérer les commandes du client connecté"""
    # Supprimer la vérification if not current_user - inutile car
    # get_current_user() lève déjà une exception 401 si pas authentifié
    
    orders = db.query(Order).filter(
        Order.customer_id == current_user.id
    ).order_by(Order.created_at.desc()).offset(skip).limit(limit).all()

    return orders



@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """Obtenir les détails d'une commande spécifique"""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Commande non trouvée")
    
    # Vérifier les permissions
    has_access = False
    
    # Client connecté regarde sa commande
    if current_user and order.customer_id == current_user.id:
        has_access = True
    
    # Vendeur regarde une commande de sa boutique
    if current_user:
        shop = db.query(Shop).filter(
            Shop.id == order.shop_id,
            Shop.owner_id == current_user.id
        ).first()
        if shop:
            has_access = True
    
    if not has_access:
        raise HTTPException(status_code=403, detail="Accès non autorisé")
    
    return order

@router.get("/track/{order_number}", response_model=OrderResponse)
async def track_order(
    order_number: str,
    email: str = Query(..., description="Email du client pour vérification"),
    db: Session = Depends(get_db)
):
    """Suivre une commande (pour clients non connectés)"""
    order = db.query(Order).filter(
        Order.order_number == order_number,
        Order.customer_email == email
    ).first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Commande non trouvée")
    
    return order

