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
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">{t('priceComparison')}</h2>
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <input
          type="text"
          className="flex-1 px-4 py-3 border-2 border-blue-200 rounded-xl focus:border-blue-500 focus:outline-none"
          placeholder={t('enterProductNamePlaceholder')}
          value={productName}
          onChange={e => setProductName(e.target.value)}
        />
        <button
          onClick={handleCompare}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-orange-500 text-white font-semibold shadow hover:from-blue-600 hover:to-orange-600 transition-all"
        >
          {t('comparePrices')}
        </button>
      </div>
      {/* Helper tip for better results */}
      <div className="mb-4 text-sm text-gray-600 bg-blue-50 border-l-4 border-blue-300 rounded px-3 py-2">
        <span className="font-medium">{t('tip')}</span> {t('tipText')} <span className="italic">"{t('tipExample1')}"</span>, <span className="italic">"{t('tipExample2')}"</span>, or <span className="italic">"{t('tipExample3')}"</span>.
      </div>
      {error && <div className="mb-4 text-red-600 font-medium">{error}</div>}
      {loading && (
        <div className="flex justify-center items-center py-8">
          <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
          </svg>
        </div>
      )}
      {blocked && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded mb-4 text-yellow-800">
          {t('noPriceInsight')}
        </div>
      )}
      {summary && !blocked && (
        <div className="bg-white rounded-xl shadow p-6 border border-gray-100 mt-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold">{t('priceInsight')}</h3>
            <button
              className="px-2 py-1 rounded bg-blue-100 text-blue-700 text-xs font-semibold hover:bg-blue-200"
              onClick={() => speak(summary, getVoiceLanguage(language))}
            >
              {t('listen')}
            </button>
          </div>
          <p className="text-gray-800 text-base whitespace-pre-line">{summary}</p>
          
          {/* Display actual prices if available */}
          {actualPrices.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">{t('actualPricesFound')}</h4>
              <div className="grid gap-2">
                {actualPrices.slice(0, 5).map((price, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">₹{price.price.toLocaleString()}</div>
                      <div className="text-xs text-gray-500 truncate">{price.title}</div>
                      {price.content && (
                        <div className="text-xs text-gray-400 mt-1 line-clamp-2">{price.content}</div>
                      )}
                    </div>
                    <a 
                      href={price.source} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-500 text-xs hover:underline ml-2 whitespace-nowrap"
                    >
                      {t('viewSource')}
                    </a>
                  </div>
                ))}
              </div>
              {actualPrices.length > 5 && (
                <div className="text-xs text-gray-500 mt-2 text-center">
                  {t('showingFirst5')} {actualPrices.length} {t('pricesFound')}
                </div>
              )}
            </div>
          )}
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
                <div key={idx} className="bg-white rounded-xl shadow p-5 flex flex-col gap-2 border border-gray-100">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-base">{item.name}</span>
                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-bold">{item.retailer}</span>
                  </div>
                  <div className="text-lg font-bold text-orange-700 mb-1">₹ {item.price}</div>
                  <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline text-sm">View Product</a>
                </div>
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
              <div key={idx} className="bg-white rounded-xl shadow p-5 flex flex-col gap-2 border border-gray-100">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-base">{item.name}</span>
                  <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-bold">{item.retailer}</span>
                </div>
                <div className="text-lg font-bold text-orange-700 mb-1">₹ {item.price}</div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${item.price_score >= 4 ? 'bg-green-100 text-green-700' : item.price_score === 3 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>Price Score: {item.price_score}/5</span>
                  <span className="text-yellow-400 text-base">{'★'.repeat(item.price_score)}{'☆'.repeat(5 - item.price_score)}</span>
                </div>
                <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline text-sm">View Product</a>
              </div>
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
  );
} 