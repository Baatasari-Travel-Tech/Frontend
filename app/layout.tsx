import './globals.css'
import Providers from './providers'
import SiteShell from '../components/site-shell'
import { Sora, Bricolage_Grotesque, Albert_Sans, Poppins, Inter } from 'next/font/google'
import { Analytics } from "@vercel/analytics/next"

const sora = Sora({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sora',
})

// Brand typefaces. These were referenced everywhere (`font-bricolage`,
// `font-albert`, `font-poppins`, `font-inter` and the var()s in globals.css)
// but never actually loaded, so the whole site silently fell back to
// system-ui. Loading them here and exposing the CSS variables on <html>
// fixes the brand typography in one place.
const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-bricolage',
  display: 'swap',
})

const albert = Albert_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-albert',
  display: 'swap',
})

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata = {
  metadataBase: new URL('https://baatasari.com'),
  title: 'Baatasari - Discover, Connect, Experience',
  description: 'Book the best events, dining, and activities near you.',
  icons: {
    icon: '/logo.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${sora.variable} ${bricolage.variable} ${albert.variable} ${poppins.variable} ${inter.variable}`}
    >
      <body className="font-sans antialiased" suppressHydrationWarning>
        <Providers>
          <SiteShell>{children}</SiteShell>
          <Analytics />
        </Providers>
      </body>
    </html>
  )
}

