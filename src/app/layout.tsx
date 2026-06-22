import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import EditToolbar from "@/components/EditToolbar";
import ThemeApplier from "@/components/ThemeApplier";
import { getContent } from "@/lib/content";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://bpoechsner.vercel.app";

export async function generateMetadata(): Promise<Metadata> {
  const content = await getContent();
  return {
    title: {
      default: content.seo.title,
      template: `%s | ${content.meta.name}`,
    },
    description: content.seo.description,
    openGraph: {
      type: "website",
      url: siteUrl,
      title: content.seo.title,
      description: content.seo.description,
      siteName: content.meta.name,
    },
    twitter: {
      card: "summary_large_image",
      title: content.seo.title,
      description: content.seo.description,
    },
    metadataBase: new URL(siteUrl),
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const content = await getContent();
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <body className="bg-[#0a0a0a] text-neutral-100 font-sans antialiased">
        <ThemeApplier accent={content.theme.accent} projectColumns={content.theme.projectColumns} />
        <Navbar logo={content.nav.logo} links={content.nav.links} />
        <main className="min-h-screen">{children}</main>
        <Footer />
        <EditToolbar />
        <Analytics />
      </body>
    </html>
  );
}
