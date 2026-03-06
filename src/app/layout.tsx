import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";

export const metadata: Metadata = {
  title: "Lexlens | New Legal Intelligence",
  description: "Get centralized sources of information, from legal news, blogposts, judgments & regulatory updates. All in one place.",
  metadataBase: new URL("https://lexlens.lexstream.io"),
  icons: {
    icon: "/WebIcon.png",
    apple: "/WebIcon.png",
  },
  openGraph: {
    title: "Lexlens | New Legal Intelligence",
    description: "Get centralized sources of information, from legal news, blogposts, judgments & regulatory updates. All in one place.",
    url: "https://lexlens.lexstream.io",
    siteName: "LexLens",
    images: [
      {
        url: "/logo_chocolate.png",
        alt: "Lexlens | New Legal Intelligence",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Lexlens | New Legal Intelligence",
    description: "Get centralized sources of information, from legal news, blogposts, judgments & regulatory updates. All in one place.",
    images: ["/logo_chocolate.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-body antialiased bg-brand-bg text-brand-body min-h-screen">
        <AuthProvider>{children}</AuthProvider>
        {process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY && (
          <Script
            src={`https://www.google.com/recaptcha/api.js?render=${process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}`}
            strategy="afterInteractive"
          />
        )}
      </body>
    </html>
  );
}
