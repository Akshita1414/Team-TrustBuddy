from fastapi import FastAPI, HTTPException, UploadFile, File, Request, Body, Depends
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from models.review import ReviewRequest, ReviewResponse
from core.review_analyzer import FakeReviewDetector
import io
import torch
from transformers import AutoImageProcessor, AutoModelForImageClassification
from PIL import Image
import base64
import re
import json as pyjson
from pymongo import MongoClient
from models.user import UserSignup, UserLogin
from typing import Optional

# MongoDB Atlas connection
MONGO_URL = "REMOVED"
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
    allow_origins=["http://localhost:3000"],  # Only allow frontend origin
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
async def analyze_review(request: ReviewRequest, username: Optional[str] = None):
    """
    Analyze a review for authenticity and return confidence score with visual badge
    
    Args:
        request: ReviewRequest containing review text and optional metadata
        
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
        # Save to user history if username is provided
        if username:
            users_collection.update_one(
                {"username": username},
                {"$push": {"history": {"review": request.review_text, "result": result.dict()}}}
            )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Internal server error during analysis: {str(e)}"
        )

@app.post("/verify-image")
async def verify_image(image: UploadFile = File(...)):
    try:
        contents = await image.read()
        img = Image.open(io.BytesIO(contents)).convert('RGB')
        model_name = "prithivMLmods/open-deepfake-detection"
        processor = AutoImageProcessor.from_pretrained(model_name)
        model = AutoModelForImageClassification.from_pretrained(model_name)
        model.eval()
        inputs = processor(images=img, return_tensors="pt")
        with torch.no_grad():
            outputs = model(**inputs)
            logits = outputs.logits
            probs = torch.softmax(logits, dim=1).squeeze()
            is_ai = bool(torch.argmax(probs).item())
            confidence = float(probs[1].item()) if is_ai else float(probs[0].item())
        message = "AI-generated image detected." if is_ai else "Image appears original/authentic."
        return {
            "is_ai_generated": is_ai,
            "confidence": confidence,
            "message": message
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Image verification failed: {str(e)}")

@app.post("/analyze-product-link")
async def analyze_product_link(request: Request):
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
        GEMINI_API_KEY = "REMOVED"
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
        # Analyze product image with Gemini
        image_analysis = None
        if img_url and isinstance(img_url, str):
            try:
                img_resp = pyrequests.get(img_url, headers=headers, timeout=10)
                if img_resp.status_code == 200:
                    img = Image.open(io.BytesIO(img_resp.content)).convert('RGB')
                    buf = io.BytesIO()
                    img.save(buf, format='JPEG')
                    image_bytes = buf.getvalue()
                    image_b64 = base64.b64encode(image_bytes).decode('utf-8')
                    mime_type = 'image/jpeg'
                    GEMINI_API_KEY = "REMOVED"
                    GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"
                    prompt = {"text": 'Is this image AI-generated or real? Respond in this JSON format: {"label": "AI-generated" or "Real", "confidence": 0-100, "reason": "..."}'}
                    payload = {
                        "contents": [{
                            "parts": [
                                {
                                    "inline_data": {
                                        "mime_type": mime_type,
                                        "data": image_b64
                                    }
                                },
                                prompt
                            ]
                        }]
                    }
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
                            image_analysis = {
                                "label": result.get("label"),
                                "confidence": result.get("confidence"),
                                "reason": result.get("reason")
                            }
                        else:
                            image_analysis = {"message": "Could not parse Gemini response", "raw_response": text}
                    else:
                        image_analysis = {"error": f"Gemini API error: {gemini_resp.text}"}
            except Exception as e:
                image_analysis = {"error": str(e)}
        # Summarize product and reviews with Gemini
        summary = None
        try:
            GEMINI_API_KEY = "REMOVED"
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
        return {
            "product_title": title,
            "product_description": desc,
            "product_image_url": img_url,
            "reviews": reviews,
            "image_analysis": image_analysis,
            "summary": summary,
            "final_confidence_score": final_confidence_score
        }
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
    return result

@app.post("/signup")
def signup(user: UserSignup):
    if users_collection.find_one({"username": user.username}):
        raise HTTPException(status_code=400, detail="Username already exists.")
    users_collection.insert_one({"username": user.username, "password": user.password, "history": []})
    return {"message": "Signup successful."}

@app.post("/login")
def login(user: UserLogin):
    db_user = users_collection.find_one({"username": user.username, "password": user.password})
    if not db_user:
        raise HTTPException(status_code=401, detail="Invalid username or password.")
    return {"message": "Login successful.", "username": user.username}

@app.get("/health")
async def health_check():
    """Health check endpoint to verify service status"""
    return {
        "status": "healthy", 
        "service": "TrustBuddy Fake Review Detection",
        "version": "1.0.0"
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
    uvicorn.run(
        app, 
        host="0.0.0.0", 
        port=8000,
        reload=True,  # Enable auto-reload during development
        log_level="info"
    )