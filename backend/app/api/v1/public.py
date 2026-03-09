from datetime import datetime
from operator import or_
from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response, status
from app.models.order import Order
from app.models.user import User
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.models.shop import Shop
from app.models.product import Product

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from typing import List
 
from app.core.categories import get_shop_categories, get_product_categories

router = APIRouter(prefix="/public", tags=["public"])


# NOUVELLE ROUTE : Stats publiques de la plateforme
@router.get("/stats")
async def get_platform_stats(
    db: Session = Depends(get_db)
):
    """Get public platform statistics (no auth required)"""
    
    # Compter les boutiques actives
    total_shops = db.query(func.count(Shop.id)).filter(
        Shop.is_active == True
    ).scalar() or 0
    
    # Compter les produits actifs
    total_products = db.query(func.count(Product.id)).filter(
        Product.is_active == True
    ).scalar() or 0
    
    # Compter les commandes livrées
    total_orders = db.query(func.count(Order.id)).filter(
        Order.status == "delivered"
    ).scalar() or 0
    
    # Calculer le CA total (commandes livrées uniquement)
    revenue_result = db.query(func.sum(Order.total_amount)).filter(
        Order.status == "delivered"
    ).scalar()
    total_revenue = float(revenue_result) if revenue_result else 0.0
    
    # Compter les vendeurs uniques (propriétaires de boutiques actives)
    total_sellers = db.query(func.count(func.distinct(Shop.owner_id))).filter(
        Shop.is_active == True
    ).scalar() or 0
    
    # Compter les utilisateurs totaux (optionnel)
    total_users = db.query(func.count(User.id)).filter(
        User.is_active == True
    ).scalar() or 0
    
    return {
        "total_shops": total_shops,
        "total_products": total_products,
        "total_orders": total_orders,
        "total_revenue": round(total_revenue, 2),  # en euros
        "total_sellers": total_sellers,
        "total_users": total_users,
        "updated_at": datetime.utcnow().isoformat()
    }



@router.get("/shops")
async def get_public_shops(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100
):
    """Get all public shops for visitors (no auth required)"""
    shops = db.query(Shop).filter(Shop.is_active == True).offset(skip).limit(limit).all()
    
    if not shops:
        return []
    
    return [
        {
            "id": shop.id,
            "name": shop.name,
            "slug": shop.slug,
            "description": shop.description,
            "category": shop.category,
            "total_products": shop.total_products
        }
        for shop in shops
    ]


