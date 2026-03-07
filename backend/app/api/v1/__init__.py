# API v1 package
# backend/app/api/v1/__init__.py

# Importez vos routeurs ici
from .auth import router as auth_router
from .products import router as products_router
from .shops import router as shops_router
from .orders import router as orders_router
from .cart import router as cart_router
from .public import router as public_router 
from .customer_orders import router as customer_orders_router
from .checkout import router as checkout_router
from .seller.payments import router as seller_payments_router
from .seller.wallet import router as seller_wallet_router

# Optionnel : exports
__all__ = [
    "auth_router",
    "products_router",
    "shops_router",
    "orders_router",
    "cart_router",
    "public_router", 
    "customer_orders_router",
    "checkout_router",
    "seller_payments_router",
    "seller_wallet_router"
]