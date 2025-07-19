from fastapi import FastAPI, HTTPException, UploadFile, File, Request, Body, Depends
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from models.review import ReviewRequest, ReviewResponse
from core.review_analyzer import FakeReviewDetector
import io
from PIL import Image
import re
import json as pyjson
from pymongo import MongoClient
from models.user import UserSignup, UserLogin
from typing import Optional
import os
import requests

from dotenv import load_dotenv
from gradio_client import Client, handle_file
import httpx

load_dotenv()

# Gemini API configuration
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"

# Debug: Print Gemini API key status
print(f"DEBUG: GEMINI_API_KEY is {'set' if GEMINI_API_KEY else 'NOT set'}")
if GEMINI_API_KEY:
    print(f"DEBUG: GEMINI_API_KEY starts with: {GEMINI_API_KEY[:10]}...")
else:
    print("DEBUG: Please set GEMINI_API_KEY in your .env file")

async def translate_with_gemini(text: str, target_language: str, product_name: str) -> str:
    """Translate text using Gemini API"""
    print(f"DEBUG: translate_with_gemini called with language: {target_language}, product: {product_name}")
    print(f"DEBUG: Original text: {text[:100]}...")
    
    if not GEMINI_API_KEY:
        print("WARNING: GEMINI_API_KEY not found, returning original text")
        return text
    
    if target_language == "en":
        return text  # No translation needed for English
    
    language_map = {
        "hi": "Hindi",
        "gu": "Gujarati", 
        "mr": "Marathi",
        "kn": "Kannada"
    }
    
    target_lang = language_map.get(target_language, "English")
    
    prompt = f"""
    Translate the following text to {target_lang}. Keep product names, prices (₹), and numbers unchanged.
    Only translate the descriptive text. Maintain the same tone and structure.
    
    Text to translate: {text}
    
    Product name: {product_name}
    
    Return only the translated text, nothing else.
    """
    
    try:
        payload = {
            "contents": [{
                "parts": [{"text": prompt}]
            }]
        }
        
        response = requests.post(
            f"{GEMINI_URL}?key={GEMINI_API_KEY}",
            json=payload,
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            if "candidates" in result and len(result["candidates"]) > 0:
                translated_text = result["candidates"][0]["content"]["parts"][0]["text"].strip()
                print(f"DEBUG: Gemini translation successful for {target_language}: {translated_text[:100]}...")
                return translated_text
            else:
                print(f"DEBUG: Gemini API returned unexpected format: {result}")
                return text
        else:
            print(f"DEBUG: Gemini API error {response.status_code}: {response.text}")
            return text
            
    except Exception as e:
        print(f"DEBUG: Gemini translation error: {str(e)}")
        return text

async def generate_analysis_with_gemini(product_name: str, language: str) -> str:
    """Generate price analysis using Gemini API"""
    if not GEMINI_API_KEY:
        print("WARNING: GEMINI_API_KEY not found, returning fallback message")
        return f"No price data found for {product_name}. Please check multiple retailers."
    
    language_map = {
        "hi": "Hindi",
        "gu": "Gujarati",
        "mr": "Marathi", 
        "kn": "Kannada"
    }
    
    target_lang = language_map.get(language, "English")
    
    prompt = f"""
    Generate a brief price analysis for {product_name} in {target_lang}.
    The analysis should mention that no specific price data was found and suggest checking multiple retailers.
    Keep it concise and helpful.
    
    Product: {product_name}
    Language: {target_lang}
    
    Return only the analysis text in {target_lang}, nothing else.
    """
    
    try:
        payload = {
            "contents": [{
                "parts": [{"text": prompt}]
            }]
        }
        
        response = requests.post(
            f"{GEMINI_URL}?key={GEMINI_API_KEY}",
            json=payload,
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            if "candidates" in result and len(result["candidates"]) > 0:
                analysis = result["candidates"][0]["content"]["parts"][0]["text"].strip()
                print(f"DEBUG: Gemini analysis generated for {language}: {analysis[:100]}...")
                return analysis
            else:
                print(f"DEBUG: Gemini API returned unexpected format: {result}")
                return f"No price data found for {product_name}. Please check multiple retailers."
        else:
            print(f"DEBUG: Gemini API error {response.status_code}: {response.text}")
            return f"No price data found for {product_name}. Please check multiple retailers."
            
    except Exception as e:
        print(f"DEBUG: Gemini analysis error: {str(e)}")
        return f"No price data found for {product_name}. Please check multiple retailers."

# Unified translation function
async def translate_text_unified(text: str, target_lang: str, context: str = "") -> str:
    """Unified translation function using Gemini API with fallback"""
    if not text or target_lang == "en" or not text.strip():
        return text
    print(f"DEBUG: Translating '{text[:50]}...' to {target_lang}")
    # Try Gemini API first
    try:
        if GEMINI_API_KEY:
            language_map = {
                "hi": "Hindi",
                "gu": "Gujarati", 
                "mr": "Marathi",
                "kn": "Kannada",
                "es": "Spanish",
                "fr": "French"
            }
            target_language = language_map.get(target_lang, target_lang)
            prompt = f"""
            Translate the following text to {target_language}. 
            Context: {context}
            Maintain the same tone and meaning. Keep numbers, prices (₹), and proper nouns unchanged.
            Text: {text}
            Return only the translated text.
            """
            payload = {
                "contents": [{
                    "parts": [{"text": prompt}]
                }]
            }
            response = requests.post(
                f"{GEMINI_URL}?key={GEMINI_API_KEY}",
                json=payload,
                timeout=30
            )
            if response.status_code == 200:
                result = response.json()
                if "candidates" in result and len(result["candidates"]) > 0:
                    translated = result["candidates"][0]["content"]["parts"][0]["text"].strip()
                    print(f"DEBUG: Gemini translation successful: '{translated[:50]}...'")
                    return translated
    except Exception as e:
        print(f"DEBUG: Gemini translation failed: {e}")
    # Fallback to LibreTranslate
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                "https://libretranslate.de/translate", 
                json={
                    "q": text,
                    "source": "en",
                    "target": target_lang,
                    "format": "text"
                }
            )
            if response.status_code == 200:
                result = response.json()
                translated = result.get("translatedText", text)
                print(f"DEBUG: LibreTranslate successful: '{translated[:50]}...'")
                return translated
    except Exception as e:
        print(f"DEBUG: LibreTranslate failed: {e}")
    # Hardcoded fallback for common recommendations
    fallback_map = {
        ("not recommended", "gu"): "ભલામણ કરેલ નથી",
        ("buy", "gu"): "ખરીદો",
        ("do not buy", "gu"): "ખરીદો નહીં",
        ("not recommended", "hi"): "सिफारिश नहीं की गई",
        ("buy", "hi"): "खरीदें",
        ("do not buy", "hi"): "खरीदें नहीं",
        ("not recommended", "mr"): "शिफारस केलेली नाही",
        ("buy", "mr"): "खरेदी करा",
        ("do not buy", "mr"): "खरेदी करू नका",
        ("not recommended", "kn"): "ಶಿಫಾರಸು ಮಾಡಲಾಗಿಲ್ಲ",
        ("buy", "kn"): "ಖರೀದಿ ಮಾಡಿ",
        ("do not buy", "kn"): "ಖರೀದಿ ಮಾಡಬೇಡಿ"
    }
    normalized_text = text.strip().lower().replace('.', '')
    print(f"DEBUG: Fallback check: '{normalized_text}', lang: '{target_lang}'")
    key = (normalized_text, target_lang)
    if key in fallback_map:
        print(f"DEBUG: Using hardcoded fallback for {key}: {fallback_map[key]}")
        return fallback_map[key]
    print(f"DEBUG: All translation methods failed, returning original text")
    return text

# MongoDB Atlas connection
MONGO_URL = os.getenv("MONGO_URL")
client = MongoClient(MONGO_URL)
db = client["trustbuddy"]
users_collection = db["users"]

# Initialize FastAPI app
app = FastAPI(
    title="TrustBuddy - Fake Review Detection API",
    description="API for detecting fake reviews with confidence scoring and visual badges",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Local development
        "https://trustbuddy-frontend.onrender.com",  # Deployed frontend (old)
        "https://trustbuddy-frontend.netlify.app"  # Netlify deployed frontend
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize the detector
detector = FakeReviewDetector()

# Helper to get user by username

def get_user(username: str):
    return users_collection.find_one({"username": username})

@app.get("/user/history")
def get_history(username: str):
    user = get_user(username)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    return {"history": user.get("history", [])}

@app.post("/user/clear-history")
def clear_history(payload: dict):
    username = payload.get("username")
    if not username:
        return {"detail": "Username required."}, 400
    user = get_user(username)
    if not user:
        return {"detail": "User not found."}, 404
    users_collection.update_one({"username": username}, {"$set": {"history": []}})
    return {"message": "History cleared."}

# Update analyze_review to save to user history if username is provided
@app.post("/analyze-review", response_model=ReviewResponse)
async def analyze_review(request: ReviewRequest, username: Optional[str] = None, language: str = "en"):
    """
    Analyze a review for authenticity and return confidence score with visual badge
    
    Args:
        request: ReviewRequest containing review text and optional metadata
        language: Target language for translation (default: "en")
        
    Returns:
        ReviewResponse with confidence score, risk level, badge info, and detailed analysis
    """
    if not request.review_text or len(request.review_text.strip()) < 5:
        raise HTTPException(
            status_code=400, 
            detail="Review text is too short or empty. Please provide at least 5 characters."
        )
    
    try:
        result = detector.analyze_review(request)
        
        # Translate ALL text fields if language is not English
        if language != "en":
            print(f"DEBUG: Starting translation for analyze-review with language: {language}")
            # Translate recommendations
            if result.recommendations:
                translated_recommendations = []
                for rec in result.recommendations:
                    translated_rec = await translate_text_unified(
                        rec, language, f"recommendation for {getattr(request, 'product_name', 'product')}"
                    )
                    translated_recommendations.append(translated_rec)
                result.recommendations = translated_recommendations
            # Translate detailed analysis summary
            if result.detailed_analysis and result.detailed_analysis.summary:
                result.detailed_analysis.summary = await translate_text_unified(
                    result.detailed_analysis.summary, 
                    language, 
                    f"analysis summary for {getattr(request, 'product_name', 'product')}"
                )
            # Translate detailed analysis reasons if they exist
            if result.detailed_analysis and hasattr(result.detailed_analysis, 'reasons'):
                translated_reasons = []
                for reason in result.detailed_analysis.reasons:
                    translated_reason = await translate_text_unified(
                        reason, language, "analysis reason"
                    )
                    translated_reasons.append(translated_reason)
                result.detailed_analysis.reasons = translated_reasons
            print(f"DEBUG: Translation completed for analyze-review")
        # Save to user history
        if username:
            users_collection.update_one(
                {"username": username},
                {"$push": {"history": {"review": request.review_text, "result": result.dict()}}}
            )
        return result
    except Exception as e:
        print(f"ERROR in analyze-review: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"Internal server error during analysis: {str(e)}"
        )

@app.post("/verify-image")
async def verify_image(image: UploadFile = File(...), username: Optional[str] = None):
    try:
        contents = await image.read()
        # Save the uploaded image to a temporary file
        import tempfile
        with tempfile.NamedTemporaryFile(delete=False, suffix=".png") as tmp:
            tmp.write(contents)
            tmp_path = tmp.name
        # Use gradio_client to call your Space
        print(f"DEBUG: Calling Akshita1414/Image_Hugging_Face Space in verify-image")
        client = Client("Akshita1414/Image_Hugging_Face")
        result = client.predict(
            img=handle_file(tmp_path),
            api_name="/predict"
        )
        print(f"DEBUG: Space result in verify-image: {result}")
        # Optionally, clean up the temp file
        import os
        os.remove(tmp_path)
        image_analysis = result
        # Save to user history if username is provided
        if username:
            users_collection.update_one(
                {"username": username},
                {"$push": {"history": {"type": "product_image", "result": image_analysis}}}
            )
    except Exception as e:
        image_analysis = {"error": str(e), "confidence": 0.0}
    return image_analysis

@app.post("/analyze-product-link")
async def analyze_product_link(request: Request, username: Optional[str] = None):
    language = request.query_params.get("language", "en")
    print(f"DEBUG: language param in analyze-product-link: {language}")
    print(f"DEBUG: Product link analysis requested with language: {language}")
    import requests as pyrequests
    from bs4 import BeautifulSoup
    import bs4
    import base64
    import io
    import re
    import json as pyjson
    from PIL import Image
    try:
        data = await request.json()
        product_url = data.get("product_url")
        if not product_url:
            return {"detail": "No product URL provided."}, 400
        # Use a browser-like user agent to fetch the page
        headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"}
        resp = pyrequests.get(product_url, headers=headers, timeout=15)
        if resp.status_code != 200 or not resp.text or 'meesho' in product_url:
            # Fallback to Selenium for JS-heavy or blocked sites
            try:
                from selenium import webdriver
                from selenium.webdriver.chrome.options import Options
                chrome_options = Options()
                # chrome_options.add_argument('--headless')
                chrome_options.add_argument('--no-sandbox')
                chrome_options.add_argument('--disable-dev-shm-usage')
                chrome_options.add_argument('--disable-gpu')
                chrome_options.add_argument('--window-size=1920,1080')
                chrome_options.add_argument(f'user-agent={headers["User-Agent"]}')
                driver = webdriver.Chrome(options=chrome_options)
                driver.get(product_url)
                import time
                time.sleep(3)  # Wait for JS to load
                page_source = driver.page_source
                driver.quit()
                soup = BeautifulSoup(page_source, "html.parser")
            except Exception as e:
                return {"detail": f"URL not reachable (requests+selenium failed): {str(e)}"}, 400
        else:
            soup = BeautifulSoup(resp.text, "html.parser")
        # Initialize variables for Gemini extraction
        title = ""
        reviews = []
        img_url = ""
        # After fetching soup, get the raw HTML
        raw_html = str(soup)
        # Detect 'Access Denied' in the HTML
        if 'access denied' in raw_html.lower() or 'captcha' in raw_html.lower():
            return {"detail": "Access Denied by the website. Automated analysis is not possible for this product."}, 400
        # Use Gemini to extract product info generically
        GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
        GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"
        extraction_prompt = {
            "text": (
                "Extract the following from this HTML/text:\n"
                "- Product title\n"
                "- Up to 5 customer reviews\n"
                "- Main product image URL\n"
                "Return as a JSON object: {\"title\": ..., \"reviews\": [...], \"image_url\": ...}\n"
                "Here is the HTML/text:\n"
                f"{raw_html[:12000]}"  # Truncate to avoid token limits
            )
        }
        payload = {"contents": [{"parts": [extraction_prompt]}]}
        gemini_headers = {
            "x-goog-api-key": GEMINI_API_KEY,
            "Content-Type": "application/json"
        }
        try:
            gemini_resp = pyrequests.post(GEMINI_URL, json=payload, headers=gemini_headers, timeout=60)
            if gemini_resp.status_code == 200:
                gemini_data = gemini_resp.json()
                text = gemini_data["candidates"][0]["content"]["parts"][0]["text"]
                match = re.search(r'\{.*\}', text, re.DOTALL)
                if match:
                    result = pyjson.loads(match.group(0))
                    title = result.get("title") or title
                    reviews = result.get("reviews") or []
                    img_url = result.get("image_url") or img_url
        except Exception as e:
            print("Gemini extraction failed:", str(e))
        # Fallbacks if Gemini fails
        if not title:
            title = soup.title.string.strip() if soup.title and soup.title.string else ""
        # If Gemini or manual fallback did not extract reviews, try undetected-chromedriver-based review extraction
        if not reviews or not any(reviews):
            try:
                try:
                    import undetected_chromedriver as uc
                    chrome_options = uc.ChromeOptions()
                    chrome_options.add_argument('--headless')
                    chrome_options.add_argument('--no-sandbox')
                    chrome_options.add_argument('--disable-dev-shm-usage')
                    chrome_options.add_argument('--disable-gpu')
                    chrome_options.add_argument('--window-size=1920,1080')
                    chrome_options.add_argument(f'user-agent={headers["User-Agent"]}')
                    driver = uc.Chrome(options=chrome_options)
                except ImportError:
                    from selenium import webdriver
                    from selenium.webdriver.chrome.options import Options
                    chrome_options = Options()
                    chrome_options.add_argument('--headless')
                    chrome_options.add_argument('--no-sandbox')
                    chrome_options.add_argument('--disable-dev-shm-usage')
                    chrome_options.add_argument('--disable-gpu')
                    chrome_options.add_argument('--window-size=1920,1080')
                    chrome_options.add_argument(f'user-agent={headers["User-Agent"]}')
                    driver = webdriver.Chrome(options=chrome_options)
                driver.get(product_url)
                import time
                time.sleep(7)  # Wait longer for JS and anti-bot checks
                page_source = driver.page_source
                driver.quit()
                soup2 = BeautifulSoup(page_source, "html.parser")
                reviews = []
                # Try common review selectors
                for tag in ["div", "p", "span"]:
                    for el in soup2.find_all(tag):
                        class_attr = el.get("class")
                        data_testid = el.get("data-testid")
                        if (class_attr and any("review" in c.lower() for c in class_attr)) or (data_testid and "review" in data_testid.lower()):
                            text = el.get_text(strip=True)
                            if text and text not in reviews:
                                reviews.append(text)
                        if len(reviews) >= 5:
                            break
                    if len(reviews) >= 5:
                        break
                if not reviews:
                    reviews = ["No reviews found."]
            except Exception as e:
                reviews = ["No reviews found."]
        if not img_url:
            main_img = soup.find("img")
            if main_img and isinstance(main_img, bs4.element.Tag):
                src = main_img.get("src")
                if isinstance(src, str):
                    img_url = src
        # Extract description
        desc = ""
        desc_tag = soup.find("meta", attrs={"name": "description"})
        if desc_tag and isinstance(desc_tag, bs4.element.Tag):
            content = desc_tag.get("content")
            if isinstance(content, str):
                desc = content.strip()
        # Analyze product image with Gradio client
        image_analysis = None
        if img_url and isinstance(img_url, str):
            try:
                img_resp = pyrequests.get(img_url, headers=headers, timeout=10)
                if img_resp.status_code == 200:
                    # Save the image to a temporary file
                    import tempfile
                    with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as tmp:
                        tmp.write(img_resp.content)
                        tmp_path = tmp.name
                    
                    # Use gradio_client to call your Space
                    print(f"DEBUG: Calling Akshita1414/Image_Hugging_Face Space")
                    client = Client("Akshita1414/Image_Hugging_Face")
                    result = client.predict(
                        img=handle_file(tmp_path),
                        api_name="/predict"
                    )
                    print(f"DEBUG: Space result: {result}")
                    
                    # Clean up the temp file
                    import os
                    os.remove(tmp_path)
                    
                    # Process the result from your Space
                    if isinstance(result, dict):
                        label = result.get("label", "UNKNOWN")
                        confidence = float(result.get("confidence", 0.0))
                        
                        # If confidence is 0, assign based on label
                        if confidence == 0.0:
                            if label.upper() in ['REAL', 'AUTHENTIC', 'ORIGINAL', 'GENUINE']:
                                confidence = 0.85
                            elif label.upper() in ['FAKE', 'AI-GENERATED', 'GENERATED', 'SYNTHETIC']:
                                confidence = 0.35
                            else:
                                confidence = 0.7
                        
                        image_analysis = {
                            "label": label,
                            "confidence": confidence,
                            "reason": f"Image analysis result: {label} with confidence {round(confidence * 100, 1)}%"
                        }
                    elif isinstance(result, list) and len(result) > 0:
                        # Handle list response format
                        best = max(result, key=lambda r: r.get('score', 0) if isinstance(r, dict) else 0)
                        label = best.get("label", "UNKNOWN")
                        confidence = float(best.get("score", 0.0))
                        
                        # If confidence is 0, assign based on label
                        if confidence == 0.0:
                            if label.upper() in ['REAL', 'AUTHENTIC', 'ORIGINAL', 'GENUINE']:
                                confidence = 0.85
                            elif label.upper() in ['FAKE', 'AI-GENERATED', 'GENERATED', 'SYNTHETIC']:
                                confidence = 0.35
                            else:
                                confidence = 0.7
                        
                        image_analysis = {
                            "label": label,
                            "confidence": confidence,
                            "reason": f"Image analysis result: {label} with confidence {round(confidence * 100, 1)}%"
                        }
                    else:
                        image_analysis = {"error": "Unexpected response format from Space", "raw_response": result, "confidence": 0.0}
                else:
                    image_analysis = {"error": f"Failed to download image: HTTP {img_resp.status_code}", "confidence": 0.0}
            except Exception as e:
                print(f"DEBUG: Image analysis exception: {str(e)}")
                image_analysis = {"error": f"Image analysis failed: {str(e)}", "confidence": 0.0}
        # If image_analysis is still None, ensure it is a dict with confidence 0.0
        if image_analysis is None:
            image_analysis = {"label": None, "confidence": 0.0, "reason": "No image analysis performed."}
        # Summarize product and reviews with Gemini
        summary = None
        try:
            GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
            GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"
            summary_prompt = {"text": f'Given the following product title: "{title}", description: "{desc}", reviews: {reviews}, and image authenticity: {image_analysis}, should a buyer purchase this product? Respond in this JSON format: {{"recommendation": "Buy" or "Do Not Buy", "reason": "..."}}'}
            payload = {"contents": [{"parts": [summary_prompt]}]}
            gemini_headers = {
                "x-goog-api-key": GEMINI_API_KEY,
                "Content-Type": "application/json"
            }
            gemini_resp = pyrequests.post(GEMINI_URL, json=payload, headers=gemini_headers, timeout=30)
            if gemini_resp.status_code == 200:
                gemini_data = gemini_resp.json()
                text = gemini_data["candidates"][0]["content"]["parts"][0]["text"]
                match = re.search(r'\{.*\}', text, re.DOTALL)
                if match:
                    result = pyjson.loads(match.group(0))
                    summary = {
                        "recommendation": result.get("recommendation"),
                        "reason": result.get("reason")
                    }
                else:
                    summary = {"message": "Could not parse Gemini response", "raw_response": text}
            else:
                summary = {"error": f"Gemini API error: {gemini_resp.text}"}
        except Exception as e:
            summary = {"error": str(e)}
        print("Extracted img_url:", img_url)
        print("Image analysis result:", image_analysis)
        print("Summary result:", summary)
        # --- Review Confidence Analysis ---
        review_confidence = None
        if reviews and isinstance(reviews, list):
            review_scores = []
            for rv in reviews[:3]:  # Limit to 3 reviews for speed
                try:
                    req = ReviewRequest(review_text=rv)
                    res = detector.analyze_review(req)
                    review_scores.append(res.confidence_score)
                except Exception:
                    continue
            if review_scores:
                review_confidence = sum(review_scores) / len(review_scores)
        # --- Image Confidence ---
        image_confidence = None
        if image_analysis and isinstance(image_analysis, dict):
            conf = image_analysis.get('confidence')
            if isinstance(conf, (int, float)):
                image_confidence = conf
        # --- Final Confidence Score ---
        final_confidence_score = None
        if review_confidence is not None and image_confidence is not None:
            final_confidence_score = (review_confidence + image_confidence) / 2
        elif review_confidence is not None:
            final_confidence_score = review_confidence
        elif image_confidence is not None:
            final_confidence_score = image_confidence
        # ---
        response_data = {
            "product_title": title,
            "product_description": desc,
            "product_image_url": img_url,
            "reviews": reviews,
            "image_analysis": image_analysis,
            "summary": summary,
            "final_confidence_score": final_confidence_score
        }
        # --- TRANSLATION PATCH ---
        if language != "en":
            print(f"DEBUG: Starting translation for product link analysis - language: {language}")
            try:
                if title and isinstance(title, str):
                    response_data["product_title"] = await translate_text_unified(
                        title, language, "product title"
                    )
                if desc and isinstance(desc, str):
                    response_data["product_description"] = await translate_text_unified(
                        desc, language, "product description"
                    )
                if reviews and isinstance(reviews, list):
                    translated_reviews = []
                    for review in reviews:
                        if review and isinstance(review, str):
                            translated_review = await translate_text_unified(
                                review, language, "customer review"
                            )
                            translated_reviews.append(translated_review)
                        else:
                            translated_reviews.append(review)
                    response_data["reviews"] = translated_reviews
                if (image_analysis and isinstance(image_analysis, dict) 
                    and image_analysis.get("reason")):
                    response_data["image_analysis"]["reason"] = await translate_text_unified(
                        image_analysis["reason"], language, "image analysis"
                    )
                # Only translate and show the short recommendation as summary.reason
                if summary and isinstance(summary, dict):
                    if summary.get("recommendation"):
                        translated_recommendation = await translate_text_unified(
                            summary["recommendation"], language, "recommendation"
                        )
                        response_data["summary"]["reason"] = translated_recommendation
                        response_data["summary"]["recommendation"] = translated_recommendation
                    else:
                        response_data["summary"]["reason"] = ""
                        response_data["summary"]["recommendation"] = ""
            except Exception as e:
                print(f"ERROR: Translation failed in product link analysis: {e}")
        # --- END PATCH ---
        # Save to user history if username is provided
        if username:
            users_collection.update_one(
                {"username": username},
                {"$push": {"history": {"product_url": product_url, "result": response_data}}}
            )
        return response_data
    except Exception as e:
        return {"detail": f"Error analyzing product link: {str(e)}"}, 500

@app.post("/analyze-product-name")
async def analyze_product_name(payload: dict = Body(...)):
    """
    Analyze a product name for authenticity (fake/genuine detection)
    """
    product_name = payload.get("product_name", "")
    language = payload.get("language", "en")
    if not product_name or len(product_name.strip()) < 3:
        raise HTTPException(status_code=400, detail="Product name is too short or empty.")
    result = detector.analyze_product_name(product_name, language)
    # Translate ALL text fields if language is not English
    if language != "en":
        print(f"DEBUG: Starting translation for analyze-product-name with language: {language}")
        try:
            if isinstance(result, dict):
                for key, value in result.items():
                    if isinstance(value, str):
                        result[key] = await translate_text_unified(
                            value, language, f"product analysis {key}"
                        )
                    elif isinstance(value, list):
                        translated_list = []
                        for item in value:
                            if isinstance(item, str):
                                translated_item = await translate_text_unified(
                                    item, language, f"product analysis {key}"
                                )
                                translated_list.append(translated_item)
                            else:
                                translated_list.append(item)
                        result[key] = translated_list
        except Exception as e:
            print(f"ERROR: Translation failed in analyze-product-name: {e}")
    return result

@app.post("/signup")
def signup(user: UserSignup):
    if users_collection.find_one({"username": user.username}):
        raise HTTPException(status_code=400, detail="Username already exists.")
    users_collection.insert_one({"username": user.username, "password": user.password, "history": []})
    return {"message": "Signup successful."}

@app.post("/login")
def login(user: UserLogin):
    print(f"Login attempt received for username: {user.username}")  # Debug log
    db_user = users_collection.find_one({"username": user.username, "password": user.password})
    if not db_user:
        raise HTTPException(status_code=401, detail="Invalid username or password.")
    return {"message": "Login successful.", "username": user.username}

@app.post("/compare-prices")
async def compare_prices(payload: dict = Body(...)):
    product_name = payload.get("product_name")
    username = payload.get("username")
    language = payload.get("language", "en")  # Default to English
    print(f"DEBUG: Received language parameter: {language}")  # Debug log
    if not product_name:
        return {"error": "Product name required."}
    
    api_key = os.getenv("TAVILY_API_KEY")
    
    try:
        # Step 1: Search for actual prices on specific e-commerce sites with better prompts
        search_queries = [
            f'"{product_name}" current price ₹ site:amazon.in',
            f'"{product_name}" price in rupees site:flipkart.com',
            f'"{product_name}" cost ₹ site:meesho.com',
            f'"{product_name}" MRP price site:ajio.com',
            f'"{product_name}" buy now price ₹ site:amazon.in',
            f'"{product_name}" offer price site:flipkart.com',
            f'"{product_name}" product listing price site:amazon.in',
            f'"{product_name}" product page price site:flipkart.com'
        ]
        
        actual_prices = []
        all_content = ""
        
        for query in search_queries:
            try:
                response = requests.post(
                    "https://api.tavily.com/search",
                    headers={"Content-Type": "application/json"},
                    json={
                        "api_key": api_key,
                        "query": query,
                        "search_depth": "advanced",
                        "include_answer": True,
                        "include_domains": ["amazon.in", "flipkart.com", "meesho.com", "ajio.com"],
                        "max_results": 10,
                        "include_raw_content": True
                    },
                    timeout=20
                )
                
                data = response.json()
                results = data.get("results", [])
                
                for result in results:
                    content = result.get("content", "")
                    url = result.get("url", "")
                    title = result.get("title", "")
                    raw_content = result.get("raw_content", "")
                    all_content += content + " "
                    
                    # Extract prices from both processed content and raw content
                    import re
                    price_patterns = [
                        r"₹\s*([\d,]+)",
                        r"Rs\.?\s*([\d,]+)",
                        r"(\d{4,})\s*(?:rupees?|rs)",
                        r"price[:\s]*₹?\s*([\d,]+)",
                        r"cost[:\s]*₹?\s*([\d,]+)",
                        r"MRP[:\s]*₹?\s*([\d,]+)",
                        r"(\d{4,})\s*₹",
                        r"₹\s*(\d{1,3}(?:,\d{3})*)",
                        r"buy\s+now[:\s]*₹?\s*([\d,]+)",
                        r"offer\s+price[:\s]*₹?\s*([\d,]+)",
                        r"discounted\s+price[:\s]*₹?\s*([\d,]+)",
                        r"current\s+price[:\s]*₹?\s*([\d,]+)",
                        r"(\d{4,})\s*(?:INR|₹|Rs)",
                        r"price[:\s]*(\d{4,})",
                        r"cost[:\s]*(\d{4,})",
                        r"class=\"[^\"]*price[^\"]*\"[^>]*>([^<]*₹\s*[\d,]+)",
                        r"data-price=\"([\d,]+)\"",
                        r"price\":\s*\"([\d,]+)\"",
                        r"amount\":\s*([\d,]+)"
                    ]
                    
                    # Search in both processed content and raw HTML
                    search_contents = [content]
                    if raw_content:
                        search_contents.append(raw_content)
                    
                    for search_content in search_contents:
                        for pattern in price_patterns:
                            matches = re.findall(pattern, search_content, re.IGNORECASE)
                            for match in matches:
                                try:
                                    # Clean the match to extract just the number
                                    price_str = re.sub(r'[^\d,]', '', str(match))
                                    price = int(price_str.replace(",", ""))
                                    if 500 <= price <= 500000:  # Wider range for different products
                                        actual_prices.append({
                                            "price": price,
                                            "source": url,
                                            "title": title,
                                            "content": content[:200]  # First 200 chars for context
                                        })
                                except:
                                    continue
                                
            except Exception as e:
                print(f"Error searching {query}: {str(e)}")
                continue
        
        # Remove duplicates and sort by price
        unique_prices = []
        seen_prices = set()
        for price_data in actual_prices:
            price_key = (price_data["price"], price_data["source"])
            if price_key not in seen_prices:
                seen_prices.add(price_key)
                unique_prices.append(price_data)
        
        unique_prices.sort(key=lambda x: x["price"])
        
        # Step 2: Generate specific analysis based on found prices
        if unique_prices:
            min_price = unique_prices[0]["price"]
            max_price = unique_prices[-1]["price"]
            avg_price = sum(p["price"] for p in unique_prices) // len(unique_prices)
            
            # Generate analysis in English first
            if len(unique_prices) >= 3:
                price_variance = max_price - min_price
                price_ratio = price_variance / avg_price if avg_price > 0 else 0
                
                if price_ratio > 0.5:
                    analysis = f"Price varies significantly for {product_name}. Found prices range from ₹{min_price:,} to ₹{max_price:,} across different retailers. This suggests either different models/variants or price manipulation."
                elif price_ratio > 0.2:
                    analysis = f"Moderate price variation found for {product_name}. Average price: ₹{avg_price:,}, range: ₹{min_price:,} - ₹{max_price:,}. Consider comparing features across retailers."
                else:
                    analysis = f"Consistent pricing found for {product_name}. Average price: ₹{avg_price:,}, range: ₹{min_price:,} - ₹{max_price:,}. This indicates stable market pricing."
            else:
                analysis = f"Found {product_name} at ₹{avg_price:,}. Limited price data available for comparison."
            
            # Add recommendations
            if min_price < avg_price * 0.8:
                analysis += f" Best deal found at ₹{min_price:,}."
            if max_price > avg_price * 1.2:
                analysis += f" Avoid prices above ₹{max_price:,} as they appear inflated."
            
            # Use unified translation instead of translate_with_gemini
            enhanced_summary = await translate_text_unified(
                analysis, language, f"price analysis for {product_name}"
            )
            print(f"DEBUG: Translation result: {enhanced_summary[:100]}...")
            
        else:
            # No prices found, use Gemini API for analysis
            enhanced_summary = await generate_analysis_with_gemini(product_name, language)
        
        # Save to user history if username is provided
        if username:
            from datetime import datetime
            users_collection.update_one(
                {"username": username},
                {"$push": {"history": {
                    "type": "price_comparison",
                    "product_name": product_name,
                    "summary": enhanced_summary,
                    "actual_prices": unique_prices,
                    "timestamp": datetime.utcnow().isoformat()
                }}}
            )
        
        return {
            "summary": enhanced_summary,
            "actual_prices": unique_prices
        }
        
    except Exception as e:
        return {
            "summary": f"Error analyzing prices for {product_name}: {str(e)}",
            "actual_prices": []
        }

@app.post("/recommend-alternates")
async def recommend_alternates(payload: dict = Body(...)):
    product_name = payload.get("product_name")
    max_price = payload.get("max_price")
    username = payload.get("username")
    language = payload.get("language", "en")  # Default to English
    if not product_name or not max_price:
        return {"error": "Product name and max_price required."}
    api_key = os.getenv("TAVILY_API_KEY")
    import re
    from datetime import datetime
    try:
        max_price_val = float(max_price)
    except:
        max_price_val = None

    # Step 1: Check for same product availability with improved prompt
    prompt_same = (
        f"Find the exact same '{product_name}' product available on multiple Indian e-commerce sites under ₹{max_price}. "
        "Search specifically on: Amazon.in, Flipkart.com, Meesho.com, Ajio.com, Croma.com, Reliance Digital, Tata Cliq, Paytm Mall. "
        "Return ONLY the exact same product (not alternatives) in this format: "
        "1. Product Name | Price ₹X | Retailer | Link "
        "2. Product Name | Price ₹X | Retailer | Link "
        "Focus on finding the SAME model/variant across different retailers. "
        "If you find the exact product on multiple sites, list each one. "
        "If no exact match is found, say 'Exact product not found on multiple sites'."
    )
    response_same = requests.post(
        "https://api.tavily.com/search",
        headers={"Content-Type": "application/json"},
        json={
            "api_key": api_key,
            "query": prompt_same,
            "search_depth": "basic",
            "include_answer": True
        },
        timeout=20
    )
    data_same = response_same.json()
    answer_same = data_same.get("answer") or data_same.get("summary") or ""
    same_products = []
    same_pattern = re.compile(r"([\w\s\-\+]+)[\s\:\|\-]+₹?(\d+[,.]?\d*)[\s\:\|\-]+([\w\s]+)[\s\:\|\-]+(https?://\S+)", re.IGNORECASE)
    for match in same_pattern.finditer(answer_same):
        name, price, retailer, link = match.groups()
        try:
            price_val = float(price.replace(",", ""))
        except:
            price_val = None
        if price_val is not None and max_price_val is not None and price_val <= max_price_val:
            same_products.append({
                "name": name.strip(),
                "price": price_val,
                "retailer": retailer.strip(),
                "link": link.strip()
            })
    same_products.sort(key=lambda x: ("meesho" not in x["retailer"].lower(), x["price"]))

    # Step 2: Always check for alternate products with improved prompt
    prompt_alt = (
        f"Find alternate products to '{product_name}' available in India under ₹{max_price} with better value, discounts, or similar features. "
        "Return a simple, numbered list of alternates. For each, include: Product name, Price, Retailer, and Link (if available). "
        "Prioritize Meesho and local Indian e-commerce sites, but include any good deals from Amazon.in, Flipkart.com, Ajio.com, etc. "
        "Look for similar products, better deals, or alternatives that offer more value for money. "
        "If you can't find all details, provide as much as possible."
    )
    response_alt = requests.post(
        "https://api.tavily.com/search",
        headers={"Content-Type": "application/json"},
        json={
            "api_key": api_key,
            "query": prompt_alt,
            "search_depth": "basic",
            "include_answer": True
        },
        timeout=20
    )
    data_alt = response_alt.json()
    alternates = []
    answer_alt = data_alt.get("answer") or data_alt.get("summary") or ""
    alt_pattern = re.compile(r"([\w\s\-\+]+)[\s\:\|\-]+₹?(\d+[,.]?\d*)[\s\:\|\-]+([\w\s]+)[\s\:\|\-]+(https?://\S+)", re.IGNORECASE)
    for match in alt_pattern.finditer(answer_alt):
        name, price, retailer, link = match.groups()
        try:
            price_val = float(price.replace(",", ""))
        except:
            price_val = None
        if price_val is not None and max_price_val is not None and price_val < max_price_val:
            if max_price_val > 0:
                ratio = price_val / max_price_val
                if ratio <= 0.4:
                    score = 5
                elif ratio <= 0.6:
                    score = 4
                elif ratio <= 0.8:
                    score = 3
                elif ratio <= 0.95:
                    score = 2
                else:
                    score = 1
            else:
                score = 1
            alternates.append({
                "name": name.strip(),
                "price": price_val,
                "retailer": retailer.strip(),
                "link": link.strip(),
                "price_score": score
            })
    alternates.sort(key=lambda x: ("meesho" not in x["retailer"].lower(), x["price"]))

    # Step 3: Return both same products and alternates
    result = {
        "type": "both_products",
        "same_products": same_products,
        "alternates": alternates,
        "same_products_raw": answer_same,
        "alternates_raw": answer_alt
    }

    # Save to user history if username is provided
    if username:
        users_collection.update_one(
            {"username": username},
            {"$push": {"history": {
                "type": "product_recommendations",
                "product_name": product_name,
                "max_price": max_price,
                "same_products": same_products,
                "alternates": alternates,
                "same_products_raw": answer_same,
                "alternates_raw": answer_alt,
                "timestamp": datetime.utcnow().isoformat()
            }}}
        )

    return result

@app.get("/health")
async def health_check():
    """Health check endpoint to verify service status"""
    return {
        "status": "healthy", 
        "service": "TrustBuddy Fake Review Detection",
        "version": "1.0.0"
    }

@app.get("/test-gemini")
async def test_gemini():
    """Test endpoint to verify Gemini API is working"""
    if not GEMINI_API_KEY:
        return {
            "status": "error",
            "message": "GEMINI_API_KEY not set",
            "gemini_configured": False
        }
    
    try:
        # Test translation
        test_text = "Hello world"
        translated = await translate_with_gemini(test_text, "mr", "test product")
        
        return {
            "status": "success",
            "message": "Gemini API is working",
            "gemini_configured": True,
            "test_translation": translated,
            "original_text": test_text
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Gemini API test failed: {str(e)}",
            "gemini_configured": True,
            "error": str(e)
        }

@app.post("/test-translation")
async def test_translation(payload: dict = Body(...)):
    text = payload.get("text", "Hello, this is a test message")
    language = payload.get("language", "hi")
    try:
        translated = await translate_text_unified(text, language, "test")
        return {
            "original": text,
            "translated": translated,
            "language": language,
            "success": True
        }
    except Exception as e:
        return {
            "original": text,
            "translated": text,
            "language": language,
            "success": False,
            "error": str(e)
        }

@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "service": "TrustBuddy - Fake Review Detection API",
        "version": "1.0.0",
        "description": "Detect fake reviews with AI-powered analysis",
        "endpoints": {
            "analyze_review": "/analyze-review",
            "health": "/health",
            "docs": "/docs",
            "redoc": "/redoc"
        },
        "features": [
            "Text pattern analysis",
            "Sentiment analysis", 
            "Semantic coherence checking",
            "ML model integration",
            "Confidence scoring",
            "Visual badge system"
        ]
    }

@app.get("/api/info")
async def api_info():
    """Get detailed API information"""
    return {
        "supported_languages": ["English", "Hindi", "Spanish", "French"],
        "analysis_types": [
            "Text Pattern Analysis",
            "Sentiment Analysis", 
            "Semantic Coherence",
            "ML Model Prediction"
        ],
        "confidence_levels": {
            "HIGH": {"score_range": "0.7-1.0", "badge": "GREEN - SAFE"},
            "MEDIUM": {"score_range": "0.4-0.69", "badge": "YELLOW - WARNING"}, 
            "LOW": {"score_range": "0.0-0.39", "badge": "RED - RISKY"}
        }
    }



if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=port,
        reload=True,  # You can set this to False for production
        log_level="info"
    )