#!/usr/bin/env python
"""Test authentication endpoints"""
import sys
import asyncio
sys.path.insert(0, '.')

from auth.router import hash_password, verify_password, PasswordValidator
from blog.database import BlogDatabaseService

async def test_registration():
    db = BlogDatabaseService()
    
    try:
        # Test password hashing
        print("1. Testing password hashing...")
        pwd = "TestPass@2024"
        hashed = hash_password(pwd)
        print(f"   Password hashed: {hashed[:20]}...")
        verified = verify_password(pwd, hashed)
        print(f"   Password verified: {verified}")
        
        # Test database connection
        print("\n2. Testing database connection...")
        result = db.client.table("users").select("count", count="exact").execute()
        print(f"   Users table count: {result.count}")
        
        # Test insert
        print("\n3. Testing user insert...")
        import uuid
        from datetime import datetime
        user_data = {
            "id": str(uuid.uuid4()),
            "username": "testuser123456",
            "email": "testuser123456@test.com",
            "full_name": "Test User 123456",
            "password_hash": hash_password("TestPass@2024"),
            "avatar_url": None,
            "bio": None,
            "is_email_verified": False,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
        }
        result = db.client.table("users").insert(user_data).execute()
        print(f"   Insert result: {result.data}")
        
    except Exception as e:
        print(f"ERROR: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_registration())
