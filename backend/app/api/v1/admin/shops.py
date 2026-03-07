from fastapi import APIRouter, Depends, HTTPException, Query, Request
from app.services.audit import AuditService
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, func
from typing import List, Optional
from datetime import datetime
from app.core.database import get_db
from app.api.v1.auth import get_current_user
from app.models.shop import Shop
from app.models.user import User
from pydantic import BaseModel

router = APIRouter(prefix="/shops", tags=["admin-shops"])

def get_current_admin_user(
    current_user: User = Depends(get_current_user)
):
    """Vérifier que l'utilisateur est admin"""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=403,
            detail="Accès réservé aux administrateurs"
        )
    return current_user

class ShopAdminResponse(BaseModel):
    id: str
    name: str
    slug: str
    description: Optional[str]
    category: Optional[str]
    owner_id: str
    owner_email: Optional[str]
    owner_username: Optional[str]
    is_active: bool
    is_verified: bool
    total_products: int
    total_orders: int
    total_revenue: float
    total_visitors: int
    created_at: datetime
    logo_url: Optional[str]
    banner_url: Optional[str]
    
    class Config:
        from_attributes = True

@router.get("/", response_model=List[ShopAdminResponse])
async def get_shops(
    status: Optional[str] = Query(None, description="Filtrer par statut: all, active, inactive"),
    search: Optional[str] = Query(None, description="Recherche par nom ou description"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user)
):
    """Lister toutes les boutiques (admin seulement)"""
    
    # Construire la requête avec jointure pour avoir les infos du propriétaire
    query = db.query(
        Shop,
        User.email.label("owner_email"),
        User.username.label("owner_username")
    ).join(User, Shop.owner_id == User.id)
    
    # Filtrer par statut
    if status == "active":
        query = query.filter(Shop.is_active == True)
    elif status == "inactive":
        query = query.filter(Shop.is_active == False)
    
    # Recherche
    if search:
        search_filter = or_(
            Shop.name.ilike(f"%{search}%"),
            Shop.description.ilike(f"%{search}%"),
            User.email.ilike(f"%{search}%"),
            User.username.ilike(f"%{search}%")
        )
        query = query.filter(search_filter)
    
    # Pagination
    #total = query.count()
    total = query.with_entities(func.count()).scalar()

    results = query.order_by(Shop.created_at.desc()).offset((page-1)*limit).limit(limit).all()
    
    # Formater les résultats
    shops = []
    for shop, owner_email, owner_username in results:
        shop_dict = {
            "id": shop.id,
            "name": shop.name,
            "slug": shop.slug,
            "description": shop.description,
            "category": shop.category,
            "owner_id": shop.owner_id,
            "owner_email": owner_email,
            "owner_username": owner_username,
            "is_active": shop.is_active,
            "is_verified": shop.is_verified,
            "total_products": shop.total_products,
            "total_orders": shop.total_orders,
            "total_revenue": shop.total_revenue,
            "total_visitors": shop.total_visitors,
            "created_at": shop.created_at,
            "logo_url": shop.logo_url,
            "banner_url": shop.banner_url
        }
        shops.append(shop_dict)
    
    return shops

@router.get("/{shop_id}")
async def get_shop(
    shop_id: str,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user)
):
    """Obtenir les détails d'une boutique"""
    
    result = db.query(
        Shop,
        User.email.label("owner_email"),
        User.username.label("owner_username")
    ).join(User, Shop.owner_id == User.id).filter(Shop.id == shop_id).first()
    
    if not result:
        raise HTTPException(404, "Boutique non trouvée")
    
    shop, owner_email, owner_username = result
    
    return {
        "id": shop.id,
        "name": shop.name,
        "slug": shop.slug,
        "description": shop.description,
        "category": shop.category,
        "owner_id": shop.owner_id,
        "owner_email": owner_email,
        "owner_username": owner_username,
        "is_active": shop.is_active,
        "is_verified": shop.is_verified,
        "total_products": shop.total_products,
        "total_orders": shop.total_orders,
        "total_revenue": shop.total_revenue,
        "total_visitors": shop.total_visitors,
        "created_at": shop.created_at,
        "logo_url": shop.logo_url,
        "banner_url": shop.banner_url
    }

@router.post("/{shop_id}/toggle-status")
async def toggle_shop_status(
    request:Request,
    shop_id: str,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user)
):
    """Activer/désactiver une boutique"""
    
    shop = db.query(Shop).filter(Shop.id == shop_id).first()
    if not shop:
        raise HTTPException(404, "Boutique non trouvée")
    
    shop.is_active = not shop.is_active
    db.commit()
    audit = AuditService(db)
    await audit.log_update(
        resource_type="shop",
        resource_id=shop_id,
        old_values={"is_active": not shop.is_active},
        new_values={"is_active": shop.is_active},
        user_id=admin.id,
        user_email=admin.email,
        request=request,
        shop_id=shop_id
    )
    
    return {
        "message": f"Boutique {'activée' if shop.is_active else 'désactivée'}",
        "is_active": shop.is_active
    }

@router.post("/{shop_id}/toggle-verified")
async def toggle_shop_verification(
    request:Request,
    shop_id: str,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user)
):
    """Vérifier/ne plus vérifier une boutique"""
    
    shop = db.query(Shop).filter(Shop.id == shop_id).first()
    if not shop:
        raise HTTPException(404, "Boutique non trouvée")
    
    shop.is_verified = not shop.is_verified
    db.commit()
    
    audit = AuditService(db)
    await audit.log_update(
        resource_type="shop",
        resource_id=shop_id,
        old_values={"is_verified": not shop.is_verified},
        new_values={"is_verified": shop.is_verified},
        user_id=admin.id,
        user_email=admin.email,
        request=request,
        shop_id=shop_id
    )

    return {
        "message": f"Boutique {'vérifiée' if shop.is_verified else 'non vérifiée'}",
        "is_verified": shop.is_verified
    }

@router.delete("/{shop_id}", status_code=204)
async def delete_shop(
    request:Request,
    shop_id: str,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user)
):
    """Supprimer définitivement une boutique (et tous ses produits)"""
    
    shop = db.query(Shop).filter(Shop.id == shop_id).first()
    if not shop:
        raise HTTPException(404, "Boutique non trouvée")
    shop_info = {"name": shop.name, "slug": shop.slug}
    db.delete(shop)
    db.commit()
    audit = AuditService(db)
    await audit.log_delete(
        resource_type="shop",
        resource_id=shop_id,
        values=shop_info,
        user_id=admin.id,
        user_email=admin.email,
        request=request
    )

    return None  # 204 No Content
