# backend/app/services/audit.py
from sqlalchemy.orm import Session
from fastapi import Request
from app.models.audit import AuditLog
from datetime import datetime
import json
from typing import Optional, Any, Dict

class AuditService:
    """Service pour journaliser toutes les actions importantes"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def _make_json_serializable(self, obj: Any) -> Any:
        """Convertit récursivement les sets en listes pour être JSON serializable"""
        if obj is None:
            return None
        if isinstance(obj, set):
            return list(obj)
        if isinstance(obj, dict):
            return {k: self._make_json_serializable(v) for k, v in obj.items()}
        if isinstance(obj, (list, tuple)):
            return [self._make_json_serializable(item) for item in obj]
        # Ajoutez d'autres conversions si nécessaire (datetime, Decimal, etc.)
        return obj
    
    async def log(
        self,
        action: str,
        resource_type: str,
        user_id: Optional[str] = None,
        user_email: Optional[str] = None,
        resource_id: Optional[str] = None,
        old_values: Optional[Dict] = None,
        new_values: Optional[Dict] = None,
        request: Optional[Request] = None,
        status: str = "success",
        error_message: Optional[str] = None,
        shop_id: Optional[str] = None
    ):
        """Méthode principale pour journaliser une action"""
        
        # Extraire les infos de la requête si fournie
        ip_address = None
        user_agent = None
        if request:
            ip_address = request.client.host if request.client else None
            # Gérer les proxys
            forwarded = request.headers.get("x-forwarded-for")
            if forwarded:
                ip_address = forwarded.split(",")[0].strip()
            user_agent = request.headers.get("user-agent")
        
        # Nettoyer les valeurs sensibles (mots de passe, tokens)
        if new_values:
            new_values = new_values.copy() if isinstance(new_values, dict) else new_values
            if "password" in new_values:
                new_values["password"] = "[REDACTED]"
            # 🔥 CONVERTIR LES SETS EN LISTES
            new_values = self._make_json_serializable(new_values)
        
        if old_values:
            old_values = old_values.copy() if isinstance(old_values, dict) else old_values
            if "password" in old_values:
                old_values["password"] = "[REDACTED]"
            # 🔥 CONVERTIR LES SETS EN LISTES
            old_values = self._make_json_serializable(old_values)
        
        # Créer l'entrée d'audit
        log_entry = AuditLog(
            user_id=user_id,
            user_email=user_email,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            old_values=old_values,
            new_values=new_values,
            ip_address=ip_address,
            user_agent=user_agent,
            status=status,
            error_message=error_message,
            shop_id=shop_id
        )
        
        self.db.add(log_entry)
        self.db.commit()
        
        return log_entry
    
    
    async def log_login(self, user_id: str, user_email: str, success: bool, request: Request = None, error: str = None):
        """Journaliser une tentative de connexion"""
        await self.log(
            action="LOGIN",
            resource_type="user",
            user_id=user_id,
            user_email=user_email,
            resource_id=user_id,
            request=request,
            status="success" if success else "failure",
            error_message=error
        )
    
    async def log_logout(self, user_id: str, user_email: str, request: Request = None):
        """Journaliser une déconnexion"""
        await self.log(
            action="LOGOUT",
            resource_type="user",
            user_id=user_id,
            user_email=user_email,
            resource_id=user_id,
            request=request
        )
    
    async def log_create(
        self,
        resource_type: str,
        resource_id: str,
        values: Dict,
        user_id: str = None,
        user_email: str = None,
        request: Request = None,
        shop_id: str = None
    ):
        """Journaliser une création"""
        await self.log(
            action="CREATE",
            resource_type=resource_type,
            user_id=user_id,
            user_email=user_email,
            resource_id=resource_id,
            new_values=values,
            request=request,
            shop_id=shop_id
        )
    
    async def log_update(
        self,
        resource_type: str,
        resource_id: str,
        old_values: Dict,
        new_values: Dict,
        user_id: str = None,
        user_email: str = None,
        request: Request = None,
        shop_id: str = None
    ):
        """Journaliser une modification"""
        await self.log(
            action="UPDATE",
            resource_type=resource_type,
            user_id=user_id,
            user_email=user_email,
            resource_id=resource_id,
            old_values=old_values,
            new_values=new_values,
            request=request,
            shop_id=shop_id
        )
    
    async def log_delete(
        self,
        resource_type: str,
        resource_id: str,
        values: Dict,
        user_id: str = None,
        user_email: str = None,
        request: Request = None,
        shop_id: str = None
    ):
        """Journaliser une suppression"""
        await self.log(
            action="DELETE",
            resource_type=resource_type,
            user_id=user_id,
            user_email=user_email,
            resource_id=resource_id,
            old_values=values,
            request=request,
            shop_id=shop_id
        )

        