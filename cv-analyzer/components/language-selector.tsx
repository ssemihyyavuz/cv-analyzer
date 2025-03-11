"use client"

import { useLanguage } from './language-context'

export function LanguageSelector() {
  const { language, setLanguage } = useLanguage()

  return (
    <div className="flex items-center space-x-2 select-none">
      <button
        onClick={() => setLanguage('en')}
        className={`px-2 py-1 text-sm rounded ${
          language === 'en' 
            ? 'bg-blue-500 text-white font-semibold' 
            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
        }`}
      >
        EN
      </button>
      <button
        onClick={() => setLanguage('tr')}
        className={`px-2 py-1 text-sm rounded ${
          language === 'tr' 
            ? 'bg-blue-500 text-white font-semibold' 
            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
        }`}
      >
        TR
      </button>
    </div>
  )
} 