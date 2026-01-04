'use client';

import { motion } from 'framer-motion';
import { 
  Shield, 
  CheckCircle2, 
  Clock, 
  Loader2, 
  AlertCircle,
  ArrowLeft,
  Copy,
  Check
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { Header } from '@/components/header';
import { DotPattern } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import type { Profile, DataDeletionRequest } from '@/lib/supabase/types';
import { format } from 'date-fns';

type DeletionStatus = 'pending' | 'processing' | 'completed' | 'failed';

interface StatusConfig {
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
  title: string;
  description: string;
}

const STATUS_CONFIG: Record<DeletionStatus, StatusConfig> = {
  pending: {
    icon: Clock,
    color: 'text-[#f59e0b]',
    bgColor: 'bg-[#fef3c7]',
    borderColor: 'border-[#f59e0b]',
    title: 'Request Received',
    description: 'Your data deletion request has been received and is queued for processing.',
  },
  processing: {
    icon: Loader2,
    color: 'text-[#3b82f6]',
    bgColor: 'bg-[#dbeafe]',
    borderColor: 'border-[#3b82f6]',
    title: 'Processing',
    description: 'We are currently processing your data deletion request. This may take up to 30 days.',
  },
  completed: {
    icon: CheckCircle2,
    color: 'text-[#22c55e]',
    bgColor: 'bg-[#dcfce7]',
    borderColor: 'border-[#22c55e]',
    title: 'Completed',
    description: 'Your data has been successfully deleted from our systems.',
  },
  failed: {
    icon: AlertCircle,
    color: 'text-[#ef4444]',
    bgColor: 'bg-[#fee2e2]',
    borderColor: 'border-[#ef4444]',
    title: 'Failed',
    description: 'There was an issue processing your request. Please contact support.',
  },
};

function StatusPageContent() {
  const searchParams = useSearchParams();
  const code = searchParams.get('code');
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [credits, setCredits] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [request, setRequest] = useState<DataDeletionRequest | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        setIsAuthenticated(true);
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        const typedProfile = profile as Profile | null;
        if (typedProfile) {
          setIsSubscribed(typedProfile.subscription_status === 'active' || typedProfile.subscription_status === 'trial');
          setCredits(typedProfile.credits || 0);
        }
      }
    }
    
    checkAuth();
  }, []);

  useEffect(() => {
    async function fetchStatus() {
      if (!code) {
        setLoading(false);
        setError('No confirmation code provided.');
        return;
      }

      try {
        const supabase = createClient();
        const { data, error: fetchError } = await supabase
          .from('data_deletion_requests')
          .select('*')
          .eq('confirmation_code', code)
          .single();

        if (fetchError || !data) {
          setError('Deletion request not found. Please check your confirmation code.');
        } else {
          setRequest(data as DataDeletionRequest);
        }
      } catch {
        setError('Failed to fetch deletion status. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    fetchStatus();
  }, [code]);

  const copyConfirmationCode = async () => {
    if (code) {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const statusConfig = request ? STATUS_CONFIG[request.status] : null;
  const StatusIcon = statusConfig?.icon || AlertCircle;

  return (
    <DotPattern variant="light" className="min-h-screen flex flex-col">
      <Header 
        isAuthenticated={isAuthenticated} 
        isSubscribed={isSubscribed} 
        credits={credits} 
      />
      
      <main className="flex-1 py-8 md:py-16 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Back Link */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-8"
          >
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-[#181016]/70 hover:text-[#181016] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Home</span>
            </Link>
          </motion.div>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#a3ff00] border-3 border-[#181016] rounded-full mb-4 shadow-[3px_3px_0_0_#181016]">
              <Shield className="w-5 h-5" />
              <span className="font-bold">Privacy Request</span>
            </div>
            <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-[#181016] mb-4">
              Data Deletion Status
            </h1>
            <p className="text-lg text-[#181016]/70 max-w-xl mx-auto">
              Track the status of your data deletion request submitted via Facebook.
            </p>
          </motion.div>

          {/* Status Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white border-4 border-[#181016] rounded-3xl shadow-[6px_6px_0_0_#181016] overflow-hidden"
          >
            {loading ? (
              <div className="p-12 flex flex-col items-center justify-center">
                <Loader2 className="w-12 h-12 text-[#ff61d2] animate-spin mb-4" />
                <p className="text-[#181016]/70 font-medium">Loading status...</p>
              </div>
            ) : error ? (
              <div className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-full bg-[#fee2e2] border-3 border-[#ef4444] flex items-center justify-center">
                    <AlertCircle className="w-8 h-8 text-[#ef4444]" />
                  </div>
                  <div>
                    <h2 className="font-display text-2xl font-bold text-[#181016]">
                      Request Not Found
                    </h2>
                    <p className="text-[#181016]/70">{error}</p>
                  </div>
                </div>
                
                <div className="bg-[#FFF9E6] border-3 border-[#181016] rounded-2xl p-6">
                  <h3 className="font-bold mb-2">Need Help?</h3>
                  <p className="text-sm text-[#181016]/70 mb-4">
                    If you believe this is an error, please contact our support team with your confirmation code.
                  </p>
                  <Link
                    href="/help"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#ff61d2] text-white border-3 border-[#181016] rounded-full font-bold hover:shadow-[3px_3px_0_0_#181016] hover:-translate-y-0.5 transition-all"
                  >
                    Contact Support
                  </Link>
                </div>
              </div>
            ) : request && statusConfig ? (
              <>
                {/* Status Header */}
                <div className={`p-6 ${statusConfig.bgColor} border-b-4 border-[#181016]`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-16 h-16 rounded-full bg-white border-3 ${statusConfig.borderColor} flex items-center justify-center`}>
                      <StatusIcon className={`w-8 h-8 ${statusConfig.color} ${request.status === 'processing' ? 'animate-spin' : ''}`} />
                    </div>
                    <div>
                      <h2 className="font-display text-2xl font-bold text-[#181016]">
                        {statusConfig.title}
                      </h2>
                      <p className="text-[#181016]/70">{statusConfig.description}</p>
                    </div>
                  </div>
                </div>

                {/* Request Details */}
                <div className="p-6 space-y-6">
                  {/* Confirmation Code */}
                  <div>
                    <label className="block text-sm font-bold text-[#181016]/60 uppercase tracking-wide mb-2">
                      Confirmation Code
                    </label>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 px-4 py-3 bg-[#f5f5f5] border-3 border-[#181016] rounded-xl font-mono text-lg">
                        {request.confirmation_code}
                      </code>
                      <button
                        onClick={copyConfirmationCode}
                        className="p-3 bg-white border-3 border-[#181016] rounded-xl hover:shadow-[3px_3px_0_0_#181016] hover:-translate-y-0.5 transition-all"
                        title="Copy confirmation code"
                      >
                        {copied ? (
                          <Check className="w-5 h-5 text-[#22c55e]" />
                        ) : (
                          <Copy className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="space-y-4">
                    <label className="block text-sm font-bold text-[#181016]/60 uppercase tracking-wide">
                      Timeline
                    </label>
                    
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-[#22c55e]" />
                        <div className="flex-1">
                          <span className="font-medium">Request Submitted</span>
                          <span className="text-[#181016]/60 ml-2">
                            {format(new Date(request.requested_at), 'PPpp')}
                          </span>
                        </div>
                      </div>
                      
                      {request.processed_at && (
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full bg-[#3b82f6]" />
                          <div className="flex-1">
                            <span className="font-medium">Processing Started</span>
                            <span className="text-[#181016]/60 ml-2">
                              {format(new Date(request.processed_at), 'PPpp')}
                            </span>
                          </div>
                        </div>
                      )}
                      
                      {request.completed_at && (
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full bg-[#22c55e]" />
                          <div className="flex-1">
                            <span className="font-medium">Deletion Completed</span>
                            <span className="text-[#181016]/60 ml-2">
                              {format(new Date(request.completed_at), 'PPpp')}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Notes */}
                  {request.notes && (
                    <div>
                      <label className="block text-sm font-bold text-[#181016]/60 uppercase tracking-wide mb-2">
                        Additional Information
                      </label>
                      <p className="text-[#181016]/80 bg-[#f5f5f5] border-3 border-[#181016] rounded-xl p-4">
                        {request.notes}
                      </p>
                    </div>
                  )}

                  {/* What Gets Deleted */}
                  <div className="bg-[#E8F4FD] border-3 border-[#2962ff] rounded-2xl p-6">
                    <h3 className="font-bold text-[#2962ff] mb-3">What Data Is Deleted?</h3>
                    <ul className="space-y-2 text-sm text-[#181016]/80">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#2962ff] mt-0.5 flex-shrink-0" />
                        <span>Your profile information linked to Facebook</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#2962ff] mt-0.5 flex-shrink-0" />
                        <span>Any photos and videos you uploaded</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#2962ff] mt-0.5 flex-shrink-0" />
                        <span>Purchase history and credit balance</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#2962ff] mt-0.5 flex-shrink-0" />
                        <span>Support tickets and communications</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </>
            ) : null}
          </motion.div>

          {/* Footer Links */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-8 text-center"
          >
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/privacy"
                className="px-6 py-3 bg-white border-3 border-[#181016] rounded-full font-bold hover:shadow-[4px_4px_0_0_#181016] hover:-translate-y-1 transition-all"
              >
                Privacy Policy
              </Link>
              <Link
                href="/help"
                className="px-6 py-3 bg-white border-3 border-[#181016] rounded-full font-bold hover:shadow-[4px_4px_0_0_#181016] hover:-translate-y-1 transition-all"
              >
                Help & Support
              </Link>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Simple Footer */}
      <footer className="border-t-4 border-[#181016] bg-white py-6 px-4 mt-12">
        <div className="max-w-4xl mx-auto text-center text-[#181016]/60">
          <p>&copy; {new Date().getFullYear()} PicPip. All rights reserved.</p>
        </div>
      </footer>
    </DotPattern>
  );
}

export default function DataDeletionStatusPage() {
  return (
    <Suspense fallback={
      <DotPattern variant="light" className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-[#ff61d2] animate-spin" />
      </DotPattern>
    }>
      <StatusPageContent />
    </Suspense>
  );
}

