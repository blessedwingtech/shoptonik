# backend/clean_test_data.py
import sqlite3

conn = sqlite3.connect('shoptonik.db')
cursor = conn.cursor()

print("🧹 NETTOYAGE DES DONNÉES DE TEST")
print("=" * 50)

# 1. Supprimer les retraits de test (ceux avec référence TEST ou WD-TEST)
cursor.execute("DELETE FROM withdrawals WHERE reference LIKE 'TEST-%' OR reference LIKE 'WD-TEST%' OR reference LIKE 'WD-%'")
print(f"✅ Retraits supprimés: {cursor.rowcount}")

# 2. Supprimer les transactions liées aux commandes de test
cursor.execute("""
    DELETE FROM transactions 
    WHERE order_id IN (SELECT id FROM orders WHERE order_number LIKE 'TEST-%')
""")
print(f"✅ Transactions supprimées: {cursor.rowcount}")

# 3. Supprimer les commandes de test
cursor.execute("DELETE FROM orders WHERE order_number LIKE 'TEST-%'")
print(f"✅ Commandes supprimées: {cursor.rowcount}")

# 4. Remettre le wallet à zéro pour le vendeur "moi"
cursor.execute("""
    UPDATE seller_wallets 
    SET balance = 0.0, 
        pending_balance = 0.0, 
        total_earned = 0.0, 
        total_withdrawn = 0.0
    WHERE seller_id = '161582ad-3ed9-4219-9bac-5dbe5d03e84d'
""")
print(f"✅ Wallet remis à zéro pour le vendeur 'moi'")

# 5. Vérification finale
print("\n🔍 VÉRIFICATION APRÈS NETTOYAGE:")
print("-" * 30)

cursor.execute("SELECT COUNT(*) FROM orders WHERE order_number LIKE 'TEST-%'")
print(f"Commandes test restantes: {cursor.fetchone()[0]}")

cursor.execute("SELECT * FROM seller_wallets WHERE seller_id = '161582ad-3ed9-4219-9bac-5dbe5d03e84d'")
wallet = cursor.fetchone()
if wallet:
    print(f"Wallet - balance: {wallet[2]} €")
    print(f"Wallet - pending: {wallet[3]} €")
    print(f"Wallet - earned: {wallet[4]} €")
    print(f"Wallet - withdrawn: {wallet[5]} €")

conn.commit()
conn.close()

print("\n🎉 NETTOYAGE TERMINÉ !")