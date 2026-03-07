from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from pydantic import BaseModel
from sqlalchemy.orm import Session
import uuid

from ...dependencies import get_current_user_or_none, get_current_user_or_session, get_db, get_current_user_optional
 

from app.models.cart import Cart, CartItem
from app.models.shop import Shop
from app.models.user import User
from app.models.product import Product

from ...schemas.cart import CartResponse, CartItemCreate, CartItemResponse

router = APIRouter(prefix="/cart", tags=["cart"])


def cart_item_to_dict(item: CartItem) -> dict:
    """Convertir un CartItem SQLAlchemy en dict pour Pydantic"""
    return {
        "id": item.id,
        "product_id": item.product_id,
        "product_name": item.product_name,
        "product_price": item.product_price,
        "product_image": item.product_image,
        "quantity": item.quantity,
        "total_price": item.product_price * item.quantity  # Calculé
    }

def get_or_create_cart(
    db: Session,
    shop_id: str,
    user_id: str = None,      # CHANGÉ: user au lieu de user
    session_id: str = None
):
    """Récupérer ou créer un panier"""
    if user_id:
        cart = db.query(Cart).filter(
            Cart.user_id == user_id,
            Cart.shop_id == shop_id
        ).first()
    elif session_id:
        cart = db.query(Cart).filter(
            Cart.session_id == session_id,
            Cart.shop_id == shop_id
        ).first()
    else:
        raise ValueError("Soit user_id, soit session_id doit être fourni")

    if not cart:
        cart = Cart(
            shop_id=shop_id,
            user_id=user_id,
            session_id=session_id
        )
        db.add(cart)
        db.commit()
        db.refresh(cart)

    return cart


def get_shop_by_slug(db: Session, shop_slug: str):
    """Récupérer une boutique par son slug"""
    shop = db.query(Shop).filter(Shop.slug == shop_slug).first()
    if not shop:
        raise HTTPException(status_code=404, detail="Boutique non trouvée")
    return shop

@router.get("/{shop_slug}", response_model=CartResponse)
async def get_cart(
    shop_slug: str,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_or_none)
):
    shop = get_shop_by_slug(db, shop_slug)
    shop_id = shop.id

    session_id = request.cookies.get("cart_session_id")
    if not current_user and not session_id:
        session_id = str(uuid.uuid4())
        response.set_cookie(
            key="cart_session_id",
            value=session_id,
            max_age=30 * 24 * 60 * 60,
            httponly=True,
            samesite="lax"
        )

    # CORRECTION ICI :
    cart = get_or_create_cart(
        db, 
        shop_id, 
        user_id=current_user.id if current_user else None,  # <-- user_id
        session_id=session_id
    )

    if not cart:
        raise HTTPException(status_code=404, detail="Panier introuvable")

    items = [cart_item_to_dict(item) for item in cart.items]

    return CartResponse(
        id=cart.id,
        shop_id=cart.shop_id,
        shop_slug=shop.slug,
        shop_name=shop.name,
        items=items,
        total_items=sum(i["quantity"] for i in items),
        subtotal=sum(i["total_price"] for i in items)
    )




