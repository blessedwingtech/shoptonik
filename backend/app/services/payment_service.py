# backend/app/services/payment_service.py
from typing import Optional, Dict, Any, Tuple
from enum import Enum
import uuid
import moncashify
from moncashify import API as MoncashifyAPI  # Import corrigé
import stripe
import paypalrestsdk
import logging
from datetime import datetime
from app.core.config import settings

logger = logging.getLogger(__name__)

class PaymentProvider:
    STRIPE = "stripe"
    PAYPAL = "paypal"
    MONCASH = "moncash"
    NATCASH = "natcash"

class PaymentService:
    def __init__(self):
        # Initialisation Stripe avec la vraie clé
        stripe.api_key = settings.stripe_secret_key   
        self.stripe_webhook_secret = settings.stripe_webhook_secret

        # Initialisation PayPal (optionnel)
        self.paypal_config = {
            "mode": "sandbox",
            "client_id": "votre_client_id",
            "client_secret": "votre_client_secret"
        }

        # Pour MonCash/NatCash (API locales)
        self.moncash_api_url = "https://api.moncash.com/v1"
        self.natcash_api_url = "https://api.natcash.com/v1"
        self.moncash_client = MoncashifyAPI(
            settings.moncash_client_id,  # client_id en premier paramètre positionnel
            settings.moncash_client_secret,  # Le tuto utilise "secret_key"
            debug=True  # True pour sandbox (test), False pour production
        )

    
    async def process_payment(
        self,
        method: str,
        amount: float,
        currency: str = "EUR",
        shop: Optional[Any] = None,
        customer: Optional[Any] = None,
        **kwargs
    ) -> Tuple[bool, Dict[str, Any]]:
        """
        Traite un paiement selon la méthode choisie
        Retourne: (success, payment_data)
        """
        
        if method == "card":
            return await self._process_stripe_payment(amount, currency, customer, kwargs.get('payment_method_id'))
        
        elif method == "paypal":
            return await self._process_paypal_payment(amount, currency, kwargs.get('return_url'), kwargs.get('cancel_url'))
        
        elif method == "moncash":
            return await self._process_moncash_payment(amount, currency, kwargs.get('phone'), shop)
        
        elif method == "natcash":
            return await self._process_natcash_payment(amount, currency, kwargs.get('phone'), shop, order_id=kwargs.get('order_id'))
        
        elif method == "cash_on_delivery":
            return True, {
                "status": "pending",
                "message": "Paiement à la livraison",
                "requires_action": False
            }
        
        else:
            return False, {"error": "Méthode de paiement non supportée"}
    
    # backend/app/services/payment_service.py

    # async def _process_stripe_payment(self, amount: float, currency: str, customer: Any, payment_method_id: str = None, **kwargs):
    #     """Paiement par carte avec Stripe"""
    #     try:
    #         logger.info(f"💰 Stripe payment started - Amount: {amount}, Currency: {currency}")
            
    #         # 1. Créer ou récupérer le client Stripe
    #         stripe_customer_id = None
    #         if customer and customer.stripe_customer_id:
    #             stripe_customer_id = customer.stripe_customer_id
    #             logger.info(f"💰 Using existing Stripe customer: {stripe_customer_id}")
    #         else:
    #             logger.info(f"💰 Creating new Stripe customer")
    #             customer_params = {"email": customer.email} if customer else {}
    #             stripe_customer = stripe.Customer.create(**customer_params)
    #             stripe_customer_id = stripe_customer.id
    #             if customer:
    #                 customer.stripe_customer_id = stripe_customer_id
    #             logger.info(f"💰 Created Stripe customer: {stripe_customer_id}")

    #         # 2. Créer l'intention de paiement SANS confirmation
    #         #    (la confirmation se fera côté frontend avec Stripe Elements)
    #         intent_params = {
    #             "amount": int(amount * 100),
    #             "currency": currency.lower(),
    #             "customer": stripe_customer_id,
    #             "automatic_payment_methods": {"enabled": True},
    #             "metadata": {
    #                 "customer_id": customer.id if customer else "guest",
    #                 "customer_email": customer.email if customer else None,
    #             }
    #         }
            
    #         # Ajouter l'order_id si fourni (important pour le webhook)
    #         if kwargs.get("order_id"):
    #             intent_params["metadata"]["order_id"] = kwargs["order_id"]
            
    #         logger.info(f"💰 Creating PaymentIntent with params: {intent_params}")
    #         intent = stripe.PaymentIntent.create(**intent_params)

    #         logger.info(f"💰 PaymentIntent created: {intent.id} - Status: {intent.status}")
            
    #         return True, {
    #             "provider": "stripe",
    #             "payment_intent_id": intent.id,
    #             "client_secret": intent.client_secret,
    #             "status": intent.status,
    #             "requires_action": False,  # La confirmation se fera plus tard
    #         }

    #     except stripe.error.StripeError as e:
    #         logger.error(f"Stripe error: {str(e)}")
    #         return False, {"error": str(e), "provider": "stripe"}
    #     except Exception as e:
    #         logger.error(f"🔥 Unexpected error: {str(e)}")
    #         return False, {"error": str(e), "provider": "stripe"}
        

    async def _process_stripe_payment(self, amount: float, currency: str, customer: Any, order_id: str = None, metadata: dict = None, **kwargs):
        """Paiement par carte avec Stripe"""
        try:
            logger.info(f"💰 Stripe payment started - Amount: {amount}, Currency: {currency}")
            
            # 1. Créer ou récupérer le client Stripe
            stripe_customer_id = None
            if customer and customer.stripe_customer_id:
                stripe_customer_id = customer.stripe_customer_id
                logger.info(f"💰 Using existing Stripe customer: {stripe_customer_id}")
            else:
                logger.info(f"💰 Creating new Stripe customer")
                customer_params = {"email": customer.email} if customer else {}
                stripe_customer = stripe.Customer.create(**customer_params)
                stripe_customer_id = stripe_customer.id
                if customer:
                    customer.stripe_customer_id = stripe_customer_id
                logger.info(f"💰 Created Stripe customer: {stripe_customer_id}")

            # 2. Créer l'intention de paiement
            intent_params = {
                "amount": int(amount * 100),
                "currency": currency.lower(),
                "customer": stripe_customer_id,
                "automatic_payment_methods": {"enabled": True},
                "metadata": {
                    "customer_id": customer.id if customer else "guest",
                    "customer_email": customer.email if customer else None,
                }
            }
            
            # ✅ CORRIGÉ : utiliser order_id directement
            if order_id:
                intent_params["metadata"]["order_id"] = order_id
            
            # Ajouter les métadonnées supplémentaires si fournies
            if metadata:
                intent_params["metadata"].update(metadata)
            
            logger.info(f"💰 Creating PaymentIntent with params: {intent_params}")
            intent = stripe.PaymentIntent.create(**intent_params)

            logger.info(f"💰 PaymentIntent created: {intent.id} - Status: {intent.status}")
            
            return True, {
                "provider": "stripe",
                "payment_intent_id": intent.id,
                "client_secret": intent.client_secret,
                "status": intent.status,
                "requires_action": False,
            }

        except stripe.error.StripeError as e:
            logger.error(f"Stripe error: {str(e)}")
            return False, {"error": str(e), "provider": "stripe"}
        except Exception as e:
            logger.error(f"🔥 Unexpected error: {str(e)}")
            return False, {"error": str(e), "provider": "stripe"}
        

    async def _process_paypal_payment(self, amount: float, currency: str, return_url: str, cancel_url: str):
        """Paiement avec PayPal"""
        try:
            payment = paypalrestsdk.Payment({
                "intent": "sale",
                "payer": {"payment_method": "paypal"},
                "transactions": [{
                    "amount": {
                        "total": str(amount),
                        "currency": currency
                    },
                    "description": "Achat sur ShopTonik"
                }],
                "redirect_urls": {
                    "return_url": return_url,
                    "cancel_url": cancel_url
                }
            })
            
            if payment.create():
                # Trouver l'URL d'approbation
                approval_url = next(link.href for link in payment.links if link.rel == "approval_url")
                
                return True, {
                    "provider": "paypal",
                    "payment_id": payment.id,
                    "approval_url": approval_url,
                    "status": "created",
                    "requires_action": True
                }
            else:
                return False, {"error": payment.error, "provider": "paypal"}
                
        except Exception as e:
            logger.error(f"PayPal error: {str(e)}")
            return False, {"error": str(e), "provider": "paypal"}
    
    async def _process_moncash_payment(self, amount: float, currency: str, phone: str, shop: Any, shop_id: str = None, order_id: str = None):
            """Paiement via MonCash (Haïti)"""
            try:
                # Vérifier si la boutique accepte MonCash
                if shop and "moncash" not in shop.accepted_payment_methods:
                    return False, {"error": "Cette boutique n'accepte pas MonCash"}

                # Générer un order_id unique (exemple avec timestamp)
                # Important: doit être unique pour chaque transaction
                import time
                order_id = f"ORDER-{int(time.time())}-{shop.id if shop else 'guest'}"

                # Créer le paiement - selon le tutoriel
                # La méthode .payment() retourne un objet Payment
                payment = self.moncash_client.payment(
                    order_id=order_id, 
                    amount=int(amount)  # Le montant en HTG, sans décimales selon le tuto
                )

                # Récupérer l'URL de redirection
                redirect_url = payment.redirect_url
                # Pour voir toutes les données de la réponse API:
                # full_response = payment.get_response()

                # Logging pour déboguer
                logger.info(f"MonCash payment created: Order {order_id}, URL: {redirect_url}")

                return True, {
                    "provider": "moncash",
                    "order_id": order_id,
                    "redirect_url": redirect_url,
                    "status": "created",
                    "requires_action": True,  # Nécessite une redirection client
                    "expires_in": 300  # 5 minutes selon le tuto
                }

            except Exception as e:
                logger.error(f"MonCash payment error: {str(e)}")
                return False, {"error": str(e), "provider": "moncash"}


    async def verify_moncash_transaction(self, order_id: str):
        """Vérifie le statut d'une transaction MonCash"""
        try:
            # Nettoyer l'order_id (enlever le préfixe MC- si présent)
            clean_order_id = order_id.replace('MC-', '') if order_id.startswith('MC-') else order_id
            
            # Récupérer les détails de la transaction
            transaction = self.moncash_client.transaction_details(order_id=clean_order_id)
            
            # Adapter selon la structure réelle retournée par le SDK
            # À ajuster après test
            return {
                "status": getattr(transaction, 'status', 'pending'),
                "amount": getattr(transaction, 'amount', 0),
                "transaction_id": getattr(transaction, 'transaction_id', None),
                "payment_date": getattr(transaction, 'date', None),
                "order_id": order_id
            }
        except Exception as e:
            logger.error(f"MonCash verification error: {str(e)}")
            return {"error": str(e), "provider": "moncash", "status": "failed"}

    async def _process_natcash_payment(
        self, 
        amount: float, 
        currency: str, 
        phone: str, 
        shop: Any,
        order_id: str = None
    ) -> Tuple[bool, Dict[str, Any]]:
        """Paiement via NatCash (simulation pour test)"""
        try:
            logger.info(f"💰 _process_natcash_payment appelé avec:")
            logger.info(f"   amount: {amount}")
            logger.info(f"   currency: {currency}")
            logger.info(f"   phone: {phone}")
            logger.info(f"   shop_id: {shop.id if shop else None}")
            logger.info(f"   order_id: {order_id}")
            
            if not order_id:
                logger.error("❌ order_id manquant dans _process_natcash_payment")
                return False, {"error": "order_id manquant"}
            
            # Générer un ID de transaction unique
            transaction_id = f"NAT-{datetime.utcnow().strftime('%Y%m%d')}-{uuid.uuid4().hex[:8].upper()}"
            
            # URL de redirection vers votre interface de test
            redirect_url = f"/checkout/natcash-payment?order_id={order_id}&amount={amount}&reference={transaction_id}"
            
            logger.info(f"💰 NatCash payment initiated: {transaction_id} - {amount} {currency}")
            
            return True, {
                "provider": "natcash",
                "transaction_id": transaction_id,
                "redirect_url": redirect_url,
                "reference": transaction_id,
                "order_id": order_id,
                "requires_action": True,
                "expires_in": 600,
                "fee": 0.0,
                "status": "pending"
            }
            
        except Exception as e:
            logger.error(f"NatCash payment error: {str(e)}")
            return False, {"error": str(e), "provider": "natcash"}
            
    
    async def transfer_to_seller(
        self,
        transaction: Any,
        seller_stripe_account_id: str = None,
        seller_paypal_email: str = None
    ) -> Tuple[bool, Dict[str, Any]]:
        """
        Transfère les fonds au vendeur (après délai de rétractation)
        """
        try:
            if transaction.payment_method == "card":
                # Stripe Connect - Transfert direct
                transfer = stripe.Transfer.create(
                    amount=int(transaction.seller_amount * 100),
                    currency="eur",
                    destination=seller_stripe_account_id,
                    transfer_group=f"order_{transaction.order_id}"
                )
                
                return True, {
                    "provider": "stripe",
                    "transfer_id": transfer.id,
                    "amount": transaction.seller_amount
                }
                
            elif transaction.payment_method == "paypal":
                # PayPal Payout
                payout = paypalrestsdk.Payout({
                    "sender_batch_header": {
                        "sender_batch_id": f"payout_{transaction.id}",
                        "email_subject": "Votre paiement ShopTonik"
                    },
                    "items": [{
                        "recipient_type": "EMAIL",
                        "amount": {
                            "value": str(transaction.seller_amount),
                            "currency": "EUR"
                        },
                        "receiver": seller_paypal_email,
                        "note": "Merci pour votre vente sur ShopTonik",
                        "sender_item_id": str(transaction.id)
                    }]
                })
                
                if payout.create():
                    return True, {
                        "provider": "paypal",
                        "batch_id": payout.batch_header.payout_batch_id,
                        "amount": transaction.seller_amount
                    }
                else:
                    return False, {"error": payout.error}
            
            elif transaction.payment_method in ["moncash", "natcash"]:
                # Pour MonCash/NatCash, probablement virement bancaire
                # À implémenter selon leurs API
                pass
            
            elif transaction.payment_method == "cash_on_delivery":
                # Paiement à la livraison - marquer comme disponible après confirmation
                return True, {
                    "provider": "manual",
                    "amount": transaction.seller_amount,
                    "status": "pending_confirmation"
                }
            
            return False, {"error": "Méthode de transfert non supportée"}
            
        except Exception as e:
            logger.error(f"Transfer error: {str(e)}")
            return False, {"error": str(e)}
    
    async def handle_webhook(self, provider: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Gère les webhooks des différents providers
        """
        if provider == "stripe":
            return self._handle_stripe_webhook(payload)
        elif provider == "paypal":
            return self._handle_paypal_webhook(payload)
        elif provider == "moncash":
            return self._handle_moncash_webhook(payload)
        else:
            return {"error": "Provider non supporté"}
    
    def _handle_stripe_webhook(self, payload):
        event = None
        try:
            event = stripe.Event.construct_from(payload, stripe.api_key)
        except ValueError as e:
            return {"error": str(e)}
        
        # Gérer les différents événements
        if event.type == 'payment_intent.succeeded':
            payment_intent = event.data.object
            return {
                "event": "payment_success",
                "payment_intent_id": payment_intent.id,
                "amount": payment_intent.amount / 100,
                "status": "completed"
            }
        
        elif event.type == 'payment_intent.payment_failed':
            payment_intent = event.data.object
            return {
                "event": "payment_failed",
                "payment_intent_id": payment_intent.id,
                "error": payment_intent.last_payment_error,
                "status": "failed"
            }
        
        return {"event": event.type, "status": "ignored"}
    
    