@router.get("/shops/{slug}")
async def get_public_shop(
    slug: str,
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

    return {
        "id": shop.id,
        "name": shop.name,
        "slug": shop.slug,
        "description": shop.description,
        "category": shop.category,
        "owner_id": shop.owner_id,
        "total_products": shop.total_products,
        "created_at": shop.created_at.isoformat() if shop.created_at else None,
        
        # 👇 AJOUTEZ CES 2 LIGNES
        "meta_title": shop.meta_title,
        "meta_description": shop.meta_description,
        
        # 👇 AJOUTEZ AUSSI CES CHAMPS SI VOUS VOULEZ
        "logo_url": shop.logo_url,
        "email": shop.email,
        "phone": shop.phone,
        "address": shop.address,
        "city": shop.city,
        "country": shop.country,
        "website": shop.website,
        "instagram": shop.instagram,
        "facebook": shop.facebook,
        "twitter": shop.twitter,
        "about_story": shop.about_story,
        "about_mission": shop.about_mission,
        "about_values": shop.about_values,
        "about_commitments": shop.about_commitments,
        "business_hours": shop.business_hours,
        "shipping_info": shop.shipping_info,
        "return_policy": shop.return_policy,
        "payment_methods": shop.payment_methods,
        "about_image1_url": shop.about_image1_url,
        "about_image2_url": shop.about_image2_url,
        "accepted_payment_methods": shop.accepted_payment_methods,
    }

    
# @router.get("/shops/{slug}")
# async def get_public_shop(
#     slug: str,
#     db: Session = Depends(get_db)
# ):
#     """Get a single shop by slug (public access)"""
#     shop = db.query(Shop).filter(
#         Shop.slug == slug,
#         Shop.is_active == True
#     ).first()
    
#     if not shop:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail="Shop not found"
#         )
    
#     return {
#         "id": shop.id,
#         "name": shop.name,
#         "slug": shop.slug,
#         "description": shop.description,
#         "category": shop.category,
#         "owner_id": shop.owner_id,
#         "total_products": shop.total_products,
#         "created_at": shop.created_at.isoformat() if shop.created_at else None,
#         "meta_title": shop.meta_title,
#         "meta_description": shop.meta_description,
#     }


# @router.get("/shops/{slug}/products")
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
#         Product.shop_id == shop.id
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
#             "view_count": product.view_count,
#             "tags": product.tags,
#             "created_at": product.created_at.isoformat() if product.created_at else None
#         }
#         for product in products
#     ]
@router.get("/shops/{slug}/products")
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
    
    # Appliquer les filtres (comme dans shops.py)
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
    
    # Retourner TOUS les champs nécessaires
    return [
        {
            "id": product.id,
            "name": product.name,
            "slug": product.slug,
            "description": product.description,
            "price": product.price,
            "compare_price": product.compare_price,
            "stock": product.stock,
            "images": product.images if product.images else [],
            "category": product.category,
            "sku": product.sku,
            "shop_id": product.shop_id,
            "is_active": product.is_active,
            "is_featured": product.is_featured,  # ← IMPORTANT
            "is_digital": product.is_digital,
            "digital_url": product.digital_url,
            "weight_grams": product.weight_grams,
            "dimensions": product.dimensions,
            "tags": product.tags,
            "variations": product.variations,
            "meta_title": product.meta_title,
            "meta_description": product.meta_description,
            "view_count": product.view_count,
            "created_at": product.created_at.isoformat() if product.created_at else None,
            "updated_at": product.updated_at.isoformat() if product.updated_at else None,
            "formatted_price": f"{product.price / 100:.2f} €",
            "formatted_compare_price": f"{product.compare_price / 100:.2f} €" if product.compare_price else None,
            "has_discount": bool(product.compare_price and product.compare_price > product.price),
            "discount_percentage": int(((product.compare_price - product.price) / product.compare_price) * 100) if product.compare_price and product.compare_price > product.price else 0,
            "is_available": product.is_available
        }
        for product in products
    ]

# Ajoutez cette fonction à la fin du fichier public.py
# @router.get("/products/{product_id}")
# async def get_public_product(
#     product_id: str,
#     db: Session = Depends(get_db)
# ):
#     """Get a single product by ID (public access)"""
#     product = db.query(Product).filter(
#         Product.id == product_id,
#         Product.is_active == True  # Seulement les produits actifs
#     ).first()
    
#     if not product:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail="Product not found"
#         )
    
#     # Vérifier que la boutique est active
#     shop = db.query(Shop).filter(Shop.id == product.shop_id, Shop.is_active == True).first()
#     if not shop:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail="Product's shop is not available"
#         )
    
#     try:
#         product.increment_views()
#         db.commit()
#         db.refresh(product)
#     except Exception:
#         db.rollback()
    
#     # Formatage des données
#     return {
#         "id": product.id,
#         "name": product.name,
#         "slug": product.slug,
#         "description": product.description,
#         "price": product.price,
#         "compare_price": product.compare_price,
#         "stock": product.stock,
#         "images": product.images if product.images else [],
#         "category": product.category,
#         "sku": product.sku,
#         "shop_id": product.shop_id,
#         "shop_slug": shop.slug,  # Important pour le frontend
#         "shop_name": shop.name,
#         "is_digital": product.is_digital,
#         "digital_url": product.digital_url,
#         "weight_grams": product.weight_grams,
#         "dimensions": product.dimensions,
#         "tags": product.tags,
#         "variations": product.variations,
#         "meta_title": product.meta_title,
#         "meta_description": product.meta_description,
#         "view_count": product.view_count,
#         "created_at": product.created_at.isoformat() if product.created_at else None,
#         "updated_at": product.updated_at.isoformat() if product.updated_at else None,
#         # Propriétés calculées
#         "formatted_price": f"{product.price / 100:.2f} €",
#         "formatted_compare_price": f"{product.compare_price / 100:.2f} €" if product.compare_price else None,
#         "has_discount": bool(product.compare_price and product.compare_price > product.price),
#         "discount_percentage": int(((product.compare_price - product.price) / product.compare_price) * 100) if product.compare_price and product.compare_price > product.price else 0,
#         "is_available": product.is_available
#     }

@router.get("/products/{product_id}")
async def get_public_product(
    product_id: str,
    request: Request,  # ← AJOUTER
    response: Response,  # ← AJOUTER
    db: Session = Depends(get_db)
):
    """Get a single product by ID (public access)"""
    product = db.query(Product).filter(
        Product.id == product_id,
        Product.is_active == True
    ).first()
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    # Vérifier que la boutique est active
    shop = db.query(Shop).filter(Shop.id == product.shop_id, Shop.is_active == True).first()
    if not shop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product's shop is not available"
        )
    
    # ✅ LOGIQUE DE COMPTAGE DES VUES (1 seule fois, bien placée)
    from datetime import datetime, timedelta
    
    last_view = request.cookies.get(f"last_view_{product_id}")
    now = datetime.utcnow()
    
    should_count = True
    if last_view:
        try:
            last_view_time = datetime.fromisoformat(last_view)
            # Ne compter qu'une fois toutes les 24h par appareil
            if now - last_view_time < timedelta(hours=24):
                should_count = False
        except:
            pass
    
    if should_count:
        try:
            product.increment_views()
            db.commit()
            
            # Définir un cookie pour 24h
            response.set_cookie(
                key=f"last_view_{product_id}",
                value=now.isoformat(),
                max_age=86400,  # 24h en secondes
                httponly=True,
                samesite="lax"
            )
        except Exception:
            db.rollback()
            # Ne pas bloquer l'affichage si l'incrémentation échoue
    
    # Formatage des données (avec la view_count déjà mise à jour)
    return {
        "id": product.id,
        "name": product.name,
        "slug": product.slug,
        "description": product.description,
        "price": product.price,
        "compare_price": product.compare_price,
        "stock": product.stock,
        "images": product.images if product.images else [],
        "category": product.category,
        "sku": product.sku,
        "shop_id": product.shop_id,
        "shop_slug": shop.slug,
        "shop_name": shop.name,
        "is_digital": product.is_digital,
        "digital_url": product.digital_url,
        "weight_grams": product.weight_grams,
        "dimensions": product.dimensions,
        "tags": product.tags,
        "variations": product.variations,
        "meta_title": product.meta_title,
        "meta_description": product.meta_description,
        "view_count": product.view_count,  # ← Déjà incrémenté si nécessaire
        "created_at": product.created_at.isoformat() if product.created_at else None,
        "updated_at": product.updated_at.isoformat() if product.updated_at else None,
        "formatted_price": f"{product.price / 100:.2f} €",
        "formatted_compare_price": f"{product.compare_price / 100:.2f} €" if product.compare_price else None,
        "has_discount": bool(product.compare_price and product.compare_price > product.price),
        "discount_percentage": int(((product.compare_price - product.price) / product.compare_price) * 100) if product.compare_price and product.compare_price > product.price else 0,
        "is_available": product.is_available
    }
 

