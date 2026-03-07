from sqlalchemy import Column, String, Text, Boolean, DateTime, Integer, ForeignKey, Float, func, JSON
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from app.core.database import Base

class Shop(Base):
    __tablename__ = "shops"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    owner_id = Column(String, ForeignKey("users.id"), nullable=False)
    
    # Informations boutique
    name = Column(String, nullable=False)
    slug = Column(String, unique=True, index=True, nullable=False)
    description = Column(Text)
    category = Column(String, default="general")
    
    # Configuration
    currency = Column(String, default="EUR")
    language = Column(String, default="fr")
    timezone = Column(String, default="Europe/Paris")
    
    # Branding
    logo_url = Column(String, nullable=True)
    banner_url = Column(String, nullable=True)
    primary_color = Column(String, default="#3B82F6")
    secondary_color = Column(String, default="#8B5CF6")
    
    # Contact
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    address = Column(String, nullable=True)
    city = Column(String, nullable=True)
    country = Column(String, nullable=True)
    postal_code = Column(String, nullable=True)
    
    # Réseaux sociaux
    website = Column(String, nullable=True)
    instagram = Column(String, nullable=True)
    facebook = Column(String, nullable=True)
    twitter = Column(String, nullable=True)
    
    # SEO
    meta_title = Column(String, nullable=True)
    meta_description = Column(Text, nullable=True)
    
    # Status
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    subscription_plan = Column(String, default="free")  # free, starter, pro
    
    # Stats (mis à jour périodiquement)
    total_products = Column(Integer, default=0)
    total_orders = Column(Integer, default=0)
    total_revenue = Column(Float, default=0.0) 
    stock_value = Column(Float, default=0.0)  # En centimes
    total_visitors = Column(Integer, default=0)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relations
    owner = relationship("User", back_populates="shops")
    products = relationship("Product", back_populates="shop", cascade="all, delete-orphan", lazy="select")
    
    # Ajouter à la classe Shop
    orders = relationship("Order", back_populates="shop", cascade="all, delete-orphan")
    # Relation manquante avec Transaction 
    transactions = relationship("Transaction", back_populates="shop", cascade="all, delete-orphan")
    

    about_story = Column(Text, nullable=True)  # Notre histoire
    about_mission = Column(Text, nullable=True)  # Notre mission
    about_values = Column(Text, nullable=True)  # Nos valeurs
    about_commitments = Column(Text, nullable=True)  # Nos engagements
    
    # Informations supplémentaires
    business_hours = Column(String, nullable=True)  # Horaires d'ouverture
    shipping_info = Column(Text, nullable=True)  # Informations de livraison
    return_policy = Column(Text, nullable=True)  # Politique de retour
    payment_methods = Column(String, nullable=True)  # Méthodes de paiement acceptées
    
    # Images pour la page "À propos"
    about_image1_url = Column(String, nullable=True)
    about_image2_url = Column(String, nullable=True)

    # Moyens de paiement acceptés par la boutique
    accepted_payment_methods = Column(JSON, default=[
        "card", "paypal", "moncash", "natcash", "cash_on_delivery"
    ])
    
    # Configuration Stripe Connect (pour les vendeurs)
    stripe_account_id = Column(String, nullable=True)  # Compte Stripe du vendeur
    stripe_account_status = Column(String, default="incomplete")  # pending, active, restricted
    
    # Configuration PayPal
    paypal_email = Column(String, nullable=True)
    paypal_merchant_id = Column(String, nullable=True)
    
    # Configuration MonCash/NatCash (Haïti)
    moncash_phone = Column(String, nullable=True)  # Numéro de téléphone
    moncash_verified = Column(Boolean, default=False)
    natcash_account = Column(String, nullable=True)
    
    @property
    def dashboard_url(self) -> str:
        return f"/seller/dashboard/{self.slug}"
    
    @property
    def public_url(self) -> str:
        return f"/shop/{self.slug}"
    
    def update_stats(self, db=None):
        """Met à jour les statistiques de la boutique"""
        from app.models.product import Product
        from app.models.order import Order
        
        close_db = False
        if db is None:
            from app.core.database import SessionLocal
            db = SessionLocal()
            close_db = True
        
        try:
            # 1. Compter les produits actifs
            self.total_products = db.query(func.count(Product.id)).filter(
                Product.shop_id == self.id,
                Product.is_active == True
            ).scalar() or 0
            
            # 2. Calculer la valeur du stock (convertir centimes → euros)
            stock_result = db.query(
                func.sum(Product.price * Product.stock)
            ).filter(
                Product.shop_id == self.id,
                Product.is_active == True
            ).scalar()
            # CONVERSION IMPORTANTE : centimes → euros
            self.stock_value = float(stock_result) / 100 if stock_result else 0.0
            
            # 3. Calculer le CA (commandes livrées uniquement - déjà en euros)
            ca_result = db.query(func.sum(Order.total_amount)).filter(
                Order.shop_id == self.id,
                Order.status == "delivered"
            ).scalar()
            self.total_revenue = float(ca_result) if ca_result else 0.0
            
            # 4. Compter TOUTES les commandes
            self.total_orders = db.query(func.count(Order.id)).filter(
                Order.shop_id == self.id
            ).scalar() or 0
            
            if close_db:
                db.commit()
        finally:
            if close_db:
                db.close()  
                      
    # Ajouter dans User model:
# shops = relationship("Shop", back_populates="owner", cascade="all, delete-orphan")
