from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv
import os
import io
import json
import base64
import requests
import docx2txt
import pdfplumber
import mistralai
from mistralai import Mistral
import PyPDF2
import google.generativeai as genai

load_dotenv()

app = Flask(__name__)
CORS(app)

# Set up Mistral API client
MISTRAL_API_KEY = os.getenv('MISTRAL_API_KEY')
if not MISTRAL_API_KEY:
    raise ValueError("MISTRAL_API_KEY not found in environment variables")

# Set up Gemini API
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY not found in environment variables")

genai.configure(api_key=GEMINI_API_KEY)

@app.route('/')
def index():
    return jsonify({"status": "API is running"}), 200

@app.route('/analyze', methods=['POST'])
def analyze_cv():
    try:
        # Check if file was included in the request
        if 'file' not in request.files:
            return jsonify({'error': 'No file part'}), 400
            
        file = request.files['file']
        
        # Check if a file was selected
        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400
        
        # Get the analysis language (default to English)
        analysis_language = request.form.get('language', 'en')
        
        # Get the job description if provided
        job_description = request.form.get('job_description', '')
        
        # Log if job description was provided
        if job_description:
            print(f"Job description provided ({len(job_description)} characters)")
        
        # Get file extension
        file_ext = os.path.splitext(file.filename)[1].lower()
        
        # Validate file type
        if file_ext not in ['.pdf', '.docx', '.txt']:
            return jsonify({'error': f'Unsupported file format: {file_ext}. Only PDF, DOCX, and TXT files are allowed.'}), 400
        
        # Read the file content
        file_content = file.read()
        
        # Extract text based on file type
        try:
            if file_ext == '.pdf':
                # Use Gemini 2.0 for OCR
                cv_text = extract_text_with_ocr(file_content, filename=file.filename)
            elif file_ext == '.docx':
                cv_text = extract_text_from_docx(file_content)
            else:  # .txt
                cv_text = file_content.decode('utf-8')
                
            # Analyze the extracted text with job description if provided
            analysis_result = analyze_cv_text(cv_text, analysis_language, job_description)
            
            # Log the structure of the result before returning
            print(f"Analysis result structure: {type(analysis_result)}")
            print(f"Analysis result keys: {list(analysis_result.keys()) if isinstance(analysis_result, dict) else 'Not a dict'}")
            if isinstance(analysis_result, dict) and 'analysis' in analysis_result:
                print(f"Analysis keys: {list(analysis_result['analysis'].keys()) if isinstance(analysis_result['analysis'], dict) else 'Not a dict'}")
            
            # Ensure we're returning a properly formatted JSON response
            json_response = jsonify(analysis_result)
            print(f"Final JSON response: {json_response.data[:200]}...")
            
            return json_response
            
        except Exception as extraction_error:
            error_message = str(extraction_error)
            print("Error extracting text:", error_message)
            return jsonify({'error': f'Failed to extract text from the document: {error_message}'}), 422
            
    except Exception as e:
        error_message = str(e)
        print("Error processing CV:", error_message)
        import traceback
        traceback.print_exc()
        
        # Provide more specific user-friendly error messages based on the error type
        if "invalid_model" in error_message:
            return jsonify({
                'error': 'The document processing model is not available. Please contact support for assistance.'
            }), 500
        elif "Network error" in error_message:
            return jsonify({
                'error': 'Could not connect to our document processing service. Please check your network connection and try again.'
            }), 503
        elif "Mistral API" in error_message:
            return jsonify({
                'error': 'Our AI analysis service is currently unavailable. Please try again later or contact support if the issue persists.'
            }), 503
        elif "rate limit" in error_message.lower():
            return jsonify({
                'error': 'API rate limit exceeded. Please try again later.'
            }), 429
        else:
            return jsonify({'error': f'An unexpected error occurred: {error_message}'}), 500

