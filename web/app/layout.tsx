import type { Metadata, Viewport } from 'next';
import { Atkinson_Hyperlegible_Next, Bricolage_Grotesque, STIX_Two_Text } from 'next/font/google';
import './globals.css';

const display = Bricolage_Grotesque({ subsets: ['latin'], variable: '--font-bricolage', display: 'swap' });
const body = Atkinson_Hyperlegible_Next({ subsets: ['latin'], variable: '--font-atkinson', display: 'swap' });
/** Math notation only (the compute step): a serif with true italics, like a textbook. */
const math = STIX_Two_Text({ subsets: ['latin'], style: ['normal', 'italic'], variable: '--font-stix', display: 'swap' });

export const metadata: Metadata = {
  title: 'Attention Seekers',
  description: 'Find out how a word decides which other words to listen to.',
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#1b2b4b' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${math.variable}`}>
      <body className="min-h-dvh bg-page font-sans text-ink antialiased">{children}</body>
    </html>
  );
}
