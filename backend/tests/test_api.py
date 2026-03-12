import pytest
from fastapi.testclient import TestClient
from main import app
import json

client = TestClient(app)

def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"status": "AegisVee Engine is Running"}

def test_get_sdk_metadata_not_found():
    # Assuming sdk_metadata.json might not exist in a fresh environment
    response = client.get("/api/sdk/metadata")
    if response.status_code == 200:
        data = response.json()
        assert "error" not in data or data["error"] == "SDK metadata not found. Please run parsing first."
    else:
        assert response.status_code == 200 # Should still return 200 but with error msg

def test_ingest_file_mock(tmp_path):
    # Create a dummy file
    d = tmp_path / "subdir"
    d.mkdir()
    p = d / "test.txt"
    p.write_text("hello world")
    
    with open(p, "rb") as f:
        response = client.post("/api/ingest", files={"file": ("test.txt", f, "text/plain")})
    
    assert response.status_code == 200
    assert "saved" in response.json()["info"]

def test_train_endpoint():
    response = client.post("/api/train")
    assert response.status_code == 200
    assert response.json()["status"] == "Training started"

@pytest.mark.async_session
def test_generate_code_no_requirement():
    response = client.post("/api/generate-code", json={"requirement": ""})
    assert response.json() == {"error": "Requirement is required"}
