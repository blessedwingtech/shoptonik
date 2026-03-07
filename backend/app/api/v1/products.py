from fastapi import APIRouter, Body, Depends, HTTPException, Request, status, Query, Path, UploadFile, File, Form
from app.services.audit import AuditService
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, update, func
from typing import List, Optional, Dict, Any
import re 
from slugify import slugify
import uuid
import json
from datetime import datetime
from uuid import UUID  # ← AJOUT IMPORT UUID

from app.core.database import get_db
from app.api.v1.auth import oauth2_scheme
from app.core.security import decode_token
from app.schemas.product import (
    ProductCreate, 
    ProductUpdate, 
    ProductResponse, 
    ProductPublicResponse,
    ProductListResponse,
    ProductSearchQuery
)
from app.models.user import User
from app.models.shop import Shop
from app.models.product import Product

router = APIRouter(prefix="/shops/{shop_slug}/products", tags=["products"])

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """Récupérer l'utilisateur courant depuis le token"""
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

def generate_sku(product_name: str, shop_id: str) -> str:
    """Générer un SKU automatique"""
    prefix = shop_id[:4].upper().replace('-', '')
    name_part = re.sub(r'[^A-Z0-9]', '', product_name.upper())[:6]
    if not name_part:
        name_part = "PROD"
    random_part = str(uuid.uuid4().int)[:4]
    return f"{prefix}-{name_part}-{random_part}"

def generate_unique_slug(base_slug: str, shop_id: str, db: Session, exclude_product_id: UUID = None) -> str:
    """Générer un slug unique pour un produit"""
    slug = base_slug
    counter = 1
    
    while True:
        query = db.query(Product).filter(
            Product.slug == slug,
            Product.shop_id == shop_id
        )
        
        if exclude_product_id:
            query = query.filter(Product.id != str(exclude_product_id))
        
        existing_product = query.first()
        
        if not existing_product:
            break
        
        slug = f"{base_slug}-{counter}"
        counter += 1
    
    return slug

# ============ ROUTES PRIVÉES (nécessitent authentification) ============

