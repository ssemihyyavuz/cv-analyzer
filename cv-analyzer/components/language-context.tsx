"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type Language = 'en' | 'tr'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  translations: {
    [key: string]: {
      en: string
      tr: string
    }
  }
}

const defaultTranslations = {
  uploadTitle: {
    en: 'Upload Your CV',
    tr: 'CV\'nizi Yükleyin'
  },
  uploadSubtitle: {
    en: 'Get professional feedback and recommendations',
    tr: 'Profesyonel geri bildirim ve öneriler alın'
  },
  dragDrop: {
    en: 'Drag & drop your CV file here',
    tr: 'CV dosyanızı buraya sürükleyip bırakın'
  },
  or: {
    en: 'or',
    tr: 'veya'
  },
  browseFiles: {
    en: 'Browse files',
    tr: 'Dosyalara gözatın'
  },
  uploadProgress: {
    en: 'Uploading...',
    tr: 'Yükleniyor...'
  },
  uploadSuccess: {
    en: 'Upload successful!',
    tr: 'Yükleme başarılı!'
  },
  invalidFileType: {
    en: 'Invalid file type. Please upload a PDF, DOCX, or TXT file.',
    tr: 'Geçersiz dosya türü. Lütfen PDF, DOCX veya TXT dosyası yükleyin.'
  },
  fileTooLarge: {
    en: 'File is too large. Maximum size is 5MB.',
    tr: 'Dosya çok büyük. Maksimum boyut 5MB.'
  },
  uploadError: {
    en: 'Error uploading file. Please try again.',
    tr: 'Dosya yüklenirken hata oluştu. Lütfen tekrar deneyin.'
  },
  connectionError: {
    en: 'Connection error. Please check your internet connection and try again.',
    tr: 'Bağlantı hatası. Lütfen internet bağlantınızı kontrol edin ve tekrar deneyin.'
  },
  analyze: {
    en: 'Analyze CV',
    tr: 'CV\'yi Analiz Et'
  },
  analyzing: {
    en: 'Analyzing...',
    tr: 'Analiz ediliyor...'
  },
  selectLanguage: {
    en: 'Select analysis language:',
    tr: 'Analiz dilini seçin:'
  },
  analyzeInEnglish: {
    en: 'Analyze in English',
    tr: 'İngilizce olarak analiz et'
  },
  analyzeInTurkish: {
    en: 'Analyze in Turkish',
    tr: 'Türkçe olarak analiz et'
  },
  // Navigation
  home: {
    en: 'Home',
    tr: 'Ana Sayfa'
  },
  results: {
    en: 'Results',
    tr: 'Sonuçlar'
  },
  about: {
    en: 'About',
    tr: 'Hakkında'
  },
  contact: {
    en: 'Contact',
    tr: 'İletişim'
  },
  // Hero section
  heroTitle: {
    en: 'Optimize Your CV with AI',
    tr: 'CV\'nizi Yapay Zeka ile Optimize Edin'
  },
  heroSubtitle: {
    en: 'Upload your CV and get instant AI-powered feedback to make your CV stand out',
    tr: 'CV\'nizi yükleyin ve CV\'nizin öne çıkmasını sağlayacak anında yapay zeka destekli geri bildirim alın'
  },
  getStarted: {
    en: 'Get Started',
    tr: 'Başlayın'
  },
  learnMore: {
    en: 'Learn More',
    tr: 'Daha Fazla Bilgi'
  },
  // Features section
  featuresTitle: {
    en: 'Key Features',
    tr: 'Temel Özellikler'
  },
  featureAtsTitle: {
    en: 'ATS Compatibility Check',
    tr: 'ATS Uyumluluk Kontrolü'
  },
  featureAtsDesc: {
    en: 'Ensure your CV passes through Applicant Tracking Systems',
    tr: 'CV\'nizin Başvuru Takip Sistemleri\'nden geçtiğinden emin olun'
  },
  featureKeywordsTitle: {
    en: 'Keyword Optimization',
    tr: 'Anahtar Kelime Optimizasyonu'
  },
  featureKeywordsDesc: {
    en: 'Get suggestions for relevant keywords for your industry',
    tr: 'Sektörünüz için ilgili anahtar kelime önerileri alın'
  },
  featureRecommendationsTitle: {
    en: 'Personalized Recommendations',
    tr: 'Kişiselleştirilmiş Öneriler'
  },
  featureRecommendationsDesc: {
    en: 'Receive tailored advice to improve your CV',
    tr: 'CV\'nizi iyileştirmek için özel tavsiyeler alın'
  },
  // Footer
  footerRights: {
    en: 'All rights reserved',
    tr: 'Tüm hakları saklıdır'
  },
  footerPrivacy: {
    en: 'Privacy Policy',
    tr: 'Gizlilik Politikası'
  },
  footerTerms: {
    en: 'Terms of Service',
    tr: 'Hizmet Şartları'
  }
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  translations: defaultTranslations
})

export const useLanguage = () => useContext(LanguageContext)

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>('en')
  const [mounted, setMounted] = useState(false)

  // Only run on client side
  useEffect(() => {
    setMounted(true)
    const savedLanguage = localStorage.getItem('language') as Language
    if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'tr')) {
      setLanguage(savedLanguage)
    }
  }, [])

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('language', language)
    }
  }, [language, mounted])

  return (
    <LanguageContext.Provider value={{ language, setLanguage, translations: defaultTranslations }}>
      {children}
    </LanguageContext.Provider>
  )
} 