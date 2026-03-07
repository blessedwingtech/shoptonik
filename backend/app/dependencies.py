import uuid
from typing import Optional
from fastapi import Depends, HTTPException, status, Request, Cookie
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from .core.database import get_db
from .core.security import decode_token
from .core.config import settings
from .models.user import User 

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login")

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    """
    Dépendance pour récupérer l'utilisateur courant à partir du token JWT
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # Utilisez decode_token de security.py
    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        raise credentials_exception
    
    user_id: str = payload.get("sub")
    if user_id is None:
        raise credentials_exception
    
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
    
    return user

async def get_current_user_optional(
    token: Optional[str] = Depends(oauth2_scheme, use_cache=False),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """
    Version optionnelle qui retourne None si pas d'authentification
    """
    if not token:
        return None
    
    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        return None
    
    user_id: str = payload.get("sub")
    if not user_id:
        return None
    
    user = db.query(User).filter(User.id == user_id).first()
    return user

# Alias pour compatibilité
get_current_active_user = get_current_user

def get_session_id(
    cart_session_id: Optional[str] = Cookie(None, alias="cart_session_id")
) -> Optional[str]:
    """Récupérer l'ID de session du cookie"""
    return cart_session_id

def get_current_user_or_session(
    request: Request,
    current_user: Optional[User] = Depends(get_current_user_optional),
    session_id: Optional[str] = Depends(get_session_id)
):
    """Retourne soit l'utilisateur connecté, soit l'ID de session"""
    if current_user:
        return {"type": "user", "id": current_user.id}
    elif session_id:
        return {"type": "session", "id": session_id}
    else:
        # Créer une nouvelle session pour les guests
        new_session_id = str(uuid.uuid4())
        return {"type": "session", "id": new_session_id}
    
async def get_current_user_or_none(
    request: Request,
    db: Session = Depends(get_db)
) -> Optional[User]:
    """
    Récupère l'utilisateur si token valide, sinon retourne None
    Ne lève JAMAIS d'exception
    """
    try:
        # Essayer avec le header Authorization
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header[7:]
            if token and token.strip() and token.lower() not in ["null", "undefined", "none"]:
                print(f"🔑 [get_current_user_or_none] Token trouvé: {token[:20]}...")
                payload = decode_token(token)
                if payload and payload.get("type") == "access":
                    user_id = payload.get("sub")
                    if user_id:
                        user = db.query(User).filter(User.id == user_id).first()
                        if user:
                            print(f"✅ [get_current_user_or_none] Utilisateur trouvé: {user.email}")
                            return user
    except Exception as e:
        print(f"⚠️ [get_current_user_or_none] Erreur lors du décodage du token: {e}")
        # Ne pas lever d'exception, juste retourner None
        return None
    
    print(f"👤 [get_current_user_or_none] Pas de token valide, retourne None")
    return None




async def get_current_admin(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Vérifie que l'utilisateur est administrateur
    """
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )

    return current_user

