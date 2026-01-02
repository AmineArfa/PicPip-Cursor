'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, Sparkles, Check } from 'lucide-react';
import { NeoButton } from '@/components/ui';
import { PipMascot } from '@/components/pip-mascot';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/memories';
  
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
        },
      });

      if (authError) {
        throw authError;
      }

      setEmailSent(true);
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Failed to send magic link. Please try again.');
    } finally {
      setIsSubmitting(false);
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

      <main className="flex flex-col items-center justify-center min-h-screen p-4">
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

        {emailSent ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md"
          >
            {/* Success Card */}
            <div className="bg-white border-4 border-[#181016] rounded-3xl shadow-[6px_6px_0_0_#181016] p-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#a3ff00] border-4 border-[#181016] flex items-center justify-center"
              >
                <Check className="w-10 h-10 text-[#181016]" />
              </motion.div>
              
              <h1 className="font-display text-3xl font-bold text-[#181016] mb-3">
                Check your inbox!
              </h1>
              
              <p className="text-lg text-[#181016]/70 mb-2">
                We sent a magic link to
              </p>
              <p className="text-xl font-bold text-[#181016] mb-6">
                {email}
              </p>
              
              <div className="bg-[#FFF9E6] border-2 border-[#181016]/20 rounded-2xl p-4 mb-6">
                <p className="text-[#181016]/70 text-sm">
                  💡 <strong>Tip:</strong> Check your spam folder if you don't see the email!
                </p>
              </div>

              <button
                onClick={() => {
                  setEmailSent(false);
                  setEmail('');
                }}
                className="text-[#2962ff] font-bold hover:underline"
              >
                Use a different email
              </button>
            </div>
          </motion.div>
        ) : (
          <>
            {/* Title */}
            <motion.div
              className="text-center mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h1 className="font-display text-4xl md:text-5xl font-bold text-[#181016] mb-3">
                Welcome back!
              </h1>
              <p className="text-xl text-[#181016]/70">
                Let's get you to your memories
              </p>
            </motion.div>

            {/* Login Form */}
            <motion.form
              onSubmit={handleSubmit}
              className="w-full max-w-md space-y-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="bg-white border-4 border-[#181016] rounded-3xl shadow-[6px_6px_0_0_#181016] p-6">
                <label className="block mb-4">
                  <span className="font-display text-xl font-bold text-[#181016] block mb-3">
                    Your email
                  </span>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#181016]/40">
                      <Mail className="w-6 h-6" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="grandma@email.com"
                      className="w-full h-16 pl-14 pr-6 rounded-2xl border-3 border-[#181016] text-xl font-medium focus:outline-none focus:border-[#ff61d2] placeholder:text-[#181016]/30 transition-colors"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                </label>

                {error && (
                  <div className="bg-red-50 border-2 border-red-200 rounded-xl p-3 mb-4">
                    <p className="text-red-600 text-sm font-medium">{error}</p>
                  </div>
                )}
              </div>

              <NeoButton
                type="submit"
                variant="primary"
                size="xl"
                icon={<Sparkles className="w-7 h-7" />}
                disabled={!email.trim() || isSubmitting}
              >
                {isSubmitting ? 'Sending...' : 'Send Magic Link'}
              </NeoButton>

              <p className="text-center text-[#181016]/60 font-medium">
                No password needed! We'll email you a magic link.
              </p>
            </motion.form>

            {/* Divider */}
            <motion.div
              className="w-full max-w-md my-8 flex items-center gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex-1 h-1 bg-[#181016]/10 rounded-full" />
              <span className="text-[#181016]/50 font-bold">or</span>
              <div className="flex-1 h-1 bg-[#181016]/10 rounded-full" />
            </motion.div>

            {/* New User CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="w-full max-w-md"
            >
              <Link href="/">
                <NeoButton variant="cyan" size="lg">
                  I'm New Here - Let's Start!
                </NeoButton>
              </Link>
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