@router.post("/", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
    request: Request,
    shop_slug: str,
    product_data: ProductCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Créer un nouveau produit dans une boutique
    """
    # Vérifier que la boutique existe et appartient à l'utilisateur
    shop = db.query(Shop).filter(
        Shop.slug == shop_slug,
        Shop.owner_id == current_user.id
    ).first()
    
    if not shop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Boutique non trouvée ou vous n'êtes pas le propriétaire"
        )
    
    # Générer le slug s'il n'est pas fourni
    base_slug = product_data.slug or slugify(product_data.name)
    slug = generate_unique_slug(base_slug, shop.id, db)
    
    # Générer SKU auto si non fourni
    sku = product_data.sku or generate_sku(product_data.name, shop.id)
    
    # Vérifier si le SKU existe déjà
    if sku:
        existing_product = db.query(Product).filter(
            Product.sku == sku,
            Product.shop_id == shop.id
        ).first()
        
        if existing_product:
            # Générer un autre SKU
            sku = generate_sku(product_data.name, shop.id)
            
            # Vérifier à nouveau
            existing_product = db.query(Product).filter(
                Product.sku == sku,
                Product.shop_id == shop.id
            ).first()
            
            if existing_product:
                # Utiliser UUID comme fallback
                sku = f"{shop.id[:4].upper().replace('-', '')}-{uuid.uuid4().hex[:8].upper()}"
    
    # Créer le produit
    product = Product(
        shop_id=shop.id,
        name=product_data.name,
        slug=slug,
        description=product_data.description,
        price=product_data.price,
        compare_price=product_data.compare_price,
        stock=product_data.stock,
        images=product_data.images or [],
        category=product_data.category,
        sku=sku,
        is_active=product_data.is_active,
        is_featured=product_data.is_featured,
        is_digital=product_data.is_digital,
        digital_url=product_data.digital_url,
        weight_grams=product_data.weight_grams,
        dimensions=product_data.dimensions or {},
        tags=product_data.tags or [],
        variations=product_data.variations or [],
        meta_title=product_data.meta_title,
        meta_description=product_data.meta_description
    )
    
    # try:
    #     db.add(product)
    #     shop.total_products += 1
    #     db.commit()
    #     db.refresh(product)
    # except Exception as e:
    #     db.rollback()
    #     raise HTTPException(
    #         status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
    #         detail=f"Erreur lors de la création du produit: {str(e)}"
    #     )
    from sqlalchemy.exc import IntegrityError, SQLAlchemyError
    import logging

    logger = logging.getLogger(__name__)

    try:
        db.add(product)
        shop.total_products += 1
        db.commit()
        db.refresh(product)
    except IntegrityError as e:
        db.rollback()
        logger.error(f"Intégrité des données: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Un produit avec ces informations existe déjà"
        )
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Erreur base de données: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors de la sauvegarde"
        )
    
    # Journaliser
    audit = AuditService(db)
    await audit.log_create(
        resource_type="product",
        resource_id=product.id,
        values={
            "name": product.name,
            "price": product.price,
            "stock": product.stock,
            "category": product.category
        },
        user_id=current_user.id,
        user_email=current_user.email,
        request=request,
        shop_id=shop.id
    )
    
    return product

@router.get("/", response_model=List[ProductResponse])
async def get_shop_products(
    shop_slug: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1, description="Numéro de page"),
    per_page: int = Query(20, ge=1, le=100, description="Nombre d'éléments par page"),
    category: Optional[str] = Query(None, description="Filtrer par catégorie"),
    is_featured: Optional[bool] = Query(None, description="Produits en vedette uniquement"),
    is_active: Optional[bool] = Query(None, description="Produits actifs uniquement"),
    is_digital: Optional[bool] = Query(None, description="Produits numériques uniquement"),
    min_price: Optional[int] = Query(None, ge=0, description="Prix minimum (centimes)"),
    max_price: Optional[int] = Query(None, ge=0, description="Prix maximum (centimes)"),
    in_stock: Optional[bool] = Query(None, description="Produits en stock uniquement"),
    search: Optional[str] = Query(None, description="Recherche dans nom/description")
):
    """
    Récupérer tous les produits d'une boutique (avec pagination et filtres)
    """
    # Vérifier que la boutique existe et appartient à l'utilisateur
    shop = db.query(Shop).filter(
        Shop.slug == shop_slug,
        Shop.owner_id == current_user.id
    ).first()
    
    if not shop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Boutique non trouvée"
        )
    
    # Calculer l'offset
    offset = (page - 1) * per_page
    
    # Construire la requête
    query = db.query(Product).filter(Product.shop_id == shop.id)
    
    # Appliquer les filtres
    if category:
        query = query.filter(Product.category == category)
    if is_featured is not None:
        query = query.filter(Product.is_featured == is_featured)
    if is_active is not None:
        query = query.filter(Product.is_active == is_active)
    if is_digital is not None:
        query = query.filter(Product.is_digital == is_digital)
    if min_price is not None:
        query = query.filter(Product.price >= min_price)
    if max_price is not None:
        query = query.filter(Product.price <= max_price)
    if in_stock is True:
        query = query.filter(Product.stock > 0)
    elif in_stock is False:
        query = query.filter(Product.stock == 0)
    if search:
        search_filter = or_(
            Product.name.ilike(f"%{search}%"),
            Product.description.ilike(f"%{search}%"),
            Product.sku.ilike(f"%{search}%")
        )
        query = query.filter(search_filter)
    
    # Compter le total (pour la pagination)
    #total = query.count()
    total = query.with_entities(func.count()).scalar()
    
    # Appliquer la pagination et le tri
    #products = query.order_by(Product.created_at.desc()).offset(offset).limit(per_page).all()
    from sqlalchemy.orm import selectinload

    products = query.options(
        selectinload(Product.shop)  # Charge tous les shops en 1 requête
    ).order_by(Product.created_at.desc()).offset(offset).limit(per_page).all()

    return products


@router.get("/by-slug/{product_slug}", response_model=ProductResponse)
async def get_product_by_slug(
    shop_slug: str,
    product_slug: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Récupérer un produit par son slug
    """
    # Vérifier que la boutique existe et appartient à l'utilisateur
    shop = db.query(Shop).filter(
        Shop.slug == shop_slug,
        Shop.owner_id == current_user.id
    ).first()
    
    if not shop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Boutique non trouvée"
        )
    
    # Récupérer le produit
    product = db.query(Product).filter(
        Product.slug == product_slug,
        Product.shop_id == shop.id
    ).first()
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Produit non trouvé"
        )
    
    return product