@router.get("/categories/shops")
async def get_shop_categories_list():
    """Obtenir la liste des catégories pour les boutiques"""
    return get_shop_categories()

@router.get("/categories/products")
async def get_product_categories_list():
    """Obtenir la liste des catégories pour les produits"""
    return get_product_categories()


from sqlalchemy import or_, and_, func, Index, text
from sqlalchemy.orm import Session
import logging

logger = logging.getLogger(__name__)

@router.get("/search/instant")
async def search_products_instant(
    db: Session = Depends(get_db),
    q: str = Query(..., min_length=2, max_length=100),
    limit: int = Query(6, ge=1, le=20)
):
    """
    Recherche ultra-rapide avec indexation PostgreSQL
    Version professionnelle pour très gros volumes
    """
    search_term = q.strip().lower()
    
    try:
        # Version avec full-text search si PostgreSQL
        if db.bind.dialect.name == 'postgresql':
            # Utiliser l'index GIN pour la recherche plein texte
            products = db.execute(
                text("""
                    SELECT 
                        p.id, p.name, p.slug, p.price, 
                        p.images, p.category, p.description,
                        p.tags, s.name as shop_name,
                        ts_rank(to_tsvector('french', p.name || ' ' || p.description), 
                                plainto_tsquery('french', :q)) as rank
                    FROM products p
                    JOIN shops s ON p.shop_id = s.id
                    WHERE p.is_active = true 
                      AND s.is_active = true
                      AND (
                          to_tsvector('french', p.name || ' ' || p.description) @@ 
                          plainto_tsquery('french', :q)
                          OR p.name ILIKE :pattern
                          OR s.name ILIKE :pattern
                      )
                    ORDER BY rank DESC, p.view_count DESC
                    LIMIT :limit
                """),
                {"q": search_term, "pattern": f"%{search_term}%", "limit": limit}
            ).fetchall()
        else:
            # Fallback pour SQLite/MySQL
            conditions = [
                Product.name.ilike(f"%{search_term}%"),
                Product.category.ilike(f"%{search_term}%"),
                Shop.name.ilike(f"%{search_term}%"),
                Product.description.ilike(f"%{search_term}%")
            ]
            
            # Combiner les conditions efficacement
            from functools import reduce
            final_condition = reduce(lambda x, y: or_(x, y), conditions)
            
            products = db.query(
                Product.id,
                Product.name,
                Product.slug,
                Product.price,
                Product.images,
                Product.category,
                Product.description,
                Product.tags,
                Shop.name.label('shop_name')
            ).join(
                Shop, 
                and_(Product.shop_id == Shop.id, Shop.is_active == True)
            ).filter(
                Product.is_active == True,
                final_condition
            ).order_by(
                func.length(Product.name).asc(),
                Product.view_count.desc()
            ).limit(limit).all()
        
        return {
            "products": [
                {
                    "id": p.id,
                    "name": p.name,
                    "slug": p.slug,
                    "price": p.price,
                    "image": p.images[0] if p.images and len(p.images) > 0 else None,
                    "shop_name": p.shop_name,
                    "category": p.category,
                    "description": p.description[:80] + "..." if p.description and len(p.description) > 80 else p.description,
                    "tags": p.tags[:3] if p.tags else []
                }
                for p in products
            ],
            "query": search_term,
            "total": len(products)
        }
        
    except Exception as e:
        logger.error(f"Erreur de recherche instantanée: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors de la recherche"
        )
    

