import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Element Laboratory — Interactive 3D Periodic Table',
  description:
    'Cinematic sci-fi visualization of all 118 chemical elements in immersive 3D space. Explore multiple formations: sphere, helix, galaxy, DNA, and more.',
  keywords: ['periodic table', '3D', 'chemistry', 'elements', 'interactive', 'visualization'],
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#000000',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="font-body overflow-hidden">
        {children}
      </body>
    </html>
  )
}
