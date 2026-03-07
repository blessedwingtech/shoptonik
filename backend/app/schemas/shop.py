import json

from pydantic import BaseModel, ConfigDict, field_validator
from typing import List, Optional, Union
from datetime import datetime

# Importez les catégories
from app.core.categories import is_valid_shop_category

class ShopBase(BaseModel):
    name: str
    description: Optional[str] = None
    category: Optional[str] = "general"
    
    @field_validator('category')
    @classmethod
    def validate_category(cls, v):
        if v and v != "general" and not is_valid_shop_category(v):
            # Si ce n'est pas une catégorie valide, retourner "autre"
            return "autre"
        return v or "general"

class ShopCreate(ShopBase):
    @field_validator('name')
    @classmethod
    def validate_name_length(cls, v):
        if len(v.strip()) < 3:
            raise ValueError("Le nom doit contenir au moins 3 caractères")
        if len(v.strip()) > 100:
            raise ValueError("Le nom ne peut pas dépasser 100 caractères")
        return v.strip()

 

class ShopUpdate(BaseModel):
    # Informations de base
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    
    # Configuration
    currency: Optional[str] = None
    language: Optional[str] = None
    timezone: Optional[str] = None
    
    # Branding
    logo_url: Optional[str] = None
    banner_url: Optional[str] = None
    primary_color: Optional[str] = None
    secondary_color: Optional[str] = None
    
    # Contact
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    postal_code: Optional[str] = None
    
    # Réseaux sociaux
    website: Optional[str] = None
    instagram: Optional[str] = None
    facebook: Optional[str] = None
    twitter: Optional[str] = None
    
    # SEO
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    
    # Status
    is_active: Optional[bool] = None

    # 👇 AJOUTEZ CES CHAMPS
    about_story: Optional[str] = None
    about_mission: Optional[str] = None
    about_values: Optional[str] = None
    about_commitments: Optional[str] = None
    
    business_hours: Optional[str] = None
    shipping_info: Optional[str] = None
    return_policy: Optional[str] = None
    payment_methods: Optional[str] = None
    
    about_image1_url: Optional[str] = None
    about_image2_url: Optional[str] = None

    #accepted_payment_methods: Optional[str] = None
    
    accepted_payment_methods: Optional[Union[List[str], str]] = None
    
    @field_validator('accepted_payment_methods')
    @classmethod
    def validate_accepted_payment_methods(cls, v):
        """Convertit la string JSON en tableau si nécessaire"""
        if v is None:
            return v
        if isinstance(v, str):
            try:
                # Si c'est une string JSON, on la parse
                return json.loads(v)
            except json.JSONDecodeError:
                # Si c'est une string simple, on la met dans un tableau
                return [v]
        # Si c'est déjà un tableau, on le garde
        return v

    
    @field_validator('primary_color', 'secondary_color')
    @classmethod
    def validate_color(cls, v):
        if v and not v.startswith('#'):
            return f"#{v}"
        return v

class Shop(ShopBase):
    id: str
    owner_id: str
    slug: str
    # Configuration
    currency: str
    language: str
    timezone: str
    
    # Branding
    logo_url: Optional[str] = None
    banner_url: Optional[str] = None
    primary_color: Optional[str] = "#3B82F6"
    secondary_color: Optional[str] = "#8B5CF6"
    
    # Contact
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    postal_code: Optional[str] = None
    
    # Réseaux sociaux
    website: Optional[str] = None
    instagram: Optional[str] = None
    facebook: Optional[str] = None
    twitter: Optional[str] = None
    
    # SEO
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    
    # Status et stats
    is_active: bool
    is_verified: bool
    subscription_plan: str
    total_products: int
    total_orders: int
    total_revenue: int
    total_visitors: int
    created_at: datetime
    updated_at: datetime
    
    # Propriétés calculées
    @property
    def dashboard_url(self) -> str:
        return f"/seller/dashboard/{self.slug}"
    
    @property
    def public_url(self) -> str:
        return f"/shop/{self.slug}"
    
    model_config = ConfigDict(from_attributes=True)

class ShopInDB(Shop):
    pass

class ShopStats(BaseModel):
    total_products: int
    total_orders: int
    total_revenue: int
    total_visitors: int
    revenue_formatted: str
    
    @classmethod
    def from_shop(cls, shop: Shop):
        return cls(
            total_products=shop.total_products,
            total_orders=shop.total_orders,
            total_revenue=shop.total_revenue,
            total_visitors=shop.total_visitors,
            revenue_formatted=f"€{shop.total_revenue / 100:.2f}"
        )
# AJOUTEZ CES CLASSES MANQUANTES :
# Dans backend/app/schemas/shop.py

class ShopResponse(ShopBase):
    id: str
    owner_id: str
    slug: str
    
    # Configuration
    currency: str
    language: str
    timezone: str
    
    # Branding
    logo_url: Optional[str] = None
    banner_url: Optional[str] = None
    primary_color: Optional[str] = "#3B82F6"
    secondary_color: Optional[str] = "#8B5CF6"
    
    # Contact
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    postal_code: Optional[str] = None
    
    # Réseaux sociaux
    website: Optional[str] = None
    instagram: Optional[str] = None
    facebook: Optional[str] = None
    twitter: Optional[str] = None
    
    # SEO
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    
    # Status
    is_active: bool
    is_verified: bool
    subscription_plan: str
    
    # Stats
    total_products: int
    total_orders: int
    total_revenue: float  # ← CHANGÉ : int → float
    stock_value: float 
    total_visitors: int
    
    # 👇 AJOUTEZ CES CHAMPS
    about_story: Optional[str] = None
    about_mission: Optional[str] = None
    about_values: Optional[str] = None
    about_commitments: Optional[str] = None
    
    business_hours: Optional[str] = None
    shipping_info: Optional[str] = None
    return_policy: Optional[str] = None
    payment_methods: Optional[str] = None
    
    about_image1_url: Optional[str] = None
    about_image2_url: Optional[str] = None
    
    accepted_payment_methods: List[str] = []
    # Timestamps
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class ShopWithStats(ShopResponse):
    total_revenue: float  # ← déjà hérité de ShopResponse
    total_visitors: int
    stock_value: float 


# backend/app/schemas/shop.py - Ajoutez cette classe

class PaymentMethodsUpdate(BaseModel):
    """Schéma pour mettre à jour les méthodes de paiement d'une boutique"""
    accepted_methods: List[str]
    stripe_enabled: Optional[bool] = False
    paypal_enabled: Optional[bool] = False
    moncash_enabled: Optional[bool] = False
    natcash_enabled: Optional[bool] = False
    
    class Config:
        json_schema_extra = {
            "example": {
                "accepted_methods": ["card", "paypal", "cash_on_delivery"],
                "stripe_enabled": True,
                "paypal_enabled": True,
                "moncash_enabled": False,
                "natcash_enabled": False
            }
        }