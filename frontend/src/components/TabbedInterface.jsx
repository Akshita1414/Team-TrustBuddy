import React, { useState } from 'react';

export function TabbedInterface({ tabs, initialTab = 0 }) {
  const [activeTab, setActiveTab] = useState(initialTab);

  return (
    <div className="w-full">
      {/* Tab Headers */}
      <div className="flex space-x-2 md:space-x-6 mb-8 justify-center">
        {tabs.map((tab, idx) => (
          <button
            key={tab.label}
            onClick={() => setActiveTab(idx)}
            className={`flex items-center px-5 py-3 rounded-t-2xl font-semibold text-lg transition-all duration-200 shadow-md border-b-4 focus:outline-none
              ${activeTab === idx
                ? 'bg-gradient-to-r from-blue-500 to-orange-400 text-white border-orange-400 scale-105 shadow-xl'
                : 'bg-white text-gray-700 border-transparent hover:bg-blue-50 hover:text-blue-600'}
            `}
            style={{ minWidth: 160 }}
          >
            {tab.icon && <tab.icon className="w-5 h-5 mr-2" />}
            {tab.label}
          </button>
        ))}
      </div>
      {/* Tab Content */}
      <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100 animate-fade-in min-h-[350px]">
        {tabs[activeTab].content}
      </div>
    </div>
  );
} 