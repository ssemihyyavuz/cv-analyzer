# CV Analyzer Technical Architecture

This document provides a detailed overview of the CV Analyzer application's technical architecture, explaining its components, communication flow, and implementation details.

## System Overview

CV Analyzer is a web application that consists of a Next.js frontend and a Flask backend, integrated with Mistral AI for resume analysis. The application follows a client-server architecture with a clear separation of concerns:

- **Frontend**: Handles user interface, file validation, and results display
- **Backend**: Manages document processing, text extraction, and AI integration
- **External Service**: Mistral AI provides the actual CV analysis

## Component Architecture

```
┌─────────────────┐     ┌────────────────┐     ┌─────────────────┐
│                 │     │                │     │                 │
│  Next.js        │     │  Flask         │     │  Mistral AI     │
│  Frontend       │──→──│  Backend       │──→──│  API            │
│                 │←────│                │←────│                 │
│                 │     │                │     │                 │
└─────────────────┘     └────────────────┘     └─────────────────┘
     Browser              Local Server           Cloud Service
```

### 1. Frontend (Next.js & React)

The frontend is built with Next.js and consists of several key components:

#### Key Files and Components:

- **app/page.tsx**: Main landing page with the file uploader
- **app/results/page.tsx**: Displays analysis results
- **app/api/upload/route.ts**: API route that handles file uploads
- **components/file-uploader.tsx**: Manages file selection, validation, and upload
- **components/language-context.tsx**: Provides multilingual support
- **components/language-selector.tsx**: UI for language switching

#### State Management:

The application uses React's Context API for global state management:

- **LanguageContext**: Manages translations and current language selection
- **Local component state**: Handles UI states like upload progress, errors, etc.
- **localStorage**: Stores analysis results for persistence between pages

### 2. Backend (Flask)

The Flask backend serves as an API server and document processor:

#### Key Files:

- **backend.py**: Main Flask application with API endpoints
- **requirements.txt**: Python dependencies

#### Endpoints:

- **GET /** - Health check endpoint
- **POST /analyze** - Document processing endpoint that accepts file uploads

#### Document Processing:

The backend handles multiple document formats:
- **PDF**: Processed using pdfplumber for text extraction
- **DOCX**: Handled via python-docx library
- **TXT**: Processed natively with Python file operations

### 3. External Services

The application integrates with Mistral AI for the actual CV analysis:

- **API Authentication**: Uses API key authentication stored in `.env` file
- **Prompt Engineering**: Custom prompts designed for CV analysis
- **Response Processing**: Parses and structures the AI response for frontend consumption

## Communication Flow

### Upload Process:

1. User selects a file in the browser
2. Frontend validates file format and size
3. File is sent to Next.js API route `/api/upload`
4. Next.js forwards the file to Flask backend at `/analyze`
5. Backend extracts text from the document
6. Text is sent to Mistral AI with custom prompts
7. Mistral AI returns analysis in JSON format
8. Backend forwards the analysis to frontend
9. Frontend stores results in localStorage
10. User is redirected to results page

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│          │     │          │     │          │     │          │
│  Browser │────→│  Next.js │────→│  Flask   │────→│ Mistral  │
│          │←────│  API     │←────│  Backend │←────│ AI       │
│          │     │          │     │          │     │          │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
```

### Error Handling Flow:

1. Error occurs (e.g., backend unreachable)
2. Error is caught and categorized (connection, timeout, processing)
3. Appropriate error status code and message is returned
4. Frontend displays user-friendly error message
5. User is guided on how to resolve the issue

## Data Model

The application uses a consistent data structure for analysis results:

```typescript
interface CVAnalysis {
  overall_impression: string;
  ats_score: number;
  strengths: string[];
  areas_for_improvement: string[];
  recommendations: string[];
  keyword_suggestions: string[];
}
```

This structure is maintained throughout the application:
- Returned by Mistral AI
- Passed from backend to frontend
- Stored in localStorage
- Displayed in the results UI

## Security Considerations

The application implements several security measures:

- **CORS**: Implemented for API security
- **File Validation**: Prevents upload of malicious files
- **API Key Security**: Environment variables for credential storage
- **Error Handling**: Prevents leaking sensitive information in errors

## Performance Optimizations

The application includes several performance optimizations:

- **Timeouts**: Prevents hanging on slow API responses
- **File Size Limits**: Restricts upload size to improve processing time
- **Asynchronous Processing**: Non-blocking API calls

## Deployment Architecture

The application can be deployed in several configurations:

### Development Setup:
- Frontend and backend run separately on localhost
- Next.js on port 3000, Flask on port 5000

### Production Options:
1. **Separate Services**:
   - Next.js frontend on Vercel
   - Flask backend on a standalone server
   - Requires CORS and proper API routing

2. **Containerized Deployment**:
   - Both services in Docker containers
   - Orchestrated with Docker Compose or Kubernetes

## Technology Stack Details

### Frontend:
- **Next.js**: 14.x (App Router)
- **React**: 18.x
- **TypeScript**: 5.x
- **TailwindCSS**: 3.x (for styling)

### Backend:
- **Flask**: 2.3.3
- **pdfplumber**: 0.10.3 (PDF processing)
- **python-docx**: 1.0.1 (DOCX processing)
- **python-dotenv**: 1.0.0 (environment variables)
- **Flask-CORS**: 4.0.0 (Cross-Origin Resource Sharing)

## Future Architecture Considerations

Potential improvements to the architecture:

1. **Microservices**: Split backend into specialized services
   - Document processor service
   - AI integration service
   - User management service

2. **Database Integration**:
   - User accounts and authentication
   - Analysis history storage
   - Comparison between different CV versions

3. **Scalability Enhancements**:
   - Queue-based processing for large files
   - Horizontal scaling for backend services
   - Caching layer for frequent operations 