@router.get("/search/products")
async def search_products_global(
    db: Session = Depends(get_db),
    q: Optional[str] = Query(None, description="Terme de recherche"),
    category: Optional[str] = Query(None, description="Filtrer par catégorie"),
    min_price: Optional[int] = Query(None, ge=0, description="Prix minimum (centimes)"),
    max_price: Optional[int] = Query(None, ge=0, description="Prix maximum (centimes)"),
    in_stock: Optional[bool] = Query(None, description="Uniquement en stock"),
    tags: Optional[str] = Query(None, description="Tags séparés par des virgules"),
    sort_by: str = Query("relevance", pattern="^(relevance|price_asc|price_desc|newest|popular)$"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=50)
):
    """
    Recherche globale de produits dans toute la plateforme
    """
    # Construire la requête de base
    query = db.query(Product).join(Shop).filter(
        Product.is_active == True,
        Shop.is_active == True
    )
    
    # Appliquer les filtres
    if q:
        # Version corrigée - On crée les conditions une par une
        name_condition = Product.name.ilike(f"%{q}%")
        desc_condition = Product.description.ilike(f"%{q}%")
        
        # Combiner les conditions avec OR
        search_filter = or_(name_condition, desc_condition)
        query = query.filter(search_filter)
    
    if category:
        query = query.filter(Product.category == category)
    
    if min_price is not None:
        query = query.filter(Product.price >= min_price)
    
    if max_price is not None:
        query = query.filter(Product.price <= max_price)
    
    if in_stock is True:
        query = query.filter(Product.stock > 0)
    elif in_stock is False:
        query = query.filter(Product.stock == 0)
    
    if tags:
        tag_list = [tag.strip() for tag in tags.split(',')]
        for tag in tag_list:
            query = query.filter(Product.tags.contains([tag]))
    
    # Appliquer le tri
    if sort_by == "price_asc":
        query = query.order_by(Product.price.asc())
    elif sort_by == "price_desc":
        query = query.order_by(Product.price.desc())
    elif sort_by == "newest":
        query = query.order_by(Product.created_at.desc())
    elif sort_by == "popular":
        query = query.order_by(Product.view_count.desc())
    else:  # relevance
        if q:
            query = query.order_by(func.length(Product.name).asc())
        else:
            query = query.order_by(Product.created_at.desc())
    
    # Pagination
    #total = query.count()
    total = query.with_entities(func.count(Product.id)).scalar()
    
    products = query.offset((page - 1) * limit).limit(limit).all()
    
    # Obtenir toutes les catégories disponibles
    categories = db.query(Product.category).distinct().filter(
        Product.category.isnot(None),
        Product.is_active == True
    ).all()
    categories = [c[0] for c in categories if c[0]]
    
    return {
        "products": [
            {
                "id": p.id,
                "name": p.name,
                "slug": p.slug,
                "description": p.description[:150] + "..." if p.description and len(p.description) > 150 else p.description,
                "price": p.price,
                "compare_price": p.compare_price,
                "stock": p.stock,
                "images": p.images,
                "category": p.category,
                "tags": p.tags,
                "view_count": p.view_count,
                "shop_id": p.shop_id,
                "shop_name": p.shop.name,
                "shop_slug": p.shop.slug,
                "formatted_price": f"{p.price / 100:.2f} €",
                "formatted_compare_price": f"{p.compare_price / 100:.2f} €" if p.compare_price else None,
                "has_discount": p.has_discount,
                "discount_percentage": p.discount_percentage,
                "is_available": p.is_available,
                "created_at": p.created_at.isoformat() if p.created_at else None
            }
            for p in products
        ],
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "pages": (total + limit - 1) // limit
        },
        "filters": {
            "categories": categories,
            "min_price_available": db.query(func.min(Product.price)).filter(
                Product.is_active == True
            ).scalar() or 0,
            "max_price_available": db.query(func.max(Product.price)).filter(
                Product.is_active == True
            ).scalar() or 100000
        }
    }

