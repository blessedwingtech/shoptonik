import math
from pydantic import BaseModel, BeforeValidator, Field, field_validator, ConfigDict
from typing import Annotated, Optional, List, Dict, Any
from datetime import datetime
import re
from uuid import UUID

from ..core.categories import is_valid_product_category  # ← AJOUT IMPORT UUID

 

# Type personnalisé qui convertit euros → centimes
def convert_euros_to_cents(value):
    """Convertit euros (float) → centimes (int)"""
    if value is None:
        return None
    # Utilisez round() au lieu de ceil() pour éviter les surprises
    return int(round(float(value) * 100))

EuroAmount = Annotated[
    int,
    BeforeValidator(convert_euros_to_cents)
]

class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200, description="Nom du produit")
    description: Optional[str] = Field(None, max_length=5000, description="Description détaillée du produit")
    price: EuroAmount = Field(..., gt=0, description="Prix en euros (ex: 29.99)")  # <-- UTILISEZ EuroAmount
    compare_price: Optional[EuroAmount] = Field(None, gt=0, description="Prix barré pour les promotions (en euros)")  # <-- UTILISEZ EuroAmount
    stock: int = Field(0, ge=0, description="Quantité en stock")
    images: List[str] = Field(default_factory=list, description="Liste d'URLs d'images")
    category: Optional[str] = Field(None, max_length=100, description="Catégorie du produit")
    sku: Optional[str] = Field(None, max_length=50, description="SKU unique (Stock Keeping Unit)")
    is_active: bool = Field(True, description="Le produit est-il actif ?")
    is_featured: bool = Field(False, description="Le produit est-il en vedette ?")
    is_digital: bool = Field(False, description="Produit numérique (pas de livraison physique)")
    digital_url: Optional[str] = Field(None, description="URL de téléchargement pour les produits numériques")
    
    # Détails supplémentaires
    weight_grams: Optional[int] = Field(None, ge=0, description="Poids en grammes")
    dimensions: Optional[Dict[str, Any]] = Field(None, description="Dimensions {longueur: 10, largeur: 5, hauteur: 3}")
    tags: Optional[List[str]] = Field(default_factory=list, description="Tags pour la recherche")
    variations: Optional[List[Dict[str, Any]]] = Field(
        default_factory=list,
        description="Variantes disponibles (ex: [{'name': 'Taille', 'options': ['S', 'M', 'L']}, {'name': 'Couleur', 'options': ['Rouge', 'Bleu', 'Vert']}])"
    )
    
    # SEO
    meta_title: Optional[str] = Field(None, max_length=200, description="Titre SEO")
    meta_description: Optional[str] = Field(None, max_length=500, description="Description SEO")

    @field_validator('price', 'compare_price')
    @classmethod
    def validate_price(cls, v, info):
        if v is not None and v <= 0:
            field_name = info.field_name
            raise ValueError(f'{field_name} doit être supérieur à 0')
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
    
    @field_validator('category')
    @classmethod
    def validate_category(cls, v):
        """Valide que la catégorie est dans la liste autorisée"""
        if v is None or v == "":
            return None
        
        # Vérifier si c'est une catégorie valide
        if not is_valid_product_category(v):
            # Option recommandée: Retourner "autre" silencieusement
            return "autre"
        
        return v
    
    @field_validator('sku') 
    @classmethod
    def validate_sku(cls, v: Optional[str]) -> str:
        if v is None:
            return None
        
        # Convertir en majuscules d'abord
        v_upper = v.upper().strip()
        
        # Validation plus stricte
        # Format recommandé: AAA-12345-BCD_01
        if not re.match(r'^[A-Z0-9\-_]{3,50}$', v_upper):
            raise ValueError(
                'SKU doit contenir entre 3 et 50 caractères, '
                'uniquement des lettres majuscules, chiffres, '
                'tirets (-) et underscores (_)'
            )
        
        # Validation supplémentaire: pas de double tirets/underscores
        if '--' in v_upper or '__' in v_upper or '_-' in v_upper or '-_' in v_upper:
            raise ValueError('SKU ne peut pas contenir de séquences de séparateurs consécutifs')
        
        # Ne pas commencer ou terminer par un séparateur
        if v_upper.startswith('-') or v_upper.startswith('_'):
            raise ValueError('SKU ne peut pas commencer par un tiret ou underscore')
        
        if v_upper.endswith('-') or v_upper.endswith('_'):
            raise ValueError('SKU ne peut pas terminer par un tiret ou underscore')
        
        return v_upper
    
    @field_validator('compare_price')
    @classmethod
    def validate_compare_price_logic(cls, v, info):
        """Valider que compare_price est supérieur à price (s'il existe)"""
        values = info.data
        price = values.get('price') if hasattr(values, 'get') else None
        
        if v is not None and price is not None and v <= price:
            raise ValueError('Le prix de comparaison doit être supérieur au prix de vente')
        return v

