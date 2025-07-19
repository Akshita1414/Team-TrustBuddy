import re
import statistics
from datetime import datetime
from typing import Dict, List, Optional
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
import os

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
        # Enhanced spam/fake patterns with more specificity
        self.spam_patterns = [
            r'\b(amazing|perfect|excellent|fantastic|incredible|outstanding|phenomenal|spectacular)\b.*\b(amazing|perfect|excellent|fantastic|incredible|outstanding|phenomenal|spectacular)\b',
            r'\b(buy|purchase|click|link|website|deal)\b.*\b(now|today|hurry|limited|urgent|immediately)\b',
            r'\b\d+\s*star[s]?\b.*\b\d+\s*star[s]?\b',
            r'\b(changed\s+my\s+life|life\s+changing|best\s+thing\s+ever|never\s+seen\s+anything\s+like\s+it)\b',
            r'\$\d+|\d+\$|cheap|free|discount|sale|deal|offer',
            r'\b(must\s+have|must\s+buy|everyone\s+should|recommend\s+to\s+everyone)\b',
            r'\b(works\s+perfectly|exactly\s+as\s+described|just\s+as\s+advertised)\b',
            r'\b(don\'t\s+miss|limited\s+time|act\s+now|hurry\s+up)\b',
            r'\b(five\s+stars?|5\s+stars?|⭐|★){2,}',
            r'\b(absolutely|totally|completely|100%)\s+(amazing|perfect|satisfied|recommend)\b'
        ]
        
        # Fake review phrases that are commonly used
        self.fake_phrases = [
            "changed my life", "best thing ever", "never seen anything like it",
            "works perfectly", "exactly as described", "five stars all the way",
            "recommend to everyone", "don't miss this", "incredible deal",
            "absolutely amazing", "blown away", "exceeded expectations"
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
        Enhanced text pattern analysis with better fake detection
        """
        results = {
            'repetitive_words': 0,
            'excessive_punctuation': 0,
            'spam_keywords': 0,
            'grammar_score': 0,
            'length_score': 0,
            'caps_ratio': 0,
            'exclamation_ratio': 0,
            'question_ratio': 0,
            'fake_phrases_count': 0,
            'superlative_density': 0,
            'emotional_intensity': 0,
            'unique_word_ratio': 0.0
        }
        
        if not text:
            return results
            
        text_lower = text.lower()
        
        # Check for repetitive words (improved)
        words = text_lower.split()
        if words:
            word_counts = Counter(words)
            # Filter out common words and focus on content words
            content_words = [word for word in words if word not in self.analyzer.stop_words and len(word) > 2]
            if content_words:
                content_word_counts = Counter(content_words)
                most_common = content_word_counts.most_common(3)
                if most_common:
                    # Calculate repetition score more strictly
                    total_repetitions = sum(count for word, count in most_common if count > 1)
                    results['repetitive_words'] = min(1.0, total_repetitions / len(content_words))
        
        # Enhanced punctuation analysis
        exclamation_count = text.count('!')
        question_count = text.count('?')
        total_chars = len(text)
        
        if total_chars > 0:
            results['exclamation_ratio'] = exclamation_count / total_chars
            results['question_ratio'] = question_count / total_chars
            
            # Penalize excessive exclamations more heavily
            if exclamation_count > 3:
                results['excessive_punctuation'] = min(1.0, exclamation_count / 10)
            
            # Check for caps (yelling)
            caps_count = sum(1 for char in text if char.isupper())
            results['caps_ratio'] = caps_count / total_chars
        
        # Enhanced spam pattern detection
        spam_matches = 0
        for pattern in self.analyzer.spam_patterns:
            matches = len(re.findall(pattern, text, re.IGNORECASE))
            spam_matches += matches
        
        results['spam_keywords'] = min(1.0, spam_matches / 3)  # Normalize to 0-1
        
        # Check for fake phrases
        fake_phrase_count = 0
        for phrase in self.analyzer.fake_phrases:
            if phrase in text_lower:
                fake_phrase_count += 1
        results['fake_phrases_count'] = min(1.0, fake_phrase_count / 3)
        
        # Superlative density (amazing, incredible, perfect, etc.)
        superlatives = ['amazing', 'incredible', 'perfect', 'excellent', 'outstanding', 
                       'phenomenal', 'spectacular', 'fantastic', 'wonderful', 'brilliant']
        superlative_count = sum(text_lower.count(word) for word in superlatives)
        results['superlative_density'] = min(1.0, superlative_count / max(1, len(words) / 10))
        
        # Emotional intensity (multiple exclamations, caps, superlatives)
        emotional_indicators = exclamation_count + (caps_count / 10) + superlative_count
        results['emotional_intensity'] = min(1.0, emotional_indicators / max(1, len(words) / 5))
        
        # Lexical diversity (unique words / total words)
        if words:
            unique_word_ratio = len(set(words)) / len(words)
        else:
            unique_word_ratio = 0.0
        results['unique_word_ratio'] = unique_word_ratio
        
        # Grammar analysis (improved)
        try:
            blob = TextBlob(text)
            corrected = blob.correct()
            original_words = str(blob).split()
            corrected_words = str(corrected).split()
            
            if original_words:
                differences = sum(1 for orig, corr in zip(original_words, corrected_words) if orig != corr)
                results['grammar_score'] = max(0, 1 - (differences / len(original_words)))
            else:
                results['grammar_score'] = 0.5
        except:
            results['grammar_score'] = 0.5
        
        # Length analysis (more nuanced)
        word_count = len(words)
        if word_count < 5:
            results['length_score'] = 0.2  # Very short, likely fake
        elif word_count < 15:
            results['length_score'] = 0.6  # Short but could be genuine
        elif word_count <= 100:
            results['length_score'] = 1.0  # Good length
        elif word_count <= 200:
            results['length_score'] = 0.8  # Slightly long
        else:
            results['length_score'] = 0.5  # Very long, might be fake
        
        return results
    
    def analyze_sentiment(self, text: str) -> Dict:
        """
        Enhanced sentiment analysis focusing on fake patterns
        """
        # Dummy sentiment analysis for now (replace with API if needed)
        return {
            'scores': {'positive': 0.33, 'negative': 0.33, 'neutral': 0.34},
            'extreme_sentiment': False,
            'extreme_positive': False,
            'extreme_negative': False,
            'dominant_sentiment': 'neutral',
            'sentiment_variance': 0.0,
            'confidence': 0.5,
            'balance_score': 0.5
        }
    
    def analyze_semantic_coherence(self, text: str, product_name: str = None) -> Dict:
        """
        Enhanced semantic coherence analysis
        """
        coherence_score = 0.5
        product_relevance = False
        specificity_score = 0.5
        
        if not text:
            return {
                'coherence_score': coherence_score,
                'product_relevance': product_relevance,
                'topic_consistency': 0.5,
                'sentence_count': 0,
                'specificity_score': specificity_score
            }
        
        # Product relevance analysis
        if product_name and text:
            product_words = set(product_name.lower().split())
            review_words = set(text.lower().split())
            
            product_words = product_words - self.analyzer.stop_words
            review_words = review_words - self.analyzer.stop_words
            
            if product_words and review_words:
                overlap = len(product_words.intersection(review_words))
                coherence_score = min(1.0, overlap / len(product_words))
                product_relevance = coherence_score > 0.2
        
        # Specificity analysis - genuine reviews mention specific features
        specific_words = [
            'battery', 'screen', 'button', 'size', 'weight', 'color', 'material', 
            'feature', 'function', 'design', 'quality', 'performance', 'durability',
            'comfortable', 'heavy', 'light', 'smooth', 'rough', 'fast', 'slow',
            'week', 'month', 'day', 'hour', 'time', 'experience', 'issue', 'problem',
            'hydration', 'moisturizer', 'scent', 'greasy', 'absorb', 'camera', 'photo',
            'picture', 'sound', 'audio', 'speaker', 'display', 'resolution', 'touch',
            'build', 'finish', 'texture', 'fit', 'charging', 'usb', 'bluetooth', 'connect',
            'setup', 'installation', 'instructions', 'manual', 'support', 'service', 'customer',
            'price', 'value', 'packaging', 'shipping', 'delivery', 'return', 'refund', 'replacement',
            'durable', 'sturdy', 'fragile', 'easy', 'difficult', 'hard', 'simple', 'complicated',
            'recommend', 'daily', 'routine', 'effect', 'result', 'difference', 'notice', 'improvement',
            'lasting', 'charge', 'usage', 'portable', 'compact', 'large', 'small', 'lightweight', 'heavyweight'
        ]
        
        text_words = set(text.lower().split())
        specific_mentions = len(text_words.intersection(specific_words))
        specificity_score = min(1.0, specific_mentions / 5)  # Normalize to 0-1
        
        # Sentence analysis
        sentences = [s.strip() for s in text.split('.') if s.strip()]
        sentence_count = len(sentences)
        
        # Topic consistency (basic check for coherent narrative)
        topic_consistency = 0.7 if sentence_count > 1 else 0.5
        
        # Penalize reviews that are just lists of superlatives
        if sentence_count > 0:
            superlative_sentences = sum(1 for s in sentences if any(word in s.lower() 
                                      for word in ['amazing', 'perfect', 'incredible', 'fantastic']))
            if superlative_sentences / sentence_count > 0.8:
                topic_consistency *= 0.5
        
        return {
            'coherence_score': coherence_score,
            'product_relevance': product_relevance,
            'topic_consistency': topic_consistency,
            'sentence_count': sentence_count,
            'specificity_score': specificity_score
        }
    
    def get_ml_prediction(self, text: str) -> Dict:
        """
        Get ML model prediction for review authenticity
        """
        # Dummy ML prediction for now (replace with API if needed)
        return {'authenticity_score': 0.5, 'model_confidence': 0.5}
    
    def calculate_confidence_score(self, analyses: Dict) -> float:
        """
        Fixed confidence score calculation with proper weighting
        """
        # Extract analysis results
        text_patterns = analyses['text_patterns']
        sentiment_analysis = analyses['sentiment']
        coherence_analysis = analyses['semantic_coherence']
        ml_analysis = analyses.get('ml_prediction', {})
        
        # Calculate text suspicion score (higher = more suspicious)
        text_suspicion = (
            text_patterns['repetitive_words'] * 0.15 +
            text_patterns['excessive_punctuation'] * 0.08 +
            text_patterns['spam_keywords'] * 0.18 +
            text_patterns['fake_phrases_count'] * 0.15 +
            text_patterns['superlative_density'] * 0.15 +
            text_patterns['emotional_intensity'] * 0.08 +
            text_patterns['caps_ratio'] * 0.03 +
            text_patterns['exclamation_ratio'] * 0.08
        )

        # Lexical diversity bonus
        lexical_diversity = text_patterns.get('unique_word_ratio', 0.0)
        lexical_bonus = 0.10 if lexical_diversity > 0.5 else 0.0

        # Grammar and length contribute to authenticity
        grammar_authenticity = text_patterns['grammar_score'] * 0.25
        length_authenticity = text_patterns['length_score'] * 0.6
        text_authenticity = grammar_authenticity + length_authenticity + lexical_bonus

        # Calculate text score (0 = fake, 1 = authentic)
        text_score = max(0.0, (text_authenticity - text_suspicion))

        # Sentiment score (extreme sentiment is suspicious, but less aggressive)
        sentiment_score = 0.8  # Default
        if sentiment_analysis['extreme_positive'] and text_patterns['superlative_density'] > 0.4:
            sentiment_score = 0.3  # Only penalize if both are present
        elif sentiment_analysis['extreme_negative']:
            sentiment_score = 0.4
        elif sentiment_analysis['extreme_sentiment']:
            sentiment_score = 0.5
        else:
            sentiment_score = 0.6 + (sentiment_analysis['balance_score'] * 0.4)

        # Coherence score (specificity and relevance matter, more weight)
        coherence_score = (
            coherence_analysis['specificity_score'] * 0.5 +
            coherence_analysis['topic_consistency'] * 0.25 +
            (1.0 if coherence_analysis['product_relevance'] else 0.5) * 0.25
        )

        # ML score
        ml_score = ml_analysis.get('authenticity_score', 0.5)

        # Weighted final score with more emphasis on text and coherence
        weights = {
            'text': 0.45,
            'sentiment': 0.15,
            'coherence': 0.30,
            'ml': 0.10
        }

        final_score = (
            text_score * weights['text'] +
            sentiment_score * weights['sentiment'] +
            coherence_score * weights['coherence'] +
            ml_score * weights['ml']
        )

        # Only apply strong penalties if multiple suspicious signals are present
        suspicious_count = sum([
            text_patterns['fake_phrases_count'] > 0.5,
            text_patterns['spam_keywords'] > 0.6,
            text_patterns['superlative_density'] > 0.5,
            text_patterns['repetitive_words'] > 0.5,
            not coherence_analysis['product_relevance']
        ])
        if suspicious_count >= 2:
            final_score *= 0.6
        elif suspicious_count == 1:
            final_score *= 0.8

        # Add bonus for multi-sentence, specific reviews
        if coherence_analysis['sentence_count'] >= 2 and coherence_analysis['specificity_score'] > 0.5:
            final_score += 0.08
        # Reduce penalty for missing product relevance if specificity is high
        if not coherence_analysis['product_relevance'] and coherence_analysis['specificity_score'] > 0.6:
            final_score /= 0.7

        return max(0.0, min(1.0, final_score))
    
    def get_risk_level_and_badge(self, confidence_score: float) -> Dict:
        """
        Determine risk level and badge based on confidence score
        """
        if confidence_score >= 0.6:
            return {
                'risk_level': 'SAFE',
                'badge_color': 'green',
                'badge_text': 'SAFE',
                'description': 'Review appears genuine and trustworthy'
            }
        elif confidence_score >= 0.3:
            return {
                'risk_level': 'WARNING',
                'badge_color': 'yellow',
                'badge_text': 'WARNING',
                'description': 'Review has suspicious elements, verify carefully'
            }
        else:
            return {
                'risk_level': 'RISKY',
                'badge_color': 'red',
                'badge_text': 'RISKY',
                'description': 'Review likely fake or heavily manipulated'
            }
    
    def generate_recommendations(self, analyses: Dict, risk_level: str) -> List[str]:
        """
        Generate specific recommendations based on detected patterns
        """
        recommendations = []
        text_patterns = analyses['text_patterns']
        sentiment_analysis = analyses['sentiment']
        coherence_analysis = analyses['semantic_coherence']
        
        if risk_level == 'HIGH':
            recommendations.append("🚨 HIGH RISK: This review is likely fake")
            recommendations.append("❌ Do not rely on this review for purchasing decisions")
            recommendations.append("🔍 Look for verified purchase reviews instead")
            
            # Specific fake indicators
            if text_patterns['fake_phrases_count'] > 0.3:
                recommendations.append("⚠️ Contains common fake review phrases")
            if text_patterns['spam_keywords'] > 0.4:
                recommendations.append("🛑 Contains promotional/spam language")
            if sentiment_analysis['extreme_positive']:
                recommendations.append("📈 Extremely positive sentiment (fake indicator)")
            if text_patterns['superlative_density'] > 0.3:
                recommendations.append("💭 Overuse of superlatives (amazing, perfect, etc.)")
            
        elif risk_level == 'MEDIUM':
            recommendations.append("⚠️ MEDIUM RISK: Review has suspicious elements")
            recommendations.append("🔍 Cross-reference with other reviews")
            recommendations.append("📊 Consider overall product rating trends")
            
            # Specific warnings
            if text_patterns['emotional_intensity'] > 0.5:
                recommendations.append("😲 Unusually emotional language")
            if text_patterns['repetitive_words'] > 0.3:
                recommendations.append("🔄 Repetitive word usage")
            if not coherence_analysis['product_relevance']:
                recommendations.append("❓ Limited product-specific details")
                
        else:  # LOW RISK
            recommendations.append("✅ LOW RISK: Review appears authentic")
            recommendations.append("📖 Consider this review in your decision making")
            recommendations.append("👍 Shows genuine experience patterns")
            
            # Positive indicators
            if coherence_analysis['specificity_score'] > 0.6:
                recommendations.append("🎯 Contains specific product details")
            if text_patterns['grammar_score'] > 0.8:
                recommendations.append("✍️ Well-written with good grammar")
            if sentiment_analysis['balance_score'] > 0.3:
                recommendations.append("⚖️ Balanced sentiment (not overly extreme)")
        
        return recommendations
    
    def analyze_review(self, request: ReviewRequest) -> ReviewResponse:
        """
        Main method to analyze a review for authenticity
        """
        print(f"DEBUG: analyze_review called with text: {request.review_text[:100]}...")
        try:
            # Perform all analyses except fake detection
            analyses = {
                'text_patterns': self.analyze_text_patterns(request.review_text),
                'sentiment': self.analyze_sentiment(request.review_text),
                'semantic_coherence': self.analyze_semantic_coherence(
                    request.review_text, 
                    request.product_name
                ),
                # Use Hugging Face Inference API for fake review detection
                'ml_prediction': self.hf_fake_review_detection(request.review_text)
            }
            
            print(f"DEBUG: ML prediction result: {analyses['ml_prediction']}")
            
            # Calculate confidence score
            confidence_score = self.calculate_confidence_score(analyses)

            # Get risk level and badge
            risk_info = self.get_risk_level_and_badge(confidence_score)

            # Map risk_level to 'LOW', 'MEDIUM', 'HIGH' for Pydantic model
            risk_map = {'SAFE': 'LOW', 'WARNING': 'MEDIUM', 'RISKY': 'HIGH'}
            risk_level = risk_map.get(risk_info['risk_level'], 'MEDIUM')

            # Ensure ml_analysis fields are present
            ml_pred = analyses['ml_prediction']
            print(f"DEBUG: Final ML analysis assignment - ml_pred: {ml_pred}")
            
            if isinstance(ml_pred, dict) and 'score' in ml_pred:
                authenticity_score = ml_pred['score']
                model_confidence = ml_pred.get('model_confidence', ml_pred['score'])
                print(f"DEBUG: Final ML analysis - Authenticity: {authenticity_score}, Confidence: {model_confidence}")
            else:
                authenticity_score = 0.5
                model_confidence = 0.5
                print(f"DEBUG: Final ML analysis - Using defaults - Authenticity: {authenticity_score}, Confidence: {model_confidence}")

            # Generate recommendations
            recommendations = self.generate_recommendations(analyses, risk_info['risk_level'])

            return ReviewResponse(
                confidence_score=round(confidence_score, 3),
                risk_level=risk_level,
                badge_color=risk_info['badge_color'],
                badge_text=risk_info['badge_text'],
                detailed_analysis={
                    'text_analysis': analyses['text_patterns'],
                    'sentiment_analysis': analyses['sentiment'],
                    'coherence_analysis': analyses['semantic_coherence'],
                    'ml_analysis': {
                        'authenticity_score': authenticity_score,
                        'model_confidence': model_confidence
                    },
                    'summary': risk_info['description']
                },
                recommendations=recommendations
            )
            
        except Exception as e:
            # Provide safe defaults for all required fields
            from models.review import TextAnalysis, SentimentAnalysis, CoherenceAnalysis, MLAnalysis, DetailedAnalysis, RiskLevel, BadgeColor, BadgeText
            text_analysis = {
                'repetitive_words': 0.0,
                'excessive_punctuation': 0.0,
                'spam_keywords': 0.0,
                'grammar_score': 0.5,
                'length_score': 0.5,
                'caps_ratio': 0.0,
                'exclamation_ratio': 0.0,
                'question_ratio': 0.0,
                'fake_phrases_count': 0.0,
                'superlative_density': 0.0,
                'emotional_intensity': 0.0,
                'unique_word_ratio': 0.0
            }
            sentiment_analysis = {
                'scores': {'positive': 0.33, 'negative': 0.33, 'neutral': 0.34},
                'extreme_sentiment': False,
                'extreme_positive': False,
                'extreme_negative': False,
                'dominant_sentiment': 'neutral',
                'sentiment_variance': 0.0,
                'confidence': 0.5,
                'balance_score': 0.5
            }
            coherence_analysis = {
                'coherence_score': 0.5,
                'product_relevance': False,
                'topic_consistency': 0.5,
                'sentence_count': 0,
                'specificity_score': 0.5
            }
            ml_analysis = {
                'authenticity_score': 0.5,
                'model_confidence': 0.5
            }
            return ReviewResponse(
                confidence_score=0.5,
                risk_level='MEDIUM',
                badge_color='yellow',
                badge_text='WARNING',
                detailed_analysis={
                    'text_analysis': text_analysis,
                    'sentiment_analysis': sentiment_analysis,
                    'coherence_analysis': coherence_analysis,
                    'ml_analysis': ml_analysis,
                    'summary': f'Analysis failed: {str(e)}'
                },
                recommendations=['⚠️ Analysis could not be completed, manual review recommended']
            )

    def hf_fake_review_detection(self, text: str) -> dict:
        """
        Enhanced ML prediction for fake review detection with better logic
        """
        print(f"DEBUG: ML Analysis - Input text: {text[:100]}...")
        
        HF_API_TOKEN = os.environ.get("HF_API_TOKEN_TEXT")
        HF_API_URL = "https://api-inference.huggingface.co/models/martin-ha/toxic-comment-model"
        headers = {"Authorization": f"Bearer {HF_API_TOKEN}"}
        payload = {"inputs": text}
        
        try:
            print(f"DEBUG: ML Analysis - Calling Hugging Face API...")
            response = requests.post(HF_API_URL, headers=headers, json=payload, timeout=30)
            if response.status_code == 200:
                result = response.json()
                print(f"DEBUG: ML Analysis - API Response: {result}")
                
                # result is a list of list of dicts: [[{'label': 'toxic', 'score': ...}, ...]]
                if isinstance(result, list) and len(result) > 0 and isinstance(result[0], list):
                    best = max(result[0], key=lambda r: r['score'])
                    
                    # Convert toxic score to authenticity score (1 - toxic_score)
                    toxic_score = float(best['score'])
                    authenticity_score = 1.0 - toxic_score
                    
                    # Adjust model confidence based on the strength of the prediction
                    model_confidence = max(0.1, min(1.0, abs(toxic_score - 0.5) * 2))
                    
                    print(f"DEBUG: ML Analysis - Toxic score: {toxic_score}, Authenticity: {authenticity_score}, Confidence: {model_confidence}")
                    
                    return {
                        'label': best['label'],
                        'score': authenticity_score,  # Return authenticity score instead of toxic score
                        'model_confidence': model_confidence,
                        'raw': result
                    }
                else:
                    print(f"DEBUG: ML Analysis - Unexpected API response format, using fallback")
                    # Fallback to rule-based prediction if API response is unexpected
                    return self._fallback_ml_prediction(text)
            else:
                print(f"DEBUG: ML Analysis - API failed with status {response.status_code}, using fallback")
                # Fallback to rule-based prediction if API fails
                return self._fallback_ml_prediction(text)
        except Exception as e:
            print(f"DEBUG: ML Analysis - Exception: {str(e)}, using fallback")
            # Fallback to rule-based prediction if API fails
            return self._fallback_ml_prediction(text)
    
    def _fallback_ml_prediction(self, text: str) -> dict:
        """
        Rule-based fallback ML prediction when API is unavailable
        """
        print(f"DEBUG: Fallback ML Analysis - Using rule-based prediction")
        text_lower = text.lower()
        
        # Fake indicators
        fake_indicators = [
            'amazing', 'perfect', 'excellent', 'incredible', 'fantastic', 'outstanding',
            'phenomenal', 'spectacular', 'wonderful', 'brilliant', 'superb', 'marvelous',
            'changed my life', 'best thing ever', 'never seen anything like it',
            'works perfectly', 'exactly as described', 'five stars all the way',
            'recommend to everyone', 'don\'t miss this', 'incredible deal',
            'absolutely amazing', 'blown away', 'exceeded expectations',
            'must have', 'must buy', 'everyone should', 'hurry up', 'limited time',
            'act now', 'don\'t miss', 'urgent', 'immediately'
        ]
        
        # Genuine indicators
        genuine_indicators = [
            'good', 'nice', 'decent', 'okay', 'fine', 'satisfactory', 'adequate',
            'reasonable', 'fair', 'acceptable', 'moderate', 'average', 'standard',
            'works well', 'does the job', 'meets expectations', 'as expected',
            'good value', 'worth the money', 'reasonable price', 'fair price',
            'some issues', 'minor problems', 'could be better', 'room for improvement',
            'not perfect', 'has flaws', 'mixed feelings', 'pros and cons'
        ]
        
        # Count indicators
        fake_count = sum(1 for indicator in fake_indicators if indicator in text_lower)
        genuine_count = sum(1 for indicator in genuine_indicators if indicator in text_lower)
        
        print(f"DEBUG: Fallback ML Analysis - Fake indicators found: {fake_count}")
        print(f"DEBUG: Fallback ML Analysis - Genuine indicators found: {genuine_count}")
        
        # Calculate authenticity score
        total_indicators = fake_count + genuine_count
        if total_indicators == 0:
            authenticity_score = 0.5  # Neutral if no clear indicators
        else:
            # Weight genuine indicators more heavily
            authenticity_score = (genuine_count * 1.5) / (fake_count + genuine_count * 1.5)
            authenticity_score = max(0.1, min(0.9, authenticity_score))  # Clamp between 0.1 and 0.9
        
        # Model confidence based on indicator strength
        model_confidence = min(1.0, total_indicators / 5.0)  # Higher confidence with more indicators
        
        print(f"DEBUG: Fallback ML Analysis - Authenticity score: {authenticity_score}, Confidence: {model_confidence}")
        
        return {
            'label': 'authentic' if authenticity_score > 0.5 else 'fake',
            'score': authenticity_score,
            'model_confidence': model_confidence,
            'method': 'rule_based_fallback'
        }

    def analyze_product_name(self, product_name: str, language: str = "en") -> dict:
        """
        Analyze product name for fake/genuine detection using simple rules
        """
        suspicious_keywords = ["replica", "copy", "fake", "first copy", "duplicate"]
        genuine_keywords = ["official", "genuine", "authentic", "original", "certified"]
        name_lower = product_name.lower()
        if any(word in name_lower for word in suspicious_keywords):
            return {
                "confidence_score": 0.1,
                "risk_level": "HIGH",
                "badge_color": "red",
                "badge_text": "RISKY",
                "summary": "Product name contains suspicious keywords indicating it may be fake or a replica."
            }
        elif any(word in name_lower for word in genuine_keywords):
            return {
                "confidence_score": 0.9,
                "risk_level": "LOW",
                "badge_color": "green",
                "badge_text": "SAFE",
                "summary": "Product name contains keywords indicating it is likely genuine."
            }
        else:
            return {
                "confidence_score": 0.5,
                "risk_level": "MEDIUM",
                "badge_color": "yellow",
                "badge_text": "WARNING",
                "summary": "Product name does not contain clear indicators of being fake or genuine. Please verify further."
            }