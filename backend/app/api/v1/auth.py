from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from app.services.audit import AuditService
from sqlalchemy.orm import Session
from datetime import timedelta
from app.core.database import get_db
from app.schemas.user import UserCreate, UserLogin, UserResponse, Token
from app.models.user import User
from app.schemas.user import UserUpdate, UserProfileResponse, PasswordChange
from app.core.security import get_current_user  # ← À ajouter dans security.py

# from app.core.security import (
#     verify_password, get_password_hash, 
#     create_access_token, create_refresh_token, decode_token
# )

# SECRET_KEY = "shoptonik-secret-key-change-in-production"
# ALGORITHM = "HS256"
# ACCESS_TOKEN_EXPIRE_MINUTES = 30
from app.core.config import settings
# PAR :
from app.core.security import (
    verify_password, get_password_hash,
    create_access_token, create_refresh_token, decode_token
)


router = APIRouter(prefix="/auth", tags=["authentication"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login")

@router.post("/register", response_model=Token)
async def register(request:Request, user_data: UserCreate, db: Session = Depends(get_db)):
    """Inscription d'un nouvel utilisateur"""
    
    # Vérifier si l'email existe déjà
    existing_user = db.query(User).filter(
        (User.email == user_data.email) | (User.username == user_data.username)
    ).first()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email ou nom d'utilisateur déjà utilisé"
        )
    
    # Créer l'utilisateur
    db_user = User(
        email=user_data.email,
        username=user_data.username,
        full_name=user_data.full_name,
        hashed_password=get_password_hash(user_data.password)
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    # ✅ AJOUTER L'AUDIT
    audit = AuditService(db)
    await audit.log_create(
        resource_type="user",
        resource_id=db_user.id,
        values={
            "email": db_user.email,
            "username": db_user.username,
            "full_name": db_user.full_name
        },
        user_id=db_user.id,
        user_email=db_user.email,
        request=request
    )

    # AJOUTEZ CE BLOC POUR CRÉER LES TOKENS
    access_token = create_access_token(
        data={"sub": str(db_user.id), "email": db_user.email, "type": "access"}
    )
    refresh_token = create_refresh_token(
        data={"sub": str(db_user.id), "email": db_user.email, "type": "refresh"}
    )
    
    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserResponse.from_orm(db_user)  # Convertir en UserResponse
    )

@router.post("/login", response_model=Token)
async def login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """Connexion et génération de tokens"""
    
    # Chercher l'utilisateur
    user = db.query(User).filter(User.email == form_data.username).first()
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        # Journaliser l'échec
        audit = AuditService(db)
        await audit.log_login(
            user_id=user.id if user else None,
            user_email=form_data.username,
            success=False,
            request=request,
            error="Identifiants invalides"
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect",
            headers={"WWW-Authenticate": "Bearer"},
        )
    audit = AuditService(db)
    await audit.log_login(
        user_id=user.id,
        user_email=user.email,
        success=True,
        request=request
    )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Compte désactivé"
        )
    
    # Créer les tokens
    access_token = create_access_token(
        data={"sub": user.id, "email": user.email, "type": "access"}
    )
    
    refresh_token = create_refresh_token(
        data={"sub": user.id, "email": user.email, "type": "refresh"}
    )
    
    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserResponse.from_orm(user)
    )

@router.post("/refresh")
async def refresh_token(refresh_token: str, db: Session = Depends(get_db)):
    """Rafraîchir le token d'accès"""
    
    payload = decode_token(refresh_token)
    
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de rafraîchissement invalide"
        )
    
    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utilisateur non trouvé"
        )
    
    # Créer un nouveau token d'accès
    new_access_token = create_access_token(
        data={"sub": user.id, "email": user.email}
    )
    
    return {
        "access_token": new_access_token,
        "token_type": "bearer"
    }

@router.get("/me", response_model=UserResponse)
async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    """Récupérer l'utilisateur actuel"""
    
    payload = decode_token(token)
    
    if not payload or payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalide"
        )
    
    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utilisateur non trouvé"
        )
    
    return user


# backend/app/api/v1/auth.py - À AJOUTER


@router.get("/profile", response_model=UserProfileResponse)
async def get_profile(current_user: User = Depends(get_current_user)):
    """Récupérer le profil complet"""
    return current_user

@router.put("/profile", response_model=UserProfileResponse)
async def update_profile(
    profile_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mettre à jour le profil"""
    # Vérifier email unique
    if profile_data.email and profile_data.email != current_user.email:
        existing = db.query(User).filter(User.email == profile_data.email).first()
        if existing:
            raise HTTPException(400, "Email déjà utilisé")
    
    # Mettre à jour
    for field, value in profile_data.dict(exclude_unset=True).items():
        setattr(current_user, field, value)
    
    db.commit()
    return current_user

@router.post("/profile/change-password")
async def change_password(
    passwords: PasswordChange,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Changer le mot de passe"""
    if not verify_password(passwords.current_password, current_user.hashed_password):
        raise HTTPException(400, "Mot de passe actuel incorrect")
    
    current_user.hashed_password = get_password_hash(passwords.new_password)
    db.commit()
    return {"message": "Mot de passe mis à jour"}

# backend/app/api/v1/auth.py - À AJOUTER
@router.post("/logout")
async def logout(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Déconnexion"""
    audit = AuditService(db)
    await audit.log_logout(
        user_id=current_user.id,
        user_email=current_user.email,
        request=request
    )
    
    return {"message": "Déconnexion réussie"}