# backend/test_wallet_full.py
import sqlite3
import uuid
from datetime import datetime

# Connexion à la base
conn = sqlite3.connect('shoptonik.db')
conn.row_factory = sqlite3.Row
cursor = conn.cursor()

print("🧪 TEST DU WALLET - DÉBUT")
print("=" * 60)

# ===========================================
# 1. PARAMÈTRES (vos IDs du script précédent)
# ===========================================
SHOP_ID = "04de1179-4a84-4ce3-b085-8c3fe2791c0d"
SELLER_ID = "161582ad-3ed9-4219-9bac-5dbe5d03e84d"
CUSTOMER_ID = "1429d8a2-1aff-4e03-969f-ea81989be7ac"

print(f"🏪 Shop ID: {SHOP_ID}")
print(f"👤 Seller ID: {SELLER_ID}")
print(f"👤 Customer ID: {CUSTOMER_ID}")

# ===========================================
# 2. VÉRIFIER LE WALLET INITIAL
# ===========================================
cursor.execute("SELECT * FROM seller_wallets WHERE seller_id = ?", (SELLER_ID,))
wallet = cursor.fetchone()
print("\n💰 WALLET INITIAL:")
if wallet:
    print(f"  balance: {wallet['balance']} €")
    print(f"  pending_balance: {wallet['pending_balance']} €")
    print(f"  total_earned: {wallet['total_earned']} €")
    print(f"  total_withdrawn: {wallet['total_withdrawn']} €")
    WALLET_ID = wallet['id']
else:
    print("  ❌ Aucun wallet trouvé - création...")
    WALLET_ID = str(uuid.uuid4())
    cursor.execute("""
        INSERT INTO seller_wallets 
        (id, seller_id, balance, pending_balance, total_earned, total_withdrawn, 
         auto_withdrawal, withdrawal_threshold, created_at, updated_at)
        VALUES (?, ?, 0.0, 0.0, 0.0, 0.0, 0, 50.0, ?, ?)
    """, (WALLET_ID, SELLER_ID, datetime.now(), datetime.now()))
    conn.commit()
    print(f"  ✅ Wallet créé avec ID: {WALLET_ID}")

# ===========================================
# 3. CRÉER UNE COMMANDE DE TEST
# ===========================================
print("\n📦 CRÉATION D'UNE COMMANDE...")
order_id = str(uuid.uuid4())
order_number = f"TEST-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
total_amount = 54.99

cursor.execute("""
    INSERT INTO orders (
        id, order_number, shop_id, customer_id, customer_name, customer_email,
        customer_address, items, subtotal, shipping_fee, total_amount,
        payment_method, payment_status, status, payment_confirmed, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
""", (
    order_id, order_number, SHOP_ID, CUSTOMER_ID,
    "Client Test", "test@example.com",
    '{"street": "123 Test St", "city": "Test City"}',
    '[{"product_name": "Produit test", "quantity": 1, "product_price": 50.00}]',
    50.00, 4.99, total_amount,
    'card', 'pending_confirmation', 'pending', 0,
    datetime.now(), datetime.now()
))
print(f"  ✅ Commande créée: {order_id}")

# ===========================================
# 4. CRÉER LA TRANSACTION
# ===========================================
print("\n💳 CRÉATION DE LA TRANSACTION...")
platform_fee = 5.0
platform_fee_amount = total_amount * (platform_fee / 100)
seller_amount = total_amount - platform_fee_amount

transaction_id = str(uuid.uuid4())
cursor.execute("""
    INSERT INTO transactions (
        id, order_id, shop_id, seller_id, customer_id,
        amount, platform_fee, platform_fee_amount, seller_amount,
        payment_fee, net_amount, payment_method, payment_provider,
        payment_status, transaction_status, provider_payment_id, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
""", (
    transaction_id, order_id, SHOP_ID, SELLER_ID, CUSTOMER_ID,
    total_amount, platform_fee, platform_fee_amount, seller_amount,
    0.0, seller_amount, 'card', 'stripe',
    'processing', 'pending', f'test_pi_{uuid.uuid4().hex[:8]}',
    datetime.now()
))
print(f"  ✅ Transaction créée: {transaction_id}")
print(f"  Montant total: {total_amount} €")
print(f"  Commission: {platform_fee_amount} €")
print(f"  Net vendeur: {seller_amount} €")

# ===========================================
# 5. SIMULER LA CONFIRMATION DE PAIEMENT
# ===========================================
print("\n✅ CONFIRMATION DU PAIEMENT...")

# Mettre à jour la commande
cursor.execute("""
    UPDATE orders 
    SET payment_confirmed = 1, payment_status = 'paid', status = 'processing'
    WHERE id = ?
""", (order_id,))

# Mettre à jour la transaction
cursor.execute("""
    UPDATE transactions 
    SET payment_status = 'completed', transaction_status = 'paid', paid_at = ?
    WHERE id = ?
""", (datetime.now(), transaction_id))

# Créditer le wallet (pending_balance)
cursor.execute("""
    UPDATE seller_wallets 
    SET pending_balance = pending_balance + ?,
        total_earned = total_earned + ?
    WHERE seller_id = ?
""", (seller_amount, seller_amount, SELLER_ID))

conn.commit()
print(f"  ✅ Paiement confirmé - Wallet pending_balance +{seller_amount} €")

# ===========================================
# 6. VÉRIFIER LE WALLET APRÈS PAIEMENT
# ===========================================
cursor.execute("SELECT * FROM seller_wallets WHERE seller_id = ?", (SELLER_ID,))
wallet = cursor.fetchone()
print("\n💰 WALLET APRÈS PAIEMENT:")
print(f"  balance: {wallet['balance']} €")
print(f"  pending_balance: {wallet['pending_balance']} €")
print(f"  total_earned: {wallet['total_earned']} €")

