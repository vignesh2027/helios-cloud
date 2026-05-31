import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Sidebar } from '../components/layout/Sidebar';
import { TopBar } from '../components/layout/TopBar';
import { QueryProvider } from '../components/layout/QueryProvider';

export const metadata: Metadata = {
  title: 'HELIOS — Cloud Infrastructure Platform',
  description: 'Enterprise cloud infrastructure orchestration — resource inventory, cost optimization, drift detection, and policy compliance',
  icons: {
    icon: '/favicon.ico',
  },
  openGraph: {
    title: 'HELIOS Cloud Platform',
    description: 'Enterprise Cloud Infrastructure Orchestration',
    siteName: 'HELIOS',
  },
};

export const viewport: Viewport = {
  themeColor: '#0a0a0a',
  colorScheme: 'dark',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="flex h-screen overflow-hidden bg-[#0a0a0a]">
        <QueryProvider>
          <Sidebar />
          <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
            <TopBar />
            <main className="flex-1 overflow-auto p-6 animate-fade-in">
              {children}
            </main>
          </div>
        </QueryProvider>
      </body>
    </html>
  );
}
