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
    
    # Status
    is_active = Column(Boolean, default=True)
    is_seller = Column(Boolean, default=False)
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
    shops = relationship("Shop", back_populates="owner", cascade="all, delete-orphan")

        # Ajouter à la classe User
    orders = relationship("Order", back_populates="customer")
    
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
