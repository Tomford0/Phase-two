import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import ThemeToggle from '@/components/ThemeToggle';

export const metadata: Metadata = {
  title: 'Emergency Response System',
  description: 'Role-based centralized emergency system',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
          <ThemeToggle />
        </ThemeProvider>
      </body>
    </html>
  );
}
