import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Memories",
  description: "View and manage all your animated photo memories in one place.",
  // Authenticated pages should not be indexed
  robots: {
    index: false,
    follow: false,
    noarchive: true,
  },
};

export default function MemoriesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

