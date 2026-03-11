# Liste des erreurs TypeScript à corriger

## Groupe 1: Null/undefined
- [ ] app/categories/page.tsx (3)
- [ ] app/checkout/natcash-payment/page.tsx (3)
- [ ] app/seller/dashboard/create/page.tsx (1)
- [ ] app/seller/dashboard/create/page_.tsx (1)
- [ ] app/seller/products/edit/page_.tsx (2)

## Groupe 2: Propriétés manquantes dans interfaces
- [ ] app/components/Navbar.tsx (4) - Ajouter seller_requested_at, seller_approved_at à User
- [ ] app/page.tsx (6) - Ajouter stats à l'interface
- [ ] app/seller/settings/page.tsx (7) - Ajouter shops à User

## Groupe 3: Méthodes API privées
- [ ] app/hooks/useProductCategories.ts (1)
- [ ] app/seller/dashboard/[slug]/settings/page_.tsx (3)
- [ ] app/seller/orders/[id]/page.tsx (1)
- [ ] app/seller/orders/page.tsx (4)

## Groupe 4: Types incompatibles
- [ ] app/shop/[slug]/products/page.tsx (4)
- [ ] app/shop/[slug]/products/page__.tsx (3)
- [ ] app/shop/[slug]/ShopClient.tsx (2)
- [ ] app/shop/[slug]/ShopClient_.tsx (2)

## Groupe 5: Autres
- [ ] .next/dev/types/validator.ts (1) - Fichier généré, ignorer
- [ ] app/components/AvatarUploader.tsx (2)
- [ ] app/hooks/useCart.ts (1)
- [ ] app/hooks/useCart_.ts (1)
- [ ] app/order-confirmation/[id]/page.tsx (4)
- [ ] app/seller/dashboard/[slug]/page.tsx (1)
- [ ] app/seller/dashboard/page.tsx (2)
- [ ] app/seller/orders/page__.tsx (4)
- [ ] app/shop/[slug]/about/page.tsx (1)
- [ ] app/shop/[slug]/about/page_.tsx (1)

Total: 65 erreurs
