# backend/update_payment_confirmed.py
import sqlite3

# Connexion à la base
conn = sqlite3.connect('shoptonik.db')
cursor = conn.cursor()

print("🔍 Vérification des valeurs actuelles...")
cursor.execute("SELECT id, order_number, payment_status, payment_method FROM orders")
orders = cursor.fetchall()
for order in orders:
    print(f"  {order[1]}: status={order[2]}, method={order[3]}")

print("\n🔄 Mise à jour des commandes...")

# 1. Commandes avec payment_status = 'paid'
cursor.execute("UPDATE orders SET payment_confirmed = 1 WHERE payment_status = 'paid'")
print(f"  ✅ {cursor.rowcount} commandes 'paid' mises à jour")

# 2. Commandes cash_on_delivery
cursor.execute("UPDATE orders SET payment_confirmed = 1 WHERE payment_method = 'cash_on_delivery'")
print(f"  ✅ {cursor.rowcount} commandes COD mises à jour")

# 3. Toutes les autres commandes
cursor.execute("UPDATE orders SET payment_confirmed = 0 WHERE payment_confirmed IS NULL")
print(f"  ✅ {cursor.rowcount} commandes restantes mises à 0")

conn.commit()

print("\n📊 Vérification finale...")
cursor.execute("SELECT payment_confirmed, COUNT(*) FROM orders GROUP BY payment_confirmed")
results = cursor.fetchall()
for val, count in results:
    print(f"  payment_confirmed={val}: {count} commandes")

conn.close()
print("\n✅ Mise à jour terminée !")