# backend/app/cron/release_funds.py
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models import Transaction, SellerWallet
from app.models.transaction import TransactionStatus

def release_pending_funds():
    """
    À exécuter tous les jours à 00:00
    Libère les fonds en attente après 3 jours
    """
    db = SessionLocal()
    
    try:
        # Transactions payées il y a +3 jours
        cutoff = datetime.utcnow() - timedelta(days=3)
        
        transactions = db.query(Transaction).filter(
            Transaction.transaction_status == "paid",
            Transaction.paid_at <= cutoff,
            Transaction.released_at.is_(None)
        ).all()
        
        for transaction in transactions:
            # Mettre à jour le wallet
            wallet = db.query(SellerWallet).filter(
                SellerWallet.seller_id == transaction.seller_id
            ).first()
            
            if wallet:
                wallet.pending_balance -= transaction.seller_amount
                wallet.balance += transaction.seller_amount
                transaction.transaction_status = "released"
                transaction.released_at = datetime.utcnow()
                
                # Option: Notifier le vendeur
                # send_notification(...)
        
        db.commit()
        print(f"✅ {len(transactions)} transactions libérées")
        
    finally:
        db.close()

if __name__ == "__main__":
    release_pending_funds()
    