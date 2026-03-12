#!/bin/bash
set -e

echo "🚀 Déploiement ShopTonik avec Docker"

cd /var/www/shoptonik

# Backup de la base de données
echo "📦 Backup de la base de données..."
docker exec shoptonik-db pg_dump -U shoptonik shoptonik > backup_$(date +%Y%m%d).sql
gzip backup_$(date +%Y%m%d).sql
mv backup_*.sql.gz /home/bentz/backups/shoptonik/

# Pull des dernières modifications
git pull origin main

# Rebuild et redémarrage
echo "🔄 Rebuild des images..."
docker-compose build

# Démarrage avec le nouveau code
echo "▶️  Démarrage des conteneurs..."
docker-compose up -d

# Attendre que la base soit prête
sleep 5

# Migrations
echo "🗃️  Migrations..."
docker exec shoptonik-backend alembic upgrade head

# Nettoyage des anciennes images
docker image prune -f

echo "✅ Déploiement terminé!"
