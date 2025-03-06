import type React from "react"
import "./globals.css"
import { LanguageProvider } from "../components/language-context"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { LanguageSelector } from "../components/language-selector"
import Link from "next/link"
import { NavLinks } from "../components/nav-links"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "CV Analyzer",
  description: "Upload your CV and get AI-powered feedback and recommendations",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <LanguageProvider>
          <div className="min-h-screen flex flex-col">
            <header className="border-b border-gray-100 py-4">
              <div className="container mx-auto px-4 flex justify-between items-center">
                <Link href="/" className="flex items-center gap-2">
                  <div className="text-blue-500 w-6 h-6">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                      <line x1="10" y1="9" x2="8" y2="9" />
                    </svg>
                  </div>
                  <span className="font-semibold text-lg">CV Analyzer</span>
                </Link>
                <div className="flex items-center gap-6">
                  <NavLinks />
                  <LanguageSelector />
                </div>
              </div>
            </header>
            <main className="flex-1">
              {children}
            </main>
            <footer className="border-t border-gray-100 py-4">
              <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
                © 2024 CV Analyzer. All rights reserved.
              </div>
            </footer>
          </div>
        </LanguageProvider>
      </body>
    </html>
  )
}

