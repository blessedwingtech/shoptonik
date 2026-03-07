# app/core/config.py
import os

from pydantic_settings import BaseSettings
from typing import List, Optional

class Settings(BaseSettings):
    # Application
    app_name: str = "ShopTonik"
    debug: bool = True
    
    # Database
    database_url: str = "sqlite:///./shoptonik.db"
    
    # Security
    secret_key: str = "shoptonik-secret-key-change-in-production"
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
    
    stripe_secret_key: str = "sk_test_51SJecMIk70JNbuKZDzgkMpaxZ14YjvslDE1A9KlKiinQMY7SRiWRv8iEIZqNeCvHKtgGhGzjUV7chCByxkSnXOsN00GrNgqy9c"  # Remplacez par votre vraie clé
    stripe_public_key: str = "pk_test_51SJecMIk70JNbuKZ2ti3MJ25kWDaFCcK1FkW5zrWp3ptL7YaoE2Pbgq5gD92ldWaXkQx8Ud2J3Su8AgcECK14RV300yjSmgkEu"  # Remplacez par votre vraie clé
    stripe_webhook_secret: Optional[str] = None 

    frontend_url: str = "http://localhost:3000"
    backend_url: str = "http://localhost:8000"
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()