class ProductCreate(ProductBase):
    """Schéma pour la création d'un produit"""
    slug: Optional[str] = Field(None, min_length=1, max_length=200, description="Slug auto-généré si non fourni")
    
    @field_validator('slug')
    @classmethod
    def validate_slug(cls, v):
        if v and not re.match(r'^[a-z0-9\-]+$', v):
            raise ValueError('Slug invalide. Doit contenir seulement des lettres minuscules, chiffres et tirets')
        return v
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "name": "T-Shirt Premium",
                "slug": "t-shirt-premium",
                "description": "T-shirt 100% coton de haute qualité",
                "price": 29.99,  # <-- SIMPLE FLOAT, sera converti en 2999
                "compare_price": 39.99,  # <-- SIMPLE FLOAT, sera converti en 3999
                "stock": 50,
                "images": ["https://example.com/image1.jpg", "https://example.com/image2.jpg"],
                "category": "Vêtements",
                "sku": "TSHIRT-PREMIUM-001",
                "is_active": True,
                "is_featured": True,
                "is_digital": False,
                "digital_url": None,
                "weight_grams": 200,
                "dimensions": {"length": 30, "width": 20, "height": 2},
                "tags": ["t-shirt", "cotton", "premium", "summer"],
                "variations": [
                    {"name": "Taille", "options": ["S", "M", "L", "XL"]},
                    {"name": "Couleur", "options": ["Blanc", "Noir", "Bleu"]}
                ],
                "meta_title": "T-Shirt Premium - Ma Boutique",
                "meta_description": "Découvrez notre T-Shirt Premium en coton de haute qualité, disponible en plusieurs tailles et couleurs"
            }
        }
    )


class ProductUpdate(BaseModel):
    """Schéma pour la mise à jour d'un produit (PATCH - champs optionnels)"""
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=5000)
    price: Optional[int] = Field(None, gt=0)
    compare_price: Optional[int] = Field(None, gt=0)
    stock: Optional[int] = Field(None, ge=0)
    images: Optional[List[str]] = None
    category: Optional[str] = Field(None, max_length=100)
    sku: Optional[str] = Field(None, max_length=50)
    is_active: Optional[bool] = None
    is_featured: Optional[bool] = None
    is_digital: Optional[bool] = None
    digital_url: Optional[str] = None
    slug: Optional[str] = Field(None, pattern=r'^[a-z0-9\-]+$')
    weight_grams: Optional[int] = Field(None, ge=0)
    dimensions: Optional[Dict[str, Any]] = None
    tags: Optional[List[str]] = None
    variations: Optional[List[Dict[str, Any]]] = None
    meta_title: Optional[str] = Field(None, max_length=200)
    meta_description: Optional[str] = Field(None, max_length=500)
    
    model_config = ConfigDict(
        extra='forbid',  # ← IMPORTANT: empêche les champs inconnus
        json_schema_extra={
            "example": {
                "name": "T-Shirt Premium Édition Limitée",
                "price": 2299,
                "compare_price": 2799,
                "stock": 25,
                "is_featured": True,
                "tags": ["t-shirt", "cotton", "premium", "limited-edition"]
            }
        }
    )
class ProductResponse(ProductBase):
    """Schéma de réponse pour un produit"""

    id: UUID
    shop_id: UUID
    slug: str
    view_count: int
    created_at: datetime
    updated_at: datetime

    # Propriétés calculées (venues du model)
    has_discount: bool
    discount_percentage: int
    is_available: bool
    formatted_price: str
    formatted_compare_price: Optional[str]

    price: int = Field(..., description="Prix en centimes")
    compare_price: Optional[int] = Field(None, description="Prix barré en centimes")


    model_config = ConfigDict(
        from_attributes=True
    )

