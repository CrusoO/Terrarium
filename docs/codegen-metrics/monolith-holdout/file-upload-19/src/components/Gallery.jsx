import React from 'react';
import ImageCard from './ImageCard.jsx';

export default function Gallery({ images, onRemove, isDragOver }) {
  return (
    <section
      className={`gallery ${isDragOver ? 'gallery-drag-over' : ''}`}
      aria-label={`Image gallery with ${images.length} image${images.length !== 1 ? 's' : ''}`}
    >
      <div className="gallery-grid">
        {images.map((image) => (
          <ImageCard
            key={image.id}
            image={image}
            onRemove={onRemove}
          />
        ))}
      </div>
    </section>
  );
}
