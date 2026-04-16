import type { Metadata, Viewport } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import { ToastProvider } from '@/components/ui/Toast';
import { ClientProvider } from '@/components/providers/ClientProvider';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Balancio — Smart Debt Tracker',
  description: 'Track money you lend to friends. Automated calculations, clean reports.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Balancio',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0f0f13',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={geistSans.variable}>
      <body className="min-h-dvh bg-[var(--bg)] text-[var(--text-primary)] antialiased">
        <ToastProvider>
          <ClientProvider>{children}</ClientProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
