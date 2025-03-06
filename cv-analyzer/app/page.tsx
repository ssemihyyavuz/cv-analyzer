"use client"

import Link from "next/link"
import { FileUploader } from "@/components/file-uploader"
import { AnimatedText } from "@/components/animated-text"
import { useLanguage } from "../components/language-context"

export default function Home() {
  const { language, translations } = useLanguage()
  
  // List of phrases to animate through - in both languages
  const careerPhrases = {
    en: [
      "Job Success",
      "Career Growth",
      "More Interviews", 
      "Higher Callbacks",
      "Better Opportunities",
      "Landing Dream Jobs",
      "Standing Out",
      "ATS Optimization"
    ],
    tr: [
      "İş Başarısı",
      "Kariyer Gelişimi",
      "Daha Fazla Mülakat",
      "Daha Fazla Geri Dönüş",
      "Daha İyi Fırsatlar",
      "Hayalinizdeki İşleri Elde Etme",
      "Öne Çıkma",
      "ATS Optimizasyonu"
    ]
  }

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">
        <section className="py-16 text-center">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              {language === 'en' ? 'Optimize Your CV for' : 'CV\'nizi Şunlar İçin Optimize Edin:'} <AnimatedText phrases={careerPhrases[language]} className="text-blue-500" />
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto mb-8">
              {language === 'en' 
                ? 'Upload your CV to get instant feedback, ATS compatibility score, and actionable recommendations to stand out to recruiters.'
                : 'CV\'nizi yükleyerek anında geri bildirim, ATS uyumluluk puanı ve işe alım uzmanlarının gözünde öne çıkmanızı sağlayacak uygulanabilir öneriler alın.'}
            </p>
            <button className="inline-flex items-center gap-2 bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 transition-colors">
              {language === 'en' ? 'Get Started' : 'Başlayın'}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
          </div>
        </section>

        <section className="pb-16">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto">
              <div className="flex items-center gap-2 justify-center mb-4">
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
                <h2 className="text-xl font-semibold">{language === 'en' ? 'Upload Your CV' : 'CV\'nizi Yükleyin'}</h2>
              </div>
              <p className="text-center text-gray-600 mb-8">
                {language === 'en' 
                  ? 'We support PDF, DOCX, and TXT formats. Your document is analyzed securely.'
                  : 'PDF, DOCX ve TXT formatlarını destekliyoruz. Belgeniz güvenli bir şekilde analiz edilir.'}
              </p>

              <FileUploader />
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

