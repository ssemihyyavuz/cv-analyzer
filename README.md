# CV Analyzer

CV Analyzer is a web application that helps users improve their resumes/CVs for job applications. The application uses AI to analyze CVs and provide feedback on strengths, weaknesses, and areas for improvement.

## Features

- Upload and analyze PDF resumes
- Receive AI-powered analysis with specific feedback
- View ATS compatibility score
- Get recommendations for improvement

## Tech Stack

- **Frontend**: Next.js, React, Tailwind CSS
- **Backend**: Flask (Python)
- **AI**: Google Gemini API

## Prerequisites

- Python 3.8 or higher
- Node.js 18 or higher
- npm or yarn
- Google Gemini API key

## Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd cv-analyzer-project
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

4. Create a `.env` file in the root directory with your Google Gemini API key:
   ```
   GOOGLE_API_KEY=your_gemini_api_key_here
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
2. Upload your CV (PDF format)
3. Wait for the analysis to complete
4. View your results and recommendations

## Troubleshooting

### "Failed to fetch" Error
If you encounter a "Failed to fetch" error when uploading your resume, it usually means that the frontend can't connect to the backend server. Here's how to fix it:

1. **Check if the backend is running**: 
   ```
   python check_backend.py
   ```
   This script will check if the backend is accessible and guide you through the steps to fix it.

2. **Make sure both servers are running**:
   - The backend should be running on http://localhost:5000
   - The frontend should be running on http://localhost:3000
   - Use `python run.py` to start both servers simultaneously

3. **Check your file format**:
   - Make sure you're uploading a PDF file
   - Other formats (DOCX, TXT) may have limited support

4. **Check browser console for more details**:
   - Open your browser's developer tools (F12) and check the console for specific error messages

### Other Issues

If you're experiencing other issues:

1. Make sure all dependencies are installed correctly:
   ```
   pip install -r requirements.txt
   cd cv-analyzer && npm install
   ```

2. Check that your `.env` file contains a valid Google Gemini API key

3. Try restarting both the frontend and backend servers:
   ```
   python run.py
   ```

## Project Structure

- `/cv-analyzer` - Next.js frontend application
  - `/app` - Next.js pages and components
  - `/components` - React components
- `backend.py` - Flask API server
- `run.py` - Script to run both frontend and backend
- `check_backend.py` - Utility script to check if the backend is running

## API Endpoints

- `GET /` - API status check
- `POST /upload` - Upload and analyze CV file

## License

MIT "# cv-analyzer" 
"# cv-analyzer" 
