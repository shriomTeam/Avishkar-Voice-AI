import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: { default: 'Avishkar Voice', template: '%s | Avishkar Voice' },
  description: 'Your voice agents, conversations and workspace in one place.',
  icons: { icon: '/avishkar-logo.png' },
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
