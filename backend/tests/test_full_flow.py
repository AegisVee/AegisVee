import pytest
from fastapi.testclient import TestClient
from main import app
import json
import os

client = TestClient(app)

def test_full_requirement_flow():
    # 1. Update/Save a requirement
    new_reqs = [
        {
            "key": "1",
            "id": "REQ-FULL-TEST",
            "description": "Integration Test Requirement",
            "testSteps": "Step 1\nStep 2",
            "expectedResult": "Success",
            "status": "Pending",
            "linkedApis": []
        }
    ]
    response = client.post("/api/rag/requirements", json=new_reqs)
    assert response.status_code == 200
    
    # 2. Verify it's saved
    response = client.get("/api/rag/requirements")
    assert response.status_code == 200
    data = response.json()
    assert any(r["id"] == "REQ-FULL-TEST" for r in data)

    # 3. Generate code for it (Mocked LLM in test env)
    response = client.post("/api/generate-code", json={"requirement": "Integration Test Requirement"})
    assert response.status_code == 200
    assert "code" in response.json()

    # 4. Run HIL script
    test_script = """
def test_integration():
    print("Executing integration test script")
    assert True
"""
    response = client.post("/api/run_script", json={"script": test_script})
    assert response.status_code == 200
    assert "output" in response.json()
    assert "TEST RESULT: PASS" in response.json()["output"]

def test_latency_header():
    response = client.get("/")
    assert "X-Process-Time" in response.headers
    print(f"Latency: {response.headers['X-Process-Time']}s")
