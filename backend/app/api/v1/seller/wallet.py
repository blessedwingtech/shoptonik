# backend/app/api/v1/seller/wallet.py
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from app.services.audit import AuditService
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import Optional
from datetime import datetime, timedelta
import uuid

from ....dependencies import get_db, get_current_user
from ....models import User, Transaction, SellerWallet, Withdrawal
from ....models.transaction import TransactionStatus

router = APIRouter(prefix="/wallet", tags=["seller-wallet"])

@router.get("")
async def get_seller_wallet(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Récupère le portefeuille du vendeur"""
    
    if not current_user.is_seller:
        raise HTTPException(403, "Vous devez être vendeur")
    
    # Chercher ou créer le wallet
    wallet = db.query(SellerWallet).filter(
        SellerWallet.seller_id == current_user.id
    ).first()
    
    if not wallet:
        # Créer un wallet par défaut
        wallet = SellerWallet(
            seller_id=current_user.id,
            balance=0.0,
            pending_balance=0.0,
            total_earned=0.0,
            total_withdrawn=0.0
        )
        db.add(wallet)
        db.commit()
        db.refresh(wallet)
    
    return wallet

@router.get("/transactions")
async def get_seller_transactions(
    period: Optional[str] = Query("month", pattern="^(week|month|year|all)$"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Récupère l'historique des transactions du vendeur"""
    
    if not current_user.is_seller:
        raise HTTPException(403, "Vous devez être vendeur")
    
    # Définir la période
    now = datetime.utcnow()
    if period == "week":
        start_date = now - timedelta(days=7)
    elif period == "month":
        start_date = now - timedelta(days=30)
    elif period == "year":
        start_date = now - timedelta(days=365)
    else:
        start_date = None
    
    # Requête de base
    query = db.query(Transaction).filter(
        Transaction.seller_id == current_user.id
    )
    
    if start_date:
        query = query.filter(Transaction.created_at >= start_date)
    
    # Pagination
    #total = query.count()
    total = query.with_entities(func.count()).scalar()
    
    transactions = query.order_by(
        desc(Transaction.created_at)
    ).offset((page - 1) * limit).limit(limit).all()
    
    # Statistiques de la période
    period_query = db.query(
        func.count(Transaction.id).label('total'),
        func.sum(Transaction.amount).label('revenue'),
        func.sum(Transaction.platform_fee_amount).label('fees')
    ).filter(Transaction.seller_id == current_user.id)
    
    if start_date:
        period_query = period_query.filter(Transaction.created_at >= start_date)
    
    stats = period_query.first()
    
    return {
        "transactions": transactions,
        "stats": {
            "period_sales": stats.total or 0,
            "period_revenue": float(stats.revenue or 0),
            "period_fees": float(stats.fees or 0)
        },
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "pages": (total + limit - 1) // limit
        }
    }

@router.post("/withdrawals/request")
async def request_withdrawal(
    request:Request,
    data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Demande de retrait de fonds"""
    
    if not current_user.is_seller:
        raise HTTPException(403, "Vous devez être vendeur")
    
    amount = data.get("amount")
    method = data.get("method")
    account_details = data.get("account_details", {})
    
    if not amount or amount <= 0:
        raise HTTPException(400, "Montant invalide")
    
    if amount < 10:
        raise HTTPException(400, "Le montant minimum de retrait est de 10€")
    
    # Récupérer le wallet
    wallet = db.query(SellerWallet).filter(
        SellerWallet.seller_id == current_user.id
    ).first()
    
    if not wallet:
        raise HTTPException(404, "Portefeuille non trouvé")
    
    if wallet.balance < amount:
        raise HTTPException(400, f"Solde insuffisant. Disponible: {wallet.balance}€")
    
    # Créer la demande de retrait
    withdrawal = Withdrawal(
        wallet_id=wallet.id,
        seller_id=current_user.id,
        amount=amount,
        fee=0.0,  # Pas de frais en simulation
        net_amount=amount,
        method=method,
        account_details=str(account_details),
        status="pending",
        reference=f"WD-{datetime.utcnow().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
    )
    
    db.add(withdrawal)
    
    # Mettre à jour le wallet (réduire le solde)
    wallet.balance -= amount
    wallet.total_withdrawn += amount
    
    db.commit()
    
    audit = AuditService(db)
    await audit.log_create(
        resource_type="withdrawal",
        resource_id=withdrawal.id,
        values={"amount": amount, "method": method},
        user_id=current_user.id,
        user_email=current_user.email,
        request=request
    )
    return {
        "success": True,
        "withdrawal_id": withdrawal.id,
        "reference": withdrawal.reference,
        "amount": amount,
        "status": "pending",
        "estimated_date": (datetime.utcnow() + timedelta(days=3)).isoformat()
    }

@router.get("/withdrawals")
async def get_withdrawals(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Récupère l'historique des retraits"""
    
    if not current_user.is_seller:
        raise HTTPException(403, "Vous devez être vendeur")
    
    withdrawals = db.query(Withdrawal).filter(
        Withdrawal.seller_id == current_user.id
    ).order_by(desc(Withdrawal.created_at)).all()
    
    return withdrawals


