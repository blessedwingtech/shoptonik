import { Metadata } from 'next'
import ProductDetailClient from './ProductDetailClient'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  // ✅ Il faut attendre params avec await
  const { id } = await params
  
  try {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
    const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    
    const response = await fetch(`${API_URL}/public/products/${id}`, {
      next: { revalidate: 3600 } // Cache 1 heure
    })
    
    if (!response.ok) {
      return {
        title: 'Produit non trouvé - ShopTonik',
        description: 'Le produit que vous recherchez n\'existe pas.'
      }
    }
    
    const product = await response.json()
    
    const imageUrl = product.images?.[0] 
      ? product.images[0].startsWith('http') 
        ? product.images[0] 
        : `${API_URL.replace('/api/v1', '')}${product.images[0]}`
      : `${SITE_URL}/placeholder.jpg`

    return {
      title: `${product.name} - ShopTonik`,
      description: product.description?.substring(0, 160) || `Découvrez ${product.name} sur ShopTonik`,
      openGraph: {
        title: product.name,
        description: product.description?.substring(0, 160) || `Découvrez ${product.name} sur ShopTonik`,
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: product.name,
          }
        ],
        url: `${SITE_URL}/product/${product.id}`,
        type: 'website',
        siteName: 'ShopTonik',
      },
      twitter: {
        card: 'summary_large_image',
        title: product.name,
        description: product.description?.substring(0, 160) || `Découvrez ${product.name} sur ShopTonik`,
        images: [imageUrl],
      },
    }
  } catch (error) {
    return {
      title: 'Produit - ShopTonik',
      description: 'Découvrez ce produit sur ShopTonik'
    }
  }
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  // ✅ Il faut attendre params avec await
  const { id } = await params
  return <ProductDetailClient productId={id} />
}