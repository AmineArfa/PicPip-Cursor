import type { Metadata } from "next";
import { SoftwareApplicationSchema, BreadcrumbSchema } from "@/components/structured-data";

export const metadata: Metadata = {
  title: "Pricing - Photo Animation Plans",
  description: "Choose the perfect plan to bring your photos to life. Start with a 7-day free trial for unlimited animations, or try a single photo for $4.99.",
  keywords: [
    "photo animation pricing",
    "animated photos cost",
    "video memories subscription",
    "photo to video price",
    "family photo animation plans",
  ],
  openGraph: {
    title: "Pricing - PicPip Photo Animation Plans",
    description: "Choose the perfect plan to bring your photos to life. Start free with our 7-day trial!",
    url: "https://picpip.co/pricing",
    type: "website",
  },
  twitter: {
    title: "Pricing - PicPip Photo Animation Plans",
    description: "Choose the perfect plan to bring your photos to life. Start free with our 7-day trial!",
  },
  alternates: {
    canonical: "https://picpip.co/pricing",
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SoftwareApplicationSchema />
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "https://picpip.co" },
          { name: "Pricing", url: "https://picpip.co/pricing" },
        ]}
      />
      {children}
    </>
  );
}

