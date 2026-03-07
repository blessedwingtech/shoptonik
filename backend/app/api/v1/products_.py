from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.api.v1.auth import oauth2_scheme
from app.core.security import decode_token
from app.schemas.product import ProductCreate, ProductResponse
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

@router.post("/", response_model=ProductResponse)
async def create_product(
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
            detail="Boutique non trouvée"
        )
    
    # Vérifier si le SKU existe déjà
    if product_data.sku:
        existing_product = db.query(Product).filter(
            Product.sku == product_data.sku,
            Product.shop_id == shop.id
        ).first()
        
        if existing_product:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Un produit avec ce SKU existe déjà"
            )
    
    # Créer le produit
    product = Product(
        shop_id=shop.id,
        name=product_data.name,
        description=product_data.description,
        price=product_data.price,  # en centimes
        stock=product_data.stock,
        images=product_data.images or [],
        category=product_data.category,
        sku=product_data.sku
    )
    
    try:
        db.add(product)
        shop.total_products += 1
        db.commit()
        db.refresh(product)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la création du produit: {str(e)}"
        )
    
    return product

@router.get("/", response_model=List[ProductResponse])
async def get_products(
    shop_slug: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Récupérer tous les produits d'une boutique
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
    
    # Récupérer tous les produits de la boutique
    products = db.query(Product).filter(
        Product.shop_id == shop.id
    ).order_by(Product.created_at.desc()).all()
    
    return products

@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(
    shop_slug: str,
    product_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Récupérer un produit spécifique
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
        Product.id == product_id,
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
    shop_slug: str,
    product_id: str,
    product_data: ProductCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Mettre à jour un produit
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
        Product.id == product_id,
        Product.shop_id == shop.id
    ).first()
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Produit non trouvé"
        )
    
    # Vérifier si le SKU existe déjà (pour un autre produit)
    if product_data.sku and product_data.sku != product.sku:
        existing_product = db.query(Product).filter(
            Product.sku == product_data.sku,
            Product.shop_id == shop.id,
            Product.id != product_id
        ).first()
        
        if existing_product:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Un autre produit avec ce SKU existe déjà"
            )
    
    # Mettre à jour le produit
    try:
        product.name = product_data.name
        product.description = product_data.description
        product.price = product_data.price
        product.stock = product_data.stock
        product.images = product_data.images or []
        product.category = product_data.category
        product.sku = product_data.sku
        
        db.commit()
        db.refresh(product)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la mise à jour du produit: {str(e)}"
        )
    
    return product

@router.delete("/{product_id}")
async def delete_product(
    shop_slug: str,
    product_id: str,
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
        Product.id == product_id,
        Product.shop_id == shop.id
    ).first()
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Produit non trouvé"
        )
    
    try:
        db.delete(product)
        shop.total_products = max(0, shop.total_products - 1)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la suppression du produit: {str(e)}"
        )
    
    return {"message": "Produit supprimé avec succès"}

    