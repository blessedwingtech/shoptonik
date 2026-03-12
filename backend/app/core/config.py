# app/core/config.py
import os
from pydantic import Field
from pydantic_settings import BaseSettings
from typing import List, Optional

class Settings(BaseSettings):
    # Application
    app_name: str = "ShopTonik"
    debug: bool = False
   
    # Database
    database_url: str = Field(
        default="postgresql://shoptonik:Bentz789LORD&@postgres:5432/shoptonik",
        env="DATABASE_URL"
    ) 
    #database_url: str = os.getenv("DATABASE_URL", "sqlite:///./shoptonik.db")
    db_password: str = os.getenv("DB_PASSWORD", "")    
    # Cloudflare R2 Configuration
    r2_access_key_id: str = os.getenv("R2_ACCESS_KEY_ID", "")
    r2_secret_access_key: str = os.getenv("R2_SECRET_ACCESS_KEY", "")
    r2_bucket_name: str = os.getenv("R2_BUCKET_NAME", "")
    r2_endpoint: str = os.getenv("R2_ENDPOINT", "")
    
    # Security 
    secret_key: str = os.getenv("SECRET_KEY", "dev-secret-key-change-in-production")
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

    # MonCash Configuration
    moncash_client_id: str = os.getenv("MONCASH_CLIENT_ID", "")
    moncash_client_secret: str = os.getenv("MONCASH_CLIENT_SECRET", "")
    moncash_webhook_secret: str = os.getenv("MONCASH_WEBHOOK_SECRET", "")
    moncash_debug: bool = True  # True pour sandbox
    
    # NatCash Configuration (si API séparée)
    natcash_api_key: str = os.getenv("NATCASH_API_KEY", "")
    natcash_api_url: str = os.getenv("NATCASH_API_URL", "https://api.natcash.com/v1")
    
    
    # CORS - Changez "list" en "List[str]"
    cors_origins: List[str] = ["http://localhost:3000", "http://localhost:3001", "http://10.70.51.229:3000"]
  

 
    # Security (ligne ~16)

    # Stripe (lignes ~35-37)
    stripe_secret_key: str = os.getenv("STRIPE_SECRET_KEY", "")
    stripe_public_key: str = os.getenv("STRIPE_PUBLIC_KEY", "")
    stripe_webhook_secret: Optional[str] = os.getenv("STRIPE_WEBHOOK_SECRET", None)

    frontend_url: str = "http://localhost:3000"
    backend_url: str = "http://localhost:8000"
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"

settings = Settings()
