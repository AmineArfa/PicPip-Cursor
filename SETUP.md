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

---

## 1. Supabase Setup

### Create Project
1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **Project Settings > API** to get your keys:
   - `NEXT_PUBLIC_SUPABASE_URL` - Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - anon/public key  
   - `SUPABASE_SERVICE_ROLE_KEY` - service_role key (keep secret!)

### Configure Authentication
1. Go to **Authentication > Providers**
2. Enable **Email** with:
   - ✅ Enable Email OTP (Magic Link)
   - ✅ Confirm email
3. Optionally enable **Google** and **Apple** OAuth providers
4. Set **Site URL** to your production URL
5. Add redirect URLs:
   - `http://localhost:3000/auth/callback`
   - `https://your-domain.com/auth/callback`

### Run Database Migrations
Execute these SQL scripts in **SQL Editor**:

```sql
-- Create profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE,
  credits INTEGER DEFAULT 0 NOT NULL,
  subscription_status TEXT DEFAULT 'none' NOT NULL,
  stripe_customer_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile" ON profiles 
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles 
  FOR UPDATE USING (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create animations table
CREATE TABLE animations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  guest_session_id TEXT,
  title TEXT,
  original_photo_url TEXT NOT NULL,
  thumbnail_url TEXT,
  video_url TEXT,
  watermarked_video_url TEXT,
  status TEXT DEFAULT 'pending' NOT NULL,
  is_paid BOOLEAN DEFAULT FALSE NOT NULL,
  runway_job_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE animations ENABLE ROW LEVEL SECURITY;

-- Guest users can insert/update their animations
CREATE POLICY "Guest insert" ON animations 
  FOR INSERT WITH CHECK (guest_session_id IS NOT NULL);
CREATE POLICY "Guest update" ON animations 
  FOR UPDATE USING (guest_session_id IS NOT NULL);
CREATE POLICY "Guest select" ON animations 
  FOR SELECT USING (guest_session_id IS NOT NULL);
  
-- Authenticated users can manage their animations
CREATE POLICY "Auth select" ON animations 
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Auth insert" ON animations 
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Auth update" ON animations 
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Auth delete" ON animations 
  FOR DELETE USING (auth.uid() = user_id);

-- Create purchases table
CREATE TABLE purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  animation_id UUID REFERENCES animations(id) ON DELETE CASCADE,
  stripe_session_id TEXT UNIQUE,
  product_type TEXT NOT NULL,
  amount INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own purchases" ON purchases 
  FOR SELECT USING (auth.uid() = user_id);
```

### Configure Storage Buckets
1. Go to **Storage** in Supabase Dashboard
2. Create two buckets:

**Bucket 1: `guest-uploads`**
- Public: ✅ Yes
- File size limit: 10 MB
- Allowed MIME types: `image/*`

**Bucket 2: `private-media`**
- Public: ❌ No  
- File size limit: 100 MB
- Allowed MIME types: `video/*`

3. Add storage policies (SQL Editor):

```sql
-- Guest uploads: public read, anyone can upload
CREATE POLICY "Public read guest-uploads" ON storage.objects
  FOR SELECT USING (bucket_id = 'guest-uploads');

CREATE POLICY "Anyone can upload to guest-uploads" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'guest-uploads');

-- Private media: only owner can access
CREATE POLICY "Owner read private-media" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'private-media' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Owner upload private-media" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'private-media' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
```

4. Set up 24-hour auto-deletion for guest-uploads (optional):
   - Use a scheduled Edge Function or external cron job

---

## 2. Stripe Setup