@router.post("/{shop_slug}/items", response_model=CartItemResponse)
async def add_to_cart(
    shop_slug: str,
    item_data: CartItemCreate,
    request: Request,
    response: Response,  # <-- AJOUTER
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_or_none)
):
    """Ajouter un produit au panier"""
    shop = get_shop_by_slug(db, shop_slug)
    shop_id = shop.id

    # Vérifier le produit
    product = db.query(Product).filter(
        Product.id == item_data.product_id,
        Product.shop_id == shop_id
    ).first()

    if not product:
        raise HTTPException(status_code=404, detail="Produit non trouvé")

    if product.stock < item_data.quantity:
        raise HTTPException(
            status_code=400,
            detail=f"Stock insuffisant. Disponible: {product.stock}"
        )

    # Récupérer le session_id du cookie
    session_id = request.cookies.get("cart_session_id")
    
    # CRÉER LE COOKIE SI UTILISATEUR NON CONNECTÉ ET PAS DE COOKIE
    if not current_user and not session_id:
        session_id = str(uuid.uuid4())
        response.set_cookie(
            key="cart_session_id",
            value=session_id,
            max_age=30 * 24 * 60 * 60,  # 30 jours
            httponly=True,
            samesite="lax"
        )
        print(f"🆕 [CART] Cookie créé pour session guest: {session_id}")

    # Récupérer le panier
    cart = get_or_create_cart(
        db,
        shop_id,
        user_id=current_user.id if current_user else None,
        session_id=session_id
    )

    if not cart:
        raise HTTPException(status_code=400, detail="Impossible de créer le panier")

    # Vérifier si l'article est déjà dans le panier
    existing_item = db.query(CartItem).filter(
        CartItem.cart_id == cart.id,
        CartItem.product_id == product.id
    ).first()

    if existing_item:
        # Mettre à jour la quantité
        existing_item.quantity += item_data.quantity
        if existing_item.quantity > product.stock:
            raise HTTPException(
                status_code=400,
                detail=f"Quantité maximale atteinte. Stock: {product.stock}"        
            )
    else:
        # Ajouter un nouvel item
        cart_item = CartItem(
            cart_id=cart.id,
            product_id=product.id,
            product_name=product.name,
            product_price=product.price / 100,  # Convertir centimes → euros        
            product_image=product.images[0] if product.images else None,
            product_sku=product.sku,
            quantity=item_data.quantity
        )
        db.add(cart_item)
        existing_item = cart_item

    db.commit()
    db.refresh(existing_item)

    # Réponse
    response_data = CartItemResponse(
        id=existing_item.id,
        product_id=existing_item.product_id,
        product_name=existing_item.product_name,
        product_price=existing_item.product_price,
        product_image=existing_item.product_image,
        quantity=existing_item.quantity,
        total_price=existing_item.product_price * existing_item.quantity
    )

    return response_data

# @router.post("/{shop_slug}/items", response_model=CartItemResponse)
# async def add_to_cart(
#     shop_slug: str,
#     item_data: CartItemCreate,
#     request: Request,
#     db: Session = Depends(get_db),
#     current_user: Optional[User] = Depends(get_current_user_optional)
# ):
#     """Ajouter un produit au panier"""
#     shop = get_shop_by_slug(db, shop_slug)
#     shop_id = shop.id
    
#     # Vérifier le produit
#     product = db.query(Product).filter(
#         Product.id == item_data.product_id,
#         Product.shop_id == shop_id
#     ).first()
    
#     if not product:
#         raise HTTPException(status_code=404, detail="Produit non trouvé")
    
#     if product.stock < item_data.quantity:
#         raise HTTPException(
#             status_code=400,
#             detail=f"Stock insuffisant. Disponible: {product.stock}"
#         )
    
#     # Récupérer le panier - CORRECTION ICI :
#     session_id = request.cookies.get("cart_session_id")
#     cart = get_or_create_cart(
#         db, 
#         shop_id, 
#         user_id=current_user.id if current_user else None,  # <-- user_id, pas current_user
#         session_id=session_id
#     )
    
#     if not cart:
#         raise HTTPException(status_code=400, detail="Impossible de créer le panier")
    
#     # Vérifier si l'article est déjà dans le panier
#     existing_item = db.query(CartItem).filter(
#         CartItem.cart_id == cart.id,
#         CartItem.product_id == product.id
#     ).first()
    
#     if existing_item:
#         # Mettre à jour la quantité
#         existing_item.quantity += item_data.quantity
#         if existing_item.quantity > product.stock:
#             raise HTTPException(
#                 status_code=400,
#                 detail=f"Quantité maximale atteinte. Stock: {product.stock}"
#             )
#     else:
#         # Ajouter un nouvel item
#         cart_item = CartItem(
#             cart_id=cart.id,
#             product_id=product.id,
#             product_name=product.name,
#             product_price=product.price / 100,  # Convertir centimes → euros
#             product_image=product.images[0] if product.images else None,
#             product_sku=product.sku,
#             quantity=item_data.quantity
#         )
#         db.add(cart_item)
#         existing_item = cart_item
    
