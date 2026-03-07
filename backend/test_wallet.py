# backend/test_wallet.py
import sqlite3
import uuid
from datetime import datetime

# Connexion à la base
conn = sqlite3.connect('shoptonik.db')
conn.row_factory = sqlite3.Row
cursor = conn.cursor()

print("🔍 RÉCUPÉRATION DES IDS")
print("=" * 50)

# 1. Voir les boutiques
cursor.execute("SELECT id, name, owner_id FROM shops")
shops = cursor.fetchall()
print("\n🏪 BOUTIQUES:")
for shop in shops:
    print(f"  ID: {shop['id']}")
    print(f"  Nom: {shop['name']}")
    print(f"  Owner ID: {shop['owner_id']}")
    print()

# 2. Voir les utilisateurs
cursor.execute("SELECT id, email, username, is_seller FROM users")
users = cursor.fetchall()
print("\n👤 UTILISATEURS:")
for user in users:
    print(f"  ID: {user['id']}")
    print(f"  Email: {user['email']}")
    print(f"  Username: {user['username']}")
    print(f"  Is seller: {user['is_seller']}")
    print()

# 3. Voir les wallets
cursor.execute("SELECT * FROM seller_wallets")
wallets = cursor.fetchall()
print("\n💰 WALLETS:")
for wallet in wallets:
    print(dict(wallet))
    print()

# 4. Créer un wallet si nécessaire
if not wallets and shops:
    seller_id = shops[0]['owner_id']
    print(f"\n✨ Création d'un wallet pour le vendeur {seller_id}")
    cursor.execute("""
        INSERT INTO seller_wallets 
        (id, seller_id, balance, pending_balance, total_earned, total_withdrawn, created_at, updated_at)
        VALUES (?, ?, 0.0, 0.0, 0.0, 0.0, ?, ?)
    """, (str(uuid.uuid4()), seller_id, datetime.now(), datetime.now()))
    conn.commit()
    print("✅ Wallet créé")

# 5. DEMANDEZ À L'UTILISATEUR DE CHOISIR LES IDS
if shops and users:
    print("\n📋 COPIEZ CES IDS POUR LA SUITE :")
    print("-" * 50)
    print(f"Shop ID: {shops[0]['id']}")
    
    # Trouver un vendeur
    seller = next((u for u in users if u['is_seller']), users[0])
    print(f"Seller ID: {seller['id']}")
    
    # Trouver un client
    customer = next((u for u in users if not u['is_seller']), users[0])
    print(f"Customer ID: {customer['id']}")
    print("-" * 50)

# Fermeture
conn.close()