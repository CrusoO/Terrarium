import React, { useState } from 'react';
import DropZone from './components/DropZone.jsx';
import Gallery from './components/Gallery.jsx';
import Toolbar from './components/Toolbar.jsx';
import useGallery from './hooks/useGallery.js';

export default function App() {
  const { images, addImages, removeImage, clearAll } = useGallery();
  const [isDragOver, setIsDragOver] = useState(false);

  const hasImages = images.length > 0;

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-inner">
          <div className="app-brand">
            <span className="app-brand-icon">🖼️</span>
            <span className="app-brand-name">Drop Gallery</span>
          </div>
          {hasImages && (
            <Toolbar count={images.length} onClearAll={clearAll} />
          )}
        </div>
      </header>

      <main className="app-main">
        {/* Full-page drop overlay always active */}
        <DropZone
          onFilesDropped={addImages}
          isDragOver={isDragOver}
          setIsDragOver={setIsDragOver}
          isEmpty={!hasImages}
        />

        {hasImages && (
          <Gallery
            images={images}
            onRemove={removeImage}
            isDragOver={isDragOver}
          />
        )}
      </main>
    </div>
  );
}
