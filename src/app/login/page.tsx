'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowLeft, Sparkles, Eye, EyeOff } from 'lucide-react';
import { NeoButton } from '@/components/ui';
import { PipMascot } from '@/components/pip-mascot';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

// OAuth provider icons
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const AppleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
  </svg>
);

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6">
    <path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

type AuthMode = 'login' | 'signup';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/memories';
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [emailConfirmationSent, setEmailConfirmationSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const supabase = createClient();
      
      if (authMode === 'login') {
        // Try to sign in
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        console.log('Sign in response:', { data, error: signInError });

        if (signInError) {
          // Check if user doesn't exist
          if (signInError.message.includes('Invalid login credentials')) {
            setError('Invalid email or password. Need an account? Switch to Sign Up.');
          } else {
            setError(signInError.message);
          }
          setIsSubmitting(false);
          return;
        }

        if (data?.session) {
          // Successfully signed in - redirect
          window.location.href = redirectTo;
          return;
        }
      } else {
        // Sign up new user
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
          },
        });

        console.log('Sign up response:', { data, error: signUpError });

        if (signUpError) {
          if (signUpError.message.includes('already registered')) {
            setError('This email is already registered. Try signing in instead.');
          } else {
            setError(signUpError.message);
          }
          setIsSubmitting(false);
          return;
        }

        // Check if email confirmation is required
        if (data?.user && !data?.session) {
          // Try to auto-confirm in development mode
          if (process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost') {
            try {
              // Call API route to auto-confirm user
              const response = await fetch('/api/auth/auto-confirm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: data.user.id }),
              });

              if (response.ok) {
                // Auto-confirmed, now sign in
                const { error: signInError } = await supabase.auth.signInWithPassword({
                  email,
                  password,
                });

                if (!signInError) {
                  window.location.href = redirectTo;
                  return;
                }
              }
            } catch (autoConfirmError) {
              console.error('Auto-confirm error:', autoConfirmError);
            }
          }

          // Email confirmation required - show success message
          setEmailConfirmationSent(true);
          setIsSubmitting(false);
          return;
        }

        if (data?.session) {
          // Successfully signed up and logged in (email confirmation disabled)
          window.location.href = redirectTo;
          return;
        }
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message || 'Authentication failed. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleOAuthLogin = async (provider: 'google' | 'apple' | 'facebook') => {
    setError(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
        },
      });
      
      if (error) throw error;
    } catch (err: any) {
      console.error('OAuth error:', err);
      setError(err.message || `Failed to sign in with ${provider}. Please try again.`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#E8F4FD] to-[#D4E9F7] relative overflow-hidden">
      {/* Decorative Elements */}
      <motion.div
        className="absolute top-20 left-10 text-6xl"
        animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 4, repeat: Infinity }}
      >
        ✨
      </motion.div>
      <motion.div
        className="absolute top-40 right-16 w-16 h-16 rounded-full bg-[#ff61d2] border-4 border-[#181016]"
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 3, repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-32 left-20 w-12 h-12 rounded-full bg-[#a3ff00] border-4 border-[#181016]"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2.5, repeat: Infinity }}
      />

      {/* Back Button */}
      <Link
        href="/"
        className="absolute top-6 left-6 z-50 w-12 h-12 rounded-full bg-white border-3 border-[#181016] flex items-center justify-center hover:bg-gray-50 transition-colors shadow-[3px_3px_0_0_#181016]"
      >
        <ArrowLeft className="w-6 h-6" />
      </Link>

      <main className="flex flex-col items-center justify-center min-h-screen p-4 py-12">
        {/* Email Confirmation Success State */}
        {emailConfirmationSent ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md"
          >
            <div className="bg-white border-4 border-[#181016] rounded-3xl shadow-[6px_6px_0_0_#181016] p-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#a3ff00] border-4 border-[#181016] flex items-center justify-center"
              >
                <Mail className="w-10 h-10 text-[#181016]" />
              </motion.div>
              
              <h1 className="font-display text-3xl font-bold text-[#181016] mb-3">
                Check your email!
              </h1>
              
              <p className="text-lg text-[#181016]/70 mb-2">
                We sent a confirmation link to
              </p>
              <p className="text-xl font-bold text-[#181016] mb-6">
                {email}
              </p>
              
              <div className="bg-[#FFF9E6] border-2 border-[#181016]/20 rounded-2xl p-4 mb-6">
                <p className="text-[#181016]/70 text-sm">
                  💡 <strong>Tip:</strong> Click the link in the email to confirm your account, then come back to sign in!
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => {
                    setEmailConfirmationSent(false);
                    setEmail('');
                    setPassword('');
                    setAuthMode('login');
                  }}
                  className="text-[#2962ff] font-bold hover:underline"
                >
                  Back to sign in
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <>
            {/* Mascot */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <div className="w-28 h-28 rounded-full bg-white border-4 border-[#181016] shadow-[4px_4px_0_0_#181016] overflow-hidden">
                <PipMascot variant="happy" size="sm" animate={false} />
              </div>
            </motion.div>

        {/* Title */}
        <motion.div
          className="text-center mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h1 className="font-display text-4xl md:text-5xl font-bold text-[#181016] mb-2">
            {authMode === 'login' ? 'Welcome back!' : 'Join PicPip!'}
          </h1>
          <p className="text-xl text-[#181016]/70">
            {authMode === 'login' ? 'Let\'s get you to your memories' : 'Create your account to get started'}
          </p>
        </motion.div>

        {/* Auth Mode Toggle */}
        <motion.div
          className="w-full max-w-md mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          <div className="bg-white/50 border-3 border-[#181016] rounded-full p-1 flex">
            <button
              type="button"
              onClick={() => setAuthMode('login')}
              className={`flex-1 py-3 px-6 rounded-full font-display font-bold text-lg transition-all ${
                authMode === 'login'
                  ? 'bg-[#ff61d2] text-white shadow-[2px_2px_0_0_#181016]'
                  : 'text-[#181016]/60 hover:text-[#181016]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setAuthMode('signup')}
              className={`flex-1 py-3 px-6 rounded-full font-display font-bold text-lg transition-all ${
                authMode === 'signup'
                  ? 'bg-[#ff61d2] text-white shadow-[2px_2px_0_0_#181016]'
                  : 'text-[#181016]/60 hover:text-[#181016]'
              }`}
            >
              Sign Up
            </button>
          </div>
        </motion.div>

        {/* OAuth Buttons */}
        <motion.div
          className="w-full max-w-md space-y-3 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <button
            type="button"
            onClick={() => handleOAuthLogin('google')}
            className="w-full h-14 bg-white border-3 border-[#181016] rounded-2xl shadow-[4px_4px_0_0_#181016] hover:shadow-[2px_2px_0_0_#181016] hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center justify-center gap-3 font-display font-bold text-lg"
          >
            <GoogleIcon />
            Continue with Google
          </button>
          
          <button
            type="button"
            onClick={() => handleOAuthLogin('apple')}
            className="w-full h-14 bg-[#181016] text-white border-3 border-[#181016] rounded-2xl shadow-[4px_4px_0_0_#181016] hover:shadow-[2px_2px_0_0_#181016] hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center justify-center gap-3 font-display font-bold text-lg"
          >
            <AppleIcon />
            Continue with Apple
          </button>
          
          <button
            type="button"
            onClick={() => handleOAuthLogin('facebook')}
            className="w-full h-14 bg-[#1877F2] text-white border-3 border-[#181016] rounded-2xl shadow-[4px_4px_0_0_#181016] hover:shadow-[2px_2px_0_0_#181016] hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center justify-center gap-3 font-display font-bold text-lg"
          >
            <FacebookIcon />
            Continue with Facebook
          </button>
        </motion.div>

        {/* Divider */}
        <motion.div
          className="w-full max-w-md flex items-center gap-4 mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex-1 h-1 bg-[#181016]/10 rounded-full" />
          <span className="text-[#181016]/50 font-bold">or</span>
          <div className="flex-1 h-1 bg-[#181016]/10 rounded-full" />
        </motion.div>

        {/* Email/Password Form */}
        <motion.div
          className="w-full max-w-md space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <form onSubmit={handleSubmit}>
            <div className="bg-white border-4 border-[#181016] rounded-3xl shadow-[6px_6px_0_0_#181016] p-6 space-y-4">
              {/* Email Input */}
              <label className="block">
                <span className="font-display text-lg font-bold text-[#181016] block mb-2">
                  Email
                </span>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#181016]/40">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@email.com"
                    className="w-full h-14 pl-12 pr-4 rounded-xl border-3 border-[#181016] text-lg font-medium focus:outline-none focus:border-[#ff61d2] placeholder:text-[#181016]/30 transition-colors"
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </label>

              {/* Password Input */}
              <label className="block">
                <span className="font-display text-lg font-bold text-[#181016] block mb-2">
                  Password
                </span>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#181016]/40">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-14 pl-12 pr-12 rounded-xl border-3 border-[#181016] text-lg font-medium focus:outline-none focus:border-[#ff61d2] placeholder:text-[#181016]/30 transition-colors"
                    required
                    disabled={isSubmitting}
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#181016]/40 hover:text-[#181016] transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </label>

              {/* Forgot Password Link */}
              {authMode === 'login' && (
                <div className="text-right">
                  <Link
                    href="/login/forgot-password"
                    className="text-[#2962ff] font-bold text-sm hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-3">
                  <p className="text-red-600 text-sm font-medium">{error}</p>
                </div>
              )}
            </div>

            <div className="mt-4">
              <button
                type="submit"
                disabled={!email.trim() || !password.trim() || isSubmitting}
                className="relative group w-full cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {/* Shadow Layer */}
                <div className="absolute inset-0 rounded-full bg-[#181016] translate-x-[5px] translate-y-[5px]" />
                
                {/* Button Content */}
                <div className="relative flex items-center justify-center gap-3 w-full rounded-full border-4 border-[#181016] transition-colors bg-[#ff61d2] text-white hover:bg-[#ff7dd9] h-16 px-8 text-xl font-extrabold">
                  <span className="flex-shrink-0">
                    <Sparkles className="w-6 h-6" />
                  </span>
                  <span className="font-display uppercase tracking-wide">
                    {isSubmitting 
                      ? (authMode === 'login' ? 'Signing in...' : 'Creating account...') 
                      : (authMode === 'login' ? 'Sign In' : 'Create Account')
                    }
                  </span>
                </div>
              </button>
            </div>

            {authMode === 'signup' && (
              <p className="text-center text-[#181016]/60 text-sm mt-4">
                By signing up, you agree to our Terms of Service and Privacy Policy.
              </p>
            )}
          </form>
        </motion.div>

          </>
        )}
      </main>
    </div>
  );
}

function LoginLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#E8F4FD] to-[#D4E9F7] flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-[#ff61d2] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginLoading />}>
      <LoginContent />
    </Suspense>
  );
}
