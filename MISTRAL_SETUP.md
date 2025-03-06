# Setting Up CV Analyzer with Mistral AI

This guide will help you set up and run the CV Analyzer application with Mistral AI for advanced CV analysis.

## Prerequisites

1. A Mistral AI API key (get one from [Mistral AI Platform](https://console.mistral.ai/))
2. Python 3.8 or higher
3. Node.js 18 or higher
4. Git (to clone the repository)

## Environment Setup

1. Create a `.env` file in the root directory with your Mistral API key:

```
MISTRAL_API_KEY=your_mistral_api_key_here
```

2. Install the required Python packages:

```bash
pip install -r requirements.txt
```

3. Install the frontend dependencies:

```bash
cd cv-analyzer
npm install
```

## Running the Application

1. Start the backend server:

```bash
python backend.py
```

This will start the Flask server on `http://localhost:5000`.

2. In a new terminal, start the frontend development server:

```bash
cd cv-analyzer
npm run dev
```

This will start the Next.js development server on `http://localhost:3000`.

3. Open your browser and navigate to `http://localhost:3000` to use the application.

## Important Note on Error Handling

The CV Analyzer application has been updated to handle errors transparently:

1. **Backend Dependency**: The frontend now requires a working backend connection to function properly.
2. **Clear Error Messages**: If the backend is unavailable, users will receive a clear error message.
3. **No Fake Analysis**: The application no longer generates mock analysis data when backend services fail.

This approach ensures that users always get accurate information about the status of the system.

## How Mistral AI Improves CV Analysis

Mistral AI offers several advantages for CV analysis:

1. **Superior OCR Capabilities**: Mistral AI is excellent at understanding text extracted from PDFs and other document formats.

2. **Structured Analysis**: The system provides a structured JSON response with specific sections:
   - Overall impression
   - ATS compatibility score
   - Strengths
   - Areas for improvement
   - Specific recommendations
   - Keyword suggestions

3. **Multilingual Support**: The system supports analysis in both English and Turkish.

4. **Consistent Format**: Results are presented in a consistent format that makes it easy to understand areas for improvement.

## Troubleshooting

If you encounter issues:

1. **Backend Connection Problems**:
   - Ensure the Flask server is running on port 5000
   - Check your Mistral API key is correct in the `.env` file
   - Verify your internet connection (required to connect to Mistral API)
   - Check the error message displayed in the UI for specific guidance

2. **PDF Processing Issues**:
   - Make sure your PDF is not password-protected
   - For scanned PDFs, OCR quality may vary

3. **Rate Limiting**:
   - Mistral API has rate limits. If you see errors related to too many requests, you may need to wait before trying again.

## Extending the Application

You can extend the CV Analyzer in several ways:

1. **DOCX Support**: The backend is set up for PDF, DOCX, and TXT files.

2. **Custom Prompts**: You can customize the prompts in `backend.py` to get different types of analysis from Mistral AI.

3. **User Accounts**: Add user accounts to save analysis history and compare different versions of the same CV.

4. **Industry-Specific Analysis**: Modify the prompts to target specific industries or job roles.

## Feedback and Improvements

If you have suggestions or find issues, please update this documentation or create issues in the project repository. 