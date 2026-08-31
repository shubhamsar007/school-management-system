import type { Metadata } from 'next';
import { Karla, Fraunces } from 'next/font/google';
import { Toaster } from 'sonner';
import './globals.css';

const karla = Karla({
  subsets: ['latin'],
  variable: '--font-karla',
  weight: ['400', '500', '600', '700'],
});

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  weight: ['400', '500', '600'],
  style: ['normal'],
});

export const metadata: Metadata = {
  title: {
    default: 'School Management System',
    template: '%s | SMS',
  },
  description: 'Comprehensive School ERP',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${karla.variable} ${fraunces.variable}`} style={{ fontFamily: 'var(--font-karla)' }}>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
