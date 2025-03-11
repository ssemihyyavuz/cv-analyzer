# CV Analyzer

CV Analyzer is a web application that helps users improve their resumes/CVs for job applications. The application uses a hybrid AI approach with Google Gemini for OCR and Mistral AI for analysis to provide structured feedback on strengths, weaknesses, and areas for improvement.

## Features

- Upload and analyze PDF, DOCX, and TXT resumes
- Advanced OCR processing with Google Gemini 1.5 for accurate text extraction
- Receive AI-powered analysis with specific feedback via Mistral API
- Compare your CV against specific job descriptions
- View ATS compatibility score and job match score
- Get targeted recommendations for improvement
- Support for both English and Turkish languages

## Current Project Status

**Version**: 0.4.0  
**Last Updated**: March 2025

The application consists of:
- A Next.js frontend with React & TypeScript
- A Flask backend API server
- Hybrid AI integration: Gemini 1.5 for OCR, Mistral Large for analysis
- Job description matching capabilities
- Transparent error handling between frontend and backend

### Recent Updates

We've recently improved the application with:

- **Hybrid AI Processing**: Gemini 1.5 Flash/Pro for OCR text extraction, Mistral Large for analysis
- **Enhanced OCR Capabilities**: Improved text extraction using Google's Gemini models
- **Intelligent PDF Processing**: Automatic detection of selectable text vs. scanned documents
- **Fallback Mechanisms**: Multi-tier approach with model fallbacks for robust performance
- **DOCX Support**: Improved Microsoft Word document support with docx2txt
- **Improved Error Handling**: Clear user feedback for service availability

## Tech Stack

### Frontend
- **Framework**: Next.js 14
- **Language**: TypeScript
- **UI Framework**: React 18
- **Styling**: Tailwind CSS
- **State Management**: React Context

### Backend
- **Server**: Flask 2.3.3
- **Language**: Python 3.10+
- **PDF Processing**: 
  - Primary: Google Gemini 1.5 Flash/Pro
  - Secondary: PyPDF2 for text detection
  - Fallback: pdfplumber 0.10.3
- **DOCX Processing**: docx2txt
- **Environment**: python-dotenv 1.0.0

### AI Integration
- **Document Processing**: 
  - Primary: gemini-1.5-flash model
  - Fallback: gemini-1.5-pro model
- **CV Analysis**: mistral-large-latest model
- **API Access**: Via Google Gemini and Mistral API keys
- **Analysis Format**: Structured JSON response

## How It Works

The CV Analyzer uses a sophisticated three-step approach:

1. **Document Processing Stage**:
   - Uploads are first checked for selectable text using PyPDF2
   - If no selectable text is found, Google's Gemini 1.5 Flash model processes the document
   - If Flash model encounters issues, system falls back to Gemini 1.5 Pro
   - Text is extracted while preserving document structure
   - Complex layouts, tables, and formatting are handled accurately

2. **Optional Job Matching**:
   - Users can optionally provide a job description
   - The system analyzes how well the CV matches the job requirements
   - Generates a separate job match score
   - Provides targeted recommendations specific to the job

3. **Analysis Stage**:
   - Extracted text is analyzed by Mistral's large model (mistral-large-latest)
   - AI provides detailed feedback on CV's strengths and weaknesses
   - Results include ATS compatibility score and specific recommendations
   - Response is structured in JSON format for frontend display

This hybrid approach combines the strengths of multiple AI models for superior results.

## Prerequisites

- Python 3.8 or higher
- Node.js 18 or higher
- npm or yarn
- Mistral AI API key
- Google Gemini API key

## Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd cv-analyzer
   ```

2. Set up the frontend:
   ```
   cd cv-analyzer
   npm install
   cd ..
   ```

3. Set up the Python backend:
   ```
   pip install -r requirements.txt
   ```

4. Create a `.env` file in the root directory with your API keys:
   ```
   MISTRAL_API_KEY=your_mistral_api_key_here
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

