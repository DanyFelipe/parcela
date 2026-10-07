import type { Metadata } from 'next';
import { Figtree } from 'next/font/google';
import { Analytics } from '@vercel/analytics/react';
import './globals.css';
import { TopBar } from '@/components/showroom/TopBar';
import { cn } from '@/lib/utils';

const figtree = Figtree({ subsets: ['latin'], variable: '--font-figtree', display: 'swap' });

export const metadata: Metadata = {
  metadataBase: process.env.NEXT_PUBLIC_SITE_URL
    ? new URL(process.env.NEXT_PUBLIC_SITE_URL)
    : undefined,
  title: 'Showroom inmobiliario',
  description: 'Explora lotes y terrenos en nuestro showroom inmobiliario inmersivo.',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="es" className={cn('h-full', 'antialiased', figtree.variable)}>
      <body className="flex min-h-full flex-col">
        <TopBar />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
