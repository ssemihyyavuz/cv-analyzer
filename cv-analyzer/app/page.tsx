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
        <section className="py-20 text-center">
          <div className="container mx-auto px-6">
            <h1 className="text-5xl md:text-6xl font-bold mb-8">
              {language === 'en' ? 'Optimize Your CV for' : 'CV\'nizi Şunlar İçin Optimize Edin:'}
              <br />
              <div className="h-24 flex items-center justify-center">
                <AnimatedText phrases={careerPhrases[language]} className="text-blue-500 block text-5xl md:text-6xl" />
              </div>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto mb-10">
              {language === 'en' 
                ? 'Upload your CV to get instant feedback, ATS compatibility score, and actionable recommendations to stand out to recruiters.'
                : 'CV\'nizi yükleyerek anında geri bildirim, ATS uyumluluk puanı ve işe alım uzmanlarının gözünde öne çıkmanızı sağlayacak uygulanabilir öneriler alın.'}
            </p>
            <button className="inline-flex items-center gap-3 bg-blue-500 text-white px-8 py-3 rounded-md text-lg hover:bg-blue-600 transition-colors">
              {language === 'en' ? 'Get Started' : 'Başlayın'}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
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

        <section className="pb-20">
          <div className="container mx-auto px-6">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center gap-3 justify-center mb-6">
                <div className="text-blue-500 w-8 h-8">
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
                <h2 className="text-2xl md:text-3xl font-semibold">{language === 'en' ? 'Upload Your CV' : 'CV\'nizi Yükleyin'}</h2>
              </div>
              <p className="text-center text-lg text-gray-600 mb-10">
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
