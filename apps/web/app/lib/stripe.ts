import { loadStripe } from '@stripe/stripe-js';

export const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
);

export const api = {
  getPublicShop: async (slug: string) => {
    const response = await fetch(`/api/v1/public/shops/${slug}`);
    return response.json();
  },
  
  processCheckout: async (data: any) => {
    const response = await fetch('/api/v1/checkout/process', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json();
      return { error: error.detail || 'Erreur checkout' };
    }
    
    return { data: await response.json() };
  }
};