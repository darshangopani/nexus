import type { Metadata, Viewport } from 'next';
import { Space_Grotesk, JetBrains_Mono } from 'next/font/google';
import { Toaster } from 'sonner';
import './globals.css';

const grotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-grotesk' });
const jetbrains = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains' });

export const metadata: Metadata = {
  title: 'EVENT HORIZON AI | Ask. Upload. Learn.',
  description:
    'An AI study companion that explains theory, reads your PDFs, and finds the best YouTube lectures for any topic.',
};

export const viewport: Viewport = {
  themeColor: '#040508',
  colorScheme: 'dark light',
};

const themeScript = `try{var t=localStorage.getItem('eh-theme');document.documentElement.classList.toggle('dark',t!=='light')}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark bg-background ${grotesk.variable} ${jetbrains.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="bg-background text-foreground font-sans antialiased">
        {children}
        <Toaster theme="dark" position="top-center" richColors />
      </body>
    </html>
  );
}
