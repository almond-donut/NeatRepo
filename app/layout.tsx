import type React from "react"
import type { Metadata } from "next"
import { JetBrains_Mono } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/components/auth-provider"
import { NavigationErrorBoundary } from "@/components/navigation-error-boundary"

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
})

export const metadata: Metadata = {
  title: "NeatRepo - Your Personal Repository Assistant",
  description:
    "Clean up and organize your GitHub repositories before applying for jobs. Reorganize structure, bulk delete, drag & drop, and prep your repos like a pro.",
  generator: 'v0.dev',
  icons: {
    icon: "/icon.png",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${jetbrainsMono.variable} font-mono`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <NavigationErrorBoundary>
            <AuthProvider>
              {children}
            </AuthProvider>
          </NavigationErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  )
}
