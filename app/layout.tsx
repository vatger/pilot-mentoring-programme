import './globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { ThemeProvider } from '@/components/ThemeProvider'
import React from 'react'

export const metadata = {
  title: 'Piloten-Mentoren-Programm (PMP) - VATSIM Germany',
  description: 'Persönliche 1:1-Betreuung für neue Piloten im VATSIM Netzwerk, um den Einstieg zu erleichtern.',
  keywords: 'VATSIM, Piloten, Mentoring, Flugsimulation, Germany, PMP',
  authors: [{ name: 'VATSIM Germany' }],
  openGraph: {
    title: 'Piloten-Mentoren-Programm (PMP) - VATSIM Germany',
    description: 'Persönliche 1:1-Betreuung für neue Piloten im VATSIM Netzwerk',
    url: 'https://pmp.vatsim-germany.org',
    siteName: 'PMP - VATSIM Germany',
    locale: 'de_DE',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body className="font-sans">
        <ThemeProvider>
          <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
            <Navbar />
            <main>{children}</main>
            <Footer />
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
