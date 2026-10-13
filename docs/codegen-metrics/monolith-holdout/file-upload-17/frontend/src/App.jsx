import React, { useState } from 'react';
import UploadPage from './pages/UploadPage.jsx';
import LogPage from './pages/LogPage.jsx';
import { Upload, List } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('upload');

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="header-inner">
          <div className="header-brand">
            <span className="brand-icon">🧾</span>
            <span className="brand-name">Receipt Drop Box</span>
          </div>
          <nav className="tab-nav" role="tablist">
            <button
              role="tab"
              aria-selected={activeTab === 'upload'}
              className={`tab-btn ${activeTab === 'upload' ? 'tab-btn--active' : ''}`}
              onClick={() => setActiveTab('upload')}
            >
              <Upload size={16} />
              <span>Upload</span>
            </button>
            <button
              role="tab"
              aria-selected={activeTab === 'log'}
              className={`tab-btn ${activeTab === 'log' ? 'tab-btn--active' : ''}`}
              onClick={() => setActiveTab('log')}
            >
              <List size={16} />
              <span>Receipt Log</span>
            </button>
          </nav>
        </div>
      </header>

      <main className="app-main">
        {activeTab === 'upload' && (
          <UploadPage onSuccess={() => setActiveTab('log')} />
        )}
        {activeTab === 'log' && <LogPage />}
      </main>
    </div>
  );
}
