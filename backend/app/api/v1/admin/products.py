from fastapi import APIRouter, Depends, HTTPException, Query, Request
from app.models import shop
from app.services.audit import AuditService
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, func
from typing import List, Optional
from datetime import datetime
from app.core.database import get_db
from app.api.v1.auth import get_current_user
from app.models.product import Product
from app.models.shop import Shop
from app.models.user import User
from pydantic import BaseModel

router = APIRouter(prefix="/products", tags=["admin-products"])

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

class ProductAdminResponse(BaseModel):
    id: str
    name: str
    slug: str
    description: Optional[str]
    price: int
    compare_price: Optional[int]
    stock: int
    images: List[str]
    category: Optional[str]
    shop_id: str
    shop_name: Optional[str]
    shop_slug: Optional[str]
    owner_name: Optional[str]
    is_active: bool
    is_featured: bool
    is_digital: bool
    view_count: int
    has_discount: bool
    discount_percentage: int
    formatted_price: str
    formatted_compare_price: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True

@router.get("/", response_model=List[ProductAdminResponse])
async def get_products(
    status: Optional[str] = Query(None, description="Filtrer par statut: all, active, inactive"),
    search: Optional[str] = Query(None, description="Recherche par nom ou description"),
    shop_id: Optional[str] = Query(None, description="Filtrer par boutique"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user)
):
    """Lister tous les produits (admin seulement)"""
    
    # Construire la requête avec jointures
    query = db.query(
        Product,
        Shop.name.label("shop_name"),
        Shop.slug.label("shop_slug"),
        User.username.label("owner_name")
    ).join(Shop, Product.shop_id == Shop.id)\
     .join(User, Shop.owner_id == User.id)
    
    # Filtrer par statut
    if status == "active":
        query = query.filter(Product.is_active == True)
    elif status == "inactive":
        query = query.filter(Product.is_active == False)
    
    # Filtrer par boutique
    if shop_id:
        query = query.filter(Product.shop_id == shop_id)
    
    # Recherche
    if search:
        search_filter = or_(
            Product.name.ilike(f"%{search}%"),
            Product.description.ilike(f"%{search}%"),
            Shop.name.ilike(f"%{search}%")
        )
        query = query.filter(search_filter)
    
    # Pagination
    #total = query.count()
    total = query.with_entities(func.count()).scalar()
    results = query.order_by(Product.created_at.desc()).offset((page-1)*limit).limit(limit).all()
    
    # Formater les résultats
    products = []
    for product, shop_name, shop_slug, owner_name in results:
        product_dict = {
            "id": product.id,
            "name": product.name,
            "slug": product.slug,
            "description": product.description,
            "price": product.price,
            "compare_price": product.compare_price,
            "stock": product.stock,
            "images": product.images,
            "category": product.category,
            "shop_id": product.shop_id,
            "shop_name": shop_name,
            "shop_slug": shop_slug,
            "owner_name": owner_name,
            "is_active": product.is_active,
            "is_featured": product.is_featured,
            "is_digital": product.is_digital,
            "view_count": product.view_count,
            "has_discount": product.has_discount,
            "discount_percentage": product.discount_percentage,
            "formatted_price": product.formatted_price,
            "formatted_compare_price": product.formatted_compare_price,
            "created_at": product.created_at
        }
        products.append(product_dict)
    
    return products

@router.get("/{product_id}")
async def get_product(
    product_id: str,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user)
):
    """Obtenir les détails d'un produit"""
    
    result = db.query(
        Product,
        Shop.name.label("shop_name"),
        Shop.slug.label("shop_slug"),
        User.username.label("owner_name")
    ).join(Shop, Product.shop_id == Shop.id)\
     .join(User, Shop.owner_id == User.id)\
     .filter(Product.id == product_id).first()
    
    if not result:
        raise HTTPException(404, "Produit non trouvé")
    
    product, shop_name, shop_slug, owner_name = result
    
    return {
        "id": product.id,
        "name": product.name,
        "slug": product.slug,
        "description": product.description,
        "price": product.price,
        "compare_price": product.compare_price,
        "stock": product.stock,
        "images": product.images,
        "category": product.category,
        "shop_id": product.shop_id,
        "shop_name": shop_name,
        "shop_slug": shop_slug,
        "owner_name": owner_name,
        "is_active": product.is_active,
        "is_featured": product.is_featured,
        "is_digital": product.is_digital,
        "view_count": product.view_count,
        "has_discount": product.has_discount,
        "discount_percentage": product.discount_percentage,
        "formatted_price": product.formatted_price,
        "formatted_compare_price": product.formatted_compare_price,
        "created_at": product.created_at
    }

@router.post("/{product_id}/toggle-status")
async def toggle_product_status(
    request:Request,
    product_id: str,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user)
):
    """Activer/désactiver un produit"""
    
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(404, "Produit non trouvé")
    
    old_value = product.is_active

    product.is_active = not product.is_active
    db.commit()

    audit = AuditService(db)
    await audit.log_update(
        resource_type="product",
        resource_id=product_id,
        old_values={"is_active": old_value},
        new_values={"is_active": product.is_active},
        user_id=admin.id,
        user_email=admin.email,
        request=request,
        shop_id=product.shop_id
    )
    return {
        "message": f"Produit {'activé' if product.is_active else 'désactivé'}",
        "is_active": product.is_active
    }

@router.post("/{product_id}/toggle-featured")
async def toggle_product_featured(
    request:Request,
    product_id: str,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user)
):
    """Mettre/enlever un produit en vedette"""
    
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(404, "Produit non trouvé")
    
    old_value = product.is_featured
    product.is_featured = not product.is_featured
    db.commit()
    
    audit = AuditService(db)
    await audit.log_update(
        resource_type="product",
        resource_id=product_id,
        old_values={"is_featured": old_value},
        new_values={"is_featured": product.is_featured},
        user_id=admin.id,
        user_email=admin.email,
        request=request,
        shop_id=product.shop_id
    )
    return {
        "message": f"Produit {'ajouté aux' if product.is_featured else 'retiré des'} vedettes",
        "is_featured": product.is_featured
    }

@router.delete("/{product_id}", status_code=204)
async def delete_product(
    request: Request,
    product_id: str,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user)
):
    """Supprimer définitivement un produit"""
    
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(404, "Produit non trouvé")
    
    product_info = {
        "name": product.name,
        "price": product.price,
        "sku": product.sku
    }

    db.delete(product)
    db.commit()

    # Journaliser
    audit = AuditService(db)
    await audit.log_delete(
        resource_type="product",
        resource_id=str(product_id),
        values=product_info,
        user_id=get_current_user.id,
        user_email=get_current_user.email,
        request=request,
        shop_id=shop.id
    )
    
    return None  # 204 No Content
