import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { Geist, Geist_Mono } from "next/font/google";

import { AuthProvider } from "@/components/auth-provider";
import { Toaster } from "@/components/ui/sonner";
import { siteConfig } from "@/config/site";
import { TRPCReactProvider } from "@/trpc/client";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  icons: {
    icon: [{ href: "/logo.svg", url: "/logo.svg" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <TRPCReactProvider>
      <html lang="en" suppressHydrationWarning>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <AuthProvider>
            <ThemeProvider
              enableSystem
              attribute="class"
              defaultTheme="dark"
              disableTransitionOnChange
            >
              <Toaster />
              {children}
            </ThemeProvider>
          </AuthProvider>
        </body>
      </html>
    </TRPCReactProvider>
  );
}
