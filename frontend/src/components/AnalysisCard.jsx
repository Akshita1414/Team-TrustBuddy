import React from 'react';
import { DivideIcon } from 'lucide-react';

export function AnalysisCard({ icon: Icon, title, iconColor, children }) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <Icon className={`w-5 h-5 ${iconColor} mr-2`} />
        {title}
      </h3>
      {children}
    </div>
  );
}
