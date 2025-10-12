import type React from "react"
import type { Metadata } from "next"
import { Inria_Serif, Inria_Sans } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import "./globals.css"

const inriaSans = Inria_Sans({
  weight: ["300", "400", "700"],
  subsets: ["latin"],
  variable: "--font-inria-sans",
})

const inriaSerif = Inria_Serif({
  weight: ["300", "400", "700"],
  subsets: ["latin"],
  variable: "--font-inria-serif",
})

// Using Inria Sans as fallback for Instrumental Sans
const instrumentalSans = Inria_Sans({
  weight: ["400"],
  subsets: ["latin"],
  variable: "--font-instrumental-sans",
})

export const metadata: Metadata = {
  title: "MoneyMentor - AI-Powered Personal Finance & Fraud Detection",
  description: "AI-Powered Personal Finance & Fraud Detection Web App",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body
        className={`font-sans ${inriaSans.variable} ${inriaSerif.variable} ${instrumentalSans.variable} antialiased`}
      >
        <Suspense fallback={<div>Loading...</div>}>
          {children}
          <Analytics />
        </Suspense>
      </body>
    </html>
  )
}
