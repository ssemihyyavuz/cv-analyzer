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
        
        # Handle different file types
        if file_ext == '.pdf':
            # Save uploaded file temporarily
            temp_path = 'temp_resume.pdf'
            file.save(temp_path)
            
            try:
                # Extract text from PDF using pdfplumber
                pdf_text = ""
                with pdfplumber.open(temp_path) as pdf:
                    for page in pdf.pages:
                        extracted_text = page.extract_text()
                        if extracted_text:
                            pdf_text += extracted_text + "\n\n"
                
                # Clean up temp file
                os.remove(temp_path)
                
                # If text extraction successful
                if pdf_text.strip():
                    return analyze_cv_text(pdf_text, analysis_language)
                else:
                    return jsonify({'error': 'Could not extract text from the PDF. The file may be scanned or protected.'}), 400
                    
            except Exception as e:
                # Clean up temp file if it exists
                if os.path.exists(temp_path):
                    os.remove(temp_path)
                raise e
        
        elif file_ext == '.docx':
            # For DOCX files, we'd typically use a library like python-docx
            # For now, just return an error message
            return jsonify({'error': 'DOCX support is coming soon. Please upload a PDF file.'}), 400
            
        elif file_ext == '.txt':
            # For TXT files, simply read the content
            text_content = file.read().decode('utf-8')
            if text_content.strip():
                return analyze_cv_text(text_content, analysis_language)
            else:
                return jsonify({'error': 'The TXT file is empty.'}), 400
    
    except Exception as e:
        print("Error processing file:", str(e))
        traceback.print_exc()
        return jsonify({'error': f'Error processing file: {str(e)}'}), 500

def analyze_cv_text(cv_text, language='en'):
    """Analyze the CV text using Mistral AI"""
    try:
        # Determine the language for the analysis
        is_english = language == 'en'
        
        # Create prompt for analysis based on the language
        if is_english:
            prompt = f"""
            You are a professional CV/resume analyzer. I will provide you with the text extracted from a resume, and you need to analyze it professionally and provide detailed feedback.
            
            Please analyze the resume and provide the following sections:
            
            1. Overall Impression: A brief summary of the CV's strengths and weaknesses.
            2. ATS Score: Evaluate the resume's compatibility with Applicant Tracking Systems on a scale of 0-100.
            3. Strengths: List 3-5 positive aspects of the resume.
            4. Areas for Improvement: List 3-5 aspects that could be improved.
            5. Recommendations: Provide 3-5 specific, actionable recommendations to improve the resume.
            6. Keyword Suggestions: Suggest 5-10 relevant keywords that the candidate should consider including.
            
            Format your response as structured JSON with the following keys: overall_impression, ats_score (numeric), strengths (array), areas_for_improvement (array), recommendations (array), and keyword_suggestions (array).
            
            Here is the resume text:
            
            {cv_text}
            """
        else:
            prompt = f"""
            Sen profesyonel bir CV analiz uzmanısın. Sana bir CV'den çıkarılan metni vereceğim ve bunu profesyonelce analiz edip detaylı geri bildirim sağlamanı istiyorum.
            
            Lütfen CV'yi analiz et ve aşağıdaki bölümleri sağla:
            
            1. Genel İzlenim: CV'nin güçlü ve zayıf yönlerinin kısa bir özeti.
            2. ATS Puanı: CV'nin Başvuru Takip Sistemleri ile uyumluluğunu 0-100 ölçeğinde değerlendir.
            3. Güçlü Yönler: CV'nin 3-5 olumlu yönünü listele.
            4. İyileştirme Alanları: İyileştirilebilecek 3-5 yönü listele.
            5. Öneriler: CV'yi geliştirmek için 3-5 spesifik, uygulanabilir öneri sun.
            6. Anahtar Kelime Önerileri: Adayın dahil etmeyi düşünmesi gereken 5-10 ilgili anahtar kelime öner.
            
            Yanıtını şu anahtarlarla yapılandırılmış JSON formatında ver: overall_impression, ats_score (sayısal), strengths (dizi), areas_for_improvement (dizi), recommendations (dizi) ve keyword_suggestions (dizi).
            
            İşte CV metni:
            
            {cv_text}
            """
        
        # Send text to Mistral AI for analysis
        api_url = "https://api.mistral.ai/v1/chat/completions"
        
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": f"Bearer {MISTRAL_API_KEY}"
        }
        
        payload = {
            "model": "mistral-large-latest",  # Using Mistral's most capable model
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
        
        # Parse the JSON content
        try:
            analysis_data = json.loads(analysis_content)
            
            # Return the structured analysis result
            return jsonify({
                'analysis': analysis_data
            })
        
        except json.JSONDecodeError:
            # If the response is not valid JSON, return the raw text
            print("Error parsing JSON from Mistral response")
            print(analysis_content)
            return jsonify({
                'analysis': {
                    'overall_impression': 'Error parsing AI response. Please try again.',
                    'ats_score': 50,
                    'strengths': [],
                    'areas_for_improvement': [],
                    'recommendations': [],
                    'keyword_suggestions': []
                }
            })
            
    except Exception as e:
        print("Error during AI analysis:", str(e))
        traceback.print_exc()
        return jsonify({'error': f'Error analyzing CV: {str(e)}'}), 500

if __name__ == '__main__':
    print("CV Analyzer API running on http://localhost:5000")
    app.run(debug=True, host='0.0.0.0')