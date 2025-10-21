import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { SessionProvider } from '@/components/providers/SessionProvider'
import { Navbar } from '@/components/navbar'
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Instructoria - Aprende con IA',
  description: 'Plataforma educativa con instructores IA especializados',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={`${inter.className} flex flex-col h-screen overflow-hidden`}>
        <SessionProvider>
          <Navbar />
          <main className="flex-1 overflow-hidden">
            {children}
          </main>
          <Toaster richColors closeButton position="top-right" />
        </SessionProvider>
      </body>
    </html>
  )
}
