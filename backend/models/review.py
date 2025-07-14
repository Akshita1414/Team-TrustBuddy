from pydantic import BaseModel, Field, validator
from typing import Dict, List, Optional, Any
from datetime import datetime
from enum import Enum

class RiskLevel(str, Enum):
    """Enumeration for risk levels"""
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"

class BadgeColor(str, Enum):
    """Enumeration for badge colors"""
    GREEN = "green"
    YELLOW = "yellow"
    RED = "red"

class BadgeText(str, Enum):
    """Enumeration for badge text"""
    SAFE = "SAFE"
    WARNING = "WARNING"
    RISKY = "RISKY"

class ReviewRequest(BaseModel):
    """
    Request model for review analysis
    
    Attributes:
        review_text: The main review content to analyze
        product_name: Optional product name for context
        reviewer_name: Optional reviewer name
        rating: Optional rating (1-5 stars)
        review_date: Optional review date
        language: Optional language code (default: 'en')
    """
    review_text: str = Field(
        ..., 
        min_length=5, 
        max_length=5000,
        description="The review text to analyze for authenticity"
    )
    product_name: Optional[str] = Field(
        None, 
        max_length=200,
        description="Product name for context analysis"
    )
    reviewer_name: Optional[str] = Field(
        None, 
        max_length=100,
        description="Name of the reviewer"
    )
    rating: Optional[int] = Field(
        None, 
        ge=1, 
        le=5,
        description="Rating given by reviewer (1-5 stars)"
    )
    review_date: Optional[str] = Field(
        None,
        description="Date when review was posted (ISO format)"
    )
    language: Optional[str] = Field(
        "en",
        description="Language code of the review (default: English)"
    )

    @validator('review_text')
    def validate_review_text(cls, v):
        """Validate review text content"""
        if not v or not v.strip():
            raise ValueError('Review text cannot be empty')
        
        # Remove excessive whitespace
        v = ' '.join(v.split())
        
        if len(v) < 5:
            raise ValueError('Review text must be at least 5 characters long')
        
        return v

    @validator('rating')
    def validate_rating(cls, v):
        """Validate rating value"""
        if v is not None and (v < 1 or v > 5):
            raise ValueError('Rating must be between 1 and 5')
        return v

    @validator('review_date')
    def validate_review_date(cls, v):
        """Validate review date format"""
        if v is not None:
            try:
                datetime.fromisoformat(v.replace('Z', '+00:00'))
            except ValueError:
                raise ValueError('Invalid date format. Use ISO format (YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS)')
        return v

class TextAnalysis(BaseModel):
    """Model for text pattern analysis results"""
    repetitive_words: float = Field(..., description="Score for repetitive word usage")
    excessive_punctuation: float = Field(..., description="Score for excessive punctuation")
    spam_keywords: float = Field(..., description="Score for spam keyword detection")
    grammar_score: float = Field(..., description="Grammar quality score")
    length_score: float = Field(..., description="Text length appropriateness score")
    caps_ratio: float = Field(..., description="Ratio of capital letters")
    exclamation_ratio: Optional[float] = Field(None, description="Ratio of exclamation marks")
    question_ratio: Optional[float] = Field(None, description="Ratio of question marks")

class SentimentAnalysis(BaseModel):
    """Model for sentiment analysis results"""
    scores: Dict[str, float] = Field(..., description="Sentiment scores for positive, negative, neutral")
    extreme_sentiment: bool = Field(..., description="Whether sentiment is extremely positive/negative")
    dominant_sentiment: str = Field(..., description="The dominant sentiment (positive/negative/neutral)")
    sentiment_variance: Optional[float] = Field(None, description="Variance in sentiment scores")
    confidence: Optional[float] = Field(None, description="Confidence of sentiment prediction")

class CoherenceAnalysis(BaseModel):
    """Model for semantic coherence analysis results"""
    coherence_score: float = Field(..., description="Overall coherence score")
    product_relevance: bool = Field(..., description="Whether review is relevant to product")
    topic_consistency: Optional[float] = Field(None, description="Consistency of topics discussed")
    sentence_count: Optional[int] = Field(None, description="Number of sentences in review")

