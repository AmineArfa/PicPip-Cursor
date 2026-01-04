import type { Metadata } from "next";
import { FAQSchema, BreadcrumbSchema } from "@/components/structured-data";

export const metadata: Metadata = {
  title: "Help & Support",
  description: "Need help with PicPip? Our friendly support team responds within 5 minutes. Ask Pip anything about photo animations!",
  keywords: [
    "PicPip help",
    "photo animation support",
    "contact PicPip",
    "customer support",
    "animated photos help",
  ],
  openGraph: {
    title: "Help & Support - PicPip",
    description: "Need help? Our friendly support team responds within 5 minutes!",
    url: "https://picpip.co/help",
    type: "website",
  },
  twitter: {
    title: "Help & Support - PicPip",
    description: "Need help? Our friendly support team responds within 5 minutes!",
  },
  alternates: {
    canonical: "https://picpip.co/help",
  },
};

// Common FAQs for structured data
const commonFAQs = [
  {
    question: "How does PicPip animate my photos?",
    answer: "PicPip uses advanced AI technology to analyze your photos and create natural, lifelike animations. Simply upload a photo and our magic does the rest!",
  },
  {
    question: "What types of photos work best?",
    answer: "Photos with clear faces and good lighting work best. Portrait photos, family pictures, and photos where subjects are looking at the camera produce the most magical results.",
  },
  {
    question: "How long does it take to create an animation?",
    answer: "Most animations are ready in under 2 minutes. You'll see a progress indicator while Pip works their magic!",
  },
  {
    question: "Can I cancel my subscription anytime?",
    answer: "Yes! You can cancel your subscription at any time from your account page. You'll keep access until the end of your billing period.",
  },
  {
    question: "What formats can I download?",
    answer: "All animations are delivered in HD MP4 format, perfect for sharing on social media, messaging apps, or storing on your device.",
  },
];

export default function HelpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <FAQSchema faqs={commonFAQs} />
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "https://picpip.co" },
          { name: "Help & Support", url: "https://picpip.co/help" },
        ]}
      />
      {children}
    </>
  );
}