@router.get("/{product_id}", response_model=ProductResponse)
async def get_product_by_id(
    shop_slug: str,
    product_id: UUID = Path(..., description="UUID du produit"),  # ← CHANGER À UUID
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Récupérer un produit par son ID
    """
    # Vérifier que la boutique existe et appartient à l'utilisateur
    shop = db.query(Shop).filter(
        Shop.slug == shop_slug,
        Shop.owner_id == current_user.id
    ).first()
    
    if not shop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Boutique non trouvée"
        )
    
    # Récupérer le produit
    product = db.query(Product).filter(
        Product.id == str(product_id),  # ← CONVERTIR UUID EN STRING
        Product.shop_id == shop.id
    ).first()
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Produit non trouvé"
        )
    
    return product

@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(
    request: Request,
    shop_slug: str,
    product_id: UUID = Path(..., description="UUID du produit"),
    product_data: ProductUpdate = Body(...),  # ← AJOUTER Body(...)
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Mettre à jour un produit (PATCH partiel)
    """
    # Vérifier que la boutique existe et appartient à l'utilisateur
    shop = db.query(Shop).filter(
        Shop.slug == shop_slug,
        Shop.owner_id == current_user.id
    ).first()
    
    if not shop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Boutique non trouvée"
        )
    
    # Récupérer le produit
    product = db.query(Product).filter(
        Product.id == str(product_id),
        Product.shop_id == shop.id
    ).first()
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Produit non trouvé"
        )
    old_values = {
        "name": product.name,
        "price": product.price,
        "stock": product.stock,
        "category": product.category,
        "is_active": product.is_active
    }
    # Vérifier si le SKU existe déjà (pour un autre produit)
    if product_data.sku is not None and product_data.sku != product.sku:
        existing_product = db.query(Product).filter(
            Product.sku == product_data.sku,
            Product.shop_id == shop.id,
            Product.id != str(product_id)
        ).first()
        
        if existing_product:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Un autre produit avec ce SKU existe déjà"
            )
    
    # Vérifier si le slug existe déjà (pour un autre produit)
    if product_data.slug is not None and product_data.slug != product.slug:
        existing_product = db.query(Product).filter(
            Product.slug == product_data.slug,
            Product.shop_id == shop.id,
            Product.id != str(product_id)
        ).first()
        
        if existing_product:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Un autre produit avec ce slug existe déjà"
            )
    
    # Mettre à jour le produit (uniquement les champs fournis)
    try:
        # Convertir les données en dict et exclure les None et champs non fournis
        update_data = product_data.model_dump(exclude_unset=True)
        
        for field, value in update_data.items():
            if hasattr(product, field) and value is not None:
                setattr(product, field, value)
        
        db.commit()
        db.refresh(product)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la mise à jour du produit: {str(e)}"
        )
    
     # Nouvelles valeurs
    new_values = {
        "name": product.name,
        "price": product.price,
        "stock": product.stock,
        "category": product.category,
        "is_active": product.is_active
    }
    
    # Journaliser
    audit = AuditService(db)
    await audit.log_update(
        resource_type="product",
        resource_id=str(product_id),
        old_values=old_values,
        new_values=new_values,
        user_id=current_user.id,
        user_email=current_user.email,
        request=request,
        shop_id=shop.id
    )

    return product

