"""
Database setup and initialization script
Creates collections, indexes, and sample data
"""

from database import CertificateDatabase
from datetime import datetime, timedelta
import hashlib
import json

def setup_database():
    """
    Initialize database with collections and sample data
    """
    print("Setting up Certificate Validator Database...")
    
    try:
        # Initialize database
        db = CertificateDatabase()
        
        # Create sample certificates
        sample_certificates = [
            {
                "certificate_id": "CERT-2024-001",
                "name": "John Smith",
                "roll_no": "CS2021001",
                "marks": "85%",
                "institution": "University of Technology",
                "filename": "degree_certificate_001.pdf",
                "file_size": 2048576,
                "uploaded_by": "admin",
                "confidence": 95.5,
                "processing_info": {
                    "tesseract_confidence": 92.0,
                    "layout_confidence": 98.0,
                    "enhanced_extraction": True
                },
                "file_type": "application/pdf",
                "processing_time": 3.2
            },
            {
                "certificate_id": "CERT-2024-002",
                "name": "Jane Doe",
                "roll_no": "EE2020005",
                "marks": "92%",
                "institution": "Engineering College",
                "filename": "transcript_002.jpg",
                "file_size": 1536000,
                "uploaded_by": "admin",
                "confidence": 88.7,
                "processing_info": {
                    "tesseract_confidence": 85.0,
                    "layout_confidence": 92.0,
                    "enhanced_extraction": True
                },
                "file_type": "image/jpeg",
                "processing_time": 2.8
            },
            {
                "certificate_id": "CERT-2024-003",
                "name": "Alice Johnson",
                "roll_no": "ME2019003",
                "marks": "88%",
                "institution": "Mechanical Engineering Institute",
                "filename": "diploma_003.png",
                "file_size": 3072000,
                "uploaded_by": "user123",
                "confidence": 91.2,
                "processing_info": {
                    "tesseract_confidence": 89.0,
                    "layout_confidence": 93.0,
                    "enhanced_extraction": True
                },
                "file_type": "image/png",
                "processing_time": 4.1
            }
        ]
        
        # Generate hashes and store certificates
        for cert_data in sample_certificates:
            # Generate hash
            normalized_data = {
                'name': cert_data['name'].strip().upper(),
                'roll_no': cert_data['roll_no'].strip().upper(),
                'certificate_id': cert_data['certificate_id'].strip().upper(),
                'marks': cert_data['marks'].strip(),
                'institution': cert_data['institution'].strip().upper()
            }
            json_string = json.dumps(normalized_data, sort_keys=True)
            cert_data['hash'] = hashlib.sha256(json_string.encode()).hexdigest()
            
            # Store in database
            result = db.store_certificate(cert_data)
            if result['success']:
                print(f"✓ Stored certificate: {cert_data['certificate_id']}")
            else:
                print(f"✗ Failed to store certificate: {cert_data['certificate_id']} - {result.get('error', 'Unknown error')}")
        
        # Create sample users
        sample_users = [
            {
                "user_id": "admin",
                "email": "admin@certvalidator.com",
                "name": "Admin User",
                "role": "admin"
            },
            {
                "user_id": "user123",
                "email": "john.doe@example.com",
                "name": "John Doe",
                "role": "verifier"
            },
            {
                "user_id": "user456",
                "email": "jane.smith@example.com",
                "name": "Jane Smith",
                "role": "verifier"
            }
        ]
        
        for user_data in sample_users:
            result = db.store_user(user_data)
            if result['success']:
                print(f"✓ Created user: {user_data['email']}")
            else:
                print(f"✗ Failed to create user: {user_data['email']} - {result.get('error', 'Unknown error')}")
        
        # Display database statistics
        stats = db.get_database_stats()
        print("\n📊 Database Statistics:")
        print(f"Total Certificates: {stats.get('total_certificates', 0)}")
        print(f"Verified Certificates: {stats.get('verified_certificates', 0)}")
        print(f"Pending Certificates: {stats.get('pending_certificates', 0)}")
        print(f"Total Users: {stats.get('total_users', 0)}")
        print(f"Verification Rate: {stats.get('verification_rate', 0)}%")
        
        print("\n✅ Database setup completed successfully!")
        
        # Test verification
        print("\n🧪 Testing certificate verification...")
        test_hash = sample_certificates[0]['hash']
        verification_result = db.verify_certificate_by_hash(test_hash)
        if verification_result['verified']:
            print(f"✓ Verification test passed for certificate: {verification_result['certificate_data']['certificate_id']}")
        else:
            print("✗ Verification test failed")
        
        db.close_connection()
        
    except Exception as e:
        print(f"❌ Database setup failed: {e}")

if __name__ == "__main__":
    setup_database()
