import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";

export const metadata: Metadata = {
  title: "LexLens — A New Kind of Legal Intelligence",
  description: "Get centralized sources of information, from legal news, blogposts, judgments & regulatory updates. All in one place.",
  metadataBase: new URL("https://lexlens.lexstream.io"),
  openGraph: {
    title: "LexLens — A New Kind of Legal Intelligence",
    description: "Get centralized sources of information, from legal news, blogposts, judgments & regulatory updates. All in one place.",
    url: "https://lexlens.lexstream.io",
    siteName: "LexLens",
    images: [
      {
        url: "/logo_chocolate.png",
        alt: "LexLens — A New Kind of Legal Intelligence",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "LexLens — A New Kind of Legal Intelligence",
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
      </body>
    </html>
  );
}
