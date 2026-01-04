/**
 * Structured Data (JSON-LD) Components for SEO
 * These provide rich snippets in search engine results
 */

const SITE_URL = "https://picpip.co";
const SITE_NAME = "PicPip";

/**
 * Organization Schema - Provides information about the business
 * Used site-wide in the root layout
 */
export function OrganizationSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/picpip_logo.png`,
    description: "Transform your cherished photos into magical animated videos with AI.",
    foundingDate: "2024",
    sameAs: [
      // Add social media links when available
      // "https://twitter.com/picpip",
      // "https://facebook.com/picpip",
      // "https://instagram.com/picpip",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      url: `${SITE_URL}/help`,
      availableLanguage: "English",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * WebSite Schema - Provides site-level information
 * Includes potential search action for sitelinks searchbox
 */
export function WebSiteSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description: "Transform your cherished photos into magical animated videos with AI. Perfect for preserving family memories.",
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * Product Schema - For the pricing page
 * Shows pricing information in search results
 */
export function ProductSchema({ 
  name, 
  description, 
  price, 
  priceCurrency = "USD",
  image,
}: {
  name: string;
  description: string;
  price: number;
  priceCurrency?: string;
  image?: string;
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description,
    image: image || `${SITE_URL}/picpip_logo.png`,
    brand: {
      "@type": "Brand",
      name: SITE_NAME,
    },
    offers: {
      "@type": "Offer",
      price,
      priceCurrency,
      availability: "https://schema.org/InStock",
      url: `${SITE_URL}/pricing`,
      seller: {
        "@type": "Organization",
        name: SITE_NAME,
      },
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * SoftwareApplication Schema - Alternative to Product for web apps
 * Better suited for SaaS/web applications
 */
export function SoftwareApplicationSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "PicPip - Photo Animation",
    applicationCategory: "MultimediaApplication",
    operatingSystem: "Web Browser",
    description: "Transform your cherished photos into magical animated videos with AI.",
    url: SITE_URL,
    offers: [
      {
        "@type": "Offer",
        name: "Single Snap",
        price: 4.99,
        priceCurrency: "USD",
        description: "1 photo animation with HD download",
      },
      {
        "@type": "Offer",
        name: "Bundle Pack",
        price: 19.99,
        priceCurrency: "USD",
        description: "10 photo animations with HD downloads",
      },
      {
        "@type": "Offer",
        name: "Unlimited Magic",
        price: 9.99,
        priceCurrency: "USD",
        priceSpecification: {
          "@type": "UnitPriceSpecification",
          price: 9.99,
          priceCurrency: "USD",
          billingDuration: "P1M",
          billingIncrement: 1,
        },
        description: "Unlimited photo animations with 7-day free trial",
      },
    ],
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      ratingCount: "150",
      bestRating: "5",
      worstRating: "1",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * FAQ Schema - For help/support pages
 * Shows FAQ rich results in search
 */
export function FAQSchema({ 
  faqs 
}: { 
  faqs: Array<{ question: string; answer: string }> 
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * BreadcrumbList Schema - For navigation hierarchy
 * Shows breadcrumbs in search results
 */
export function BreadcrumbSchema({ 
  items 
}: { 
  items: Array<{ name: string; url: string }> 
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

