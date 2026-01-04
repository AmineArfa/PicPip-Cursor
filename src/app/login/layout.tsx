import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your PicPip account to access your animated memories and create new magical moments.",
  // Auth pages should not be indexed
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    nosnippet: true,
  },
  openGraph: {
    title: "Sign In - PicPip",
    description: "Sign in to access your animated memories.",
    url: "https://picpip.co/login",
    type: "website",
  },
  twitter: {
    title: "Sign In - PicPip",
    description: "Sign in to access your animated memories.",
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

