# backend/app/models/transaction.py - VERSION COMPLÈTE
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Enum, JSON, Boolean
from sqlalchemy.orm import relationship
from ..core.database import Base
import uuid
from datetime import datetime
import enum

class PaymentMethod(str, enum.Enum):
    CARD = "card"  # Stripe
    PAYPAL = "paypal"
    MONCASH = "moncash"
    NATCASH = "natcash"
    CASH_ON_DELIVERY = "cash_on_delivery"
    BANK_TRANSFER = "bank_transfer"

class PaymentStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"
    PARTIALLY_REFUNDED = "partially_refunded"

class TransactionStatus(str, enum.Enum):
    PENDING = "pending"           # En attente de paiement
    PAID = "paid"                  # Payé, argent en attente sur notre compte
    RELEASED = "released"          # Argent reversé au vendeur
    WITHDRAWN = "withdrawn"        # Retiré par le vendeur
    REFUNDED = "refunded"          # Remboursé
    CANCELLED = "cancelled"        # Annulé

class PaymentProvider(str, enum.Enum):
    STRIPE = "stripe"
    PAYPAL = "paypal"
    MONCASH = "moncash"
    NATCASH = "natcash"
    MANUAL = "manual"

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Liens
    order_id = Column(String, ForeignKey("orders.id"), nullable=False)
    shop_id = Column(String, ForeignKey("shops.id"), nullable=False)
    seller_id = Column(String, ForeignKey("users.id"), nullable=False)
    customer_id = Column(String, ForeignKey("users.id"), nullable=True)
    
    # Montants
    amount = Column(Float, nullable=False)  # Montant total
    platform_fee = Column(Float, nullable=False)  # Commission plateforme (%)
    platform_fee_amount = Column(Float, nullable=False)  # Montant commission
    seller_amount = Column(Float, nullable=False)  # Montant pour vendeur
    payment_fee = Column(Float, default=0.0)  # Frais du prestataire
    net_amount = Column(Float, nullable=False)  # Montant net après tous frais
    
    # Paiement
    payment_method = Column(Enum(PaymentMethod), nullable=False)
    payment_provider = Column(Enum(PaymentProvider), nullable=False)
    payment_status = Column(Enum(PaymentStatus), default=PaymentStatus.PENDING)
    transaction_status = Column(Enum(TransactionStatus), default=TransactionStatus.PENDING)
    
    # Identifiants de paiement (multi-providers)
    provider_payment_id = Column(String, nullable=True)  # ID chez le provider
    provider_charge_id = Column(String, nullable=True)
    provider_transfer_id = Column(String, nullable=True)  # Pour transfert au vendeur
    provider_refund_id = Column(String, nullable=True)
    
    # Paiement local (MonCash/NatCash)
    local_reference = Column(String, nullable=True)  # Référence locale
    phone_number = Column(String, nullable=True)  # Téléphone pour paiement mobile
    confirmation_code = Column(String, nullable=True)  # Code de confirmation
    
    # Dates
    paid_at = Column(DateTime, nullable=True)
    released_at = Column(DateTime, nullable=True)  # Reversé au vendeur
    withdrawn_at = Column(DateTime, nullable=True)
    refunded_at = Column(DateTime, nullable=True)
    
    # Métadonnées
    transaction_metadata = Column(String)
    notes = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relations
    order = relationship("Order", back_populates="transactions")
    shop = relationship("Shop", back_populates="transactions")
    seller = relationship("User", foreign_keys=[seller_id], back_populates="seller_transactions")
    customer = relationship("User", foreign_keys=[customer_id], back_populates="customer_transactions")

    def __repr__(self):
        return f"<Transaction {self.id}: {self.amount}€ via {self.payment_method}>"
    
