import React, { useState } from 'react';
import { API_CONFIG } from '../config';

export default function PriceComparisonTab() {
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

  const handleCompare = async () => {
    setError('');
    setBlocked(false);
    setSummary('');
    if (!productName.trim()) {
      setError('Please enter a product name.');
      return;
    }
    setLoading(true);
    try {
      const username = localStorage.getItem('username');
      const response = await fetch(`${API_CONFIG.BASE_URL}/compare-prices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_name: productName, username })
      });
      const data = await response.json();
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
      setSummary(data.summary);
    } catch (e) {
      setError('Failed to fetch price insight.');
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
    try {
      const username = localStorage.getItem('username');
      const response = await fetch(`${API_CONFIG.BASE_URL}/recommend-alternates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_name: productName, max_price: maxPrice, username })
      });
      const data = await response.json();
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
      setAltError('Failed to fetch alternates.');
    }
    setAltLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Price Comparison</h2>
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <input
          type="text"
          className="flex-1 px-4 py-3 border-2 border-blue-200 rounded-xl focus:border-blue-500 focus:outline-none"
          placeholder="Enter product name..."
          value={productName}
          onChange={e => setProductName(e.target.value)}
        />
        <button
          onClick={handleCompare}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-orange-500 text-white font-semibold shadow hover:from-blue-600 hover:to-orange-600 transition-all"
        >
          Compare Prices
        </button>
      </div>
      {/* Helper tip for better results */}
      <div className="mb-4 text-sm text-gray-600 bg-blue-50 border-l-4 border-blue-300 rounded px-3 py-2">
        <span className="font-medium">Tip:</span> For best results, enter a specific product and site, e.g. <span className="italic">"cotton kurtis on Meesho"</span>, <span className="italic">"sneakers under 1000 on Ajio"</span>, or <span className="italic">"kitchen set on Shopclues"</span>.
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
          No price insight available for this product. Try a different or more specific product name.
        </div>
      )}
      {summary && !blocked && (
        <div className="bg-white rounded-xl shadow p-6 border border-gray-100 mt-6">
          <h3 className="text-lg font-semibold mb-2">Price Insight</h3>
          <p className="text-gray-800 text-base">{summary}</p>
        </div>
      )}
      {/* Alternate Recommendations */}
      <div className="mt-10">
        <h3 className="text-xl font-semibold mb-2">Find Alternate Products</h3>
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <input
            type="number"
            className="flex-1 px-4 py-3 border-2 border-orange-200 rounded-xl focus:border-orange-500 focus:outline-none"
            placeholder="Max price (₹)"
            value={maxPrice}
            onChange={e => setMaxPrice(e.target.value)}
          />
          <button
            onClick={handleRecommend}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-blue-500 text-white font-semibold shadow hover:from-orange-600 hover:to-blue-600 transition-all"
          >
            Find Alternates
          </button>
        </div>
        {altError && <div className="mb-4 text-red-600 font-medium">{altError}</div>}
        {altLoading && (
          <div className="flex justify-center items-center py-4">
            <svg className="animate-spin h-6 w-6 text-orange-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
            </svg>
          </div>
        )}
        {/* Show same product results if present */}
        {resultType === 'same_product' && sameProducts.length > 0 && (
          <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded mb-4 text-green-900 mt-4">
            <div className="font-bold mb-2">Same Product Found on Other Sites:</div>
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