// apps/web/app/components/Navbar.tsx
'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useAuth } from '@/app/contexts/AuthContext'
import { useRouter, usePathname } from 'next/navigation'
import { useCart } from '@/app/hooks/useCart'
import SearchBar from './SearchBar'  // ← AJOUTER

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const isShopPage = (() => {
    if (!pathname) return false
    if (pathname === '/shop/all') return false
    return pathname.startsWith('/shop/') && pathname.split('/').length >= 3
  })()
  const shopSlug = isShopPage ? pathname.split('/')[2] : null

  const cart = useCart(shopSlug || '')
  const cartItemCount = cart.cart?.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0

  const handleLogout = () => {
    logout()
    router.push('/')
    setIsMenuOpen(false)
  }

  const handleOpenCart = (e: React.MouseEvent) => {
    e.preventDefault()
    const event = new CustomEvent('openCartSidebar')
    window.dispatchEvent(event)
    setIsMenuOpen(false)
  }

  // Liens de navigation communs
  const navLinks = [
    { href: '/shop/all', label: 'Boutiques', icon: '🏪' },
  ]

  // Menu déroulant pour l'utilisateur connecté
  const UserMenu = () => (
    <div className="relative group">
      {/* Avatar cliquable */}
      <button className="flex items-center space-x-2 hover:opacity-80 focus:outline-none">
              {user?.avatar ? (
          <img 
            src={user.avatar} 
            alt={user.username}
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
            {user?.username?.charAt(0).toUpperCase() || 'U'}
          </div>
        )}
        <div className="hidden md:block text-left">
          <p className="text-sm font-medium text-gray-900 leading-tight">{user?.username}</p>
          <p className="text-xs text-gray-500 leading-tight">
            {user?.is_seller ? 'Vendeur' : 'Client'}
          </p>
        </div>
        <svg className="hidden md:block w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown menu */}
      <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
        <div className="py-2">
          {/* En-tête avec infos */}
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-900">{user?.full_name || user?.username}</p>
            <p className="text-xs text-gray-500 mt-1">{user?.email}</p>
            <div className="mt-2">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                user?.is_seller 
                  ? 'bg-purple-100 text-purple-800' 
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {user?.is_seller ? '👑 Vendeur' : '👤 Client'}
              </span>
            </div>
          </div>

          {/* Lien vers le profil (TOUJOURS visible) */}
          <Link
            href="/profile"
            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600"
            onClick={() => setIsMenuOpen(false)}
          >
            <span className="mr-3 text-lg">👤</span>
            <div>
              <p className="font-medium">Mon profil</p>
              <p className="text-xs text-gray-500">Gérer mes informations</p>
            </div>
          </Link>

          
          {/* Lien vers le dashboard vendeur (si vendeur) */}
          {user?.is_seller && (
            <Link
              href="/seller/dashboard"
              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 border-t border-gray-100"
              onClick={() => setIsMenuOpen(false)}
            >
              <span className="mr-3 text-lg">📊</span>
              <div>
                <p className="font-medium">Dashboard vendeur</p>
                <p className="text-xs text-gray-500">Gérer ma boutique</p>
              </div>
            </Link>
          )}
          
           {/* ✅ BOUTON ADMIN - DANS LE MENU AVEC LES AUTRES LIENS */}
        {user?.is_admin && (
          <Link
            href="/admin/dashboard"
            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-600 border-t border-gray-100"
            onClick={() => setIsMenuOpen(false)}
          >
            <span className="mr-3 text-lg">⚙️</span>
            <div>
              <p className="font-medium">Admin</p>
              <p className="text-xs text-gray-500">Gestion plateforme</p>
            </div>
          </Link>
        )}

          {/* 👇 AJOUTER CE BLOC POUR LES NON-VENDEURS */}
          {!user?.is_seller && (
            <Link
              href="/become-seller"
              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 border-t border-gray-100"
              onClick={() => setIsMenuOpen(false)}
            >
              <span className="mr-3 text-lg">👑</span>
              <div>
                <p className="font-medium">Devenir vendeur</p>
                <p className="text-xs text-gray-500">Lancez votre boutique</p>
              </div>
            </Link>
          )}

          {!user?.is_seller && user?.seller_requested_at && !user?.seller_approved_at && (
            <div className="px-4 py-3 bg-yellow-50 border-t border-b border-yellow-100">
              <div className="flex items-center text-yellow-800">
                <span className="mr-2">⏳</span>
                <div>
                  <p className="text-sm font-medium">Demande en cours</p>
                  <p className="text-xs text-yellow-600">
                    En attente d'approbation
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Lien vers les commandes (si client) */}
          {!user?.is_seller && (
            <Link
              href="/my-orders"
              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 border-t border-gray-100"
              onClick={() => setIsMenuOpen(false)}
            >
              <span className="mr-3 text-lg">📦</span>
              <div>
                <p className="font-medium">Mes commandes</p>
                <p className="text-xs text-gray-500">Suivre mes achats</p>
              </div>
            </Link>
          )}

          {/* Séparateur */}
          <div className="border-t border-gray-100 my-1"></div>

          {/* Déconnexion */}
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            <span className="mr-3 text-lg">🚪</span>
            <div>
              <p className="font-medium">Se déconnecter</p>
              <p className="text-xs text-red-500/70">Mettre fin à la session</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2" onClick={() => setIsMenuOpen(false)}>
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">ST</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hidden sm:block">
                ShopTonik
              </span>
            </Link>
          </div>
 
           
            {/* ✅ NOUVEAU : Barre de recherche au centre */}
          <div className="hidden md:flex items-center justify-center flex-1">
            <SearchBar />
          </div>

          {/* Liens de navigation - à droite de la recherche */}
          <div className="hidden md:flex items-center space-x-1 mr-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 flex items-center gap-1"
              >
                <span>{link.icon}</span>
                <span className="hidden lg:inline">{link.label}</span>
              </Link>
            ))}
          </div>

          {/* Actions utilisateur - DROITE */}
          <div className="flex items-center space-x-3">
            {/* Panier - Visible sur les pages boutique */}
            {isShopPage && shopSlug && (
              <button
                onClick={handleOpenCart}
                className="relative p-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1"
                title="Ouvrir le panier"
              >
                <span className="text-xl">🛒</span>
                <span className="hidden md:inline text-sm font-medium">Panier</span>
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                    {cartItemCount > 99 ? '99+' : cartItemCount}
                  </span>
                )}
              </button>
            )}

            {/* Utilisateur connecté - Menu déroulant */}
            {isAuthenticated ? (
              <UserMenu />
            ) : (
              /* Non connecté */
              <div className="flex items-center space-x-3">
                <Link
                  href="/auth/login"
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors hidden md:block"
                >
                  Connexion
                </Link>
                <Link
                  href="/auth/register"
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg text-sm font-medium hover:shadow-lg transition-all duration-200 hover:opacity-90"
                >
                  S'inscrire
                </Link>
              </div>
            )}

            {/* Menu burger mobile */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              aria-label="Menu"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Menu mobile déroulant */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {/* ✅ UNE SEULE BARRE DE RECHERCHE MOBILE */}
              <div className="px-3 py-2">
                <SearchBar />
              </div>
              {/* Panier mobile */}
              {isShopPage && shopSlug && (
                <button
                  onClick={handleOpenCart}
                  className="flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                >
                  <div className="flex items-center">
                    <span className="mr-3 text-lg">🛒</span>
                    <span>Panier</span>
                  </div>
                  {cartItemCount > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center">
                      {cartItemCount}
                    </span>
                  )}
                </button>
              )}
 

              {/* Navigation mobile */}
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center px-3 py-2.5 rounded-lg text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <span className="mr-3">{link.icon}</span>
                  {link.label}
                </Link>
              ))}

              {/* Section utilisateur mobile */}
              {isAuthenticated && (
                <>
                  <div className="border-t border-gray-100 my-2 pt-3">
                    <div className="flex items-center px-3 py-2">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-base font-bold mr-3">
                        {user?.username?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{user?.username}</p>
                        <p className="text-xs text-gray-500">{user?.email}</p>
                      </div>
                    </div>
                  </div>

                  {/* PROFIL - Premier lien mobile */}
                  <Link
                    href="/profile"
                    className="flex items-center px-3 py-2.5 rounded-lg text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <span className="mr-3">👤</span>
                    <div>
                      <p className="font-medium">Mon profil</p>
                      <p className="text-xs text-gray-500">Gérer mon compte</p>
                    </div>
                  </Link>

                  {/* 👇 POUR LES NON-VENDEURS */}
                  {!user?.is_seller && (
                    <>
                      {user?.seller_requested_at && !user?.seller_approved_at ? (
                        <div className="px-3 py-2.5">
                          <div className="flex items-center text-yellow-800 bg-yellow-50 p-2 rounded-lg">
                            <span className="mr-2">⏳</span>
                            <div>
                              <p className="text-sm font-medium">Demande en cours</p>
                              <p className="text-xs text-yellow-600">En attente d'approbation</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <Link
                          href="/become-seller"
                          className="flex items-center px-3 py-2.5 rounded-lg text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <span className="mr-3">👑</span>
                          <div>
                            <p className="font-medium">Devenir vendeur</p>
                            <p className="text-xs text-gray-500">Lancez votre boutique</p>
                          </div>
                        </Link>
                      )}
                    </>
                  )}

                  {/* DASHBOARD VENDEUR - Si vendeur */}
                  {user?.is_seller && (
                    <Link
                      href="/seller/dashboard"
                      className="flex items-center px-3 py-2.5 rounded-lg text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-colors border-t border-gray-100 mt-2 pt-3"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <span className="mr-3">📊</span>
                      <div>
                        <p className="font-medium">Dashboard vendeur</p>
                        <p className="text-xs text-gray-500">Gérer ma boutique</p>
                      </div>
                    </Link>
                  )}

                  {/* MES COMMANDES - Si client */}
                  {!user?.is_seller && (
                    <Link
                      href="/my-orders"
                      className="flex items-center px-3 py-2.5 rounded-lg text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <span className="mr-3">📦</span>
                      <div>
                        <p className="font-medium">Mes commandes</p>
                        <p className="text-xs text-gray-500">Suivre mes achats</p>
                      </div>
                    </Link>
                  )}

                  {/* Déconnexion mobile */}
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-3 py-2.5 rounded-lg text-base font-medium text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors border-t border-gray-100 mt-2 pt-3"
                  >
                    <span className="mr-3">🚪</span>
                    <div>
                      <p className="font-medium">Se déconnecter</p>
                      <p className="text-xs text-red-500/70">Mettre fin à la session</p>
                    </div>
                  </button>
                </>
              )}

              {/* Connexion/Inscription mobile */}
              {!isAuthenticated && (
                <div className="border-t border-gray-100 pt-3 space-y-2">
                  <Link
                    href="/auth/login"
                    className="flex items-center justify-center px-3 py-2.5 rounded-lg text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <span className="mr-3">🔑</span>
                    Connexion
                  </Link>
                  <Link
                    href="/auth/register"
                    className="flex items-center justify-center px-3 py-2.5 rounded-lg text-base font-medium bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:opacity-90 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <span className="mr-3">✨</span>
                    Créer un compte
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}