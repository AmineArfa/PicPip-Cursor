'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, Check, ShieldCheck } from 'lucide-react';
import { NeoButton } from '@/components/ui';
import { PipMascot } from '@/components/pip-mascot';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if user has a valid session from the reset link
    const checkSession = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      setIsValidSession(!!session);
    };
    checkSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        throw updateError;
      }

      setIsSuccess(true);
      
      // Redirect to memories after a delay
      setTimeout(() => {
        router.push('/memories');
      }, 3000);
    } catch (err: any) {
      console.error('Password update error:', err);
      setError(err.message || 'Failed to update password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state while checking session
  if (isValidSession === null) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#E8F4FD] to-[#D4E9F7] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#ff61d2] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Invalid session - no reset token
  if (!isValidSession) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#E8F4FD] to-[#D4E9F7] relative overflow-hidden">
        <main className="flex flex-col items-center justify-center min-h-screen p-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="w-28 h-28 rounded-full bg-white border-4 border-[#181016] shadow-[4px_4px_0_0_#181016] overflow-hidden">
              <PipMascot variant="sad" size="sm" animate={false} />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md"
          >
            <div className="bg-white border-4 border-[#181016] rounded-3xl shadow-[6px_6px_0_0_#181016] p-8 text-center">
              <h1 className="font-display text-3xl font-bold text-[#181016] mb-3">
                Link expired
              </h1>
              <p className="text-lg text-[#181016]/70 mb-6">
                This password reset link is invalid or has expired. Please request a new one.
              </p>
              <Link href="/login/forgot-password">
                <NeoButton variant="primary" size="md">
                  Request New Link
                </NeoButton>
              </Link>
            </div>
          </motion.div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#E8F4FD] to-[#D4E9F7] relative overflow-hidden">
      {/* Decorative Elements */}
      <motion.div
        className="absolute top-20 left-10 text-6xl"
        animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 4, repeat: Infinity }}
      >
        🔐
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

      <main className="flex flex-col items-center justify-center min-h-screen p-4">
        {/* Mascot */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="w-28 h-28 rounded-full bg-white border-4 border-[#181016] shadow-[4px_4px_0_0_#181016] overflow-hidden">
            <PipMascot variant={isSuccess ? 'happy' : 'thinking'} size="sm" animate={false} />
          </div>
        </motion.div>

        {isSuccess ? (
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
                Password updated!
              </h1>
              
              <p className="text-lg text-[#181016]/70 mb-6">
                Your password has been successfully changed. Redirecting you to your memories...
              </p>
              
              <div className="w-8 h-8 mx-auto border-4 border-[#ff61d2] border-t-transparent rounded-full animate-spin" />
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
                Set new password
              </h1>
              <p className="text-xl text-[#181016]/70">
                Choose a strong password for your account
              </p>
            </motion.div>

            {/* Reset Form */}
            <motion.form
              onSubmit={handleSubmit}
              className="w-full max-w-md space-y-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="bg-white border-4 border-[#181016] rounded-3xl shadow-[6px_6px_0_0_#181016] p-6 space-y-4">
                {/* New Password */}
                <label className="block">
                  <span className="font-display text-lg font-bold text-[#181016] block mb-2">
                    New password
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

                {/* Confirm Password */}
                <label className="block">
                  <span className="font-display text-lg font-bold text-[#181016] block mb-2">
                    Confirm password
                  </span>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#181016]/40">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full h-14 pl-12 pr-12 rounded-xl border-3 border-[#181016] text-lg font-medium focus:outline-none focus:border-[#ff61d2] placeholder:text-[#181016]/30 transition-colors"
                      required
                      disabled={isSubmitting}
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#181016]/40 hover:text-[#181016] transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </label>

                {/* Password requirements */}
                <div className="bg-[#FFF9E6] border-2 border-[#181016]/20 rounded-xl p-3">
                  <p className="text-[#181016]/70 text-sm">
                    Password must be at least 6 characters long.
                  </p>
                </div>

                {error && (
                  <div className="bg-red-50 border-2 border-red-200 rounded-xl p-3">
                    <p className="text-red-600 text-sm font-medium">{error}</p>
                  </div>
                )}
              </div>

              <NeoButton
                type="submit"
                variant="primary"
                size="lg"
                icon={<Check className="w-6 h-6" />}
                disabled={!password.trim() || !confirmPassword.trim() || isSubmitting}
              >
                {isSubmitting ? 'Updating...' : 'Update Password'}
              </NeoButton>
            </motion.form>
          </>
        )}
      </main>
    </div>
  );
}

