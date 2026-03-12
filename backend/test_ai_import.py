import os
import sys
import json
from fastapi.testclient import TestClient

# Ensure we can import from the backend directory
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

try:
    from main import app
except Exception as e:
    print(f"FAILED TO IMPORT APP: {e}")
    sys.exit(1)

client = TestClient(app)

def test_ai_smart_import():
    filename = "dummy_requirements_100.xlsx"
    filepath = os.path.join(os.path.dirname(__file__), filename)
    
    if not os.path.exists(filepath):
        print(f"ERROR: {filename} not found.")
        sys.exit(1)
        
    print(f"Testing smart import with {filename}...")
    
    with open(filepath, "rb") as f:
        # FastAPI UploadFile testing requires providing a tuple for the file:
        # (filename, file_object, content_type)
        files = {"file": (filename, f, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}
        
        # Test the endpoint
        response = client.post("/api/projects/test-automation-project/requirements/import-smart", files=files)
        
        print("\n=== STATUS ===")
        print(f"Status Code: {response.status_code}")
        
        print("\n=== RESPONSE ===")
        try:
            res_json = response.json()
            if res_json.get("status") == "success":
                print(f"SUCCESS: Imported {res_json.get('imported_count')} requirements.")
            else:
                print(f"FAILED: Response body: {json.dumps(res_json, indent=2, ensure_ascii=False)}")
        except Exception as e:
            print(f"ERROR: Failed to parse JSON response. Content: {response.text[:500]}")
            
if __name__ == "__main__":
    test_ai_smart_import()
