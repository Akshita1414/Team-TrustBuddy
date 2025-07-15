import React from 'react';
import {
  CheckCircle,
  Upload,
  AlertTriangle,
  Shield,
  Download,
  Share2,
  Save,
  ThumbsUp,
  RefreshCw,
  BarChart3,
  MessageSquare,
  Brain
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { getScoreColor, getBadgeColor, getTrustBadge } from '../utils/trustUtils';
import { AnalysisCard } from './AnalysisCard';

// Add a helper for translating dynamic AI output
async function translateText(text, language) {
  // TODO: Integrate with a translation API (Google Translate, Gemini, etc.)
  // For now, just return the original text
  return text;
}

export function ResultsSection({ analysisResult, onNewAnalysis, imageVerification, selectedImage, isVerifyingImage, showBackButton, productLinkResult }) {
  const { t, language } = useLanguage();

  // Show product link analysis if present
  if (productLinkResult) {
    // Handle anti-bot/CAPTCHA/blocked site errors
    const errorDetail = (Array.isArray(productLinkResult) && productLinkResult[0]?.detail) ? productLinkResult[0].detail : productLinkResult.detail;
    const isBlocked = errorDetail && (
      /access denied|url not reachable|captcha|anti-bot|blocked|not possible/i.test(errorDetail)
    );
    if (isBlocked) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[300px] p-8">
          <div className="text-2xl font-bold text-blue-900 mb-4">Coming Soon...</div>
          <div className="text-lg text-gray-700 mb-2 text-center">We currently do not support real-time analysis for this platform.</div>
          <div className="font-semibold text-gray-800 mt-4 mb-1">Why?</div>
          <div className="text-gray-600 text-center max-w-xl mb-4">
            Some websites use strict anti-bot mechanisms such as CAPTCHA and request blocking, which prevent us from securely and reliably fetching review or product data.
          </div>
          <div className="text-blue-700 font-medium mb-4">We’re actively working on a solution to support these platforms soon. Stay tuned!</div>
          <div className="text-gray-700 text-center mb-2">You can still manually analyze reviews for this product.</div>
          <button
            className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow transition-all"
            onClick={() => {
              if (typeof window !== 'undefined') {
                // Find the tab button by its text content
                const buttons = Array.from(document.querySelectorAll('button'));
                const reviewTabBtn = buttons.find(btn => btn.textContent.trim() === 'Review Text');
                if (reviewTabBtn) reviewTabBtn.click();
                else window.location.hash = '#review-text';
              }
            }}
          >
            Go to Review Text Tab
          </button>
        </div>
      );
    }
    const { product_title, product_description, product_image_url, reviews, image_analysis, summary } = productLinkResult;
    return (
      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-blue-200 animate-fade-in">
          <h2 className="text-2xl font-bold text-blue-900 mb-4">{t('Product Link Analysis')}</h2>
          <div className="mb-4">
            <div className="text-lg font-semibold text-gray-800">{product_title}</div>
            <div className="text-gray-600 mb-2">{product_description}</div>
            {product_image_url ? (
              <img 
                src={product_image_url} 
                alt="Product" 
                className="h-40 rounded-xl shadow mb-4 border-2 border-blue-200"
                onError={e => { e.target.onerror = null; e.target.style.display = 'none'; e.target.parentNode.appendChild(document.createTextNode('Product image not available.')); }}
              />
            ) : (
              <div className="text-gray-400 italic mb-4">Product image not available.</div>
            )}
          </div>
          <div className="mb-4">
            <h3 className="font-semibold text-blue-700 mb-2">{t('Extracted Reviews')}</h3>
            <ul className="list-disc pl-6 space-y-1 text-gray-700">
              {reviews && reviews.map((rv, idx) => <li key={idx}>{rv}</li>)}
            </ul>
          </div>
          <div className="mb-4">
            <h3 className="font-semibold text-blue-700 mb-2">{t('Image Authenticity')}</h3>
            {image_analysis ? (
              <div className="p-4 rounded-lg border-2 bg-blue-50 border-blue-200">
                <div className="font-semibold">Label: <span className={image_analysis.label === 'AI-generated' ? 'text-red-600' : 'text-green-600'}>{image_analysis.label}</span></div>
                <div>Confidence: <span className="font-semibold">{typeof image_analysis.confidence === 'number' ? `${Math.round(image_analysis.confidence * 100)}%` : 'N/A'}</span></div>
                <div className="text-gray-700 mt-1">{image_analysis.reason}</div>
              </div>
            ) : (
              <div className="text-gray-500">
                {t('No image analysis available.')}
                {productLinkResult && (
                  <pre className="text-xs text-red-500 mt-2">{JSON.stringify(productLinkResult, null, 2)}</pre>
                )}
              </div>
            )}
          </div>
          <div className="mb-4">
            <h3 className="font-semibold text-blue-700 mb-2">{t('AI Recommendation')}</h3>
            {typeof productLinkResult?.final_confidence_score === 'number' && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-blue-900 font-semibold text-center">
                Final Confidence Score: {Math.round(productLinkResult.final_confidence_score * 100)}%
                {(() => {
                  const hasReview = Array.isArray(productLinkResult.reviews) && productLinkResult.reviews.length > 0;
                  const imageConf = productLinkResult.image_analysis && typeof productLinkResult.image_analysis.confidence === 'number' && productLinkResult.image_analysis.confidence > 0;
                  if (hasReview && imageConf) return ' (average of reviews and image)';
                  if (hasReview) return ' (based on reviews)';
                  if (imageConf) return ' (based on image)';
                  return '';
                })()}
              </div>
            )}
            {summary ? (
              <div className={`p-4 rounded-lg border-2 ${summary.recommendation === 'Buy' ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
                <div className="font-bold text-lg mb-1">
                  {summary.recommendation === 'Buy' ? <span className="text-green-700">{t('Recommended to Buy')}</span> : <span className="text-red-700">{t('Not Recommended')}</span>}
                </div>
                <div className="text-gray-700">{summary.reason}</div>
              </div>
            ) : (
              <div className="text-gray-500">
                {t('No recommendation available.')}
                {productLinkResult && (
                  <pre className="text-xs text-red-500 mt-2">{JSON.stringify(productLinkResult, null, 2)}</pre>
                )}
              </div>
            )}
          </div>
        </div>
        {showBackButton && (
          <div className="flex justify-center mt-8">
            <button
              onClick={onNewAnalysis}
              className="px-6 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold text-lg shadow-lg transition-all duration-200"
            >
              {t('Back to Input')}
            </button>
          </div>
        )}
      </div>
    );
  }

  // Only show the 'no results' message if neither review nor image result is present
  if (!analysisResult && !imageVerification) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500">{t('No analysis results available')}</div>
      </div>
    );
  }

  // Destructure only if analysisResult exists
  const confidence_score = analysisResult?.confidence_score;
  const risk_level = analysisResult?.risk_level;
  const badge_color = analysisResult?.badge_color;
  const badge_text = analysisResult?.badge_text;
  const detailed_analysis = analysisResult?.detailed_analysis;
  const recommendations = analysisResult?.recommendations;

  const confidencePercentage = confidence_score ? Math.round(confidence_score * 100) : null;
  const trustBadge = confidencePercentage !== null ? getTrustBadge(confidencePercentage) : null;

  return (
    <div className="space-y-8">
      {/* Product Image Verification Result */}
      {(selectedImage || isVerifyingImage || imageVerification) && (
        <div className="relative bg-gradient-to-br from-blue-100 via-white to-green-100 rounded-3xl shadow-2xl p-10 border-4 border-blue-200 flex flex-col items-center mb-8 animate-fade-in">
          <h3 className="text-3xl font-extrabold text-blue-900 mb-6 tracking-tight drop-shadow-lg">{t('Product Image Authenticity')}</h3>
          {selectedImage && (
            <img src={URL.createObjectURL(selectedImage)} alt="Product Preview" className="h-48 w-48 object-cover rounded-2xl shadow-xl mb-6 border-4 border-white" />
          )}
          {isVerifyingImage && (
            <div className="text-blue-600 font-bold text-lg mt-2 animate-pulse">{t('Analyzing image authenticity...')}</div>
          )}
          {imageVerification && !isVerifyingImage && (
            <div className="flex flex-col items-center w-full">
              <div className={`flex items-center justify-center gap-3 text-3xl font-extrabold px-8 py-4 rounded-full mb-4 shadow-xl border-4 transition-all duration-300 ${imageVerification.is_ai_generated ? 'bg-gradient-to-r from-red-200 to-red-400 text-red-800 border-red-400 animate-bounce' : 'bg-gradient-to-r from-green-200 to-green-400 text-green-800 border-green-400 animate-pulse-slow'}`}>
                {imageVerification.is_ai_generated ? (
                  <AlertTriangle className="w-10 h-10 text-red-500 animate-shake" />
                ) : (
                  <Shield className="w-10 h-10 text-green-500 animate-bounce" />
                )}
                {imageVerification.is_ai_generated ? t('AI-Generated Image') : t('Authentic Image')}
              </div>
              {/* Recommendation line based on confidence and badge color */}
              {(() => {
                const conf = imageVerification.confidence;
                if (!imageVerification.is_ai_generated && conf >= 0.7) {
                  return <div className="text-green-700 font-semibold text-lg mb-2">{t('This product image looks genuine. You can buy it with confidence!')}</div>;
                } else if (!imageVerification.is_ai_generated && conf >= 0.4) {
                  return <div className="text-yellow-700 font-semibold text-lg mb-2">{t('This image is somewhat suspicious. Please verify further before buying.')}</div>;
                } else if (imageVerification.is_ai_generated && conf >= 0.7) {
                  return <div className="text-red-700 font-semibold text-lg mb-2">{t('Warning: This image is likely AI-generated. Be cautious before purchasing.')}</div>;
                } else {
                  return <div className="text-yellow-700 font-semibold text-lg mb-2">{t('This image may be AI-generated. Please verify further before buying.')}</div>;
                }
              })()}
              <div className="w-full max-w-sm mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1 font-semibold">
                  <span>{t('Confidence')}</span>
                  <span>{Math.round(imageVerification.confidence * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-5 shadow-inner">
                  <div
                    className={`h-5 rounded-full transition-all duration-500 ${imageVerification.is_ai_generated ? 'bg-gradient-to-r from-red-400 to-red-600' : 'bg-gradient-to-r from-green-400 to-green-600'}`}
                    style={{ width: `${Math.round(imageVerification.confidence * 100)}%` }}
                  ></div>
                </div>
              </div>
              {imageVerification.message && (
                <div className="text-lg text-gray-800 mt-4 text-center bg-white/80 rounded-xl px-6 py-4 border-2 border-gray-200 shadow-md font-medium">
                  {imageVerification.message}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Add fade-in and subtle animation keyframes */}
      <style>{`
        @keyframes fade-in { from { opacity: 0; transform: translateY(30px);} to { opacity: 1; transform: none; } }
        .animate-fade-in { animation: fade-in 0.8s cubic-bezier(.4,0,.2,1) both; }
        @keyframes bounce { 0%, 100% { transform: translateY(0);} 50% { transform: translateY(-10px);} }
        .animate-bounce { animation: bounce 1.2s infinite; }
        @keyframes pulse-slow { 0%, 100% { opacity: 1;} 50% { opacity: 0.7;} }
        .animate-pulse-slow { animation: pulse-slow 2.5s infinite; }
        @keyframes shake { 0%, 100% { transform: rotate(0deg);} 20% { transform: rotate(-10deg);} 40% { transform: rotate(10deg);} 60% { transform: rotate(-10deg);} 80% { transform: rotate(10deg);} }
        .animate-shake { animation: shake 0.7s infinite; }
      `}</style>

      {/* Only show review analysis results if available */}
      {analysisResult && (
        <>
          {/* Results Header */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">{t('AI Analysis Results')}</h2>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-sm text-gray-600">{t('Confidence Score')}</div>
                  <div className={`text-3xl font-bold ${getScoreColor(confidencePercentage)}`}>{confidencePercentage}%</div>
                </div>
                <div className={`px-4 py-2 rounded-xl border-2 font-semibold ${getBadgeColor(confidencePercentage)}`}>{badge_text}</div>
              </div>
            </div>
            {/* Risk Level Summary */}
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">{t('Risk Level')}</div>
                <div className={`text-lg font-semibold ${
                  risk_level === 'LOW' ? 'text-green-600' :
                  risk_level === 'MEDIUM' ? 'text-yellow-600' : 'text-red-600'
                }`}>{risk_level}</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">{t('Analysis Type')}</div>
                <div className="text-lg font-semibold text-gray-900">{t('AI-Powered')}</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">{t('Model Confidence')}</div>
                <div className="text-lg font-semibold text-blue-600">{detailed_analysis?.ml_analysis?.model_confidence !== undefined ? Math.round(detailed_analysis.ml_analysis.model_confidence * 100) + '%' : t('N/A')}</div>
              </div>
            </div>
          </div>

          {/* Analysis Details */}
          <div className="grid md:grid-cols-2 gap-6">
            <AnalysisCard icon={Brain} title={t('Text Pattern Analysis')} iconColor="text-purple-500">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">{t('Grammar Score')}</span>
                  <span className="text-green-600 font-semibold">{detailed_analysis?.text_analysis?.grammar_score !== undefined ? Math.round(detailed_analysis.text_analysis.grammar_score * 100) + '%' : t('N/A')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">{t('Length Score')}</span>
                  <span className="text-blue-600 font-semibold">{detailed_analysis?.text_analysis?.length_score !== undefined ? Math.round(detailed_analysis.text_analysis.length_score * 100) + '%' : t('N/A')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">{t('Repetitive Words')}</span>
                  <span className="text-yellow-600 font-semibold">{detailed_analysis?.text_analysis?.repetitive_words !== undefined ? Math.round(detailed_analysis.text_analysis.repetitive_words * 100) + '%' : t('N/A')}</span>
                </div>
                <div className="mt-4 p-3 bg-purple-50 rounded-lg">
                  <div className="text-sm text-purple-800 font-medium">{t('Analysis Summary:')}</div>
                  <div className="text-sm text-purple-700">{detailed_analysis.summary}</div>
                </div>
              </div>
            </AnalysisCard>
            <AnalysisCard icon={MessageSquare} title={t('Sentiment Analysis')} iconColor="text-blue-500">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">{t('Positive Sentiment')}</span>
                  <span className="text-green-600 font-semibold">{detailed_analysis?.sentiment_analysis?.scores?.positive !== undefined ? Math.round(detailed_analysis.sentiment_analysis.scores.positive * 100) + '%' : t('N/A')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">{t('Negative Sentiment')}</span>
                  <span className="text-red-600 font-semibold">{detailed_analysis?.sentiment_analysis?.scores?.negative !== undefined ? Math.round(detailed_analysis.sentiment_analysis.scores.negative * 100) + '%' : t('N/A')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">{t('Neutral Sentiment')}</span>
                  <span className="text-gray-600 font-semibold">{detailed_analysis?.sentiment_analysis?.scores?.neutral !== undefined ? Math.round(detailed_analysis.sentiment_analysis.scores.neutral * 100) + '%' : t('N/A')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">{t('Dominant Sentiment')}</span>
                  <span className="text-blue-600 font-semibold capitalize">{detailed_analysis?.sentiment_analysis?.dominant_sentiment ?? t('N/A')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">{t('Extreme Sentiment')}</span>
                  <span className="text-red-600 font-semibold">{detailed_analysis?.sentiment_analysis?.extreme_sentiment !== undefined ? (detailed_analysis.sentiment_analysis.extreme_sentiment ? t('Yes') : t('No')) : t('N/A')}</span>
                </div>
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <div className="text-sm text-blue-800 font-medium">{detailed_analysis?.sentiment_analysis?.extreme_sentiment !== undefined ? (detailed_analysis.sentiment_analysis.extreme_sentiment ? '⚠️ Extreme sentiment detected' : '✅ Balanced sentiment') : t('N/A')}</div>
                </div>
              </div>
            </AnalysisCard>
            <AnalysisCard icon={BarChart3} title={t('Coherence Analysis')} iconColor="text-green-500">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">{t('Coherence Score')}</span>
                  <span className="text-purple-600 font-semibold">{detailed_analysis?.coherence_analysis?.coherence_score !== undefined ? Math.round(detailed_analysis.coherence_analysis.coherence_score * 100) + '%' : t('N/A')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">{t('Product Relevance')}</span>
                  <span className="text-purple-600 font-semibold">{detailed_analysis?.coherence_analysis?.product_relevance !== undefined ? (detailed_analysis.coherence_analysis.product_relevance ? t('Yes') : t('No')) : t('N/A')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">{t('Topic Consistency')}</span>
                  <span className="text-purple-600 font-semibold">{detailed_analysis?.coherence_analysis?.topic_consistency !== undefined ? Math.round(detailed_analysis.coherence_analysis.topic_consistency * 100) + '%' : t('N/A')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">{t('Specificity Score')}</span>
                  <span className="text-purple-600 font-semibold">{detailed_analysis?.coherence_analysis?.specificity_score !== undefined ? Math.round(detailed_analysis.coherence_analysis.specificity_score * 100) + '%' : t('N/A')}</span>
                </div>
                <div className="mt-4 p-3 bg-green-50 rounded-lg">
                  <div className="text-sm text-green-800 font-medium">
                    {detailed_analysis?.coherence_analysis?.coherence_score !== undefined
                      ? (detailed_analysis.coherence_analysis.coherence_score > 0.7
                        ? '✅ Good coherence'
                        : detailed_analysis.coherence_analysis.coherence_score > 0.4
                        ? '⚠️ Moderate coherence'
                        : '❌ Poor coherence')
                      : t('N/A')}
                  </div>
                </div>
              </div>
            </AnalysisCard>
            <AnalysisCard icon={Shield} title={t('ML Model Analysis')} iconColor="text-orange-500">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">{t('Authenticity Score')}</span>
                  <span className={
                    detailed_analysis?.ml_analysis?.authenticity_score > 0.7 ? 'text-green-600 font-semibold' :
                    detailed_analysis?.ml_analysis?.authenticity_score > 0.4 ? 'text-yellow-600 font-semibold' :
                    'text-red-600 font-semibold'
                  }>
                    {detailed_analysis?.ml_analysis?.authenticity_score !== undefined ? Math.round(detailed_analysis.ml_analysis.authenticity_score * 100) + '%' : t('N/A')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">{t('Model Confidence')}</span>
                  <span className="text-blue-600 font-semibold">{detailed_analysis?.ml_analysis?.model_confidence !== undefined ? Math.round(detailed_analysis.ml_analysis.model_confidence * 100) + '%' : t('N/A')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">{t('Overall Assessment')}</span>
                  <span className={`font-semibold ${detailed_analysis?.ml_analysis?.authenticity_score !== undefined ? (detailed_analysis.ml_analysis.authenticity_score > 0.7 ? 'text-green-600' : detailed_analysis.ml_analysis.authenticity_score > 0.4 ? 'text-yellow-600' : 'text-red-600') : ''}`}>{detailed_analysis?.ml_analysis?.authenticity_score !== undefined ? (detailed_analysis.ml_analysis.authenticity_score > 0.7 ? 'Authentic' : detailed_analysis.ml_analysis.authenticity_score > 0.4 ? 'Suspicious' : 'Fake') : t('N/A')}</span>
                </div>
                <div className={`mt-4 px-3 py-1 rounded-xl text-sm font-semibold ${detailed_analysis?.ml_analysis?.authenticity_score > 0.7 ? 'bg-green-50 text-green-700' : detailed_analysis?.ml_analysis?.authenticity_score > 0.4 ? 'bg-yellow-50 text-yellow-700' : 'bg-red-50 text-red-700'}`}>
                  {t('AI Model Prediction:')} {detailed_analysis?.ml_analysis?.authenticity_score !== undefined ? Math.round(detailed_analysis.ml_analysis.authenticity_score * 100) + '%' : t('N/A')} {t('authentic')}
                </div>
              </div>
            </AnalysisCard>
          </div>

          {/* Recommendations */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">{t('Recommendations')}</h3>
            <div className="space-y-3">
              {(recommendations && Array.isArray(recommendations) && recommendations.length > 0)
                ? recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="text-green-500 mt-1">•</div>
                    <span className="text-gray-700">{recommendation}</span>
                  </div>
                ))
                : <div className="text-gray-500">{t('No recommendations available.')}</div>
              }
            </div>
          </div>
        </>
      )}

      {/* Action Buttons and Back Button */}
      {showBackButton && (
        <div className="flex justify-center mt-8">
          <button
            onClick={onNewAnalysis}
            className="px-6 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold text-lg shadow-lg transition-all duration-200"
          >
            {t('Back to Input')}
          </button>
        </div>
      )}
    </div>
  );
}
