import os
import uuid
from PIL import Image
import io
from fastapi import UploadFile, HTTPException
import boto3  # Pour S3 (optionnel)
from datetime import datetime
import magic

class ImageService:
    def __init__(self):
        self.ALLOWED_MIME_TYPES = {
            'image/jpeg': 'jpg',
            'image/png': 'png',
            'image/webp': 'webp',
            'image/gif': 'gif'
        }
        self.MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
        
        # Config S3 (optionnel - pour production)
        self.use_s3 = os.getenv('USE_S3', 'false').lower() == 'true'
        if self.use_s3:
            self.s3_client = boto3.client(
                's3',
                aws_access_key_id=os.getenv('AWS_ACCESS_KEY'),
                aws_secret_access_key=os.getenv('AWS_SECRET_KEY'),
                region_name=os.getenv('AWS_REGION')
            )
            self.s3_bucket = os.getenv('S3_BUCKET')
        else:
            # Créer le répertoire uploads s'il n'existe pas
            os.makedirs("uploads", exist_ok=True)
    
    def validate_image(self, file: UploadFile) -> bool:
        """Valider le type et la taille de l'image"""
        # Vérifier la taille
        file.file.seek(0, 2)  # Aller à la fin
        size = file.file.tell()
        file.file.seek(0)  # Retourner au début
        
        if size > self.MAX_FILE_SIZE:
            raise HTTPException(
                status_code=400,
                detail=f"L'image est trop grande (max {self.MAX_FILE_SIZE/1024/1024:.1f}MB)"
            )
        
        # Vérifier le type MIME
        content = file.file.read(2048)
        file.file.seek(0)
        
        mime_type = magic.from_buffer(content, mime=True)
        if mime_type not in self.ALLOWED_MIME_TYPES:
            raise HTTPException(
                status_code=400,
                detail=f"Type de fichier non supporté. Types acceptés: {', '.join(self.ALLOWED_MIME_TYPES.keys())}"
            )
        
        return True
    
    async def optimize_image(
        self, 
        file: UploadFile, 
        max_width: int = 1200,
        max_height: int = 1200,
        quality: int = 85
    ) -> bytes:
        """Optimiser et redimensionner l'image"""
        # Lire l'image
        image_bytes = await file.read()
        image = Image.open(io.BytesIO(image_bytes))
        
        # Convertir en RGB si nécessaire
        if image.mode in ('RGBA', 'LA', 'P'):
            background = Image.new('RGB', image.size, (255, 255, 255))
            if image.mode == 'P':
                image = image.convert('RGBA')
            background.paste(image, mask=image.split()[-1] if image.mode == 'RGBA' else None)
            image = background
        
        # Redimensionner si trop grand
        if image.width > max_width or image.height > max_height:
            image.thumbnail((max_width, max_height), Image.Resampling.LANCZOS)
        
        # Optimiser la qualité
        output = io.BytesIO()
        
        # Déterminer le format de sortie basé sur le type MIME
        mime_type = magic.from_buffer(image_bytes, mime=True)
        
        if mime_type == 'image/png':
            # Garder PNG pour transparence
            image.save(output, format='PNG', optimize=True)
        elif mime_type == 'image/gif':
            # Garder GIF pour animation
            output = io.BytesIO(image_bytes)  # Utiliser l'original
        else:
            # Convertir en WebP pour meilleure compression
            image.save(output, format='WEBP', quality=quality, method=6)
        
        optimized_bytes = output.getvalue()
        
        # Vérifier que l'optimisation réduit bien la taille
        if len(optimized_bytes) > len(image_bytes):
            # Si l'optimisation n'aide pas, utiliser l'original avec qualité réduite
            output = io.BytesIO()
            if mime_type == 'image/png':
                image.save(output, format='PNG')
            else:
                image.save(output, format='JPEG', quality=quality, optimize=True)
            optimized_bytes = output.getvalue()
        
        return optimized_bytes
    
    async def save_image(self, file: UploadFile, directory: str = "products") -> str:
        """Sauvegarder l'image optimisée"""
        # Valider l'image
        self.validate_image(file)
        
        # Optimiser l'image
        optimized_bytes = await self.optimize_image(file)
        
        # Générer un nom de fichier unique
        content = file.file.read(2048)
        file.file.seek(0)
        mime_type = magic.from_buffer(content, mime=True)
        extension = self.ALLOWED_MIME_TYPES.get(mime_type, 'jpg')
        filename = f"{uuid.uuid4().hex[:16]}.{extension}"
        
        if self.use_s3:
            # Upload vers S3
            path = f"{directory}/{filename}"
            self.s3_client.put_object(
                Bucket=self.s3_bucket,
                Key=path,
                Body=optimized_bytes,
                ContentType=mime_type,
                ACL='public-read'
            )
            url = f"https://{self.s3_bucket}.s3.amazonaws.com/{path}"
        else:
            # Sauvegarder localement
            upload_dir = f"uploads/{directory}"
            os.makedirs(upload_dir, exist_ok=True)
            
            filepath = f"{upload_dir}/{filename}"
            with open(filepath, "wb") as buffer:
                buffer.write(optimized_bytes)
            
            # Retourner l'URL d'accès via le serveur statique
            url = f"/uploads/{directory}/{filename}"
        
        return url
    
    async def upload_multiple_images(
        self, 
        files: list[UploadFile], 
        directory: str = "products"
    ) -> list[str]:
        """Uploader plusieurs images"""
        urls = []
        
        for file in files:
            try:
                url = await self.save_image(file, directory)
                urls.append(url)
            except Exception as e:
                # Continuer avec les autres images même si une échoue
                print(f"Erreur upload image {file.filename}: {str(e)}")
                continue
        
        return urls

# Instance globale
image_service = ImageService()
