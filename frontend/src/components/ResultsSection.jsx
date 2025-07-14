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

export function ResultsSection({ analysisResult, onNewAnalysis, imageVerification, selectedImage, isVerifyingImage }) {
  const { t } = useLanguage();

  if (!analysisResult) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500">No analysis results available</div>
      </div>
    );
  }

  const {
    confidence_score,
    risk_level,
    badge_color,
    badge_text,
    detailed_analysis,
    recommendations
  } = analysisResult;

  const confidencePercentage = Math.round(confidence_score * 100);
  const trustBadge = getTrustBadge(confidencePercentage);

  return (
    <div className="space-y-8">
      {/* Product Image Verification Result */}
      {(selectedImage || isVerifyingImage || imageVerification) && (
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 flex flex-col items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Product Image Verification</h3>
          {selectedImage && (
            <img src={URL.createObjectURL(selectedImage)} alt="Product Preview" className="h-32 rounded shadow mb-2" />
          )}
          {isVerifyingImage && (
            <div className="text-blue-600 font-medium mt-2">Analyzing image authenticity...</div>
          )}
          {imageVerification && !isVerifyingImage && (
            <div className={`mt-2 px-4 py-2 rounded-xl font-semibold border-2 ${imageVerification.is_ai_generated ? 'border-red-500 text-red-600' : 'border-green-500 text-green-600'}`}>
              {imageVerification.is_ai_generated ? '⚠️ AI-Generated Image Detected' : '✅ Original/Authentic Image Detected'}
              {imageVerification.confidence && (
                <span className="ml-2 text-sm text-gray-500">(Confidence: {Math.round(imageVerification.confidence * 100)}%)</span>
              )}
              {imageVerification.message && (
                <div className="text-xs text-gray-500 mt-1">{imageVerification.message}</div>
              )}
            </div>
          )}
        </div>
      )}
      {/* Results Header */}
      <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">AI Analysis Results</h2>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-sm text-gray-600">Confidence Score</div>
              <div className={`text-3xl font-bold ${getScoreColor(confidencePercentage)}`}>
                {confidencePercentage}%
              </div>
            </div>
            <div className={`px-4 py-2 rounded-xl border-2 font-semibold ${getBadgeColor(confidencePercentage)}`}>
              {badge_text}
            </div>
          </div>
        </div>

        {/* Risk Level Summary */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600">Risk Level</div>
            <div className={`text-lg font-semibold ${
              risk_level === 'LOW' ? 'text-green-600' :
              risk_level === 'MEDIUM' ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {risk_level}
            </div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600">Analysis Type</div>
            <div className="text-lg font-semibold text-gray-900">AI-Powered</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600">Model Confidence</div>
            <div className="text-lg font-semibold text-blue-600">
              {Math.round(detailed_analysis.ml_analysis.model_confidence * 100)}%
            </div>
          </div>
        </div>
      </div>

      {/* Analysis Details */}
      <div className="grid md:grid-cols-2 gap-6">
        <AnalysisCard icon={Brain} title="Text Pattern Analysis" iconColor="text-purple-500">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Grammar Score</span>
              <span className="text-green-600 font-semibold">
                {Math.round(detailed_analysis.text_analysis.grammar_score * 100)}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Length Score</span>
              <span className="text-blue-600 font-semibold">
                {Math.round(detailed_analysis.text_analysis.length_score * 100)}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Repetitive Words</span>
              <span className="text-yellow-600 font-semibold">
                {Math.round(detailed_analysis.text_analysis.repetitive_words * 100)}%
              </span>
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
              <span className="text-green-600 font-semibold">
                {Math.round(detailed_analysis.sentiment_analysis.scores.positive * 100)}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Negative Sentiment</span>
              <span className="text-red-600 font-semibold">
                {Math.round(detailed_analysis.sentiment_analysis.scores.negative * 100)}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Dominant Sentiment</span>
              <span className="text-blue-600 font-semibold capitalize">
                {detailed_analysis.sentiment_analysis.dominant_sentiment}
              </span>
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="text-sm text-blue-800 font-medium">
                {detailed_analysis.sentiment_analysis.extreme_sentiment 
                  ? '⚠️ Extreme sentiment detected' 
                  : '✅ Balanced sentiment'}
              </div>
            </div>
          </div>
        </AnalysisCard>

        <AnalysisCard icon={BarChart3} title="Coherence Analysis" iconColor="text-green-500">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Coherence Score</span>
              <span className="text-green-600 font-semibold">
                {Math.round(detailed_analysis.coherence_analysis.coherence_score * 100)}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Product Relevance</span>
              <span className={`font-semibold ${
                detailed_analysis.coherence_analysis.product_relevance 
                  ? 'text-green-600' : 'text-red-600'
              }`}>
                {detailed_analysis.coherence_analysis.product_relevance ? '✅ Relevant' : '❌ Not Relevant'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Topic Consistency</span>
              <span className="text-blue-600 font-semibold">
                {detailed_analysis.coherence_analysis.topic_consistency 
                  ? Math.round(detailed_analysis.coherence_analysis.topic_consistency * 100) + '%'
                  : 'N/A'}
              </span>
            </div>
            <div className="mt-4 p-3 bg-green-50 rounded-lg">
              <div className="text-sm text-green-800 font-medium">
                {detailed_analysis.coherence_analysis.coherence_score > 0.7 
                  ? '✅ Good coherence' 
                  : detailed_analysis.coherence_analysis.coherence_score > 0.4 
                  ? '⚠️ Moderate coherence' 
                  : '❌ Poor coherence'}
              </div>
            </div>
          </div>
        </AnalysisCard>

        <AnalysisCard icon={Shield} title="ML Model Analysis" iconColor="text-orange-500">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Authenticity Score</span>
              <span className="text-green-600 font-semibold">
                {Math.round(detailed_analysis.ml_analysis.authenticity_score * 100)}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Model Confidence</span>
              <span className="text-blue-600 font-semibold">
                {Math.round(detailed_analysis.ml_analysis.model_confidence * 100)}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Overall Assessment</span>
              <span className={`font-semibold ${
                detailed_analysis.ml_analysis.authenticity_score > 0.7 
                  ? 'text-green-600' 
                  : detailed_analysis.ml_analysis.authenticity_score > 0.4 
                  ? 'text-yellow-600' 
                  : 'text-red-600'
              }`}>
                {detailed_analysis.ml_analysis.authenticity_score > 0.7 
                  ? 'Authentic' 
                  : detailed_analysis.ml_analysis.authenticity_score > 0.4 
                  ? 'Suspicious' 
                  : 'Fake'}
              </span>
            </div>
            <div className="mt-4 p-3 bg-orange-50 rounded-lg">
              <div className="text-sm text-orange-800 font-medium">
                AI Model Prediction: {Math.round(detailed_analysis.ml_analysis.authenticity_score * 100)}% authentic
              </div>
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

      {/* Action Buttons */}
      <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
          <button className="flex items-center justify-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded-xl transition-colors">
            <Download className="w-4 h-4" />
            <span>Download Result</span>
          </button>
          <button 
            onClick={onNewAnalysis}
            className="flex items-center justify-center space-x-2 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-4 rounded-xl transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>New Analysis</span>
          </button>
          <button className="flex items-center justify-center space-x-2 bg-purple-500 hover:bg-purple-600 text-white font-semibold py-3 px-4 rounded-xl transition-colors">
            <Share2 className="w-4 h-4" />
            <span>Share Results</span>
          </button>
          <button className="flex items-center justify-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-4 rounded-xl transition-colors">
            <Save className="w-4 h-4" />
            <span>Save Report</span>
          </button>
        </div>
      </div>

      {/* Feedback Section */}
      <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Feedback</h3>
        <div className="flex items-center space-x-6">
          <button className="flex items-center space-x-2 bg-green-100 hover:bg-green-200 text-green-700 font-medium py-2 px-4 rounded-lg transition-colors">
            <ThumbsUp className="w-4 h-4" />
            <span>Was Helpful</span>
          </button>
          <button className="text-blue-600 hover:text-blue-700 font-medium transition-colors">
            Suggest Improvements
          </button>
          <button className="text-purple-600 hover:text-purple-700 font-medium transition-colors">
            Learn More
          </button>
        </div>
      </div>
    </div>
  );
}
