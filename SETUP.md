# PicPip.co Setup Guide

## Required Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
STRIPE_SECRET_KEY=sk_test_your_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Stripe Price IDs (create these in Stripe Dashboard)
STRIPE_PRICE_SINGLE=price_single_snap_id
STRIPE_PRICE_BUNDLE=price_bundle_pack_id
STRIPE_PRICE_SUBSCRIPTION=price_subscription_id

# Runway ML Configuration
RUNWAY_API_KEY=your_runway_api_key
RUNWAY_WEBHOOK_SECRET=your_runway_webhook_secret

# Upstash Redis (for rate limiting)
UPSTASH_REDIS_REST_URL=your_upstash_redis_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Service Setup Instructions

### 1. Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Project Settings > API to get your keys
3. Enable Email Magic Link auth in Authentication > Providers
4. Optionally enable Google/Apple OAuth providers
5. Run the database migrations (see `/supabase/migrations/`)

### 2. Stripe Setup

1. Create a Stripe account at [stripe.com](https://stripe.com)
2. Get your API keys from Developers > API Keys
3. Create the following products/prices:
   - **Single Snap**: $5.00 one-time payment
   - **Bundle Pack**: $19.99 one-time payment (10 credits)
   - **Unlimited Magic**: $9.99/month subscription with 7-day trial
4. Set up webhook endpoint: `https://your-domain.com/api/webhooks/stripe`
5. Listen for: `checkout.session.completed`, `customer.subscription.updated`

### 3. Runway ML Setup

1. Sign up at [runwayml.com](https://runwayml.com)
2. Get your API key from the developer settings
3. Set up webhook for video completion

### 4. Upstash Setup (Rate Limiting)

1. Create account at [upstash.com](https://upstash.com)
2. Create a new Redis database
3. Copy the REST URL and Token

## Development

```bash
npm run dev
```

## Deployment to Vercel

1. Connect your repository to Vercel
2. Add all environment variables in Vercel dashboard
3. Deploy!

