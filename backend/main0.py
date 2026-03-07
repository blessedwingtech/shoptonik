"""
ShopTonik API v1 - Point d'entrée principal
"""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import uvicorn

from app.core.config import settings

app = FastAPI(
    title="ShopTonik API",
    description="Plateforme e-commerce multi-vendeurs",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS - plus permissif pour debug
app.add_middleware(
    CORSMiddleware,
    allow_origins= settings.cors_origins, 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# CRÉER LE DOSSIER UPLOADS S'IL N'EXISTE PAS
uploads_dir = "uploads"
if not os.path.exists(uploads_dir):
    os.makedirs(uploads_dir)
    print(f"📁 Dossier '{uploads_dir}' créé avec succès")
    
# MONTER LES FICHIERS STATIQUES
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Importer les routeurs
from app.api.v1.auth import router as auth_router
from app.api.v1.shops import router as shops_router
from app.api.v1 import products
from app.api.v1.orders import router as orders_router  # Pour les vendeurs
from app.api.v1.customer_orders import router as customer_orders_router  # Pour les client
from app.api.v1.cart import router as cart_router
from app.api.v1 import public
from app.api.v1.upload import router as upload_router 
from app.api.v1.checkout import router as checkout_router
from app.api.v1 import seller as seller_requests_router 
from app.api.v1.admin import router as admin_router
from app.api.v1.seller.payments import router as seller_payments_router
from app.api.v1.seller.wallet import router as seller_wallet_router
# ...
from app.api.v1.seller import router as seller_main_router
from starlette.middleware.sessions import SessionMiddleware 
# En haut avec les autres imports
from app.api.v1.payments import router as payments_router
from app.api.v1.admin import audit
from app.api.v1.admin import payouts


app.add_middleware(
    SessionMiddleware,
    secret_key=settings.secret_key,  # Utilisez la même clé que JWT
    max_age=3600 * 24 * 30,  # 30 jours
    same_site="lax",
    https_only=False,  # True en production
)


# CRITIQUE : Les routeurs ont déjà le préfixe "/auth" et "/shops" dans leurs fichiers
# Vous devez les monter avec le préfixe "/api/v1"
app.include_router(auth_router, prefix="/api/v1")
app.include_router(shops_router, prefix="/api/v1")
app.include_router(products.router, prefix="/api/v1")
app.include_router(orders_router, prefix="/api/v1")  # Routes vendeurs
app.include_router(customer_orders_router, prefix="/api/v1")  # Routes clients
app.include_router(cart_router, prefix="/api/v1")
app.include_router(public.router, prefix="/api/v1")
# app.include_router(upload_router)
app.include_router(upload_router, prefix="/api/v1")
app.include_router(checkout_router, prefix="/api/v1")
app.include_router(seller_requests_router.router, prefix="/api/v1")
# Avec les autres include_router
# app.include_router(seller_payments_router, prefix="/api/v1")
# app.include_router(seller_wallet_router, prefix="/api/v1")
app.include_router(seller_main_router, prefix="/api/v1")
# Plus bas avec les autres app.include_router
app.include_router(payments_router, prefix="/api/v1")
app.include_router(audit.router, prefix="/api/v1")  
app.include_router(admin_router, prefix="/api/v1")



# Route de test
@app.get("/api/v1/test")
def test():
    return {"message": "API v1 is working"}

@app.get("/")
def root():
    return {"message": "ShopTonik API v1", "status": "online"}

@app.get("/health")
def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    print("🚀 ShopTonik API démarrée sur http://localhost:8000")
    print("📚 Docs: http://localhost:8000/docs")
    print("🔍 Test route: http://localhost:8000/api/v1/test")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
