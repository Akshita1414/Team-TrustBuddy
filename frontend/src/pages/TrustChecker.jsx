import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Header } from '../components/Header';
import { InputSection } from '../components/InputSection';
import { ResultsSection } from '../components/ResultsSection';
import apiService from '../services/api';

export function TrustChecker({ onNavigate }) {
  const { t } = useLanguage();

  const [productUrl, setProductUrl] = useState('');
  const [textQuery, setTextQuery] = useState('');
  const [reviews, setReviews] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState(null);
  const [backendStatus, setBackendStatus] = useState('checking');

  // Check backend status on component mount
  useEffect(() => {
    checkBackendStatus();
  }, []);

  const checkBackendStatus = async () => {
    try {
      await apiService.healthCheck();
      setBackendStatus('connected');
    } catch (error) {
      console.error('Backend connection failed:', error);
      setBackendStatus('disconnected');
    }
  };

  const handleVoiceInput = () => {
    setIsVoiceActive(true);
    setTimeout(() => {
      setTextQuery("Red cotton saree with embroidery");
      setIsVoiceActive(false);
    }, 2000);
  };

  const handleAnalyze = async () => {
    if (!reviews.trim()) {
      setError('Please enter review text to analyze');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setShowResults(false);

    try {
      const reviewData = {
        review_text: reviews.trim(),
        product_name: textQuery || null,
        language: 'en'
      };

      const result = await apiService.analyzeReview(reviewData);
      setAnalysisResult(result);
      setShowResults(true);
    } catch (error) {
      setError(error.message || 'Failed to analyze review. Please try again.');
      console.error('Analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleNewAnalysis = () => {
    setShowResults(false);
    setAnalysisResult(null);
    setError(null);
    setReviews('');
    setTextQuery('');
    setProductUrl('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      <Header
        title="TrustBuddy Checker"
        showBackButton={true}
        onBackClick={() => onNavigate('home')}
      />

      {/* Backend Status Indicator */}
      {backendStatus === 'disconnected' && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
              <span className="font-medium">Backend service is not available. Please ensure the server is running.</span>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!showResults ? (
          <InputSection
            productUrl={productUrl}
            setProductUrl={setProductUrl}
            textQuery={textQuery}
            setTextQuery={setTextQuery}
            reviews={reviews}
            setReviews={setReviews}
            isVoiceActive={isVoiceActive}
            onVoiceInput={handleVoiceInput}
            onAnalyze={handleAnalyze}
            isAnalyzing={isAnalyzing}
            error={error}
            backendStatus={backendStatus}
          />
        ) : (
          <ResultsSection 
            analysisResult={analysisResult}
            onNewAnalysis={handleNewAnalysis}
          />
        )}
      </div>
    </div>
  );
}
