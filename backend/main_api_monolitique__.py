"""
ShopTonik - Plateforme e-commerce multi-vendeurs
Backend FastAPI optimisé avec authentification JWT
"""

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
import sqlite3
import uuid
import re
import os
from contextlib import contextmanager

# ========== CONFIGURATION ==========
SECRET_KEY = os.getenv("SECRET_KEY", "shoptonik-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# ========== INITIALISATION ==========
app = FastAPI(
    title="ShopTonik API",
    description="Plateforme e-commerce multi-vendeurs complète",
    version="2.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://localhost:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

# ========== BASE DE DONNÉES ==========
class Database:
    def __init__(self, db_path="shoptonik_v2.db"):
        self.db_path = db_path
        self._init_db()
    
    def _init_db(self):
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            # Table Users
            cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                username TEXT UNIQUE NOT NULL,
                full_name TEXT,
                hashed_password TEXT NOT NULL,
                is_active BOOLEAN DEFAULT TRUE,
                is_seller BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            ''')
            
            # Table Shops
            cursor.execute('''
            CREATE TABLE IF NOT EXISTS shops (
                id TEXT PRIMARY KEY,
                owner_id TEXT NOT NULL,
                name TEXT NOT NULL,
                slug TEXT UNIQUE NOT NULL,
                description TEXT,
                logo_url TEXT,
                banner_url TEXT,
                primary_color TEXT DEFAULT '#3B82F6',
                currency TEXT DEFAULT 'EUR',
                is_active BOOLEAN DEFAULT TRUE,
                subscription_plan TEXT DEFAULT 'free',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (owner_id) REFERENCES users (id) ON DELETE CASCADE
            )
            ''')
            
            # Table Products
            cursor.execute('''
            CREATE TABLE IF NOT EXISTS products (
                id TEXT PRIMARY KEY,
                shop_id TEXT NOT NULL,
                name TEXT NOT NULL,
                slug TEXT NOT NULL,
                description TEXT,
                price INTEGER NOT NULL,  -- en centimes
                compare_price INTEGER,
                sku TEXT,
                quantity INTEGER DEFAULT 0,
                is_available BOOLEAN DEFAULT TRUE,
                images TEXT,  -- JSON array
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (shop_id) REFERENCES shops (id) ON DELETE CASCADE,
                UNIQUE(shop_id, slug)
            )
            ''')
            
            # Table Orders (pour plus tard)
            cursor.execute('''
            CREATE TABLE IF NOT EXISTS orders (
                id TEXT PRIMARY KEY,
                shop_id TEXT NOT NULL,
                customer_email TEXT,
                customer_name TEXT,
                total_amount INTEGER,
                status TEXT DEFAULT 'pending',
                items TEXT,  -- JSON array des produits
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (shop_id) REFERENCES shops (id) ON DELETE CASCADE
            )
            ''')
            
            # Indexes
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_shops_owner ON shops(owner_id)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_shops_slug ON shops(slug)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_products_shop ON products(shop_id)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)')
            
            conn.commit()
    
    @contextmanager
    def get_connection(self):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        try:
            yield conn
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()
    
    @contextmanager
    def get_cursor(self):
        with self.get_connection() as conn:
            cursor = conn.cursor()
            try:
                yield cursor
            finally:
                cursor.close()

# Initialiser la base de données
db = Database()

# ========== MODÈLES PYDANTIC ==========
class UserBase(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    full_name: Optional[str] = None

class UserCreate(UserBase):
    password: str = Field(..., min_length=6)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: str
    is_active: bool
    is_seller: bool
    created_at: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class ShopBase(BaseModel):
    name: str
    description: Optional[str] = None

class ShopCreate(ShopBase):
    pass

class ShopResponse(ShopBase):
    id: str
    owner_id: str
    slug: str
    logo_url: Optional[str]
    primary_color: str
    currency: str
    is_active: bool
    created_at: str
    updated_at: str
    
    @property
    def dashboard_url(self) -> str:
        return f"/seller/dashboard/{self.slug}"
    
    @property
    def public_url(self) -> str:
        return f"/shop/{self.slug}"

class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: int = Field(..., gt=0)  # en centimes
    compare_price: Optional[int] = None
    sku: Optional[str] = None
    quantity: int = 0
    is_available: bool = True

class ProductCreate(ProductBase):
    pass

class ProductResponse(ProductBase):
    id: str
    shop_id: str
    slug: str
    images: Optional[str]
    created_at: str
    updated_at: str

# ========== UTILITAIRES ==========
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def generate_slug(text: str) -> str:
    """Génère un slug URL-friendly"""
    slug = text.lower()
    slug = re.sub(r'[^a-z0-9]+', '-', slug)
    slug = re.sub(r'^-|-$', '', slug)
    return slug

# ========== DÉPENDANCES ==========
async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    with db.get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
        user = cursor.fetchone()
    
    if user is None:
        raise credentials_exception
    if not user["is_active"]:
        raise HTTPException(status_code=400, detail="Inactive user")
    
    return dict(user)

async def get_current_seller(current_user: dict = Depends(get_current_user)):
    if not current_user.get("is_seller", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a seller account"
        )
    return current_user

# ========== ROUTES AUTHENTIFICATION ==========
@app.post("/api/auth/register", response_model=Token)
async def register(user_data: UserCreate):
    """Inscription d'un nouvel utilisateur"""
    with db.get_connection() as conn:
        cursor = conn.cursor()
        
        # Vérifier si l'email ou username existe déjà
        cursor.execute(
            "SELECT id FROM users WHERE email = ? OR username = ?",
            (user_data.email, user_data.username)
        )
        if cursor.fetchone():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email or username already registered"
            )
        
        # Créer l'utilisateur
        user_id = str(uuid.uuid4())
        hashed_password = get_password_hash(user_data.password)
        
        cursor.execute('''
            INSERT INTO users (id, email, username, full_name, hashed_password)
            VALUES (?, ?, ?, ?, ?)
        ''', (user_id, user_data.email, user_data.username, 
              user_data.full_name, hashed_password))
        
        # Créer le token
        access_token = create_access_token(data={"sub": user_id})
        
        # Récupérer l'utilisateur créé
        cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
        user = cursor.fetchone()
    
    return Token(
        access_token=access_token,
        user=UserResponse(
            id=user["id"],
            email=user["email"],
            username=user["username"],
            full_name=user["full_name"],
            is_active=user["is_active"],
            is_seller=user["is_seller"],
            created_at=user["created_at"]
        )
    )

@app.post("/api/auth/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """Connexion utilisateur"""
    with db.get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT * FROM users WHERE email = ?",
            (form_data.username,)
        )
        user = cursor.fetchone()
    
    if not user or not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user["is_active"]:
        raise HTTPException(status_code=400, detail="Inactive user")
    
    access_token = create_access_token(data={"sub": user["id"]})
    
    return Token(
        access_token=access_token,
        user=UserResponse(
            id=user["id"],
            email=user["email"],
            username=user["username"],
            full_name=user["full_name"],
            is_active=user["is_active"],
            is_seller=user["is_seller"],
            created_at=user["created_at"]
        )
    )

@app.get("/api/auth/me", response_model=UserResponse)
async def read_users_me(current_user: dict = Depends(get_current_user)):
    """Récupérer l'utilisateur courant"""
    return UserResponse(**current_user)

# ========== ROUTES BOUTIQUES ==========
@app.post("/api/shops", response_model=ShopResponse)
async def create_shop(
    shop_data: ShopCreate,
    current_user: dict = Depends(get_current_user)
):
    """Créer une nouvelle boutique"""
    # Vérifier si l'utilisateur peut créer une boutique
    if not current_user["is_seller"]:
        # Premier shop = devenir seller
        with db.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "UPDATE users SET is_seller = TRUE WHERE id = ?",
                (current_user["id"],)
            )
    
    # Générer un slug unique
    base_slug = generate_slug(shop_data.name)
    slug = base_slug
    counter = 1
    
    with db.get_connection() as conn:
        cursor = conn.cursor()
        
        while True:
            cursor.execute("SELECT id FROM shops WHERE slug = ?", (slug,))
            if not cursor.fetchone():
                break
            slug = f"{base_slug}-{counter}"
            counter += 1
        
        # Créer la boutique
        shop_id = str(uuid.uuid4())
        now = datetime.now().isoformat()
        
        cursor.execute('''
            INSERT INTO shops (
                id, owner_id, name, slug, description,
                created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (shop_id, current_user["id"], shop_data.name, slug,
              shop_data.description, now, now))
        
        # Récupérer la boutique créée
        cursor.execute("SELECT * FROM shops WHERE id = ?", (shop_id,))
        shop = cursor.fetchone()
    
    return ShopResponse(**dict(shop))

@app.get("/api/shops/my", response_model=List[ShopResponse])
async def get_my_shops(current_user: dict = Depends(get_current_user)):
    """Récupérer mes boutiques"""
    with db.get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT * FROM shops WHERE owner_id = ? ORDER BY created_at DESC",
            (current_user["id"],)
        )
        shops = cursor.fetchall()
    
    return [ShopResponse(**dict(shop)) for shop in shops]

@app.get("/api/shops/{slug}", response_model=ShopResponse)
async def get_shop(slug: str):
    """Récupérer une boutique par son slug (public)"""
    with db.get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM shops WHERE slug = ?", (slug,))
        shop = cursor.fetchone()
    
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
    
    return ShopResponse(**dict(shop))

# ========== ROUTES PRODUITS ==========
@app.post("/api/shops/{shop_slug}/products", response_model=ProductResponse)
async def create_product(
    shop_slug: str,
    product_data: ProductCreate,
    current_user: dict = Depends(get_current_user)
):
    """Créer un nouveau produit"""
    # Vérifier que l'utilisateur possède la boutique
    with db.get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT * FROM shops WHERE slug = ? AND owner_id = ?",
            (shop_slug, current_user["id"])
        )
        shop = cursor.fetchone()
    
    if not shop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shop not found or you don't have permission"
        )
    
    # Générer slug produit
    base_slug = generate_slug(product_data.name)
    slug = base_slug
    counter = 1
    
    with db.get_connection() as conn:
        cursor = conn.cursor()
        
        while True:
            cursor.execute(
                "SELECT id FROM products WHERE shop_id = ? AND slug = ?",
                (shop["id"], slug)
            )
            if not cursor.fetchone():
                break
            slug = f"{base_slug}-{counter}"
            counter += 1
        
        # Créer le produit
        product_id = str(uuid.uuid4())
        now = datetime.now().isoformat()
        
        cursor.execute('''
            INSERT INTO products (
                id, shop_id, name, slug, description, price,
                compare_price, sku, quantity, is_available,
                created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            product_id, shop["id"], product_data.name, slug,
            product_data.description, product_data.price,
            product_data.compare_price, product_data.sku,
            product_data.quantity, product_data.is_available,
            now, now
        ))
        
        # Récupérer le produit créé
        cursor.execute("SELECT * FROM products WHERE id = ?", (product_id,))
        product = cursor.fetchone()
    
    return ProductResponse(**dict(product))

@app.get("/api/shops/{shop_slug}/products", response_model=List[ProductResponse])
async def get_shop_products(shop_slug: str, public: bool = True):
    """Récupérer les produits d'une boutique"""
    with db.get_connection() as conn:
        cursor = conn.cursor()
        
        # Récupérer la boutique
        cursor.execute("SELECT id FROM shops WHERE slug = ?", (shop_slug,))
        shop = cursor.fetchone()
        
        if not shop:
            raise HTTPException(status_code=404, detail="Shop not found")
        
        # Récupérer les produits
        if public:
            cursor.execute(
                "SELECT * FROM products WHERE shop_id = ? AND is_available = TRUE ORDER BY created_at DESC",
                (shop["id"],)
            )
        else:
            cursor.execute(
                "SELECT * FROM products WHERE shop_id = ? ORDER BY created_at DESC",
                (shop["id"],)
            )
        
        products = cursor.fetchall()
    
    return [ProductResponse(**dict(product)) for product in products]

# ========== ROUTES DASHBOARD ==========
@app.get("/api/dashboard/{shop_slug}/stats")
async def get_dashboard_stats(
    shop_slug: str,
    current_user: dict = Depends(get_current_user)
):
    """Statistiques du dashboard (privé)"""
    # Vérifier les permissions
    with db.get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT * FROM shops WHERE slug = ? AND owner_id = ?",
            (shop_slug, current_user["id"])
        )
        shop = cursor.fetchone()
    
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
    
    # Compter les produits
    with db.get_connection() as conn:
        cursor = conn.cursor()
        
        # Stats produits
        cursor.execute(
            "SELECT COUNT(*) as total_products FROM products WHERE shop_id = ?",
            (shop["id"],)
        )
        total_products = cursor.fetchone()["total_products"]
        
        cursor.execute(
            "SELECT COUNT(*) as available_products FROM products WHERE shop_id = ? AND is_available = TRUE",
            (shop["id"],)
        )
        available_products = cursor.fetchone()["available_products"]
        
        # Stats commandes (simulées pour l'instant)
        cursor.execute(
            "SELECT COUNT(*) as total_orders FROM orders WHERE shop_id = ?",
            (shop["id"],)
        )
        total_orders = cursor.fetchone()["total_orders"] or 0
        
        cursor.execute(
            "SELECT SUM(total_amount) as total_revenue FROM orders WHERE shop_id = ?",
            (shop["id"],)
        )
        total_revenue = cursor.fetchone()["total_revenue"] or 0
    
    return {
        "shop_info": dict(shop),
        "stats": {
            "total_products": total_products,
            "available_products": available_products,
            "total_orders": total_orders,
            "total_revenue": total_revenue,
            "visitors": 1250,  # Simulé pour l'instant
            "conversion_rate": 3.2  # Simulé
        }
    }

# ========== ROUTES PUBLIQUES ==========
@app.get("/")
async def root():
    return {
        "message": "ShopTonik API",
        "version": "2.0.0",
        "status": "operational",
        "docs": "/api/docs"
    }

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

# ========== API V1 MODULAIRE ==========
# Importer les routeurs de l'API v1
try:
    from app.api.v1.auth import router as auth_router
    from app.api.v1.shops import router as shops_router
    # from app.api.v1.products import router as products_router  # Après création
    
    # Monter les routeurs avec le préfixe /api/v1
    app.include_router(auth_router, prefix="/api/v1")
    app.include_router(shops_router, prefix="/api/v1")
    # app.include_router(products_router, prefix="/api/v1")  # Après création
    
    print("✅ API v1 modulaire chargée")
except ImportError as e:
    print(f"⚠️ API v1 partiellement disponible: {e}")
    

# ========== DÉMARRAGE ==========
if __name__ == "__main__":
    import uvicorn
    print("=" * 50)
    print("🚀 ShopTonik API v2.0")
    print("📚 Documentation: http://localhost:8000/api/docs")
    print("🔐 Authentification: /api/auth/register | /api/auth/login")
    print("🏪 API Boutiques: /api/shops")
    print("=" * 50)
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

