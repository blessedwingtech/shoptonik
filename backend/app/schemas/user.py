from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

# User schemas
class UserBase(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    full_name: Optional[str] = None

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: str
    is_seller: bool
    is_active: bool
    total_shops: int
    created_at: datetime
    is_admin: bool
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse

class TokenData(BaseModel):
    user_id: Optional[str] = None
    email: Optional[str] = None
    
class UserUpdate(BaseModel):
    """Schéma pour la mise à jour du profil"""
    full_name: Optional[str] = Field(None, min_length=1, max_length=100)
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, pattern=r'^\+?[0-9\s\-]{8,20}$')
    avatar: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "full_name": "Jean Dupont",
                "username": "jeandupont",
                "email": "jean@example.com",
                "phone": "+33612345678",
                "avatar": "https://example.com/avatar.jpg"
            }
        }


class UserProfileResponse(UserResponse):
    """Version étendue pour le profil"""
    phone: Optional[str] = None
    avatar: Optional[str] = None
    email_verified: bool
    is_admin: bool
    stripe_customer_id: Optional[str] = None
    stripe_account_id: Optional[str] = None
    total_orders: int
    total_revenue: int  # en centimes
    updated_at: datetime
    
    @property
    def total_revenue_euros(self) -> float:
        return self.total_revenue / 100 if self.total_revenue else 0.0
    
    class Config:
        from_attributes = True

class PasswordChange(BaseModel):
    """Schéma pour le changement de mot de passe"""
    current_password: str = Field(..., min_length=8)
    new_password: str = Field(..., min_length=8)
    
    class Config:
        json_schema_extra = {
            "example": {
                "current_password": "ancienMotDePasse123",
                "new_password": "nouveauMotDePasse456"
            }
        }