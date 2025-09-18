"""
MongoDB Database Integration for Certificate Authenticity Validator
Handles storage and retrieval of certificate data and hashes
"""

import os
from datetime import datetime
from typing import Dict, List, Optional
from pymongo import MongoClient, ASCENDING, DESCENDING
from pymongo.errors import DuplicateKeyError, ConnectionFailure
import hashlib
import json

class CertificateDatabase:
    def __init__(self, connection_string: str = None):
        """
        Initialize MongoDB connection
        """
        self.connection_string = connection_string or os.getenv(
            'MONGODB_URI', 
            'mongodb://localhost:27017/'
        )
        self.database_name = 'certificate_validator'
        self.certificates_collection = 'certificates'
        self.users_collection = 'users'
        
        try:
            self.client = MongoClient(self.connection_string)
            self.db = self.client[self.database_name]
            self.certificates = self.db[self.certificates_collection]
            self.users = self.db[self.users_collection]
            
            # Create indexes for better performance
            self._create_indexes()
            print("Connected to MongoDB successfully!")
            
        except ConnectionFailure as e:
            print(f"Failed to connect to MongoDB: {e}")
            raise
    
    def _create_indexes(self):
        """
        Create database indexes for optimal performance
        """
        # Certificate collection indexes
        self.certificates.create_index([("hash", ASCENDING)], unique=True)
        self.certificates.create_index([("certificate_id", ASCENDING)])
        self.certificates.create_index([("roll_no", ASCENDING)])
        self.certificates.create_index([("upload_date", DESCENDING)])
        self.certificates.create_index([("status", ASCENDING)])
        
        # Users collection indexes
        self.users.create_index([("email", ASCENDING)], unique=True)
        self.users.create_index([("user_id", ASCENDING)], unique=True)
    
    def store_certificate(self, certificate_data: Dict) -> Dict:
        """
        Store certificate data in MongoDB
        
        Args:
            certificate_data: Dictionary containing certificate information
            
        Returns:
            Dictionary with storage result
        """
        try:
            # Prepare document for storage
            document = {
                "certificate_id": certificate_data.get("certificate_id"),
                "hash": certificate_data.get("hash"),
                "extracted_data": {
                    "name": certificate_data.get("name"),
                    "roll_no": certificate_data.get("roll_no"),
                    "certificate_id": certificate_data.get("certificate_id"),
                    "marks": certificate_data.get("marks"),
                    "institution": certificate_data.get("institution")
                },
                "processing_info": certificate_data.get("processing_info", {}),
                "confidence": certificate_data.get("confidence", 0),
                "filename": certificate_data.get("filename"),
                "file_size": certificate_data.get("file_size"),
                "upload_date": datetime.utcnow(),
                "uploaded_by": certificate_data.get("uploaded_by"),
                "status": "verified" if certificate_data.get("confidence", 0) > 80 else "pending",
                "verification_attempts": 0,
                "metadata": {
                    "ocr_version": "1.0.0",
                    "processing_time": certificate_data.get("processing_time"),
                    "file_type": certificate_data.get("file_type")
                }
            }
            
            # Insert document
            result = self.certificates.insert_one(document)
            
            return {
                "success": True,
                "document_id": str(result.inserted_id),
                "hash": certificate_data.get("hash"),
                "message": "Certificate stored successfully"
            }
            
        except DuplicateKeyError:
            return {
                "success": False,
                "error": "Certificate with this hash already exists",
                "duplicate": True
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"Database error: {str(e)}"
            }
    
    def verify_certificate_by_hash(self, hash_value: str) -> Dict:
        """
        Verify certificate by its SHA-256 hash
        
        Args:
            hash_value: SHA-256 hash to verify
            
        Returns:
            Dictionary with verification result
        """
        try:
            certificate = self.certificates.find_one({"hash": hash_value})
            
            if certificate:
                # Update verification attempts
                self.certificates.update_one(
                    {"hash": hash_value},
                    {"$inc": {"verification_attempts": 1}}
                )
                
                return {
                    "verified": True,
                    "certificate_data": {
                        "name": certificate["extracted_data"]["name"],
                        "roll_no": certificate["extracted_data"]["roll_no"],
                        "certificate_id": certificate["extracted_data"]["certificate_id"],
                        "marks": certificate["extracted_data"]["marks"],
                        "institution": certificate["extracted_data"]["institution"],
                        "upload_date": certificate["upload_date"].isoformat(),
                        "confidence": certificate["confidence"],
                        "status": certificate["status"]
                    },
                    "hash": hash_value
                }
            else:
                return {
                    "verified": False,
                    "hash": hash_value,
                    "message": "Certificate not found in database"
                }
                
        except Exception as e:
            return {
                "verified": False,
                "error": f"Database error: {str(e)}"
            }
    
    def search_certificate_by_id(self, certificate_id: str) -> Dict:
        """
        Search for certificate by certificate ID
        
        Args:
            certificate_id: Certificate ID to search for
            
        Returns:
            Dictionary with search result
        """
        try:
            certificate = self.certificates.find_one({"certificate_id": certificate_id})
            
            if certificate:
                return {
                    "found": True,
                    "certificate_data": {
                        "name": certificate["extracted_data"]["name"],
                        "roll_no": certificate["extracted_data"]["roll_no"],
                        "certificate_id": certificate["extracted_data"]["certificate_id"],
                        "marks": certificate["extracted_data"]["marks"],
                        "institution": certificate["extracted_data"]["institution"],
                        "upload_date": certificate["upload_date"].isoformat(),
                        "confidence": certificate["confidence"],
                        "status": certificate["status"],
                        "hash": certificate["hash"]
                    }
                }
            else:
                return {
                    "found": False,
                    "certificate_id": certificate_id,
                    "message": "Certificate ID not found"
                }
                
        except Exception as e:
            return {
                "found": False,
                "error": f"Database error: {str(e)}"
            }
    
    def get_certificates_by_user(self, user_id: str, limit: int = 50) -> List[Dict]:
        """
        Get certificates uploaded by a specific user
        
        Args:
            user_id: User ID
            limit: Maximum number of certificates to return
            
        Returns:
            List of certificate documents
        """
        try:
            certificates = list(
                self.certificates.find({"uploaded_by": user_id})
                .sort("upload_date", DESCENDING)
                .limit(limit)
            )
            
            # Convert ObjectId to string and format dates
            for cert in certificates:
                cert["_id"] = str(cert["_id"])
                cert["upload_date"] = cert["upload_date"].isoformat()
            
            return certificates
            
        except Exception as e:
            print(f"Error retrieving certificates: {e}")
            return []
    
    def get_all_certificates(self, limit: int = 100, status: str = None) -> List[Dict]:
        """
        Get all certificates (admin function)
        
        Args:
            limit: Maximum number of certificates to return
            status: Filter by status (optional)
            
        Returns:
            List of certificate documents
        """
        try:
            query = {}
            if status:
                query["status"] = status
            
            certificates = list(
                self.certificates.find(query)
                .sort("upload_date", DESCENDING)
                .limit(limit)
            )
            
            # Convert ObjectId to string and format dates
            for cert in certificates:
                cert["_id"] = str(cert["_id"])
                cert["upload_date"] = cert["upload_date"].isoformat()
            
            return certificates
            
        except Exception as e:
            print(f"Error retrieving certificates: {e}")
            return []
    
    def update_certificate_status(self, hash_value: str, status: str) -> Dict:
        """
        Update certificate status
        
        Args:
            hash_value: Certificate hash
            status: New status
            
        Returns:
            Dictionary with update result
        """
        try:
            result = self.certificates.update_one(
                {"hash": hash_value},
                {
                    "$set": {
                        "status": status,
                        "last_updated": datetime.utcnow()
                    }
                }
            )
            
            if result.modified_count > 0:
                return {
                    "success": True,
                    "message": "Certificate status updated"
                }
            else:
                return {
                    "success": False,
                    "message": "Certificate not found"
                }
                
        except Exception as e:
            return {
                "success": False,
                "error": f"Database error: {str(e)}"
            }
    
    def store_user(self, user_data: Dict) -> Dict:
        """
        Store user information
        
        Args:
            user_data: Dictionary containing user information
            
        Returns:
            Dictionary with storage result
        """
        try:
            document = {
                "user_id": user_data.get("user_id"),
                "email": user_data.get("email"),
                "name": user_data.get("name"),
                "role": user_data.get("role", "verifier"),
                "created_date": datetime.utcnow(),
                "last_login": datetime.utcnow(),
                "is_active": True,
                "verification_count": 0
            }
            
            result = self.users.insert_one(document)
            
            return {
                "success": True,
                "user_id": str(result.inserted_id),
                "message": "User stored successfully"
            }
            
        except DuplicateKeyError:
            return {
                "success": False,
                "error": "User with this email already exists"
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"Database error: {str(e)}"
            }
    
    def get_database_stats(self) -> Dict:
        """
        Get database statistics
        
        Returns:
            Dictionary with database statistics
        """
        try:
            total_certificates = self.certificates.count_documents({})
            verified_certificates = self.certificates.count_documents({"status": "verified"})
            pending_certificates = self.certificates.count_documents({"status": "pending"})
            total_users = self.users.count_documents({})
            
            # Get recent activity
            recent_certificates = self.certificates.count_documents({
                "upload_date": {"$gte": datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)}
            })
            
            return {
                "total_certificates": total_certificates,
                "verified_certificates": verified_certificates,
                "pending_certificates": pending_certificates,
                "total_users": total_users,
                "recent_certificates_today": recent_certificates,
                "verification_rate": round((verified_certificates / total_certificates * 100), 2) if total_certificates > 0 else 0
            }
            
        except Exception as e:
            return {
                "error": f"Database error: {str(e)}"
            }
    
    def close_connection(self):
        """
        Close database connection
        """
        if hasattr(self, 'client'):
            self.client.close()
            print("Database connection closed")

# Initialize database instance
db = CertificateDatabase()
