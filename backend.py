from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv
import os
import io
import sys
import pdfplumber  # Using pdfplumber instead of PyPDF2
import traceback
import requests
import json
import base64
# Use explicit import from python-docx package
import docx

load_dotenv()

MISTRAL_API_KEY = os.getenv("MISTRAL_API_KEY")

if not MISTRAL_API_KEY:
    raise ValueError("No MISTRAL_API_KEY found in environment variables")

app = Flask(__name__)
# Enable CORS for all origins to help with local development
CORS(app, resources={r"/*": {"origins": "*"}})

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
        
        # Get file extension
        file_ext = os.path.splitext(file.filename)[1].lower()
        
        # Validate file type
        if file_ext not in ['.pdf', '.docx', '.txt']:
            return jsonify({'error': f'Unsupported file format: {file_ext}. Only PDF, DOCX, and TXT files are allowed.'}), 400
        
        # Read the file content
        file_content = file.read()
        
        # STEP 1: Extract text using OCR for PDFs and images
        # For non-PDF files, we'll use regular text extraction
        if file_ext == '.pdf':
            try:
                # First try with Mistral OCR for better results
                cv_text = extract_text_with_ocr(file_content)
            except Exception as e:
                print(f"OCR extraction failed, falling back to pdfplumber: {str(e)}")
                # Fallback to pdfplumber if OCR fails
                cv_text = extract_text_from_pdf(file_content)
        elif file_ext == '.docx':
            cv_text = extract_text_from_docx(file_content)
        else:  # .txt
            cv_text = file_content.decode('utf-8')
            
        # STEP 2: Analyze the extracted text
        analysis_result = analyze_cv_text(cv_text, analysis_language)
        
        return jsonify(analysis_result)
        
    except Exception as e:
        print("Error processing CV:", str(e))
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

def extract_text_with_ocr(file_content):
    """Extract text from document using Mistral OCR API"""
    print("Using Mistral OCR API for text extraction...")
    
    api_url = "https://api.mistral.ai/v1/ocr"
    
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": f"Bearer {MISTRAL_API_KEY}"
    }
    
    # Convert file content to base64
    file_base64 = base64.b64encode(file_content).decode('utf-8')
    
    payload = {
        "model": "mistral-ocr-latest",
        "document": {
            "type": "base64",
            "base64": file_base64
        }
    }
    
    response = requests.post(api_url, headers=headers, json=payload)
    
    if response.status_code != 200:
        raise Exception(f"OCR Error: {response.status_code} - {response.text}")
    
    # Extract and return the OCR text
    result = response.json()
    
    # The OCR API returns structured document content
    # We'll concatenate all the text from all pages
    extracted_text = ""
    
    # Extract text based on the OCR API response format
    # This may need adjustment based on the actual response structure
    if "pages" in result:
        for page in result["pages"]:
            if "content" in page:
                extracted_text += page["content"] + "\n\n"
            elif "text" in page:
                extracted_text += page["text"] + "\n\n"
    elif "text" in result:
        extracted_text = result["text"]
    
    return extracted_text

def extract_text_from_pdf(file_content):
    """Extract text from PDF using pdfplumber (fallback method)"""
    print("Using pdfplumber for PDF text extraction...")
    text = ""
    with pdfplumber.open(io.BytesIO(file_content)) as pdf:
        for page in pdf.pages:
            text += page.extract_text() or ""
            text += "\n\n"  # Add spacing between pages
    return text

def extract_text_from_docx(file_content):
    """Extract text from DOCX file"""
    print("Extracting text from DOCX...")
    doc = docx.Document(io.BytesIO(file_content))
    text = ""
    for para in doc.paragraphs:
        text += para.text + "\n"
    return text

def analyze_cv_text(cv_text, language='en'):
    """Analyze CV text using Mistral AI models"""
    print(f"Analyzing CV text in {language} language...")
    
    # Construct the prompt based on the selected language
    if language == 'tr':
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
        "model": "mistral-large-latest",  # Using the chat model for analysis
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
        return jsonify({'error': f'Error from Mistral API: {response.text}'}), 500
    
    # Parse the response
    result = response.json()
    
    # Extract the content from the response
    analysis_content = result['choices'][0]['message']['content']
    
    try:
        # Parse the JSON content
        analysis_json = json.loads(analysis_content)
        
        # Return the analysis as a dictionary with proper keys
        return {
            "analysis": analysis_json
        }
    except json.JSONDecodeError:
        # If JSON parsing fails, return the raw content
        return {
            "analysis": {
                "overall_impression": "Error parsing structured response. Here is the raw analysis:",
                "raw_response": analysis_content
            }
        }

if __name__ == "__main__":
    # Get port from environment variable or use default
    port = int(os.environ.get("PORT", 5000))
    
    # Print a message to indicate the server is running
    print(f"CV Analyzer API running on http://localhost:{port}")
    
    # Run the Flask app with debug mode
    app.run(host='0.0.0.0', port=port, debug=True)
