import './globals.css'
import Providers from './providers'
import SiteShell from './components/site-shell'

export const metadata = {
  title: 'Baatasari — Discover · Connect · Experience',
  description: 'Book the best events, dining, and activities near you.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <SiteShell>{children}</SiteShell>
        </Providers>
      </body>
    </html>
  )
}