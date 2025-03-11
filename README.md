# CV Analyzer

CV Analyzer is a web application that helps users improve their resumes/CVs for job applications. The application uses a two-stage AI approach with Mistral AI models to analyze CVs and provide structured feedback on strengths, weaknesses, and areas for improvement.

# Product Video

https://github.com/user-attachments/assets/facd97a8-222a-495d-afea-7a136bb02aef

## Features

- Upload and analyze PDF, DOCX, and TXT resumes
- Advanced OCR processing for accurate text extraction
- Receive AI-powered analysis with specific feedback
- Compare your CV against specific job descriptions
- View ATS compatibility score and job match score
- Get targeted recommendations for improvement
- Support for both English and Turkish languages

## Current Project Status

**Version**: 0.3.0  
**Last Updated**: May 2024

The application consists of:
- A Next.js frontend with React & TypeScript
- A Flask backend API server
- Two-stage Mistral AI integration for document processing and analysis
- Job description matching capabilities
- Transparent error handling between frontend and backend

### Recent Updates

We've recently improved the application with:

- **Job Description Matching**: Added ability to analyze CVs against specific job postings
- **Two-Stage AI Processing**: First OCR extraction, then intelligent analysis
- **Enhanced OCR Capabilities**: Better extraction of text from complex documents
- **Advanced Analysis Model**: Using Mistral's most powerful model for insights
- **DOCX Support**: Full support for Microsoft Word documents
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
- **PDF Processing**: Mistral OCR + pdfplumber 0.10.3 (fallback)
- **DOCX Processing**: python-docx 1.0.1
- **Environment**: python-dotenv 1.0.0

### AI Integration
- **Document Processing**: mistral-ocr-latest model
- **CV Analysis**: mistral-large-latest model
- **API Access**: Via Mistral API key
- **Analysis Format**: Structured JSON response

## How It Works

The CV Analyzer uses a sophisticated three-step approach:

1. **Document Processing Stage**:
   - Uploads are processed by Mistral's OCR model (mistral-ocr-latest)
   - Text is extracted while preserving document structure
   - Complex layouts, tables, and formatting are handled accurately
   - Fallback to traditional extraction methods if OCR fails

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

This approach combines the best of document understanding technology with advanced language model analysis for superior results.

## Prerequisites

- Python 3.8 or higher
- Node.js 18 or higher
- npm or yarn
- Mistral AI API key

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

4. Create a `.env` file in the root directory with your Mistral AI API key:
   ```
   MISTRAL_API_KEY=your_api_key_here
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
├── backend.py              # Main Flask application with two-stage analysis
├── check_backend.py        # Utility to check backend status
├── run.py                  # Script to run both frontend & backend
└── requirements.txt        # Python dependencies
```

### Information Flow

1. User uploads a file and optionally provides a job description
2. Data is sent to Next.js API route `/api/upload`
3. API forwards the file and job description to Flask backend at `/analyze`
4. Backend processes the file with Mistral OCR to extract text
5. Extracted text (and job description if provided) is sent to Mistral Large model
6. Analysis results are returned to the frontend
7. Frontend displays formatted results, including job match if applicable

## Error Handling

The application implements comprehensive error handling:

- **File Validation**: Validates file types and sizes before upload
- **Backend Connection**: Detects and reports backend availability issues
- **API Timeouts**: Handles long-running requests with appropriate timeouts
- **OCR Fallbacks**: Uses alternative extraction methods if OCR fails
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
"# cv_analyzer2.0" 
