#!/usr/bin/env python3
"""
Setup script for TrustBuddy Gemini API integration
"""

import os
import sys

def main():
    print("🔧 TrustBuddy Gemini API Setup")
    print("=" * 40)
    
    # Check if .env file exists
    env_file = "backend/.env"
    if os.path.exists(env_file):
        print("✅ .env file found")
    else:
        print("❌ .env file not found")
        print("Creating .env file...")
        
        # Create .env file
        with open(env_file, "w") as f:
            f.write("# TrustBuddy Environment Variables\n")
            f.write("# Add your API keys below\n\n")
            f.write("# Gemini API Configuration\n")
            f.write("GEMINI_API_KEY=your_gemini_api_key_here\n\n")
            f.write("# MongoDB Configuration\n")
            f.write("MONGO_URL=your_mongo_url_here\n\n")
            f.write("# Tavily API Configuration\n")
            f.write("TAVILY_API_KEY=your_tavily_api_key_here\n\n")
            f.write("# Other configurations\n")
            f.write("PORT=8000\n")
        
        print("✅ .env file created")
    
    # Check current Gemini API key
    gemini_key = os.getenv("GEMINI_API_KEY")
    if gemini_key and gemini_key != "your_gemini_api_key_here":
        print(f"✅ GEMINI_API_KEY is set: {gemini_key[:10]}...")
    else:
        print("❌ GEMINI_API_KEY is not set or is default value")
        print("\n📝 To get a Gemini API key:")
        print("1. Go to https://makersuite.google.com/app/apikey")
        print("2. Sign in with your Google account")
        print("3. Click 'Create API Key'")
        print("4. Copy the API key")
        print("5. Edit backend/.env and replace 'your_gemini_api_key_here' with your actual key")
    
    print("\n🔍 Testing Gemini API...")
    
    # Test if we can import the backend
    try:
        sys.path.append("backend")
        from main import GEMINI_API_KEY, translate_with_gemini
        import asyncio
        
        if GEMINI_API_KEY and GEMINI_API_KEY != "your_gemini_api_key_here":
            print("✅ Gemini API key is configured")
            
            # Test translation
            async def test_translation():
                try:
                    result = await translate_with_gemini("Hello world", "mr", "test product")
                    print(f"✅ Translation test successful: {result}")
                except Exception as e:
                    print(f"❌ Translation test failed: {e}")
            
            asyncio.run(test_translation())
        else:
            print("❌ Gemini API key not properly configured")
            
    except ImportError as e:
        print(f"❌ Could not import backend: {e}")
    except Exception as e:
        print(f"❌ Error during testing: {e}")
    
    print("\n📋 Next steps:")
    print("1. Set your Gemini API key in backend/.env")
    print("2. Restart the backend server")
    print("3. Test the translation by visiting http://localhost:8000/test-gemini")
    print("4. Try the price comparison feature in the frontend")

if __name__ == "__main__":
    main() 