from fastapi import APIRouter, Depends, HTTPException, Query, Request
from app.services.audit import AuditService
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from typing import List, Optional
from datetime import datetime
from app.core.database import get_db
from app.api.v1.auth import get_current_user
from app.models.user import User
from app.schemas.user import UserResponse
from pydantic import BaseModel

router = APIRouter(prefix="/users", tags=["admin-users"])

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

@router.get("/", response_model=List[UserResponse])
async def get_users(
    role: Optional[str] = Query(None, description="Filtrer par rôle: all, sellers, buyers, admins"),
    search: Optional[str] = Query(None, description="Recherche par email ou nom"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user)
):
    """Lister tous les utilisateurs (admin seulement)"""
    
    # Construire la requête de base
    query = db.query(User)
    
    # Filtrer par rôle
    if role == "sellers":
        query = query.filter(User.is_seller == True)
    elif role == "admins":
        query = query.filter(User.is_admin == True)
    elif role == "buyers":
        query = query.filter(User.is_seller == False, User.is_admin == False)
    
    # Recherche
    if search:
        search_filter = or_(
            User.email.ilike(f"%{search}%"),
            User.username.ilike(f"%{search}%"),
            User.full_name.ilike(f"%{search}%")
        )
        query = query.filter(search_filter)
    
    # Pagination
    #total = query.count()
    total = query.with_entities(func.count()).scalar()

    users = query.order_by(User.created_at.desc()).offset((page-1)*limit).limit(limit).all()
    
    return users

@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: str,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user)
):
    """Obtenir les détails d'un utilisateur"""
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "Utilisateur non trouvé")
    
    return user

@router.post("/{user_id}/toggle-status")
async def toggle_user_status(
    request:Request,
    user_id: str,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user)
):
    """Activer/désactiver un utilisateur"""
    
    if user_id == admin.id:
        raise HTTPException(400, "Vous ne pouvez pas désactiver votre propre compte")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "Utilisateur non trouvé")
    
    user.is_active = not user.is_active
    db.commit()
    # AJOUTER L'AUDIT
    audit = AuditService(db)
    await audit.log_update(
        resource_type="user",
        resource_id=user_id,
        old_values={"is_active": not user.is_active},
        new_values={"is_active": user.is_active},
        user_id=admin.id,
        user_email=admin.email,
        request=request
    )
    return {
        "message": f"Utilisateur {'activé' if user.is_active else 'désactivé'}",
        "is_active": user.is_active
    }

@router.post("/{user_id}/toggle-seller")
async def toggle_user_seller(
    request:Request,
    user_id: str,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user)
):
    """Donner/retirer le statut vendeur"""
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "Utilisateur non trouvé")
    
    user.is_seller = not user.is_seller
    db.commit()
    audit = AuditService(db)
    await audit.log_update(
        resource_type="user",
        resource_id=user_id,
        old_values={"is_seller": not user.is_seller},
        new_values={"is_seller": user.is_seller},
        user_id=admin.id,
        user_email=admin.email,
        request=request
    )
    return {
        "message": f"Statut vendeur {'donné' if user.is_seller else 'retiré'}",
        "is_seller": user.is_seller
    }

@router.post("/{user_id}/toggle-admin")
async def toggle_user_admin(
    request:Request,
    user_id: str,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user)
):
    """Donner/retirer les droits admin"""
    
    if user_id == admin.id:
        raise HTTPException(400, "Vous ne pouvez pas modifier vos propres droits admin")
   
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "Utilisateur non trouvé")
    
    old_value = user.is_admin
    user.is_admin = not user.is_admin
    db.commit()
    audit = AuditService(db)
    await audit.log_update(
        resource_type="user",
        resource_id=user_id,
        old_values={"is_admin": old_value},
        new_values={"is_admin": user.is_admin},
        user_id=admin.id,
        user_email=admin.email,
        request=request
    )
    return {
        "message": f"Droits admin {'donnés' if user.is_admin else 'retirés'}",
        "is_admin": user.is_admin
    }

@router.delete("/{user_id}", status_code=204)
async def delete_user(
    request:Request,
    user_id: str,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user)
):
    """Supprimer définitivement un utilisateur"""
    
    if user_id == admin.id:
        raise HTTPException(400, "Vous ne pouvez pas supprimer votre propre compte")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "Utilisateur non trouvé")
    user_info = {"email": user.email, "username": user.username}
    db.delete(user)
    db.commit()
    audit = AuditService(db)
    await audit.log_delete(
        resource_type="user",
        resource_id=user_id,
        values=user_info,
        user_id=admin.id,
        user_email=admin.email,
        request=request
    )
    
    return None  # 204 No Content
