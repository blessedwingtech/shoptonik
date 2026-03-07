"""
Module de sécurité avec bcrypt corrigé
"""
import bcrypt
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional
from passlib.context import CryptContext
import os

# Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "shoptonik-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7

# Context Crypt avec fallback pour bcrypt
try:
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    print("✅ CryptContext avec bcrypt initialisé")
except Exception as e:
    print(f"⚠️ Erreur CryptContext, fallback à bcrypt direct: {e}")
    pwd_context = None

def get_password_hash(password: str) -> str:
    """Hash un mot de passe avec bcrypt (version corrigée)"""
    if len(password.encode('utf-8')) > 72:
        # Tronquer silencieusement pour bcrypt
        password = password[:72]
    
    if pwd_context:
        return pwd_context.hash(password)
    else:
        # Fallback direct à bcrypt
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
        return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Vérifie un mot de passe"""
    if len(plain_password.encode('utf-8')) > 72:
        plain_password = plain_password[:72]
    
    if pwd_context:
        return pwd_context.verify(plain_password, hashed_password)
    else:
        # Fallback direct à bcrypt
        return bcrypt.checkpw(
            plain_password.encode('utf-8'), 
            hashed_password.encode('utf-8')
        )

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Crée un token JWT d'accès"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def create_refresh_token(data: dict) -> str:
    """Crée un token JWT de rafraîchissement"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_token(token: str):
    """Décode et valide un token JWT"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None

        