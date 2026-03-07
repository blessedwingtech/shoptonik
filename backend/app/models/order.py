from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.database import Base
import uuid

class Order(Base):
    __tablename__ = "orders"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    order_number = Column(String, unique=True, nullable=False, index=True)
    shop_id = Column(String, ForeignKey("shops.id"), nullable=False)
    customer_id = Column(String, ForeignKey("users.id"), nullable=True)

    # Informations client (peut être différent du compte utilisateur)
    customer_name = Column(String, nullable=False)
    customer_email = Column(String, nullable=False)
    customer_phone = Column(String, nullable=True)
    customer_address = Column(JSON, nullable=False)  # {street, city, postal_code, country}

    # Détails de la commande
    items = Column(JSON, nullable=False)  # Liste des produits
    subtotal = Column(Float, nullable=False)
    shipping_fee = Column(Float, default=0.0)
    tax_amount = Column(Float, default=0.0)
    total_amount = Column(Float, nullable=False)

    # Livraison
    shipping_method = Column(String, nullable=True)
    shipping_address = Column(JSON, nullable=True)
    tracking_number = Column(String, nullable=True)

    # Paiement
    payment_method = Column(String, nullable=True)  # stripe, paypal, cash
    payment_status = Column(String, default="pending")  # pending, paid, failed, refunded
    payment_id = Column(String, nullable=True)

    # Statut
    status = Column(String, default="pending")  # pending, processing, shipped, delivered, cancelled
    notes = Column(String, nullable=True)

    # Métadonnées
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relations
    shop = relationship("Shop", back_populates="orders")
    customer = relationship("User", back_populates="orders")
    
    # AJOUTEZ CETTE RELATION (correspond à OrderItem.order)
    order_items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    # Relation manquante avec Transaction 
    transactions = relationship("Transaction", back_populates="order", cascade="all, delete-orphan")
    payment_confirmed = Column(Boolean, default=False)

    def __repr__(self):
        return f"<Order {self.order_number}>"


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    order_id = Column(String, ForeignKey("orders.id"), nullable=False)
    product_id = Column(String, ForeignKey("products.id"), nullable=False)

    # Informations au moment de la commande (en cas de modification du produit après)
    product_name = Column(String, nullable=False)
    product_price = Column(Float, nullable=False)  # Prix unitaire au moment de la commande
    product_sku = Column(String, nullable=True)
    product_image = Column(String, nullable=True)

    quantity = Column(Integer, nullable=False)
    total_price = Column(Float, nullable=False)  # price * quantity

    # Relations
    order = relationship("Order", back_populates="order_items")  # CHANGÉ: "items" → "order_items"
    product = relationship("Product")