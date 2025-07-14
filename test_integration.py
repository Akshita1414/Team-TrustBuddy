#!/usr/bin/env python3
"""
Test script to verify TrustBuddy backend integration
"""

import requests
import json
import time

def test_backend_health():
    """Test if the backend is running and healthy"""
    try:
        response = requests.get("http://localhost:8000/health")
        if response.status_code == 200:
            print("✅ Backend health check passed")
            return True
        else:
            print(f"❌ Backend health check failed: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Backend is not running. Please start the backend server first.")
        return False

def test_api_info():
    """Test API info endpoint"""
    try:
        response = requests.get("http://localhost:8000/api/info")
        if response.status_code == 200:
            data = response.json()
            print("✅ API info retrieved successfully")
            print(f"   Supported languages: {data.get('supported_languages', [])}")
            print(f"   Analysis types: {data.get('analysis_types', [])}")
            return True
        else:
            print(f"❌ API info failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ API info error: {e}")
        return False

def test_review_analysis():
    """Test review analysis endpoint"""
    test_review = {
        "review_text": "This product is absolutely amazing! I love it so much. Best purchase ever!",
        "product_name": "Test Product",
        "language": "en"
    }
    
    try:
        response = requests.post(
            "http://localhost:8000/analyze-review",
            headers={"Content-Type": "application/json"},
            data=json.dumps(test_review)
        )
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Review analysis test passed")
            print(f"   Confidence score: {data.get('confidence_score', 0):.2f}")
            print(f"   Risk level: {data.get('risk_level', 'UNKNOWN')}")
            print(f"   Badge: {data.get('badge_text', 'UNKNOWN')}")
            return True
        else:
            print(f"❌ Review analysis failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Review analysis error: {e}")
        return False

def main():
    """Run all integration tests"""
    print("🧪 TrustBuddy Integration Test")
    print("=" * 40)
    
    # Test backend health
    if not test_backend_health():
        print("\n💡 To start the backend:")
        print("   cd backend")
        print("   python main.py")
        return
    
    print()
    
    # Test API info
    test_api_info()
    print()
    
    # Test review analysis
    test_review_analysis()
    print()
    
    print("🎉 Integration test completed!")
    print("\n💡 To start the frontend:")
    print("   cd frontend")
    print("   npm start")
    print("\n🌐 Then open http://localhost:3000 in your browser")

if __name__ == "__main__":
    main() 