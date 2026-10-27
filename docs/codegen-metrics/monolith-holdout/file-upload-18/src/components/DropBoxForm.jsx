import React, { useState, useRef } from 'react';
import { Upload, X, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { validateForm, formatFileSize } from '../utils/helpers.js';

const PERIODS = ['Period 1', 'Period 2', 'Period 3', 'Period 4', 'Period 5', 'Period 6', 'Period 7', 'Period 8'];

const INITIAL_FORM = {
  studentName: '',
  period: '',
  assignmentTitle: '',
  selectedFile: null,
};

export default function DropBoxForm({ onSubmit, lastSubmission, onDismissConfirmation }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  }

  function handleFileSelect(file) {
    if (!file) return;
    setForm(prev => ({ ...prev, selectedFile: file }));
    if (errors.selectedFile) setErrors(prev => ({ ...prev, selectedFile: '' }));
  }

  function handleFileInputChange(e) {
    handleFileSelect(e.target.files[0] || null);
  }

  function handleDrop(e) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }

  function handleDragOver(e) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave() {
    setIsDragging(false);
  }

  function handleRemoveFile() {
    setForm(prev => ({ ...prev, selectedFile: null }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleSubmit(e) {
    e.preventDefault();
    const validationErrors = validateForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    onSubmit({
      studentName: form.studentName.trim(),
      period: form.period,
      assignmentTitle: form.assignmentTitle.trim(),
      file: form.selectedFile,
    });
    setForm(INITIAL_FORM);
    setErrors({});
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  return (
    <section className="form-section">
      <div className="form-section-header">
        <h2 className="form-section-title">Submit Your Assignment</h2>
        <p className="form-section-desc">Fill in your details and attach your completed assignment file.</p>
      </div>

      {/* Success Banner */}
      {lastSubmission && (
        <div className="success-banner" role="alert">
          <div className="success-banner-icon">
            <CheckCircle size={20} strokeWidth={2} />
          </div>
          <div className="success-banner-body">
            <strong>Assignment submitted successfully!</strong>
            <span>
              &ldquo;{lastSubmission.assignmentTitle}&rdquo; &mdash; {lastSubmission.fileName} ({formatFileSize(lastSubmission.fileSize)}) submitted at {new Date(lastSubmission.submittedAt).toLocaleTimeString()}
            </span>
          </div>
          <button
            className="success-banner-close"
            onClick={onDismissConfirmation}
            aria-label="Dismiss confirmation"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <form className="drop-form" onSubmit={handleSubmit} noValidate>
        <div className="form-row">
          {/* Student Name */}
          <div className="form-group">
            <label className="form-label" htmlFor="studentName">
              Student Name <span className="required">*</span>
            </label>
            <input
              id="studentName"
              name="studentName"
              type="text"
              className={`form-input ${errors.studentName ? 'form-input--error' : ''}`}
              placeholder="e.g. Jane Smith"
              value={form.studentName}
              onChange={handleChange}
              autoComplete="name"
            />
            {errors.studentName && (
              <span className="form-error">
                <AlertCircle size={13} /> {errors.studentName}
              </span>
            )}
          </div>

          {/* Period */}
          <div className="form-group">
            <label className="form-label" htmlFor="period">
              Class / Period <span className="required">*</span>
            </label>
            <select
              id="period"
              name="period"
              className={`form-input form-select ${errors.period ? 'form-input--error' : ''}`}
              value={form.period}
              onChange={handleChange}
            >
              <option value="">Select a period…</option>
              {PERIODS.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            {errors.period && (
              <span className="form-error">
                <AlertCircle size={13} /> {errors.period}
              </span>
            )}
          </div>
        </div>

        {/* Assignment Title */}
        <div className="form-group">
          <label className="form-label" htmlFor="assignmentTitle">
            Assignment Title <span className="required">*</span>
          </label>
          <input
            id="assignmentTitle"
            name="assignmentTitle"
            type="text"
            className={`form-input ${errors.assignmentTitle ? 'form-input--error' : ''}`}
            placeholder="e.g. Chapter 5 Reading Response"
            value={form.assignmentTitle}
            onChange={handleChange}
          />
          {errors.assignmentTitle && (
            <span className="form-error">
              <AlertCircle size={13} /> {errors.assignmentTitle}
            </span>
          )}
        </div>

        {/* File Drop Zone */}
        <div className="form-group">
          <label className="form-label">
            Attachment <span className="required">*</span>
          </label>
          {form.selectedFile ? (
            <div className="file-selected">
              <div className="file-selected-icon">
                <FileText size={20} strokeWidth={1.5} />
              </div>
              <div className="file-selected-info">
                <span className="file-selected-name">{form.selectedFile.name}</span>
                <span className="file-selected-size">{formatFileSize(form.selectedFile.size)}</span>
              </div>
              <button
                type="button"
                className="file-selected-remove"
                onClick={handleRemoveFile}
                aria-label="Remove selected file"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <div
              className={`file-dropzone ${isDragging ? 'file-dropzone--active' : ''} ${errors.selectedFile ? 'file-dropzone--error' : ''}`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && fileInputRef.current?.click()}
              aria-label="File upload area. Click or drag and drop a file here."
            >
              <Upload size={28} strokeWidth={1.5} className="dropzone-icon" />
              <p className="dropzone-primary">Drag &amp; drop your file here</p>
              <p className="dropzone-secondary">or <span className="dropzone-link">click to browse</span> &mdash; max 10 MB</p>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            className="file-input-hidden"
            onChange={handleFileInputChange}
            aria-hidden="true"
            tabIndex={-1}
          />
          {errors.selectedFile && (
            <span className="form-error">
              <AlertCircle size={13} /> {errors.selectedFile}
            </span>
          )}
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-submit">
            <Upload size={16} strokeWidth={2} />
            Submit Assignment
          </button>
        </div>
      </form>
    </section>
  );
}
