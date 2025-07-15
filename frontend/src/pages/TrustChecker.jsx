import React, { useState, useRef, useEffect } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement } from 'chart.js';
import { Pie, Line } from 'react-chartjs-2';
import { useLanguage } from '../context/LanguageContext';
import { Header } from '../components/Header';
import { ResultsSection } from '../components/ResultsSection';
import { TabbedInterface } from '../components/TabbedInterface';
import { AnalysisSection } from '../components/AnalysisSection';
import { Link, MessageSquare, Image as ImageIcon, Tag, Mic, BarChart3 } from 'lucide-react';
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement);

export function TrustChecker() {
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

  const [username, setUsername] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const user = localStorage.getItem('username');
    setUsername(user);
    if (user) {
      fetch(`http://localhost:8000/user/history?username=${user}`)
        .then(res => res.json())
        .then(data => setHistory(data.history || []));
    }
  }, []);

  // Prepare analytics data
  const riskCounts = { SAFE: 0, WARNING: 0, RISKY: 0 };
  const confidenceScores = [];
  const labels = [];
  history.forEach((item, idx) => {
    let risk = (item.result?.risk_level || 'SAFE').toUpperCase();
    // Normalize risk levels
    if (risk === 'HIGH' || risk === 'RISKY') risk = 'RISKY';
    else if (risk === 'LOW' || risk === 'SAFE') risk = 'SAFE';
    else if (risk === 'MEDIUM' || risk === 'WARNING') risk = 'WARNING';
    if (riskCounts[risk] !== undefined) riskCounts[risk]++;
    confidenceScores.push(item.result?.confidence_score || 0);
    labels.push(`Review ${idx + 1}`);
  });

  const pieData = {
    labels: ['SAFE', 'WARNING', 'RISKY'],
    datasets: [
      {
        label: 'Risk Level',
        data: [riskCounts.SAFE, riskCounts.WARNING, riskCounts.RISKY],
        backgroundColor: ['#22c55e', '#facc15', '#ef4444'],
        borderWidth: 1,
      },
    ],
  };

  const lineData = {
    labels,
    datasets: [
      {
        label: 'Confidence Score',
        data: confidenceScores,
        fill: false,
        borderColor: '#3b82f6',
        backgroundColor: '#3b82f6',
        tension: 0.2,
      },
    ],
  };

  const emptyPieData = {
    labels: ['SAFE', 'WARNING', 'RISKY'],
    datasets: [
      {
        label: 'Risk Level',
        data: [0, 0, 0],
        backgroundColor: ['#22c55e', '#facc15', '#ef4444'],
        borderWidth: 1,
      },
    ],
  };
  const emptyLineData = {
    labels: ['No Data'],
    datasets: [
      {
        label: 'Confidence Score',
        data: [0],
        fill: false,
        borderColor: '#3b82f6',
        backgroundColor: '#3b82f6',
        tension: 0.2,
      },
    ],
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
      const res = await fetch(`http://localhost:8000/analyze-product-link?username=${username}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_url: productUrl })
      });
      if (!res.ok) {
        const data = await res.json();
        setProductLinkError(data.detail || 'Analysis failed');
        setIsAnalyzingProductLink(false);
        return;
      }
      const result = await res.json();
      setProductLinkResult(result);
      setHistory(prev => [
        { type: 'product_link', product_url: productUrl, result },
        ...prev
      ]);
      setIsAnalyzingProductLink(false);
    } catch (err) {
      setProductLinkError('Network error');
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
      const res = await fetch(`http://localhost:8000/analyze-review?username=${username}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ review_text: reviews })
      });
      if (!res.ok) {
        const data = await res.json();
        setReviewError(data.detail || 'Analysis failed');
        setIsAnalyzingReview(false);
        return;
      }
      const result = await res.json();
      setReviewResult(result);
      // Add to history immediately
      setHistory(prev => [
        { review: reviews, result },
        ...prev
      ]);
    } catch (err) {
      setReviewError('Network error');
    }
    setIsAnalyzingReview(false);
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
      const formData = new FormData();
      formData.append('image', selectedImage);
      const res = await fetch(`http://localhost:8000/verify-image?username=${username}`, {
        method: 'POST',
        body: formData
      });
      if (!res.ok) {
        const data = await res.json();
        setImageError(data.detail || 'Analysis failed');
        setIsVerifyingImage(false);
        return;
      }
      const result = await res.json();
      setImageVerification(result);
      setHistory(prev => [
        { type: 'product_image', image: selectedImage.name, result },
        ...prev
      ]);
      setIsVerifyingImage(false);
    } catch (err) {
      setImageError('Network error');
      setIsVerifyingImage(false);
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
      const res = await fetch(`http://localhost:8000/analyze-review?username=${username}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ review_text: voiceText })
      });
      if (!res.ok) {
        const data = await res.json();
        setVoiceError(data.detail || 'Analysis failed');
        return;
      }
      const result = await res.json();
      setVoiceResult(result);
      setHistory(prev => [
        { type: 'voice', review: voiceText, result },
        ...prev
      ]);
    } catch (err) {
      setVoiceError('Network error');
    }
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
          {isAnalyzingProductLink && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 font-medium text-center animate-pulse">
              This can take some time! Please wait...
            </div>
          )}
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

  // Group history by type
  const reviewHistory = history.filter(h => h.type === 'review' || h.type === 'voice');
  const imageHistory = history.filter(h => h.type === 'product_image');
  const linkHistory = history.filter(h => h.type === 'product_link');

  // Review analytics
  const reviewTableData = reviewHistory.map(h => ({
    review: h.review,
    confidence: h.result?.confidence_score !== undefined ? (h.result.confidence_score * 100).toFixed(1) + '%' : 'N/A',
    risk: h.result?.risk_level || (h.type === 'voice' ? 'VOICE' : 'SAFE'),
  }));
  const reviewTrend = {
    labels: reviewHistory.map((_, i) => `Review ${i + 1}`),
    datasets: [
      {
        label: 'Confidence',
        data: reviewHistory.map(h => h.result?.confidence_score ?? 0),
        borderColor: '#3b82f6',
        backgroundColor: '#93c5fd',
        tension: 0.3,
      },
    ],
  };

  // Image analytics
  const imageTableData = imageHistory.map(h => ({
    image: h.image,
    confidence: h.result?.confidence !== undefined ? (h.result.confidence * 100).toFixed(1) + '%' : 'N/A',
    risk: h.result?.is_ai_generated ? 'HIGH' : 'LOW',
  }));
  const imageTrend = {
    labels: imageHistory.map((h, i) => h.image || `Image ${i + 1}`),
    datasets: [
      {
        label: 'Confidence',
        data: imageHistory.map(h => h.result?.confidence ?? 0),
        borderColor: '#ef4444',
        backgroundColor: '#fecaca',
        tension: 0.3,
      },
    ],
  };

  // Link analytics (if needed)
  const linkTableData = linkHistory.map(h => ({
    url: h.product_url,
    summary: h.result?.summary?.reason || 'N/A',
    recommendation: h.result?.summary?.recommendation || 'N/A',
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      <Header
        title="TrustBuddy Checker"
        showBackButton={true}
        onBackClick={() => window.history.back()}
      />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <TabbedInterface tabs={tabs} />
      </div>
      <div style={{ margin: '32px auto', padding: 0, maxWidth: 1100, display: 'flex', flexDirection: 'column', gap: 32 }}>
        <button
          onClick={async () => {
            if (username) {
              try {
                await fetch('http://localhost:8000/user/clear-history', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ username })
                });
              } catch (e) { /* Optionally show error */ }
            }
            setHistory([]);
          }}
          className="self-end mb-2 px-5 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold shadow transition-all"
          style={{ maxWidth: 180 }}
        >
          Clear History
        </button>
        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[350px]">
            <div className="flex gap-8 mb-8">
              <div className="bg-gray-50 rounded-xl p-6 shadow flex flex-col items-center">
                <Pie data={emptyPieData} style={{ width: 180, height: 180 }} />
                <div className="text-gray-500 mt-2">Risk Level Distribution</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-6 shadow flex flex-col items-center">
                <Line data={emptyLineData} style={{ width: 220, height: 180 }} />
                <div className="text-gray-500 mt-2">Confidence Score Trend</div>
              </div>
            </div>
            <div className="text-lg text-gray-400 font-medium mt-4">No analysis history yet.<br/>Your results will appear here after your first analysis!</div>
          </div>
        ) : (
          <>
            <h3 style={{ fontSize: 22, fontWeight: 600, marginBottom: 0, alignSelf: 'flex-start' }}>Your Review History & Analytics</h3>
            <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', justifyContent: 'center' }}>
              <div style={{ width: 320, minWidth: 260, background: '#f9fafb', borderRadius: 16, padding: 24, boxShadow: '0 2px 8px #0001', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Pie data={pieData} style={{ width: '100%', maxWidth: 220 }} />
                <div style={{ textAlign: 'center', marginTop: 12, fontWeight: 500 }}>Risk Level Distribution</div>
              </div>
              <div style={{ flex: 1, minWidth: 340, maxWidth: 600, background: '#f9fafb', borderRadius: 16, padding: 24, boxShadow: '0 2px 8px #0001', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Line data={lineData} style={{ width: '100%', maxWidth: 500 }} />
                <div style={{ textAlign: 'center', marginTop: 12, fontWeight: 500 }}>Confidence Score Trend</div>
              </div>
            </div>
            <div style={{ background: '#f8fafc', borderRadius: 16, boxShadow: '0 2px 8px #0001', padding: 24, marginTop: 0, overflowX: 'auto', minWidth: 320 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9' }}>
                    <th style={{ padding: 10, border: '1px solid #e5e7eb' }}>#</th>
                    <th style={{ padding: 10, border: '1px solid #e5e7eb' }}>Review</th>
                    <th style={{ padding: 10, border: '1px solid #e5e7eb' }}>Confidence</th>
                    <th style={{ padding: 10, border: '1px solid #e5e7eb' }}>Risk / Recommendation</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((item, idx) => {
                    let confidence = "N/A";
                    let risk = "SAFE";
                    let reviewText = item.review || item.product_url || item.image || "";
                    // Product link entry
                    if (item.product_url && item.result && typeof item.result.final_confidence_score === 'number') {
                      confidence = (item.result.final_confidence_score * 100).toFixed(1) + "%";
                      // Try to get risk from summary or fallback
                      risk = item.result.summary?.recommendation || item.result.risk_level || "SAFE";
                    } else if (item.type === "product_image") {
                      confidence = item.result?.confidence !== undefined
                        ? (item.result.confidence * 100).toFixed(1) + "%"
                        : "N/A";
                      risk = item.result?.is_ai_generated ? "HIGH" : "LOW";
                    } else if (item.result) {
                      confidence = item.result.confidence_score !== undefined
                        ? (item.result.confidence_score * 100).toFixed(1) + "%"
                        : "N/A";
                      risk = item.result.risk_level || "SAFE";
                    }
                    return (
                      <tr key={idx}>
                        <td style={{ padding: 10, border: '1px solid #e5e7eb', textAlign: 'center' }}>{idx + 1}</td>
                        <td style={{ padding: 10, border: '1px solid #e5e7eb' }}>{reviewText}</td>
                        <td style={{ padding: 10, border: '1px solid #e5e7eb', textAlign: 'center' }}>{confidence}</td>
                        <td style={{ padding: 10, border: '1px solid #e5e7eb', textAlign: 'center' }}>
                          <span style={{
                            color: risk === 'Buy' || risk === 'BUY' ? '#22c55e' : risk === 'LOW' ? '#22c55e' : risk === 'MEDIUM' ? '#facc15' : risk === 'SAFE' ? '#22c55e' : '#ef4444',
                            fontWeight: 600
                          }}>{(risk === 'SAFE' && confidence === 'N/A') ? 'N/A' : risk}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
