import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Header } from '../components/Header';
import { ResultsSection } from '../components/ResultsSection';
import { TabbedInterface } from '../components/TabbedInterface';
import apiService, { postProductNameAnalysis } from '../services/api';
import { Link, MessageSquare, Image as ImageIcon, Tag, Mic } from 'lucide-react';

export function TrustChecker({ onNavigate }) {
  const { t, language } = useLanguage();

  // Product Link Tab
  const [productUrl, setProductUrl] = useState('');
  const [isAnalyzingProductLink, setIsAnalyzingProductLink] = useState(false);
  const [productLinkResult, setProductLinkResult] = useState(null);
  const [productLinkError, setProductLinkError] = useState(null);

  // Review Text Tab
  const [reviews, setReviews] = useState('');
  const [isAnalyzingReview, setIsAnalyzingReview] = useState(false);
  const [reviewResult, setReviewResult] = useState(null);
  const [reviewError, setReviewError] = useState(null);
  const [reviewProductName, setReviewProductName] = useState('');

  // Product Image Tab
  const [selectedImage, setSelectedImage] = useState(null);
  const [isVerifyingImage, setIsVerifyingImage] = useState(false);
  const [imageVerification, setImageVerification] = useState(null);
  const [imageError, setImageError] = useState(null);

  // Product Name Tab
  const [productName, setProductName] = useState('');
  const [isAnalyzingName, setIsAnalyzingName] = useState(false);
  const [nameResult, setNameResult] = useState(null);
  const [nameError, setNameError] = useState(null);

  // Voice Input Tab
  const [voiceText, setVoiceText] = useState('');
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [voiceResult, setVoiceResult] = useState(null);
  const [voiceError, setVoiceError] = useState(null);
  const recognitionRef = useRef(null);

  // Backend status
  const [backendStatus, setBackendStatus] = useState('checking');

  useEffect(() => {
    checkBackendStatus();
  }, []);

  const checkBackendStatus = async () => {
    try {
      await apiService.healthCheck();
      setBackendStatus('connected');
    } catch (error) {
      setBackendStatus('disconnected');
    }
  };

  // --- Tab Handlers ---
  // Product Link
  const handleAnalyzeProductLink = async () => {
    if (!productUrl.trim()) {
      setProductLinkError('Please enter a product URL to analyze');
      return;
    }
    setIsAnalyzingProductLink(true);
    setProductLinkError(null);
    setProductLinkResult(null);
    try {
      const result = await apiService.analyzeProductLink(productUrl.trim());
      setProductLinkResult(result);
    } catch (error) {
      setProductLinkError(error.message || 'Failed to analyze product link. Please try again.');
    } finally {
      setIsAnalyzingProductLink(false);
    }
  };

  // Review Text
  const handleAnalyzeReview = async () => {
    if (!reviews.trim()) {
      setReviewError('Please enter review text to analyze');
      return;
    }
    setIsAnalyzingReview(true);
    setReviewError(null);
    setReviewResult(null);
    try {
      const reviewData = {
        review_text: reviews.trim(),
        product_name: reviewProductName || null,
        language: language, // Use selected language
      };
      const result = await apiService.analyzeReview(reviewData);
      setReviewResult(result);
    } catch (error) {
      setReviewError(error.message || 'Failed to analyze review. Please try again.');
    } finally {
      setIsAnalyzingReview(false);
    }
  };

  // Product Image
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    setSelectedImage(file);
    setImageVerification(null);
    setImageError(null);
  };
  const handleAnalyzeImage = async () => {
    if (!selectedImage) return;
    setIsVerifyingImage(true);
    setImageError(null);
    setImageVerification(null);
    try {
      const result = await apiService.verifyImage(selectedImage);
      setImageVerification(result);
    } catch (err) {
      setImageError(err.message || 'Failed to verify image. Please try again.');
      setImageVerification(null);
    } finally {
      setIsVerifyingImage(false);
    }
  };

  // Product Name
  const handleAnalyzeName = async () => {
    if (!productName.trim()) {
      setNameError('Please enter a product name to analyze');
      return;
    }
    setIsAnalyzingName(true);
    setNameError(null);
    setNameResult(null);
    try {
      const result = await postProductNameAnalysis(productName.trim(), language);
      setNameResult(result);
    } catch (error) {
      setNameError(error.message || 'Failed to analyze product name.');
    } finally {
      setIsAnalyzingName(false);
    }
  };

  // Voice Input (Web Speech API)
  const handleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      setVoiceError('Speech recognition is not supported in this browser.');
      return;
    }
    setVoiceError(null);
    setVoiceText('');
    setIsVoiceActive(true);
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    // Map app language to BCP-47 locale for speech recognition
    let langCode = 'en-IN';
    if (language === 'hi') langCode = 'hi-IN';
    else if (language === 'pa') langCode = 'pa-IN';
    else if (language === 'mr') langCode = 'mr-IN';
    recognition.lang = langCode;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setVoiceText(transcript);
      setIsVoiceActive(false);
    };
    recognition.onerror = (event) => {
      setVoiceError('Voice recognition error: ' + event.error);
      setIsVoiceActive(false);
    };
    recognition.onend = () => {
      setIsVoiceActive(false);
    };
    recognitionRef.current = recognition;
    recognition.start();
  };
  const handleAnalyzeVoice = async () => {
    if (!voiceText.trim()) {
      setVoiceError('Please speak or enter something to analyze');
      return;
    }
    setVoiceError(null);
    setVoiceResult(null);
    try {
      const reviewData = {
        review_text: voiceText.trim(),
        product_name: null,
        language: language, // Use selected language
      };
      const result = await apiService.analyzeReview(reviewData);
      setVoiceResult(result);
    } catch (error) {
      setVoiceError(error.message || 'Failed to analyze voice input. Please try again.');
    }
  };

  // --- Tab Definitions ---
  const tabs = [
    {
      label: 'Product Link',
      icon: Link,
      content: (
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Paste Product URL</label>
          <input
            type="url"
            value={productUrl}
            onChange={e => setProductUrl(e.target.value)}
            placeholder="https://example.com/product"
            className="w-full px-4 py-3 border-2 border-blue-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors mb-4"
            disabled={backendStatus === 'disconnected'}
          />
          <button
            onClick={handleAnalyzeProductLink}
            disabled={!productUrl.trim() || isAnalyzingProductLink || backendStatus === 'disconnected'}
            className={`w-full px-4 py-3 rounded-xl font-semibold text-white transition-all duration-200 shadow-lg mt-2
              ${(!productUrl.trim() || isAnalyzingProductLink || backendStatus === 'disconnected')
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 hover:scale-105'}`}
          >
            {isAnalyzingProductLink ? 'Analyzing...' : 'Analyze Product Link'}
          </button>
          {productLinkError && <div className="mt-4 text-red-600 font-medium">{productLinkError}</div>}
          {productLinkResult && (
            <div className="mt-8">
              <ResultsSection productLinkResult={productLinkResult} />
            </div>
          )}
        </div>
      )
    },
    {
      label: 'Review Text',
      icon: MessageSquare,
      content: (
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Enter Review Text</label>
          <textarea
            value={reviews}
            onChange={e => setReviews(e.target.value)}
            placeholder="Amazing product! Loved the quality.\nTerrible experience. Received a different color.\nBest deal ever!"
            className="w-full px-4 py-3 border-2 border-blue-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors mb-4 min-h-[100px]"
            disabled={backendStatus === 'disconnected'}
          />
          <label className="block text-sm font-semibold text-gray-700 mb-2 mt-2">Product Name Context</label>
          <input
            type="text"
            value={productName}
            readOnly
            className="w-full px-4 py-3 border-2 border-blue-100 rounded-xl bg-gray-50 text-gray-500 mb-4"
            disabled
          />
          <button
            onClick={handleAnalyzeReview}
            disabled={!reviews.trim() || isAnalyzingReview || backendStatus === 'disconnected'}
            className={`w-full px-4 py-3 rounded-xl font-semibold text-white transition-all duration-200 shadow-lg mt-2
              ${(!reviews.trim() || isAnalyzingReview || backendStatus === 'disconnected')
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 hover:scale-105'}`}
          >
            {isAnalyzingReview ? 'Analyzing...' : 'Analyze Review'}
          </button>
          {reviewError && <div className="mt-4 text-red-600 font-medium">{reviewError}</div>}
          {reviewResult && (
            <div className="mt-8">
              <ResultsSection analysisResult={reviewResult} />
            </div>
          )}
        </div>
      )
    },
    {
      label: 'Product Image',
      icon: ImageIcon,
      content: (
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Upload Product Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="w-full px-4 py-2 border-2 border-blue-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors mb-4"
            disabled={backendStatus === 'disconnected'}
          />
          <label className="block text-sm font-semibold text-gray-700 mb-2 mt-2">Product Name Context</label>
          <input
            type="text"
            value={productName}
            readOnly
            className="w-full px-4 py-3 border-2 border-blue-100 rounded-xl bg-gray-50 text-gray-500 mb-4"
            disabled
          />
          <button
            onClick={handleAnalyzeImage}
            disabled={!selectedImage || isVerifyingImage || backendStatus === 'disconnected'}
            className={`w-full px-4 py-3 rounded-xl font-semibold text-white transition-all duration-200 shadow-lg mt-2
              ${(!selectedImage || isVerifyingImage || backendStatus === 'disconnected')
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 hover:scale-105'}`}
          >
            {isVerifyingImage ? 'Analyzing...' : 'Analyze Image'}
          </button>
          {imageError && <div className="mt-4 text-red-600 font-medium">{imageError}</div>}
          {imageVerification && (
            <div className="mt-8">
              <ResultsSection imageVerification={imageVerification} selectedImage={selectedImage} />
            </div>
          )}
        </div>
      )
    },
    {
      label: 'Product Name',
      icon: Tag,
      content: (
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Enter Product Name (for context)</label>
          <input
            type="text"
            value={productName}
            onChange={e => setProductName(e.target.value)}
            placeholder="e.g. Red Saree"
            className="w-full px-4 py-3 border-2 border-blue-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors mb-4"
            disabled={backendStatus === 'disconnected'}
          />
          <div className="mt-4 text-blue-700 bg-blue-50 border border-blue-200 rounded-xl p-4">
            The product name you enter here will be used as context for review and image analysis. It will not be analyzed directly.
          </div>
        </div>
      )
    },
    {
      label: 'Voice Input',
      icon: Mic,
      content: (
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Speak Product Name or Review</label>
          <div className="mb-2 text-xs text-gray-500">Current language: <span className="font-semibold">{language.toUpperCase()}</span></div>
          <div className="mb-2 text-sm text-blue-700 font-medium">Record your review using your voice.</div>
          <div className="flex items-center space-x-2 mb-4">
            <button
              onClick={handleVoiceInput}
              disabled={isVoiceActive || backendStatus === 'disconnected'}
              className={`px-4 py-3 rounded-xl font-semibold flex items-center space-x-2 border-2 transition-all duration-200
                ${isVoiceActive
                  ? 'border-red-500 bg-red-50 text-red-600 animate-pulse'
                  : backendStatus === 'disconnected'
                  ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                  : 'border-blue-200 hover:border-blue-400 text-gray-600'}`}
            >
              <Mic className={`w-5 h-5 ${isVoiceActive ? 'animate-pulse' : ''}`} />
              <span>{isVoiceActive ? 'Listening...' : 'Tap to speak'}</span>
            </button>
            <input
              type="text"
              value={voiceText}
              onChange={e => setVoiceText(e.target.value)}
              placeholder="Or type here..."
              className="flex-1 px-4 py-3 border-2 border-blue-100 rounded-xl focus:border-blue-400 focus:outline-none transition-colors"
              disabled={backendStatus === 'disconnected'}
            />
          </div>
          <button
            onClick={handleAnalyzeVoice}
            disabled={!voiceText.trim() || isVoiceActive || backendStatus === 'disconnected'}
            className={`w-full px-4 py-3 rounded-xl font-semibold text-white transition-all duration-200 shadow-lg mt-2
              ${(!voiceText.trim() || isVoiceActive || backendStatus === 'disconnected')
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 hover:scale-105'}`}
          >
            Analyze Voice Input
          </button>
          {voiceError && <div className="mt-4 text-red-600 font-medium">{voiceError}</div>}
          {voiceResult && (
            (() => {
              let riskColor = 'bg-purple-50 border-purple-200';
              if (voiceResult.risk_level) {
                if (voiceResult.risk_level.toLowerCase() === 'low' || voiceResult.risk_level.toLowerCase() === 'safe') {
                  riskColor = 'bg-green-50 border-green-300';
                } else if (voiceResult.risk_level.toLowerCase() === 'medium' || voiceResult.risk_level.toLowerCase() === 'warning') {
                  riskColor = 'bg-yellow-50 border-yellow-300';
                } else if (voiceResult.risk_level.toLowerCase() === 'high' || voiceResult.risk_level.toLowerCase() === 'risky') {
                  riskColor = 'bg-red-50 border-red-300';
                }
              }
              return (
                <div className={`mt-8 rounded-xl p-6 border ${riskColor}`}>
                  <div className="font-bold text-lg text-purple-700">
                    {voiceResult.confidence_score !== undefined ? `${Math.round(voiceResult.confidence_score * 100)}% Confidence` : ''}
                  </div>
                  <div className="text-gray-700 mt-2 space-y-2">
                    {typeof voiceResult === 'object' && !Array.isArray(voiceResult) ? (
                      Object.entries(voiceResult).map(([key, value]) => (
                        <div key={key}>
                          <span className="font-semibold">{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:</span>{' '}
                          {typeof value === 'object' && value !== null
                            ? <pre className="bg-gray-100 rounded p-2 overflow-x-auto text-xs">{JSON.stringify(value, null, 2)}</pre>
                            : String(value)}
                        </div>
                      ))
                    ) : (
                      String(voiceResult)
                    )}
                  </div>
                </div>
              );
            })()
          )}
        </div>
      )
    },
  ];

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
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <TabbedInterface tabs={tabs} />
      </div>
    </div>
  );
}
