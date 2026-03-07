from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Request, status
from app.models.order import Order
from app.services.audit import AuditService
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
import random
from app.core.database import get_db
from app.api.v1.auth import oauth2_scheme
from app.core.security import decode_token
from app.schemas.shop import ShopCreate, ShopResponse, ShopUpdate, ShopWithStats
from app.models.user import User
from app.models.shop import Shop
from app.models.product import Product
from services.shop_service import ShopService

router = APIRouter(prefix="/shops", tags=["shops"])

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """Dépendance pour récupérer l'utilisateur courant"""
    payload = decode_token(token)
    
    if not payload or payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalide"
        )
    
    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utilisateur non trouvé"
        )
    
    return user

@router.post("/", response_model=ShopResponse)
async def create_shop(
    request: Request,
    shop_data: ShopCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Créer une nouvelle boutique"""
    
    # Vérifier si l'utilisateur peut créer une boutique
    max_shops = current_user.get_max_shops()
    
    if not current_user.can_create_shop(max_shops):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Limite de {max_shops} boutique(s) atteinte"
        )
    
    # Générer un slug unique
    base_slug = shop_data.name.lower().replace(" ", "-").replace("'", "").replace(".", "")
    slug = base_slug
    counter = 1
    
    while db.query(Shop).filter(Shop.slug == slug).first():
        slug = f"{base_slug}-{random.randint(1000, 9999)}"
        counter += 1
    
    # Créer la boutique
    shop = Shop(
        owner_id=current_user.id,
        name=shop_data.name,
        slug=slug,
        description=shop_data.description,
        category=shop_data.category
    )
    
    db.add(shop)
    
    # Mettre à jour le compteur de l'utilisateur
    current_user.total_shops += 1
    
    db.commit()
    db.refresh(shop)
    
    # Mettre à jour les stats
    shop.update_stats()

    # Journaliser
    audit = AuditService(db)
    await audit.log_create(
        resource_type="shop",
        resource_id=shop.id,
        values={"name": shop.name, "category": shop.category, "description": shop.description},
        user_id=current_user.id,
        user_email=current_user.email,
        request=request,
        shop_id=shop.id
    )
    
    return shop

@router.get("/", response_model=List[ShopResponse])
async def list_shops(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lister toutes les boutiques de l'utilisateur"""
    shops = db.query(Shop).filter(Shop.owner_id == current_user.id).all()
    # Optionnel : mettre à jour les stats avant de renvoyer
    for shop in shops:
        shop.update_stats(db)  # pour avoir des chiffres frais
    
    db.commit()  # sauvegarder les stats mises à jour
    return shops



@router.get("/{shop_slug}", response_model=ShopWithStats)
async def get_shop(
    shop_slug: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Récupérer une boutique spécifique"""
    shop = db.query(Shop).filter(
        Shop.slug == shop_slug,
        Shop.owner_id == current_user.id
    ).first()
    
    if not shop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Boutique non trouvée"
        )
    
    # Mettre à jour les stats
    shop.update_stats()
    
    return shop

# @router.get("/{shop_slug}/stats")
# async def get_shop_stats(
#     shop_slug: str,
#     current_user: User = Depends(get_current_user),
#     db: Session = Depends(get_db)
# ):
#     """Récupérer les statistiques d'une boutique"""
#     shop = db.query(Shop).filter(
#         Shop.slug == shop_slug,
#         Shop.owner_id == current_user.id
#     ).first()
    
#     if not shop:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail="Boutique non trouvée"
#         )
    
#     # Stats dynamiques
#     stats = {
#         "shop_id": shop.id,
#         "shop_name": shop.name,
#         "stats": {
#             "total_products": shop.total_products,
#             "total_orders": shop.total_orders,
#             "total_revenue": shop.total_revenue / 100,  # Convertir en euros
#             "total_visitors": shop.total_visitors,
#             "conversion_rate": round((shop.total_orders / shop.total_visitors * 100) if shop.total_visitors > 0 else 0, 2)
#         },
#         "period": "all_time",
#         "updated_at": shop.updated_at.isoformat()
#     }
    
#     return stats


# === ROUTES PUBLIQUES (sans authentification) ===

@router.get("/public/shops")
async def get_public_shops(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100
):
    """Get all public shops for visitors (no auth required)"""
    shops = db.query(Shop).filter(Shop.is_active == True).offset(skip).limit(limit).all()
    
    return [
        {
            "id": shop.id,
            "name": shop.name,
            "slug": shop.slug,
            "description": shop.description,
            "category": shop.category,
            "total_products": len(shop.products)
        }
        for shop in shops
    ]


@router.get("/public/shops/{slug}")
async def get_public_shop(
    slug: str,
    request: Request,
    db: Session = Depends(get_db)
):
    """Get a single shop by slug (public access)"""
    shop = db.query(Shop).filter(
        Shop.slug == slug,
        Shop.is_active == True
    ).first()
    
    if not shop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shop not found"
        )
    
     # ✅ AJOUTER LA LOGIQUE DE COMPTAGE (avec session)
    viewed_shop_key = f"viewed_shop_{shop.id}"
    
    if not request.session.get(viewed_shop_key):
        shop.total_visitors += 1
        db.commit()
        request.session[viewed_shop_key] = True
    
    # 👇 RETOURNEZ TOUS LES CHAMPS NÉCESSAIRES
    return {
        "id": shop.id,
        "name": shop.name,
        "slug": shop.slug,
        "description": shop.description,
        "category": shop.category,
        "owner_id": shop.owner_id,
        "total_products": len(shop.products),
        "created_at": shop.created_at.isoformat() if shop.created_at else None,
        
        # 👇 AJOUTEZ TOUS CES CHAMPS
        "currency": shop.currency,
        "language": shop.language,
        "timezone": shop.timezone,
        
        # Branding
        "logo_url": shop.logo_url,
        "banner_url": shop.banner_url,
        "primary_color": shop.primary_color,
        "secondary_color": shop.secondary_color,
        
        # Contact
        "email": shop.email,
        "phone": shop.phone,
        "address": shop.address,
        "city": shop.city,
        "country": shop.country,
        "postal_code": shop.postal_code,
        
        # Réseaux sociaux
        "website": shop.website,
        "instagram": shop.instagram,
        "facebook": shop.facebook,
        "twitter": shop.twitter,
        
        # SEO
        "meta_title": shop.meta_title,
        "meta_description": shop.meta_description,
        
        # Status
        "is_active": shop.is_active,
        "is_verified": shop.is_verified,
        "subscription_plan": shop.subscription_plan,
        
        # Stats
        "total_products": shop.total_products,
        "total_orders": shop.total_orders,
        "total_revenue": shop.total_revenue,
        "total_visitors": shop.total_visitors,
        
        # Nouveaux champs "À propos"
        "about_story": shop.about_story,
        "about_mission": shop.about_mission,
        "about_values": shop.about_values,
        "about_commitments": shop.about_commitments,
        
        # Informations supplémentaires
        "business_hours": shop.business_hours,
        "shipping_info": shop.shipping_info,
        "return_policy": shop.return_policy,
        "payment_methods": shop.payment_methods,
        
        # Images pour la page "À propos"
        "about_image1_url": shop.about_image1_url,
        "about_image2_url": shop.about_image2_url,
        
        "accepted_payment_methods": shop.accepted_payment_methods,
        
        "updated_at": shop.updated_at.isoformat() if shop.updated_at else None
    }

# @router.get("/public/shops/{slug}/products")
# async def get_public_shop_products(
#     slug: str,
#     db: Session = Depends(get_db),
#     skip: int = 0,
#     limit: int = 100
# ):
#     """Get products from a shop (public access)"""
#     shop = db.query(Shop).filter(
#         Shop.slug == slug,
#         Shop.is_active == True
#     ).first()
    
#     if not shop:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail="Shop not found"
#         )
    
#     products = db.query(Product).filter(
#         Product.shop_id == shop.id,
#         Product.is_active == True  # Ajoutez ce filtre si votre modèle Product a ce champ
#     ).offset(skip).limit(limit).all()
    
#     return [
#         {
#             "id": product.id,
#             "name": product.name,
#             "description": product.description,
#             "price": product.price,
#             "stock": product.stock,
#             "images": product.images if product.images else [],
#             "category": product.category,
#             "sku": product.sku,
#             "shop_id": product.shop_id,
#             "created_at": product.created_at.isoformat() if product.created_at else None
#         }
#         for product in products
#     ]

@router.get("/public/shops/{slug}/products")
async def get_public_shop_products(
    slug: str,
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    category: Optional[str] = None,
    featured: Optional[bool] = None,
    digital: Optional[bool] = None,
    min_price: Optional[int] = None,
    max_price: Optional[int] = None,
    in_stock: Optional[bool] = None,
    tag: Optional[str] = None,
    search: Optional[str] = None,
    sort_by: Optional[str] = "created_at",
    sort_order: Optional[str] = "desc"
):
    """Get products from a shop (public access)"""
    shop = db.query(Shop).filter(
        Shop.slug == slug,
        Shop.is_active == True
    ).first()
    
    if not shop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shop not found"
        )
    
    # Construire la requête de base
    query = db.query(Product).filter(
        Product.shop_id == shop.id,
        Product.is_active == True
    )
    
    # Appliquer les filtres
    if category:
        query = query.filter(Product.category == category)
    
    if featured is not None:
        query = query.filter(Product.is_featured == featured)
    
    if digital is not None:
        query = query.filter(Product.is_digital == digital)
    
    if min_price is not None:
        query = query.filter(Product.price >= min_price)
    
    if max_price is not None:
        query = query.filter(Product.price <= max_price)
    
    if in_stock is not None:
        if in_stock:
            query = query.filter(Product.stock > 0)
        else:
            query = query.filter(Product.stock <= 0)
    
    if tag:
        query = query.filter(Product.tags.contains([tag]))
    
    if search:
        query = query.filter(
            Product.name.ilike(f"%{search}%") |
            Product.description.ilike(f"%{search}%") |
            Product.category.ilike(f"%{search}%")
        )
    
    # Appliquer le tri
    if sort_by == "created_at":
        order_column = Product.created_at
    elif sort_by == "name":
        order_column = Product.name
    elif sort_by == "price":
        order_column = Product.price
    elif sort_by == "view_count":
        order_column = Product.view_count
    else:
        order_column = Product.created_at
    
    if sort_order == "desc":
        query = query.order_by(order_column.desc())
    else:
        query = query.order_by(order_column.asc())
    
    products = query.offset(skip).limit(limit).all()
    
    # Retourner tous les champs nécessaires pour le frontend
    return [
        {
            "id": product.id,
            "name": product.name,
            "slug": product.slug,  # ← AJOUTÉ
            "description": product.description,
            "price": product.price,
            "compare_price": product.compare_price,  # ← AJOUTÉ
            "stock": product.stock,
            "images": product.images if product.images else [],
            "category": product.category,
            "sku": product.sku,
            "shop_id": product.shop_id,
            "is_active": product.is_active,  # ← AJOUTÉ
            "is_featured": product.is_featured,  # ← AJOUTÉ
            "is_digital": product.is_digital,  # ← AJOUTÉ
            "digital_url": product.digital_url,  # ← AJOUTÉ
            "weight_grams": product.weight_grams,  # ← AJOUTÉ
            "dimensions": product.dimensions,  # ← AJOUTÉ
            "tags": product.tags,  # ← AJOUTÉ
            "variations": product.variations,  # ← AJOUTÉ
            "meta_title": product.meta_title,  # ← AJOUTÉ
            "meta_description": product.meta_description,  # ← AJOUTÉ
            "view_count": product.view_count,  # ← AJOUTÉ
            "created_at": product.created_at.isoformat() if product.created_at else None,
            "updated_at": product.updated_at.isoformat() if product.updated_at else None,
            # Propriétés calculées - IMPORTANT !
            "price": product.price,
            "formatted_price": f"{product.price / 100:.2f} €",
            "formatted_compare_price": f"{product.compare_price / 100:.2f} €" if product.compare_price else None,
            "has_discount": bool(product.compare_price and product.compare_price > product.price),
            "discount_percentage": int(((product.compare_price - product.price) / product.compare_price) * 100) if product.compare_price and product.compare_price > product.price else 0,
            "is_available": product.is_available  # ← PROPRIÉTÉ PYTHON
        }
        for product in products
    ]
    

