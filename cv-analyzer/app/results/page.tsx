"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useLanguage } from "../../components/language-context"

const resultsTranslations = {
  noResults: {
    en: "No analysis results found. Please upload a CV first.",
    tr: "Analiz sonuçları bulunamadı. Lütfen önce bir CV yükleyin."
  },
  loading: {
    en: "Loading analysis results...",
    tr: "Analiz sonuçları yükleniyor..."
  },
  dataError: {
    en: "There was a problem loading your analysis data. Please try uploading your CV again.",
    tr: "Analiz verilerinizi yüklerken bir sorun oluştu. Lütfen CV'nizi tekrar yüklemeyi deneyin."
  },
  overall: {
    en: "Overall Impression",
    tr: "Genel İzlenim"
  },
  atsScore: {
    en: "ATS Compatibility Score",
    tr: "ATS Uyumluluk Puanı"
  },
  strengths: {
    en: "Strengths",
    tr: "Güçlü Yönler"
  },
  improvements: {
    en: "Areas for Improvement",
    tr: "İyileştirme Alanları"
  },
  recommendations: {
    en: "Recommendations",
    tr: "Öneriler"
  },
  keywords: {
    en: "Suggested Keywords",
    tr: "Önerilen Anahtar Kelimeler"
  },
  backHome: {
    en: "Back to Home",
    tr: "Ana Sayfaya Dön"
  },
  tryAgain: {
    en: "Upload Another CV",
    tr: "Başka Bir CV Yükle"
  }
}

