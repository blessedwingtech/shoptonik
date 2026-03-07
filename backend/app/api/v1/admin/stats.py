from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from app.core.database import get_db
from app.api.v1.auth import get_current_user
from app.models.user import User
from app.models.shop import Shop
from app.models.product import Product
from app.models.order import Order

router = APIRouter(prefix="/stats", tags=["admin-stats"])

def get_current_admin_user(
    current_user: User = Depends(get_current_user)
):
    """Vérifier que l'utilisateur est admin"""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=403,
            detail="Accès réservé aux administrateurs"
        )
    return current_user

@router.get("/")
async def get_platform_stats(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user)
):
    """Obtenir les statistiques globales de la plateforme"""
    
    # Stats utilisateurs
    total_users = db.query(func.count(User.id)).scalar() or 0
    total_sellers = db.query(func.count(User.id)).filter(User.is_seller == True).scalar() or 0
    total_admins = db.query(func.count(User.id)).filter(User.is_admin == True).scalar() or 0
    
    # Stats boutiques
    total_shops = db.query(func.count(Shop.id)).scalar() or 0
    active_shops = db.query(func.count(Shop.id)).filter(Shop.is_active == True).scalar() or 0
    verified_shops = db.query(func.count(Shop.id)).filter(Shop.is_verified == True).scalar() or 0
    
    # Stats produits
    total_products = db.query(func.count(Product.id)).scalar() or 0
    active_products = db.query(func.count(Product.id)).filter(Product.is_active == True).scalar() or 0
    
    # Stats commandes
    total_orders = db.query(func.count(Order.id)).scalar() or 0
    completed_orders = db.query(func.count(Order.id)).filter(Order.status == "delivered").scalar() or 0
    
    # Chiffre d'affaires
    revenue_result = db.query(func.sum(Order.total_amount)).filter(Order.status == "delivered").scalar()
    total_revenue = float(revenue_result) if revenue_result else 0.0
    
    # Demandes en attente
    pending_requests = db.query(func.count(User.id)).filter(
        User.seller_requested_at.isnot(None),
        User.is_seller == False,
        User.seller_approved_at.is_(None)
    ).scalar() or 0
    
    # Nouveaux utilisateurs (30 derniers jours)
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    new_users_30d = db.query(func.count(User.id)).filter(User.created_at >= thirty_days_ago).scalar() or 0
    
    return {
        "total_users": total_users,
        "total_sellers": total_sellers,
        "total_admins": total_admins,
        "new_users_30d": new_users_30d,
        
        "total_shops": total_shops,
        "active_shops": active_shops,
        "verified_shops": verified_shops,
        
        "total_products": total_products,
        "active_products": active_products,
        
        "total_orders": total_orders,
        "completed_orders": completed_orders,
        "total_revenue": round(total_revenue, 2),
        
        "pending_requests": pending_requests
    }

@router.get("/recent")
async def get_recent_activity(
    limit: int = 10,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user)
):
    """Obtenir l'activité récente (utilisateurs, boutiques, commandes)"""
    
    # Derniers utilisateurs inscrits
    recent_users = db.query(User).order_by(User.created_at.desc()).limit(limit).all()
    
    # Dernières boutiques créées
    recent_shops = db.query(Shop).order_by(Shop.created_at.desc()).limit(limit).all()
    
    # Dernières commandes
    recent_orders = db.query(Order).order_by(Order.created_at.desc()).limit(limit).all()
    
    return {
        "users": [
            {
                "id": u.id,
                "username": u.username,
                "email": u.email,
                "created_at": u.created_at
            } for u in recent_users
        ],
        "shops": [
            {
                "id": s.id,
                "name": s.name,
                "slug": s.slug,
                "created_at": s.created_at
            } for s in recent_shops
        ],
        "orders": [
            {
                "id": o.id,
                "order_number": o.order_number,
                "total_amount": float(o.total_amount),
                "status": o.status,
                "created_at": o.created_at
            } for o in recent_orders
        ]
    }
