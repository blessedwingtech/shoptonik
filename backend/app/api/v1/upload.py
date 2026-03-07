import os
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from typing import List

from sqlalchemy.orm import Session
from app.services.image_service import image_service
from app.core.database import get_db
from app.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/upload", tags=["upload"])

@router.post("/single")
async def upload_single_image(
    file: UploadFile = File(...)
):
    """Uploader une seule image"""
    try:
        url = await image_service.save_image(file)
        return {"url": url}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/multiple")
async def upload_multiple_images(
    files: List[UploadFile] = File(...)
):
    """Uploader plusieurs images"""
    try:
        urls = await image_service.upload_multiple_images(files)
        return {"urls": urls}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/products/{shop_id}")
async def upload_product_images(
    shop_id: str,
    files: List[UploadFile] = File(...)
):
    """Uploader des images pour un produit spécifique"""
    try:
        directory = f"products/{shop_id}"
        urls = await image_service.upload_multiple_images(files, directory)
        return {"urls": urls}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    


# ✅ NOUVELLE ROUTE POUR AVATAR
@router.post("/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Uploader un avatar pour l'utilisateur connecté
    """
    try:
        # Valider que c'est bien une image
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="Le fichier doit être une image")
        
        # Sauvegarder l'image dans le dossier avatars
        url = await image_service.save_image(file, directory="avatars")
        
        # Mettre à jour l'utilisateur dans la base de données
        current_user.avatar = url
        db.commit()
        
        return {"url": url}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ✅ ROUTE AVEC OPTIMISATION SPÉCIFIQUE POUR AVATAR
@router.post("/avatar/optimized")
async def upload_avatar_optimized(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Uploader un avatar avec optimisation spécifique (taille réduite)
    """
    try:
        # Valider l'image
        image_service.validate_image(file)
        
        # Optimiser spécifiquement pour avatar (plus petit)
        optimized_bytes = await image_service.optimize_image(
            file,
            max_width=400,  # Plus petit que les produits
            max_height=400,
            quality=80  # Qualité légèrement réduite
        )
        
        # Générer un nom de fichier
        import uuid
        import magic
        content = await file.read(2048)
        await file.seek(0)
        mime_type = magic.from_buffer(content, mime=True)
        extension = image_service.ALLOWED_MIME_TYPES.get(mime_type, 'jpg')
        filename = f"avatar_{current_user.id}_{uuid.uuid4().hex[:8]}.{extension}"
        
        # Sauvegarder
        upload_dir = "uploads/avatars"
        os.makedirs(upload_dir, exist_ok=True)
        filepath = f"{upload_dir}/{filename}"
        
        with open(filepath, "wb") as buffer:
            buffer.write(optimized_bytes)
        
        # URL
        url = f"/uploads/avatars/{filename}"
        
        # Mettre à jour l'utilisateur
        current_user.avatar = url
        db.commit()
        
        return {"url": url}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))