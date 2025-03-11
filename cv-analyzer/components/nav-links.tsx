"use client"

import Link from "next/link"
import { useLanguage } from "./language-context"

export function NavLinks() {
  const { language } = useLanguage()
  
  return (
    <nav>
      <ul className="flex gap-6">
        <li className="relative group">
          <button 
            disabled
            className="text-gray-400 cursor-not-allowed"
            aria-label={language === 'en' ? 'How it works' : 'Nasıl Çalışır'}
          >
            {language === 'en' ? 'How it works' : 'Nasıl Çalışır'}
          </button>
          <div className="absolute left-1/2 transform -translate-x-1/2 top-full mt-2 px-3 py-2 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none w-40 text-center z-10">
            {language === 'en' ? '🚀 Coming soon!' : '🚀 Çok yakında!'}
          </div>
        </li>
        <li className="relative group">
          <button 
            disabled
            className="text-gray-400 cursor-not-allowed"
            aria-label={language === 'en' ? 'Features' : 'Özellikler'}
          >
            {language === 'en' ? 'Features' : 'Özellikler'}
          </button>
          <div className="absolute left-1/2 transform -translate-x-1/2 top-full mt-2 px-3 py-2 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none w-40 text-center z-10">
            {language === 'en' ? '🔧 Under construction' : '🔧 Yapım aşamasında'}
          </div>
        </li>
        <li className="relative group">
          <button 
            disabled
            className="text-gray-400 cursor-not-allowed"
            aria-label={language === 'en' ? 'Resources' : 'Kaynaklar'}
          >
            {language === 'en' ? 'Resources' : 'Kaynaklar'}
          </button>
          <div className="absolute left-1/2 transform -translate-x-1/2 top-full mt-2 px-3 py-2 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none w-40 text-center z-10">
            {language === 'en' ? '📚 Content being prepared' : '📚 İçerik hazırlanıyor'}
          </div>
        </li>
      </ul>
    </nav>
  )
} 