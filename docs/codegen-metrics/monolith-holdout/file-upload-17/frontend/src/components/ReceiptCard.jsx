import React from 'react';
import { User, Clock, FileText } from 'lucide-react';

export default function ReceiptCard({ receipt, onClick }) {
  const formattedDate = new Date(receipt.uploadedAt).toLocaleDateString(
    undefined,
    { month: 'short', day: 'numeric', year: 'numeric' }
  );
  const formattedTime = new Date(receipt.uploadedAt).toLocaleTimeString(
    undefined,
    { hour: '2-digit', minute: '2-digit' }
  );

  return (
    <button
      className="receipt-card"
      onClick={() => onClick(receipt)}
      aria-label={`View receipt from ${receipt.staffName} on ${formattedDate}`}
    >
      <div className="receipt-card__thumb-wrap">
        <img
          src={`/uploads/${receipt.storedFilename}`}
          alt={`Receipt from ${receipt.staffName}`}
          className="receipt-card__thumb"
          loading="lazy"
        />
        <div className="receipt-card__overlay">
          <span className="receipt-card__view-hint">View full size</span>
        </div>
      </div>

      <div className="receipt-card__body">
        <div className="receipt-card__meta-row">
          <User size={13} className="meta-icon" />
          <span className="receipt-card__name">{receipt.staffName}</span>
        </div>
        <div className="receipt-card__meta-row">
          <Clock size={13} className="meta-icon" />
          <span className="receipt-card__date">
            {formattedDate} · {formattedTime}
          </span>
        </div>
        {receipt.notes && (
          <div className="receipt-card__meta-row receipt-card__notes-row">
            <FileText size={13} className="meta-icon meta-icon--top" />
            <p className="receipt-card__notes">{receipt.notes}</p>
          </div>
        )}
      </div>
    </button>
  );
}
