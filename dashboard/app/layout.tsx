import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'NVDA Daily Strategist',
  description: 'Pre-market attention and thesis risk monitor for long-term NVDA holders',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
