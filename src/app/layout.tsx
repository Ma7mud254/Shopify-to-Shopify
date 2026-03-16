import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "ExportBase — Shopify Store Migration Platform",
    template: "%s | ExportBase",
  },
  description:
    "Migrate products, collections, images, and metafields between Shopify stores in minutes. The fastest way to transfer your entire catalog.",
  keywords: [
    "shopify migration",
    "shopify transfer",
    "store migration",
    "product migration",
    "shopify export import",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`} suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
