# Certificate OCR Backend Setup

This directory contains the Python FastAPI backend for the Academic Certificate Authenticity Validator.

## Features

- **Advanced OCR Pipeline**: Combines Tesseract OCR with LayoutLMv3 for accurate text extraction
- **Image Preprocessing**: Uses OpenCV for image cleaning, deskewing, and noise reduction
- **Field Extraction**: Intelligent pattern matching to extract specific certificate fields
- **SHA-256 Hashing**: Generates blockchain-ready hashes for data integrity
- **RESTful API**: FastAPI-based endpoints for certificate processing and verification

## Installation

1. Install Python dependencies:
\`\`\`bash
pip install -r requirements.txt
\`\`\`

2. Install Tesseract OCR:
   - **Ubuntu/Debian**: `sudo apt-get install tesseract-ocr`
   - **macOS**: `brew install tesseract`
   - **Windows**: Download from https://github.com/UB-Mannheim/tesseract/wiki

3. Run the server:
\`\`\`bash
python ocr_backend.py
\`\`\`

The API will be available at `http://localhost:8000`

## API Endpoints

### POST /process-certificate
Upload and process a certificate file.

**Request**: Multipart form data with file
**Response**: 
\`\`\`json
{
  "filename": "certificate.pdf",
  "extracted_data": {
    "name": "John Smith",
    "roll_no": "CS2021001",
    "certificate_id": "CERT-2024-001",
    "marks": "85%",
    "institution": "University of Technology"
  },
  "hash": "a1b2c3d4e5f6...",
  "confidence": 92.5,
  "processing_info": {
    "tesseract_confidence": 88.2,
    "layout_confidence": 95.0,
    "enhanced_extraction": true
  },
  "timestamp": "2024-01-15T10:30:00"
}
\`\`\`

### POST /verify-hash
Verify if a hash exists in the system.

**Request**: 
\`\`\`json
{
  "hash": "a1b2c3d4e5f6..."
}
\`\`\`

**Response**:
\`\`\`json
{
  "hash": "a1b2c3d4e5f6...",
  "verified": true,
  "timestamp": "2024-01-15T10:30:00"
}
\`\`\`

## Processing Pipeline

1. **Image Preprocessing** (OpenCV):
   - Convert to grayscale
   - Apply Gaussian blur for noise reduction
   - Adaptive thresholding
   - Morphological operations
   - Automatic deskewing

2. **Text Extraction** (Tesseract OCR):
   - Optimized OCR configuration
   - Confidence-based filtering
   - Bounding box extraction

3. **Layout Analysis** (LayoutLMv3):
   - Layout-aware field detection
   - Enhanced accuracy for structured documents

4. **Field Extraction**:
   - Regex pattern matching for specific fields
   - Name, Roll Number, Certificate ID, Marks, Institution

5. **Hash Generation**:
   - Normalize extracted data
   - Generate SHA-256 hash for blockchain integration

## Configuration

- **File Size Limit**: 10MB
- **Supported Formats**: PDF, JPG, JPEG, PNG
- **Confidence Threshold**: 30% (configurable)
- **OCR Language**: English (configurable)

## Production Considerations

- Configure CORS origins appropriately
- Add authentication and rate limiting
- Use a proper database for hash storage
- Fine-tune LayoutLMv3 model for certificate layouts
- Add logging and monitoring
- Implement proper error handling and validation
