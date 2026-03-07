from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Request
from app.models.user import User
from app.services.audit import AuditService
from sqlalchemy.orm import Session
from ....dependencies import get_db, get_current_admin
from ....models import Withdrawal, SellerWallet

router = APIRouter(prefix="/payouts", tags=["admin-payouts"])

@router.get("/pending")
async def get_pending_withdrawals(
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Liste toutes les demandes de retrait en attente"""
    
    withdrawals = db.query(Withdrawal).filter(
        Withdrawal.status == "pending"
    ).order_by(Withdrawal.created_at).all()
    
    return withdrawals

@router.post("/{withdrawal_id}/approve")
async def approve_withdrawal(
    request:Request,
    withdrawal_id: str,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Approuve une demande de retrait"""
    
    withdrawal = db.query(Withdrawal).get(withdrawal_id)
    if not withdrawal:
        raise HTTPException(404, "Demande non trouvée")
    
    # Ici, déclencher le virement bancaire réel
    # via Stripe, PayPal, ou manuel
    
    withdrawal.status = "completed"
    withdrawal.processed_at = datetime.utcnow()
    
    db.commit()
    
    audit = AuditService(db)
    await audit.log_update(
        resource_type="withdrawal",
        resource_id=withdrawal_id,
        old_values={"status": "pending"},
        new_values={"status": "completed"},
        user_id=admin.id,
        user_email=admin.email,
        request=request
    )
    # Notifier le vendeur
    # await notify_seller(withdrawal.seller_id, "withdrawal_approved")
    
    return {"success": True}

@router.post("/{withdrawal_id}/reject")
async def reject_withdrawal(
    request:Request,
    withdrawal_id: str,
    reason: str,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Rejette une demande de retrait et rembourse le wallet"""
    
    withdrawal = db.query(Withdrawal).get(withdrawal_id)
    if not withdrawal:
        raise HTTPException(404, "Demande non trouvée")
    
    # Remettre l'argent dans le wallet
    wallet = db.query(SellerWallet).filter(
        SellerWallet.seller_id == withdrawal.seller_id
    ).first()
    
    if wallet:
        wallet.balance += withdrawal.amount
        wallet.total_withdrawn -= withdrawal.amount
    
    withdrawal.status = "rejected"
    withdrawal.notes = reason
    
    db.commit()
    
    audit = AuditService(db)
    await audit.log_update(
        resource_type="withdrawal",
        resource_id=withdrawal_id,
        old_values={"status": "pending"},
        new_values={"status": "rejected"},
        user_id=admin.id,
        user_email=admin.email,
        request=request
    )
    
    return {"success": True}

@router.get("")
async def get_all_withdrawals(
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    withdrawals = db.query(Withdrawal).order_by(
        Withdrawal.created_at.desc()
    ).all()

    return withdrawals