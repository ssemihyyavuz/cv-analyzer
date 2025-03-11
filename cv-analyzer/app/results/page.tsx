"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useLanguage } from "../../components/language-context"
import { useRouter } from "next/navigation"

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

// Mock data for testing if needed
const createMockData = (lang: string = 'en') => {
  return {
    analysis: {
      overall_impression: lang === 'en' ? "This is mock data for testing. Upload a real CV for actual analysis." : "Bu test için yapay veridir. Gerçek analiz için bir CV yükleyin.",
      ats_score: 70,
      job_match_score: 65,
      strengths: [
        lang === 'en' ? "Clear presentation of information" : "Bilginin net sunumu",
        lang === 'en' ? "Good use of keywords" : "Anahtar kelimelerin iyi kullanımı"
      ],
      areas_for_improvement: [
        lang === 'en' ? "Add more quantifiable achievements" : "Daha fazla ölçülebilir başarı ekleyin"
      ],
      recommendations: [
        lang === 'en' ? "Include more specific technical skills" : "Daha fazla teknik beceri ekleyin"
      ],
      keyword_suggestions: [
        { keyword: "Project Management", present: true },
        { keyword: "Leadership", present: false }
      ]
    }
  };
};

export default function ResultsPage() {
  const { language } = useLanguage()
  const [analysisData, setAnalysisData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const router = useRouter();

  // Function to directly query the API if localStorage fails
  const fetchFromBackendFallback = async () => {
    try {
      console.log("Attempting direct backend fallback fetch...");
      
      const response = await fetch('http://localhost:5000/last_analysis', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Backend error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data && data.analysis) {
        console.log("Successfully retrieved data from backend fallback");
        setAnalysisData(data);
        
        // Also update localStorage
        try {
          localStorage.setItem('cvAnalysisResult', JSON.stringify(data));
          console.log("Updated localStorage with backend data");
        } catch (e) {
          console.error("Could not update localStorage:", e);
        }
        
        return true;
      } else {
        console.error("Invalid data format from backend fallback:", data);
        return false;
      }
    } catch (e) {
      console.error("Backend fallback fetch failed:", e);
      return false;
    }
  };

  // Function to retry getting data
  const retryFetch = () => {
    setRetryCount(prev => prev + 1);
    setLoading(true);
    setError(null);
  };

  useEffect(() => {
    // Enhanced debugging for localStorage access
    console.log("ResultsPage mounted, attempting to load analysis data (attempt:", retryCount + 1, ")");
    
    const loadData = async () => {
      // Try localStorage first
      let localSuccess = false;
      
      try {
        console.log("Browser localStorage available:", typeof localStorage !== 'undefined');
        
        // Try to get data from localStorage
        try {
          const storedData = localStorage.getItem("cvAnalysisResult");
          console.log("Raw localStorage data:", storedData ? `${storedData.substring(0, 100)}...` : "null or empty");
          
          if (storedData && storedData !== "undefined" && storedData !== "null") {
            try {
              const parsedData = JSON.parse(storedData);
              console.log("Parsed analysis data structure:", Object.keys(parsedData).join(', '));
              
              // Validate the parsed data structure
              if (parsedData && parsedData.analysis) {
                console.log("Analysis data structure is valid");
                setAnalysisData(parsedData);
                localSuccess = true;
              } else {
                console.error("Invalid analysis data structure:", parsedData);
                localStorage.removeItem("cvAnalysisResult");
              }
            } catch (e) {
              console.error("Error parsing stored data:", e);
              localStorage.removeItem("cvAnalysisResult");
            }
          } else {
            console.log("No valid analysis data found in localStorage");
          }
        } catch (e) {
          console.error("Error reading localStorage:", e);
        }
      } catch (e) {
        console.error("Error in overall localStorage handling:", e);
      }

      // If localStorage failed, try backend fallback
      if (!localSuccess) {
        console.log("localStorage load failed, trying backend fallback...");
        const backendSuccess = await fetchFromBackendFallback();
        
        if (!backendSuccess) {
          // If both methods failed, show error
          console.error("Both localStorage and backend fallback failed");
          
          // If in development mode, use mock data
          if (process.env.NODE_ENV === 'development') {
            console.warn("Using mock data for development");
            setAnalysisData(createMockData(language));
          } else {
            setError(resultsTranslations.dataError[language]);
          }
        }
      }
      
      setLoading(false);
    };

    loadData();
  }, [language, retryCount]);

  if (loading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center px-4 py-12">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-6 text-gray-600 text-lg">{resultsTranslations.loading[language]}</p>
        </div>
      </div>
    )
  }

  if (error || !analysisData || !analysisData.analysis) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-lg shadow-md p-8 text-center w-full max-w-2xl mx-4">
          <div className="text-amber-500 mb-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-16 w-16 mx-auto"
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
          <h1 className="text-2xl font-bold text-gray-800 mb-4">{error || resultsTranslations.noResults[language]}</h1>
          
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={retryFetch}
              className="px-6 py-3 bg-blue-500 text-white rounded hover:bg-blue-600 transition-all duration-200 text-lg font-medium"
            >
              {language === 'en' ? 'Retry Loading' : 'Tekrar Yüklemeyi Dene'}
            </button>
            
            <Link
              href="/"
              className="px-6 py-3 bg-white text-blue-600 rounded border border-blue-500 hover:bg-blue-50 transition-all duration-200 text-lg font-medium"
            >
              {language === 'en' ? 'Back to Upload' : 'Yükleme Sayfasına Dön'}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Extract data
  const analysis = analysisData.analysis;
  const overallImpression = analysis.overall_impression || "";
  const atsScore = analysis.ats_score || 0;
  const jobMatchScore = analysis.job_match_score || null;
  const strengths = analysis.strengths || [];
  const areasForImprovement = analysis.areas_for_improvement || [];
  const recommendations = analysis.recommendations || analysis.job_specific_recommendations || [];
  const keywordSuggestions = analysis.keyword_suggestions || [];

  return (
    <div className="bg-gray-50 min-h-screen w-full">
      <div className="max-w-7xl mx-auto bg-white shadow-md overflow-hidden my-8 rounded-lg">
        {/* Header */}
        <div className="w-full bg-gradient-to-r from-blue-500 to-purple-600 p-6 md:p-8 text-white">
          <div className="max-w-5xl mx-auto text-center">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2">{language === 'en' ? 'CV Analysis Results' : 'CV Analiz Sonuçları'}</h1>
            <p className="text-blue-100 text-base md:text-lg">
              {language === 'en' 
                ? 'Based on AI analysis of your uploaded CV' 
                : 'Yüklenen CV\'nizin yapay zeka analizi sonuçları'}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="w-full p-5 md:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
              {/* Left column */}
              <div className="lg:col-span-5">
                {/* Overall Impression */}
                <div className="mb-10">
                  <h2 className="text-xl md:text-2xl font-semibold text-gray-800 mb-4">
                    {resultsTranslations.overall[language]}
                  </h2>
                  <div className="bg-blue-50 rounded-lg p-4 md:p-6 text-gray-700 leading-relaxed border-l-4 border-blue-500 text-base md:text-lg">
                    {overallImpression}
                  </div>
                </div>

                {/* ATS Score */}
                <div className="mb-10">
                  <h2 className="text-xl md:text-2xl font-semibold text-gray-800 mb-4">
                    {resultsTranslations.atsScore[language]}
                  </h2>
                  <div className="relative pt-1">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="text-sm md:text-base font-semibold inline-block py-1 px-3 uppercase rounded-full text-blue-600 bg-blue-200">
                          {atsScore}/100
                        </span>
                      </div>
                    </div>
                    <div className="flex h-6 mt-2 overflow-hidden text-xs bg-blue-100 rounded">
                      <div
                        style={{ width: `${atsScore}%` }}
                        className={`flex flex-col justify-center text-center text-white ${
                          atsScore > 70 ? "bg-green-500" : atsScore > 40 ? "bg-yellow-500" : "bg-red-500"
                        }`}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Job Match Score - only show if available */}
                {jobMatchScore !== null && (
                  <div className="mb-10">
                    <h2 className="text-xl md:text-2xl font-semibold text-gray-800 mb-4">
                      {language === 'en' ? 'Job Match Score' : 'İş Uyum Puanı'}
                    </h2>
                    <div className="relative pt-1">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <span className="text-sm md:text-base font-semibold inline-block py-1 px-3 uppercase rounded-full text-purple-600 bg-purple-200">
                            {jobMatchScore}/100
                          </span>
                        </div>
                      </div>
                      <div className="flex h-6 mt-2 overflow-hidden text-xs bg-purple-100 rounded">
                        <div
                          style={{ width: `${jobMatchScore}%` }}
                          className={`flex flex-col justify-center text-center text-white ${
                            jobMatchScore > 70 ? "bg-green-500" : jobMatchScore > 40 ? "bg-yellow-500" : "bg-red-500"
                          }`}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Keywords */}
                <div>
                  <h2 className="text-xl md:text-2xl font-semibold text-gray-800 mb-4">
                    {resultsTranslations.keywords[language]}
                  </h2>
                  {keywordSuggestions && keywordSuggestions.length > 0 ? (
                    <div className="flex flex-wrap gap-3 bg-gray-50 p-4 md:p-6 rounded-lg">
                      {keywordSuggestions.map((keyword: any, index: number) => {
                        // Check if keyword is an object (new format) or string (old format)
                        const isObject = typeof keyword === 'object' && keyword !== null;
                        const keywordText = isObject ? keyword.keyword : keyword;
                        const isPresent = isObject ? keyword.present : false;
                        
                        return (
                          <div key={index} className="relative group">
                            <span
                              className={`px-4 py-2 rounded-full text-base md:text-lg flex items-center gap-1 cursor-pointer transition-all duration-200 ${
                                isObject
                                  ? isPresent
                                    ? "bg-green-100 text-green-800 border border-green-200 hover:bg-green-200 hover:shadow-sm"
                                    : "bg-red-100 text-red-800 border border-red-200 hover:bg-red-200 hover:shadow-sm"
                                  : "bg-gray-100 text-gray-800 border border-gray-200 hover:bg-gray-200 hover:shadow-sm"
                              }`}
                            >
                              {keywordText}
                              {isObject && (
                                <span className="ml-1 font-bold">
                                  {isPresent ? "✓" : "✗"}
                                </span>
                              )}
                            </span>
                            
                            {/* Tooltip that appears on hover */}
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 bg-gray-800 text-white text-sm rounded-md py-1 px-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none z-10">
                              {isObject && isPresent 
                                ? language === 'en' 
                                  ? `Great! "${keywordText}" is found in your CV.` 
                                  : `Harika! "${keywordText}" CV'nizde bulunuyor.`
                                : language === 'en'
                                  ? `Consider adding "${keywordText}" to your CV.`
                                  : `"${keywordText}" ifadesini CV'nize eklemeyi düşünün.`
                              }
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-gray-800"></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic text-base md:text-lg">
                      {language === 'en' ? 'No specific keywords suggested.' : 'Belirli anahtar kelimeler önerilmedi.'}
                    </p>
                  )}
                </div>
              </div>

              {/* Right column */}
              <div className="lg:col-span-7">
                {/* Two columns layout for strengths and improvements */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10 mb-10">
                  {/* Strengths */}
                  <div>
                    <h2 className="text-xl md:text-2xl font-semibold text-gray-800 mb-4">
                      {resultsTranslations.strengths[language]}
                    </h2>
                    {strengths && strengths.length > 0 ? (
                      <ul className="list-disc pl-5 space-y-2 text-base md:text-lg text-gray-700">
                        {strengths.map((item: string, index: number) => (
                          <li key={index} className="transition-colors duration-200 hover:text-blue-800">{item}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-500 italic text-base md:text-lg">
                        {language === 'en' ? 'No specific strengths identified.' : 'Belirli güçlü yönler tespit edilmedi.'}
                      </p>
                    )}
                  </div>

                  {/* Areas for improvement */}
                  <div>
                    <h2 className="text-xl md:text-2xl font-semibold text-gray-800 mb-4">
                      {resultsTranslations.improvements[language]}
                    </h2>
                    {areasForImprovement && areasForImprovement.length > 0 ? (
                      <ul className="list-disc pl-5 space-y-2 text-base md:text-lg text-gray-700">
                        {areasForImprovement.map((item: string, index: number) => (
                          <li key={index} className="transition-colors duration-200 hover:text-blue-800">{item}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-500 italic text-base md:text-lg">
                        {language === 'en' ? 'No specific improvement areas identified.' : 'Belirli iyileştirme alanları tespit edilmedi.'}
                      </p>
                    )}
                  </div>
                </div>

                {/* Recommendations */}
                <div className="mb-8">
                  <h2 className="text-xl md:text-2xl font-semibold text-gray-800 mb-4">
                    {resultsTranslations.recommendations[language]}
                  </h2>
                  {recommendations && recommendations.length > 0 ? (
                    <ul className="bg-green-50 rounded-lg p-4 md:p-6 space-y-4 border-l-4 border-green-500">
                      {recommendations.map((item: string, index: number) => (
                        <li key={index} className="flex items-start group">
                          <span className="text-green-500 mr-3 text-xl group-hover:text-green-600 transition-colors duration-200">•</span>
                          <span className="leading-relaxed text-base md:text-lg group-hover:text-green-800 transition-colors duration-200">{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500 italic text-base md:text-lg">
                      {language === 'en' ? 'No specific recommendations available.' : 'Belirli öneriler mevcut değil.'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer with buttons */}
        <div className="w-full border-t border-gray-200 p-5 md:p-6 lg:p-8 bg-gray-50 flex flex-col sm:flex-row sm:justify-between gap-4">
          <div className="max-w-6xl mx-auto w-full flex flex-col sm:flex-row sm:justify-between gap-4">
            <Link
              href="/"
              className="px-6 py-3 bg-white text-blue-600 rounded border border-blue-500 hover:bg-blue-50 hover:shadow-md transition-all duration-200 text-center sm:text-left font-medium text-base md:text-lg transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {resultsTranslations.backHome[language]}
            </Link>
            <Link
              href="/"
              className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 hover:shadow-md transition-all duration-200 text-center sm:text-left font-medium text-base md:text-lg transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {resultsTranslations.tryAgain[language]}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

