import { useState, useEffect } from 'react';

const STORAGE_KEY = 'homework_dropbox_submissions';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

// Seed data so the log is populated on first load
const SEED_SUBMISSIONS = [
  {
    id: 'seed-1',
    studentName: 'Alice Johnson',
    period: 'Period 2',
    assignmentTitle: 'Chapter 4 Math Homework',
    fileName: 'alice_math_ch4.pdf',
    fileSize: 245760,
    submittedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 min ago
  },
  {
    id: 'seed-2',
    studentName: 'Bob Martinez',
    period: 'Period 5',
    assignmentTitle: 'Persuasive Essay Draft',
    fileName: 'bob_essay_draft_v2.docx',
    fileSize: 89088,
    submittedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 min ago
  },
  {
    id: 'seed-3',
    studentName: 'Carol Lee',
    period: 'Period 3',
    assignmentTitle: 'Biology Lab Report',
    fileName: 'carol_lab_report_photosynthesis.pdf',
    fileSize: 512000,
    submittedAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(), // 10 min ago
  },
];

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore parse errors
  }
  return SEED_SUBMISSIONS;
}

function saveToStorage(submissions) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(submissions));
  } catch {
    // ignore storage errors (e.g. private browsing quota)
  }
}

export default function useSubmissions() {
  const [submissions, setSubmissions] = useState(() => loadFromStorage());

  useEffect(() => {
    saveToStorage(submissions);
  }, [submissions]);

  function addSubmission({ studentName, period, assignmentTitle, file }) {
    const newSub = {
      id: `sub-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      studentName,
      period,
      assignmentTitle,
      fileName: file.name,
      fileSize: file.size,
      submittedAt: new Date().toISOString(),
    };
    setSubmissions(prev => [newSub, ...prev]);
    return newSub;
  }

  function clearAll() {
    setSubmissions([]);
  }

  return { submissions, addSubmission, clearAll };
}
