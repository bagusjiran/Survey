import type { Metadata, Viewport } from 'next'
import './globals.css'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // Removed maximumScale and userScalable — allows zoom for accessibility (WCAG 1.4.4)
}

export const metadata: Metadata = {
  title: 'Survey UKM Kerohanian Islam',
  description: 'Sistem Survey Mahasiswa Teraktif - UKM Kerohanian Islam UTR Cepu',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-[Inter] antialiased bg-gradient-to-br from-slate-50 via-emerald-50/30 to-teal-50/20 min-h-screen text-slate-800">
        {children}
      </body>
    </html>
  )
}
