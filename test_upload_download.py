#!/usr/bin/env python3
import asyncio
import base64
import uuid
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
import os

async def test_upload_download():
    # Connect to MongoDB
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ.get('DB_NAME', 'milessonplan')]
    
    # Create a test user
    test_user_id = "test_user_123"
    
    # Create a test upload
    test_data = b"Test file content for upload download test"
    file_data_b64 = base64.b64encode(test_data).decode('utf-8')
    
    upload_id = f"upload_{uuid.uuid4().hex[:12]}"
    upload = {
        "upload_id": upload_id,
        "user_id": test_user_id,
        "name": "test_file.txt",
        "type": "text/plain",
        "content_type": "text/plain",
        "size": len(test_data),
        "file_data": file_data_b64,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Insert the test upload
    await db.uploads.insert_one(upload)
    print(f"Created test upload with ID: {upload_id}")
    
    # Try to retrieve it
    retrieved = await db.uploads.find_one({"upload_id": upload_id, "user_id": test_user_id}, {"_id": 0})
    if retrieved:
        print(f"Successfully retrieved upload: {retrieved['name']}")
        
        # Check if file_data exists
        if retrieved.get("file_data"):
            print("File data exists in database")
            
            # Decode and verify
            decoded = base64.b64decode(retrieved["file_data"])
            if decoded == test_data:
                print("File data matches original content")
            else:
                print("ERROR: File data does not match original content")
        else:
            print("ERROR: No file_data found in retrieved upload")
    else:
        print("ERROR: Could not retrieve upload from database")
    
    # Clean up
    await db.uploads.delete_one({"upload_id": upload_id, "user_id": test_user_id})
    print("Cleaned up test upload")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(test_upload_download())