import { translations } from '../data/translations';

/**
 * Hybrid translation utility that handles both hard-coded frontend translations
 * and dynamic backend response translations
 */
export class TranslationUtils {
  constructor(language = 'en') {
    this.language = language;
    this.translations = translations[language] || translations['en'];
  }

  /**
   * Get hard-coded frontend translation
   * @param {string} key - Translation key
   * @returns {string} Translated text
   */
  t(key) {
    return this.translations[key] || key;
  }

  /**
   * Get nested translation for analysis results
   * @param {string} category - Category like 'analysisResults', 'errors', 'loading'
   * @param {string} key - Specific key within category
   * @returns {string} Translated text
   */
  getAnalysisTranslation(category, key) {
    const categoryData = this.translations[category];
    if (!categoryData) {
      console.warn(`Translation category '${category}' not found for language '${this.language}'`);
      return key;
    }
    return categoryData[key] || key;
  }

  /**
   * Translate analysis results from backend
   * @param {Object} analysisData - Backend analysis response
   * @returns {Object} Translated analysis data
   */
  translateAnalysisResults(analysisData) {
    if (!analysisData) return analysisData;

    const translated = { ...analysisData };

    // Translate recommendations
    if (translated.recommendations && Array.isArray(translated.recommendations)) {
      translated.recommendations = translated.recommendations.map(rec => {
        // Map common recommendation patterns to translations
        if (rec.includes('trustworthy') || rec.includes('authentic')) {
          return this.getAnalysisTranslation('analysisResults', 'trustThisReview');
        } else if (rec.includes('caution') || rec.includes('suspicious')) {
          return this.getAnalysisTranslation('analysisResults', 'considerWithCaution');
        } else if (rec.includes('avoid') || rec.includes('fake')) {
          return this.getAnalysisTranslation('analysisResults', 'avoidThisReview');
        } else if (rec.includes('check other') || rec.includes('compare')) {
          return this.getAnalysisTranslation('analysisResults', 'checkOtherReviews');
        } else if (rec.includes('verify') || rec.includes('independent')) {
          return this.getAnalysisTranslation('analysisResults', 'verifyProductDetails');
        } else if (rec.includes('report') || rec.includes('suspicious')) {
          return this.getAnalysisTranslation('analysisResults', 'reportIfSuspicious');
        }
        return rec; // Keep original if no pattern match
      });
    }

    // Translate detailed analysis labels
    if (translated.detailed_analysis) {
      const detailed = translated.detailed_analysis;
      
      // Translate text analysis labels
      if (detailed.text_analysis) {
        const textAnalysis = detailed.text_analysis;
        const translatedTextAnalysis = {};
        
        Object.keys(textAnalysis).forEach(key => {
          const translationKey = this.getTextAnalysisKey(key);
          if (translationKey) {
            translatedTextAnalysis[translationKey] = textAnalysis[key];
          } else {
            translatedTextAnalysis[key] = textAnalysis[key];
          }
        });
        
        detailed.text_analysis = translatedTextAnalysis;
      }

      // Translate sentiment analysis labels
      if (detailed.sentiment_analysis) {
        const sentiment = detailed.sentiment_analysis;
        if (sentiment.scores) {
          sentiment.scores = {
            [this.getAnalysisTranslation('analysisResults', 'positiveSentiment')]: sentiment.scores.positive,
            [this.getAnalysisTranslation('analysisResults', 'negativeSentiment')]: sentiment.scores.negative,
            [this.getAnalysisTranslation('analysisResults', 'neutralSentiment')]: sentiment.scores.neutral
          };
        }
      }

      // Translate summary
      if (detailed.summary) {
        detailed.summary = this.translateSummary(detailed.summary);
      }
    }

    return translated;
  }

  /**
   * Map backend analysis keys to translation keys
   * @param {string} key - Backend analysis key
   * @returns {string} Translation key
   */
  getTextAnalysisKey(key) {
    const keyMap = {
      'repetitive_words': 'repetitiveWords',
      'excessive_punctuation': 'excessivePunctuation',
      'spam_keywords': 'spamKeywords',
      'grammar_score': 'grammarQuality',
      'length_score': 'lengthAppropriateness',
      'caps_ratio': 'capsRatio',
      'exclamation_ratio': 'exclamationRatio',
      'question_ratio': 'questionRatio',
      'fake_phrases_count': 'fakePhrases',
      'emotional_intensity': 'emotionalIntensity',
      'unique_word_ratio': 'uniqueWordRatio'
    };
    return keyMap[key] || key;
  }

  /**
   * Translate analysis summary based on confidence score
   * @param {string} summary - Original summary
   * @returns {string} Translated summary
   */
  translateSummary(summary) {
    const lowerSummary = summary.toLowerCase();
    
    if (lowerSummary.includes('authentic') || lowerSummary.includes('trustworthy')) {
      return this.getAnalysisTranslation('analysisResults', 'authentic');
    } else if (lowerSummary.includes('suspicious') || lowerSummary.includes('caution')) {
      return this.getAnalysisTranslation('analysisResults', 'suspicious');
    } else if (lowerSummary.includes('fake') || lowerSummary.includes('misleading')) {
      return this.getAnalysisTranslation('analysisResults', 'fake');
    }
    
    return summary; // Keep original if no pattern match
  }

  /**
   * Get error message translation
   * @param {string} errorType - Type of error
   * @returns {string} Translated error message
   */
  getErrorMessage(errorType) {
    return this.getAnalysisTranslation('errors', errorType);
  }

  /**
   * Get loading message translation
   * @param {string} loadingType - Type of loading state
   * @returns {string} Translated loading message
   */
  getLoadingMessage(loadingType) {
    return this.getAnalysisTranslation('loading', loadingType);
  }

  /**
   * Update language and reload translations
   * @param {string} newLanguage - New language code
   */
  setLanguage(newLanguage) {
    this.language = newLanguage;
    this.translations = translations[newLanguage] || translations['en'];
  }
}

/**
 * Create a translation utility instance
 * @param {string} language - Language code
 * @returns {TranslationUtils} Translation utility instance
 */
export const createTranslationUtils = (language = 'en') => {
  return new TranslationUtils(language);
};

/**
 * Hook for using translations in React components
 * @param {string} language - Current language
 * @returns {Object} Translation utilities
 */
export const useTranslationUtils = (language = 'en') => {
  const utils = createTranslationUtils(language);
  
  return {
    t: utils.t.bind(utils),
    translateAnalysisResults: utils.translateAnalysisResults.bind(utils),
    getErrorMessage: utils.getErrorMessage.bind(utils),
    getLoadingMessage: utils.getLoadingMessage.bind(utils),
    getAnalysisTranslation: utils.getAnalysisTranslation.bind(utils)
  };
}; 