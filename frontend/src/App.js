import React, { useState } from 'react';
import { LanguageProvider } from './context/LanguageContext';
import { HomePage } from './pages/HomePage';
import { TrustChecker } from './pages/TrustChecker';

function App() {
  const [currentPage, setCurrentPage] = useState('home');

  return (
    <LanguageProvider>
      <div className="font-sans">
        {currentPage === 'home' && <HomePage onNavigate={setCurrentPage} />}
        {currentPage === 'checker' && <TrustChecker onNavigate={setCurrentPage} />}
      </div>
    </LanguageProvider>
  );
}

export default App;
