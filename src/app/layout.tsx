import type { Metadata, Viewport } from "next";
import { Fredoka, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/components/session-provider";
import { OrganizationSchema, WebSiteSchema } from "@/components/structured-data";

const fredoka = Fredoka({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
});

// Base URL for canonical URLs and OG images
const siteUrl = "https://picpip.co";

export const metadata: Metadata = {
  // Metadata base for resolving relative URLs
  metadataBase: new URL(siteUrl),
  
  // Basic metadata
  title: {
    default: "PicPip.co - Bring Your Pictures to Life!",
    template: "%s | PicPip.co",
  },
  description: "Transform your cherished photos into magical animated videos with AI. Perfect for preserving family memories and creating shareable moments.",
  keywords: [
    "photo animation",
    "video memories", 
    "family photos",
    "animated pictures",
    "AI photo to video",
    "animate photos",
    "memory videos",
    "photo to animation",
    "living photos",
    "animated memories",
  ],
  authors: [{ name: "PicPip", url: siteUrl }],
  creator: "PicPip",
  publisher: "PicPip",
  
  // Robots directives
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  
  // Icons configuration - using actual brand assets
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "32x32", type: "image/png" },
      { url: "/picpip_logo.png", sizes: "192x192", type: "image/png" },
    ],
    shortcut: "/favicon.png",
    apple: [
      { url: "/picpip_logo.png", sizes: "180x180", type: "image/png" },
    ],
  },
  
  // Open Graph metadata - using brand logo for social sharing
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "PicPip",
    title: "PicPip.co - Bring Your Pictures to Life!",
    description: "Transform your cherished photos into magical animated videos with AI. Perfect for preserving family memories.",
    images: [
      {
        url: "/picpip_logo.png",
        width: 800,
        height: 800,
        alt: "PicPip - Bring Your Pictures to Life",
        type: "image/png",
      },
    ],
  },
  
  // Twitter Card metadata
  twitter: {
    card: "summary_large_image",
    title: "PicPip.co - Bring Your Pictures to Life!",
    description: "Transform your cherished photos into magical animated videos with AI.",
    images: ["/picpip_logo.png"],
    creator: "@picpip",
    site: "@picpip",
  },
  
  // Verification (add your verification codes when available)
  // verification: {
  //   google: "your-google-verification-code",
  //   yandex: "your-yandex-verification-code",
  // },
  
  // Additional metadata
  category: "technology",
  classification: "Photo Animation Service",
  
  // Alternate languages (if applicable in future)
  alternates: {
    canonical: siteUrl,
  },
  
  // App links for mobile
  appleWebApp: {
    capable: true,
    title: "PicPip",
    statusBarStyle: "black-translucent",
  },
  
  // Format detection
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#ff61d2",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Structured Data for SEO */}
        <OrganizationSchema />
        <WebSiteSchema />
      </head>
      <body
        className={`${fredoka.variable} ${plusJakarta.variable} font-body antialiased`}
        suppressHydrationWarning
      >
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