# @router.get("/products/tag/{tag}")
# async def get_products_by_tag(
#     tag: str,
#     db: Session = Depends(get_db),
#     page: int = Query(1, ge=1),
#     limit: int = Query(20, ge=1, le=50),
#     sort_by: str = Query("relevance", pattern="^(relevance|newest|price_asc|price_desc|popular)$")
# ):
#     """
#     Récupérer tous les produits avec un tag spécifique
#     """
#     from urllib.parse import unquote
#     import sqlalchemy as sa
    
#     # Nettoyer le tag
#     raw_tag = unquote(tag)
#     clean_tag = raw_tag.strip().lower()
    
#     print(f"🔍 Recherche de produits avec tag: '{clean_tag}'")
    
#     # Construire la requête de base
#     query = db.query(Product).join(Shop).filter(
#         Product.is_active == True,
#         Shop.is_active == True
#     )
    
#     # Version simple : on cherche le tag dans le tableau JSON
#     # Pour PostgreSQL, on peut utiliser le contenu JSON
#     if db.bind.dialect.name == 'postgresql':
#         # Pour PostgreSQL, on peut chercher dans le tableau JSON
#         query = query.filter(Product.tags.contains([clean_tag]))
#     else:
#         # Pour SQLite/MySQL, on convertit en texte et on cherche
#         query = query.filter(
#             sa.cast(Product.tags, sa.String).ilike(f'%{clean_tag}%')
#         )
    
#     # Appliquer le tri
#     if sort_by == "price_asc":
#         query = query.order_by(Product.price.asc())
#     elif sort_by == "price_desc":
#         query = query.order_by(Product.price.desc())
#     elif sort_by == "newest":
#         query = query.order_by(Product.created_at.desc())
#     elif sort_by == "popular":
#         query = query.order_by(Product.view_count.desc())
#     else:
#         query = query.order_by(Product.created_at.desc())
    
#     # Pagination
#     total = query.with_entities(func.count(Product.id)).scalar()
#     print(f"🔍 Produits trouvés: {total}")
    
#     products = query.offset((page - 1) * limit).limit(limit).all()
    
