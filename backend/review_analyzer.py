import re
import statistics
from datetime import datetime
from typing import Dict, List, Optional
from transformers import pipeline, AutoTokenizer, AutoModelForSequenceClassification
import torch
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
import string
from collections import Counter
import numpy as np
from textblob import TextBlob
import requests
import json
from models.review import ReviewRequest, ReviewResponse

# Download required NLTK data
try:
    nltk.download('punkt', quiet=True)
    nltk.download('stopwords', quiet=True)
    nltk.download('vader_lexicon', quiet=True)
except:
    pass

class ReviewAnalyzer:
    """Core analyzer class that initializes ML models and patterns"""
    
    def __init__(self):
        # Initialize sentiment analysis pipeline
        self.sentiment_analyzer = pipeline(
            "sentiment-analysis",
            model="cardiffnlp/twitter-roberta-base-sentiment-latest",
            return_all_scores=True
        )
        
        # Initialize fake review detection model (using a pre-trained model)
        try:
            self.fake_detector = pipeline(
                "text-classification",
                model="martin-ha/toxic-comment-model",
                return_all_scores=True
            )
        except:
            self.fake_detector = None
        
        # Initialize spam detection patterns
        self.spam_patterns = [
            r'\b(amazing|perfect|excellent|fantastic|incredible)\b.*\b(amazing|perfect|excellent|fantastic|incredible)\b',
            r'\b(buy|purchase|click|link|website|deal)\b.*\b(now|today|hurry|limited)\b',
            r'\b\d+\s*(star|stars)\b.*\b\d+\s*(star|stars)\b',
            r'\b(fake|scam|fraud|cheat|lie)\b',
            r'\$\d+|\d+\$|cheap|free|discount|sale',
            r'\b(best|worst)\b.*\b(ever|never)\b',
            r'\b(must|should|need to|have to)\b.*\b(buy|purchase|get|order)\b'
        ]
        
        # Load English stopwords
        try:
            self.stop_words = set(stopwords.words('english'))
        except:
            self.stop_words = set()

