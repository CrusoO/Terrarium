import React, { useState } from 'react';
import { X, ZoomIn } from 'lucide-react';
import { formatBytes } from '../utils/helpers.js';

export default function ImageCard({ image, onRemove }) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const handleRemove = (e) => {
    e.stopPropagation();
    onRemove(image.id);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setLightboxOpen(true);
    }
  };

  const handleLightboxClose = (e) => {
    if (e.target === e.currentTarget || e.key === 'Escape') {
      setLightboxOpen(false);
    }
  };

  const handleLightboxKeyDown = (e) => {
    if (e.key === 'Escape') setLightboxOpen(false);
  };

  return (
    <>
      <article className="image-card" aria-label={image.name}>
        <div
          className="image-card-thumb"
          onClick={() => setLightboxOpen(true)}
          onKeyDown={handleKeyDown}
          role="button"
          tabIndex={0}
          aria-label={`View ${image.name} full size`}
        >
          {!imgLoaded && <div className="image-card-skeleton" aria-hidden="true" />}
          <img
            src={image.url}
            alt={image.name}
            className={`image-card-img ${imgLoaded ? 'image-card-img-loaded' : ''}`}
            onLoad={() => setImgLoaded(true)}
            draggable={false}
          />
          <div className="image-card-overlay" aria-hidden="true">
            <ZoomIn size={20} strokeWidth={2} />
          </div>
        </div>

        <div className="image-card-meta">
          <span className="image-card-name" title={image.name}>
            {image.name}
          </span>
          <span className="image-card-size">{formatBytes(image.size)}</span>
        </div>

        <button
          className="image-card-remove"
          onClick={handleRemove}
          aria-label={`Remove ${image.name}`}
          title="Remove image"
        >
          <X size={14} strokeWidth={2.5} />
        </button>
      </article>

      {lightboxOpen && (
        <div
          className="lightbox"
          onClick={handleLightboxClose}
          onKeyDown={handleLightboxKeyDown}
          role="dialog"
          aria-modal="true"
          aria-label={`Lightbox: ${image.name}`}
          tabIndex={-1}
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus
        >
          <button
            className="lightbox-close"
            onClick={() => setLightboxOpen(false)}
            aria-label="Close lightbox"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
          <img
            src={image.url}
            alt={image.name}
            className="lightbox-img"
            draggable={false}
          />
          <div className="lightbox-caption">
            <span>{image.name}</span>
            <span>{formatBytes(image.size)}</span>
          </div>
        </div>
      )}
    </>
  );
}
