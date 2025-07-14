import React, { useState, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Header } from '../components/Header';
import { ResultsSection } from '../components/ResultsSection';
import { TabbedInterface } from '../components/TabbedInterface';
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

  // Voice Input Tab
  const [voiceText, setVoiceText] = useState('');
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [voiceResult, setVoiceResult] = useState(null);
  const [voiceError, setVoiceError] = useState(null);
  const recognitionRef = useRef(null);

  // --- Tab Handlers ---
  // Product Link
  const handleAnalyzeProductLink = () => {
    if (!productUrl.trim()) {
      setProductLinkError('Please enter a product URL to analyze');
      return;
    }
    setIsAnalyzingProductLink(true);
    setProductLinkError(null);
    setProductLinkResult(null);
    setTimeout(() => {
      setProductLinkResult({
        product_title: 'Sample Product',
        product_description: 'This is a sample product description.',
        product_image_url: '',
        reviews: [
          'Great product! Highly recommend.',
          'Not as expected, but okay.',
          'Value for money.'
        ],
        image_analysis: {
          label: 'Authentic',
          confidence: 0.92,
          reason: 'No signs of AI generation detected.'
        },
        summary: {
          recommendation: 'Buy',
          reason: 'Most reviews are positive and the image appears authentic.'
        }
      });
      setIsAnalyzingProductLink(false);
    }, 1000);
  };

  // Review Text
  const handleAnalyzeReview = () => {
    if (!reviews.trim()) {
      setReviewError('Please enter review text to analyze');
      return;
    }
    setIsAnalyzingReview(true);
    setReviewError(null);
    setReviewResult(null);
    setTimeout(() => {
      setReviewResult({
        confidence_score: 0.85,
        risk_level: 'Low',
        badge_color: 'green',
        badge_text: 'Safe',
        detailed_analysis: 'The review appears genuine and positive.',
        recommendations: 'You can trust this product.'
      });
      setIsAnalyzingReview(false);
    }, 1000);
  };

  // Product Image
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    setSelectedImage(file);
    setImageVerification(null);
    setImageError(null);
  };
  const handleAnalyzeImage = () => {
    if (!selectedImage) return;
    setIsVerifyingImage(true);
    setImageError(null);
    setImageVerification(null);
    setTimeout(() => {
      setImageVerification({
        is_ai_generated: false,
        confidence: 0.88
      });
      setIsVerifyingImage(false);
    }, 1000);
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
  const handleAnalyzeVoice = () => {
    if (!voiceText.trim()) {
      setVoiceError('Please speak or enter something to analyze');
      return;
    }
    setVoiceError(null);
    setVoiceResult(null);
    setTimeout(() => {
      setVoiceResult({
        confidence_score: 0.8,
        risk_level: 'Low',
        badge_color: 'green',
        badge_text: 'Safe',
        detailed_analysis: 'The spoken review appears genuine and positive.',
        recommendations: 'You can trust this product.'
      });
    }, 1000);
  };

  // --- Tab Definitions ---
  const tabs = [
    {
      label: t('Product Link'),
      icon: Link,
      content: (
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">{t('Paste Product URL')}</label>
          <input
            type="url"
            value={productUrl}
            onChange={e => setProductUrl(e.target.value)}
            placeholder={t('urlPlaceholder')}
            className="w-full px-4 py-3 border-2 border-blue-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors mb-4"
          />
          <button
            onClick={handleAnalyzeProductLink}
            disabled={!productUrl.trim() || isAnalyzingProductLink}
            className={`w-full px-4 py-3 rounded-xl font-semibold text-white transition-all duration-200 shadow-lg mt-2
              ${(!productUrl.trim() || isAnalyzingProductLink)
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 hover:scale-105'}`}
          >
            {isAnalyzingProductLink ? t('Analyzing Product Link...') : t('Analyze Product Link')}
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
      label: t('Review Text'),
      icon: MessageSquare,
      content: (
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">{t('Enter Review Text')}</label>
          <textarea
            value={reviews}
            onChange={e => setReviews(e.target.value)}
            placeholder={t('reviewsPlaceholder')}
            className="w-full px-4 py-3 border-2 border-blue-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors mb-4 min-h-[100px]"
          />
          <label className="block text-sm font-semibold text-gray-700 mb-2 mt-2">{t('Product Name Context')}</label>
          <input
            type="text"
            value={productName}
            readOnly
            className="w-full px-4 py-3 border-2 border-blue-100 rounded-xl bg-gray-50 text-gray-500 mb-4"
            disabled
          />
          <button
            onClick={handleAnalyzeReview}
            disabled={!reviews.trim() || isAnalyzingReview}
            className={`w-full px-4 py-3 rounded-xl font-semibold text-white transition-all duration-200 shadow-lg mt-2
              ${(!reviews.trim() || isAnalyzingReview)
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 hover:scale-105'}`}
          >
            {isAnalyzingReview ? t('Analyzing...') : t('Analyze Review')}
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
      label: t('Product Image'),
      icon: ImageIcon,
      content: (
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">{t('Upload Product Image')}</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="w-full px-4 py-2 border-2 border-blue-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors mb-4"
          />
          <label className="block text-sm font-semibold text-gray-700 mb-2 mt-2">{t('Product Name Context')}</label>
          <input
            type="text"
            value={productName}
            readOnly
            className="w-full px-4 py-3 border-2 border-blue-100 rounded-xl bg-gray-50 text-gray-500 mb-4"
            disabled
          />
          <button
            onClick={handleAnalyzeImage}
            disabled={!selectedImage || isVerifyingImage}
            className={`w-full px-4 py-3 rounded-xl font-semibold text-white transition-all duration-200 shadow-lg mt-2
              ${(!selectedImage || isVerifyingImage)
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 hover:scale-105'}`}
          >
            {isVerifyingImage ? t('Analyzing...') : t('Analyze Image')}
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
      label: t('Product Name'),
      icon: Tag,
      content: (
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">{t('Enter Product Name (for context)')}</label>
          <input
            type="text"
            value={productName}
            onChange={e => setProductName(e.target.value)}
            placeholder={t('productNamePlaceholder')}
            className="w-full px-4 py-3 border-2 border-blue-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors mb-4"
          />
          <div className="mt-4 text-blue-700 bg-blue-50 border border-blue-200 rounded-xl p-4">
            {t('The product name you enter here will be used as context for review and image analysis. It will not be analyzed directly.')}
          </div>
        </div>
      )
    },
    {
      label: t('Voice Input'),
      icon: Mic,
      content: (
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">{t('Speak Product Name or Review')}</label>
          <div className="mb-2 text-xs text-gray-500">{t('Current language')}: <span className="font-semibold">{language.toUpperCase()}</span></div>
          <div className="mb-2 text-sm text-blue-700 font-medium">{t('Record your review using your voice.')}</div>
          <div className="flex items-center space-x-2 mb-4">
            <button
              onClick={handleVoiceInput}
              disabled={isVoiceActive}
              className={`px-4 py-3 rounded-xl font-semibold flex items-center space-x-2 border-2 transition-all duration-200
                ${isVoiceActive
                  ? 'border-red-500 bg-red-50 text-red-600 animate-pulse'
                  : 'border-blue-200 hover:border-blue-400 text-gray-600'}`}
            >
              <Mic className={`w-5 h-5 ${isVoiceActive ? 'animate-pulse' : ''}`} />
              <span>{isVoiceActive ? t('Listening...') : t('Tap to speak')}</span>
            </button>
            <input
              type="text"
              value={voiceText}
              onChange={e => setVoiceText(e.target.value)}
              placeholder={t('Or type here...')}
              className="flex-1 px-4 py-3 border-2 border-blue-100 rounded-xl focus:border-blue-400 focus:outline-none transition-colors"
            />
          </div>
          <button
            onClick={handleAnalyzeVoice}
            disabled={!voiceText.trim() || isVoiceActive}
            className={`w-full px-4 py-3 rounded-xl font-semibold text-white transition-all duration-200 shadow-lg mt-2
              ${(!voiceText.trim() || isVoiceActive)
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 hover:scale-105'}`}
          >
            {t('Analyze Voice Input')}
          </button>
          {voiceError && <div className="mt-4 text-red-600 font-medium">{voiceError}</div>}
          {voiceResult && (() => {
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
                  {voiceResult.confidence_score !== undefined ? `${Math.round(voiceResult.confidence_score * 100)}% ${t('Confidence')}` : ''}
                </div>
                <div className="text-gray-700 mt-2 space-y-2">
                  {typeof voiceResult === 'object' && !Array.isArray(voiceResult) ? (
                    Object.entries(voiceResult).map(([key, value]) => (
                      <div key={key}>
                        <span className="font-semibold">{t(key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()))}:</span>{' '}
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
          })()}
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
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <TabbedInterface tabs={tabs} />
      </div>
    </div>
  );
}
