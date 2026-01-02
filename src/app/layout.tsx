import type { Metadata, Viewport } from "next";
import { Fredoka, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/components/session-provider";

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

export const metadata: Metadata = {
  title: "PicPip.co - Bring Your Pictures to Life!",
  description: "Transform your cherished photos into magical animated videos. Perfect for preserving family memories.",
  keywords: ["photo animation", "video memories", "family photos", "animated pictures"],
  authors: [{ name: "PicPip" }],
  openGraph: {
    title: "PicPip.co - Bring Your Pictures to Life!",
    description: "Transform your cherished photos into magical animated videos.",
    url: "https://picpip.co",
    siteName: "PicPip",
    type: "website",
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
