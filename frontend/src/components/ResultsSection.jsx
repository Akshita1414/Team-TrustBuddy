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

export function ResultsSection({ analysisResult, onNewAnalysis, imageVerification, selectedImage, isVerifyingImage, showBackButton }) {
  const { t } = useLanguage();

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
          <h3 className="text-3xl font-extrabold text-blue-900 mb-6 tracking-tight drop-shadow-lg">Product Image Authenticity</h3>
          {selectedImage && (
            <img src={URL.createObjectURL(selectedImage)} alt="Product Preview" className="h-48 w-48 object-cover rounded-2xl shadow-xl mb-6 border-4 border-white" />
          )}
          {isVerifyingImage && (
            <div className="text-blue-600 font-bold text-lg mt-2 animate-pulse">Analyzing image authenticity...</div>
          )}
          {imageVerification && !isVerifyingImage && (
            <div className="flex flex-col items-center w-full">
              <div className={`flex items-center justify-center gap-3 text-3xl font-extrabold px-8 py-4 rounded-full mb-4 shadow-xl border-4 transition-all duration-300 ${imageVerification.is_ai_generated ? 'bg-gradient-to-r from-red-200 to-red-400 text-red-800 border-red-400 animate-bounce' : 'bg-gradient-to-r from-green-200 to-green-400 text-green-800 border-green-400 animate-pulse-slow'}`}>
                {imageVerification.is_ai_generated ? (
                  <AlertTriangle className="w-10 h-10 text-red-500 animate-shake" />
                ) : (
                  <Shield className="w-10 h-10 text-green-500 animate-bounce" />
                )}
                {imageVerification.is_ai_generated ? 'AI-Generated Image' : 'Authentic Image'}
              </div>
              {/* Recommendation line based on confidence and badge color */}
              {(() => {
                const conf = imageVerification.confidence;
                if (!imageVerification.is_ai_generated && conf >= 0.7) {
                  return <div className="text-green-700 font-semibold text-lg mb-2">This product image looks genuine. You can buy it with confidence!</div>;
                } else if (!imageVerification.is_ai_generated && conf >= 0.4) {
                  return <div className="text-yellow-700 font-semibold text-lg mb-2">This image is somewhat suspicious. Please verify further before buying.</div>;
                } else if (imageVerification.is_ai_generated && conf >= 0.7) {
                  return <div className="text-red-700 font-semibold text-lg mb-2">Warning: This image is likely AI-generated. Be cautious before purchasing.</div>;
                } else {
                  return <div className="text-yellow-700 font-semibold text-lg mb-2">This image may be AI-generated. Please verify further before buying.</div>;
                }
              })()}
              <div className="w-full max-w-sm mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1 font-semibold">
                  <span>Confidence</span>
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
              <h2 className="text-2xl font-bold text-gray-900">AI Analysis Results</h2>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-sm text-gray-600">Confidence Score</div>
                  <div className={`text-3xl font-bold ${getScoreColor(confidencePercentage)}`}>{confidencePercentage}%</div>
                </div>
                <div className={`px-4 py-2 rounded-xl border-2 font-semibold ${getBadgeColor(confidencePercentage)}`}>{badge_text}</div>
              </div>
            </div>
            {/* Risk Level Summary */}
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">Risk Level</div>
                <div className={`text-lg font-semibold ${
                  risk_level === 'LOW' ? 'text-green-600' :
                  risk_level === 'MEDIUM' ? 'text-yellow-600' : 'text-red-600'
                }`}>{risk_level}</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">Analysis Type</div>
                <div className="text-lg font-semibold text-gray-900">AI-Powered</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">Model Confidence</div>
                <div className="text-lg font-semibold text-blue-600">{Math.round(detailed_analysis.ml_analysis.model_confidence * 100)}%</div>
              </div>
            </div>
          </div>

          {/* Analysis Details */}
          <div className="grid md:grid-cols-2 gap-6">
            <AnalysisCard icon={Brain} title="Text Pattern Analysis" iconColor="text-purple-500">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Grammar Score</span>
                  <span className="text-green-600 font-semibold">{Math.round(detailed_analysis.text_analysis.grammar_score * 100)}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Length Score</span>
                  <span className="text-blue-600 font-semibold">{Math.round(detailed_analysis.text_analysis.length_score * 100)}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Repetitive Words</span>
                  <span className="text-yellow-600 font-semibold">{Math.round(detailed_analysis.text_analysis.repetitive_words * 100)}%</span>
                </div>
                <div className="mt-4 p-3 bg-purple-50 rounded-lg">
                  <div className="text-sm text-purple-800 font-medium">Analysis Summary:</div>
                  <div className="text-sm text-purple-700">{detailed_analysis.summary}</div>
                </div>
              </div>
            </AnalysisCard>
            <AnalysisCard icon={MessageSquare} title="Sentiment Analysis" iconColor="text-blue-500">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Positive Sentiment</span>
                  <span className="text-green-600 font-semibold">{Math.round(detailed_analysis.sentiment_analysis.scores.positive * 100)}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Negative Sentiment</span>
                  <span className="text-red-600 font-semibold">{Math.round(detailed_analysis.sentiment_analysis.scores.negative * 100)}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Dominant Sentiment</span>
                  <span className="text-blue-600 font-semibold capitalize">{detailed_analysis.sentiment_analysis.dominant_sentiment}</span>
                </div>
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <div className="text-sm text-blue-800 font-medium">{detailed_analysis.sentiment_analysis.extreme_sentiment ? '⚠️ Extreme sentiment detected' : '✅ Balanced sentiment'}</div>
                </div>
              </div>
            </AnalysisCard>
            <AnalysisCard icon={BarChart3} title="Coherence Analysis" iconColor="text-green-500">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Coherence Score</span>
                  <span className="text-green-600 font-semibold">{Math.round(detailed_analysis.coherence_analysis.coherence_score * 100)}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Product Relevance</span>
                  <span className={`font-semibold ${detailed_analysis.coherence_analysis.product_relevance ? 'text-green-600' : 'text-red-600'}`}>{detailed_analysis.coherence_analysis.product_relevance ? '✅ Relevant' : '❌ Not Relevant'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Topic Consistency</span>
                  <span className="text-blue-600 font-semibold">{detailed_analysis.coherence_analysis.topic_consistency ? Math.round(detailed_analysis.coherence_analysis.topic_consistency * 100) + '%' : 'N/A'}</span>
                </div>
                <div className="mt-4 p-3 bg-green-50 rounded-lg">
                  <div className="text-sm text-green-800 font-medium">{detailed_analysis.coherence_analysis.coherence_score > 0.7 ? '✅ Good coherence' : detailed_analysis.coherence_analysis.coherence_score > 0.4 ? '⚠️ Moderate coherence' : '❌ Poor coherence'}</div>
                </div>
              </div>
            </AnalysisCard>
            <AnalysisCard icon={Shield} title="ML Model Analysis" iconColor="text-orange-500">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Authenticity Score</span>
                  <span className="text-green-600 font-semibold">{Math.round(detailed_analysis.ml_analysis.authenticity_score * 100)}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Model Confidence</span>
                  <span className="text-blue-600 font-semibold">{Math.round(detailed_analysis.ml_analysis.model_confidence * 100)}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Overall Assessment</span>
                  <span className={`font-semibold ${detailed_analysis.ml_analysis.authenticity_score > 0.7 ? 'text-green-600' : detailed_analysis.ml_analysis.authenticity_score > 0.4 ? 'text-yellow-600' : 'text-red-600'}`}>{detailed_analysis.ml_analysis.authenticity_score > 0.7 ? 'Authentic' : detailed_analysis.ml_analysis.authenticity_score > 0.4 ? 'Suspicious' : 'Fake'}</span>
                </div>
                <div className="mt-4 p-3 bg-orange-50 rounded-lg">
                  <div className="text-sm text-orange-800 font-medium">AI Model Prediction: {Math.round(detailed_analysis.ml_analysis.authenticity_score * 100)}% authentic</div>
                </div>
              </div>
            </AnalysisCard>
          </div>

          {/* Recommendations */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Recommendations</h3>
            <div className="space-y-3">
              {recommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="text-green-500 mt-1">•</div>
                  <span className="text-gray-700">{recommendation}</span>
                </div>
              ))}
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
            Back to Input
          </button>
        </div>
      )}
    </div>
  );
}
