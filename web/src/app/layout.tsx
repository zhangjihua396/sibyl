import type { Metadata, Viewport } from 'next';
import { Fira_Code, Space_Grotesk } from 'next/font/google';
import type { ReactNode } from 'react';
import { Toaster } from 'sonner';

import { Providers } from '@/components/providers';

import './globals.css';

const spaceGrotesk = Space_Grotesk({
  variable: '--font-space-grotesk',
  subsets: ['latin'],
  display: 'swap',
});

const firaCode = Fira_Code({
  variable: '--font-fira-code',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Sibyl - Knowledge Oracle',
  description: 'Knowledge graph visualization and management for development wisdom',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0a0812',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${spaceGrotesk.variable} ${firaCode.variable} antialiased bg-sc-bg-dark`}>
        <Providers>
          {children}
          <Toaster
            theme="dark"
            position="bottom-right"
            toastOptions={{
              style: {
                background: 'var(--sc-bg-elevated)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'var(--sc-fg-primary)',
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
