import requests
import sys
import webbrowser

def check_backend_status():
    """Check if the backend server is running"""
    try:
        response = requests.get('http://localhost:5000/', timeout=3)
        if response.status_code == 200:
            print("✅ Backend server is running!")
            return True
    except requests.exceptions.ConnectionError:
        print("❌ Backend server is not running!")
        return False
    except Exception as e:
        print(f"❌ Error checking backend: {str(e)}")
        return False

def main():
    print("\n=== CV Analyzer Backend Check ===\n")
    
    backend_running = check_backend_status()
    
    if not backend_running:
        print("\n🔧 Troubleshooting Steps:")
        print("  1. Make sure you've installed all dependencies:")
        print("     pip install -r requirements.txt")
        print("\n  2. Start the backend server using one of these methods:")
        print("     • Run both frontend and backend:")
        print("       python run.py")
        print("     • Run just the backend:")
        print("       python backend.py")
        
        print("\n  3. Make sure you have a valid Google Gemini API key in your .env file")
        print("     GOOGLE_API_KEY=your_api_key_here")
        
        choice = input("\nWould you like to start the servers now? (y/n): ").strip().lower()
        if choice == 'y':
            print("\nStarting servers...")
            # Open a new command prompt window with the run script
            if sys.platform == 'win32':
                import subprocess
                subprocess.Popen('start cmd /k python run.py', shell=True)
            else:
                print("Please run the following command in a terminal:")
                print("python run.py")
        
        print("\nFor more help, refer to the README.md file.")
    else:
        choice = input("\nWould you like to open the CV Analyzer in your browser? (y/n): ").strip().lower()
        if choice == 'y':
            webbrowser.open('http://localhost:3000')
        
        print("\nThe CV Analyzer is ready to use!")

if __name__ == "__main__":
    main() 