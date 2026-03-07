import sqlite3
import json

conn = sqlite3.connect('shoptonik.db')
cursor = conn.cursor()

# Vérifier la structure de la table
cursor.execute("PRAGMA table_info(shops)")
print("📊 Structure de la table shops:")
for col in cursor.fetchall():
    print(f"  - {col[1]} ({col[2]})")

# Vérifier les boutiques
cursor.execute("SELECT id, slug, accepted_payment_methods FROM shops")
shops = cursor.fetchall()

print("\n🏪 Boutiques trouvées:")
for shop_id, slug, methods in shops:
    print(f"\nBoutique: {slug}")
    print(f"  ID: {shop_id}")
    print(f"  Type: {type(methods)}")
    print(f"  Valeur brute: {methods}")
    
    if methods:
        try:
            parsed = json.loads(methods)
            print(f"  Parsé: {parsed}")
            print(f"  Type après parse: {type(parsed)}")
        except:
            print(f"  ❌ Impossible de parser: {methods}")

conn.close()