def extract_text_with_ocr(file_content, filename=None):
    """Extract text from document using Gemini 2.0 API for OCR"""
    print(f"Starting OCR extraction for file: {filename}")
    
    try:
        # Convert file content to base64
        file_base64 = base64.b64encode(file_content).decode('utf-8')
        print(f"PDF size: {len(file_content)} bytes")
        print(f"Base64 string length: {len(file_base64)} characters")
        
        # Check if we're dealing with a selectable text PDF or scanned image
        print(f"Checking if PDF has selectable text or is scanned image...")
        has_selectable_text = False
        try:
            pdf_reader = PyPDF2.PdfReader(io.BytesIO(file_content))
            page_text = ""
            for page in pdf_reader.pages:
                page_text += page.extract_text() or ""
            has_selectable_text = bool(page_text.strip())
            print(f"PDF has selectable text: {has_selectable_text}")
            if has_selectable_text:
                print(f"Sample text from PDF: {page_text[:100]}...")
                # If PDF has selectable text, return it directly instead of using OCR
                if page_text.strip():
                    return page_text
        except Exception as pdf_err:
            print(f"Error checking PDF text: {str(pdf_err)}")
        
        # Set up Gemini model
        generation_config = {
            "temperature": 0.0,
            "top_p": 0.95,
            "top_k": 0,
            "max_output_tokens": 8192,
        }
        
        # Create model instance - using the most advanced Gemini model available
        model = genai.GenerativeModel(
            model_name="gemini-1.5-flash",  # Using Flash version for faster performance
            generation_config=generation_config
        )
        
        # Attempt with Flash model first, then fall back to Pro if needed
        try:
            # Create multipart content with the PDF
            contents = [
                {
                    "mime_type": "application/pdf",
                    "data": file_base64
                },
                {
                    "mime_type": "text/plain",
                    "data": "Extract all the text from this document. Include all content, headings, bullet points, and structured information. Maintain the original formatting as much as possible. Make sure to preserve all information in tables, sections, and lists."
                }
            ]
            
            print("Sending OCR request to Gemini 1.5 Flash API...")
            response = model.generate_content(contents)
            
        except Exception as flash_error:
            print(f"Gemini 1.5 Flash model failed: {str(flash_error)}. Trying Pro model instead...")
            
            # Fall back to Pro model
            pro_model = genai.GenerativeModel(
                model_name="gemini-1.5-pro",
                generation_config=generation_config
            )
            
            print("Sending OCR request to Gemini 1.5 Pro API...")
            response = pro_model.generate_content(contents)
        
        if not hasattr(response, 'text') or not response.text:
            error_message = "No text could be extracted from the document via Gemini OCR"
            print(error_message)
            raise Exception(error_message)
        
        extracted_text = response.text
        print(f"Successfully extracted {len(extracted_text)} characters of text")
        
        return extracted_text
    
    except Exception as e:
        print(f"Error in OCR extraction: {str(e)}")
        import traceback
        traceback.print_exc()
        raise Exception(f"Failed to extract text from PDF using Gemini OCR: {str(e)}")

def extract_text_from_docx(file_content):
    """Extract text from DOCX file"""
    print("Extracting text from DOCX...")
    text = docx2txt.process(io.BytesIO(file_content))
    return text

def extract_text_from_pdf(file_content):
    """Placeholder function that raises an error as we're only using OCR"""
    raise Exception("Direct PDF text extraction is disabled. The system relies only on Gemini OCR.")

