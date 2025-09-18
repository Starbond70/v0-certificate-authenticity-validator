"""
Academic Certificate Authenticity Validator - OCR Backend API
FastAPI server with OCR pipeline using Tesseract, LayoutLMv3, and OpenCV
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

# Initialize FastAPI app
app = FastAPI(title="Certificate OCR API", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize LayoutLMv3 model (using a smaller model for demo)
print("Loading LayoutLMv3 model...")
processor = LayoutLMv3Processor.from_pretrained("microsoft/layoutlmv3-base")
model = LayoutLMv3ForTokenClassification.from_pretrained("microsoft/layoutlmv3-base")
print("Model loaded successfully!")

class CertificateOCR:
    def __init__(self):
        self.supported_formats = ['.pdf', '.jpg', '.jpeg', '.png']
        
    def preprocess_image(self, image: np.ndarray) -> np.ndarray:
        """
        Preprocess image using OpenCV for better OCR accuracy
        """
        # Convert to grayscale
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image
            
        # Apply Gaussian blur to reduce noise
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        
        # Apply adaptive thresholding
        thresh = cv2.adaptiveThreshold(
            blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2
        )
        
        # Morphological operations to clean up the image
        kernel = np.ones((2, 2), np.uint8)
        cleaned = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)
        
        # Deskew the image
        coords = np.column_stack(np.where(cleaned > 0))
        if len(coords) > 0:
            angle = cv2.minAreaRect(coords)[-1]
            if angle < -45:
                angle = -(90 + angle)
            else:
                angle = -angle
                
            if abs(angle) > 0.5:  # Only rotate if angle is significant
                (h, w) = cleaned.shape[:2]
                center = (w // 2, h // 2)
                M = cv2.getRotationMatrix2D(center, angle, 1.0)
                cleaned = cv2.warpAffine(cleaned, M, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
        
        return cleaned
    
    def extract_text_tesseract(self, image: np.ndarray) -> Dict:
        """
        Extract text using Tesseract OCR
        """
        # Configure Tesseract
        custom_config = r'--oem 3 --psm 6 -c tessedit_char_whitelist=0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz.,:-/% '
        
        # Extract text with bounding boxes
        data = pytesseract.image_to_data(image, config=custom_config, output_type=pytesseract.Output.DICT)
        
        # Filter out low confidence text
        filtered_text = []
        for i in range(len(data['text'])):
            if int(data['conf'][i]) > 30:  # Confidence threshold
                text = data['text'][i].strip()
                if text:
                    filtered_text.append({
                        'text': text,
                        'confidence': data['conf'][i],
                        'bbox': [data['left'][i], data['top'][i], data['width'][i], data['height'][i]]
                    })
        
        return {
            'raw_text': ' '.join([item['text'] for item in filtered_text]),
            'structured_data': filtered_text
        }
    
    def extract_fields_with_patterns(self, text: str) -> Dict:
        """
        Extract specific fields using regex patterns
        """
        fields = {
            'name': None,
            'roll_no': None,
            'certificate_id': None,
            'marks': None,
            'institution': None
        }
        
        # Patterns for different fields
        patterns = {
            'name': [
                r'(?:name|student|candidate)[\s:]+([A-Za-z\s]{2,50})',
                r'(?:this is to certify that)[\s]+([A-Za-z\s]{2,50})',
                r'(?:mr\.|ms\.|miss)[\s]+([A-Za-z\s]{2,50})'
            ],
            'roll_no': [
                r'(?:roll|reg|registration|student)[\s]*(?:no|number|id)[\s:]*([A-Z0-9]{4,20})',
                r'(?:roll|reg)[\s]*:[\s]*([A-Z0-9]{4,20})',
                r'([A-Z]{2}[0-9]{4,8})'
            ],
            'certificate_id': [
                r'(?:certificate|cert)[\s]*(?:no|number|id)[\s:]*([A-Z0-9-]{4,30})',
                r'(?:serial|ref)[\s]*(?:no|number)[\s:]*([A-Z0-9-]{4,30})',
                r'(CERT-[A-Z0-9-]{4,20})'
            ],
            'marks': [
                r'(?:marks|grade|score|percentage)[\s:]*([0-9]{1,3}\.?[0-9]*%?)',
                r'(?:secured|obtained)[\s]*([0-9]{1,3}\.?[0-9]*%?)',
                r'([0-9]{1,3}\.?[0-9]*%)'
            ],
            'institution': [
                r'(?:university|college|institute|school)[\s]*(?:of)?[\s]*([A-Za-z\s]{5,100})',
                r'(?:issued by|from)[\s]*([A-Za-z\s]{5,100})',
                r'([A-Za-z\s]*(?:university|college|institute))'
            ]
        }
        
        text_lower = text.lower()
        
        for field, field_patterns in patterns.items():
            for pattern in field_patterns:
                match = re.search(pattern, text_lower, re.IGNORECASE)
                if match and not fields[field]:
                    fields[field] = match.group(1).strip()
                    break
        
        return fields
    
    def process_with_layoutlmv3(self, image: Image.Image, ocr_data: Dict) -> Dict:
        """
        Use LayoutLMv3 for layout-aware field detection
        Note: This is a simplified implementation. In production, you'd need a model
        specifically fine-tuned for certificate layout understanding.
        """
        try:
            # Prepare inputs for LayoutLMv3
            encoding = processor(image, return_tensors="pt")
            
            # Run inference
            with torch.no_grad():
                outputs = model(**encoding)
            
            # For demo purposes, we'll use the OCR confidence as layout confidence
            # In a real implementation, you'd process the LayoutLMv3 outputs properly
            layout_confidence = min(95.0, max(60.0, 
                sum([item['confidence'] for item in ocr_data['structured_data']]) / 
                len(ocr_data['structured_data']) if ocr_data['structured_data'] else 60.0
            ))
            
            return {
                'layout_confidence': layout_confidence,
                'enhanced_extraction': True
            }
        except Exception as e:
            print(f"LayoutLMv3 processing error: {e}")
            return {
                'layout_confidence': 70.0,
                'enhanced_extraction': False
            }
    
    def generate_hash(self, extracted_data: Dict) -> str:
        """
        Generate SHA-256 hash of normalized extracted data
        """
        # Normalize the data for consistent hashing
        normalized_data = {
            'name': extracted_data.get('name', '').strip().upper(),
            'roll_no': extracted_data.get('roll_no', '').strip().upper(),
            'certificate_id': extracted_data.get('certificate_id', '').strip().upper(),
            'marks': extracted_data.get('marks', '').strip(),
            'institution': extracted_data.get('institution', '').strip().upper()
        }
        
        # Create JSON string and hash it
        json_string = json.dumps(normalized_data, sort_keys=True)
        return hashlib.sha256(json_string.encode()).hexdigest()
    
    def process_certificate(self, image_data: bytes) -> Dict:
        """
        Main processing pipeline
        """
        try:
            # Convert bytes to numpy array
            nparr = np.frombuffer(image_data, np.uint8)
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            if image is None:
                raise ValueError("Could not decode image")
            
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
            
            # Calculate overall confidence
            base_confidence = sum([item['confidence'] for item in ocr_result['structured_data']]) / len(ocr_result['structured_data']) if ocr_result['structured_data'] else 0
            layout_confidence = layout_result['layout_confidence']
            overall_confidence = (base_confidence * 0.6 + layout_confidence * 0.4)
            
            return {
                'success': True,
                'extracted_data': extracted_fields,
                'hash': certificate_hash,
                'confidence': round(overall_confidence, 2),
                'raw_text': ocr_result['raw_text'],
                'processing_info': {
                    'tesseract_confidence': round(base_confidence, 2),
                    'layout_confidence': round(layout_confidence, 2),
                    'enhanced_extraction': layout_result['enhanced_extraction']
                },
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }

# Initialize OCR processor
ocr_processor = CertificateOCR()

@app.get("/")
async def root():
    return {"message": "Certificate OCR API is running", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.post("/process-certificate")
async def process_certificate(file: UploadFile = File(...)):
    """
    Process uploaded certificate and extract structured data
    """
    # Validate file type
    if not file.filename.lower().endswith(('.png', '.jpg', '.jpeg', '.pdf')):
        raise HTTPException(status_code=400, detail="Unsupported file format")
    
    # Check file size (10MB limit)
    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 10MB)")
    
    # Process the certificate
    result = ocr_processor.process_certificate(contents)
    
    if not result['success']:
        raise HTTPException(status_code=500, detail=f"Processing failed: {result['error']}")
    
    return {
        "filename": file.filename,
        "extracted_data": result['extracted_data'],
        "hash": result['hash'],
        "confidence": result['confidence'],
        "processing_info": result['processing_info'],
        "timestamp": result['timestamp']
    }

@app.post("/verify-hash")
async def verify_hash(hash_data: Dict):
    """
    Verify if a hash exists in the system (mock implementation)
    """
    provided_hash = hash_data.get('hash', '')
    
    # Mock verification - in production, this would check against database
    mock_verified_hashes = [
        "a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890",
        "b2c3d4e5f6a7890123456789012345678901234567890123456789012345678901",
        "c4d5e6f7a8b9012345678901234567890123456789012345678901234567890123"
    ]
    
    is_verified = provided_hash in mock_verified_hashes
    
    return {
        "hash": provided_hash,
        "verified": is_verified,
        "timestamp": datetime.now().isoformat()
    }

if __name__ == "__main__":
    import uvicorn
    print("Starting Certificate OCR API server...")
    print("Make sure you have installed: pip install fastapi uvicorn opencv-python pytesseract pillow transformers torch")
    uvicorn.run(app, host="0.0.0.0", port=8000)
