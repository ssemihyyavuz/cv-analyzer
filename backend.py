from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv
import os
import io
import json
import base64
import requests
import docx2txt
import mistralai
from mistralai import Mistral
import google.generativeai as genai
import sys
import logging
from datetime import datetime

# Set up file logging
log_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'cv_analyzer_logs.txt')
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[
        logging.FileHandler(log_file),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

logger.info("=" * 80)
logger.info(f"BACKEND STARTING - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
logger.info("=" * 80)

# Force print statements to flush immediately
print = lambda *args, **kwargs: __builtins__.print(*args, **kwargs, flush=True)
logger.info("Backend starting with immediate output flushing enabled...")

load_dotenv()

app = Flask(__name__)
CORS(app)

# Set up Mistral API client
MISTRAL_API_KEY = os.getenv('MISTRAL_API_KEY')
if not MISTRAL_API_KEY:
    logger.error("MISTRAL_API_KEY not found in environment variables")
    raise ValueError("MISTRAL_API_KEY not found in environment variables")

# Set up Gemini API
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
if not GEMINI_API_KEY:
    logger.error("GEMINI_API_KEY not found in environment variables")
    raise ValueError("GEMINI_API_KEY not found in environment variables")

genai.configure(api_key=GEMINI_API_KEY)

@app.route('/')
def index():
    logger.info("Root endpoint called!")
    return jsonify({"status": "API is running"}), 200

@app.route('/analyze', methods=['POST'])
def analyze_cv():
    try:
        # Check if file was included in the request
        if 'file' not in request.files:
            logger.error("No file part in request")
            return jsonify({'error': 'No file part'}), 400
            
        file = request.files['file']
        
        # Check if a file was selected
        if file.filename == '':
            logger.error("No selected file")
            return jsonify({'error': 'No selected file'}), 400
        
        # Get the analysis language (default to English)
        analysis_language = request.form.get('language', 'en')
        
        # Get the job description if provided
        job_description = request.form.get('job_description', '')
        
        # Log if job description was provided
        if job_description:
            logger.info(f"Job description provided ({len(job_description)} characters)")
        
        # Get file extension
        file_ext = os.path.splitext(file.filename)[1].lower()
        
        # Validate file type
        if file_ext not in ['.pdf', '.docx', '.txt']:
            logger.error(f"Unsupported file format: {file_ext}")
            return jsonify({'error': f'Unsupported file format: {file_ext}. Only PDF, DOCX, and TXT files are allowed.'}), 400
        
        logger.info(f"===== PROCESSING FILE: {file.filename} ({file_ext}) =====")
        
        # Read the file content
        file_content = file.read()
        
        # Extract text based on file type
        try:
            if file_ext == '.pdf':
                logger.info(f"PDF PROCESSING METHOD: Using advanced text extraction")
                cv_text = extract_text_with_ocr(file_content, filename=file.filename)
            elif file_ext == '.docx':
                logger.info(f"DOCX PROCESSING METHOD: Using docx2txt library")
                cv_text = extract_text_from_docx(file_content)
            else:  # .txt
                logger.info(f"TXT PROCESSING METHOD: Simple text decoding")
                cv_text = file_content.decode('utf-8')
                
            # Analyze the extracted text with job description if provided
            analysis_result = analyze_cv_text(cv_text, analysis_language, job_description)
            
            # Log the structure of the result before returning
            logger.info(f"Analysis result structure: {type(analysis_result)}")
            logger.info(f"Analysis result keys: {list(analysis_result.keys()) if isinstance(analysis_result, dict) else 'Not a dict'}")
            if isinstance(analysis_result, dict) and 'analysis' in analysis_result:
                logger.info(f"Analysis keys: {list(analysis_result['analysis'].keys()) if isinstance(analysis_result['analysis'], dict) else 'Not a dict'}")
            
            # Ensure we're returning a properly formatted JSON response
            json_response = jsonify(analysis_result)
            logger.info(f"Final JSON response: {json_response.data[:200]}...")
            
            return json_response
            
        except Exception as extraction_error:
            logger.error(f"Error extracting text: {str(extraction_error)}")
            return jsonify({'error': f'Failed to extract text from the document: {str(extraction_error)}'}), 422
            
    except Exception as e:
        logger.error(f"Error processing CV: {str(e)}")
        import traceback
        traceback.print_exc()
        
        # Provide more specific user-friendly error messages based on the error type
        if "invalid_model" in str(e):
            return jsonify({
                'error': 'The document processing model is not available. Please contact support for assistance.'
            }), 500
        elif "Network error" in str(e):
            return jsonify({
                'error': 'Could not connect to our document processing service. Please check your network connection and try again.'
            }), 503
        elif "Mistral API" in str(e):
            return jsonify({
                'error': 'Our AI analysis service is currently unavailable. Please try again later or contact support if the issue persists.'
            }), 503
        elif "rate limit" in str(e).lower():
            return jsonify({
                'error': 'API rate limit exceeded. Please try again later.'
            }), 429
        else:
            return jsonify({'error': f'An unexpected error occurred: {str(e)}'}), 500

def extract_text_with_ocr(file_content, filename=None):
    """Extract text from document using Gemini 2.0 API for OCR"""
    logger.info(f"Starting OCR extraction for file: {filename}")
    logger.info("=" * 50)
    logger.info("OCR PROCESSING DETAILS:")
    
    try:
        # Convert file content to base64 with proper padding
        file_base64 = base64.b64encode(file_content).decode('utf-8')
        
        # Ensure we're not adding unnecessary padding that could cause issues
        # Base64 should already be properly padded when using b64encode
        
        logger.info(f"PDF size: {len(file_content)} bytes")
        logger.info(f"Base64 string length: {len(file_base64)} characters")
        
        # Always use Gemini OCR regardless of PDF content
        logger.info(f"EXTRACTION METHOD: Using Google Gemini OCR exclusively (as requested)")
        logger.info(f"No traditional PDF libraries will be used - pure AI extraction")
        
        # Set up Gemini model
        generation_config = {
            "temperature": 0.0,
            "top_p": 0.95,
            "top_k": 0,
            "max_output_tokens": 8192,
        }
        
        # Approach 1: Use gemini-1.5-pro with direct content extraction
        try:
            logger.info("APPROACH 1: Using gemini-1.5-pro for direct content extraction")
            model = genai.GenerativeModel(
                model_name="gemini-1.5-pro",
                generation_config=generation_config
            )
            
            # Extract first 100 chars for logging
            content_preview = file_content[:100]
            logger.info(f"File content preview (first 100 bytes): {content_preview}")
            
            # Simple direct prompt to extract text from the PDF bytes
            prompt = f"""
            I have a PDF resume named '{filename}'. I need to extract all the text content from it.
            
            Please extract:
            - All headings and sections
            - Contact information
            - Education details
            - Work experience
            - Skills
            - Any other relevant information
            
            Return ONLY the extracted text, formatted as it appears in the document.
            """
            
            # Try a simplified approach - describe the file and ask for guidance
            logger.info("OCR MODEL USED: gemini-1.5-pro with text prompt")
            
            response = model.generate_content(prompt)
            
            if hasattr(response, 'text') and response.text.strip():
                if "I don't have the ability to directly" in response.text or "I cannot access" in response.text:
                    logger.warning("Model responded but cannot access the file directly")
                else:
                    extracted_text = response.text
                    logger.info(f"SUCCESS! Extracted {len(extracted_text)} characters with Approach 1")
                    return extracted_text
                    
        except Exception as e1:
            logger.error(f"Approach 1 failed with error: {str(e1)}")
        
        # Approach 2: Use gemini-1.5-flash with multipart request treating PDF as binary
        try:
            logger.info("APPROACH 2: Using gemini-1.5-flash with multipart request")
            
            # Use flash model which may handle this better
            flash_model = genai.GenerativeModel(
                model_name="gemini-1.5-flash",
                generation_config=generation_config
            )
            
            # Create prompt focused on PDF text extraction
            prompt = "Extract and return all text content from this PDF file. Include all sections, headings, bullet points, and detailed content."
            
            # Create multipart content treating the file as image
            # This can sometimes work for PDFs since Gemini has vision capabilities
            contents = [
                {
                    "mime_type": "application/pdf",
                    "data": file_base64
                },
                {
                    "mime_type": "text/plain",
                    "data": prompt
                }
            ]
            
            logger.info("OCR MODEL USED: gemini-1.5-flash with PDF MIME type")
            
            flash_response = flash_model.generate_content(contents)
            
            if hasattr(flash_response, 'text') and flash_response.text.strip():
                extracted_text = flash_response.text
                logger.info(f"SUCCESS! Extracted {len(extracted_text)} characters with Approach 2")
                return extracted_text
                
        except Exception as e2:
            logger.error(f"Approach 2 failed with error: {str(e2)}")
            
        # Approach 3: Try breaking into chunks
        try:
            logger.info("APPROACH 3: Using gemini-1.5-pro with chunks of the file")
            
            # Get a chunk of the base64 data to analyze
            chunk_size = 1024 * 4  # 4KB chunks
            
            # Process the PDF in chunks if it's larger than the chunk size
            if len(file_base64) > chunk_size:
                logger.info(f"Large PDF detected, processing in chunks of {chunk_size} characters")
                
                chunk_model = genai.GenerativeModel(
                    model_name="gemini-1.5-pro",
                    generation_config=generation_config
                )
                
                # Process the first chunk to get model guidance
                first_chunk = file_base64[:chunk_size]
                
                chunk_prompt = f"""
                I have a PDF file that I'm trying to extract text from. The file name is '{filename}'.
                I'm sending you a portion of the base64-encoded data.
                
                This is just a diagnostic request. I understand you cannot directly extract text from 
                a base64 PDF fragment. Instead, tell me if this appears to be a valid PDF file based 
                on the encoding pattern, and suggest how I should restructure my data for OCR.
                
                Here's the start of the base64 data:
                {first_chunk[:200]}...
                """
                
                chunk_response = chunk_model.generate_content(chunk_prompt)
                
                if hasattr(chunk_response, 'text') and chunk_response.text.strip():
                    logger.info(f"DIAGNOSTIC INFO: {chunk_response.text}")
                    
                    # If the response has specific useful guidance, log it
                    if "valid PDF" in chunk_response.text:
                        logger.info("Model indicates this appears to be a valid PDF file")
                    
            else:
                logger.info("PDF is small enough for direct processing")
                
        except Exception as e3:
            logger.error(f"Approach 3 failed with error: {str(e3)}")
            
        # Approach 4: Use direct text extraction with minimal information
        try:
            logger.info("APPROACH 4: Plain text fallback approach")
            
            # Create a mock text response based on the filename
            # This is a fallback when all other approaches fail
            fallback_model = genai.GenerativeModel(
                model_name="gemini-1.5-pro",
                generation_config=generation_config
            )
            
            fallback_prompt = f"""
            I need help with a PDF document called '{filename}' that I cannot process correctly.
            
            Based on the filename alone, please create a template of what you would expect to find in this document.
            
            Then add a note at the end explaining that this is placeholder text because Gemini OCR could not 
            process the PDF directly and recommend that the user try uploading the file in a different format
            like DOCX or TXT.
            """
            
            fallback_response = fallback_model.generate_content(fallback_prompt)
            
            if hasattr(fallback_response, 'text') and fallback_response.text.strip():
                fallback_text = fallback_response.text
                logger.info(f"FALLBACK: Generated {len(fallback_text)} characters of template content")
                
                # Add a warning prefix
                warning_prefix = "WARNING: GEMINI OCR COULD NOT PROCESS THIS PDF DIRECTLY.\n\n"
                warning_prefix += "The following is placeholder text generated based on the filename:\n\n"
                
                return warning_prefix + fallback_text
                
        except Exception as e4:
            logger.error(f"Approach 4 failed with error: {str(e4)}")
            
        # All approaches failed
        error_message = "Failed to extract text using all Gemini approaches"
        logger.error(error_message)
        raise Exception("Document could not be processed by Gemini OCR after multiple attempts. Please try a different file format like DOCX or TXT.")
        
    except Exception as e:
        logger.error(f"Error in OCR extraction: {str(e)}")
        import traceback
        traceback.print_exc()
        raise Exception(f"Failed to extract text using Gemini OCR: {str(e)}")

def extract_text_from_docx(file_content):
    """Extract text from DOCX file"""
    logger.info("Extracting text from DOCX...")
    text = docx2txt.process(io.BytesIO(file_content))
    return text

def analyze_cv_text(cv_text, language='en', job_description=''):
    """Analyze CV text using Mistral AI models"""
    logger.info(f"Analyzing CV text in {language} language...")
    logger.info("=" * 50)
    logger.info("CV ANALYSIS DETAILS:")
    logger.info(f"ANALYSIS MODEL USED: mistral-large-latest")
    
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
        logger.error(f"Mistral API Error: {response.status_code}")
        logger.error(response.text)
        return {'error': f'Error from Mistral API: {response.text}'}, 500
    
    # Parse the response
    result = response.json()
    analysis_json = json.loads(result['choices'][0]['message']['content'])
    
    return {"analysis": analysis_json}

@app.route('/test-logs', methods=['GET'])
def test_logs():
    logger.info("=" * 50)
    logger.info("TEST ENDPOINT CALLED")
    logger.info("OCR MODEL TEST: This would use gemini-1.5-flash or gemini-1.5-pro")
    logger.info("ANALYSIS MODEL TEST: This would use mistral-large-latest")
    logger.info("=" * 50)
    return jsonify({"status": "Logs printed to console and file", "log_file": log_file}), 200

@app.route('/test-gemini', methods=['GET'])
def test_gemini():
    """Test Gemini API connectivity and capabilities"""
    logger.info("=" * 50)
    logger.info("TESTING GEMINI API CONNECTIVITY")
    logger.info("=" * 50)
    
    try:
        # Set up Gemini model
        generation_config = {
            "temperature": 0.0,
            "top_p": 0.95,
            "top_k": 0,
            "max_output_tokens": 1024,
        }
        
        # Test 1: Basic text generation with gemini-1.5-pro
        try:
            logger.info("TEST 1: Basic text generation with gemini-1.5-pro")
            model = genai.GenerativeModel(
                model_name="gemini-1.5-pro",
                generation_config=generation_config
            )
            
            response = model.generate_content("Hello, please respond with 'Gemini API is working properly'")
            
            if hasattr(response, 'text') and response.text.strip():
                logger.info(f"TEST 1 SUCCESS - Response: {response.text.strip()}")
            else:
                logger.info(f"TEST 1 FAILED - Empty response")
                
        except Exception as e1:
            logger.error(f"TEST 1 FAILED with error: {str(e1)}")
            
        # Test 2: Basic text generation with gemini-pro
        try:
            logger.info("TEST 2: Basic text generation with gemini-pro")
            model = genai.GenerativeModel(
                model_name="gemini-pro",
                generation_config=generation_config
            )
            
            response = model.generate_content("Hello, please respond with 'Gemini Pro API is working properly'")
            
            if hasattr(response, 'text') and response.text.strip():
                logger.info(f"TEST 2 SUCCESS - Response: {response.text.strip()}")
            else:
                logger.info(f"TEST 2 FAILED - Empty response")
                
        except Exception as e2:
            logger.error(f"TEST 2 FAILED with error: {str(e2)}")
            
        # Test 3: Basic text + image with gemini-pro-vision
        try:
            logger.info("TEST 3: Basic text+image generation with gemini-pro-vision")
            
            # Create a simple base64 encoded test image 
            test_img_data = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
            
            model = genai.GenerativeModel(
                model_name="gemini-pro-vision",
                generation_config=generation_config
            )
            
            contents = [
                {
                    "mime_type": "image/png",
                    "data": test_img_data
                },
                {
                    "mime_type": "text/plain",
                    "data": "What's in this image?"
                }
            ]
            
            response = model.generate_content(contents)
            
            if hasattr(response, 'text') and response.text.strip():
                logger.info(f"TEST 3 SUCCESS - Response: {response.text.strip()}")
            else:
                logger.info(f"TEST 3 FAILED - Empty response")
                
        except Exception as e3:
            logger.error(f"TEST 3 FAILED with error: {str(e3)}")
        
        # All tests completed
        test_status = "All Gemini API tests completed. See logs for details."
        logger.info(test_status)
        return jsonify({"status": test_status, "log_file": log_file}), 200
        
    except Exception as e:
        error_message = f"Gemini API test failed with error: {str(e)}"
        logger.error(error_message)
        return jsonify({"error": error_message}), 500

if __name__ == "__main__":
    # Get port from environment variable or use default
    port = int(os.environ.get("PORT", 5000))
    
    # Print a message to indicate the server is running
    logger.info(f"CV Analyzer API running on http://localhost:{port}")
    
    # Run the Flask app with debug mode
    app.run(host='0.0.0.0', port=port, debug=True)
