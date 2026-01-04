import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Account",
  description: "Manage your PicPip account settings, subscription, and preferences.",
  // Authenticated pages should not be indexed
  robots: {
    index: false,
    follow: false,
    noarchive: true,
  },
};

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

