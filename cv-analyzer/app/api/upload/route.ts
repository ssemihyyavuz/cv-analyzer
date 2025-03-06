import { NextRequest, NextResponse } from 'next/server'

/**
 * API route handler for CV file uploads
 */
export async function POST(request: NextRequest) {
  try {
    // Extract the form data from the request
    const formData = await request.formData();
    
    // Get the uploaded file
    const file = formData.get('file') as File;
    // Get the analysis language
    const language = formData.get('language') || 'en';
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }
    
    // Log the request details
    console.log(`Processing upload request: ${file.name}, type: ${file.type}, size: ${file.size} bytes, language: ${language}`);
    
    // Try to connect to the backend, but return an error if it's not available
    try {
      // Create a new FormData object to forward to the backend
      const backendFormData = new FormData();
      backendFormData.append('file', file);
      backendFormData.append('language', language as string);
      
      // Send the file to the Python backend
      // Default to localhost:5000 or use environment variable if set
      const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000/analyze';
      console.log(`Forwarding request to backend at: ${backendUrl}`);
      
      const backendResponse = await fetch(backendUrl, {
        method: 'POST',
        body: backendFormData,
        // Set a timeout to prevent hanging if server is unreachable
        signal: AbortSignal.timeout(30000) // 30 second timeout
      });
      
      if (backendResponse.ok) {
        // Get the analysis result from the backend
        const analysisResult = await backendResponse.json();
        console.log('Backend processing successful');
        return NextResponse.json(analysisResult);
      } else {
        const errorMessage = await backendResponse.text();
        console.error(`Backend error (${backendResponse.status}): ${errorMessage}`);
        // Return error to frontend
        return NextResponse.json(
          { error: `Backend error (${backendResponse.status}): ${errorMessage || 'Unknown error'}` },
          { status: 500 }
        );
      }
    } catch (error) {
      console.error('Error connecting to backend:', error);
      // Return backend connection error
      return NextResponse.json(
        { error: 'Could not connect to analysis service. Please make sure the backend server is running.' },
        { status: 503 }
      );
    }
    
  } catch (error) {
    console.error('Error handling file upload:', error);
    
    // Return a generic error
    return NextResponse.json(
      { error: 'An unexpected error occurred during file processing. Please try again.' },
      { status: 500 }
    );
  }
} 