"use client"

import Link from "next/link"
import { useLanguage } from "./language-context"

export function NavLinks() {
  const { language } = useLanguage()
  
  return (
    <nav>
      <ul className="flex gap-6">
        <li>
          <Link href="/how-it-works" className="text-gray-600 hover:text-gray-900">
            {language === 'en' ? 'How it works' : 'Nasıl Çalışır'}
          </Link>
        </li>
        <li>
          <Link href="/features" className="text-gray-600 hover:text-gray-900">
            {language === 'en' ? 'Features' : 'Özellikler'}
          </Link>
        </li>
        <li>
          <Link href="/resources" className="text-gray-600 hover:text-gray-900">
            {language === 'en' ? 'Resources' : 'Kaynaklar'}
          </Link>
        </li>
      </ul>
    </nav>
  )
} 