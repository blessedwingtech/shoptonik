"""
Module de sécurité - VERSION SIMPLIFIÉE
"""
import bcrypt
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

# Configuration DIRECTE (pas d'import de settings)
from .config import settings
SECRET_KEY = settings.secret_key
ALGORITHM = settings.algorithm
ACCESS_TOKEN_EXPIRE_MINUTES = settings.access_token_expire_minutes

security = HTTPBearer()

def get_password_hash(password: str) -> str:
    if len(password.encode('utf-8')) > 72:
        password = password[:72]
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    if len(plain_password.encode('utf-8')) > 72:
        plain_password = plain_password[:72]
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def create_refresh_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=7)  # 7 jours pour refresh token
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def decode_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None
        

# ... vos fonctions existantes ...

def get_current_user(token: str = Depends(security)) -> dict:
    """
    Fonction de dépendance FastAPI pour obtenir l'utilisateur courant
    Utilisation : @router.get("/items", dependencies=[Depends(get_current_user)])
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    if not token.credentials:
        raise credentials_exception
    
    payload = decode_token(token.credentials)
    if payload is None:
        raise credentials_exception
    
    # Vérifiez si le token a expiré
    exp = payload.get("exp")
    if exp and datetime.utcnow() > datetime.fromtimestamp(exp):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Retournez les informations de l'utilisateur depuis le payload
    # Adaptez selon la structure de votre payload JWT
    user_id = payload.get("sub")
    username = payload.get("username")
    
    if not user_id:
        raise credentials_exception
    
    return {
        "id": user_id,
        "username": username,
        "token": token.credentials
    }


# Version alternative si vous voulez une fonction plus simple
async def get_current_user_simple(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """
    Version simplifiée sans vérification poussée
    """
    token = credentials.credentials
    
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No token provided"
        )
    
    # Décodage basique
    payload = decode_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    
    return {
        "id": payload.get("sub") or 1,
        "username": payload.get("username") or "anonymous",
        "token": token
    }

# Ajoutez à la FIN du fichier :

# Vous aurez besoin d'importer ces dépendances
# Mais attention aux imports circulaires !

def require_shop_owner():
    """
    Placeholder - la vraie fonction est dans dependencies.py
    """
    raise NotImplementedError("require_shop_owner a été déplacé dans dependencies.py")