'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import { Download, MessageCircle, Mail, PartyPopper, Lock, Eye, EyeOff, CheckCircle, Sparkles, AlertTriangle, Share2, Copy, Check as CheckIcon } from 'lucide-react';
import { Header } from '@/components/header';
import { DotPattern, NeoButton } from '@/components/ui';
import { VideoPlayer } from '@/components/video-player';
import { PipMascot } from '@/components/pip-mascot';
import { createClient } from '@/lib/supabase/client';
import type { Animation } from '@/lib/supabase/types';

function CelebrationContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const animationId = params.id as string;
  const sessionId = searchParams.get('session_id');
  const needsAccount = searchParams.get('create_account') === 'true';
  const guestEmail = searchParams.get('email');
  
  const { width, height } = useWindowSize();
  const [animation, setAnimation] = useState<Animation | null>(null);
  const [showConfetti, setShowConfetti] = useState(true);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showAccountPrompt, setShowAccountPrompt] = useState(false);
  
  // Account creation form state
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [accountError, setAccountError] = useState<string | null>(null);
  const [accountCreated, setAccountCreated] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [credits, setCredits] = useState(0);

  // Stop confetti after a few seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  // Check auth status and fetch animation
  useEffect(() => {
    async function init() {
      try {
        const supabase = createClient();
        
        // Check if logged in
        const { data: { user } } = await supabase.auth.getUser();
        setIsLoggedIn(!!user);
        
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
          
          if (profile) {
            setIsSubscribed(profile.subscription_status === 'active' || profile.subscription_status === 'trial');
            setCredits(profile.credits || 0);
          }
        }
        
        // Fetch animation
        const response = await fetch(`/api/status/${animationId}`);
        if (!response.ok) throw new Error('Failed to fetch animation');
        
        const data = await response.json();
        setAnimation(data);
        
        // ACCESS CONTROL: Check if user has access to unwatermarked video
        // If video_url is null (API hides it for unpaid), redirect to checkout
        // Exception: if we have a session_id, user just paid via Stripe
        if (!data.video_url && !sessionId) {
          console.log('Access denied: No video URL and no session_id');
          setAccessDenied(true);
          // Wait a moment then redirect to checkout
          setTimeout(() => {
            router.replace(`/checkout/${animationId}`);
          }, 2000);
          return;
        }
        
        // Determine if we need to show account creation prompt
        // Show if: has session_id (just paid) + not logged in + has email in URL
        if (sessionId && !user && guestEmail) {
          setShowAccountPrompt(true);
        }
      } catch (err) {
        console.error('Error initializing:', err);
        setAccessDenied(true);
      } finally {
        setLoading(false);
      }
    }
    
    init();
  }, [animationId, sessionId, guestEmail, router]);

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestEmail || !password) return;
    
    setIsCreatingAccount(true);
    setAccountError(null);
    
    try {
      const supabase = createClient();
      
      // Sign up with email and password
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: guestEmail,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?animationId=${animationId}`,
        },
      });

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          setAccountError('This email is already registered. Try signing in instead.');
        } else {
          setAccountError(signUpError.message);
        }
        return;
      }

      // Check if we got a session (email confirmation might be disabled)
      if (data?.session && data.user) {
        // Logged in immediately - associate the animation with the user
        const { error: updateError } = await (supabase as any)
          .from('animations')
          .update({ 
            user_id: data.user.id, 
            guest_session_id: null 
          })
          .eq('id', animationId);
        
        if (updateError) {
          console.error('Error associating animation:', updateError);
        }
        
        setAccountCreated(true);
        setIsLoggedIn(true);
        setShowAccountPrompt(false);
      } else if (data?.user) {
        // Email confirmation required
        setAccountCreated(true);
        setShowAccountPrompt(false);
      }
    } catch (err: any) {
      console.error('Account creation error:', err);
      setAccountError(err.message || 'Failed to create account. Please try again.');
    } finally {
      setIsCreatingAccount(false);
    }
  };

  const handleSkipAccount = () => {
    setShowAccountPrompt(false);
  };

  // Check if user has access to unwatermarked video
  const hasUnwatermarkedAccess = !!animation?.video_url;

  const handleDownload = async () => {
    if (!hasUnwatermarkedAccess) {
      // Can't download without unwatermarked video access
      alert('Your video is still being processed. Please wait a moment and try again.');
      return;
    }
    
    try {
      const response = await fetch(animation!.video_url!);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `picpip-memory-${animationId}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err);
      // Fallback: open in new tab
      window.open(animation!.video_url!, '_blank');
    }
  };

  const handleWhatsApp = () => {
    if (!hasUnwatermarkedAccess) {
      alert('Your video is still being processed. Please wait a moment and try again.');
      return;
    }
    const text = encodeURIComponent('Check out this magical memory I created with PicPip! 🎬✨');
    const url = encodeURIComponent(animation?.video_url || window.location.href);
    window.open(`https://wa.me/?text=${text}%20${url}`, '_blank');
  };

  const handleEmail = () => {
    if (!hasUnwatermarkedAccess) {
      alert('Your video is still being processed. Please wait a moment and try again.');
      return;
    }
    const subject = encodeURIComponent('My Magical Memory from PicPip!');
    const body = encodeURIComponent(`I created this amazing animated memory with PicPip.co!\n\nWatch it here: ${animation?.video_url || window.location.href}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const handleTikTok = async () => {
    if (!hasUnwatermarkedAccess) {
      alert('Your video is still being processed. Please wait a moment and try again.');
      return;
    }
    // TikTok doesn't have a direct share URL - download video first then user can upload
    // First download, then open TikTok
    await handleDownload();
    // Open TikTok app/website
    window.open('https://www.tiktok.com/upload', '_blank');
  };

  const handleInstagram = async () => {
    if (!hasUnwatermarkedAccess) {
      alert('Your video is still being processed. Please wait a moment and try again.');
      return;
    }
    // Instagram doesn't support direct video sharing via URL
    // Download video first, then user can upload
    await handleDownload();
    // Open Instagram (will open app on mobile, website on desktop)
    window.open('https://www.instagram.com/', '_blank');
  };

  const handleFacebook = () => {
    if (!hasUnwatermarkedAccess) {
      alert('Your video is still being processed. Please wait a moment and try again.');
      return;
    }
    const url = encodeURIComponent(window.location.href);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank', 'width=600,height=400');
  };

  const handleTwitter = () => {
    if (!hasUnwatermarkedAccess) {
      alert('Your video is still being processed. Please wait a moment and try again.');
      return;
    }
    const text = encodeURIComponent('Check out this magical memory I created with PicPip! 🎬✨');
    const url = encodeURIComponent(window.location.href);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank', 'width=600,height=400');
  };

  const [copied, setCopied] = useState(false);
  
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (loading) {
    return (
      <DotPattern className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-[#ff61d2] border-t-transparent rounded-full"
        />
      </DotPattern>
    );
  }

  // Access denied - redirect in progress
  if (accessDenied) {
    return (
      <DotPattern className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white border-4 border-[#181016] rounded-3xl shadow-[8px_8px_0_0_#181016] p-8 max-w-md mx-4 text-center"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-100 border-4 border-[#181016] flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-yellow-600" />
          </div>
          <h2 className="font-display text-2xl font-bold text-[#181016] mb-2">
            Almost there!
          </h2>
          <p className="text-[#181016]/70 mb-4">
            You need to complete your purchase to access this video.
          </p>
          <p className="text-sm text-[#181016]/50">
            Redirecting to checkout...
          </p>
        </motion.div>
      </DotPattern>
    );
  }

  return (
    <DotPattern variant="dense" className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Confetti */}
      {showConfetti && (
        <Confetti
          width={width}
          height={height}
          recycle={false}
          numberOfPieces={200}
          colors={['#ff61d2', '#00ffff', '#a3ff00', '#2962ff', '#FFD700']}
        />
      )}

      {/* Decorative Elements */}
      <motion.div
        className="absolute top-20 left-8 text-[#ff61d2]"
        animate={{ rotate: [0, 15, 0, -15, 0], scale: [1, 1.2, 1] }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        <Star className="w-12 h-12" />
      </motion.div>
      
      <motion.div
        className="absolute top-40 right-12 w-8 h-8 bg-[#2962ff] rounded-full"
        animate={{ y: [0, -20, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      />

      <Header 
        isAuthenticated={isLoggedIn} 
        isSubscribed={isSubscribed} 
        credits={credits} 
      />

      <main className="flex-1 flex flex-col items-center justify-center p-4 pb-8">
        <AnimatePresence mode="wait">
          {/* Account Creation Prompt */}
          {showAccountPrompt && (
            <motion.div
              key="account-prompt"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md mb-8"
            >
              <div className="bg-white border-4 border-[#181016] rounded-3xl shadow-[8px_8px_0_0_#181016] p-6 space-y-4">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#a3ff00] border-4 border-[#181016] flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-[#181016]" />
                  </div>
                  <h2 className="font-display text-2xl font-bold text-[#181016] mb-2">
                    Save Your Memories!
                  </h2>
                  <p className="text-[#181016]/70">
                    Create an account to access all your animated memories anytime.
                  </p>
                </div>

                <form onSubmit={handleCreateAccount} className="space-y-4">
                  {/* Email (readonly) */}
                  <div>
                    <label className="font-display text-sm font-bold text-[#181016] block mb-2">
                      Email
                    </label>
                    <div className="h-12 px-4 rounded-xl border-3 border-[#181016]/30 bg-[#181016]/5 flex items-center text-[#181016]/70">
                      {guestEmail}
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="font-display text-sm font-bold text-[#181016] block mb-2">
                      Create Password
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#181016]/40">
                        <Lock className="w-5 h-5" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Min. 6 characters"
                        className="w-full h-12 pl-12 pr-12 rounded-xl border-3 border-[#181016] text-lg font-medium focus:outline-none focus:border-[#ff61d2] placeholder:text-[#181016]/30 transition-colors"
                        required
                        minLength={6}
                        disabled={isCreatingAccount}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#181016]/40 hover:text-[#181016] transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {accountError && (
                    <div className="bg-red-50 border-2 border-red-200 rounded-xl p-3">
                      <p className="text-red-600 text-sm font-medium">{accountError}</p>
                    </div>
                  )}

                  <NeoButton
                    type="submit"
                    variant="primary"
                    size="lg"
                    disabled={!password || password.length < 6 || isCreatingAccount}
                    className="w-full"
                  >
                    {isCreatingAccount ? 'Creating Account...' : 'Create Account'}
                  </NeoButton>
                </form>

                <button
                  onClick={handleSkipAccount}
                  className="w-full text-center text-[#181016]/50 font-medium hover:text-[#181016] transition-colors"
                >
                  Skip for now
                </button>
              </div>
            </motion.div>
          )}

          {/* Account Created Success */}
          {accountCreated && !isLoggedIn && (
            <motion.div
              key="account-success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-md mb-8"
            >
              <div className="bg-white border-4 border-[#181016] rounded-3xl shadow-[8px_8px_0_0_#181016] p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#a3ff00] border-4 border-[#181016] flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-[#181016]" />
                </div>
                <h2 className="font-display text-2xl font-bold text-[#181016] mb-2">
                  Check Your Email!
                </h2>
                <p className="text-[#181016]/70 mb-4">
                  We sent a confirmation link to <strong>{guestEmail}</strong>.
                  Click the link to access your memories anytime!
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bird Avatar + Title */}
        <motion.div
          className="flex flex-col items-center mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-20 h-20 rounded-full bg-[#181016] border-4 border-[#181016] overflow-hidden mb-4">
            <PipMascot variant="happy" size="sm" animate={false} />
          </div>
          
          <div className="bg-white border-4 border-[#181016] rounded-2xl p-6 shadow-[6px_6px_0_0_#181016] text-center">
            <h1 className="font-display text-4xl md:text-5xl font-bold text-[#181016] mb-2">
              IT&apos;S YOURS!
            </h1>
            <p className="text-lg text-[#181016]/70 font-medium">
              Your animation is ready for the world.
            </p>
          </div>
        </motion.div>

        {/* Video Player */}
        <motion.div
          className="w-full max-w-lg mb-8"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <VideoPlayer
            src={animation?.video_url || animation?.watermarked_video_url || '/demo-video.mp4'}
            poster={animation?.original_photo_url || undefined}
            showWatermark={!animation?.video_url}
            autoPlay
            loop
          />
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          className="flex flex-col gap-4 w-full max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          {/* Primary Action - Download */}
          <NeoButton
            variant="primary"
            size="lg"
            icon={<Download className="w-6 h-6" />}
            onClick={handleDownload}
          >
            Save to My Phone
          </NeoButton>

          {/* Social Sharing Grid */}
          <div className="bg-white border-4 border-[#181016] rounded-2xl shadow-[6px_6px_0_0_#181016] p-4">
            <div className="flex items-center gap-2 mb-4">
              <Share2 className="w-5 h-5 text-[#ff61d2]" />
              <span className="font-bold text-[#181016]">Share your memory</span>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              {/* TikTok */}
              <button
                onClick={handleTikTok}
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-black text-white border-2 border-[#181016] hover:scale-105 transition-transform"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
                <span className="text-xs font-bold">TikTok</span>
              </button>

              {/* Instagram */}
              <button
                onClick={handleInstagram}
                className="flex flex-col items-center gap-2 p-3 rounded-xl text-white border-2 border-[#181016] hover:scale-105 transition-transform"
                style={{ background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)' }}
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
                <span className="text-xs font-bold">Instagram</span>
              </button>

              {/* WhatsApp */}
              <button
                onClick={handleWhatsApp}
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-[#25D366] text-white border-2 border-[#181016] hover:scale-105 transition-transform"
              >
                <MessageCircle className="w-6 h-6" />
                <span className="text-xs font-bold">WhatsApp</span>
              </button>

              {/* Facebook */}
              <button
                onClick={handleFacebook}
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-[#1877F2] text-white border-2 border-[#181016] hover:scale-105 transition-transform"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <span className="text-xs font-bold">Facebook</span>
              </button>

              {/* X (Twitter) */}
              <button
                onClick={handleTwitter}
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-black text-white border-2 border-[#181016] hover:scale-105 transition-transform"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                <span className="text-xs font-bold">X</span>
              </button>

              {/* Email */}
              <button
                onClick={handleEmail}
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-[#EA4335] text-white border-2 border-[#181016] hover:scale-105 transition-transform"
              >
                <Mail className="w-6 h-6" />
                <span className="text-xs font-bold">Email</span>
              </button>
            </div>

            {/* Copy Link */}
            <button
              onClick={handleCopyLink}
              className="mt-4 w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-[#181016] bg-gray-50 hover:bg-gray-100 transition-colors font-bold text-[#181016]"
            >
              {copied ? (
                <>
                  <CheckIcon className="w-5 h-5 text-green-500" />
                  <span>Link Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5" />
                  <span>Copy Link</span>
                </>
              )}
            </button>
          </div>

          {/* Account prompt or email reminder */}
          <motion.div
            className="mt-2 bg-white border-2 border-dashed border-[#181016]/30 rounded-xl p-4 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            {isLoggedIn ? (
              <button
                onClick={() => router.push('/memories')}
                className="text-[#2962ff] font-bold hover:underline flex items-center justify-center gap-2"
              >
                <span className="text-xl">📁</span>
                View all your memories
              </button>
            ) : (
              <p className="text-[#181016]/70 font-medium flex items-center justify-center gap-2">
                <span className="text-xl">🎉</span>
                Check your email for your permanent link!
              </p>
            )}
          </motion.div>
        </motion.div>
      </main>

      {/* Decorative Triangle */}
      <motion.div
        className="absolute bottom-20 right-8"
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
      >
        <div className="w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-b-[35px] border-b-[#a3ff00]" />
      </motion.div>

      {/* Footer */}
      <footer className="w-full py-4 text-center text-[#181016]/50 font-bold text-sm">
        <p>DESIGNED FOR PICPIP.CO</p>
      </footer>
    </DotPattern>
  );
}

function CelebrationLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#E8F4FD] to-[#D4E9F7] flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-[#ff61d2] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function CelebrationPage() {
  return (
    <Suspense fallback={<CelebrationLoading />}>
      <CelebrationContent />
    </Suspense>
  );
}

// Star component for decorations
function Star({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}