#     # Formater la réponse
#     return {
#         "products": [
#             {
#                 "id": p.id,
#                 "name": p.name,
#                 "slug": p.slug,
#                 "description": p.description[:150] + "..." if p.description and len(p.description) > 150 else p.description,
#                 "price": p.price,
#                 "compare_price": p.compare_price,
#                 "stock": p.stock,
#                 "images": p.images,
#                 "category": p.category,
#                 "tags": p.tags,
#                 "view_count": p.view_count,
#                 "shop_id": p.shop_id,
#                 "shop_name": p.shop.name,
#                 "shop_slug": p.shop.slug,
#                 "formatted_price": f"{p.price / 100:.2f} €",
#                 "formatted_compare_price": f"{p.compare_price / 100:.2f} €" if p.compare_price else None,
#                 "has_discount": p.has_discount,
#                 "discount_percentage": p.discount_percentage,
#                 "is_available": p.is_available,
#                 "created_at": p.created_at.isoformat() if p.created_at else None
#             }
#             for p in products
#         ],
#         "pagination": {
#             "page": page,
#             "limit": limit,
#             "total": total,
#             "pages": (total + limit - 1) // limit
#         },
#         "tag": clean_tag
#     }

@router.get("/products/tag/{tag}")
async def get_products_by_tag(
    tag: str,
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=50),
    sort_by: str = Query("relevance")
):
    from urllib.parse import unquote
    import sqlalchemy as sa
    import unicodedata
    
    def normalize_text(text: str) -> str:
        """Enlève les accents et met en minuscules"""
        if not text:
            return text
        nfkd_form = unicodedata.normalize('NFKD', text)
        return ''.join([c for c in nfkd_form if not unicodedata.combining(c)]).lower()
    
    # Nettoyer le tag reçu
    raw_tag = unquote(tag)
    clean_tag = raw_tag.strip()
    normalized_tag = normalize_text(clean_tag)
    
    print(f"🔍 Tag original reçu: '{tag}'")
    print(f"🔍 Tag après unquote: '{raw_tag}'")
    print(f"🔍 Tag nettoyé: '{clean_tag}'")
    print(f"🔍 Tag normalisé: '{normalized_tag}'")
    
    # Récupérer quelques produits pour voir leurs tags
    sample_products = db.query(Product).filter(
        Product.tags.isnot(None),
        Product.is_active == True
    ).limit(5).all()
    
    print("📦 Échantillons de produits avec leurs tags:")
    for p in sample_products:
        print(f"  - Produit: {p.name}")
        print(f"    Tags originaux: {p.tags}")
        if p.tags:
            normalized_product_tags = [normalize_text(t) for t in p.tags]
            print(f"    Tags normalisés: {normalized_product_tags}")
    
    # Construire la requête
    query = db.query(Product).join(Shop).filter(
        Product.is_active == True,
        Shop.is_active == True
    )
    
    # Récupérer tous les produits et filtrer après normalisation
    all_products = query.all()
    print(f"📊 Total produits actifs: {len(all_products)}")
    
    filtered_products = []
    for product in all_products:
        if product.tags and isinstance(product.tags, list):
            # Normaliser chaque tag du produit
            normalized_product_tags = [normalize_text(t) for t in product.tags]
            if normalized_tag in normalized_product_tags:
                filtered_products.append(product)
                print(f"✅ Produit trouvé: {product.name} (tags: {product.tags})")
    
    print(f"🔍 Produits trouvés après normalisation: {len(filtered_products)}")
    
    # Appliquer la pagination manuellement
    total = len(filtered_products)
    start = (page - 1) * limit
    end = start + limit
    products = filtered_products[start:end]
    
    # Formater la réponse
    return {
        "products": [
            {
                "id": p.id,
                "name": p.name,
                "slug": p.slug,
                "description": p.description[:150] + "..." if p.description and len(p.description) > 150 else p.description,
                "price": p.price,
                "compare_price": p.compare_price,
                "stock": p.stock,
                "images": p.images,
                "category": p.category,
                "tags": p.tags,
                "view_count": p.view_count,
                "shop_id": p.shop_id,
                "shop_name": p.shop.name,
                "shop_slug": p.shop.slug,
                "formatted_price": f"{p.price / 100:.2f} €",
                "formatted_compare_price": f"{p.compare_price / 100:.2f} €" if p.compare_price else None,
                "has_discount": p.has_discount,
                "discount_percentage": p.discount_percentage,
                "is_available": p.is_available,
                "created_at": p.created_at.isoformat() if p.created_at else None
            }
            for p in products
        ],
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "pages": (total + limit - 1) // limit if total > 0 else 0
        },
        "tag": clean_tag
    }

 