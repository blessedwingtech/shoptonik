from fastapi import APIRouter, Depends, HTTPException, Query, Request
from typing import List, Optional
from app.services.audit import AuditService
from app.models.transaction import Transaction
from app.models.wallet import SellerWallet
from sqlalchemy.orm import Session
from sqlalchemy import func, and_

from ...dependencies import get_db, get_current_user
from app.models.order import Order, OrderItem
from app.models.shop import Shop
from app.models.user import User
from app.models.product import Product
from ...schemas.order import OrderResponse, OrderUpdate, OrderStats
from ...core.security import require_shop_owner

router = APIRouter(prefix="/shops/{shop_slug}/orders", tags=["orders"])

@router.get("/", response_model=List[OrderResponse])
async def get_shop_orders(
    shop_slug: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    status: Optional[str] = None,
    show_pending: bool = Query(False, description="Afficher aussi les commandes non confirmées"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Récupérer toutes les commandes d'une boutique (vendeur seulement)"""
    # Vérifier que l'utilisateur est propriétaire de la boutique
    shop = db.query(Shop).filter(Shop.slug == shop_slug).first()
    if not shop:
        raise HTTPException(status_code=404, detail="Boutique non trouvée")
    
    if shop.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Accès non autorisé")
    
    # Construire la requête avec filtres
    query = db.query(Order).filter(Order.shop_id == shop.id)
    # 🔥 FILTRE INTELLIGENT : 
    # - Les commandes COD sont toujours visibles (pas de confirmation paiement)
    # - Les autres méthodes ne sont visibles que si confirmées
    if not show_pending:
        # Condition : (payment_method = 'cash_on_delivery') OU (payment_confirmed = True)
        query = query.filter(
            (Order.payment_method == 'cash_on_delivery') | 
            (Order.payment_confirmed == True)
        )
    
    if status:
        query = query.filter(Order.status == status)
    
    # Trier par date de création (plus récent d'abord)
    orders = query.order_by(Order.created_at.desc()).offset(skip).limit(limit).all()
    
    return orders

# backend/app/api/v1/orders.py

@router.get("/stats", response_model=OrderStats)
async def get_order_stats(
    shop_slug: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtenir les statistiques des commandes pour une boutique"""
    shop = db.query(Shop).filter(Shop.slug == shop_slug).first()
    if not shop:
        raise HTTPException(status_code=404, detail="Boutique non trouvée")

    if shop.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Accès non autorisé")

    # ✅ Base query avec le filtre intelligent
    base_query = db.query(Order).filter(
        Order.shop_id == shop.id,
        (Order.payment_method == 'cash_on_delivery') | (Order.payment_confirmed == True)
    )

    # Total des commandes valides
    total_orders = base_query.count()

    # ✅ CA (toutes les commandes livrées, même les COD)
    ca_result = db.query(func.sum(Order.total_amount)).filter(
        Order.shop_id == shop.id,
        Order.status == "delivered"
    ).scalar()
    total_revenue = float(ca_result) if ca_result else 0.0

    # ✅ Compter par statut (uniquement les commandes valides)
    pending_count = base_query.filter(Order.status == "pending").count()
    processing_count = base_query.filter(Order.status == "processing").count()
    shipped_count = base_query.filter(Order.status == "shipped").count()
    delivered_count = base_query.filter(Order.status == "delivered").count()
    cancelled_count = base_query.filter(Order.status == "cancelled").count()

    return OrderStats(
        total_orders=total_orders,
        total_revenue=round(total_revenue, 2),
        pending_count=pending_count,
        processing_count=processing_count,
        shipped_count=shipped_count,
        delivered_count=delivered_count,
        cancelled_count=cancelled_count,
    )

# @router.get("/stats", response_model=OrderStats)
# async def get_order_stats(
#     shop_slug: str,
#     db: Session = Depends(get_db),
#     current_user: User = Depends(get_current_user)
# ):
#     """Obtenir les statistiques des commandes pour une boutique"""
#     shop = db.query(Shop).filter(Shop.slug == shop_slug).first()
#     if not shop:
#         raise HTTPException(status_code=404, detail="Boutique non trouvée")

#     if shop.owner_id != current_user.id:
#         raise HTTPException(status_code=403, detail="Accès non autorisé")

#     # Version simplifiée - juste les stats de commandes
#     total_orders = db.query(func.count(Order.id)).filter(
#         Order.shop_id == shop.id
#     ).scalar() or 0

#     # CA = commandes livrées
#     ca_result = db.query(func.sum(Order.total_amount)).filter(
#         Order.shop_id == shop.id,
#         Order.status == "delivered"
#     ).scalar()
#     total_revenue = float(ca_result) if ca_result else 0.0

#     # Compter par statut
#     pending_count = db.query(func.count(Order.id)).filter(
#         Order.shop_id == shop.id,
#         Order.status == "pending"
#     ).scalar() or 0

#     processing_count = db.query(func.count(Order.id)).filter(
#         Order.shop_id == shop.id,
#         Order.status == "processing"
#     ).scalar() or 0

#     shipped_count = db.query(func.count(Order.id)).filter(
#         Order.shop_id == shop.id,
#         Order.status == "shipped"
#     ).scalar() or 0

#     delivered_count = db.query(func.count(Order.id)).filter(
#         Order.shop_id == shop.id,
#         Order.status == "delivered"
#     ).scalar() or 0

#     cancelled_count = db.query(func.count(Order.id)).filter(
#         Order.shop_id == shop.id,
#         Order.status == "cancelled"
#     ).scalar() or 0

#     return OrderStats(
#         total_orders=total_orders,
#         total_revenue=round(total_revenue, 2),  # ← en euros
#         pending_count=pending_count,
#         processing_count=processing_count,
#         shipped_count=shipped_count,
#         delivered_count=delivered_count,
#         cancelled_count=cancelled_count,
#     )


@router.get("/{order_id}", response_model=OrderResponse)
async def get_order_details(
    shop_slug: str,
    order_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtenir les détails d'une commande spécifique"""
    shop = db.query(Shop).filter(Shop.slug == shop_slug).first()
    if not shop:
        raise HTTPException(status_code=404, detail="Boutique non trouvée")
    
    if shop.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Accès non autorisé")
    

    
    order = db.query(Order).filter(
        Order.id == order_id,
        Order.shop_id == shop.id
    ).first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Commande non trouvée")
    
    return order


@router.put("/{order_id}")
async def update_order_status(
    request: Request,
    shop_slug: str,
    order_id: str,
    update_data: OrderUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mettre à jour le statut d'une commande"""
    shop = db.query(Shop).filter(Shop.slug == shop_slug).first()
    if not shop:
        raise HTTPException(status_code=404, detail="Boutique non trouvée")
    
    if shop.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Accès non autorisé")
    
    order = db.query(Order).filter(
        Order.id == order_id,
        Order.shop_id == shop.id
    ).first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Commande non trouvée")
    
    old_status = order.status
    update_dict = update_data.dict(exclude_unset=True)
    
    for field, value in update_dict.items():
        setattr(order, field, value)
    
    # Mettre à jour les stats de la boutique et le wallet si nécessaire
    if old_status != order.status:
        if order.status == "delivered" and old_status != "delivered":
            
            # ✅ 1. METTRE À JOUR LE CA (pour TOUS les types de paiement)
            shop.total_revenue += order.total_amount
            
            # ✅ 2. GÉRER LE WALLET UNIQUEMENT POUR LES PAIEMENTS EN LIGNE
            if order.payment_method != "cash_on_delivery":
                wallet = db.query(SellerWallet).filter(
                    SellerWallet.seller_id == shop.owner_id
                ).first()
                
                if wallet:
                    transaction = db.query(Transaction).filter(
                        Transaction.order_id == order.id
                    ).first()
                    
                    if transaction:
                        seller_amount = transaction.seller_amount
                        wallet.pending_balance -= seller_amount
                        wallet.balance += seller_amount
            
        elif old_status == "delivered":
            # Commande n'est plus livrée → retirer du CA
            shop.total_revenue -= order.total_amount
            
            # ❌ ANNULER LE TRANSFERT DU WALLET (cas rare)
            if order.payment_method != "cash_on_delivery":
                wallet = db.query(SellerWallet).filter(
                    SellerWallet.seller_id == shop.owner_id
                ).first()
                
                if wallet:
                    transaction = db.query(Transaction).filter(
                        Transaction.order_id == order.id
                    ).first()
                    
                    if transaction:
                        seller_amount = transaction.seller_amount
                        wallet.balance -= seller_amount
                        wallet.pending_balance += seller_amount
    
    db.commit()
    db.refresh(order)

    # AJOUTER L'AUDIT
    audit = AuditService(db)
    await audit.log_update(
        resource_type="order",
        resource_id=order_id,
        old_values={"status": old_status},
        new_values={"status": order.status},
        user_id=current_user.id,
        user_email=current_user.email,
        request=request,
        shop_id=shop.id
    )
    
    return {"message": "Commande mise à jour avec succès", "order": order}

# @router.put("/{order_id}")
# async def update_order_status(
#     request:Request,
#     shop_slug: str,
#     order_id: str,
#     update_data: OrderUpdate,
#     db: Session = Depends(get_db),
#     current_user: User = Depends(get_current_user)
# ):
#     """Mettre à jour le statut d'une commande"""
#     shop = db.query(Shop).filter(Shop.slug == shop_slug).first()
#     if not shop:
#         raise HTTPException(status_code=404, detail="Boutique non trouvée")
    
#     if shop.owner_id != current_user.id:
#         raise HTTPException(status_code=403, detail="Accès non autorisé")
    
#     order = db.query(Order).filter(
#         Order.id == order_id,
#         Order.shop_id == shop.id
#     ).first()
    
#     if not order:
#         raise HTTPException(status_code=404, detail="Commande non trouvée")
    
#     old_status = order.status
#     update_dict = update_data.dict(exclude_unset=True)
    
#     for field, value in update_dict.items():
#         setattr(order, field, value)
    
#     # Mettre à jour les stats de la boutique si nécessaire
#     if old_status != order.status:
#         if order.status == "delivered":
#             # Commande marquée comme livrée → ajouter au CA
#             shop.total_revenue += order.total_amount
#         elif old_status == "delivered":
#             # Commande n'est plus livrée → retirer du CA
#             shop.total_revenue -= order.total_amount
    
#     db.commit()
#     db.refresh(order)

#     # AJOUTER L'AUDIT
#     audit = AuditService(db)
#     await audit.log_update(
#         resource_type="order",
#         resource_id=order_id,
#         old_values={"status": old_status},
#         new_values={"status": order.status},
#         user_id=current_user.id,
#         user_email=current_user.email,
#         request=request,
#         shop_id=shop.id
#     )
    
#     return {"message": "Commande mise à jour avec succès", "order": order}


@router.post("/{order_id}/cancel")
async def cancel_order(
    shop_slug: str,
    order_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Annuler une commande"""
    shop = db.query(Shop).filter(Shop.slug == shop_slug).first()
    if not shop:
        raise HTTPException(status_code=404, detail="Boutique non trouvée")
    
    if shop.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Accès non autorisé")
    
    order = db.query(Order).filter(
        Order.id == order_id,
        Order.shop_id == shop.id
    ).first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Commande non trouvée")
    
    # Vérifier si la commande peut être annulée
    if order.status in ["shipped", "delivered"]:
        raise HTTPException(
            status_code=400, 
            detail="Impossible d'annuler une commande déjà expédiée"
        )
    
    order.status = "cancelled"
    db.commit()
    
    return {"message": "Commande annulée avec succès"}