# class ProductResponse(ProductBase):
#     """Schéma de réponse pour un produit"""
#     id: UUID = Field(..., description="UUID du produit")  # ← CHANGER str -> UUID
#     shop_id: UUID = Field(..., description="UUID de la boutique")  # ← CHANGER str -> UUID
#     slug: str = Field(..., description="Slug du produit")
#     view_count: int = Field(0, description="Nombre de vues du produit")
#     created_at: datetime
#     updated_at: datetime
    
#     # Propriétés calculées
#     has_discount: bool = Field(False, description="Le produit a-t-il une réduction ?")
#     discount_percentage: int = Field(0, ge=0, le=100, description="Pourcentage de réduction")
    
#     # AJOUTEZ CES CHAMPS CRITIQUES :
#     is_available: bool = Field(..., description="Le produit est-il disponible ?")
#     formatted_price: str = Field(..., description="Prix formaté (ex: '29.99 €')")
#     formatted_compare_price: Optional[str] = Field(None, description="Prix barré formaté (ex: '39.99 €')")

#     # @field_validator('has_discount', mode='before')
#     # @classmethod
#     # def calculate_has_discount(cls, v, info):
#         """Calculer si le produit a une réduction"""
#         values = info.data
#         price = values.get('price')
#         compare_price = values.get('compare_price')
        
#         if price is not None and compare_price is not None:
#             return compare_price > price
#         return False
    
#     # @field_validator('discount_percentage', mode='before')
#     # @classmethod
#     # def calculate_discount_percentage(cls, v, info):
#         """Calculer le pourcentage de réduction"""
#         values = info.data
#         price = values.get('price')
#         compare_price = values.get('compare_price')
        
#         if price is not None and compare_price is not None and compare_price > price:
#             return int(((compare_price - price) / compare_price) * 100)
#         return 0
    
#      # AJOUTEZ CES NOUVEAUX VALIDATEURS :
#     # @field_validator('is_available', mode='before')
#     # @classmethod
#     # def calculate_is_available(cls, v, info):
#         """Calculer si le produit est disponible"""
#         values = info.data
#         stock = values.get('stock', 0)
#         is_active = values.get('is_active', True)
#         is_digital = values.get('is_digital', False)
        
#         if is_digital:
#             return is_active  # Produits numériques toujours disponibles si actifs
#         return is_active and stock > 0
    
#     # @field_validator('formatted_price', mode='before')
#     # @classmethod
#     # def format_price(cls, v, info):
#         """Formater le prix en euros"""
#         values = info.data
#         price = values.get('price', 0)
        
#         if price is not None:
#             return f"{price / 100:.2f} €"
#         return "0.00 €"
    
#     # @field_validator('formatted_compare_price', mode='before')
#     # @classmethod
#     # def format_compare_price(cls, v, info):
#     #     """Formater le prix de comparaison en euros"""
#     #     values = info.data
#     #     compare_price = values.get('compare_price')
        
#     #     if compare_price is not None:
#     #         return f"{compare_price / 100:.2f} €"
#     #     return None
    

#     model_config = ConfigDict(
#         from_attributes=True,
#         json_schema_extra={
#             "example": {
#                 "id": "123e4567-e89b-12d3-a456-426614174000",
#                 "shop_id": "123e4567-e89b-12d3-a456-426614174001",
#                 "slug": "t-shirt-premium",
#                 "name": "T-Shirt Premium",
#                 "description": "T-shirt 100% coton de haute qualité",
#                 "price": 2499,
#                 "compare_price": 2999,
#                 "stock": 50,
#                 "images": ["https://example.com/image1.jpg", "https://example.com/image2.jpg"],
#                 "category": "Vêtements",
#                 "sku": "TSHIRT-PREMIUM-001",
#                 "is_active": True,
#                 "is_featured": True,
#                 "is_digital": False,
#                 "digital_url": None,
#                 "weight_grams": 200,
#                 "dimensions": {"length": 30, "width": 20, "height": 2},
#                 "tags": ["t-shirt", "cotton", "premium", "summer"],
#                 "variations": [
#                     {"name": "Taille", "options": ["S", "M", "L", "XL"]},
#                     {"name": "Couleur", "options": ["Blanc", "Noir", "Bleu"]}
#                 ],
#                 "meta_title": "T-Shirt Premium - Ma Boutique",
#                 "meta_description": "Découvrez notre T-Shirt Premium en coton de haute qualité",
#                 "view_count": 125,
#                 "has_discount": True,
#                 "discount_percentage": 17,
#                 "is_available": True,  # ← AJOUTEZ CE CHAMP DANS L'EXEMPLE
#                 "formatted_price": "24.99 €",  # ← AJOUTEZ CE CHAMP DANS L'EXEMPLE
#                 "formatted_compare_price": "29.99 €",  # ← AJOUTEZ CE
#                 "created_at": "2024-01-21T10:30:00Z",
#                 "updated_at": "2024-01-21T14:45:00Z"
#             }
#         }
#     )

