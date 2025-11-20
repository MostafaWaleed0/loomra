import { Toaster } from '@/components/ui/sonner';
import { SettingsProvider } from '@/lib/context/settings-context';
import type { Metadata } from 'next';
import { ThemeProvider } from 'next-themes';
import './globals.css';
import { cn } from './lib/utils';

export const metadata: Metadata = {
  title: 'Loomra'
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn('antialiased')}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <SettingsProvider>{children}</SettingsProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
