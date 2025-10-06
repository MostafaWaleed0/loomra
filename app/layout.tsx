import type { Metadata } from 'next';
import { ThemeProvider } from 'next-themes';
// import { Fira_Code, Roboto } from 'next/font/google';
import './globals.css';
import { cn } from './lib/utils';

// const roboto = Roboto({
//   variable: '--font-roboto',
//   subsets: ['latin'],
//   display: 'swap'
// });

// const firaCode = Fira_Code({
//   variable: '--font-fira-code',
//   subsets: ['latin'],
//   display: 'swap'
// });

export const metadata: Metadata = {
  title: 'Loomra',
  description: 'Reach It style goal, task, and habit tracker built with Next.js'
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
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
