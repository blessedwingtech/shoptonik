from pydantic import BaseModel
from typing import List, Optional

class CartItemCreate(BaseModel):
    product_id: str
    quantity: int = 1

class CartItemResponse(BaseModel):
    id: str
    product_id: str
    product_name: str
    product_price: float
    product_image: Optional[str]
    quantity: int
    total_price: float
    
    class Config:
        from_attributes = True

class CartResponse(BaseModel):
    id: str
    shop_id: str
    shop_slug: Optional[str] = None  # ← AJOUTER
    shop_name: Optional[str] = None   # ← AJOUTER
    items: List[CartItemResponse]
    total_items: int
    subtotal: float
    
    class Config:
        from_attributes = True
        