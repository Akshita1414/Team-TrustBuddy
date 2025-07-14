from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from models.review import ReviewRequest, ReviewResponse
from core.review_analyzer import FakeReviewDetector
from PIL import Image
import io

# Initialize FastAPI app
app = FastAPI(
    title="TrustBuddy - Fake Review Detection API",
    description="API for detecting fake reviews with confidence scoring and visual badges",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize the detector
detector = FakeReviewDetector()

@app.post("/analyze-review", response_model=ReviewResponse)
async def analyze_review(request: ReviewRequest):
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
        return result
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Internal server error during analysis: {str(e)}"
        )

@app.post("/verify-image")
async def verify_image(image: UploadFile = File(...)):
    """
    Accepts a product image and determines if it is AI-generated or original.
    Uses lightweight heuristics (placeholder) for now.
    """
    try:
        # Read image bytes
        contents = await image.read()
        img = Image.open(io.BytesIO(contents))
        # Placeholder: check for common AI image signatures (e.g., very high resolution, no EXIF, etc.)
        exif = img.info.get('exif')
        width, height = img.size
        # Simple heuristics (replace with better logic or API as needed)
        is_ai = False
        confidence = 0.5
        message = "No strong AI signature detected."
        if (width > 2000 or height > 2000) and not exif:
            is_ai = True
            confidence = 0.8
            message = "High resolution and missing EXIF data (common in AI images)."
        elif not exif:
            is_ai = True
            confidence = 0.7
            message = "Missing EXIF data (possible AI image)."
        elif width > 3000 or height > 3000:
            is_ai = True
            confidence = 0.7
            message = "Very high resolution (possible AI image)."
        else:
            is_ai = False
            confidence = 0.8
            message = "Image appears original/authentic."
        return {
            "is_ai_generated": is_ai,
            "confidence": confidence,
            "message": message
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Image verification failed: {str(e)}")

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