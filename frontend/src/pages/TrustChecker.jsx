import React, { useState, useRef, useEffect } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement } from 'chart.js';
import { Pie, Line } from 'react-chartjs-2';
import { useLanguage } from '../context/LanguageContext';
import { Header } from '../components/Header';
import { ResultsSection } from '../components/ResultsSection';
import { TabbedInterface } from '../components/TabbedInterface';
import { Link, MessageSquare, Image as ImageIcon, Tag, Mic, BarChart3 } from 'lucide-react';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { API_CONFIG } from '../config';
import { translations } from '../data/translations';
import PriceComparisonTab from './PriceComparisonTab';
import { speak, getVoiceLanguage } from '../utils/voice';
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement);

function t(key, lang = 'en') {
  return translations[lang]?.[key] || translations['en'][key] || key;
}

export function TrustChecker() {
  const { language } = useLanguage();

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
      fetch(`${API_CONFIG.BASE_URL}/user/history?username=${user}`)
        .then(res => res.json())
        .then(data => setHistory(data.history || []));
    }
  }, []);

  // Prepare analytics data
  const riskCounts = { SAFE: 0, WARNING: 0, RISKY: 0 };
  const confidenceScores = [];
  const labels = [];
  history.forEach((item, idx) => {
    let conf = undefined;
    let risk = 'SAFE';
    if (item.type === 'product_image') {
      // For image, use is_ai_generated to set risk
      if (item.result?.is_ai_generated) {
        risk = 'RISKY';
        conf = item.result?.confidence;
      } else {
        risk = 'SAFE';
        conf = item.result?.confidence;
      }
    } else if (item.result?.final_confidence_score !== undefined) {
      conf = item.result.final_confidence_score;
      if (conf <= 0.3) risk = 'RISKY';
      else if (conf <= 0.6) risk = 'WARNING';
      else risk = 'SAFE';
    } else if (item.result?.confidence_score !== undefined) {
      conf = item.result.confidence_score;
      if (conf <= 0.3) risk = 'RISKY';
      else if (conf <= 0.6) risk = 'WARNING';
      else risk = 'SAFE';
    }
    // Clamp confidence between 0 and 1
    if (typeof conf !== 'number' || isNaN(conf)) conf = 0;
    conf = Math.max(0, Math.min(1, conf));
    if (riskCounts[risk] !== undefined) riskCounts[risk]++;
    confidenceScores.push(conf);
    labels.push(item.type === 'product_image' ? `Image ${idx + 1}` : `Review ${idx + 1}`);
  });
  // Always use [SAFE, WARNING, RISKY] order for colors and data
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
        datalabels: {
          display: true,
          align: 'top',
          color: '#1e40af',
          font: { weight: 'bold' },
          formatter: (value) => `${Math.round(value * 100)}%`
        }
      },
    ],
  };
  const lineOptions = {
    responsive: true,
    plugins: {
      legend: { display: true },
      datalabels: {
        display: true,
        font: { weight: 'bold', size: 16 },
        color: '#1e40af',
        align: 'top',
        formatter: (value) => `${Math.round(value * 100)}%`
      }
    },
    scales: {
      y: {
        min: 0,
        max: 1,
        ticks: {
          callback: function(value) { return Math.round(value * 100) + '%'; },
          font: { size: 14 }
        }
      }
    }
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
      const url = username
        ? `${API_CONFIG.BASE_URL}/analyze-product-link?username=${encodeURIComponent(username)}&language=${language}`
        : `${API_CONFIG.BASE_URL}/analyze-product-link?language=${language}`;
      const res = await fetch(url, {
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
      const res = await fetch(`${API_CONFIG.BASE_URL}/analyze-review?username=${username}&language=${language}`, {
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
    setSelectedImage(e.target.files[0]);
    setImageVerification(null);
    setImageError(null);
  };
  const handleAnalyzeImage = async () => {
    if (!selectedImage) {
      setImageError('Please upload an image to verify');
      return;
    }
    setIsVerifyingImage(true);
    setImageError(null);
    setImageVerification(null);
    try {
      const formData = new FormData();
      formData.append('image', selectedImage);
      const url = username
        ? `${API_CONFIG.BASE_URL}/verify-image?username=${encodeURIComponent(username)}`
        : `${API_CONFIG.BASE_URL}/verify-image`;
      const res = await fetch(url, {
        method: 'POST',
        body: formData
      });
      if (!res.ok) {
        const data = await res.json();
        setImageError(data.detail || 'Image verification failed');
        setIsVerifyingImage(false);
        return;
      }
      let result = await res.json();
      // Ensure is_ai_generated is set for frontend logic
      if (typeof result.is_ai_generated === 'undefined') {
        const label = (result.label || '').toLowerCase();
        result.is_ai_generated = label.includes('fake') || label.includes('ai');
      }
      setImageVerification(result);
      setHistory(prev => [
        { type: 'product_image', result },
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
      const res = await fetch(`${API_CONFIG.BASE_URL}/analyze-review?username=${username}&language=${language}`, {
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
      label: t('productLink', language),
      icon: Link,
      content: (
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">{t('pasteUrl', language)}</label>
          <input
            type="url"
            value={productUrl}
            onChange={e => setProductUrl(e.target.value)}
            placeholder={t('urlPlaceholder', language)}
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
            {isAnalyzingProductLink ? t('analyzeProduct', language) + '...' : t('analyzeProduct', language)}
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
      label: t('reviewText', language),
      icon: MessageSquare,
      content: (
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">{t('enterReviews', language)}</label>
          <textarea
            value={reviews}
            onChange={e => setReviews(e.target.value)}
            placeholder={t('reviewsPlaceholder', language)}
            className="w-full px-4 py-3 border-2 border-blue-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors mb-4 min-h-[100px]"
          />
          <label className="block text-sm font-semibold text-gray-700 mb-2 mt-2">{t('productNameContext', language)}</label>
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
            {isAnalyzingReview ? t('analyzeReview', language) + '...' : t('analyzeReview', language)}
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
      label: t('productImage', language),
      icon: ImageIcon,
      content: (
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">{t('uploadImage', language)}</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="w-full px-4 py-2 border-2 border-blue-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors mb-4"
          />
          <label className="block text-sm font-semibold text-gray-700 mb-2 mt-2">{t('productNameContext', language)}</label>
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
            {isVerifyingImage ? t('analyzeProduct', language) + '...' : t('analyzeProduct', language)}
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
      label: t('productName', language),
      icon: Tag,
      content: (
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">{t('enterProductName', language)}</label>
          <input
            type="text"
            value={productName}
            onChange={e => setProductName(e.target.value)}
            placeholder={t('productNamePlaceholder', language)}
            className="w-full px-4 py-3 border-2 border-blue-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors mb-4"
          />
          <div className="mt-4 text-blue-700 bg-blue-50 border border-blue-200 rounded-xl p-4">
            {t('productNameContextDescription', language)}
          </div>
        </div>
      )
    },
    {
      label: t('voiceInput', language),
      icon: Mic,
      content: (
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">{t('speakProductNameOrReview', language)}</label>
          <div className="mb-2 text-xs text-gray-500">{t('currentLanguage', language)}: <span className="font-semibold">{language.toUpperCase()}</span></div>
          <div className="mb-2 text-sm text-blue-700 font-medium">{t('recordYourReviewUsingYourVoice', language)}</div>
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
              <span>{isVoiceActive ? t('listening', language) : t('tapToSpeak', language)}</span>
            </button>
            <input
              type="text"
              value={voiceText}
              onChange={e => setVoiceText(e.target.value)}
              placeholder={t('orTypeHere', language)}
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
            {t('analyzeVoiceInput', language)}
          </button>
          {voiceError && <div className="mt-4 text-red-600 font-medium">{voiceError}</div>}
          {voiceResult && (
            <div className="mt-8">
              <ResultsSection analysisResult={voiceResult} />
                  </div>
                )}
        </div>
      )
    },
    {
      label: t('priceComparison', language),
      icon: BarChart3,
      content: <PriceComparisonTab />
    },
  ];

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
                await fetch(`${API_CONFIG.BASE_URL}/user/clear-history`, {
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
          {t('clearHistory', language)}
        </button>
        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[350px]">
            <div className="flex gap-8 mb-8">
              <div className="bg-gray-50 rounded-xl p-6 shadow flex flex-col items-center">
                <Pie data={emptyPieData} style={{ width: 180, height: 180 }} />
                <div className="text-gray-500 mt-2">{t('riskLevelDistribution', language)}</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-6 shadow flex flex-col items-center">
                <Line data={emptyLineData} style={{ width: 220, height: 180 }} />
                <div className="text-gray-500 mt-2">{t('confidenceScoreTrend', language)}</div>
              </div>
            </div>
            <div className="text-lg text-gray-400 font-medium mt-4">{t('noAnalysisHistoryYet', language)}<br/>{t('yourResultsWillAppearHereAfterYourFirstAnalysis', language)}</div>
          </div>
        ) : (
          <>
            <h3 style={{ fontSize: 22, fontWeight: 600, marginBottom: 0, alignSelf: 'flex-start' }}>{t('yourReviewHistoryAndAnalytics', language)}</h3>
            <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', justifyContent: 'center' }}>
              <div style={{ width: 320, minWidth: 260, background: '#f9fafb', borderRadius: 16, padding: 24, boxShadow: '0 2px 8px #0001', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Pie data={pieData} style={{ width: '100%', maxWidth: 220 }} />
                <div style={{ textAlign: 'center', marginTop: 12, fontWeight: 500 }}>{t('riskLevelDistribution', language)}</div>
              </div>
              <div style={{ flex: 1, minWidth: 340, maxWidth: 600, background: '#f9fafb', borderRadius: 16, padding: 24, boxShadow: '0 2px 8px #0001', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Line data={lineData} style={{ width: '100%', maxWidth: 500 }} plugins={[ChartDataLabels]} options={lineOptions} />
                <div style={{ textAlign: 'center', marginTop: 12, fontWeight: 500 }}>{t('confidenceScoreTrend', language)}</div>
              </div>
            </div>
            <div style={{ background: '#f8fafc', borderRadius: 16, boxShadow: '0 2px 8px #0001', padding: 24, marginTop: 0, overflowX: 'auto', minWidth: 320 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9' }}>
                    <th style={{ padding: 10, border: '1px solid #e5e7eb' }}>#</th>
                    <th style={{ padding: 10, border: '1px solid #e5e7eb' }}>{t('review', language)}</th>
                    <th style={{ padding: 10, border: '1px solid #e5e7eb' }}>{t('confidence', language)}</th>
                    <th style={{ padding: 10, border: '1px solid #e5e7eb' }}>{t('risk', language)}</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((item, idx) => {
                    let confidence = "N/A";
                    let risk = "SAFE";
                    let reviewText = item.review || item.product_url || item.image || "";
                    // Alternate products entry
                    if (item.type === "alternate_products") {
                      reviewText = (
                        <div>
                          <div style={{fontWeight:600, color:'#3b82f6'}}>Alternate Products Search</div>
                          <div><b>Product:</b> {item.product_name} <b>Max Price:</b> ₹{item.max_price}</div>
                          {item.alternates && item.alternates.length > 0 ? (
                            <ul style={{margin:'6px 0', paddingLeft:18}}>
                              {item.alternates.slice(0,2).map((alt, i) => (
                                <li key={i}>
                                  <b>{alt.name}</b> - ₹{alt.price} ({alt.retailer}) <a href={alt.link} target="_blank" rel="noopener noreferrer" style={{color:'#2563eb'}}>View</a>
                                </li>
                              ))}
                              {item.alternates.length > 2 && <li>...and {item.alternates.length - 2} more</li>}
                            </ul>
                          ) : item.raw_answer ? (
                            <div style={{fontStyle:'italic', color:'#64748b', fontSize:13}}>{item.raw_answer.slice(0,120)}{item.raw_answer.length>120?'...':''}</div>
                          ) : (
                            <div style={{color:'#ef4444'}}>No alternates found.</div>
                          )}
                        </div>
                      );
                      confidence = "-";
                      risk = "-";
                    } else if (item.type === "price_comparison") {
                      reviewText = (
                        <div>
                          <div style={{fontWeight:600, color:'#f59e42'}}>{t('priceComparison', language)}</div>
                          <div><b>Product:</b> {item.product_name}</div>
                          <div style={{fontStyle:'italic', color:'#64748b', fontSize:13}}>{item.summary ? item.summary.slice(0,120)+(item.summary.length>120?'...':'') : 'No summary.'}</div>
                        </div>
                      );
                      confidence = "-";
                      risk = "-";
                    } else if (item.type === "product_image") {
                      // Try to show image URL or a placeholder
                      if (item.result && item.result.image_url) {
                        reviewText = item.result.image_url;
                      } else if (item.result && item.result.url) {
                        reviewText = item.result.url;
                      } else {
                        reviewText = "[Image]";
                      }
                    }
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
                          }}>{(risk === 'SAFE' && confidence === 'N/A') ? '-' : risk}</span>
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
