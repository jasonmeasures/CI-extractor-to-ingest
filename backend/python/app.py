"""
Commercial Invoice PDF Extractor - Python Backend (FastAPI)
"""
from fastapi import FastAPI, File, UploadFile, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import Optional, List
import base64
import os
import logging
from datetime import datetime
import httpx
from contextlib import asynccontextmanager

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s]: %(message)s',
    handlers=[
        logging.FileHandler('logs/app.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Ensure logs directory exists
os.makedirs('logs', exist_ok=True)

# A79 API Configuration
A79_API_ENDPOINT = os.getenv('A79_API_ENDPOINT', 'https://your-a79-api.com/api/extract-invoice')
A79_API_KEY = os.getenv('A79_API_KEY', '')
A79_TIMEOUT = int(os.getenv('A79_TIMEOUT', '60000'))

# Request/Response Models
class ExtractRequest(BaseModel):
    document: str = Field(..., description="Base64 encoded PDF document")
    document_type: Optional[str] = Field(default="commercial_invoice")
    extract_fields: Optional[List[str]] = Field(default=[
        "line_items", "sku", "description", "hts_code",
        "country_of_origin", "quantity", "unit_price",
        "total_value", "weight", "unit_of_measure"
    ])
    format: Optional[str] = Field(default="line_items")

class LineItem(BaseModel):
    sku: str
    description: str
    hts_code: Optional[str] = "N/A"
    country_of_origin: Optional[str] = "N/A"
    package_count: Optional[str] = ""
    quantity: float
    net_weight: Optional[float] = 0
    gross_weight: Optional[float] = 0
    unit_price: float
    total_value: float
    unit_of_measure: Optional[str] = "EA"

class ExtractResponse(BaseModel):
    line_items: List[LineItem]
    metadata: Optional[dict] = None
    error: Optional[str] = None

# FastAPI App
app = FastAPI(
    title="Commercial Invoice PDF Extractor API",
    description="Extract line items from commercial invoice PDFs using A79 API",
    version="1.0.0"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv('FRONTEND_URL', 'http://localhost:3001').split(','),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    logger.info(f"Starting server - A79 Endpoint: {A79_API_ENDPOINT}")

@app.get("/")
async def root():
    return {
        "message": "Commercial Invoice PDF Extractor API",
        "version": "1.0.0",
        "endpoints": {
            "health": "/api/health",
            "extract": "/api/extract",
            "docs": "/docs"
        }
    }

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "a79_endpoint": A79_API_ENDPOINT if A79_API_ENDPOINT != 'https://your-a79-api.com/api/extract-invoice' else 'not configured'
    }

@app.post("/api/extract", response_model=ExtractResponse)
async def extract_from_file(file: UploadFile = File(...)):
    """
    Extract line items from uploaded PDF file
    """
    if file.content_type != 'application/pdf':
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    if file.size > 10 * 1024 * 1024:  # 10MB limit
        raise HTTPException(status_code=400, detail="File size exceeds 10MB limit")
    
    try:
        # Read file content
        content = await file.read()
        base64_data = base64.b64encode(content).decode('utf-8')
        
        logger.info(f"Processing file: {file.filename} ({len(content)} bytes)")
        
        # Call A79 API
        result = await call_a79_api({
            "document": base64_data,
            "document_type": "commercial_invoice",
            "extract_fields": [
                "line_items", "sku", "description", "hts_code",
                "country_of_origin", "quantity", "unit_price",
                "total_value", "weight", "unit_of_measure"
            ],
            "format": "line_items"
        })
        
        logger.info(f"Extraction successful: {len(result.get('line_items', []))} items")
        return result
        
    except Exception as e:
        logger.error(f"Extraction error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/extract/base64", response_model=ExtractResponse)
async def extract_from_base64(request: ExtractRequest):
    """
    Extract line items from base64 encoded PDF
    """
    try:
        logger.info("Processing base64 document")
        
        result = await call_a79_api({
            "document": request.document,
            "document_type": request.document_type,
            "extract_fields": request.extract_fields,
            "format": request.format
        })
        
        logger.info(f"Extraction successful: {len(result.get('line_items', []))} items")
        return result
        
    except Exception as e:
        logger.error(f"Extraction error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

async def call_a79_api(payload: dict) -> dict:
    """
    Call A79 API to extract line items
    """
    if A79_API_ENDPOINT == 'https://your-a79-api.com/api/extract-invoice':
        raise HTTPException(
            status_code=500,
            detail="A79_API_ENDPOINT not configured. Set environment variable."
        )
    
    headers = {
        "Content-Type": "application/json"
    }
    
    if A79_API_KEY:
        headers["Authorization"] = f"Bearer {A79_API_KEY}"
    
    try:
        async with httpx.AsyncClient(timeout=A79_TIMEOUT / 1000) as client:
            response = await client.post(
                A79_API_ENDPOINT,
                json=payload,
                headers=headers
            )
            response.raise_for_status()
            
            data = response.json()
            
            # Parse response structure
            if data.get('line_items'):
                return validate_response(data)
            elif data.get('data', {}).get('line_items'):
                return validate_response(data['data'])
            elif isinstance(data, list):
                return validate_response({"line_items": data})
            else:
                raise HTTPException(
                    status_code=502,
                    detail="Unable to parse A79 response format"
                )
                
    except httpx.HTTPError as e:
        logger.error(f"A79 API error: {str(e)}")
        raise HTTPException(
            status_code=502,
            detail=f"A79 API error: {str(e)}"
        )

def validate_response(data: dict) -> dict:
    """
    Validate and normalize A79 response
    """
    if not data.get('line_items') or not isinstance(data['line_items'], list):
        raise HTTPException(
            status_code=502,
            detail="Invalid response: line_items array not found"
        )
    
    # Validate each line item
    validated_items = []
    for index, item in enumerate(data['line_items']):
        # Ensure required fields
        if not item.get('sku') and not item.get('part_number') and not item.get('SKU'):
            item['sku'] = f"ITEM-{index + 1}"
        
        # Normalize numeric fields
        for field in ['quantity', 'unit_price', 'total_value', 'net_weight', 'gross_weight']:
            if field in item and isinstance(item[field], str):
                try:
                    item[field] = float(item[field])
                except ValueError:
                    item[field] = 0
        
        # Calculate total_value if missing
        if not item.get('total_value') and item.get('quantity') and item.get('unit_price'):
            item['total_value'] = item['quantity'] * item['unit_price']
        
        validated_items.append(item)
    
    return {
        **data,
        "line_items": validated_items
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 7000)))

