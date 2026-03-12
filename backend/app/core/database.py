from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# URL de la DB depuis la configuration
SQLALCHEMY_DATABASE_URL = settings.database_url

# Configuration selon le type de base de données
connect_args = {}
if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

# Création du moteur
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args=connect_args
)

# Session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base pour les modèles
Base = declarative_base()

# Importer tous les modèles pour que SQLAlchemy connaisse les tables
from app.models import user, shop, product, order, cart, transaction, audit

# Fonction utilitaire pour obtenir une session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ⚡ CRÉER LES TABLES SI ELLES N'EXISTENT PAS (optionnel, Alembic est préférable)
# Base.metadata.create_all(bind=engine)
