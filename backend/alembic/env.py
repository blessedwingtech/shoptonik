import sys
from os.path import abspath, dirname

# Ajoutez le chemin du projet
sys.path.insert(0, dirname(dirname(abspath(__file__))))

from sqlalchemy import engine_from_config, pool
from alembic import context

# Importez votre Base de données
from app.core.database import Base

# Importez TOUS vos modèles
from app.models import user, shop, product, order, audit

config = context.config
target_metadata = Base.metadata

import os
from dotenv import load_dotenv

load_dotenv()  # Charge le fichier .env

# Remplacer la configuration de l'URL par la variable d'env
db_password = os.getenv('DB_PASSWORD')
db_url = f"postgresql://shoptonik:{db_password}@postgres:5432/shoptonik"
config.set_main_option('sqlalchemy.url', db_url)

def run_migrations_offline():
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"}
    )
    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online():
    # Utiliser la configuration de la base de données depuis les variables d'env
    from app.core.config import settings
    
    connectable = engine_from_config(
        {
            "sqlalchemy.url": settings.database_url,
        },
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