#     db.commit()
#     db.refresh(existing_item)
    
#     # Réponse
#     response_data = CartItemResponse(
#         id=existing_item.id,
#         product_id=existing_item.product_id,
#         product_name=existing_item.product_name,
#         product_price=existing_item.product_price,
#         product_image=existing_item.product_image,
#         quantity=existing_item.quantity,
#         total_price=existing_item.product_price * existing_item.quantity
#     )
    
#     # Set cookie si guest
#     if not current_user and not request.cookies.get("cart_session_id"):
#         response_obj = Response(content=response_data.json())
#         response_obj.set_cookie(
#             key="cart_session_id",
#             value=cart.session_id,
#             max_age=30 * 24 * 60 * 60,  # 30 jours
#             httponly=True,
#             samesite="lax"
#         )
#         return response_obj
    
#     return response_data


class CartItemUpdate(BaseModel):
    quantity: int

# @router.put("/items/{item_id}")
# async def update_cart_item(
#     item_id: str,
#     update_data: CartItemUpdate,
#     db: Session = Depends(get_db),
#     current_user: User = Depends(get_current_user_optional)
# ):
#     """Mettre à jour la quantité d'un article"""
#     quantity = update_data.quantity  # ← Extraire du body
#     if quantity < 1:
#         raise HTTPException(status_code=400, detail="Quantité doit être >= 1")
    
#     cart_item = db.query(CartItem).filter(CartItem.id == item_id).first()
#     if not cart_item:
#         raise HTTPException(status_code=404, detail="Article non trouvé")
    
#     # Vérifier les permissions
#     cart = db.query(Cart).filter(Cart.id == cart_item.cart_id).first()
#     if current_user and cart.user_id != current_user.id:
#         raise HTTPException(status_code=403, detail="Accès non autorisé")
    
#     # Vérifier le stock
#     product = db.query(Product).filter(Product.id == cart_item.product_id).first()
#     if product.stock < quantity:
#         raise HTTPException(
#             status_code=400,
#             detail=f"Stock insuffisant. Disponible: {product.stock}"
#         )
    
#     cart_item.quantity = quantity
#     db.commit()
#     db.refresh(cart_item)
    
#     return {"message": "Quantité mise à jour"}

@router.put("/items/{item_id}")
async def update_cart_item(
    item_id: str,
    update_data: CartItemUpdate,
    request: Request,  # <-- AJOUTER request
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_or_none)  # <-- CHANGER
):
    """Mettre à jour la quantité d'un article"""
    quantity = update_data.quantity
    if quantity < 1:
        raise HTTPException(status_code=400, detail="Quantité doit être >= 1")

    cart_item = db.query(CartItem).filter(CartItem.id == item_id).first()
    if not cart_item:
        raise HTTPException(status_code=404, detail="Article non trouvé")

    # Vérifier les permissions - NOUVELLE LOGIQUE
    cart = db.query(Cart).filter(Cart.id == cart_item.cart_id).first()
    if not cart:
        raise HTTPException(status_code=404, detail="Panier non trouvé")
    
    # Si l'utilisateur est connecté, vérifier qu'il possède le panier
    if current_user:
        if cart.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Accès non autorisé")
    else:
        # Si l'utilisateur n'est pas connecté, vérifier la session
        session_id = request.cookies.get("cart_session_id")
        if not session_id or cart.session_id != session_id:
            raise HTTPException(status_code=403, detail="Accès non autorisé")

    # Vérifier le stock
    product = db.query(Product).filter(Product.id == cart_item.product_id).first()
    if product.stock < quantity:
        raise HTTPException(
            status_code=400,
            detail=f"Stock insuffisant. Disponible: {product.stock}"
        )

    cart_item.quantity = quantity
    db.commit()
    db.refresh(cart_item)

    return {"message": "Quantité mise à jour"}


