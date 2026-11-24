import { RootProvider } from 'fumadocs-ui/provider/next';
import type { Metadata, Viewport } from 'next';

import './global.css';

/*
 * Outfit and Geist Mono, loaded by the browser from Google Fonts rather than
 * downloaded at build time, so a build never depends on reaching the font CDN.
 */
const FONTS =
  'https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500;600&family=Outfit:wght@400;500;600;700&display=swap';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://dryrun-genlayer.vercel.app'),
  title: { default: 'dryrun: a test suite for the rules your community writes in plain English', template: '%s · dryrun' },
  description:
    'Register a written rule set, add scenarios with the answer you expect, and let GenLayer validators decide for each one whether the rules allow it, block it, or say nothing. Cases are PASS, FAIL, UNCLEAR or STALE, and the suite is GREEN, AMBER or RED.',
  openGraph: { siteName: 'dryrun', type: 'website' },
};

export const viewport: Viewport = { themeColor: '#030704', colorScheme: 'dark' };

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href={FONTS} />
      </head>
      <body className="flex min-h-screen flex-col">
        <RootProvider theme={{ forcedTheme: 'dark', defaultTheme: 'dark', enableSystem: false }}>{children}</RootProvider>
      </body>
    </html>
  );
}
