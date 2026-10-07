import type { Metadata, Viewport } from 'next';
import { Atkinson_Hyperlegible_Next, Bricolage_Grotesque } from 'next/font/google';
import './globals.css';

const display = Bricolage_Grotesque({ subsets: ['latin'], variable: '--font-bricolage', display: 'swap' });
const body = Atkinson_Hyperlegible_Next({ subsets: ['latin'], variable: '--font-atkinson', display: 'swap' });

export const metadata: Metadata = {
  title: 'Attention Seekers',
  description: 'Find out how a word decides which other words to listen to.',
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#1b2b4b' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body className="min-h-dvh bg-page font-sans text-ink antialiased">{children}</body>
    </html>
  );
}
