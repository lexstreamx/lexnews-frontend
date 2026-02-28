import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Legal News Aggregator",
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
        {children}
      </body>
    </html>
  );
}