class ProductPublicResponse(BaseModel):
    """Schéma de réponse publique pour un produit (sans informations sensibles)"""
    id: UUID
    shop_id: UUID
    slug: str
    name: str
    description: Optional[str]
    price: int
    compare_price: Optional[int]
    stock: int
    images: List[str]
    category: Optional[str]
    is_active: bool
    is_featured: bool
    is_digital: bool
    weight_grams: Optional[int]
    dimensions: Optional[Dict[str, Any]]
    tags: List[str]
    variations: List[Dict[str, Any]]
    view_count: int
    has_discount: bool
    discount_percentage: int
    is_available: bool = Field(..., description="Le produit est-il disponible ?")  # AJOUTÉ
    formatted_price: str = Field(..., description="Prix formaté (ex: '29.99 €')")  # AJOUTÉ
    formatted_compare_price: Optional[str] = Field(None, description="Prix barré formaté (ex: '39.99 €')") 
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": "123e4567-e89b-12d3-a456-426614174000",
                "shop_id": "123e4567-e89b-12d3-a456-426614174001",
                "slug": "t-shirt-premium",
                "name": "T-Shirt Premium",
                "description": "T-shirt 100% coton de haute qualité",
                "price": 2499,
                "compare_price": 2999,
                "stock": 50,
                "images": ["https://example.com/image1.jpg", "https://example.com/image2.jpg"],
                "category": "Vêtements",
                "is_active": True,
                "is_featured": True,
                "is_digital": False,
                "weight_grams": 200,
                "dimensions": {"length": 30, "width": 20, "height": 2},
                "tags": ["t-shirt", "cotton", "premium", "summer"],
                "variations": [
                    {"name": "Taille", "options": ["S", "M", "L", "XL"]},
                    {"name": "Couleur", "options": ["Blanc", "Noir", "Bleu"]}
                ],
                "view_count": 125,
                "has_discount": True,
                "discount_percentage": 17,
                "is_available": True,  # AJOUTÉ
                "formatted_price": "24.99 €",  # AJOUTÉ
                "formatted_compare_price": "29.99 €",  # AJOUTÉ
                "created_at": "2024-01-21T10:30:00Z",
                "updated_at": "2024-01-21T14:45:00Z"
            }
        }
    )

class ProductListResponse(BaseModel):
    """Schéma pour une liste paginée de produits"""
    products: List[ProductResponse]
    total: int
    page: int
    per_page: int
    total_pages: int

class ProductSearchQuery(BaseModel):
    """Schéma pour les paramètres de recherche de produits"""
    search: Optional[str] = Field(None, description="Terme de recherche")
    category: Optional[str] = Field(None, description="Filtrer par catégorie")
    min_price: Optional[int] = Field(None, ge=0, description="Prix minimum (en centimes)")
    max_price: Optional[int] = Field(None, ge=0, description="Prix maximum (en centimes)")
    in_stock: Optional[bool] = Field(None, description="Produits en stock uniquement")
    featured: Optional[bool] = Field(None, description="Produits en vedette uniquement")
    tags: Optional[List[str]] = Field(None, description="Filtrer par tags")
    page: int = Field(1, ge=1, description="Numéro de page")
    per_page: int = Field(20, ge=1, le=100, description="Nombre d'éléments par page")
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "search": "t-shirt",
                "category": "Vêtements",
                "min_price": 1000,
                "max_price": 5000,
                "in_stock": True,
                "featured": True,
                "tags": ["cotton", "premium"],
                "page": 1,
                "per_page": 20
            }
        }
    )

    