# ===========================================
# 7. SIMULER LA LIVRAISON
# ===========================================
print("\n📬 LIVRAISON DE LA COMMANDE...")

cursor.execute("UPDATE orders SET status = 'delivered' WHERE id = ?", (order_id,))

# Transférer du pending vers balance
cursor.execute("""
    UPDATE seller_wallets 
    SET pending_balance = pending_balance - ?,
        balance = balance + ?
    WHERE seller_id = ?
""", (seller_amount, seller_amount, SELLER_ID))

# Mettre à jour le CA de la boutique
cursor.execute("""
    UPDATE shops 
    SET total_revenue = total_revenue + ?,
        total_orders = total_orders + 1
    WHERE id = ?
""", (total_amount, SHOP_ID))

conn.commit()
print(f"  ✅ Commande livrée - Wallet balance +{seller_amount} €")

# ===========================================
# 8. VÉRIFIER LE WALLET APRÈS LIVRAISON
# ===========================================
cursor.execute("SELECT * FROM seller_wallets WHERE seller_id = ?", (SELLER_ID,))
wallet = cursor.fetchone()
print("\n💰 WALLET APRÈS LIVRAISON:")
print(f"  balance: {wallet['balance']} €")
print(f"  pending_balance: {wallet['pending_balance']} €")
print(f"  total_earned: {wallet['total_earned']} €")

# ===========================================
# 9. SIMULER UN RETRAIT
# ===========================================
print("\n💸 DEMANDE DE RETRAIT...")
withdrawal_amount = 30.00
withdrawal_id = str(uuid.uuid4())
withdrawal_ref = f"WD-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"

cursor.execute("""
    INSERT INTO withdrawals (
        id, wallet_id, seller_id, amount, fee, net_amount,
        method, account_details, status, reference, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
""", (
    withdrawal_id, WALLET_ID, SELLER_ID,
    withdrawal_amount, 0.0, withdrawal_amount,
    'bank', '{"bank": "Test Bank"}', 'pending', withdrawal_ref,
    datetime.now()
))

# Mettre à jour le wallet
cursor.execute("""
    UPDATE seller_wallets 
    SET balance = balance - ?,
        total_withdrawn = total_withdrawn + ?
    WHERE seller_id = ?
""", (withdrawal_amount, withdrawal_amount, SELLER_ID))

conn.commit()
print(f"  ✅ Demande de retrait créée: {withdrawal_amount} €")

# ===========================================
# 10. VÉRIFIER LE WALLET APRÈS RETRAIT
# ===========================================
cursor.execute("SELECT * FROM seller_wallets WHERE seller_id = ?", (SELLER_ID,))
wallet = cursor.fetchone()
print("\n💰 WALLET APRÈS RETRAIT:")
print(f"  balance: {wallet['balance']} €")
print(f"  pending_balance: {wallet['pending_balance']} €")
print(f"  total_earned: {wallet['total_earned']} €")
print(f"  total_withdrawn: {wallet['total_withdrawn']} €")

# ===========================================
# 11. SIMULER L'APPROBATION ADMIN
# ===========================================
print("\n✅ APPROBATION ADMIN...")

cursor.execute("""
    UPDATE withdrawals 
    SET status = 'completed', processed_at = ?
    WHERE id = ?
""", (datetime.now(), withdrawal_id))

conn.commit()
print(f"  ✅ Retrait approuvé")

# ===========================================
# 12. VÉRIFICATIONS FINALES
# ===========================================
print("\n📊 VÉRIFICATIONS FINALES:")
print("-" * 40)

# Voir la commande
cursor.execute("SELECT * FROM orders WHERE id = ?", (order_id,))
order = cursor.fetchone()
print(f"Commande: {order['order_number']} - Statut: {order['status']}")

# Voir la transaction
cursor.execute("SELECT * FROM transactions WHERE id = ?", (transaction_id,))
trans = cursor.fetchone()
print(f"Transaction: {trans['transaction_status']} - Net: {trans['seller_amount']} €")

# Voir le retrait
cursor.execute("SELECT * FROM withdrawals WHERE id = ?", (withdrawal_id,))
withd = cursor.fetchone()
print(f"Retrait: {withd['status']} - Montant: {withd['amount']} €")

# Voir le wallet final
cursor.execute("SELECT * FROM seller_wallets WHERE seller_id = ?", (SELLER_ID,))
wallet = cursor.fetchone()
print(f"\n💰 WALLET FINAL:")
print(f"  balance: {wallet['balance']} €")
print(f"  pending_balance: {wallet['pending_balance']} €")
print(f"  total_earned: {wallet['total_earned']} €")
print(f"  total_withdrawn: {wallet['total_withdrawn']} €")

# ===========================================
# 13. RÉSUMÉ
# ===========================================
print("\n📈 RÉSUMÉ DU TEST:")
print("-" * 40)
print(f"Vente: {total_amount} €")
print(f"Commission: {platform_fee_amount} €")
print(f"Net vendeur: {seller_amount} €")
print(f"Retrait effectué: {withdrawal_amount} €")
print(f"Restant en balance: {wallet['balance']} €")
print(f"Total gagné à vie: {wallet['total_earned']} €")
print(f"Total retiré à vie: {wallet['total_withdrawn']} €")

conn.close()
print("\n✅ TEST TERMINÉ")
print("=" * 60)