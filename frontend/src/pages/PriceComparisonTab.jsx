import React, { useState } from 'react';
import { API_CONFIG } from '../config';
import { speak, getVoiceLanguage } from '../utils/voice';
import { useLanguage } from '../context/LanguageContext';

export default function PriceComparisonTab() {
  const { t, language } = useLanguage();
  const [productName, setProductName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState('');
  const [blocked, setBlocked] = useState(false);
  const [alternates, setAlternates] = useState([]);
  const [altLoading, setAltLoading] = useState(false);
  const [altError, setAltError] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [rawAnswer, setRawAnswer] = useState('');
  const [sameProducts, setSameProducts] = useState([]);
  const [resultType, setResultType] = useState('');
  const [actualPrices, setActualPrices] = useState([]);

  const handleCompare = async () => {
    setError('');
    setBlocked(false);
    setSummary('');
    setActualPrices([]);
    if (!productName.trim()) {
      setError(t('pleaseEnterProductName'));
      return;
    }
    setLoading(true);
    try {
      const username = localStorage.getItem('username');
      console.log('DEBUG: Sending request with language:', language); // Debug log
      const response = await fetch(`${API_CONFIG.BASE_URL}/compare-prices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_name: productName, username, language })
      });
      const data = await response.json();
      console.log('DEBUG: Received response:', data); // Debug log
      if (data.error) {
        setError(data.error);
        setLoading(false);
        return;
      }
      if (!data.summary || data.summary === 'No insight available.') {
        setBlocked(true);
        setLoading(false);
        return;
      }
      // Backend now uses Gemini API to translate responses, so display directly
      setSummary(data.summary);
      if (data.actual_prices) {
        setActualPrices(data.actual_prices);
      }
    } catch (e) {
      setError(t('failedToFetchPriceInsight'));
    }
    setLoading(false);
  };

  const handleRecommend = async () => {
    setAltError('');
    setAlternates([]);
    setSameProducts([]);
    setRawAnswer('');
    setResultType('');
    if (!productName.trim() || !maxPrice.trim() || isNaN(Number(maxPrice))) {
      setAltError('Enter product name and a valid max price.');
      return;
    }
    setAltLoading(true);
    
    // Add timeout for better UX
    const timeoutId = setTimeout(() => {
      if (altLoading) {
        setAltError('Request is taking longer than expected. Please wait or try again.');
      }
    }, 15000); // 15 second timeout warning
    
    try {
      const username = localStorage.getItem('username');
      const controller = new AbortController();
      const timeoutId2 = setTimeout(() => controller.abort(), 30000); // 30 second total timeout
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/recommend-alternates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_name: productName, max_price: maxPrice, username }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId2);
      const data = await response.json();
      
      if (data.error) {
        setAltError(data.error);
        setAltLoading(false);
        return;
      }
      
      setResultType(data.type);
      if (data.type === 'same_product' && data.products && data.products.length > 0) {
        setSameProducts(data.products);
        setRawAnswer(data.raw_answer || '');
      } else if (data.type === 'alternates' && data.alternates && data.alternates.length > 0) {
        setAlternates(data.alternates);
        setRawAnswer(data.raw_answer || '');
      } else if (data.raw_answer) {
        setRawAnswer(data.raw_answer);
      } else {
        setAltError('No products found.');
      }
    } catch (e) {
      if (e.name === 'AbortError') {
        setAltError('Request timed out. Please try again with a different product or price range.');
      } else {
        setAltError('Failed to fetch alternates. Please check your connection and try again.');
      }
    } finally {
      clearTimeout(timeoutId);
      setAltLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">{t('priceComparison')}</h2>
          <p className="text-gray-600">Compare prices across multiple retailers and find the best deals</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <input
              type="text"
              className="w-full px-6 py-4 border-2 border-blue-200 rounded-xl focus:border-blue-500 focus:outline-none text-lg shadow-sm"
              placeholder={t('enterProductNamePlaceholder')}
              value={productName}
              onChange={e => setProductName(e.target.value)}
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          <button
            onClick={handleCompare}
            className="px-8 py-4 rounded-xl bg-gradient-to-r from-blue-500 to-orange-500 text-white font-semibold text-lg shadow-lg hover:from-blue-600 hover:to-orange-600 transition-all duration-200 hover:shadow-xl flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            {t('comparePrices')}
          </button>
        </div>
        
        {/* Helper tip for better results */}
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-400 rounded-xl">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-sm text-blue-800">
              <span className="font-semibold">{t('tip')}</span> {t('tipText')} <span className="italic font-medium">"{t('tipExample1')}"</span>, <span className="italic font-medium">"{t('tipExample2')}"</span>, or <span className="italic font-medium">"{t('tipExample3')}"</span>.
            </div>
          </div>
        </div>
        {error && (
          <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-pink-50 border-l-4 border-red-400 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div className="text-red-800 font-medium">{error}</div>
            </div>
          </div>
        )}
        {loading && (
          <div className="flex flex-col justify-center items-center py-12">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
              <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-orange-500 rounded-full animate-spin" style={{animationDelay: '0.5s'}}></div>
            </div>
            <div className="mt-4 text-center">
              <div className="text-lg font-semibold text-gray-700 mb-2">Analyzing prices...</div>
              <div className="text-sm text-gray-500">Searching across multiple retailers</div>
            </div>
          </div>
        )}
        {blocked && (
          <div className="mb-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-400 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="text-yellow-800 font-medium">{t('noPriceInsight')}</div>
            </div>
          </div>
        )}
        {summary && !blocked && (
          <div className="bg-gradient-to-br from-white to-blue-50 rounded-2xl shadow-lg p-8 border border-blue-100 mt-6 relative overflow-hidden">
            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100 to-transparent rounded-full -mr-16 -mt-16 opacity-50"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-orange-100 to-transparent rounded-full -ml-12 -mb-12 opacity-50"></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-orange-500 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-800">{t('priceInsight')}</h3>
                </div>
                <button
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2"
                  onClick={() => speak(summary, getVoiceLanguage(language))}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  </svg>
                  {t('listen')}
                </button>
              </div>
              <div className="bg-white rounded-xl p-4 border border-blue-200 shadow-sm">
                <p className="text-gray-800 text-base leading-relaxed whitespace-pre-line">{summary}</p>
              </div>
              
              {/* Display actual prices if available */}
              {actualPrices.length > 0 && (
                <div className="mt-6 pt-6 border-t border-blue-200">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h4 className="text-lg font-semibold text-gray-800">{t('actualPricesFound')}</h4>
                  </div>
                  <div className="grid gap-3">
                    {actualPrices.slice(0, 5).map((price, index) => (
                      <a 
                        key={index} 
                        href={price.source} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="block bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 hover:border-blue-400 hover:scale-[1.02] group cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="text-3xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">₹{price.price.toLocaleString()}</span>
                              {index === 0 && (
                                <span className="bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                                  <svg className="w-3 h-3 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  Best Price
                                </span>
                              )}
                              <div className="ml-auto">
                                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                  </svg>
                                </div>
                              </div>
                            </div>
                            <div className="text-sm text-gray-700 font-medium truncate mb-1">{price.title}</div>
                            {price.content && (
                              <div className="text-xs text-gray-500 line-clamp-2 group-hover:text-gray-600 transition-colors">{price.content}</div>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-xs text-blue-600 font-medium">Click to visit →</span>
                              <span className="text-xs text-gray-400">Opens in new tab</span>
                            </div>
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                  {actualPrices.length > 5 && (
                    <div className="text-center mt-4">
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-full text-sm">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {t('showingFirst5')} {actualPrices.length} {t('pricesFound')}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
        {/* Alternate Recommendations */}
        <div className="mt-10">
          <h3 className="text-xl font-semibold mb-2">{t('findAlternateProducts')}</h3>
          
          {/* Quick Search Tips */}
          <div className="mb-4 p-3 bg-blue-50 border-l-4 border-blue-300 rounded">
            <div className="text-sm text-blue-800">
              <div className="font-medium mb-1">💡 Quick Search Tips:</div>
              <div className="text-xs">
                • Use specific product names (e.g., "Samsung Galaxy M34" instead of "phone")<br/>
                • Set realistic price ranges for faster results<br/>
                • Try popular brands for better availability
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <input
              type="number"
              className="flex-1 px-4 py-3 border-2 border-orange-200 rounded-xl focus:border-orange-500 focus:outline-none"
              placeholder={t('maxPrice')}
              value={maxPrice}
              onChange={e => setMaxPrice(e.target.value)}
            />
            <button
              onClick={handleRecommend}
              disabled={altLoading}
              className={`px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-blue-500 text-white font-semibold shadow transition-all ${
                altLoading 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:from-orange-600 hover:to-blue-600'
              }`}
            >
              {altLoading ? 'Searching...' : t('findAlternates')}
            </button>
          </div>
          {altError && <div className="mb-4 text-red-600 font-medium">{altError}</div>}
          {altLoading && (
            <div className="flex flex-col justify-center items-center py-6">
              <svg className="animate-spin h-8 w-8 text-orange-500 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
              </svg>
              <div className="text-sm text-gray-600 text-center">
                <div>Searching for products...</div>
                <div className="text-xs mt-1">This may take 10-15 seconds</div>
              </div>
            </div>
          )}
          {/* Show same product results if present */}
          {resultType === 'same_product' && sameProducts.length > 0 && (
            <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded mb-4 text-green-900 mt-4">
              <div className="font-bold mb-2">Same Product Found on Other Sites:</div>
              {/* Price validation warning */}
              {sameProducts.some(p => p.price < 1000) && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded mb-3 text-yellow-800">
                  <div className="text-sm">
                    <strong>⚠️ Price Warning:</strong> Some prices shown may be unrealistic or for different products. 
                    Please verify before making purchase decisions.
                  </div>
                </div>
              )}
              <div className="grid sm:grid-cols-2 gap-6 mt-2">
                {sameProducts.map((item, idx) => (
                  <a 
                    key={idx} 
                    href={item.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block bg-white rounded-xl shadow-lg p-5 border border-gray-100 hover:shadow-xl transition-all duration-300 hover:border-green-300 hover:scale-[1.02] group cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-semibold text-base text-gray-800 group-hover:text-green-600 transition-colors line-clamp-2">{item.name}</span>
                      <span className="bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm flex-shrink-0">{item.retailer}</span>
                    </div>
                    <div className="text-2xl font-bold text-green-600 mb-3 group-hover:text-green-700 transition-colors">₹ {item.price.toLocaleString()}</div>
                    <div className="flex items-center justify-between">
                      <span className="text-green-600 text-sm font-medium group-hover:text-green-700 transition-colors">View Product →</span>
                      <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
              {rawAnswer && (
                <div className="bg-gray-50 border-l-4 border-gray-300 p-4 rounded mb-4 text-gray-800 mt-4">
                  <div className="font-medium mb-1">AI Raw Answer:</div>
                  <div className="whitespace-pre-line text-sm">{rawAnswer}</div>
                </div>
              )}
            </div>
          )}
          {/* Show alternates if no same product found */}
          {resultType === 'alternates' && alternates.length > 0 && (
            <div className="grid sm:grid-cols-2 gap-6 mt-4">
              {/* Price validation warning for alternates */}
              {alternates.some(p => p.price < 1000) && (
                <div className="col-span-2 bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded mb-3 text-yellow-800">
                  <div className="text-sm">
                    <strong>⚠️ Price Warning:</strong> Some prices shown may be unrealistic or for different products. 
                    Please verify before making purchase decisions.
                  </div>
                </div>
              )}
              {alternates.map((item, idx) => (
                <a 
                  key={idx} 
                  href={item.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block bg-white rounded-xl shadow-lg p-5 border border-gray-100 hover:shadow-xl transition-all duration-300 hover:border-blue-300 hover:scale-[1.02] group cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-semibold text-base text-gray-800 group-hover:text-blue-600 transition-colors line-clamp-2">{item.name}</span>
                    <span className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm flex-shrink-0">{item.retailer}</span>
                  </div>
                  <div className="text-2xl font-bold text-orange-600 mb-3 group-hover:text-orange-700 transition-colors">₹ {item.price.toLocaleString()}</div>
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${item.price_score >= 4 ? 'bg-green-100 text-green-700' : item.price_score === 3 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                      Price Score: {item.price_score}/5
                    </span>
                    <span className="text-yellow-400 text-base">{'★'.repeat(item.price_score)}{'☆'.repeat(5 - item.price_score)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-blue-600 text-sm font-medium group-hover:text-blue-700 transition-colors">View Product →</span>
                    <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </div>
                  </div>
                </a>
              ))}
              {rawAnswer && (
                <div className="bg-gray-50 border-l-4 border-gray-300 p-4 rounded mb-4 text-gray-800 mt-4">
                  <div className="font-medium mb-1">AI Suggestions:</div>
                  <div className="whitespace-pre-line text-sm">{rawAnswer}</div>
                </div>
              )}
            </div>
          )}
          {/* Show raw answer if no products found */}
          {rawAnswer && resultType && ((resultType === 'same_product' && sameProducts.length === 0) || (resultType === 'alternates' && alternates.length === 0)) && (
            <div className="bg-gray-50 border-l-4 border-gray-300 p-4 rounded mb-4 text-gray-800 mt-4">
              <div className="font-medium mb-1">AI Suggestions:</div>
              <div className="whitespace-pre-line text-sm">{rawAnswer}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 