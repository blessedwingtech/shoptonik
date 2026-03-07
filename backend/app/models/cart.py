from sqlalchemy import Column, String, Integer, Float, JSON, ForeignKey
from sqlalchemy.orm import relationship
from ..core.database import Base
import uuid

class Cart(Base):
    __tablename__ = "carts"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=True)  # Null pour guest
    session_id = Column(String, nullable=True)  # Pour les utilisateurs non connectés
    shop_id = Column(String, ForeignKey("shops.id"), nullable=False)
    
    # Métadonnées
    created_at = Column(String)  # ou DateTime
    updated_at = Column(String)
    
    # Relation avec les items
    items = relationship("CartItem", back_populates="cart", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Cart {self.id}>"


class CartItem(Base):
    __tablename__ = "cart_items"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    cart_id = Column(String, ForeignKey("carts.id"), nullable=False)
    product_id = Column(String, ForeignKey("products.id"), nullable=False)
    
    # Données du produit (snapshot au moment de l'ajout)
    product_name = Column(String, nullable=False)
    product_price = Column(Float, nullable=False)  # Prix unitaire
    product_image = Column(String, nullable=True)
    product_sku = Column(String, nullable=True)
    
    quantity = Column(Integer, nullable=False, default=1)
    
    # Relations
    cart = relationship("Cart", back_populates="items")
    product = relationship("Product")
    
    def __repr__(self):
        return f"<CartItem {self.product_name} x{self.quantity}>"
    