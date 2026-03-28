import { Inter } from 'next/font/google'
import './globals.css'
import BottomNav from '@/components/BottomNav'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'DukaaanOS — Apki Dukaan, Digital',
  description: 'Smart billing and inventory for kirana stores',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="hi" className="h-full">
      <body className={`${inter.className} min-h-full bg-[#fffbf5]`}>
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              borderRadius: '12px',
              background: '#1c0a00',
              color: '#fff',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#f97316', secondary: '#fff' } },
          }}
        />
        {children}
        <BottomNav />
      </body>
    </html>
  )
}
