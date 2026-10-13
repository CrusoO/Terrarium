import React, { useState, useRef, useCallback } from 'react';
import { Upload, Camera, X, Image } from 'lucide-react';
import { FIELD_NAMES, ACCEPTED_MIME_TYPES, MAX_FILE_SIZE_MB } from '../../../shared/constants.js';

export default function UploadForm({ onSubmit, loading, disabled }) {
  const [staffName, setStaffName] = useState('');
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [validationError, setValidationError] = useState('');

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const handleFile = useCallback((selectedFile) => {
    setValidationError('');
    if (!selectedFile) return;

    if (!ACCEPTED_MIME_TYPES.includes(selectedFile.type)) {
      setValidationError('Only JPEG, PNG, WebP, and GIF images are accepted.');
      return;
    }
    if (selectedFile.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setValidationError(`File must be under ${MAX_FILE_SIZE_MB} MB.`);
      return;
    }

    setFile(selectedFile);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(selectedFile);
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragOver(false);
      const dropped = e.dataTransfer.files[0];
      if (dropped) handleFile(dropped);
    },
    [handleFile]
  );

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const clearFile = () => {
    setFile(null);
    setPreview(null);
    setValidationError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setValidationError('');

    if (!staffName.trim()) {
      setValidationError('Please enter your name.');
      return;
    }
    if (!file) {
      setValidationError('Please select or capture a receipt photo.');
      return;
    }

    const formData = new FormData();
    formData.append(FIELD_NAMES.STAFF_NAME, staffName.trim());
    formData.append(FIELD_NAMES.NOTES, notes.trim());
    formData.append(FIELD_NAMES.FILE, file);
    onSubmit(formData);
  };

  return (
    <form className="upload-form" onSubmit={handleSubmit} noValidate>
      {/* Staff Name */}
      <div className="form-group">
        <label className="form-label" htmlFor="staffName">
          Your Name <span className="required">*</span>
        </label>
        <input
          id="staffName"
          type="text"
          className="form-input"
          placeholder="e.g. Jordan Smith"
          value={staffName}
          onChange={(e) => setStaffName(e.target.value)}
          disabled={disabled || loading}
          autoComplete="name"
          maxLength={80}
        />
      </div>

      {/* Notes */}
      <div className="form-group">
        <label className="form-label" htmlFor="notes">
          Notes <span className="optional">(optional)</span>
        </label>
        <textarea
          id="notes"
          className="form-textarea"
          placeholder="e.g. Team lunch, client dinner, office supplies…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={disabled || loading}
          rows={3}
          maxLength={500}
        />
        <span className="char-count">{notes.length}/500</span>
      </div>

      {/* Drop Zone */}
      <div className="form-group">
        <label className="form-label">
          Receipt Photo <span className="required">*</span>
        </label>

        {!preview ? (
          <div
            className={`drop-zone ${dragOver ? 'drop-zone--active' : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            role="button"
            tabIndex={0}
            aria-label="Drop receipt image here or click to browse"
            onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
          >
            <Image size={36} className="drop-zone__icon" />
            <p className="drop-zone__primary">Drag &amp; drop your receipt here</p>
            <p className="drop-zone__secondary">or choose an option below</p>
            <div className="drop-zone__actions">
              <button
                type="button"
                className="btn btn--secondary"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled || loading}
              >
                <Upload size={15} />
                Browse Files
              </button>
              <button
                type="button"
                className="btn btn--secondary"
                onClick={() => cameraInputRef.current?.click()}
                disabled={disabled || loading}
              >
                <Camera size={15} />
                Use Camera
              </button>
            </div>
            <p className="drop-zone__hint">
              JPEG, PNG, WebP or GIF · max {MAX_FILE_SIZE_MB} MB
            </p>
          </div>
        ) : (
          <div className="preview-wrap">
            <img src={preview} alt="Receipt preview" className="preview-image" />
            <div className="preview-meta">
              <span className="preview-filename">{file.name}</span>
              <span className="preview-size">
                {(file.size / 1024).toFixed(1)} KB
              </span>
            </div>
            <button
              type="button"
              className="preview-remove"
              onClick={clearFile}
              disabled={disabled || loading}
              aria-label="Remove selected image"
            >
              <X size={16} />
              Remove
            </button>
          </div>
        )}

        {/* Hidden file inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_MIME_TYPES.join(',')}
          style={{ display: 'none' }}
          onChange={(e) => handleFile(e.target.files[0])}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept={ACCEPTED_MIME_TYPES.join(',')}
          capture="environment"
          style={{ display: 'none' }}
          onChange={(e) => handleFile(e.target.files[0])}
        />
      </div>

      {validationError && (
        <p className="form-error" role="alert">
          {validationError}
        </p>
      )}

      <button
        type="submit"
        className="btn btn--primary btn--full"
        disabled={disabled || loading}
      >
        {loading ? (
          <>
            <span className="spinner" aria-hidden="true" />
            Uploading…
          </>
        ) : (
          <>
            <Upload size={16} />
            Submit Receipt
          </>
        )}
      </button>
    </form>
  );
}
