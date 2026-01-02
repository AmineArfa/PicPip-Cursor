import Stripe from 'stripe';

// Lazy-loaded Stripe instance
let stripeInstance: Stripe | null = null;

export function getStripeServer(): Stripe {
  if (!stripeInstance) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY is not set');
    }
    stripeInstance = new Stripe(secretKey, {
      apiVersion: '2025-12-15.clover',
      typescript: true,
    });
  }
  return stripeInstance;
}

// For backwards compatibility
export const stripe = {
  get checkout() {
    return getStripeServer().checkout;
  },
  get customers() {
    return getStripeServer().customers;
  },
  get webhooks() {
    return getStripeServer().webhooks;
  },
};

// Product types and prices
export const PRODUCTS = {
  single: {
    name: 'Single Snap',
    description: 'One-time HD download for this photo',
    priceId: process.env.STRIPE_PRICE_SINGLE || '',
    price: 500, // $4.99 in cents
    mode: 'payment' as const,
  },
  bundle: {
    name: 'Bundle Pack',
    description: '10 photo animations - Save 60%',
    priceId: process.env.STRIPE_PRICE_BUNDLE || '',
    price: 1999, // $19.99 in cents
    mode: 'payment' as const,
    credits: 10,
  },
  subscription: {
    name: 'Unlimited Magic',
    description: '7 days free, then $9.99/month',
    priceId: process.env.STRIPE_PRICE_SUBSCRIPTION || '',
    price: 999, // $9.99/mo in cents
    mode: 'subscription' as const,
    trialDays: 7,
  },
} as const;

export type ProductType = keyof typeof PRODUCTS;

// Create checkout session
export interface CreateCheckoutParams {
  productType: ProductType;
  customerEmail: string;
  animationId: string;
  guestSessionId: string;
  successUrl: string;
  cancelUrl: string;
}

export async function createCheckoutSession(params: CreateCheckoutParams) {
  const stripe = getStripeServer();
  const product = PRODUCTS[params.productType];
  
  if (!product.priceId) {
    throw new Error(`Price ID for ${params.productType} is not configured`);
  }
  
  const sessionConfig: Stripe.Checkout.SessionCreateParams = {
    customer_email: params.customerEmail,
    payment_method_types: ['card'],
    mode: product.mode,
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: {
      animationId: params.animationId,
      guestSessionId: params.guestSessionId,
      productType: params.productType,
    },
    line_items: [
      {
        price: product.priceId,
        quantity: 1,
      },
    ],
    // Note: Don't set payment_method_options.card.setup_future_usage for subscriptions
    // Stripe handles that automatically
  };

  // Add subscription-specific options
  if (product.mode === 'subscription' && 'trialDays' in product) {
    sessionConfig.subscription_data = {
      trial_period_days: product.trialDays,
      metadata: {
        animationId: params.animationId,
        guestSessionId: params.guestSessionId,
      },
    };
  }

  const session = await stripe.checkout.sessions.create(sessionConfig);
  
  return session;
}

// Retrieve customer from session
export async function getCustomerFromSession(sessionId: string) {
  const stripe = getStripeServer();
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['customer', 'subscription'],
  });
  
  return {
    customerId: typeof session.customer === 'string' 
      ? session.customer 
      : session.customer?.id,
    email: session.customer_email,
    metadata: session.metadata,
    subscription: session.subscription,
  };
}

// Create or retrieve Stripe customer
export async function getOrCreateCustomer(email: string, userId?: string) {
  const stripe = getStripeServer();
  
  // Search for existing customer
  const customers = await stripe.customers.list({
    email,
    limit: 1,
  });

  if (customers.data.length > 0) {
    const customer = customers.data[0];
    
    // Update metadata if we have a user ID
    if (userId && !customer.metadata.userId) {
      await stripe.customers.update(customer.id, {
        metadata: { userId },
      });
    }
    
    return customer;
  }

  // Create new customer
  const customer = await stripe.customers.create({
    email,
    metadata: userId ? { userId } : {},
  });

  return customer;
}
