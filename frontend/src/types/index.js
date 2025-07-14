// Language object example
export const exampleLanguage = {
  code: 'en',
  name: 'English',
  flag: '🇮🇳'
};

// AnalysisResult object structure example
export const exampleAnalysisResult = {
  confidenceScore: 85,
  reviewAnalysis: {
    genuine: 70,
    suspicious: 30,
    flaggedKeywords: ["amazing", "too good to be true"]
  },
  imageCheck: {
    aiGenerated: 10,
    crossSellerMatch: 95,
    status: "Looks genuine"
  },
  priceCheck: {
    listedPrice: 1499,
    marketAverage: 999,
    inflationPercentage: 50
  },
  sellerCredibility: {
    rating: 4.3,
    totalReviews: 128,
    hasVerifiedBadge: true
  }
};

// TrustBadge example object
export const exampleTrustBadge = {
  level: 'trusted', // or 'cautious' or 'risky'
  color: '#16a34a', // e.g., Tailwind green-600
  text: 'Trusted Seller',
  icon: 'check-circle' // or any icon string (you can map it later)
};
