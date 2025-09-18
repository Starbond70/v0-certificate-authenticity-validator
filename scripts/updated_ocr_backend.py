"""
Updated OCR Backend with MongoDB Integration
"""

import os
import hashlib
import json
import cv2
import numpy as np
import pytesseract
from PIL import Image
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from transformers import LayoutLMv3Processor, LayoutLMv3ForTokenClassification
import torch
from typing import Dict, List, Optional
import re
from datetime import datetime
import base64
import io

# Import database module
from database import CertificateDatabase


# Initialize database
db = CertificateDatabase()

class CertificateOCR:
    # ... existing methods ...
    
    def process_certificate(self, image_data: bytes, filename: str = None, uploaded_by: str = None) -> Dict:
        """
        Main processing pipeline with database integration
        """
        try:
            # Convert bytes to numpy array
            nparr = np.frombuffer(image_data, np.uint8)
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            if image is None:
                raise ValueError("Could not decode image")
            
            start_time = datetime.now()
            
            # Step 1: Preprocess image
            preprocessed = self.preprocess_image(image)
            
            # Step 2: Extract text with Tesseract
            ocr_result = self.extract_text_tesseract(preprocessed)
            
            # Step 3: Extract structured fields
            extracted_fields = self.extract_fields_with_patterns(ocr_result['raw_text'])
            
            # Step 4: Process with LayoutLMv3 for enhanced accuracy
            pil_image = Image.fromarray(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
            layout_result = self.process_with_layoutlmv3(pil_image, ocr_result)
            
            # Step 5: Generate hash
            certificate_hash = self.generate_hash(extracted_fields)
            
            # Calculate processing time
            processing_time = (datetime.now() - start_time).total_seconds()
            
            # Calculate overall confidence
            base_confidence = sum([item['confidence'] for item in ocr_result['structured_data']]) / len(ocr_result['structured_data']) if ocr_result['structured_data'] else 0
            layout_confidence = layout_result['layout_confidence']
            overall_confidence = (base_confidence * 0.6 + layout_confidence * 0.4)
            
            # Prepare data for database storage
            certificate_data = {
                **extracted_fields,
                'hash': certificate_hash,
                'confidence': round(overall_confidence, 2),
                'filename': filename,
                'file_size': len(image_data),
                'uploaded_by': uploaded_by,
                'processing_info': {
                    'tesseract_confidence': round(base_confidence, 2),
                    'layout_confidence': round(layout_confidence, 2),
                    'enhanced_extraction': layout_result['enhanced_extraction']
                },
                'file_type': 'image/jpeg',  # Detect actual type in production
                'processing_time': processing_time
            }
            
            # Store in database
            db_result = db.store_certificate(certificate_data)
            
            return {
                'success': True,
                'extracted_data': extracted_fields,
                'hash': certificate_hash,
                'confidence': round(overall_confidence, 2),
                'raw_text': ocr_result['raw_text'],
                'processing_info': {
                    'tesseract_confidence': round(base_confidence, 2),
                    'layout_confidence': round(layout_confidence, 2),
                    'enhanced_extraction': layout_result['enhanced_extraction'],
                    'processing_time': processing_time
                },
                'database_stored': db_result['success'],
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }

# ... existing FastAPI setup ...

@app.post("/process-certificate")
async def process_certificate(file: UploadFile = File(...), uploaded_by: str = "anonymous"):
    """
    Process uploaded certificate and store in database
    """
    # ... existing validation ...
    
    # Process the certificate with database integration
    result = ocr_processor.process_certificate(contents, file.filename, uploaded_by)
    
    if not result['success']:
        raise HTTPException(status_code=500, detail=f"Processing failed: {result['error']}")
    
    return {
        "filename": file.filename,
        "extracted_data": result['extracted_data'],
        "hash": result['hash'],
        "confidence": result['confidence'],
        "processing_info": result['processing_info'],
        "database_stored": result['database_stored'],
        "timestamp": result['timestamp']
    }

@app.post("/verify-hash")
async def verify_hash(hash_data: Dict):
    """
    Verify if a hash exists in the database
    """
    provided_hash = hash_data.get('hash', '')
    
    if not provided_hash:
        raise HTTPException(status_code=400, detail="Hash is required")
    
    # Verify against database
    result = db.verify_certificate_by_hash(provided_hash)
    
    return result

@app.get("/search-certificate/{certificate_id}")
async def search_certificate(certificate_id: str):
    """
    Search for certificate by ID
    """
    result = db.search_certificate_by_id(certificate_id)
    return result

@app.get("/admin/certificates")
async def get_all_certificates(limit: int = 100, status: str = None):
    """
    Get all certificates (admin endpoint)
    """
    certificates = db.get_all_certificates(limit, status)
    return {"certificates": certificates, "count": len(certificates)}

@app.get("/admin/stats")
async def get_database_stats():
    """
    Get database statistics (admin endpoint)
    """
    stats = db.get_database_stats()
    return stats

@app.get("/user/{user_id}/certificates")
async def get_user_certificates(user_id: str, limit: int = 50):
    """
    Get certificates for a specific user
    """
    certificates = db.get_certificates_by_user(user_id, limit)
    return {"certificates": certificates, "count": len(certificates)}

# ... rest of existing code ...