export default function ResultsPage() {
  const { language } = useLanguage()
  const [analysisData, setAnalysisData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Enhanced debugging for localStorage access
    console.log("ResultsPage mounted, attempting to load analysis data");
    
    // Wait a moment to ensure the FileUploader has time to save data
    setTimeout(() => {
      // Safe access to localStorage in client-side code
      try {
        console.log("Browser localStorage available:", typeof localStorage !== 'undefined');
        
        const storedData = localStorage.getItem("cvAnalysisResult");
        console.log("Raw localStorage data:", storedData);
        
        // Check if there's actual data
        if (storedData && storedData !== "undefined" && storedData !== "null") {
          try {
            const parsedData = JSON.parse(storedData);
            console.log("Parsed analysis data:", parsedData);
            
            // Validate the parsed data structure
            if (parsedData && parsedData.analysis) {
              console.log("Analysis data structure is valid");
              setAnalysisData(parsedData);
            } else {
              console.error("Invalid analysis data structure:", parsedData);
              setError(resultsTranslations.dataError[language]);
            }
          } catch (e) {
            console.error("Error parsing stored data:", e);
            setError(resultsTranslations.dataError[language]);
          }
        } else {
          console.log("No valid analysis data found in localStorage");
          setError(resultsTranslations.noResults[language]);
        }
      } catch (e) {
        console.error("Error accessing localStorage:", e);
        setError(resultsTranslations.dataError[language]);
      }
      
      setLoading(false);
    }, 500); // Add a small delay to ensure localStorage is populated
  }, [language]);

  // Create a mock analysis object for fallback
  const createMockAnalysis = (lang: string) => {
    const isEnglish = lang === 'en'
    return {
      overall_impression: isEnglish 
        ? "No detailed impression available" 
        : "Detaylı izlenim mevcut değil",
      ats_score: 0,
      strengths: [],
      areas_for_improvement: [],
      recommendations: [],
      keyword_suggestions: []
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">{resultsTranslations.loading[language]}</p>
        </div>
      </div>
    )
  }

  if (error || !analysisData || !analysisData.analysis) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <div className="text-amber-500 mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 mx-auto"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">{error || resultsTranslations.noResults[language]}</h1>
          <div className="mt-6">
            <Link href="/" className="text-blue-500 hover:text-blue-700 font-medium">
              {resultsTranslations.backHome[language]}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Use the analysis data or fallback to mock data if specific fields are missing
  const analysis = analysisData.analysis || {}
  const mockData = createMockAnalysis(language)
  
  const overallImpression = analysis.overall_impression || mockData.overall_impression
  const atsScore = analysis.ats_score || mockData.ats_score
  const strengths = analysis.strengths || mockData.strengths
  const areasForImprovement = analysis.areas_for_improvement || mockData.areas_for_improvement
  const recommendations = analysis.recommendations || mockData.recommendations
  const keywordSuggestions = analysis.keyword_suggestions || mockData.keyword_suggestions

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
          <h1 className="text-2xl font-bold mb-2">{language === 'en' ? 'CV Analysis Results' : 'CV Analiz Sonuçları'}</h1>
          <p className="text-blue-100">
            {language === 'en' 
              ? 'Based on AI analysis of your uploaded CV' 
              : 'Yüklenen CV\'nizin yapay zeka analizi sonuçları'}
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Overall Impression */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">
              {resultsTranslations.overall[language]}
            </h2>
            <div className="bg-blue-50 rounded-lg p-4 text-gray-700 leading-relaxed border-l-4 border-blue-500">
              {overallImpression}
            </div>
          </div>

          {/* ATS Score */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">
              {resultsTranslations.atsScore[language]}
            </h2>
            <div className="relative pt-1">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
                    {atsScore}/100
                  </span>
                </div>
              </div>
              <div className="flex h-3 mt-2 overflow-hidden text-xs bg-blue-100 rounded">
                <div
                  style={{ width: `${atsScore}%` }}
                  className={`flex flex-col justify-center text-center text-white ${
                    atsScore > 70 ? "bg-green-500" : atsScore > 40 ? "bg-yellow-500" : "bg-red-500"
                  }`}
                ></div>
              </div>
            </div>
          </div>

          {/* Two columns layout for strengths and improvements */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Strengths */}
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">
                {resultsTranslations.strengths[language]}
              </h2>
              {strengths && strengths.length > 0 ? (
                <ul className="list-disc pl-5 space-y-1 text-gray-700">
                  {strengths.map((item: string, index: number) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 italic">
                  {language === 'en' ? 'No specific strengths identified.' : 'Belirli güçlü yönler tespit edilmedi.'}
                </p>
              )}
            </div>

            {/* Areas for improvement */}
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">
                {resultsTranslations.improvements[language]}
              </h2>
              {areasForImprovement && areasForImprovement.length > 0 ? (
                <ul className="list-disc pl-5 space-y-1 text-gray-700">
                  {areasForImprovement.map((item: string, index: number) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 italic">
                  {language === 'en' ? 'No specific improvement areas identified.' : 'Belirli iyileştirme alanları tespit edilmedi.'}
                </p>
              )}
            </div>
          </div>

          {/* Recommendations */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">
              {resultsTranslations.recommendations[language]}
            </h2>
            {recommendations && recommendations.length > 0 ? (
              <ul className="bg-green-50 rounded-lg p-4 space-y-3 border-l-4 border-green-500">
                {recommendations.map((item: string, index: number) => (
                  <li key={index} className="flex items-start">
                    <span className="text-green-500 mr-2">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 italic">
                {language === 'en' ? 'No specific recommendations available.' : 'Belirli öneriler mevcut değil.'}
              </p>
            )}
          </div>

          {/* Keywords */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">
              {resultsTranslations.keywords[language]}
            </h2>
            {keywordSuggestions && keywordSuggestions.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {keywordSuggestions.map((keyword: string, index: number) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic">
                {language === 'en' ? 'No specific keywords suggested.' : 'Belirli anahtar kelimeler önerilmedi.'}
              </p>
            )}
          </div>
        </div>

        {/* Footer with buttons */}
        <div className="border-t border-gray-200 p-6 bg-gray-50 flex justify-between">
          <Link
            href="/"
            className="px-4 py-2 bg-white text-blue-600 rounded border border-blue-500 hover:bg-blue-50 transition"
          >
            {resultsTranslations.backHome[language]}
          </Link>
          <Link
            href="/"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            {resultsTranslations.tryAgain[language]}
          </Link>
        </div>
      </div>
    </div>
  )
}

