import { Geist, Geist_Mono, Raleway } from "next/font/google";
import "./globals.css";
import ToastProvider from "../components/ToastProvider";
import HeadCodeInjector from "../components/HeadCodeInjector";
import AuthProvider from "../components/AuthProvider";
import { getThemeSettings } from "@/lib/getSettings";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const raleway = Raleway({
  variable: "--font-raleway",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  style: ["normal", "italic"],
});

export async function generateMetadata() {
  const settings = await getThemeSettings();
  
  return {
    title: settings?.metaTitle || "",
    description: settings?.metaDescription || "",
    keywords: settings?.metaKeywords || "",
    icons: {
      icon: settings?.metaFavicon || "/favicon.ico",
    }
  };
}

export default async function RootLayout({ children }) {
  const settings = await getThemeSettings();
  const headCode = settings?.headCode?.trim();

  return (
    <html lang="en">
      <head />
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} ${raleway.variable} antialiased`}
      >
        <HeadCodeInjector code={headCode || ""} />
        <ToastProvider />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
