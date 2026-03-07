from fastapi import APIRouter

router = APIRouter(prefix="/admin", tags=["admin"])

# Importer ensuite les modules et inclure leurs routeurs
from . import users, shops, products, stats
from .payouts import router as payouts_router

router.include_router(users.router)
router.include_router(shops.router)
router.include_router(products.router)
router.include_router(stats.router)
router.include_router(payouts_router)