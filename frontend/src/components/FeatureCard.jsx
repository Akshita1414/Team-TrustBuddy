import React from 'react';
import { DivideIcon } from 'lucide-react';

export function FeatureCard({ icon: Icon, title, description, gradient }) {
  return (
    <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100">
      <div className={`${gradient} w-12 h-12 rounded-xl flex items-center justify-center mb-6`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-4">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}