@router.patch("/{product_id}/stock", response_model=ProductResponse)
async def update_product_stock(
    shop_slug: str,
    product_id: UUID = Path(..., description="UUID du produit"),  # ← CHANGER À UUID
    quantity: int = Query(..., description="Quantité à ajouter/retirer"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Mettre à jour le stock d'un produit (atomiquement)
    """
    # Vérifier que la boutique existe et appartient à l'utilisateur
    shop = db.query(Shop).filter(
        Shop.slug == shop_slug,
        Shop.owner_id == current_user.id
    ).first()
    
    if not shop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Boutique non trouvée"
        )
    
    # Update atomique avec vérification de stock
    try:
        stmt = (
            update(Product)
            .where(and_(
                Product.id == str(product_id),
                Product.shop_id == shop.id,
                Product.stock + quantity >= 0  # Empêche stock négatif
            ))
            .values(stock=Product.stock + quantity)
            .returning(Product)
        )
        
        result = db.execute(stmt)
        product = result.scalar_one_or_none()
        db.commit()
        
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Produit non trouvé ou stock insuffisant"
            )
            
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la mise à jour du stock: {str(e)}"
        )
    
    return product

@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    request: Request,
    shop_slug: str,
    product_id: UUID = Path(..., description="UUID du produit"),  # ← CHANGER À UUID
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Supprimer un produit
    """
    # Vérifier que la boutique existe et appartient à l'utilisateur
    shop = db.query(Shop).filter(
        Shop.slug == shop_slug,
        Shop.owner_id == current_user.id
    ).first()
    
    if not shop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Boutique non trouvée"
        )
    
    # Récupérer le produit
    product = db.query(Product).filter(
        Product.id == str(product_id),
        Product.shop_id == shop.id
    ).first()
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Produit non trouvé"
        )
    
    product_info = {
        "name": product.name,
        "price": product.price,
        "sku": product.sku
    }
    try:
        db.delete(product)
        shop.total_products = max(0, shop.total_products - 1)
        db.commit()
    # Journaliser
        audit = AuditService(db)
        await audit.log_delete(
            resource_type="product",
            resource_id=str(product_id),
            values=product_info,
            user_id=current_user.id,
            user_email=current_user.email,
            request=request,
            shop_id=shop.id
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la suppression du produit: {str(e)}"
        )
    
    # Retourne 204 No Content (pas de corps de réponse)

@router.post("/{product_id}/toggle-active", response_model=ProductResponse)
async def toggle_product_active(
    shop_slug: str,
    product_id: UUID = Path(..., description="UUID du produit"),  # ← CHANGER À UUID
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Activer/désactiver un produit
    """
    # Vérifier que la boutique existe et appartient à l'utilisateur
    shop = db.query(Shop).filter(
        Shop.slug == shop_slug,
        Shop.owner_id == current_user.id
    ).first()
    
    if not shop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Boutique non trouvée"
        )
    
    # Récupérer le produit
    product = db.query(Product).filter(
        Product.id == str(product_id),
        Product.shop_id == shop.id
    ).first()
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Produit non trouvé"
        )
    
    try:
        product.is_active = not product.is_active
        db.commit()
        db.refresh(product)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la mise à jour du produit: {str(e)}"
        )
    
    return product

@router.post("/{product_id}/toggle-featured", response_model=ProductResponse)
async def toggle_product_featured(
    request:Request,
    shop_slug: str,
    product_id: UUID = Path(..., description="UUID du produit"),  # ← CHANGER À UUID
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Mettre/enlever un produit en vedette
    """
    # Vérifier que la boutique existe et appartient à l'utilisateur
    shop = db.query(Shop).filter(
        Shop.slug == shop_slug,
        Shop.owner_id == current_user.id
    ).first()
    
    if not shop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Boutique non trouvée"
        )
    
    # Récupérer le produit
    product = db.query(Product).filter(
        Product.id == str(product_id),
        Product.shop_id == shop.id
    ).first()
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Produit non trouvé"
        )
    
    try:
        product.is_featured = not product.is_featured
        db.commit()
        db.refresh(product)

        audit = AuditService(db)
        await audit.log_update(  
            user_id=current_user.id,
            user_email=current_user.email,
            request=request,
            shop_id=shop.id
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la mise à jour du produit: {str(e)}"
        )
    
    return product

