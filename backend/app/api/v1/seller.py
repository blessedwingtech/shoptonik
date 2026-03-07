from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List, Optional
from app.core.database import get_db
from app.api.v1.auth import get_current_user
from app.models.user import User
from pydantic import BaseModel

router = APIRouter(prefix="/seller", tags=["seller"])

class SellerRequest(BaseModel):
    company_name: Optional[str] = None
    vat_number: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None

class SellerRequestResponse(BaseModel):
    id: str
    username: str
    email: str
    full_name: Optional[str] = None
    company_name: Optional[str] = None
    vat_number: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    requested_at: Optional[datetime] = None  # ← RENDU OPTIONNEL
    
    class Config:
        from_attributes = True

@router.post("/request")
async def request_seller_status(
    request_data: SellerRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Demander à devenir vendeur (en attente d'approbation)"""
    
    if current_user.is_seller:
        raise HTTPException(
            status_code=400,
            detail="Vous êtes déjà vendeur"
        )
    
    if current_user.seller_requested_at:
        raise HTTPException(
            status_code=400,
            detail="Une demande est déjà en cours de traitement"
        )
    
    # Enregistrer la demande
    current_user.seller_requested_at = datetime.utcnow()
    current_user.seller_company_name = request_data.company_name
    current_user.seller_vat_number = request_data.vat_number
    current_user.seller_address = request_data.address
    current_user.phone = request_data.phone
    
    db.commit()
    
    return {
        "message": "Demande envoyée avec succès. Un administrateur va l'examiner.",
        "status": "pending",
        "requested_at": current_user.seller_requested_at
    }

@router.get("/request/status")
async def get_seller_request_status(
    current_user: User = Depends(get_current_user)
):
    """Vérifier le statut de la demande"""
    
    if current_user.is_seller:
        return {
            "status": "approved",
            "approved_at": current_user.seller_approved_at,
            "is_seller": True
        }
    
    if current_user.seller_requested_at:
        return {
            "status": "pending",
            "requested_at": current_user.seller_requested_at,
            "is_seller": False
        }
    
    return {
        "status": "none",
        "is_seller": False
    }

# ===== ROUTES ADMIN =====

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

@router.get("/admin/pending", response_model=List[SellerRequestResponse])
async def get_pending_seller_requests(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user)
):
    """Lister les demandes en attente (admin seulement)"""
    
    pending_users = db.query(User).filter(
        User.seller_requested_at.isnot(None),
        User.is_seller == False,
        User.seller_approved_at.is_(None)
    ).all()
    
    # ✅ Conversion manuelle avec les BONS noms de champs
    result = []
    for user in pending_users:
        result.append({
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "full_name": user.full_name,
            "company_name": user.seller_company_name,  # ← NOTEZ LE PRÉFIXE seller_
            "vat_number": user.seller_vat_number,
            "address": user.seller_address,
            "phone": user.phone,
            "requested_at": user.seller_requested_at
        })
    
    return result

@router.post("/admin/approve/{user_id}")
async def approve_seller_request(
    user_id: str,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user)
):
    """Approuver une demande vendeur (admin seulement)"""
    
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(404, "Utilisateur non trouvé")
    
    if not user.seller_requested_at:
        raise HTTPException(400, "Cet utilisateur n'a pas fait de demande")
    
    if user.is_seller:
        raise HTTPException(400, "Cet utilisateur est déjà vendeur")
    
    # Approuver
    user.is_seller = True
    user.seller_approved_at = datetime.utcnow()
    db.commit()
    
    return {
        "message": f"La demande de {user.email} a été approuvée",
        "user": {
            "id": user.id,
            "email": user.email,
            "username": user.username,
            "is_seller": True
        }
    }

@router.post("/admin/reject/{user_id}")
async def reject_seller_request(
    user_id: str,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user)
):
    """Rejeter une demande vendeur (admin seulement)"""
    
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(404, "Utilisateur non trouvé")
    
    # Remettre à zéro la demande
    user.seller_requested_at = None
    user.seller_company_name = None
    user.seller_vat_number = None
    user.seller_address = None
    user.phone = None
    db.commit()
    
    return {"message": f"La demande de {user.email} a été rejetée"}
