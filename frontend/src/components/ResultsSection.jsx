import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { getScoreColor, getBadgeColor } from '../utils/trustUtils';
import { AnalysisCard } from './AnalysisCard';
import { speak, getVoiceLanguage, logAvailableVoices } from '../utils/voice';

export function ResultsSection({ analysisResult, onNewAnalysis, imageVerification, selectedImage, isVerifyingImage, showBackButton, productLinkResult }) {
  const { t, language } = useLanguage();
  
  // Debug: Log available voices on component mount
  React.useEffect(() => {
    logAvailableVoices();
  }, []);
  const [showProductLinkDetails, setShowProductLinkDetails] = useState(false);

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
          <h2 className="text-2xl font-bold text-blue-900 mb-4">Product Link Analysis</h2>
          <div className="mb-4">
            <div className="text-lg font-semibold text-gray-800 mb-2">
              {typeof product_title === 'string' ? product_title : typeof product_title === 'object' ? JSON.stringify(product_title) : String(product_title || '')}
            </div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-gray-600">
                {typeof product_description === 'string' ? product_description : typeof product_description === 'object' ? JSON.stringify(product_description) : String(product_description || '')}
              </div>
              <button
                className="px-2 py-1 rounded bg-blue-100 text-blue-700 text-xs font-semibold hover:bg-blue-200"
                onClick={() => speak(typeof product_description === 'string' ? product_description : typeof product_description === 'object' ? JSON.stringify(product_description) : String(product_description || ''), getVoiceLanguage(language))}
              >
                🔊 Listen
              </button>
            </div>
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
            <h3 className="font-semibold text-blue-700 mb-2">Extracted Reviews</h3>
            {reviews && reviews.length > 0 && (
              <div className="flex items-center justify-between mb-2">
                <div></div>
                <button
                  className="px-2 py-1 rounded bg-blue-100 text-blue-700 text-xs font-semibold hover:bg-blue-200"
                  onClick={() => speak(reviews.join('. '), getVoiceLanguage(language))}
                >
                  🔊 Listen
                </button>
              </div>
            )}
            <ul className="list-disc pl-6 space-y-1 text-gray-700">
              {reviews && reviews.map((rv, idx) => <li key={idx}>{rv}</li>)}
            </ul>
          </div>
          <div className="mb-4">
            <h3 className="font-semibold text-blue-700 mb-2">Image Authenticity</h3>
            {image_analysis ? (
              <div className="p-4 rounded-lg border-2 bg-blue-50 border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-semibold">Label: <span className={image_analysis.label === 'AI-generated' ? 'text-red-600' : 'text-green-600'}>{image_analysis.label}</span></div>
                  <button
                    className="px-2 py-1 rounded bg-blue-100 text-blue-700 text-xs font-semibold hover:bg-blue-200"
                    onClick={() => speak(`Image authenticity: ${image_analysis.label}. Confidence: ${typeof image_analysis.confidence === 'number' ? Math.round(image_analysis.confidence * 100) : 'N/A'}%. ${image_analysis.reason}`, getVoiceLanguage(language))}
                  >
                    🔊 Listen
                  </button>
                </div>
                <div>Confidence: <span className="font-semibold">{typeof image_analysis.confidence === 'number' ? `${Math.round(image_analysis.confidence * 100)}%` : 'N/A'}</span></div>
                <div className="text-gray-700 mt-1">{image_analysis.reason}</div>
              </div>
            ) : (
              <div className="text-gray-500">
                No image analysis available.
                {productLinkResult && (
                  <pre className="text-xs text-red-500 mt-2">{JSON.stringify(productLinkResult, null, 2)}</pre>
                )}
              </div>
            )}
          </div>
          <div className="mb-4">
            <h3 className="font-semibold text-blue-700 mb-2">AI Recommendation</h3>
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
                <div className="flex items-center mb-1">
                  <div className="font-bold text-lg">
                    {/* Show the backend's translated recommendation directly */}
                    {summary.recommendation}
                  </div>
                  <button
                    className="ml-3 px-2 py-1 rounded bg-blue-100 text-blue-700 text-sm font-semibold hover:bg-blue-200"
                    onClick={() => speak(summary.recommendation, getVoiceLanguage(language))}
                  >
                    🔊 Listen
                  </button>
                </div>
                {/* Remove the long summary.reason from the main view */}
                {/* <div className="text-gray-700">{summary.reason}</div> */}
                <div className="mt-2">
                  <button
                    className="text-blue-600 text-xs underline focus:outline-none"
                    onClick={() => setShowProductLinkDetails((v) => !v)}
                  >
                    {showProductLinkDetails ? 'Hide Details' : 'ℹ️ Show Details'}
                  </button>
                </div>
                {showProductLinkDetails && (
                  <div className="mt-4 bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                    <h4 className="font-bold text-gray-800 mb-4 text-lg">📋 Detailed Analysis Report</h4>
                    
                    {/* Product Information */}
                    <div className="mb-6">
                      <h5 className="font-semibold text-blue-700 mb-2 flex items-center gap-2">
                        <span>📦</span> {t('productInformation')}
                      </h5>
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <div className="space-y-2">
                          <p><strong className="text-blue-800">{t('title')}:</strong> 
                            <span className="ml-2 text-gray-700">{productLinkResult.product_title || 'Not available'}</span>
                          </p>
                          <p><strong className="text-blue-800">{t('description')}:</strong> 
                            <span className="ml-2 text-gray-700">{productLinkResult.product_description || 'Not available'}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Review Analysis */}
                    <div className="mb-6">
                      <h5 className="font-semibold text-green-700 mb-2 flex items-center gap-2">
                        <span>💬</span> {t('reviewAnalysis')}
                      </h5>
                      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-green-800">{t('totalReviewsFound')}:</span>
                            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                              Array.isArray(productLinkResult.reviews) && productLinkResult.reviews.length > 0
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {Array.isArray(productLinkResult.reviews) ? productLinkResult.reviews.length : 0}
                            </span>
                          </div>
                          {Array.isArray(productLinkResult.reviews) && productLinkResult.reviews.length > 0 ? (
                            <div>
                              <p className="font-semibold text-green-800 mb-2">{t('sampleReviews')}:</p>
                              <div className="space-y-2">
                                {productLinkResult.reviews.slice(0, 3).map((review, idx) => (
                                  <div key={idx} className="bg-white p-3 rounded border border-green-200">
                                    <p className="text-sm text-gray-700">"{review}"</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="bg-yellow-100 p-3 rounded border border-yellow-200">
                              <p className="text-yellow-800 text-sm">⚠️ No customer reviews found</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Image Analysis */}
                    <div className="mb-6">
                      <h5 className="font-semibold text-purple-700 mb-2 flex items-center gap-2">
                        <span>🖼️</span> {t('imageAuthenticity')}
                      </h5>
                      <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                        {productLinkResult.image_analysis && !productLinkResult.image_analysis.error ? (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-purple-800">Label:</span>
                              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                productLinkResult.image_analysis.label === 'REAL' || productLinkResult.image_analysis.label === 'AUTHENTIC' 
                                  ? 'bg-green-100 text-green-800' 
                                  : productLinkResult.image_analysis.label === 'FAKE' || productLinkResult.image_analysis.label === 'AI-GENERATED'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {productLinkResult.image_analysis.label || 'UNKNOWN'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-purple-800">Confidence:</span>
                              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                (productLinkResult.image_analysis.confidence || 0) >= 0.7
                                  ? 'bg-green-100 text-green-800'
                                  : (productLinkResult.image_analysis.confidence || 0) >= 0.4
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {Math.round((productLinkResult.image_analysis.confidence || 0) * 100)}%
                              </span>
                            </div>
                            <p className="text-sm text-gray-700">{productLinkResult.image_analysis.reason}</p>
                          </div>
                        ) : (
                          <div className="bg-red-100 p-3 rounded border border-red-200">
                            <p className="text-red-800 text-sm">❌ Image analysis failed</p>
                            {productLinkResult.image_analysis && productLinkResult.image_analysis.error && (
                              <p className="text-red-700 text-xs mt-1">{productLinkResult.image_analysis.error}</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Final Score */}
                    <div className="mb-6">
                      <h5 className="font-semibold text-orange-700 mb-2 flex items-center gap-2">
                        <span>🎯</span> {t('overallAssessment')}
                      </h5>
                      <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-orange-800">Final Confidence Score:</span>
                            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                              (productLinkResult.final_confidence_score || 0) >= 0.7
                                ? 'bg-green-100 text-green-800'
                                : (productLinkResult.final_confidence_score || 0) >= 0.4
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {Math.round((productLinkResult.final_confidence_score || 0) * 100)}%
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-orange-800">Recommendation:</span>
                            <span className={`px-3 py-1 rounded-full font-semibold ${
                              summary.recommendation === 'Buy' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {summary.recommendation}
                            </span>
                          </div>
                          {summary.reason && (
                            <div className="mt-3 p-3 bg-white rounded border border-orange-200">
                              <p className="font-semibold text-orange-800 mb-1">Detailed Reasoning:</p>
                              <p className="text-sm text-gray-700 leading-relaxed">{summary.reason}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Listen to Full Analysis */}
                    <div className="text-center">
                    <button
                        className="px-6 py-3 rounded-lg bg-blue-100 text-blue-700 font-semibold hover:bg-blue-200 transition-colors shadow-sm"
                        onClick={() => {
                          const analysisText = `Product Analysis Report. Product: ${productLinkResult.product_title}. 
                          Reviews found: ${Array.isArray(productLinkResult.reviews) ? productLinkResult.reviews.length : 0}. 
                          Image analysis: ${productLinkResult.image_analysis && !productLinkResult.image_analysis.error ? productLinkResult.image_analysis.label : 'Failed'}. 
                          Final confidence: ${Math.round((productLinkResult.final_confidence_score || 0) * 100)}%. 
                          Recommendation: ${summary.recommendation}.`;
                          speak(analysisText, getVoiceLanguage(language));
                        }}
                      >
                        🔊 Listen to Full Analysis
                    </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-gray-500">
                No recommendation available.
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
              Back to Input
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
        <div className="text-gray-500">No analysis results available</div>
      </div>
    );
  }

  // Destructure only if analysisResult exists
  const confidence_score = analysisResult?.confidence_score;
  const risk_level = analysisResult?.risk_level;
  const badge_text = analysisResult?.badge_text;
  const detailed_analysis = analysisResult?.detailed_analysis;
  const recommendations = analysisResult?.recommendations;

  const confidencePercentage = confidence_score ? Math.round(confidence_score * 100) : null;

  return (
    <div className="space-y-8">
      {/* Product Image Verification Result */}
      {(selectedImage || isVerifyingImage || imageVerification) && (
        <div className="relative bg-gradient-to-br from-blue-100 via-white to-green-100 rounded-3xl shadow-2xl p-10 border-4 border-blue-200 flex flex-col items-center mb-8 animate-fade-in">
          <h3 className="text-3xl font-extrabold text-blue-900 mb-6 tracking-tight drop-shadow-lg">{t('productImageAuthenticity')}</h3>
          {selectedImage && (
            <img src={URL.createObjectURL(selectedImage)} alt="Product Preview" className="h-48 w-48 object-cover rounded-2xl shadow-xl mb-6 border-4 border-white" />
          )}
          {isVerifyingImage && (
            <div className="text-blue-600 font-bold text-lg mt-2 animate-pulse">{t('analyzingImageAuthenticity')}</div>
          )}
          {imageVerification && !isVerifyingImage && (
            <div className="flex flex-col items-center w-full">
              <div className={`flex items-center justify-center gap-3 text-3xl font-extrabold px-8 py-4 rounded-full mb-4 shadow-xl border-4 transition-all duration-300 ${imageVerification.is_ai_generated ? 'bg-gradient-to-r from-red-200 to-red-400 text-red-800 border-red-400 animate-bounce' : 'bg-gradient-to-r from-green-200 to-green-400 text-green-800 border-green-400 animate-pulse-slow'}`}>
                {imageVerification.is_ai_generated ? (
                  <span className="text-red-500 animate-shake">⚠️</span>
                ) : (
                  <span className="text-green-500 animate-bounce">✅</span>
                )}
                {imageVerification.is_ai_generated ? t('aiGeneratedImage') : t('authenticImage')}
              </div>
              {/* Recommendation line based on confidence and badge color */}
              {(() => {
                const conf = imageVerification.confidence;
                if (!imageVerification.is_ai_generated && conf >= 0.7) {
                  return <div className="text-green-700 font-semibold text-lg mb-2">{t('imageLooksGenuine')}</div>;
                } else if (!imageVerification.is_ai_generated && conf >= 0.4) {
                  return <div className="text-yellow-700 font-semibold text-lg mb-2">{t('imageSomewhatSuspicious')}</div>;
                } else if (imageVerification.is_ai_generated && conf >= 0.7) {
                  return <div className="text-red-700 font-semibold text-lg mb-2">{t('warning')}</div>;
                } else {
                  return <div className="text-yellow-700 font-semibold text-lg mb-2">{t('imageMayBeAIGenerated')}</div>;
                }
              })()}
              <div className="w-full max-w-sm mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1 font-semibold">
                  <span>{t('confidence')}</span>
                  <span>{Math.round(imageVerification.confidence * 100)}{t('percent')}</span>
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
                  {(() => {
                    // Translate the message based on the label
                    const message = imageVerification.message.toLowerCase();
                    if (message.includes('real') || message.includes('authentic') || message.includes('original')) {
                      return t('imageAppearsOriginal');
                    } else if (message.includes('fake') || message.includes('ai-generated')) {
                      return t('aiGeneratedImageDetected');
                    } else {
                      return imageVerification.message; // Fallback to original message
                    }
                  })()}
                </div>
              )}
              <button
                className="mt-4 px-4 py-2 rounded-xl bg-blue-100 text-blue-700 font-semibold hover:bg-blue-200 transition-colors"
                onClick={() => {
                  const status = imageVerification.is_ai_generated ? t('aiGeneratedImage') : t('authenticImage');
                  const confidence = Math.round(imageVerification.confidence * 100);
                  const recommendation = (() => {
                    const conf = imageVerification.confidence;
                    if (!imageVerification.is_ai_generated && conf >= 0.7) {
                      return t('imageLooksGenuine');
                    } else if (!imageVerification.is_ai_generated && conf >= 0.4) {
                      return t('imageSomewhatSuspicious');
                    } else if (imageVerification.is_ai_generated && conf >= 0.7) {
                      return t('warning');
                    } else {
                      return t('imageMayBeAIGenerated');
                    }
                  })();
                  speak(`${status}. ${t('confidence')}: ${confidence}${t('percent')}. ${recommendation}`, getVoiceLanguage(language));
                }}
                              >
                  🔊 {t('listenToAnalysis')}
                </button>
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
              <h2 className="text-2xl font-bold text-gray-900">{t('aiAnalysisResults')}</h2>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-sm text-gray-600">{t('confidenceScore')}</div>
                  <div className={`text-3xl font-bold ${getScoreColor(confidencePercentage)}`}>{confidencePercentage}%</div>
                </div>
                <div className={`px-4 py-2 rounded-xl border-2 font-semibold ${getBadgeColor(confidencePercentage)}`}>{badge_text}</div>
                <button
                  className="px-3 py-2 rounded bg-blue-100 text-blue-700 text-sm font-semibold hover:bg-blue-200"
                  onClick={() => {
                    const summary = `${t('aiAnalysisResults')}. ${t('confidenceScore')}: ${confidencePercentage}${t('percent')}. ${t('riskLevel')}: ${risk_level === 'LOW' ? t('low') : risk_level === 'MEDIUM' ? t('medium') : risk_level === 'HIGH' ? t('high') : risk_level}. ${t('analysisType')}: ${t('aiPowered')}. ${t('modelConfidence')}: ${detailed_analysis?.ml_analysis?.model_confidence !== undefined ? Math.round(detailed_analysis.ml_analysis.model_confidence * 100) + t('percent') : t('na')}`;
                    speak(summary, getVoiceLanguage(language));
                  }}
                >
                  🔊 Listen
                </button>
              </div>
            </div>
            {/* Risk Level Summary */}
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">{t('riskLevel')}</div>
                <div className={`text-lg font-semibold ${
                  risk_level === 'LOW' ? 'text-green-600' :
                  risk_level === 'MEDIUM' ? 'text-yellow-600' : 'text-red-600'
                }`}>{risk_level === 'LOW' ? t('low') : risk_level === 'MEDIUM' ? t('medium') : risk_level === 'HIGH' ? t('high') : risk_level}</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">{t('analysisType')}</div>
                <div className="text-lg font-semibold text-gray-900">{t('aiPowered')}</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">{t('modelConfidence')}</div>
                <div className="text-lg font-semibold text-blue-600">{detailed_analysis?.ml_analysis?.model_confidence !== undefined ? Math.round(detailed_analysis.ml_analysis.model_confidence * 100) + t('percent') : t('na')}</div>
              </div>
            </div>
          </div>

          {/* Analysis Details */}
          <div className="grid md:grid-cols-2 gap-6">
            <AnalysisCard icon={null} title={t('textPatternAnalysis')} iconColor="text-purple-500">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">{t('grammarScore')}</span>
                  <span className="text-green-600 font-semibold">{detailed_analysis?.text_analysis?.grammar_score !== undefined ? Math.round(detailed_analysis.text_analysis.grammar_score * 100) + t('percent') : t('na')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">{t('lengthScore')}</span>
                  <span className="text-blue-600 font-semibold">{detailed_analysis?.text_analysis?.length_score !== undefined ? Math.round(detailed_analysis.text_analysis.length_score * 100) + t('percent') : t('na')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">{t('repetitiveWords')}</span>
                  <span className="text-yellow-600 font-semibold">{detailed_analysis?.text_analysis?.repetitive_words !== undefined ? Math.round(detailed_analysis.text_analysis.repetitive_words * 100) + t('percent') : t('na')}</span>
                </div>
                <div className="mt-4 p-3 bg-purple-50 rounded-lg">
                  <div className="text-sm text-purple-800 font-medium">{t('analysisSummary')}</div>
                  <div className="text-sm text-purple-700">
                    {(() => {
                      // Translate common summary patterns
                      const summary = detailed_analysis.summary?.toLowerCase() || '';
                      if (summary.includes('suspicious') && summary.includes('verify')) return t('reviewHasSuspiciousElements');
                      return detailed_analysis.summary; // Fallback to original if no pattern matches
                    })()}
                  </div>
                </div>
              </div>
            </AnalysisCard>
            <AnalysisCard icon={null} title={t('sentimentAnalysis')} iconColor="text-blue-500">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">{t('positiveSentiment')}</span>
                  <span className="text-green-600 font-semibold">{detailed_analysis?.sentiment_analysis?.scores?.positive !== undefined ? Math.round(detailed_analysis.sentiment_analysis.scores.positive * 100) + t('percent') : t('na')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">{t('negativeSentiment')}</span>
                  <span className="text-red-600 font-semibold">{detailed_analysis?.sentiment_analysis?.scores?.negative !== undefined ? Math.round(detailed_analysis.sentiment_analysis.scores.negative * 100) + t('percent') : t('na')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">{t('neutralSentiment')}</span>
                  <span className="text-gray-600 font-semibold">{detailed_analysis?.sentiment_analysis?.scores?.neutral !== undefined ? Math.round(detailed_analysis.sentiment_analysis.scores.neutral * 100) + t('percent') : t('na')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">{t('dominantSentiment')}</span>
                  <span className="text-blue-600 font-semibold capitalize">
                    {(() => {
                      const sentiment = detailed_analysis?.sentiment_analysis?.dominant_sentiment;
                      if (sentiment === 'neutral') return t('neutral');
                      if (sentiment === 'positive') return t('positive');
                      if (sentiment === 'negative') return t('negative');
                      return sentiment ?? t('na');
                    })()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">{t('extremeSentiment')}</span>
                  <span className="text-red-600 font-semibold">{detailed_analysis?.sentiment_analysis?.extreme_sentiment !== undefined ? (detailed_analysis.sentiment_analysis.extreme_sentiment ? t('yes') : t('no')) : t('na')}</span>
                </div>
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <div className="text-sm text-blue-800 font-medium">{detailed_analysis?.sentiment_analysis?.extreme_sentiment !== undefined ? (detailed_analysis.sentiment_analysis.extreme_sentiment ? '⚠️ ' + t('extremeSentimentDetected') : '✅ ' + t('balancedSentiment')) : t('na')}</div>
                </div>
              </div>
            </AnalysisCard>
            <AnalysisCard icon={null} title={t('coherenceAnalysis')} iconColor="text-green-500">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">{t('coherenceScore')}</span>
                  <span className="text-purple-600 font-semibold">{detailed_analysis?.coherence_analysis?.coherence_score !== undefined ? Math.round(detailed_analysis.coherence_analysis.coherence_score * 100) + t('percent') : t('na')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">{t('productRelevance')}</span>
                  <span className="text-purple-600 font-semibold">{detailed_analysis?.coherence_analysis?.product_relevance !== undefined ? (detailed_analysis.coherence_analysis.product_relevance ? t('yes') : t('no')) : t('na')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">{t('topicConsistency')}</span>
                  <span className="text-purple-600 font-semibold">{detailed_analysis?.coherence_analysis?.topic_consistency !== undefined ? Math.round(detailed_analysis.coherence_analysis.topic_consistency * 100) + t('percent') : t('na')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">{t('specificityScore')}</span>
                  <span className="text-purple-600 font-semibold">{detailed_analysis?.coherence_analysis?.specificity_score !== undefined ? Math.round(detailed_analysis.coherence_analysis.specificity_score * 100) + t('percent') : t('na')}</span>
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
            <AnalysisCard icon={null} title={t('mlModelAnalysis')} iconColor="text-orange-500">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">{t('authenticityScore')}</span>
                  <span className={
                    detailed_analysis?.ml_analysis?.authenticity_score > 0.7 ? 'text-green-600 font-semibold' :
                    detailed_analysis?.ml_analysis?.authenticity_score > 0.4 ? 'text-yellow-600 font-semibold' :
                    'text-red-600 font-semibold'
                  }>
                    {detailed_analysis?.ml_analysis?.authenticity_score !== undefined ? Math.round(detailed_analysis.ml_analysis.authenticity_score * 100) + t('percent') : t('na')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">{t('modelConfidence')}</span>
                  <span className="text-blue-600 font-semibold">{detailed_analysis?.ml_analysis?.model_confidence !== undefined ? Math.round(detailed_analysis.ml_analysis.model_confidence * 100) + t('percent') : t('na')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">{t('overallAssessment')}</span>
                  <span className={`font-semibold ${detailed_analysis?.ml_analysis?.authenticity_score !== undefined ? (detailed_analysis.ml_analysis.authenticity_score > 0.7 ? 'text-green-600' : detailed_analysis.ml_analysis.authenticity_score > 0.4 ? 'text-yellow-600' : 'text-red-600') : ''}`}>{detailed_analysis?.ml_analysis?.authenticity_score !== undefined ? (detailed_analysis.ml_analysis.authenticity_score > 0.7 ? t('authentic') : detailed_analysis.ml_analysis.authenticity_score > 0.4 ? 'Suspicious' : t('fake')) : t('na')}</span>
                </div>
                <div className={`mt-4 px-3 py-1 rounded-xl text-sm font-semibold ${detailed_analysis?.ml_analysis?.authenticity_score > 0.7 ? 'bg-green-50 text-green-700' : detailed_analysis?.ml_analysis?.authenticity_score > 0.4 ? 'bg-yellow-50 text-yellow-700' : 'bg-red-50 text-red-700'}`}>
                  {t('aiModelPrediction')}: {detailed_analysis?.ml_analysis?.authenticity_score !== undefined ? Math.round(detailed_analysis.ml_analysis.authenticity_score * 100) + t('percent') : t('na')} {t('authentic')}
                </div>
              </div>
            </AnalysisCard>
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
