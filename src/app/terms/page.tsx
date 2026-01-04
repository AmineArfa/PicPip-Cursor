'use client';

import { motion } from 'framer-motion';
import { FileText, AlertTriangle, CreditCard, Scale, Ban, RefreshCw, Mail, Globe } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Header } from '@/components/header';
import { DotPattern } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/lib/supabase/types';

// Section component for consistent styling
function TermsSection({ 
  icon: Icon, 
  title, 
  children,
  delay = 0 
}: { 
  icon: React.ElementType; 
  title: string; 
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white border-4 border-[#181016] rounded-3xl shadow-[6px_6px_0_0_#181016] p-6 md:p-8"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-full bg-[#00d4ff] border-3 border-[#181016] flex items-center justify-center flex-shrink-0">
          <Icon className="w-6 h-6 text-[#181016]" />
        </div>
        <h2 className="font-display text-2xl md:text-3xl font-bold text-[#181016]">
          {title}
        </h2>
      </div>
      <div className="prose prose-lg max-w-none text-[#181016]/80 space-y-4">
        {children}
      </div>
    </motion.section>
  );
}

export default function TermsOfServicePage() {
  const lastUpdated = 'January 4, 2025';
  const contactEmail = 'support@picpip.co';
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [credits, setCredits] = useState(0);

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

  return (
    <DotPattern variant="light" className="min-h-screen flex flex-col">
      <Header 
        isAuthenticated={isAuthenticated} 
        isSubscribed={isSubscribed} 
        credits={credits} 
      />
      
      <main className="flex-1 py-8 md:py-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#00d4ff] border-3 border-[#181016] rounded-full mb-4 shadow-[3px_3px_0_0_#181016]">
              <FileText className="w-5 h-5" />
              <span className="font-bold">Legal Agreement</span>
            </div>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-[#181016] mb-4">
              Terms of Service
            </h1>
            <p className="text-lg md:text-xl text-[#181016]/70 max-w-2xl mx-auto">
              Please read these terms carefully before using PicPip.
            </p>
            <p className="text-sm text-[#181016]/50 mt-4">
              Last updated: {lastUpdated}
            </p>
          </motion.div>

          {/* Terms Sections */}
          <div className="space-y-6">
            {/* Agreement to Terms */}
            <TermsSection icon={Scale} title="Agreement to Terms" delay={0.1}>
              <p>
                By accessing or using PicPip (&quot;Service&quot;), available at <strong>picpip.co</strong>, you agree to be bound by these Terms of Service (&quot;Terms&quot;). If you disagree with any part of these terms, you may not access the Service.
              </p>
              <p>
                These Terms apply to all visitors, users, and others who access or use the Service.
              </p>
            </TermsSection>

            {/* Description of Service */}
            <TermsSection icon={Globe} title="Description of Service" delay={0.15}>
              <p>
                PicPip is a photo animation service that uses artificial intelligence technology to transform static photos into animated videos. Our Service includes:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Photo upload and processing capabilities</li>
                <li>AI-powered video generation from photos</li>
                <li>Video download and sharing features</li>
                <li>Account management and subscription services</li>
              </ul>
            </TermsSection>

            {/* User Accounts */}
            <TermsSection icon={FileText} title="User Accounts" delay={0.2}>
              <p>
                When you create an account with us, you must provide accurate, complete, and current information. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account.
              </p>
              <p>
                You are responsible for:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Safeguarding the password you use to access the Service</li>
                <li>All activities that occur under your account</li>
                <li>Notifying us immediately of any unauthorized use of your account</li>
              </ul>
              <p className="mt-4">
                You may not use as a username the name of another person or entity, or a name that is not lawfully available for use.
              </p>
            </TermsSection>

            {/* Payments and Subscriptions */}
            <TermsSection icon={CreditCard} title="Payments and Subscriptions" delay={0.25}>
              <h3 className="font-display text-xl font-bold text-[#181016] mt-4 mb-3">Pricing</h3>
              <p>
                We offer various pricing options including single purchases, credit bundles, and subscription plans. All prices are displayed in USD and are subject to change with notice.
              </p>

              <h3 className="font-display text-xl font-bold text-[#181016] mt-6 mb-3">Subscriptions</h3>
              <p>
                Some parts of the Service are billed on a subscription basis. You will be billed in advance on a recurring basis (monthly). Billing cycles are set on a monthly basis.
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Free trials are offered for new subscribers</li>
                <li>After the trial period, you will be automatically charged unless you cancel</li>
                <li>You can cancel your subscription at any time through your account settings</li>
                <li>Cancellation takes effect at the end of the current billing period</li>
              </ul>

              <h3 className="font-display text-xl font-bold text-[#181016] mt-6 mb-3">Refunds</h3>
              <p>
                Due to the nature of digital services, refunds are generally not provided once content has been generated. However, we handle refund requests on a case-by-case basis. Please contact our support team if you believe you are entitled to a refund.
              </p>
            </TermsSection>

            {/* Content and Ownership */}
            <TermsSection icon={FileText} title="Content and Ownership" delay={0.3}>
              <h3 className="font-display text-xl font-bold text-[#181016] mt-4 mb-3">Your Content</h3>
              <p>
                You retain all rights to the photos you upload to PicPip. By uploading content, you grant us a limited license to process, transform, and store your content solely for the purpose of providing the Service.
              </p>

              <h3 className="font-display text-xl font-bold text-[#181016] mt-6 mb-3">Generated Content</h3>
              <p>
                Animated videos generated by our Service belong to you for personal and commercial use, subject to the following conditions:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>You must have the right to use the original photos</li>
                <li>The content must not violate any third-party rights</li>
                <li>Usage must comply with applicable laws</li>
              </ul>

              <h3 className="font-display text-xl font-bold text-[#181016] mt-6 mb-3">Representations</h3>
              <p>
                By uploading content, you represent and warrant that:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>You own the content or have the right to use it</li>
                <li>The content does not infringe on any third party&apos;s rights</li>
                <li>The content does not violate any applicable laws</li>
              </ul>
            </TermsSection>

            {/* Prohibited Uses */}
            <TermsSection icon={Ban} title="Prohibited Uses" delay={0.35}>
              <p>
                You agree not to use the Service to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Upload photos of individuals without their consent</li>
                <li>Create content that is illegal, harmful, threatening, abusive, or harassing</li>
                <li>Create deepfakes or misleading content intended to deceive</li>
                <li>Generate content that sexualizes minors or depicts child exploitation</li>
                <li>Violate any applicable laws or regulations</li>
                <li>Infringe on intellectual property rights of others</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Use automated systems (bots, scrapers) without permission</li>
                <li>Interfere with or disrupt the Service or servers</li>
                <li>Resell or redistribute the Service without authorization</li>
              </ul>
              <p className="mt-4">
                We reserve the right to terminate accounts that violate these terms without notice or refund.
              </p>
            </TermsSection>

            {/* Disclaimer and Limitations */}
            <TermsSection icon={AlertTriangle} title="Disclaimer and Limitations" delay={0.4}>
              <h3 className="font-display text-xl font-bold text-[#181016] mt-4 mb-3">Service Availability</h3>
              <p>
                The Service is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind. We do not guarantee that the Service will be uninterrupted, secure, or error-free.
              </p>

              <h3 className="font-display text-xl font-bold text-[#181016] mt-6 mb-3">AI-Generated Content</h3>
              <p>
                Our AI technology produces results based on the input provided. We do not guarantee specific results, and output quality may vary. The AI may occasionally produce unexpected or imperfect results.
              </p>

              <h3 className="font-display text-xl font-bold text-[#181016] mt-6 mb-3">Limitation of Liability</h3>
              <p>
                To the maximum extent permitted by law, PicPip shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or other intangible losses resulting from:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Your use or inability to use the Service</li>
                <li>Unauthorized access to your data</li>
                <li>Conduct of third parties on the Service</li>
                <li>Any other matter relating to the Service</li>
              </ul>
            </TermsSection>

            {/* Termination */}
            <TermsSection icon={Ban} title="Termination" delay={0.45}>
              <p>
                We may terminate or suspend your account immediately, without prior notice or liability, for any reason, including if you breach the Terms.
              </p>
              <p>
                Upon termination:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Your right to use the Service will immediately cease</li>
                <li>You may request a copy of your data before termination takes effect</li>
                <li>We may delete your content and data after a reasonable period</li>
              </ul>
              <p className="mt-4">
                You may terminate your account at any time by contacting us or using the account settings.
              </p>
            </TermsSection>

            {/* Changes to Terms */}
            <TermsSection icon={RefreshCw} title="Changes to Terms" delay={0.5}>
              <p>
                We reserve the right to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days&apos; notice prior to any new terms taking effect.
              </p>
              <p>
                By continuing to access or use our Service after revisions become effective, you agree to be bound by the revised terms.
              </p>
            </TermsSection>

            {/* Governing Law */}
            <TermsSection icon={Scale} title="Governing Law" delay={0.55}>
              <p>
                These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which PicPip operates, without regard to its conflict of law provisions.
              </p>
              <p>
                Any disputes arising from these Terms or your use of the Service will be resolved through good-faith negotiations, and if necessary, through binding arbitration or in the courts of the applicable jurisdiction.
              </p>
            </TermsSection>

            {/* Contact Us */}
            <TermsSection icon={Mail} title="Contact Us" delay={0.6}>
              <p>
                If you have any questions about these Terms of Service, please contact us:
              </p>
              <div className="bg-[#FFF9E6] border-3 border-[#181016] rounded-2xl p-6 mt-4">
                <p className="font-bold text-lg mb-2">PicPip Support Team</p>
                <p>
                  Email: <a href={`mailto:${contactEmail}`} className="text-[#2962ff] font-bold hover:underline">{contactEmail}</a>
                </p>
                <p className="mt-2">
                  Website: <a href="https://picpip.co" className="text-[#2962ff] font-bold hover:underline">picpip.co</a>
                </p>
              </div>
            </TermsSection>
          </div>

          {/* Footer Links */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-12 text-center"
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
              <Link
                href="/"
                className="px-6 py-3 bg-[#ff61d2] text-white border-3 border-[#181016] rounded-full font-bold hover:shadow-[4px_4px_0_0_#181016] hover:-translate-y-1 transition-all"
              >
                Back to Home
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

