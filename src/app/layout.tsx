import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import EditToolbar from "@/components/EditToolbar";
import content from "@/lib/content";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: {
    default: content.seo.title,
    template: `%s | ${content.meta.name}`,
  },
  description: content.seo.description,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="bg-[#0a0a0a] text-neutral-100 font-sans antialiased">
        <Navbar logo={content.nav.logo} links={content.nav.links} />
        <main className="min-h-screen">{children}</main>
        <Footer />
        <EditToolbar />
      </body>
    </html>
  );
}
