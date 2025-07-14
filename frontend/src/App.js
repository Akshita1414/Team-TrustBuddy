import React, { useState } from 'react';
import { HomePage } from './pages/HomePage';
import { TrustChecker } from './pages/TrustChecker';

function App() {
  const [currentPage, setCurrentPage] = useState('home');

  return (
    <div className="font-sans">
      {currentPage === 'home' && <HomePage onNavigate={setCurrentPage} />}
      {currentPage === 'checker' && <TrustChecker onNavigate={setCurrentPage} />}
    </div>
  );
}

export default App;
