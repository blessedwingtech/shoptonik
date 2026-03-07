from sqlalchemy import Column, String, Boolean, DateTime, Integer
from sqlalchemy.dialects.sqlite import INTEGER
import uuid
from datetime import datetime
from app.core.database import Base
from sqlalchemy.orm import relationship

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    
    # NOUVEAUX CHAMPS POUR LE PROFIL
    phone = Column(String, nullable=True)  # ← AJOUTER
    avatar = Column(String, nullable=True)  # ← AJOUTER
    
    # Status
    is_active = Column(Boolean, default=True)
    is_seller = Column(Boolean, default=False)
    seller_approved_at = Column(DateTime, nullable=True)  # Date d'approbation
    seller_requested_at = Column(DateTime, nullable=True)  # Date de demande
    
    # Pourquoi pas aussi
    seller_company_name = Column(String, nullable=True)
    seller_vat_number = Column(String, nullable=True)  # Numéro de TVA
    seller_address = Column(String, nullable=True)
    
    is_admin = Column(Boolean, default=False)
    email_verified = Column(Boolean, default=False)
    
    # E-commerce specific
    stripe_customer_id = Column(String, nullable=True)
    stripe_account_id = Column(String, nullable=True)  # Pour vendeurs
    
    # Stats
    total_shops = Column(Integer, default=0)
    total_orders = Column(Integer, default=0)
    total_revenue = Column(Integer, default=0)  # En centimes
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relations
    shops = relationship("Shop", back_populates="owner", cascade="all, delete-orphan")
    orders = relationship("Order", back_populates="customer")

    # Relations manquantes avec Transaction 
    seller_transactions = relationship( "Transaction", foreign_keys="Transaction.seller_id", back_populates="seller", cascade="all, delete-orphan" ) 
    customer_transactions = relationship( "Transaction", foreign_keys="Transaction.customer_id", back_populates="customer", cascade="all, delete-orphan" )
    # AJOUTEZ CETTE RELATION POUR LE WALLET
    wallet = relationship("SellerWallet", back_populates="seller", uselist=False, cascade="all, delete-orphan")
    def can_create_shop(self, max_shops: int = 1) -> bool:
        """Vérifie si l'utilisateur peut créer une boutique"""
        return self.total_shops < max_shops
    
    def get_max_shops(self) -> int:
        """Retourne le nombre max de boutiques selon le statut"""
        if self.is_admin:
            return 100
        elif self.is_seller:
            return 10
        return 1  # Basic user
    
    @property
    def total_revenue_euros(self) -> float:
        """Retourne le revenu total en euros"""
        return self.total_revenue / 100 if self.total_revenue else 0.0