# @router.delete("/items/{item_id}")
# async def remove_from_cart(
#     item_id: str,
#     db: Session = Depends(get_db),
#     current_user: User = Depends(get_current_user_optional)
# ):
#     """Supprimer un article du panier"""
#     cart_item = db.query(CartItem).filter(CartItem.id == item_id).first()
#     if not cart_item:
#         raise HTTPException(status_code=404, detail="Article non trouvé")
    
#     # Vérifier les permissions
#     cart = db.query(Cart).filter(Cart.id == cart_item.cart_id).first()
#     if current_user and cart.user_id != current_user.id:
#         raise HTTPException(status_code=403, detail="Accès non autorisé")
    
#     db.delete(cart_item)
#     db.commit()
    
#     return {"message": "Article supprimé"}
@router.delete("/items/{item_id}")
async def remove_from_cart(
    item_id: str,
    request: Request,  # <-- AJOUTER request
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_or_none)  # <-- CHANGER
):
    """Supprimer un article du panier"""
    cart_item = db.query(CartItem).filter(CartItem.id == item_id).first()
    if not cart_item:
        raise HTTPException(status_code=404, detail="Article non trouvé")

    # Vérifier les permissions - NOUVELLE LOGIQUE
    cart = db.query(Cart).filter(Cart.id == cart_item.cart_id).first()
    if not cart:
        raise HTTPException(status_code=404, detail="Panier non trouvé")
    
    # Si l'utilisateur est connecté, vérifier qu'il possède le panier
    if current_user:
        if cart.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Accès non autorisé")
    else:
        # Si l'utilisateur n'est pas connecté, vérifier la session
        session_id = request.cookies.get("cart_session_id")
        if not session_id or cart.session_id != session_id:
            raise HTTPException(status_code=403, detail="Accès non autorisé")

    db.delete(cart_item)
    db.commit()

    return {"message": "Article supprimé"}

# @router.delete("/{shop_slug}")
# async def clear_cart(
#     shop_slug: str,
#     request: Request,
#     db: Session = Depends(get_db),
#     current_user: Optional[User] = Depends(get_current_user_optional)
# ):
#     """Vider le panier"""
#     shop = get_shop_by_slug(db, shop_slug)
#     shop_id = shop.id
    
#     session_id = request.cookies.get("cart_session_id")
    
#     # CORRECTION ICI :
#     if current_user:
#         cart = db.query(Cart).filter(
#             Cart.user_id == current_user.id,  # <-- current_user.id
#             Cart.shop_id == shop_id
#         ).first()
#     elif session_id:
#         cart = db.query(Cart).filter(
#             Cart.session_id == session_id,
#             Cart.shop_id == shop_id
#         ).first()
#     else:
#         raise HTTPException(status_code=404, detail="Panier non trouvé")
    
#     if cart:
#         # Supprimer tous les items
#         db.query(CartItem).filter(CartItem.cart_id == cart.id).delete()
#         db.commit()
    
#     return {"message": "Panier vidé"}
@router.delete("/{shop_slug}")
async def clear_cart(
    shop_slug: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_or_none)  # <-- CHANGER
):
    """Vider le panier"""
    shop = get_shop_by_slug(db, shop_slug)
    shop_id = shop.id

    session_id = request.cookies.get("cart_session_id")

    # CORRECTION ICI : Utiliser la même logique que get_or_create_cart
    cart = None
    if current_user:
        cart = db.query(Cart).filter(
            Cart.user_id == current_user.id,
            Cart.shop_id == shop_id
        ).first()
    elif session_id:
        cart = db.query(Cart).filter(
            Cart.session_id == session_id,
            Cart.shop_id == shop_id
        ).first()
    else:
        raise HTTPException(status_code=404, detail="Panier non trouvé")

    if cart:
        # Supprimer tous les items
        db.query(CartItem).filter(CartItem.cart_id == cart.id).delete()
        db.commit()

    return {"message": "Panier vidé"}
