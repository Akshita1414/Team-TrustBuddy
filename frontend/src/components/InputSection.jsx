import React from 'react';
import { Mic, Upload, AlertCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export function InputSection({
  productUrl,
  setProductUrl,
  textQuery,
  setTextQuery,
  reviews,
  setReviews,
  isVoiceActive,
  onVoiceInput,
  onAnalyze,
  isAnalyzing,
  error,
  backendStatus,
  onImageUpload, // NEW PROP
  selectedImage, // NEW PROP
  onAnalyzeImage, // NEW PROP
  isVerifyingImage, // NEW PROP
  onAnalyzeProductLink, // NEW PROP
  isAnalyzingProductLink // NEW PROP
}) {
  const { t } = useLanguage();

  const isAnalyzeDisabled = !reviews.trim() || isAnalyzing || backendStatus === 'disconnected';
  const isAnalyzeImageDisabled = !selectedImage || backendStatus === 'disconnected' || isVerifyingImage;
  const isAnalyzeProductLinkDisabled = !productUrl.trim() || isAnalyzingProductLink || backendStatus === 'disconnected';

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Review Analysis Input</h2>
      
      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
            <span className="text-red-700 font-medium">{error}</span>
          </div>
        </div>
      )}

      {/* Backend Status Warning */}
      {backendStatus === 'disconnected' && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-yellow-500 mr-2" />
            <span className="text-yellow-700 font-medium">
              Backend service is not available. Analysis features will be disabled.
            </span>
          </div>
        </div>
      )}
      
      <div className="grid md:grid-cols-2 gap-6">
        {/* Product URL Input */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Product Demo Link (URL)
          </label>
          <input
            type="url"
            value={productUrl}
            onChange={(e) => setProductUrl(e.target.value)}
            placeholder="https://example.com/product"
            className="w-full px-4 py-3 border-2 border-blue-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
            disabled={backendStatus === 'disconnected'}
          />
          <button
            onClick={onAnalyzeProductLink}
            disabled={isAnalyzeProductLinkDisabled}
            className={`mt-4 w-full px-4 py-3 rounded-xl font-semibold text-white transition-all duration-200 shadow-lg ${
              isAnalyzeProductLinkDisabled
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 hover:scale-105'
            }`}
          >
            {isAnalyzingProductLink ? 'Analyzing Product Link...' : 'Analyze Product Link'}
          </button>
        </div>

        {/* Voice Input */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Voice Input (Demo)
          </label>
          <button
            onClick={onVoiceInput}
            disabled={backendStatus === 'disconnected'}
            className={`w-full px-4 py-3 border-2 rounded-xl flex items-center justify-center space-x-2 transition-all ${
              isVoiceActive 
                ? 'border-red-500 bg-red-50 text-red-600' 
                : backendStatus === 'disconnected'
                ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                : 'border-gray-200 hover:border-blue-400 text-gray-600'
            }`}
          >
            <Mic className={`w-5 h-5 ${isVoiceActive ? 'animate-pulse' : ''}`} />
            <span>{isVoiceActive ? 'Listening...' : 'Tap to speak'}</span>
          </button>
        </div>

        {/* Product Name */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Product Name (Optional)
          </label>
          <input
            type="text"
            value={textQuery}
            onChange={(e) => setTextQuery(e.target.value)}
            placeholder="Enter product name for context"
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
            disabled={backendStatus === 'disconnected'}
          />
        </div>

        {/* Image Upload */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Product Image (Optional)
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={e => {
              if (e.target.files && e.target.files[0]) {
                onImageUpload(e.target.files[0]);
              }
            }}
            className="w-full px-4 py-3 border-2 border-dashed rounded-xl transition-colors"
            disabled={backendStatus === 'disconnected'}
          />
          {selectedImage && (
            <div className="mt-2 flex items-center space-x-2">
              <img src={URL.createObjectURL(selectedImage)} alt="Preview" className="h-16 rounded shadow" />
              <span className="text-xs text-gray-500">{selectedImage.name}</span>
            </div>
          )}
          <button
            onClick={onAnalyzeImage}
            disabled={isAnalyzeImageDisabled}
            className={`mt-4 w-full px-4 py-3 rounded-xl font-semibold text-white transition-all duration-200 shadow-lg ${
              isAnalyzeImageDisabled
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 hover:scale-105'
            }`}
          >
            {isVerifyingImage ? 'Analyzing Image...' : 'Analyze Image'}
          </button>
        </div>
      </div>

      {/* Reviews Input */}
      <div className="mt-6">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Review Text <span className="text-red-500">*</span>
        </label>
        <textarea
          value={reviews}
          onChange={(e) => setReviews(e.target.value)}
          placeholder="Paste the review text you want to analyze for authenticity..."
          rows={6}
          className={`w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors resize-none ${
            backendStatus === 'disconnected' ? 'bg-gray-50' : ''
          }`}
          disabled={backendStatus === 'disconnected'}
        />
        <div className="mt-2 text-sm text-gray-500">
          Minimum 5 characters required. Maximum 5000 characters.
        </div>
      </div>

      {/* Analyze Button */}
      <div className="mt-8 text-center">
        <button
          onClick={onAnalyze}
          disabled={isAnalyzeDisabled}
          className={`bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-lg font-semibold px-12 py-4 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 ${
            isAnalyzeDisabled 
              ? 'opacity-50 cursor-not-allowed transform-none' 
              : isAnalyzing 
              ? 'animate-pulse cursor-not-allowed' 
              : ''
          }`}
        >
          {isAnalyzing ? 'Analyzing...' : 'Analyze Review'}
        </button>
      </div>

      {/* Instructions */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">How it works:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Paste the review text you want to analyze</li>
          <li>• Our AI analyzes text patterns, sentiment, and coherence</li>
          <li>• Get a confidence score and risk assessment</li>
          <li>• Receive detailed breakdown and recommendations</li>
        </ul>
      </div>
    </div>
  );
}
