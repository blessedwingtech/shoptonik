# backend/app/models/audit.py
from sqlalchemy import Column, String, DateTime, JSON, Integer, Text
from datetime import datetime
from app.core.database import Base
import uuid

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, nullable=True, index=True)  # Qui a fait l'action
    user_email = Column(String, nullable=True)  # Email pour faciliter les recherches
    action = Column(String, nullable=False)  # CREATE, UPDATE, DELETE, LOGIN, LOGOUT, etc.
    resource_type = Column(String, nullable=False)  # user, shop, product, order
    resource_id = Column(String, nullable=True)  # ID de la ressource concernée
    old_values = Column(JSON, nullable=True)  # Anciennes valeurs (pour UPDATE)
    new_values = Column(JSON, nullable=True)  # Nouvelles valeurs (pour CREATE/UPDATE)
    ip_address = Column(String, nullable=True)  # IP de l'utilisateur
    user_agent = Column(Text, nullable=True)  # Navigateur/appareil
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    status = Column(String, default="success")  # success, failure, pending
    error_message = Column(Text, nullable=True)  # Si échec
    shop_id = Column(String, nullable=True, index=True)  # Pour filtrer par boutique

    def __repr__(self):
        return f"<AuditLog {self.action} on {self.resource_type} at {self.timestamp}>"
    