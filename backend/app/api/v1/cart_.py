from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
import uuid

from ...dependencies import get_db, get_current_user_optional
from ...models import Cart, CartItem, Product, Shop, User
from ...schemas.cart import CartResponse, CartItemCreate, CartItemResponse

router = APIRouter(prefix="/cart", tags=["cart"])

def get_or_create_cart(db: Session, shop_id: str, user: User = None, session_id: str = None):
    """Trouver ou créer un panier"""
    if user:
        # Utilisateur connecté : chercher son panier
        cart = db.query(Cart).filter(
            Cart.user_id == user.id,
            Cart.shop_id == shop_id
        ).first()
    elif session_id:
        # Guest : chercher par session_id
        cart = db.query(Cart).filter(
            Cart.session_id == session_id,
            Cart.shop_id == shop_id
        ).first()
    else:
        cart = None
    
    if not cart:
        # Créer un nouveau panier
        cart = Cart(
            shop_id=shop_id,
            user_id=user.id if user else None,
            session_id=session_id if not user else None
        )
        db.add(cart)
        db.commit()
        db.refresh(cart)
    
    return cart

@router.get("/{shop_id}", response_model=CartResponse)
async def get_cart(
    shop_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_optional)
):
    """Récupérer le panier pour une boutique"""
    # Vérifier que la boutique existe
    shop = db.query(Shop).filter(Shop.id == shop_id).first()
    if not shop:
        raise HTTPException(status_code=404, detail="Boutique non trouvée")
    
    # Récupérer le session_id depuis les cookies
    session_id = request.cookies.get("cart_session_id")
    if not session_id and not current_user:
        session_id = str(uuid.uuid4())
    
    # Récupérer ou créer le panier
    cart = get_or_create_cart(db, shop_id, current_user, session_id)
    
    # Calculer le total
    total_items = sum(item.quantity for item in cart.items)
    subtotal = sum(item.product_price * item.quantity for item in cart.items)
    
    return CartResponse(
        id=cart.id,
        shop_id=cart.shop_id,
        items=cart.items,
        total_items=total_items,
        subtotal=subtotal
    )

@router.post("/{shop_id}/items", response_model=CartItemResponse)
async def add_to_cart(
    shop_id: str,
    item_data: CartItemCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_optional)
):
    """Ajouter un produit au panier"""
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
    
    # Récupérer le panier
    session_id = request.cookies.get("cart_session_id")
    cart = get_or_create_cart(db, shop_id, current_user, session_id)
    
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
    
    # Set cookie si guest
    if not current_user and not request.cookies.get("cart_session_id"):
        from fastapi import Response
        response = Response()
        response.set_cookie(
            key="cart_session_id",
            value=cart.session_id,
            max_age=30 * 24 * 60 * 60,  # 30 jours
            httponly=True
        )
    
    return CartItemResponse(
        id=existing_item.id,
        product_id=existing_item.product_id,
        product_name=existing_item.product_name,
        product_price=existing_item.product_price,
        product_image=existing_item.product_image,
        quantity=existing_item.quantity,
        total_price=existing_item.product_price * existing_item.quantity
    )

@router.put("/items/{item_id}")
async def update_cart_item(
    item_id: str,
    quantity: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_optional)
):
    """Mettre à jour la quantité d'un article"""
    if quantity < 1:
        raise HTTPException(status_code=400, detail="Quantité doit être >= 1")
    
    cart_item = db.query(CartItem).filter(CartItem.id == item_id).first()
    if not cart_item:
        raise HTTPException(status_code=404, detail="Article non trouvé")
    
    # Vérifier les permissions
    cart = db.query(Cart).filter(Cart.id == cart_item.cart_id).first()
    if current_user and cart.user_id != current_user.id:
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

@router.delete("/items/{item_id}")
async def remove_from_cart(
    item_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_optional)
):
    """Supprimer un article du panier"""
    cart_item = db.query(CartItem).filter(CartItem.id == item_id).first()
    if not cart_item:
        raise HTTPException(status_code=404, detail="Article non trouvé")
    
    # Vérifier les permissions
    cart = db.query(Cart).filter(Cart.id == cart_item.cart_id).first()
    if current_user and cart.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Accès non autorisé")
    
    db.delete(cart_item)
    db.commit()
    
    return {"message": "Article supprimé"}

@router.delete("/{shop_id}")
async def clear_cart(
    shop_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_optional)
):
    """Vider le panier"""
    session_id = request.cookies.get("cart_session_id") if hasattr(request, 'cookies') else None
    
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