# backend/app/api/v1/shops.py

@router.get("/{shop_slug}/stats")
async def get_shop_stats(
    shop_slug: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtenir les statistiques d'une boutique (calculées à la demande)"""
    shop = db.query(Shop).filter(Shop.slug == shop_slug).first()
    if not shop:
        raise HTTPException(status_code=404, detail="Boutique non trouvée")

    if shop.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Accès non autorisé")

    # 1. Stats produits (inchangé)
    total_products = db.query(func.count(Product.id)).filter(
        Product.shop_id == shop.id,
        Product.is_active == True
    ).scalar() or 0
    
    # 2. Valeur du stock (inchangé)
    stock_result = db.query(
        func.sum(Product.price * Product.stock)
    ).filter(
        Product.shop_id == shop.id,
        Product.is_active == True
    ).scalar()
    stock_value = float(stock_result) / 100 if stock_result else 0.0 
    
    # ✅ 3. Stats commandes avec le FILTRE INTELLIGENT
    base_query = db.query(Order).filter(
        Order.shop_id == shop.id,
        (Order.payment_method == 'cash_on_delivery') | (Order.payment_confirmed == True)
    )
    
    total_orders = base_query.count()
    
    # Commandes livrées (parmi les commandes valides)
    delivered_orders = base_query.filter(Order.status == "delivered").count()
    
    # CA (commandes livrées ET valides)
    ca_result = base_query.filter(
        Order.status == "delivered"
    ).with_entities(func.sum(Order.total_amount)).scalar()
    total_revenue = float(ca_result) if ca_result else 0.0
    
    # Commandes par statut (parmi les commandes valides)
    pending_count = base_query.filter(Order.status == "pending").count()
    processing_count = base_query.filter(Order.status == "processing").count()
    shipped_count = base_query.filter(Order.status == "shipped").count()
    cancelled_count = base_query.filter(Order.status == "cancelled").count()
    
    # 5. Conversion rate (visiteurs -> commandes)
    conversion_rate = (total_orders / shop.total_visitors * 100) if shop.total_visitors > 0 else 0

    return {
        "shop_id": shop.id,
        "shop_name": shop.name,
        "stats": {
            # Produits
            "total_products": total_products,
            "stock_value": round(stock_value, 2),
            
            # Commandes
            "total_orders": total_orders,
            "delivered_orders": delivered_orders,
            "pending_count": pending_count,
            "processing_count": processing_count,
            "shipped_count": shipped_count,
            "cancelled_count": cancelled_count,

            # Finances
            "total_revenue": round(total_revenue, 2),
            
            # Trafic
            "total_visitors": shop.total_visitors,
            "conversion_rate": round(conversion_rate, 2)
        },
        "period": "all_time",
        "updated_at": datetime.utcnow().isoformat()
    }
 


@router.put("/{shop_slug}")
async def update_shop(
    request: Request,
    shop_slug: str,
    shop_data: ShopUpdate,  # Utilisez le schéma ShopUpdate que vous avez
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mettre à jour les informations d'une boutique"""
    shop = db.query(Shop).filter(
        Shop.slug == shop_slug,
        Shop.owner_id == current_user.id
    ).first()
    
    if not shop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Boutique non trouvée"
        )
    
    # Mettre à jour les champs
    update_data = shop_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(shop, field, value)
    
    db.commit()
    db.refresh(shop)

    # AJOUTER L'AUDIT
    audit = AuditService(db)
    await audit.log_update(
        resource_type="shop",
        resource_id=shop.id,
        old_values={...},  # À définir
        new_values=update_data,
        user_id=current_user.id,
        user_email=current_user.email,
        request=request,
        shop_id=shop.id
    )
    
    return shop

