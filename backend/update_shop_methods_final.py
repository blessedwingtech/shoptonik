import sqlite3
import json

conn = sqlite3.connect('shoptonik.db')
cursor = conn.cursor()

# Valeurs par défaut pour toutes les boutiques
default_methods = json.dumps(["card", "paypal", "moncash", "natcash", "cash_on_delivery"])

# Mettre à jour toutes les boutiques qui ont accepted_payment_methods = NULL
cursor.execute("""
    UPDATE shops 
    SET accepted_payment_methods = ? 
    WHERE accepted_payment_methods IS NULL
""", (default_methods,))

print(f"✅ {cursor.rowcount} boutiques mises à jour")

# Vérifier le résultat
cursor.execute("SELECT slug, accepted_payment_methods FROM shops")
print("\n📋 Après mise à jour:")
for slug, methods in cursor.fetchall():
    print(f"  {slug}: {methods}")
    try:
        parsed = json.loads(methods)
        print(f"    ✅ Parse OK: {parsed}")
    except:
        print(f"    ❌ Parse échoué")

conn.commit()
conn.close()
print("\n✨ Mise à jour terminée!")