class MLAnalysis(BaseModel):
    """Model for machine learning analysis results"""
    authenticity_score: float = Field(..., description="ML model authenticity prediction")
    model_confidence: float = Field(..., description="Confidence of ML model prediction")

class DetailedAnalysis(BaseModel):
    """Model for comprehensive analysis results"""
    text_analysis: TextAnalysis = Field(..., description="Text pattern analysis results")
    sentiment_analysis: SentimentAnalysis = Field(..., description="Sentiment analysis results")
    coherence_analysis: CoherenceAnalysis = Field(..., description="Coherence analysis results")
    ml_analysis: MLAnalysis = Field(..., description="ML model analysis results")
    summary: str = Field(..., description="Summary of the analysis")

class ReviewResponse(BaseModel):
    """
    Response model for review analysis results
    
    Attributes:
        confidence_score: Overall confidence score (0.0 to 1.0)
        risk_level: Risk level assessment
        badge_color: Color for visual badge
        badge_text: Text for visual badge
        detailed_analysis: Comprehensive analysis breakdown
        recommendations: List of actionable recommendations
    """
    confidence_score: float = Field(
        ..., 
        ge=0.0, 
        le=1.0,
        description="Overall confidence score from 0.0 to 1.0"
    )
    risk_level: RiskLevel = Field(
        ...,
        description="Risk assessment level"
    )
    badge_color: BadgeColor = Field(
        ...,
        description="Color code for visual badge"
    )
    badge_text: BadgeText = Field(
        ...,
        description="Text to display on badge"
    )
    detailed_analysis: DetailedAnalysis = Field(
        ...,
        description="Detailed breakdown of all analyses"
    )
    recommendations: List[str] = Field(
        ...,
        description="List of actionable recommendations"
    )

    class Config:
        """Pydantic configuration"""
        use_enum_values = True
        schema_extra = {
            "example": {
                "confidence_score": 0.85,
                "risk_level": "LOW",
                "badge_color": "green",
                "badge_text": "SAFE",
                "detailed_analysis": {
                    "text_analysis": {
                        "repetitive_words": 0.1,
                        "excessive_punctuation": 0.05,
                        "spam_keywords": 0.0,
                        "grammar_score": 0.9,
                        "length_score": 1.0,
                        "caps_ratio": 0.02
                    },
                    "sentiment_analysis": {
                        "scores": {
                            "positive": 0.7,
                            "negative": 0.1,
                            "neutral": 0.2
                        },
                        "extreme_sentiment": False,
                        "dominant_sentiment": "positive"
                    },
                    "coherence_analysis": {
                        "coherence_score": 0.8,
                        "product_relevance": True
                    },
                    "ml_analysis": {
                        "authenticity_score": 0.85,
                        "model_confidence": 0.9
                    },
                    "summary": "Review appears authentic and trustworthy"
                },
                "recommendations": [
                    "✅ Review appears trustworthy and authentic",
                    "📖 Consider this review in your decision making"
                ]
            }
        }

class BatchReviewRequest(BaseModel):
    """Model for batch review analysis requests"""
    reviews: List[ReviewRequest] = Field(
        ...,
        min_items=1,
        max_items=100,
        description="List of reviews to analyze (max 100)"
    )

class BatchReviewResponse(BaseModel):
    """Model for batch review analysis responses"""
    results: List[ReviewResponse] = Field(
        ...,
        description="List of analysis results"
    )
    summary: Dict[str, Any] = Field(
        ...,
        description="Summary statistics for the batch"
    )

class AnalysisStats(BaseModel):
    """Model for analysis statistics"""
    total_reviews: int = Field(..., description="Total number of reviews analyzed")
    safe_reviews: int = Field(..., description="Number of safe reviews")
    warning_reviews: int = Field(..., description="Number of warning reviews")
    risky_reviews: int = Field(..., description="Number of risky reviews")
    average_confidence: float = Field(..., description="Average confidence score")
    most_common_issues: List[str] = Field(..., description="Most common issues found")

class ErrorResponse(BaseModel):
    """Model for error responses"""