@router.get("/{product_id}/stats")
async def get_product_stats(
    shop_slug: str,
    product_id: UUID = Path(..., description="UUID du produit"),  # ← CHANGER À UUID
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Récupérer les statistiques d'un produit
    """
    # Vérifier que la boutique existe et appartient à l'utilisateur
    shop = db.query(Shop).filter(
        Shop.slug == shop_slug,
        Shop.owner_id == current_user.id
    ).first()
    
    if not shop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Boutique non trouvée"
        )
    
    # Récupérer le produit
    product = db.query(Product).filter(
        Product.id == str(product_id),
        Product.shop_id == shop.id
    ).first()
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Produit non trouvé"
        )
    
    # Calculer le pourcentage de stock restant
    stock_percentage = 0
    if product.stock > 0:
        stock_percentage = min(100, (product.stock / 100) * 100)
    
    return {
        "view_count": product.view_count,
        "stock_percentage": stock_percentage,
        "has_discount": product.has_discount,
        "discount_percentage": product.discount_percentage,
        "is_available": product.is_available,
        "created_days_ago": (datetime.utcnow() - product.created_at).days if product.created_at else 0,
        "last_updated_days_ago": (datetime.utcnow() - product.updated_at).days if product.updated_at else 0
    }

# ============ ROUTES PUBLIQUES (pas besoin d'authentification) ============

@router.get("/public/", response_model=List[ProductPublicResponse])
async def get_public_products(
    shop_slug: str,
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1, description="Numéro de page"),
    per_page: int = Query(20, ge=1, le=100, description="Nombre d'éléments par page"),
    category: Optional[str] = Query(None, description="Filtrer par catégorie"),
    featured: Optional[bool] = Query(None, description="Produits en vedette uniquement"),
    digital: Optional[bool] = Query(None, description="Produits numériques uniquement"),
    min_price: Optional[int] = Query(None, ge=0, description="Prix minimum (centimes)"),
    max_price: Optional[int] = Query(None, ge=0, description="Prix maximum (centimes)"),
    in_stock: Optional[bool] = Query(None, description="Produits en stock uniquement"),
    tag: Optional[str] = Query(None, description="Filtrer par tag"),
    search: Optional[str] = Query(None, description="Recherche dans nom/description"),
    sort_by: str = Query("created_at", pattern="^(created_at|name|price|view_count)$"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$")
):
    """
    Récupérer les produits publics d'une boutique
    """
    # Vérifier que la boutique existe et est active
    shop = db.query(Shop).filter(
        Shop.slug == shop_slug, 
        Shop.is_active == True
    ).first()
    
    if not shop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Boutique non trouvée"
        )
    
    # Calculer l'offset
    offset = (page - 1) * per_page
    
    # Construire la requête
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
    if in_stock is True:
        query = query.filter(Product.stock > 0)
    elif in_stock is False:
        query = query.filter(Product.stock == 0)
    if tag:
        query = query.filter(Product.tags.contains([tag]))
    if search:
        search_filter = or_(
            Product.name.ilike(f"%{search}%"),
            Product.description.ilike(f"%{search}%")
        )
        query = query.filter(search_filter)
    
    # Appliquer le tri
    sort_column = getattr(Product, sort_by)
    if sort_order == "desc":
        query = query.order_by(sort_column.desc())
    else:
        query = query.order_by(sort_column.asc())
    
    # Récupérer les produits avec pagination
    products = query.offset(offset).limit(per_page).all()
    
    return products

@router.get("/public/by-slug/{product_slug}", response_model=ProductPublicResponse)
async def get_public_product_by_slug(
    shop_slug: str,
    product_slug: str,
    db: Session = Depends(get_db)
):
    """
    Récupérer un produit public par son slug
    """
    # Vérifier que la boutique existe et est active
    shop = db.query(Shop).filter(
        Shop.slug == shop_slug, 
        Shop.is_active == True
    ).first()
    
    if not shop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Boutique non trouvée"
        )
    
    # Récupérer le produit
    product = db.query(Product).filter(
        Product.slug == product_slug,
        Product.shop_id == shop.id,
        Product.is_active == True
    ).first()
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Produit non trouvé"
        )
    
    # Incrémenter le compteur de vues
    try:
        product.increment_views()
        db.commit()
        db.refresh(product)
    except Exception:
        db.rollback()
        # Ne pas lever d'erreur si l'incrémentation échoue
    
    return product

    