## Running the Application

You can run both the frontend and backend with a single command:

```
python run.py
```

This will start:
- Flask backend server on http://localhost:5000
- Next.js frontend on http://localhost:3000

Alternatively, you can run each separately:

**Backend:**
```
python backend.py
```

**Frontend:**
```
cd cv-analyzer
npm run dev
```

## Usage

1. Open http://localhost:3000 in your browser
2. Select your preferred language (English or Turkish)
3. Optionally paste a job description for targeted analysis
4. Upload your CV (PDF, DOCX, or TXT format)
5. Wait for the analysis to complete
6. View your results, including job match information when applicable

## Application Architecture

### Frontend Structure

```
cv-analyzer/
├── app/
│   ├── api/
│   │   └── upload/
│   │       └── route.ts    # API endpoint for file upload
│   └── results/
│       └── page.tsx        # Results display page
├── components/
│   ├── animated-text.tsx   # Text animation component
│   ├── file-uploader.tsx   # File upload component with job description input
│   ├── language-context.tsx # Language state management
│   ├── language-selector.tsx # Language selector UI
│   └── nav-links.tsx       # Navigation menu
└── [various config files]
```

### Backend Structure

```
/
├── backend.py              # Main Flask application with hybrid OCR and analysis
├── check_backend.py        # Utility to check backend status
├── run.py                  # Script to run both frontend & backend
└── requirements.txt        # Python dependencies
```

### Information Flow

1. User uploads a file and optionally provides a job description
2. Data is sent to Next.js API route `/api/upload`
3. API forwards the file and job description to Flask backend at `/analyze`
4. Backend processes the file:
   - Checks for selectable text with PyPDF2
   - If needed, uses Gemini 1.5 Flash/Pro for OCR
5. Extracted text (and job description if provided) is sent to Mistral Large model
6. Analysis results are returned to the frontend
7. Frontend displays formatted results, including job match if applicable

## Error Handling

The application implements comprehensive error handling:

- **File Validation**: Validates file types and sizes before upload
- **Backend Connection**: Detects and reports backend availability issues
- **API Timeouts**: Handles long-running requests with appropriate timeouts
- **Multi-Model Approach**: Falls back to alternative models if primary ones fail
- **Text Detection**: Smart detection of PDF text before using OCR
- **User Feedback**: Provides clear error messages when services are unavailable

## Troubleshooting

### "Failed to connect to analysis service" Error

This error occurs when the frontend cannot connect to the backend server. Here's how to fix it:

1. **Check if the backend is running**: 
   ```
   python check_backend.py
   ```
   This script will check if the backend is accessible and guide you through the steps to fix it.

2. **Make sure both servers are running**:
   - The backend should be running on http://localhost:5000
   - The frontend should be running on http://localhost:3000
   - Use `python run.py` to start both servers simultaneously

3. **Check your API key**:
   - Ensure your `.env` file contains a valid Mistral API key
   - Check that the API key has sufficient permissions and quota for both models

### Other Issues

If you're experiencing other issues:

1. Make sure all dependencies are installed correctly:
   ```
   pip install -r requirements.txt
   cd cv-analyzer && npm install
   ```

2. Check browser console for specific JavaScript errors

3. Look at the Flask server logs for backend errors

4. Try restarting both the frontend and backend servers

## API Endpoints

### Backend (Flask) Endpoints

- `GET /` - Health check endpoint
- `POST /analyze` - Upload and analyze CV file

### Frontend (Next.js) API Routes

- `POST /api/upload` - Proxy endpoint that forwards to backend

## Contributing

Contributions are welcome! Some areas for improvement:

1. **Enhanced Analysis**: Improve the AI prompts for better CV feedback
2. **User Accounts**: Add authentication and persistent storage
3. **More File Formats**: Better support for various document types
4. **Industry-Specific Analysis**: Tailored feedback for different fields

## License

MIT License
