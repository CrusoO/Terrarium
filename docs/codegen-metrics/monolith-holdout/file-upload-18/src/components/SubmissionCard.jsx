import React from 'react';
import { FileText, User, Clock, BookOpen, Tag } from 'lucide-react';
import { formatFileSize, formatDate } from '../utils/helpers.js';

export default function SubmissionCard({ submission }) {
  const { studentName, period, assignmentTitle, fileName, fileSize, submittedAt } = submission;

  return (
    <article className="sub-card">
      <div className="sub-card-file-icon">
        <FileText size={22} strokeWidth={1.5} />
      </div>

      <div className="sub-card-body">
        <div className="sub-card-top">
          <span className="sub-card-assignment">{assignmentTitle}</span>
          <span className="sub-card-badge">Submitted</span>
        </div>

        <div className="sub-card-meta">
          <span className="sub-card-meta-item">
            <User size={13} strokeWidth={2} />
            {studentName}
          </span>
          <span className="sub-card-meta-item">
            <Tag size={13} strokeWidth={2} />
            {period}
          </span>
          <span className="sub-card-meta-item">
            <BookOpen size={13} strokeWidth={2} />
            {fileName}
            <span className="sub-card-filesize">({formatFileSize(fileSize)})</span>
          </span>
          <span className="sub-card-meta-item">
            <Clock size={13} strokeWidth={2} />
            {formatDate(submittedAt)}
          </span>
        </div>
      </div>
    </article>
  );
}
