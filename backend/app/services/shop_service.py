from sqlalchemy.orm import Session
from sqlalchemy import func
import uuid
from datetime import datetime
from app.models.shop import Shop
from app.schemas.shop import ShopCreate, ShopUpdate
from app.core.utils import generate_slug

class ShopService:
    @staticmethod
    def create_shop(db: Session, shop_data: ShopCreate, owner_id: str) -> Shop:
        """Créer une nouvelle boutique"""
        # Générer un slug unique
        base_slug = generate_slug(shop_data.name)
        slug = base_slug
        
        # Vérifier si le slug existe déjà
        counter = 1
        while db.query(Shop).filter(Shop.slug == slug).first():
            slug = f"{base_slug}-{counter}"
            counter += 1
        
        # Créer la boutique
        db_shop = Shop(
            id=str(uuid.uuid4()),
            owner_id=owner_id,
            name=shop_data.name,
            slug=slug,
            description=shop_data.description,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        db.add(db_shop)
        db.commit()
        db.refresh(db_shop)
        return db_shop
    
    @staticmethod
    def get_shop_by_slug(db: Session, slug: str) -> Shop:
        """Récupérer une boutique par son slug"""
        return db.query(Shop).filter(Shop.slug == slug).first()
    
    @staticmethod
    def get_shops_by_owner(db: Session, owner_id: str, skip: int = 0, limit: int = 100):
        """Récupérer toutes les boutiques d'un propriétaire"""
        return db.query(Shop).filter(Shop.owner_id == owner_id).offset(skip).limit(limit).all()
    
    @staticmethod
    def update_shop(db: Session, shop: Shop, shop_data: ShopUpdate) -> Shop:
        """Mettre à jour une boutique"""
        update_data = shop_data.dict(exclude_unset=True)
        
        # Si le nom est mis à jour, mettre à jour le slug
        if 'name' in update_data and update_data['name'] != shop.name:
            base_slug = generate_slug(update_data['name'])
            slug = base_slug
            
            # Vérifier si le nouveau slug est unique
            counter = 1
            while db.query(Shop).filter(Shop.slug == slug, Shop.id != shop.id).first():
                slug = f"{base_slug}-{counter}"
                counter += 1
            
            update_data['slug'] = slug
        
        # Mettre à jour les champs
        for field, value in update_data.items():
            setattr(shop, field, value)
        
        shop.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(shop)
        return shop
    
    @staticmethod
    def delete_shop(db: Session, shop: Shop):
        """Supprimer une boutique"""
        db.delete(shop)
        db.commit()
    
    @staticmethod
    def increment_visitors(db: Session, shop_id: str) -> int:
        """Incrémenter le compteur de visiteurs"""
        shop = db.query(Shop).filter(Shop.id == shop_id).first()
        if shop:
            shop.total_visitors += 1
            db.commit()
            db.refresh(shop)
        return shop.total_visitors if shop else 0
