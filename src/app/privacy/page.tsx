'use client';

import { motion } from 'framer-motion';
import { ArrowLeft, Shield, Eye, Lock, Trash2, Mail, Database, Globe, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Header } from '@/components/header';
import { DotPattern } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/lib/supabase/types';

// Section component for consistent styling
function PolicySection({ 
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
        <div className="w-12 h-12 rounded-full bg-[#ff61d2] border-3 border-[#181016] flex items-center justify-center flex-shrink-0">
          <Icon className="w-6 h-6 text-white" />
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

export default function PrivacyPolicyPage() {
  const lastUpdated = 'January 4, 2025';
  const contactEmail = 'privacy@picpip.co';
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
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#a3ff00] border-3 border-[#181016] rounded-full mb-4 shadow-[3px_3px_0_0_#181016]">
              <Shield className="w-5 h-5" />
              <span className="font-bold">Your Privacy Matters</span>
            </div>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-[#181016] mb-4">
              Privacy Policy
            </h1>
            <p className="text-lg md:text-xl text-[#181016]/70 max-w-2xl mx-auto">
              We&apos;re committed to protecting your privacy and being transparent about how we handle your data.
            </p>
            <p className="text-sm text-[#181016]/50 mt-4">
              Last updated: {lastUpdated}
            </p>
          </motion.div>

          {/* Policy Sections */}
          <div className="space-y-6">
            {/* Introduction */}
            <PolicySection icon={Globe} title="Introduction" delay={0.1}>
              <p>
                Welcome to PicPip (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). PicPip is a photo animation service that transforms your cherished photos into magical animated videos using artificial intelligence. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website at <strong>picpip.co</strong> and our services.
              </p>
              <p>
                By using PicPip, you agree to the collection and use of information in accordance with this policy. If you do not agree with our policies and practices, please do not use our services.
              </p>
            </PolicySection>

            {/* Information We Collect */}
            <PolicySection icon={Database} title="Information We Collect" delay={0.15}>
              <p>We collect several types of information to provide and improve our service:</p>
              
              <h3 className="font-display text-xl font-bold text-[#181016] mt-6 mb-3">Account Information</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Email address:</strong> Used for account creation, authentication, and communication</li>
                <li><strong>Authentication data:</strong> When you sign in with Google, Apple, or Facebook, we receive your email and basic profile information</li>
                <li><strong>Account preferences:</strong> Your subscription status and credit balance</li>
              </ul>

              <h3 className="font-display text-xl font-bold text-[#181016] mt-6 mb-3">Content You Provide</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Photos:</strong> Images you upload for animation processing</li>
                <li><strong>Generated videos:</strong> The animated videos we create from your photos</li>
                <li><strong>Support messages:</strong> Communications you send through our help center</li>
              </ul>

              <h3 className="font-display text-xl font-bold text-[#181016] mt-6 mb-3">Automatically Collected Information</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Usage data:</strong> How you interact with our service</li>
                <li><strong>Device information:</strong> Browser type, operating system, and device identifiers</li>
                <li><strong>Log data:</strong> IP addresses, access times, and pages viewed</li>
              </ul>
            </PolicySection>

            {/* How We Use Your Information */}
            <PolicySection icon={Eye} title="How We Use Your Information" delay={0.2}>
              <p>We use the information we collect for the following purposes:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Service delivery:</strong> To process your photos and create animated videos</li>
                <li><strong>Account management:</strong> To create and manage your account, process payments, and track your credits</li>
                <li><strong>Communication:</strong> To send service updates, respond to support requests, and provide important notices</li>
                <li><strong>Improvement:</strong> To understand how our service is used and make improvements</li>
                <li><strong>Security:</strong> To detect, prevent, and address technical issues and fraudulent activity</li>
                <li><strong>Legal compliance:</strong> To comply with applicable laws and regulations</li>
              </ul>
            </PolicySection>

            {/* Third-Party Services */}
            <PolicySection icon={Lock} title="Third-Party Services" delay={0.25}>
              <p>We work with trusted third-party services to operate PicPip:</p>
              
              <h3 className="font-display text-xl font-bold text-[#181016] mt-6 mb-3">Authentication Providers</h3>
              <p>
                When you sign in using Google, Apple, or Facebook, these providers share your email and basic profile information with us. Their use of your data is governed by their respective privacy policies.
              </p>

              <h3 className="font-display text-xl font-bold text-[#181016] mt-6 mb-3">AI Processing (Runway)</h3>
              <p>
                We use Runway&apos;s AI technology to generate video animations from your photos. Your photos are transmitted securely to Runway for processing. Runway processes your content solely for the purpose of generating your animations and does not retain your content after processing is complete.
              </p>

              <h3 className="font-display text-xl font-bold text-[#181016] mt-6 mb-3">Payment Processing (Stripe)</h3>
              <p>
                Payment transactions are processed by Stripe. We do not store your credit card information. Stripe&apos;s handling of your payment information is governed by their privacy policy.
              </p>

              <h3 className="font-display text-xl font-bold text-[#181016] mt-6 mb-3">Cloud Infrastructure (Supabase)</h3>
              <p>
                We use Supabase for secure data storage and authentication. Your data is encrypted at rest and in transit.
              </p>

              {/* Google API Services Disclosure */}
              <div className="bg-[#E8F4FD] border-3 border-[#2962ff] rounded-2xl p-4 mt-6">
                <h4 className="font-bold text-[#2962ff] mb-2">Google API Services User Data Policy</h4>
                <p className="text-sm">
                  PicPip&apos;s use and transfer of information received from Google APIs adheres to the{' '}
                  <a 
                    href="https://developers.google.com/terms/api-services-user-data-policy" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[#2962ff] underline font-bold hover:no-underline"
                  >
                    Google API Services User Data Policy
                  </a>
                  , including the Limited Use requirements.
                </p>
              </div>
            </PolicySection>

            {/* Data Storage and Security */}
            <PolicySection icon={Shield} title="Data Storage and Security" delay={0.3}>
              <p>We take the security of your data seriously:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Encryption:</strong> All data is encrypted in transit using TLS/SSL and at rest using AES-256 encryption</li>
                <li><strong>Access controls:</strong> Strict access controls limit who can view your data</li>
                <li><strong>Secure infrastructure:</strong> We use enterprise-grade cloud infrastructure with robust security measures</li>
                <li><strong>Regular audits:</strong> We regularly review and update our security practices</li>
              </ul>
              <p className="mt-4">
                While we implement strong security measures, no method of transmission over the Internet or electronic storage is 100% secure. We cannot guarantee absolute security, but we strive to protect your information using industry best practices.
              </p>
            </PolicySection>

            {/* Data Retention */}
            <PolicySection icon={RefreshCw} title="Data Retention" delay={0.35}>
              <p>We retain your information for as long as necessary to provide our services:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Account data:</strong> Retained while your account is active and for a reasonable period afterward</li>
                <li><strong>Photos and videos:</strong> Stored in your account until you delete them or close your account</li>
                <li><strong>Guest uploads:</strong> Temporary files from non-registered users are automatically deleted within 24 hours</li>
                <li><strong>Support tickets:</strong> Retained for customer service purposes and legal compliance</li>
              </ul>
              <p className="mt-4">
                You can request deletion of your data at any time by contacting us or using the account settings.
              </p>
            </PolicySection>

            {/* Your Rights */}
            <PolicySection icon={Lock} title="Your Rights" delay={0.4}>
              <p>You have the following rights regarding your personal data:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Access:</strong> Request a copy of the personal data we hold about you</li>
                <li><strong>Correction:</strong> Request correction of inaccurate or incomplete data</li>
                <li><strong>Deletion:</strong> Request deletion of your personal data</li>
                <li><strong>Portability:</strong> Request your data in a portable format</li>
                <li><strong>Withdrawal of consent:</strong> Withdraw consent for data processing where applicable</li>
                <li><strong>Objection:</strong> Object to certain types of data processing</li>
              </ul>
              <p className="mt-4">
                To exercise any of these rights, please contact us at <a href={`mailto:${contactEmail}`} className="text-[#2962ff] font-bold hover:underline">{contactEmail}</a>.
              </p>
            </PolicySection>

            {/* Children's Privacy */}
            <PolicySection icon={Shield} title="Children's Privacy" delay={0.45}>
              <p>
                PicPip is not intended for children under the age of 13. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us immediately, and we will take steps to delete such information.
              </p>
            </PolicySection>

            {/* International Data Transfers */}
            <PolicySection icon={Globe} title="International Data Transfers" delay={0.5}>
              <p>
                Your information may be transferred to and processed in countries other than your country of residence. These countries may have different data protection laws. When we transfer your data internationally, we take appropriate safeguards to ensure your information remains protected in accordance with this Privacy Policy.
              </p>
            </PolicySection>

            {/* Changes to This Policy */}
            <PolicySection icon={RefreshCw} title="Changes to This Policy" delay={0.55}>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the &quot;Last updated&quot; date. For significant changes, we will provide additional notice, such as an email notification.
              </p>
              <p className="mt-4">
                We encourage you to review this Privacy Policy periodically to stay informed about how we protect your information.
              </p>
            </PolicySection>

            {/* Contact Us */}
            <PolicySection icon={Mail} title="Contact Us" delay={0.6}>
              <p>
                If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:
              </p>
              <div className="bg-[#FFF9E6] border-3 border-[#181016] rounded-2xl p-6 mt-4">
                <p className="font-bold text-lg mb-2">PicPip Privacy Team</p>
                <p>
                  Email: <a href={`mailto:${contactEmail}`} className="text-[#2962ff] font-bold hover:underline">{contactEmail}</a>
                </p>
                <p className="mt-2">
                  Website: <a href="https://picpip.co" className="text-[#2962ff] font-bold hover:underline">picpip.co</a>
                </p>
              </div>
              <p className="mt-4">
                We aim to respond to all privacy-related inquiries within 30 days.
              </p>
            </PolicySection>
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
                href="/terms"
                className="px-6 py-3 bg-white border-3 border-[#181016] rounded-full font-bold hover:shadow-[4px_4px_0_0_#181016] hover:-translate-y-1 transition-all"
              >
                Terms of Service
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

