import type { Metadata } from 'next';
import { Fira_Code, Space_Grotesk } from 'next/font/google';
import type { ReactNode } from 'react';

import { AsyncBoundary } from '@/components/error-boundary';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
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

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${spaceGrotesk.variable} ${firaCode.variable} antialiased`}>
        <Providers>
          <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
              <Header />
              <main className="flex-1 overflow-auto bg-sc-bg-dark p-6">
                <AsyncBoundary level="page">{children}</AsyncBoundary>
              </main>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
