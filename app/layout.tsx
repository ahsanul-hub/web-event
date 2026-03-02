import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pendaftaran Simposium PDS PATKLIN Regional Borneo',
  description: 'Web pendaftaran Simposium Ilmiah dan Pelantikan Pengurus PDS PATKLIN Regional Borneo Masa Bakti 2025-2028'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
