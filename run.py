import subprocess
import os
import sys
import time
import webbrowser
import signal

def run_command(command, cwd=None):
    """Run a command in a subprocess"""
    if sys.platform == 'win32':
        return subprocess.Popen(command, cwd=cwd, shell=True, creationflags=subprocess.CREATE_NEW_CONSOLE)
    else:
        return subprocess.Popen(command, cwd=cwd, shell=True)

def main():
    print("Starting CV Analyzer application...")
    
    # Start the Flask backend server
    print("Starting Flask backend server...")
    backend_process = run_command("python backend.py")
    
    time.sleep(2)  # Give the backend server a moment to start
    
    # Start the Next.js frontend in development mode
    print("Starting Next.js frontend...")
    frontend_process = run_command("npm run dev", cwd="cv-analyzer")
    
    print("\n")
    print("===========================================================")
    print("CV Analyzer is running!")
    print("* Backend API: http://localhost:5000")
    print("* Frontend UI: http://localhost:3000")
    print("===========================================================")
    print("\nPress Ctrl+C to stop all servers\n")
    
    # Open the frontend in the default browser
    time.sleep(3)  # Wait for Next.js to start
    webbrowser.open("http://localhost:3000")
    
    # Keep the script running until Ctrl+C
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nShutting down servers...")
        
        # Kill the processes
        if backend_process:
            if sys.platform == 'win32':
                backend_process.kill()
            else:
                os.killpg(os.getpgid(backend_process.pid), signal.SIGTERM)
                
        if frontend_process:
            if sys.platform == 'win32':
                frontend_process.kill()
            else:
                os.killpg(os.getpgid(frontend_process.pid), signal.SIGTERM)
                
        print("All servers stopped. Goodbye!")

if __name__ == "__main__":
    main() 