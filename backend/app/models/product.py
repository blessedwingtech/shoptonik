from sqlalchemy import Column, String, Integer, Text, DateTime, JSON, ForeignKey, CheckConstraint, Boolean, UniqueConstraint, Index
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from app.core.database import Base

class Product(Base):
    """Modèle SQLAlchemy pour les produits"""
    __tablename__ = "products"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    shop_id = Column(String, ForeignKey('shops.id', ondelete='CASCADE'), nullable=False, index=True)
    
    # Informations produit
    name = Column(String(200), nullable=False)
    slug = Column(String(200), nullable=False, index=True)  # Slug pour URLs SEO-friendly
    description = Column(Text)
    price = Column(Integer, nullable=False)  # en centimes
    compare_price = Column(Integer, nullable=True)  # Prix barré (pour les promotions)
    stock = Column(Integer, default=0)
    images = Column(JSON, default=list)
    category = Column(String(100))
    sku = Column(String(50), nullable=True, index=True)  # ← ENLEVER unique=True ICI
    
    # Status
    is_active = Column(Boolean, default=True)
    is_featured = Column(Boolean, default=False)
    is_digital = Column(Boolean, default=False)  # Produit numérique (pas de livraison)
    digital_url = Column(Text, nullable=True)  # URL pour les produits numériques
    
    # Détails supplémentaires
    weight_grams = Column(Integer, default=0)
    dimensions = Column(JSON, default=dict)  # {length: 10, width: 5, height: 3}
    tags = Column(JSON, default=list)
    variations = Column(JSON, default=list)  # Pour les variantes (tailles, couleurs, etc.)
    
    # SEO
    meta_title = Column(String(200), nullable=True)
    meta_description = Column(Text, nullable=True)
    
    # Statistiques
    view_count = Column(Integer, default=0)  # Compteur de vues
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relations
    shop = relationship("Shop", back_populates="products")
    cart_items = relationship("CartItem", back_populates="product", cascade="all, delete-orphan")
    order_items = relationship("OrderItem", back_populates="product")

    # Contraintes et Indexes
    __table_args__ = (
        # Contraintes de validation
        CheckConstraint('price > 0', name='check_price_positive'),
        CheckConstraint('stock >= 0', name='check_stock_non_negative'),
        CheckConstraint('compare_price IS NULL OR compare_price > 0', name='check_compare_price_positive'),
        CheckConstraint('compare_price IS NULL OR compare_price > price', name='check_compare_price_higher'),
        
        # Contraintes d'unicité PAR BOUTIQUE (pas globales)
        UniqueConstraint('shop_id', 'sku', name='unique_sku_per_shop'),
        UniqueConstraint('shop_id', 'slug', name='unique_slug_per_shop'),
        
        # Index composites pour performance
        Index('idx_product_shop_active', 'shop_id', 'is_active'),
        Index('idx_product_shop_featured', 'shop_id', 'is_featured'),
        Index('idx_product_shop_category', 'shop_id', 'category'),
        Index('idx_product_shop_created', 'shop_id', 'created_at'),
    )

    def __repr__(self):
        return f"<Product {self.name} (${self.price/100:.2f})>"

    # def to_dict(self):
    #     """Convertir l'objet en dictionnaire"""
    #     return {
    #         'id': self.id,
    #         'shop_id': self.shop_id,
    #         'name': self.name,
    #         'slug': self.slug,
    #         'description': self.description,
    #         'price': self.price,
    #         'compare_price': self.compare_price,
    #         'stock': self.stock,
    #         'images': self.images,
    #         'category': self.category,
    #         'sku': self.sku,
    #         'is_active': self.is_active,
    #         'is_featured': self.is_featured,
    #         'is_digital': self.is_digital,
    #         'digital_url': self.digital_url,
    #         'weight_grams': self.weight_grams,
    #         'dimensions': self.dimensions,
    #         'tags': self.tags,
    #         'variations': self.variations,
    #         'meta_title': self.meta_title,
    #         'meta_description': self.meta_description,
    #         'view_count': self.view_count,
    #         'created_at': self.created_at.isoformat() if self.created_at else None,
    #         'updated_at': self.updated_at.isoformat() if self.updated_at else None,
    #         'formatted_price': self.formatted_price,
    #         'has_discount': self.has_discount,
    #         'discount_percentage': self.discount_percentage,
    #         'is_available': self.is_available()
    #     }

    @property
    def formatted_price(self):
        """Retourne le prix formaté en euros"""
        return f"{self.price / 100:.2f} €"
    
    @property
    def formatted_compare_price(self):
        """Retourne le prix de comparaison formaté en euros"""
        if self.compare_price:
            return f"{self.compare_price / 100:.2f} €"
        return None

    @property
    def has_discount(self):
        """Vérifie si le produit a une réduction"""
        return bool(self.compare_price and self.compare_price > self.price)
    
    @property
    def discount_percentage(self):
        """Calcule le pourcentage de réduction"""
        if not self.has_discount:
            return 0
        return int(((self.compare_price - self.price) / self.compare_price) * 100)

    @property
    def is_available(self):
        """Vérifie si le produit est disponible (en stock)"""
        if self.is_digital:
            return self.is_active  # Les produits numériques n'ont pas de limite de stock
        return self.is_active and self.stock > 0

    def update_stock(self, quantity: int):
        """Mettre à jour le stock"""
        if self.is_digital:
            return self.stock  # Pas de gestion de stock pour les produits numériques
        
        if self.stock + quantity < 0:
            raise ValueError("Stock insuffisant")
        
        self.stock += quantity
        return self.stock
    
    def increment_views(self):
        """Incrémenter le compteur de vues"""
        self.view_count += 1
        return self.view_count
    
    def add_variation(self, name: str, options: list):
        """Ajouter une variation au produit"""
        if not self.variations:
            self.variations = []
        
        # Vérifier si la variation existe déjà
        for variation in self.variations:
            if variation.get('name') == name:
                variation['options'] = list(set(variation['options'] + options))
                break
        else:
            self.variations.append({
                'name': name,
                'options': options
            })
    
    def remove_variation(self, name: str):
        """Supprimer une variation"""
        if not self.variations:
            return
        
        self.variations = [v for v in self.variations if v.get('name') != name]
    
    def get_variant_price(self, selected_variations: dict = None):
        """Obtenir le prix pour une variante spécifique"""
        # Pour l'instant, retourne le prix de base
        # Vous pourriez étendre cette méthode pour gérer des prix différents par variante
        return self.price
    
