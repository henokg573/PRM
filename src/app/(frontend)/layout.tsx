import type { Metadata } from 'next'
import { Manrope } from 'next/font/google'
import './styles.css'

const manrope = Manrope({ subsets: ['latin'], variable: '--font-manrope' })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: 'NexusOne — B2B Supply Chain Operations',
  description:
    'A secure producer and retailer connectivity platform for modern wholesale operations.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${manrope.variable} min-h-screen bg-white text-zinc-950 antialiased`}>
        {children}
      </body>
    </html>
  )
}