def analyze_cv_text(cv_text, language='en', job_description=''):
    """Analyze CV text using Mistral AI models"""
    print(f"Analyzing CV text in {language} language...")
    
    # Construct the prompt based on the selected language and whether a job description was provided
    if language == 'tr':
        if job_description:
            prompt = f"""
            Bu bir özgeçmişi ve iş tanımını karşılaştırarak analiz etmen için bir istektir. Bu CV'yi değerlendir ve aşağıdaki yapılandırılmış biçimde bir analiz sağla:
            
            1. Genel İzlenim: CV'nin genel kalitesi hakkında 2-3 cümlelik bir özet değerlendirme.
            
            2. ATS Uyumluluğu Puanı: CV'nin bir Başvuru Takip Sisteminden (ATS) ne kadar iyi geçeceğinin 1-100 arası bir sayısal değerlendirmesi. Daha yüksek puan daha iyidir.
            
            3. İş Uyum Puanı: CV'nin verilen iş tanımına ne kadar iyi uyduğunun 1-100 arası bir sayısal değerlendirmesi. Daha yüksek puan daha iyidir.
            
            4. Güçlü Yönler: CV'nin 3-5 önemli güçlü yönü - adayın iyi yaptığı şeyler.
            
            5. İyileştirme Alanları: CV'nin 3-5 iyileştirme alanı - adayın geliştirmesi gereken şeyler.
            
            6. İş Odaklı Öneriler: CV'yi bu belirli iş için daha iyi hale getirmek için 3-5 somut, uygulanabilir öneri.
            
            7. Anahtar Kelime Önerileri: Adayın bu iş için dahil etmeyi düşünmesi gereken 5-10 ilgili anahtar kelime öner.
            
            Yanıtını şu anahtarlarla yapılandırılmış JSON formatında ver: overall_impression, ats_score (sayısal), job_match_score (sayısal), strengths (dizi), areas_for_improvement (dizi), job_specific_recommendations (dizi) ve keyword_suggestions (dizi).
            
            İşte CV metni:
            
            {cv_text}
            
            Ve iş tanımı:
            
            {job_description}
            """
        else:
            prompt = f"""
            Bu bir özgeçmişi analiz etmen için bir istektir. Bu CV'yi değerlendir ve aşağıdaki yapılandırılmış biçimde bir analiz sağla:
            
            1. Genel İzlenim: CV'nin genel kalitesi hakkında 2-3 cümlelik bir özet değerlendirme.
            
            2. ATS Uyumluluğu Puanı: CV'nin bir Başvuru Takip Sisteminden (ATS) ne kadar iyi geçeceğinin 1-100 arası bir sayısal değerlendirmesi. Daha yüksek puan daha iyidir.
            
            3. Güçlü Yönler: CV'nin 3-5 önemli güçlü yönü - adayın iyi yaptığı şeyler.
            
            4. İyileştirme Alanları: CV'nin 3-5 iyileştirme alanı - adayın geliştirmesi gereken şeyler.
            
            5. Öneriler: CV'yi geliştirmek için 3-5 somut, uygulanabilir öneri.
            
            6. Anahtar Kelime Önerileri: Adayın dahil etmeyi düşünmesi gereken 5-10 ilgili anahtar kelime öner.
            
            Yanıtını şu anahtarlarla yapılandırılmış JSON formatında ver: overall_impression, ats_score (sayısal), strengths (dizi), areas_for_improvement (dizi), recommendations (dizi) ve keyword_suggestions (dizi).
            
            İşte CV metni:
            
            {cv_text}
            """
    else:  # Default to English
        if job_description:
            prompt = f"""
            This is a request to analyze a resume/CV against a job description. Please evaluate this CV and provide an analysis in the following structured format:
            
            1. Overall Impression: A 2-3 sentence summary evaluation of the overall quality of the CV.
            
            2. ATS Compatibility Score: A numerical assessment on a scale of 1-100 of how well the CV would pass through an Applicant Tracking System (ATS). Higher is better.
            
            3. Job Match Score: A numerical assessment on a scale of 1-100 of how well the CV matches the provided job description. Higher is better.
            
            4. Strengths: 3-5 key strengths of the CV - things the candidate is doing well.
            
            5. Areas for Improvement: 3-5 areas where the CV could be improved - things the candidate should work on.
            
            6. Job-Specific Recommendations: 3-5 concrete, actionable recommendations to improve the CV specifically for this job.
            
            7. Keyword Suggestions: Suggest 5-10 relevant keywords from the job description that the candidate might consider including.
            
            Provide your response in structured JSON format with the keys: overall_impression, ats_score (numerical), job_match_score (numerical), strengths (array), areas_for_improvement (array), job_specific_recommendations (array), and keyword_suggestions (array).
            
            Here is the CV text:
            
            {cv_text}
            
            And the job description:
            
            {job_description}
            """
        else:
            prompt = f"""
            This is a request to analyze a resume/CV. Please evaluate this CV and provide an analysis in the following structured format:
            
            1. Overall Impression: A 2-3 sentence summary evaluation of the overall quality of the CV.
            
            2. ATS Compatibility Score: A numerical assessment on a scale of 1-100 of how well the CV would pass through an Applicant Tracking System (ATS). Higher is better.
            
            3. Strengths: 3-5 key strengths of the CV - things the candidate is doing well.
            
            4. Areas for Improvement: 3-5 areas where the CV could be improved - things the candidate should work on.
            
            5. Recommendations: 3-5 concrete, actionable recommendations to improve the CV.
            
            6. Keyword Suggestions: Suggest 5-10 relevant keywords that the candidate might consider including.
            
            Provide your response in structured JSON format with the keys: overall_impression, ats_score (numerical), strengths (array), areas_for_improvement (array), recommendations (array), and keyword_suggestions (array).
            
            Here is the CV text:
            
            {cv_text}
            """
    
    # Send text to Mistral AI for analysis using the chat completions API
    api_url = "https://api.mistral.ai/v1/chat/completions"
    
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": f"Bearer {MISTRAL_API_KEY}"
    }
    
    payload = {
        "model": "mistral-large-latest",  # Using the latest largest model for analysis
        "messages": [
            {"role": "system", "content": "You are a professional CV analysis assistant that specializes in parsing and analyzing resumes. You provide structured, helpful feedback on how to improve CVs."},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.3,  # Lower temperature for more consistent results
        "response_format": {"type": "json_object"}  # Ensure JSON response format
    }
    
    response = requests.post(api_url, headers=headers, json=payload)
    
    if response.status_code != 200:
        print(f"Mistral API Error: {response.status_code}")
        print(response.text)
        return {'error': f'Error from Mistral API: {response.text}'}, 500
    
    # Parse the response
    result = response.json()
    analysis_json = json.loads(result['choices'][0]['message']['content'])
    
    return {"analysis": analysis_json}

if __name__ == "__main__":
    # Get port from environment variable or use default
    port = int(os.environ.get("PORT", 5000))
    
    # Print a message to indicate the server is running
    print(f"CV Analyzer API running on http://localhost:{port}")
    
    # Run the Flask app with debug mode
    app.run(host='0.0.0.0', port=port, debug=True)
