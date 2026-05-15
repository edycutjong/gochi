import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Press_Start_2P } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
});

const pressStart2p = Press_Start_2P({
  variable: "--font-press-start",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Gochi | 0G AI Pet",
  description: "On-chain AI virtual pet on 0G Network",
  icons: {
    icon: "/icon.png",
  },
  openGraph: {
    title: "Gochi | 0G AI Pet",
    description: "On-chain AI virtual pet on 0G Network",
    url: "https://gochi.vercel.app",
    siteName: "Gochi",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Gochi",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Gochi | 0G AI Pet",
    description: "On-chain AI virtual pet on 0G Network",
    images: ["/og-image.png"],
  },
};

import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} ${pressStart2p.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-[var(--gochi-bg)] text-[var(--gochi-text)]">
        <Providers>
          <header className="flex-none h-16 border-b border-[var(--gochi-border)] bg-[var(--gochi-panel)] px-6 flex items-center justify-between sticky top-0 z-50">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[var(--gochi-green)] shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                <h1 className="font-display text-[var(--gochi-cyan)] text-xl tracking-tighter">GOCHI</h1>
              </div>
              <div className="hidden sm:block px-2 py-0.5 rounded border border-[var(--gochi-cyan)]/30 bg-[var(--gochi-cyan)]/10 text-[var(--gochi-cyan)] font-mono text-[10px] shadow-[0_0_10px_rgba(6,182,212,0.1)]">
                0G MAINNET
              </div>
            </div>
            <div>
              <ConnectButton 
                showBalance={false} 
                chainStatus="icon" 
                accountStatus={{
                  smallScreen: 'avatar',
                  largeScreen: 'full',
                }}
              />
            </div>
          </header>
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
