
import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

try:
    from backend.rag_service import analyze_requirement_text, check_ollama_status
    
    print("Checking Ollama Status...")
    if check_ollama_status():
        print("PASS: Ollama is reachable.")
    else:
        print("FAIL: Ollama is NOT reachable.")
        sys.exit(1)

    print("Testing Requirement Analysis...")
    text = "The system should be fast."
    result = analyze_requirement_text(text)
    
    print("\n--- Analysis Result ---")
    print(f"Score: {result.score}")
    print(f"Improved: {result.improved_version}")
    
    if result.score is not None and len(result.improved_version) > 0:
         print("PASS: AI returned valid structured data.")
    else:
         print("FAIL: Invalid data returned.")

except Exception as e:
    print(f"ERROR: {e}")
    import traceback
    traceback.print_exc()
