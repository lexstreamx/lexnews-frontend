import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";

export const metadata: Metadata = {
  title: "LexLens — Legal Intelligence Platform",
  description: "AI-categorized legal news, blogposts, judgments & regulatory updates",
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
