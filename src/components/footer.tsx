'use client';

import Link from 'next/link';
import Image from 'next/image';

interface FooterProps {
  variant?: 'default' | 'minimal';
}

export function Footer({ variant = 'default' }: FooterProps) {
  const currentYear = new Date().getFullYear();

  if (variant === 'minimal') {
    return (
      <footer className="border-t-4 border-[#181016] bg-white py-4 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
          <p className="text-[#181016]/60">
            &copy; {currentYear} PicPip. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link 
              href="/privacy" 
              className="text-[#181016]/60 hover:text-[#181016] font-medium transition-colors"
            >
              Privacy Policy
            </Link>
            <Link 
              href="/terms" 
              className="text-[#181016]/60 hover:text-[#181016] font-medium transition-colors"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="border-t-4 border-[#181016] bg-white py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="inline-block mb-4">
              <div className="relative h-12 w-36">
                <Image
                  src="/picpip_logo.svg"
                  alt="PicPip"
                  fill
                  className="object-contain"
                />
              </div>
            </Link>
            <p className="text-[#181016]/70 max-w-sm">
              Transform your cherished photos into magical animated videos with AI. Perfect for preserving family memories.
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="font-display font-bold text-lg mb-4">Product</h3>
            <ul className="space-y-2">
              <li>
                <Link 
                  href="/pricing" 
                  className="text-[#181016]/70 hover:text-[#ff61d2] transition-colors"
                >
                  Pricing
                </Link>
              </li>
              <li>
                <Link 
                  href="/login" 
                  className="text-[#181016]/70 hover:text-[#ff61d2] transition-colors"
                >
                  Sign In
                </Link>
              </li>
              <li>
                <Link 
                  href="/help" 
                  className="text-[#181016]/70 hover:text-[#ff61d2] transition-colors"
                >
                  Help & Support
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-display font-bold text-lg mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link 
                  href="/privacy" 
                  className="text-[#181016]/70 hover:text-[#ff61d2] transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link 
                  href="/terms" 
                  className="text-[#181016]/70 hover:text-[#ff61d2] transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t-2 border-[#181016]/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[#181016]/60 text-sm">
            &copy; {currentYear} PicPip. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-sm">
            <Link 
              href="/privacy" 
              className="text-[#181016]/60 hover:text-[#181016] font-medium transition-colors"
            >
              Privacy
            </Link>
            <span className="text-[#181016]/30">•</span>
            <Link 
              href="/terms" 
              className="text-[#181016]/60 hover:text-[#181016] font-medium transition-colors"
            >
              Terms
            </Link>
            <span className="text-[#181016]/30">•</span>
            <Link 
              href="/help" 
              className="text-[#181016]/60 hover:text-[#181016] font-medium transition-colors"
            >
              Help
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

