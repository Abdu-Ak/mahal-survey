import type { Metadata, Viewport } from 'next';
import '@fontsource/noto-sans-malayalam/400.css';
import '@fontsource/noto-sans-malayalam/500.css';
import '@fontsource/noto-sans-malayalam/700.css';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'മഹല്ല് രജിസ്ട്രേഷൻ', template: '%s | മഹല്ല് രജിസ്ട്രേഷൻ' },
  description: 'കൂടത്തായി വലിയ ജുമാമസ്ജിദ് മഹല്ല് കുടുംബ രജിസ്ട്രേഷൻ',
  robots: { index: false, follow: false, nocache: true },
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#155e4b' };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ml">
      <body>{children}</body>
    </html>
  );
}
