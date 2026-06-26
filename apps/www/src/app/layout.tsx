import '@/app/globals.css'

import { Bricolage_Grotesque } from 'next/font/google'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { AoiQueryClientProvider } from '@/providers/query'
import { UserProvider } from '@/providers/user'
import { resolveAuthenticatedUser } from '@/utils/user'

const fontSans = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-sans',
})

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const user = await resolveAuthenticatedUser()

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn('font-sans antialiased bg-aoi-950', fontSans.variable)}
    >
      <body>
        <AoiQueryClientProvider>
          <ThemeProvider forcedTheme="dark">
            <TooltipProvider>
              <UserProvider user={user}>{children}</UserProvider>
            </TooltipProvider>
          </ThemeProvider>
        </AoiQueryClientProvider>
        <Toaster />
      </body>
    </html>
  )
}
