from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# URL de la DB
SQLALCHEMY_DATABASE_URL = "sqlite:///./shoptonik.db"

# Création du moteur
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False}  # obligatoire pour SQLite
)

# Session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base pour les modèles
Base = declarative_base()

# Importer tous les modèles pour que SQLAlchemy connaisse les tables
from app.models import user, shop, product

# ⚡ CRÉER LES TABLES SI ELLES N'EXISTENT PAS
Base.metadata.create_all(bind=engine)

# Fonction utilitaire pour obtenir une session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

