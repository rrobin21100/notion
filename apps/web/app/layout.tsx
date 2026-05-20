import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'MyLife — Your Personal Dashboard',
  description: 'Track your health, habits, finances, and everything that matters.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full" suppressHydrationWarning>{children}</body>
    </html>
  )
}
