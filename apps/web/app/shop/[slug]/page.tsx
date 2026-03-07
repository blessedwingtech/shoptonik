import { Metadata } from 'next'
import { api } from '@/app/lib/api'
import ShopClient from './ShopClient'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  
  try {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
    const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    
    // Récupérer la boutique
    const response = await api.getPublicShop(slug)
    const shop = response.data

    if (!shop) {
      return {
        title: 'Boutique non trouvée - ShopTonik',
        description: 'La boutique que vous recherchez n\'existe pas.'
      }
    }

    // URL de l'image pour le partage
    const imageUrl = shop.logo_url || `${SITE_URL}/default-shop.jpg`

    return {
      // ✅ Titre : utilise meta_title si dispo, sinon le nom
      title: shop.meta_title || `${shop.name} - Boutique sur ShopTonik`,
      
      // ✅ Description : utilise meta_description si dispo, sinon la description
      description: shop.meta_description || 
                   shop.description?.substring(0, 160) || 
                   `Découvrez la boutique ${shop.name} sur ShopTonik`,
      
      openGraph: {
        title: shop.meta_title || shop.name,
        description: shop.meta_description || 
                     shop.description?.substring(0, 160) || 
                     `Découvrez la boutique ${shop.name} sur ShopTonik`,
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: shop.name,
          }
        ],
        url: `${SITE_URL}/shop/${shop.slug}`,
        type: 'website',
        siteName: 'ShopTonik',
        locale: 'fr_FR',
      },
      
      twitter: {
        card: 'summary_large_image',
        title: shop.meta_title || shop.name,
        description: shop.meta_description || 
                     shop.description?.substring(0, 160) || 
                     `Découvrez la boutique ${shop.name} sur ShopTonik`,
        images: [imageUrl],
      },
      
      robots: {
        index: true,
        follow: true,
      },
      
      alternates: {
        canonical: `${SITE_URL}/shop/${shop.slug}`,
      },
    }
  } catch (error) {
    return {
      title: 'Boutique - ShopTonik',
      description: 'Découvrez cette boutique sur ShopTonik'
    }
  }
}

export default async function ShopPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return <ShopClient slug={slug} />
}