### Get API Keys
1. Create account at [stripe.com](https://stripe.com)
2. Go to **Developers > API Keys**
3. Copy:
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Publishable key (pk_test_...)
   - `STRIPE_SECRET_KEY` - Secret key (sk_test_...)

### Create Products & Prices

Go to **Products** and create:

#### Product 1: Single Snap
- **Name**: Single Snap
- **Description**: One animated photo download
- **Price**: $5.00 USD (one-time)
- Copy the Price ID → `STRIPE_PRICE_SINGLE`

#### Product 2: Bundle Pack  
- **Name**: Bundle Pack
- **Description**: 10 animated photos
- **Price**: $19.99 USD (one-time)
- Copy the Price ID → `STRIPE_PRICE_BUNDLE`

#### Product 3: Unlimited Magic
- **Name**: Unlimited Magic
- **Description**: Unlimited animations monthly
- **Price**: $9.99 USD/month
- ✅ Enable Free Trial: 7 days
- Copy the Price ID → `STRIPE_PRICE_SUBSCRIPTION`

### Configure Webhook

1. Go to **Developers > Webhooks**
2. Add endpoint:
   - URL: `https://your-domain.com/api/webhooks/stripe`
   - Events to listen:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
3. Copy the **Signing secret** → `STRIPE_WEBHOOK_SECRET`

### Enable Payment Methods
1. Go to **Settings > Payment Methods**
2. Enable:
   - ✅ Cards
   - ✅ Apple Pay
   - ✅ Google Pay
   - ✅ Link (Stripe's fast checkout)

### Test Mode
Use these test cards:
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- 3D Secure: `4000 0027 6000 3184`

---

## 3. Runway ML Setup

### Get API Access
1. Sign up at [runwayml.com](https://runwayml.com)
2. Go to your account settings
3. Navigate to **API** section
4. Generate an API key → `RUNWAY_API_KEY`

### Configure Webhook (Optional)
For production, set up a webhook endpoint:
- URL: `https://your-domain.com/api/webhooks/runway`
- Copy secret → `RUNWAY_WEBHOOK_SECRET`

### Development Mode
Without a Runway API key, the app runs in simulation mode:
- Uploads work normally
- Processing shows animated status
- After 10 seconds, a demo video is used
- All other flows work as expected

---

## 4. Upstash Redis Setup (Rate Limiting)

### Create Database
1. Create account at [upstash.com](https://upstash.com)
2. Create a new Redis database
3. Choose a region close to your deployment
4. Copy credentials:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

### Rate Limits
Default configuration:
- Upload: 5 requests per minute per IP
- API calls: 20 requests per minute per IP

---

## 5. Development

### Install Dependencies
```bash
npm install
```

### Run Development Server
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```

### Type Check
```bash
npm run type-check
```

---

## 6. Deployment to Vercel

### Connect Repository
1. Go to [vercel.com](https://vercel.com)
2. Import your Git repository
3. Vercel will auto-detect Next.js

### Configure Environment Variables
Add all variables from `.env.local` to Vercel:
1. Go to **Project Settings > Environment Variables**
2. Add each variable
3. Set `NEXT_PUBLIC_APP_URL` to your Vercel domain

### Configure Build Settings
- Framework: Next.js (auto-detected)
- Build Command: `npm run build`
- Output Directory: `.next`

### Deploy
1. Push to your main branch
2. Vercel automatically deploys
3. Configure custom domain in **Settings > Domains**

### Post-Deployment
1. Update Stripe webhook URL to production domain
2. Update Supabase redirect URLs
3. Update Runway webhook URL (if using)

---

## Troubleshooting

### Common Issues

**"Invalid API Key" from Supabase**
- Check that `NEXT_PUBLIC_SUPABASE_URL` doesn't have trailing slash
- Verify keys are copied correctly

**Stripe webhook fails**
- Check webhook secret is correct
- Verify endpoint URL matches exactly
- Check Vercel function logs

**Magic link emails not sending**
- Check Supabase email settings
- Verify Site URL is configured
- Check spam folder

**Rate limiting not working**
- Verify Upstash credentials
- Check Redis connection in logs

### Support
- Supabase: [supabase.com/docs](https://supabase.com/docs)
- Stripe: [stripe.com/docs](https://stripe.com/docs)
- Runway: [docs.runwayml.com](https://docs.runwayml.com)
