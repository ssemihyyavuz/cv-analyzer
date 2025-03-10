"use client"

import { ChangeEvent, DragEvent, useState, useEffect } from "react"
import { useLanguage } from "./language-context"
import { useRouter } from "next/navigation"

export function FileUploader() {
  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const { language, translations } = useLanguage()
  const [aiLanguage, setAiLanguage] = useState<string>(language) // Default AI analysis language matches interface language
  const [jobDescription, setJobDescription] = useState<string>("") // Job description state
  const [showJobDesc, setShowJobDesc] = useState<boolean>(false) // Toggle for job description section
  const [isDragging, setIsDragging] = useState<boolean>(false) // Track when files are being dragged over
  
  const router = useRouter()

  // Automatically set AI language based on interface language
  useEffect(() => {
    setAiLanguage(language)
  }, [language])

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
      
      // Add job description to form data if provided
      if (jobDescription.trim()) {
        formData.append('job_description', jobDescription.trim())
      }
      
      console.log(`Uploading file: ${file.name}, size: ${file.size}, type: ${file.type}, language: ${aiLanguage}`)
      if (jobDescription.trim()) {
        console.log(`Job description included: ${jobDescription.substring(0, 50)}...`)
      }
      
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
        // DIRECT API call - bypass the Next.js API route for debugging
        const backendUrl = 'http://localhost:5000/analyze';
        
        console.log('Sending file directly to backend at:', backendUrl);
        
        const directFormData = new FormData();
        directFormData.append('file', file);
        directFormData.append('language', aiLanguage);
        if (jobDescription.trim()) {
          directFormData.append('job_description', jobDescription.trim());
        }

        const response = await fetch(backendUrl, {
          method: 'POST',
          body: directFormData,
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        clearInterval(progressInterval);
        
        // Read the full response text
        const responseText = await response.text();
        console.log('Raw response text:', responseText.substring(0, 200) + '...');
        
        // Check if the response is empty
        if (!responseText || responseText.trim() === '') {
          throw new Error('Empty response from server');
        }
        
        // Try to parse as JSON
        let data: any;
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.error('Error parsing response as JSON:', parseError);
          throw new Error('Invalid response format from server');
        }
        
        // Check for error in the response
        if (!response.ok) {
          const errorMessage = data.error || `Backend error: ${response.status} ${response.statusText}`;
          console.error('Backend server error:', errorMessage);
          throw new Error(errorMessage);
        }
        
        console.log('Upload successful, received data:', data);
        
        // Validate the data structure
        if (!data || typeof data !== 'object') {
          console.error('Invalid response data (not an object):', data);
          throw new Error('Server returned invalid data structure');
        }
        
        // Check for error message in the response data
        if (data.error) {
          console.error('Server returned error:', data.error);
          throw new Error(data.error);
        }
        
        // Validate the analysis structure
        if (!data.analysis || typeof data.analysis !== 'object') {
          console.error('Missing or invalid analysis object:', data);
          
          // Try to find any property that could be the analysis data
          const potentialAnalysisKeys = Object.keys(data).filter(key => 
            typeof data[key] === 'object' && 
            data[key] !== null && 
            !Array.isArray(data[key])
          );
          
          if (potentialAnalysisKeys.length > 0) {
            // Use the first object property as analysis
            console.log('Found potential analysis data in property:', potentialAnalysisKeys[0]);
            data = { analysis: data[potentialAnalysisKeys[0]] };
          } else {
            throw new Error('Server returned incomplete analysis data');
          }
        }
        
        // Store the analysis result in localStorage
        try {
          // Temporarily store data in a variable to verify it
          const dataToStore = JSON.stringify(data);
          
          // Try to parse it back to make sure it's valid JSON
          JSON.parse(dataToStore);
          
          // Storage successful, store in localStorage
          localStorage.setItem('cvAnalysisResult', dataToStore);
          
          console.log('Successfully saved analysis to localStorage');
          
          // Double-check that we can read it back
          const readBack = localStorage.getItem('cvAnalysisResult');
          if (!readBack) {
            throw new Error('Verification failed: Could not read back stored data');
          }
        } catch (e) {
          console.error('Error saving to localStorage:', e);
          setUploadError(language === 'en' 
            ? 'Error saving analysis results. Please try again.'
            : 'Analiz sonuçları kaydedilirken hata oluştu. Lütfen tekrar deneyin.');
          setUploading(false);
          return;
        }
        
        // Handle success
        setUploadProgress(100);
        setUploadSuccess(true);
        
        // Redirect to results page after a short delay
        setTimeout(() => {
          router.push('/results');
        }, 1000);
      } catch (e) {
        clearInterval(progressInterval);
        setUploading(false);
        setUploadProgress(0);
        
        // Display the error message to the user
        const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred during upload';
        setUploadError(errorMessage);
        console.error('Upload failed:', errorMessage);
      }
    } catch (e) {
      setUploading(false);
      setUploadProgress(0);
      
      const errorMessage = e instanceof Error ? e.message : 'An unexpected error occurred';
      setUploadError(errorMessage);
      console.error('Upload exception:', errorMessage);
    }
  }

  // Handle file drop functionality
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0])
    }
  }

  const handleJobDescriptionChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setJobDescription(e.target.value)
  }

  const toggleJobDescription = () => {
    setShowJobDesc(!showJobDesc)
  }

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col">
      {/* Language selection for AI analysis */}
      <div className="mb-4">
        <p className="text-base font-medium text-gray-700 mb-2">{translations.selectLanguage[language]}</p>
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={() => setAiLanguage("en")}
            className={`px-5 py-2.5 text-base rounded-md transition-all duration-200 ${
              aiLanguage === "en"
                ? "bg-blue-500 text-white shadow-md"
                : "bg-gray-100 text-gray-800 hover:bg-gray-200 hover:shadow"
            }`}
          >
            {translations.analyzeInEnglish[language]}
          </button>
          <button
            type="button"
            onClick={() => setAiLanguage("tr")}
            className={`px-5 py-2.5 text-base rounded-md transition-all duration-200 ${
              aiLanguage === "tr"
                ? "bg-blue-500 text-white shadow-md"
                : "bg-gray-100 text-gray-800 hover:bg-gray-200 hover:shadow"
            }`}
          >
            {translations.analyzeInTurkish[language]}
          </button>
        </div>
      </div>

      {/* Job Description Toggle Button */}
      <div className="mb-4">
        <button
          type="button"
          onClick={toggleJobDescription}
          className="flex items-center text-base text-blue-600 hover:text-blue-800 transition-colors duration-200"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className={`h-5 w-5 mr-1 transform transition-transform duration-300 ${showJobDesc ? 'rotate-90' : ''}`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          {language === 'en' ? 'Add Job Description (Optional)' : 'İş Açıklaması Ekle (İsteğe Bağlı)'}
        </button>
      </div>

      {/* Job Description Textarea - Shows only when toggled */}
      <div 
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          showJobDesc 
            ? 'max-h-96 opacity-100 mb-6' 
            : 'max-h-0 opacity-0 mb-0'
        }`}
      >
        <div className="pt-2">
          <label htmlFor="job-description" className="block text-base font-medium text-gray-700 mb-2">
            {language === 'en' ? 'Job Description' : 'İş Açıklaması'}
          </label>
          <textarea
            id="job-description"
            name="job-description"
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-base"
            placeholder={language === 'en' ? "Paste job description here to compare with your CV..." : "CV'niz ile karşılaştırmak için iş açıklamasını buraya yapıştırın..."}
            value={jobDescription}
            onChange={handleJobDescriptionChange}
          ></textarea>
          <p className="mt-1 text-sm text-gray-500">
            {language === 'en' 
              ? 'Adding a job description will allow us to analyze how well your CV matches this specific job.' 
              : 'İş açıklaması eklemek, CV\'nizin bu işe ne kadar uygun olduğunu analiz etmemizi sağlayacaktır.'}
          </p>
        </div>
      </div>

      {/* File uploader */}
      <div
        className={`border-2 border-dashed rounded-md p-7 text-center transition-all duration-300 ${
          fileError 
            ? "border-red-400 bg-red-50" 
            : uploading || (file && uploadSuccess)
              ? "border-gray-300" 
              : isDragging
                ? "border-blue-400 bg-blue-50 shadow-md transform scale-[1.01]" 
                : "border-gray-300 hover:border-blue-400 hover:bg-blue-50 hover:shadow-md"
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {uploading ? (
          <div className="space-y-4">
            <p className="text-gray-500 text-lg">{translations.uploadProgress[language]}</p>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="text-base text-gray-500">{uploadProgress}%</p>
          </div>
        ) : file && uploadSuccess ? (
          <div className="space-y-2">
            <div className="text-green-500 flex justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="30"
                height="30"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="animate-pulse"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
            <p className="text-green-600 font-medium text-lg">{translations.uploadSuccess[language]}</p>
            <p className="text-base text-gray-500">{file.name}</p>
            <p className="text-base text-gray-500">{language === 'en' ? 'Redirecting to results...' : 'Sonuçlara yönlendiriliyor...'}</p>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="text-gray-400 flex justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-transform duration-200 group-hover:scale-110"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
            </div>
            <p className="text-gray-700 text-lg">{translations.dragDrop[language]}</p>
            <p className="text-gray-500 text-base">{translations.or[language]}</p>
            <div>
              <label htmlFor="file-upload" className="cursor-pointer text-blue-500 hover:text-blue-700 transition-colors duration-200 hover:underline text-lg">
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

      {/* File Error Message */}
      {fileError && (
        <div className="mt-2 text-base text-red-600 transition-opacity duration-200">
          <p>{fileError}</p>
        </div>
      )}

      {/* Upload Error Message */}
      {uploadError && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-base text-red-600 transition-opacity duration-200">
          <p className="font-medium mb-1">{language === 'en' ? 'Upload Failed' : 'Yükleme Başarısız'}</p>
          <p>{uploadError}</p>
        </div>
      )}

      {/* Upload button - show when file is selected but not uploaded yet */}
      {file && !uploading && !uploadSuccess && (
        <button
          type="button"
          onClick={() => handleFile(file)}
          className="w-full mt-4 bg-blue-500 text-white py-3 px-5 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] text-lg font-medium"
        >
          {language === 'en' ? 'Analyze CV' : 'CV Analiz Et'}
        </button>
      )}

      {/* Supported file types info */}
      <div className="mt-4 text-sm text-gray-500 text-center w-full">
        {language === 'en' 
          ? 'Supported formats: PDF, DOCX, TXT (Max 5MB)' 
          : 'Desteklenen formatlar: PDF, DOCX, TXT (Maks 5MB)'}
      </div>
    </div>
  )
}

