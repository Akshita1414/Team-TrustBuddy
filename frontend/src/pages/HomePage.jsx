import React from 'react';
import { Shield, CheckCircle, Upload, Globe } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { Header } from '../components/Header';
import { FeatureCard } from '../components/FeatureCard';

export function HomePage({ onNavigate }) {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50">
      <Header />

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              {t('heroTitle')}
            </h2>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              {t('heroSubtitle')}
            </p>

            <button
              onClick={() => onNavigate('checker')}
              className="group bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-xl font-semibold px-12 py-4 rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200 inline-flex items-center space-x-3"
            >
              <Shield className="w-6 h-6" />
              <span>{t('checkProduct')}</span>
              <div className="w-2 h-2 bg-white rounded-full group-hover:animate-pulse"></div>
            </button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-20 grid md:grid-cols-3 gap-8">
          <FeatureCard
            icon={CheckCircle}
            title={t('Review Analysis')}
            description={t('Review Analysis Desc')}
            gradient="bg-gradient-to-r from-green-500 to-green-600"
          />

          <FeatureCard
            icon={Upload}
            title={t('Image Verification')}
            description={t('Image Verification Desc')}
            gradient="bg-gradient-to-r from-blue-500 to-blue-600"
          />

          <FeatureCard
            icon={Globe}
            title={t('Regional Support')}
            description={t('Regional Support Desc')}
            gradient="bg-gradient-to-r from-purple-500 to-purple-600"
          />
        </div>
      </main>
    </div>
  );
}
