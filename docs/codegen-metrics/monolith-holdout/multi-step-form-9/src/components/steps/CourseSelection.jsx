import React, { useState } from 'react';
import courses from '../../data/courses.js';
import { validateCourseSelection, isValid } from '../../utils/helpers.js';
import NavButtons from '../NavButtons.jsx';

const LEVEL_COLORS = {
  Beginner: '#16a34a',
  Intermediate: '#d97706',
  Advanced: '#dc2626',
  'All Levels': '#7c3aed',
};

export default function CourseSelection({ selectedCourse, onNext, onBack }) {
  const [selected, setSelected] = useState(selectedCourse ? selectedCourse.id : null);
  const [errors, setErrors] = useState({});

  const handleSelect = (course) => {
    setSelected(course.id);
    if (errors.course) setErrors({});
  };

  const handleNext = () => {
    const course = courses.find((c) => c.id === selected) || null;
    const errs = validateCourseSelection(course);
    if (!isValid(errs)) {
      setErrors(errs);
      return;
    }
    onNext(course);
  };

  return (
    <div className="step-container">
      <div className="step-header">
        <h2 className="step-title">Select a Course</h2>
        <p className="step-subtitle">Choose the course you'd like to register for. All prices include materials.</p>
      </div>

      {errors.course && (
        <div className="alert alert-error" role="alert">{errors.course}</div>
      )}

      <div className="course-grid">
        {courses.map((course) => {
          const isSelected = selected === course.id;
          return (
            <button
              key={course.id}
              type="button"
              className={`course-card ${isSelected ? 'selected' : ''}`}
              onClick={() => handleSelect(course)}
              aria-pressed={isSelected}
            >
              <div className="course-card-top">
                <div className="course-title-row">
                  <h3 className="course-name">{course.title}</h3>
                  <span
                    className="course-level-badge"
                    style={{ color: LEVEL_COLORS[course.level] || '#555', borderColor: LEVEL_COLORS[course.level] || '#555' }}
                  >
                    {course.level}
                  </span>
                </div>
                <p className="course-description">{course.description}</p>
              </div>
              <div className="course-card-meta">
                <div className="course-meta-row">
                  <span className="meta-item">📅 {course.date}</span>
                  <span className="meta-item">🕐 {course.time}</span>
                </div>
                <div className="course-meta-row">
                  <span className="meta-item">👤 {course.instructor}</span>
                  <span className="meta-item">📍 {course.location}</span>
                </div>
                <div className="course-footer">
                  <span className="course-seats">
                    {course.seats} seat{course.seats !== 1 ? 's' : ''} left
                  </span>
                  <span className="course-price">${course.price}</span>
                </div>
              </div>
              {isSelected && (
                <div className="course-selected-indicator" aria-hidden="true">✓ Selected</div>
              )}
            </button>
          );
        })}
      </div>

      <NavButtons step={2} onBack={onBack} onNext={handleNext} isLastStep={false} />
    </div>
  );
}
