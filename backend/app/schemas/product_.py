from pydantic import BaseModel, Field, field_validator, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime

class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200, description="Nom du produit")
    description: Optional[str] = Field(None, max_length=2000, description="Description du produit")
    price: int = Field(..., gt=0, description="Prix en centimes (ex: 1999 pour 19.99€)")
    stock: int = Field(0, ge=0, description="Quantité en stock")
    images: List[str] = Field(default_factory=list, description="Liste d'URLs d'images")
    category: Optional[str] = Field(None, max_length=100, description="Catégorie du produit")
    sku: Optional[str] = Field(None, max_length=50, description="SKU unique (Stock Keeping Unit)")
    is_active: bool = Field(True, description="Le produit est-il actif ?")
    is_featured: bool = Field(False, description="Le produit est-il en vedette ?")
    
    # Détails supplémentaires
    weight_grams: Optional[int] = Field(None, ge=0, description="Poids en grammes")
    dimensions: Optional[Dict[str, Any]] = Field(None, description="Dimensions {longueur: 10, largeur: 5, hauteur: 3}")
    tags: Optional[List[str]] = Field(None, description="Tags pour la recherche")
    
    # SEO
    meta_title: Optional[str] = Field(None, max_length=200, description="Titre SEO")
    meta_description: Optional[str] = Field(None, max_length=500, description="Description SEO")

    @field_validator('price')
    @classmethod
    def validate_price(cls, v):
        if v <= 0:
            raise ValueError('Le prix doit être supérieur à 0')
        return v

    @field_validator('stock')
    @classmethod
    def validate_stock(cls, v):
        if v < 0:
            raise ValueError('Le stock ne peut pas être négatif')
        return v

    @field_validator('name')
    @classmethod
    def validate_name(cls, v):
        if not v.strip():
            raise ValueError('Le nom ne peut pas être vide')
        return v.strip()

class ProductCreate(ProductBase):
    """Schéma pour la création d'un produit"""
    pass

class ProductUpdate(BaseModel):
    """Schéma pour la mise à jour d'un produit (tous les champs optionnels)"""
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=2000)
    price: Optional[int] = Field(None, gt=0)
    stock: Optional[int] = Field(None, ge=0)
    images: Optional[List[str]] = None
    category: Optional[str] = Field(None, max_length=100)
    sku: Optional[str] = Field(None, max_length=50)
    is_active: Optional[bool] = None
    is_featured: Optional[bool] = None
    weight_grams: Optional[int] = Field(None, ge=0)
    dimensions: Optional[Dict[str, Any]] = None
    tags: Optional[List[str]] = None
    meta_title: Optional[str] = Field(None, max_length=200)
    meta_description: Optional[str] = Field(None, max_length=500)

class ProductResponse(ProductBase):
    """Schéma de réponse pour un produit"""
    id: str
    shop_id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": "123e4567-e89b-12d3-a456-426614174000",
                "shop_id": "123e4567-e89b-12d3-a456-426614174001",
                "name": "T-Shirt Premium",
                "description": "T-shirt 100% coton de haute qualité",
                "price": 2499,
                "stock": 50,
                "images": ["https://example.com/image1.jpg", "https://example.com/image2.jpg"],
                "category": "Vêtements",
                "sku": "TSHIRT-PREMIUM-001",
                "is_active": True,
                "is_featured": False,
                "weight_grams": 200,
                "dimensions": {"length": 30, "width": 20, "height": 2},
                "tags": ["t-shirt", "cotton", "premium"],
                "meta_title": "T-Shirt Premium - Ma Boutique",
                "meta_description": "Découvrez notre T-Shirt Premium en coton de haute qualité",
                "created_at": "2024-01-21T10:30:00Z",
                "updated_at": "2024-01-21T10:30:00Z"
            }
        }
    )
    