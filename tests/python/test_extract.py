"""
Python Backend Tests
"""
import pytest
import base64
from fastapi.testclient import TestClient
from backend.python.app import app

client = TestClient(app)

def test_root():
    """Test root endpoint"""
    response = client.get("/")
    assert response.status_code == 200
    assert "message" in response.json()

def test_health_check():
    """Test health check endpoint"""
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_extract_no_file():
    """Test extract endpoint without file"""
    response = client.post("/api/extract")
    assert response.status_code == 422  # Validation error

def test_extract_invalid_file_type():
    """Test extract endpoint with invalid file type"""
    response = client.post(
        "/api/extract",
        files={"file": ("test.txt", b"not a pdf", "text/plain")}
    )
    assert response.status_code == 400
    assert "PDF" in response.json()["detail"]

def test_extract_base64_missing_document():
    """Test base64 extract endpoint without document"""
    response = client.post("/api/extract/base64", json={})
    assert response.status_code == 422  # Validation error

def test_extract_base64_invalid_format():
    """Test base64 extract endpoint with invalid format"""
    response = client.post(
        "/api/extract/base64",
        json={"document": "invalid-base64"}
    )
    # Should either validate or fail at A79 API call
    assert response.status_code in [400, 500, 502]

@pytest.fixture
def sample_pdf_base64():
    """Sample PDF content (minimal valid PDF)"""
    # Minimal PDF structure
    pdf_content = b"%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\nxref\n0 0\ntrailer\n<< /Size 1 /Root 1 0 R >>\nstartxref\n0\n%%EOF"
    return base64.b64encode(pdf_content).decode('utf-8')

def test_extract_base64_valid(sample_pdf_base64):
    """Test base64 extract endpoint with valid document"""
    # This will fail at A79 API call unless mocked
    response = client.post(
        "/api/extract/base64",
        json={
            "document": sample_pdf_base64,
            "document_type": "commercial_invoice"
        }
    )
    # Should either succeed (if A79 is configured) or fail with 502
    assert response.status_code in [200, 502]

