from sqlalchemy import Column, String, Integer, Text, DateTime, JSON, ForeignKey, CheckConstraint, Boolean
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
    description = Column(Text)
    price = Column(Integer, nullable=False)  # en centimes
    stock = Column(Integer, default=0)
    images = Column(JSON, default=list)
    category = Column(String(100))
    sku = Column(String(50), unique=True, index=True, nullable=True)
    
    # Status
    is_active = Column(Boolean, default=True)
    is_featured = Column(Boolean, default=False)
    
    # Détails supplémentaires
    weight_grams = Column(Integer, default=0)
    dimensions = Column(JSON, default=dict)  # {length: 10, width: 5, height: 3}
    tags = Column(JSON, default=list)
    
    # SEO
    meta_title = Column(String(200), nullable=True)
    meta_description = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relations
    shop = relationship("Shop", back_populates="products")

    # Contraintes
    __table_args__ = (
        CheckConstraint('price > 0', name='check_price_positive'),
        CheckConstraint('stock >= 0', name='check_stock_non_negative'),
    )

    def __repr__(self):
        return f"<Product {self.name} (${self.price/100:.2f})>"

    def to_dict(self):
        """Convertir l'objet en dictionnaire"""
        return {
            'id': self.id,
            'shop_id': self.shop_id,
            'name': self.name,
            'description': self.description,
            'price': self.price,
            'stock': self.stock,
            'images': self.images,
            'category': self.category,
            'sku': self.sku,
            'is_active': self.is_active,
            'is_featured': self.is_featured,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'formatted_price': self.formatted_price
        }

    @property
    def formatted_price(self):
        """Retourne le prix formaté en euros"""
        return f"{self.price / 100:.2f} €"

    def is_available(self):
        """Vérifie si le produit est disponible (en stock)"""
        return self.is_active and self.stock > 0

    def update_stock(self, quantity: int):
        """Mettre à jour le stock"""
        if self.stock + quantity < 0:
            raise ValueError("Stock insuffisant")
        self.stock += quantity
        return self.stock

        