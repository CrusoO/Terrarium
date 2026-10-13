import React, { useState } from 'react';
import { testimonials } from '../data/content.js';

function StarRating({ rating }) {
  return (
    <div className="stars" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} className={`star ${star <= rating ? 'star--filled' : 'star--empty'}`}>
          ★
        </span>
      ))}
    </div>
  );
}

export default function Testimonials() {
  const [activeIndex, setActiveIndex] = useState(0);

  const prev = () => setActiveIndex((i) => (i === 0 ? testimonials.length - 1 : i - 1));
  const next = () => setActiveIndex((i) => (i === testimonials.length - 1 ? 0 : i + 1));

  return (
    <section className="section testimonials" id="testimonials">
      <div className="container">
        <div className="section__header">
          <span className="section__eyebrow">Happy Families</span>
          <h2 className="section__title">What Dog Owners Are Saying</h2>
          <p className="section__subtitle">
            Over 500 Portland dogs trust Happy Paws. Here's what their humans have to say.
          </p>
        </div>

        {/* Featured testimonial carousel */}
        <div className="testimonials__featured">
          <button className="testimonials__nav testimonials__nav--prev" onClick={prev} aria-label="Previous testimonial">
            ‹
          </button>
          <div className="testimonials__spotlight">
            <div className="testimonials__quote-mark">"</div>
            <p className="testimonials__quote">{testimonials[activeIndex].quote}</p>
            <div className="testimonials__author">
              <span className="testimonials__avatar">{testimonials[activeIndex].avatar}</span>
              <div className="testimonials__author-info">
                <strong className="testimonials__name">{testimonials[activeIndex].name}</strong>
                <span className="testimonials__meta">
                  {testimonials[activeIndex].dog} · {testimonials[activeIndex].location}
                </span>
                <StarRating rating={testimonials[activeIndex].rating} />
              </div>
            </div>
          </div>
          <button className="testimonials__nav testimonials__nav--next" onClick={next} aria-label="Next testimonial">
            ›
          </button>
        </div>

        {/* Dot indicators */}
        <div className="testimonials__dots">
          {testimonials.map((_, i) => (
            <button
              key={i}
              className={`testimonials__dot ${i === activeIndex ? 'testimonials__dot--active' : ''}`}
              onClick={() => setActiveIndex(i)}
              aria-label={`Go to testimonial ${i + 1}`}
            />
          ))}
        </div>

        {/* All testimonials grid */}
        <div className="testimonials__grid">
          {testimonials.map((t, i) => (
            <div
              key={t.id}
              className={`testimonial-card ${i === activeIndex ? 'testimonial-card--active' : ''}`}
              onClick={() => setActiveIndex(i)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && setActiveIndex(i)}
            >
              <StarRating rating={t.rating} />
              <p className="testimonial-card__quote">"{t.quote.slice(0, 100)}…"</p>
              <div className="testimonial-card__footer">
                <span className="testimonial-card__avatar">{t.avatar}</span>
                <div>
                  <strong className="testimonial-card__name">{t.name}</strong>
                  <span className="testimonial-card__dog">{t.dog}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
