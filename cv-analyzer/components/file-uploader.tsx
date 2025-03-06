"use client"

import { ChangeEvent, DragEvent, useState } from "react"
import { useLanguage } from "./language-context"
import { useRouter } from "next/navigation"

export function FileUploader() {
  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [aiLanguage, setAiLanguage] = useState<string>("en") // Default AI analysis language
  
  const { language, translations } = useLanguage()
  const router = useRouter()

  const validateFile = (file: File): boolean => {
    // Check file type
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
    const fileExtension = file.name.split('.').pop()?.toLowerCase()
    
    if (!validTypes.includes(file.type) && !['pdf', 'docx', 'txt'].includes(fileExtension || '')) {
      setFileError(translations.invalidFileType[language])
      return false
    }
    
    // Check file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setFileError(translations.fileTooLarge[language])
      return false
    }
    
    setFileError(null)
    return true
  }

  const handleFile = async (file: File) => {
    if (!validateFile(file)) return
    
    setFile(file)
    setUploading(true)
    setFileError(null)
    setUploadError(null)
    setUploadProgress(0)
    setUploadSuccess(false)
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('language', aiLanguage) // Add language parameter to the form data
      
      console.log(`Uploading file: ${file.name}, size: ${file.size}, type: ${file.type}, language: ${aiLanguage}`)
      
      // Create a simulated progress update
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const next = Math.min(prev + 10, 90) // Only go up to 90% until we get a response
          return next
        })
      }, 300)
      
      // Use Next.js API route that proxies to backend
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      try {
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        clearInterval(progressInterval);
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || `Error ${response.status}: ${response.statusText}`)
        }
        
        // Handle success
        setUploadProgress(100)
        setUploadSuccess(true)
        
        console.log('Upload successful:', data)
        
        // Store the analysis result in localStorage
        try {
          localStorage.setItem('cvAnalysisResult', JSON.stringify(data))
          console.log('Saved to localStorage:', data)
        } catch (e) {
          console.error('Error saving to localStorage:', e)
        }
        
        // Redirect to results page
        router.push('/results')
      } catch (e) {
        clearInterval(progressInterval)
        setUploading(false)
        setUploadProgress(0)
        
        // Display the error message to the user
        const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred during upload'
        setUploadError(errorMessage)
        console.error('Upload failed:', errorMessage)
      }
    } catch (e) {
      setUploading(false)
      setUploadProgress(0)
      
      const errorMessage = e instanceof Error ? e.message : 'An unexpected error occurred'
      setUploadError(errorMessage)
      console.error('Upload exception:', errorMessage)
    }
  }

  // Handle file drop functionality
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0])
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Language selection for AI analysis */}
      <div className="mb-4">
        <p className="text-sm font-medium text-gray-700 mb-2">{translations.selectLanguage[language]}</p>
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={() => setAiLanguage("en")}
            className={`px-4 py-2 text-sm rounded-md ${
              aiLanguage === "en"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-800 hover:bg-gray-200"
            }`}
          >
            {translations.analyzeInEnglish[language]}
          </button>
          <button
            type="button"
            onClick={() => setAiLanguage("tr")}
            className={`px-4 py-2 text-sm rounded-md ${
              aiLanguage === "tr"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-800 hover:bg-gray-200"
            }`}
          >
            {translations.analyzeInTurkish[language]}
          </button>
        </div>
      </div>

      {/* File uploader */}
      <div
        className={`border-2 border-dashed rounded-md p-6 text-center ${
          fileError ? "border-red-400 bg-red-50" : "border-gray-300 hover:border-gray-400"
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        {uploading ? (
          <div className="space-y-4">
            <p className="text-gray-500">{translations.uploadProgress[language]}</p>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-500">{uploadProgress}%</p>
          </div>
        ) : file && uploadSuccess ? (
          <div className="space-y-2">
            <div className="text-green-500 flex justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
            <p className="text-green-600 font-medium">{translations.uploadSuccess[language]}</p>
            <p className="text-sm text-gray-500">{file.name}</p>
            <p className="text-sm text-gray-500">{language === 'en' ? 'Redirecting to results...' : 'Sonuçlara yönlendiriliyor...'}</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-gray-400 flex justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
            </div>
            <p className="text-gray-700">{translations.dragDrop[language]}</p>
            <p className="text-gray-500">{translations.or[language]}</p>
            <div>
              <label htmlFor="file-upload" className="cursor-pointer text-blue-500 hover:text-blue-600">
                {translations.browseFiles[language]}
              </label>
              <input
                id="file-upload"
                name="file-upload"
                type="file"
                className="sr-only"
                accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                onChange={handleFileInputChange}
              />
            </div>
          </div>
        )}
      </div>

      {fileError && (
        <div className="mt-2 text-red-500 text-sm">
          {fileError}
        </div>
      )}

      {uploadError && (
        <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          <p className="font-medium">Analysis Error:</p>
          <p>{uploadError}</p>
          <p className="mt-2 text-sm">
            {language === 'en' 
              ? 'Please ensure the backend server is running and try again.'
              : 'Lütfen arka uç sunucusunun çalıştığından emin olun ve tekrar deneyin.'}
          </p>
        </div>
      )}
    </div>
  )
}

