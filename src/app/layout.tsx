import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/contexts/AuthContext';
import { InvitationProvider } from '@/lib/contexts/InvitationContext';
import { ThemeProvider } from '@/lib/contexts/ThemeContext';
import NavMenu from "@/components/NavMenu";

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'CareVoice - Person Centered Care Documentation',
  description: 'Streamline your care documentation with AI-powered personalization',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body className={`${inter.className} h-full transition-colors duration-200 dark:bg-gray-900 dark:text-gray-100`}>
        <AuthProvider>
          <InvitationProvider>
            <ThemeProvider>
              <NavMenu />
              <div className="pt-16"> {/* Add padding top to account for fixed navbar */}
                {children}
              </div>
            </ThemeProvider>
          </InvitationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
