import React, { useState } from 'react';
import { Trash2, Images } from 'lucide-react';

export default function Toolbar({ count, onClearAll }) {
  const [confirming, setConfirming] = useState(false);

  const handleClearClick = () => {
    if (confirming) {
      onClearAll();
      setConfirming(false);
    } else {
      setConfirming(true);
      // Auto-cancel confirmation after 3 seconds
      setTimeout(() => setConfirming(false), 3000);
    }
  };

  const handleCancel = () => setConfirming(false);

  return (
    <div className="toolbar" role="toolbar" aria-label="Gallery controls">
      <div className="toolbar-count">
        <Images size={16} strokeWidth={2} aria-hidden="true" />
        <span>
          {count} {count === 1 ? 'image' : 'images'}
        </span>
      </div>

      <div className="toolbar-actions">
        {confirming && (
          <button
            className="toolbar-btn toolbar-btn-ghost"
            onClick={handleCancel}
            aria-label="Cancel clear all"
          >
            Cancel
          </button>
        )}
        <button
          className={`toolbar-btn ${confirming ? 'toolbar-btn-danger' : 'toolbar-btn-secondary'}`}
          onClick={handleClearClick}
          aria-label={confirming ? 'Confirm clear all images' : 'Clear all images'}
        >
          <Trash2 size={15} strokeWidth={2} aria-hidden="true" />
          {confirming ? 'Confirm clear' : 'Clear all'}
        </button>
      </div>
    </div>
  );
}