class FakeReviewDetector:
    """Main class for detecting fake reviews with comprehensive analysis"""
    
    def __init__(self):
        self.analyzer = ReviewAnalyzer()
    
    def analyze_text_patterns(self, text: str) -> Dict:
        """
        Analyze text for suspicious patterns that indicate fake reviews
        
        Args:
            text: Review text to analyze
            
        Returns:
            Dictionary containing various text pattern scores
        """
        results = {
            'repetitive_words': 0,
            'excessive_punctuation': 0,
            'spam_keywords': 0,
            'grammar_score': 0,
            'length_score': 0,
            'caps_ratio': 0,
            'exclamation_ratio': 0,
            'question_ratio': 0
        }
        
        if not text:
            return results
            
        # Check for repetitive words
        words = text.lower().split()
        if words:
            word_counts = Counter(words)
            most_common = word_counts.most_common(5)
            if most_common:
                results['repetitive_words'] = most_common[0][1] / len(words)
        
        # Check excessive punctuation
        punct_count = sum(1 for char in text if char in string.punctuation)
        results['excessive_punctuation'] = punct_count / len(text) if text else 0
        
        # Check exclamation and question ratios
        results['exclamation_ratio'] = text.count('!') / len(text) if text else 0
        results['question_ratio'] = text.count('?') / len(text) if text else 0
        
        # Check for spam patterns
        spam_matches = 0
        for pattern in self.analyzer.spam_patterns:
            if re.search(pattern, text, re.IGNORECASE):
                spam_matches += 1
        results['spam_keywords'] = spam_matches / len(self.analyzer.spam_patterns)
        
        # Grammar and spelling check using TextBlob
        try:
            blob = TextBlob(text)
            corrected = blob.correct()
            # Calculate grammar score based on corrections needed
            original_words = str(blob).split()
            corrected_words = str(corrected).split()
            
            differences = 0
            for i, (orig, corr) in enumerate(zip(original_words, corrected_words)):
                if orig != corr:
                    differences += 1
            
            results['grammar_score'] = max(0, 1 - (differences / len(original_words))) if original_words else 0.5
        except:
            results['grammar_score'] = 0.5
        
        # Length analysis
        word_count = len(words)
        if word_count < 10:
            results['length_score'] = 0.3  # Too short
        elif word_count > 300:
            results['length_score'] = 0.4  # Too long
        elif word_count > 200:
            results['length_score'] = 0.7  # Slightly long
        else:
            results['length_score'] = 1.0  # Good length
        
        # Caps ratio
        if text:
            caps_count = sum(1 for char in text if char.isupper())
            results['caps_ratio'] = caps_count / len(text)
        
        return results
    
    def analyze_sentiment(self, text: str) -> Dict:
        """
        Analyze sentiment for extreme patterns that might indicate fake reviews
        
        Args:
            text: Review text to analyze
            
        Returns:
            Dictionary containing sentiment analysis results
        """
        try:
            sentiment_results = self.analyzer.sentiment_analyzer(text)[0]
            
            # Convert to a more readable format
            sentiment_scores = {}
            for result in sentiment_results:
                label = result['label'].lower()
                if 'positive' in label:
                    sentiment_scores['positive'] = result['score']
                elif 'negative' in label:
                    sentiment_scores['negative'] = result['score']
                else:
                    sentiment_scores['neutral'] = result['score']
            
            # Check for extreme sentiment (potential fake indicator)
            max_score = max(sentiment_scores.values())
            extreme_sentiment = max_score > 0.95  # Very extreme sentiment
            
            # Calculate sentiment variance (balanced reviews have more variance)
            sentiment_variance = np.var(list(sentiment_scores.values()))
            
            return {
                'scores': sentiment_scores,
                'extreme_sentiment': extreme_sentiment,
                'dominant_sentiment': max(sentiment_scores.keys(), key=lambda k: sentiment_scores[k]),
                'sentiment_variance': float(sentiment_variance),
                'confidence': max_score
            }
        except Exception as e:
            return {
                'scores': {'positive': 0.33, 'negative': 0.33, 'neutral': 0.34},
                'extreme_sentiment': False,
                'dominant_sentiment': 'neutral',
                'sentiment_variance': 0.0,
                'confidence': 0.5
            }
    
    def analyze_semantic_coherence(self, text: str, product_name: str = None) -> Dict:
        """
        Check if review content matches product context and is coherent
        
        Args:
            text: Review text to analyze
            product_name: Optional product name for context matching
            
        Returns:
            Dictionary containing coherence analysis results
        """
        coherence_score = 0.5  # Default neutral score
        product_relevance = False
        
        if product_name and text:
            # Simple keyword matching (can be enhanced with more sophisticated NLP)
            product_words = set(product_name.lower().split())
            review_words = set(text.lower().split())
            
            # Remove stopwords
            product_words = product_words - self.analyzer.stop_words
            review_words = review_words - self.analyzer.stop_words
            
            if product_words and review_words:
                overlap = len(product_words.intersection(review_words))
                coherence_score = min(1.0, overlap / len(product_words))
                product_relevance = coherence_score > 0.3
        
        # Additional coherence checks
        sentences = text.split('.')
        sentence_count = len([s for s in sentences if s.strip()])
        
        # Check for topic consistency (basic implementation)
        topic_consistency = 0.7 if sentence_count > 1 else 0.5
        
        return {
            'coherence_score': coherence_score,
            'product_relevance': product_relevance,
            'topic_consistency': topic_consistency,
            'sentence_count': sentence_count
        }
    
    def get_ml_prediction(self, text: str) -> Dict:
        """
        Get ML model prediction for review authenticity
        
        Args:
            text: Review text to analyze
            
        Returns:
            Dictionary containing ML prediction results
        """
        if not self.analyzer.fake_detector:
            return {'authenticity_score': 0.5, 'model_confidence': 0.5}
        
        try:
            ml_result = self.analyzer.fake_detector(text)
            # Assuming the model returns toxicity score, we invert it for authenticity
            if ml_result and len(ml_result) > 0:
                toxicity_score = ml_result[0]['score'] if ml_result[0]['label'] == 'TOXIC' else 1 - ml_result[0]['score']
                return {
                    'authenticity_score': 1 - toxicity_score,
                    'model_confidence': ml_result[0]['score']
                }
        except Exception as e:
            pass
        
        return {'authenticity_score': 0.5, 'model_confidence': 0.5}
    
    def calculate_confidence_score(self, analyses: Dict) -> float:
        """
        Calculate overall confidence score based on all analyses
        
        Args:
            analyses: Dictionary containing all analysis results
            
        Returns:
            Float confidence score between 0 and 1
        """
        weights = {
            'text_patterns': 0.3,
            'sentiment': 0.25,
            'semantic_coherence': 0.2,
            'ml_prediction': 0.25
        }
        
        # Text pattern score (lower suspicious patterns = higher authenticity)
        text_patterns = analyses['text_patterns']
        text_score = 1 - (
            text_patterns['repetitive_words'] * 0.25 +
            text_patterns['excessive_punctuation'] * 0.15 +
            text_patterns['spam_keywords'] * 0.3 +
            (1 - text_patterns['grammar_score']) * 0.1 +
            (1 - text_patterns['length_score']) * 0.05 +
            text_patterns['caps_ratio'] * 0.1 +
            text_patterns['exclamation_ratio'] * 0.05
        )
        
        # Sentiment score (extreme sentiment might indicate fake)
        sentiment_analysis = analyses['sentiment']
        sentiment_score = 0.3 if sentiment_analysis['extreme_sentiment'] else 0.8
        # Adjust for sentiment variance (balanced sentiment is more authentic)
        sentiment_score += min(0.2, sentiment_analysis['sentiment_variance'] * 2)
        
        # Semantic coherence score
        coherence_analysis = analyses['semantic_coherence']
        coherence_score = (
            coherence_analysis['coherence_score'] * 0.6 +
            coherence_analysis['topic_consistency'] * 0.4
        )
        
        # ML prediction score
        ml_score = analyses.get('ml_prediction', {}).get('authenticity_score', 0.5)
        
        # Calculate weighted average
        total_score = (
            text_score * weights['text_patterns'] +
            sentiment_score * weights['sentiment'] +
            coherence_score * weights['semantic_coherence'] +
            ml_score * weights['ml_prediction']
        )
        
        return max(0.0, min(1.0, total_score))
    
    def get_risk_level_and_badge(self, confidence_score: float) -> Dict:
        """
        Determine risk level and badge based on confidence score
        
        Args:
            confidence_score: Float score between 0 and 1
            
        Returns:
            Dictionary containing risk level and badge information
        """
        if confidence_score >= 0.7:
            return {
                'risk_level': 'LOW',
                'badge_color': 'green',
                'badge_text': 'SAFE',
                'description': 'Review appears authentic and trustworthy'
            }
        elif confidence_score >= 0.4:
            return {
                'risk_level': 'MEDIUM',
                'badge_color': 'yellow',
                'badge_text': 'WARNING',
                'description': 'Review has some suspicious elements, proceed with caution'
            }
        else:
            return {
                'risk_level': 'HIGH',
                'badge_color': 'red',
                'badge_text': 'RISKY',
                'description': 'Review likely fake or heavily manipulated'
            }
    
    def generate_recommendations(self, analyses: Dict, risk_level: str) -> List[str]:
        """
        Generate actionable recommendations based on analysis results
        
        Args:
            analyses: Dictionary containing all analysis results
            risk_level: Risk level string (LOW, MEDIUM, HIGH)
            
        Returns:
            List of recommendation strings
        """
        recommendations = []
        
        if risk_level == 'HIGH':
            recommendations.append("❌ Consider this review with extreme caution")
            recommendations.append("🔍 Look for similar reviews from other verified users")
            recommendations.append("📊 Check reviewer's profile and review history")
            recommendations.append("🚨 This review may be fake or manipulated")
        
        elif risk_level == 'MEDIUM':
            recommendations.append("⚠️ Review this content with some caution")
            recommendations.append("🔍 Cross-reference with other reviews")
            recommendations.append("📈 Consider overall product rating trends")
        
        else:
            recommendations.append("✅ Review appears trustworthy and authentic")
            recommendations.append("📖 Consider this review in your decision making")
            recommendations.append("👍 Reviewer shows genuine experience patterns")
        
        # Specific recommendations based on analysis
        text_patterns = analyses['text_patterns']
        if text_patterns['spam_keywords'] > 0.3:
            recommendations.append("🚫 Contains promotional or spam-like language")
        
        if text_patterns['repetitive_words'] > 0.3:
            recommendations.append("🔄 Uses repetitive language patterns")
        
        if analyses['sentiment']['extreme_sentiment']:
            recommendations.append("😲 Shows extremely positive/negative sentiment")
        
        if not analyses['semantic_coherence']['product_relevance']:
            recommendations.append("❓ Review content may not match the product")
        
        if text_patterns['grammar_score'] < 0.5:
            recommendations.append("✍️ Review contains grammar or spelling issues")
        
        return recommendations
    
    def analyze_review(self, request: ReviewRequest) -> ReviewResponse:
        """
        Main method to analyze a review for authenticity
        
        Args:
            request: ReviewRequest object containing review data
            
        Returns:
            ReviewResponse object with complete analysis results
        """
        try:
            # Perform all analyses
            analyses = {
                'text_patterns': self.analyze_text_patterns(request.review_text),
                'sentiment': self.analyze_sentiment(request.review_text),
                'semantic_coherence': self.analyze_semantic_coherence(
                    request.review_text, 
                    request.product_name
                ),
                'ml_prediction': self.get_ml_prediction(request.review_text)
            }
            
            # Calculate confidence score
            confidence_score = self.calculate_confidence_score(analyses)
            
            # Get risk level and badge
            risk_info = self.get_risk_level_and_badge(confidence_score)
            
            # Generate recommendations
            recommendations = self.generate_recommendations(analyses, risk_info['risk_level'])
            
            return ReviewResponse(
                confidence_score=round(confidence_score, 3),
                risk_level=risk_info['risk_level'],
                badge_color=risk_info['badge_color'],
                badge_text=risk_info['badge_text'],
                detailed_analysis={
                    'text_analysis': analyses['text_patterns'],
                    'sentiment_analysis': analyses['sentiment'],
                    'coherence_analysis': analyses['semantic_coherence'],
                    'ml_analysis': analyses['ml_prediction'],
                    'summary': risk_info['description']
                },
                recommendations=recommendations
            )
            
        except Exception as e:
            # Return a default response in case of error
            return ReviewResponse(
                confidence_score=0.5,
                risk_level='MEDIUM',
                badge_color='yellow',
                badge_text='WARNING',
                detailed_analysis={
                    'text_analysis': {},
                    'sentiment_analysis': {},
                    'coherence_analysis': {},
                    'ml_analysis': {},
                    'summary': f'Analysis failed: {str(e)}'
                },
                recommendations=['⚠️ Analysis could not be completed, manual review recommended']
            )