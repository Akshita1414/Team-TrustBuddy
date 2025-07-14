import { API_CONFIG } from '../config';

class ApiService {
  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.timeout = API_CONFIG.TIMEOUT;
  }

  async analyzeReview(reviewData) {
    try {
      const response = await fetch(`${this.baseURL}/analyze-review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          review_text: reviewData.review_text,
          product_name: reviewData.product_name || null,
          reviewer_name: reviewData.reviewer_name || null,
          rating: reviewData.rating || null,
          review_date: reviewData.review_date || null,
          language: reviewData.language || 'en'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to analyze review');
      }

      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  async healthCheck() {
    try {
      const response = await fetch(`${this.baseURL}/health`);
      if (!response.ok) {
        throw new Error('Backend service is not available');
      }
      return await response.json();
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  }

  async getApiInfo() {
    try {
      const response = await fetch(`${this.baseURL}/api/info`);
      if (!response.ok) {
        throw new Error('Failed to get API info');
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to get API info:', error);
      throw error;
    }
  }

  async verifyImage(imageFile) {
    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      const response = await fetch(`${this.baseURL}/verify-image`, {
        method: 'POST',
        body: formData
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to verify image');
      }
      return await response.json();
    } catch (error) {
      console.error('Image Verification Error:', error);
      throw error;
    }
  }

  async analyzeProductLink(productUrl) {
    try {
      const response = await fetch(`${this.baseURL}/analyze-product-link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ product_url: productUrl })
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to analyze product link');
      }
      return await response.json();
    } catch (error) {
      console.error('Product Link Analysis Error:', error);
      throw error;
    }
  }
}

export const apiService = new ApiService();
export default apiService;

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export async function postProductNameAnalysis(product_name, language) {
  const response = await fetch(`${BASE_URL}/analyze-product-name`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ product_name, language }),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.detail || 'Failed to analyze product name.');
  }
  return response.json();
} 