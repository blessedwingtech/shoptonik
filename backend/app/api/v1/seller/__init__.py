# app/api/v1/seller/__init__.py
from fastapi import APIRouter
from . import payments, wallet, request  # ← inclut toutes les routes seller

router = APIRouter(prefix="/seller", tags=["seller"])

# Inclure les sous-routeurs
router.include_router(payments.router)
router.include_router(wallet.router)
router.include_router(request.router)  # ← routes /request et admin

__all__ = ["router"]