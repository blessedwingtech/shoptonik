from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

class OrderStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"

class PaymentStatus(str, Enum):
    PENDING = "pending"
    PAID = "paid"
    FAILED = "failed"
    REFUNDED = "refunded"

class AddressSchema(BaseModel):
    street: str
    city: str
    postal_code: str
    country: str
    additional_info: Optional[str] = None

class OrderItemSchema(BaseModel):
    product_id: str
    product_name: str
    product_price: float
    quantity: int
    total_price: float
    product_image: Optional[str] = None
    product_sku: Optional[str] = None

class OrderCreate(BaseModel):
    shop_id: str
    customer_name: str
    customer_email: EmailStr
    customer_phone: Optional[str] = None
    customer_address: AddressSchema
    items: List[OrderItemSchema]
    shipping_fee: Optional[float] = 0          # <-- ajouter
    tax_amount: Optional[float] = 0   
    shipping_method: Optional[str] = None
    shipping_address: Optional[AddressSchema] = None
    payment_method: str
    notes: Optional[str] = None

class OrderUpdate(BaseModel):
    status: Optional[OrderStatus] = None
    tracking_number: Optional[str] = None
    payment_status: Optional[PaymentStatus] = None
    notes: Optional[str] = None

class OrderResponse(BaseModel):
    id: str
    order_number: str
    shop_id: str
    customer_id: Optional[str]
    customer_name: str
    customer_email: str
    customer_phone: Optional[str]
    customer_address: Dict[str, Any]
    items: List[Dict[str, Any]]
    subtotal: float
    shipping_fee: float
    tax_amount: float
    total_amount: float
    shipping_method: Optional[str]
    shipping_address: Optional[Dict[str, Any]]
    tracking_number: Optional[str]
    payment_method: Optional[str]
    payment_status: str
    payment_id: Optional[str]
    payment_confirmed: bool
    status: str
    notes: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True

class OrderStats(BaseModel):
    total_orders: int = 0
    total_revenue: float = 0.0
    pending_count: int = 0
    processing_count: int = 0
    shipped_count: int = 0
    delivered_count: int = 0
    cancelled_count: int = 0
