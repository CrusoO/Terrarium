import React, { useRef, useCallback, useEffect } from 'react';
import { UploadCloud } from 'lucide-react';
import { isImageFile } from '../utils/helpers.js';

export default function DropZone({ onFilesDropped, isDragOver, setIsDragOver, isEmpty }) {
  const fileInputRef = useRef(null);
  const shakeRef = useRef(null);

  // Prevent default browser file-open behavior on the whole window
  useEffect(() => {
    const prevent = (e) => e.preventDefault();
    window.addEventListener('dragover', prevent);
    window.addEventListener('drop', prevent);
    return () => {
      window.removeEventListener('dragover', prevent);
      window.removeEventListener('drop', prevent);
    };
  }, []);

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, [setIsDragOver]);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    // Only leave if we're exiting the drop zone itself
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragOver(false);
    }
  }, [setIsDragOver]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const processFiles = useCallback((fileList) => {
    const files = Array.from(fileList);
    const imageFiles = files.filter(isImageFile);

    if (imageFiles.length === 0 && files.length > 0) {
      // Shake animation for rejected files
      if (shakeRef.current) {
        shakeRef.current.classList.remove('shake');
        void shakeRef.current.offsetWidth; // reflow
        shakeRef.current.classList.add('shake');
      }
      return;
    }

    if (imageFiles.length > 0) {
      onFilesDropped(imageFiles);
    }
  }, [onFilesDropped]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    processFiles(e.dataTransfer.files);
  }, [setIsDragOver, processFiles]);

  const handleFileInput = useCallback((e) => {
    processFiles(e.target.files);
    e.target.value = ''; // reset so same file can be re-added
  }, [processFiles]);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fileInputRef.current?.click();
    }
  }, []);

  if (isEmpty) {
    return (
      <div
        ref={shakeRef}
        className={`dropzone-empty ${isDragOver ? 'dropzone-active' : ''}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-label="Drop images here or click to browse files"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="dropzone-input"
          onChange={handleFileInput}
          aria-hidden="true"
          tabIndex={-1}
        />
        <div className="dropzone-content">
          <div className={`dropzone-icon-wrap ${isDragOver ? 'dropzone-icon-active' : ''}`}>
            <UploadCloud size={52} strokeWidth={1.5} />
          </div>
          <h2 className="dropzone-title">
            {isDragOver ? 'Release to add images' : 'Drop images here'}
          </h2>
          <p className="dropzone-subtitle">
            Drag &amp; drop image files onto this page, or{' '}
            <span className="dropzone-link">browse your files</span>
          </p>
          <p className="dropzone-hint">Supports JPG, PNG, GIF, WebP, SVG, AVIF</p>
        </div>
      </div>
    );
  }

  // Secondary drop zone shown as a floating button when gallery has images
  return (
    <>
      <div
        className={`dropzone-overlay ${isDragOver ? 'dropzone-overlay-active' : ''}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        aria-hidden="true"
      >
        <div className="dropzone-overlay-inner">
          <UploadCloud size={40} strokeWidth={1.5} />
          <span>Release to add images</span>
        </div>
      </div>

      <div
        ref={shakeRef}
        className={`dropzone-fab ${isDragOver ? 'dropzone-fab-active' : ''}`}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-label="Add more images"
        title="Add more images"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="dropzone-input"
          onChange={handleFileInput}
          aria-hidden="true"
          tabIndex={-1}
        />
        <UploadCloud size={22} strokeWidth={2} />
        <span>Add Images</span>
      </div>
    </>
  );
}
