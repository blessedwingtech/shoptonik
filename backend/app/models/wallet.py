# backend/app/models/wallet.py
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Boolean, Enum
from sqlalchemy.orm import relationship
from ..core.database import Base
import uuid
from datetime import datetime
import enum

class WithdrawalStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class SellerWallet(Base):
    __tablename__ = "seller_wallets"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    seller_id = Column(String, ForeignKey("users.id"), unique=True, nullable=False)
    
    # Solde
    balance = Column(Float, default=0.0)
    pending_balance = Column(Float, default=0.0)
    total_earned = Column(Float, default=0.0)
    total_withdrawn = Column(Float, default=0.0)
    
    # Configuration
    auto_withdrawal = Column(Boolean, default=False)
    withdrawal_threshold = Column(Float, default=50.0)
    
    # Métadonnées
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relations
    seller = relationship("User", back_populates="wallet")
    withdrawals = relationship("Withdrawal", back_populates="wallet", cascade="all, delete-orphan")

class Withdrawal(Base):
    __tablename__ = "withdrawals"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    wallet_id = Column(String, ForeignKey("seller_wallets.id"), nullable=False)
    seller_id = Column(String, ForeignKey("users.id"), nullable=False)
    
    # Montant
    amount = Column(Float, nullable=False)
    fee = Column(Float, default=0.0)
    net_amount = Column(Float, nullable=False)
    
    # Statut
    status = Column(Enum(WithdrawalStatus), default=WithdrawalStatus.PENDING)
    
    # Méthode de retrait
    method = Column(String, nullable=False)  # 'bank', 'paypal', 'moncash'
    account_details = Column(String, nullable=True)
    
    # Métadonnées
    reference = Column(String, unique=True, nullable=True)
    processed_at = Column(DateTime, nullable=True)
    notes = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relations
    wallet = relationship("SellerWallet", back_populates="withdrawals")
    seller = relationship("User")
    