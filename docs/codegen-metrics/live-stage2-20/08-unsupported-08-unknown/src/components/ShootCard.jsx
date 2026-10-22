import React from 'react';

export default function ShootCard({ shoot, isActive, onSelect }) {
  return (
    <article
      className={`shoot-card ${isActive ? 'shoot-card--active' : ''}`}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      aria-pressed={isActive}
      aria-label={`View details for ${shoot.title}`}
      onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onSelect()}
    >
      {/* Placeholder image rendered as SVG */}
      <div className="card-image" aria-hidden="true">
        <svg
          viewBox="0 0 480 320"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid slice"
          width="100%"
          height="100%"
        >
          <rect width="480" height="320" fill={shoot.palette.bg} />
          {shoot.svgScene}
          {/* Vignette overlay */}
          <radialGradient id={`vignette-${shoot.id}`} cx="50%" cy="50%" r="70%">
            <stop offset="60%" stopColor="transparent" />
            <stop offset="100%" stopColor={shoot.palette.bg} stopOpacity="0.6" />
          </radialGradient>
          <rect width="480" height="320" fill={`url(#vignette-${shoot.id})`} />
        </svg>
        <div className="card-category">{shoot.category}</div>
      </div>

      <div className="card-body">
        <h3 className="card-title">{shoot.title}</h3>
        <p className="card-description">{shoot.description}</p>
        <span className="card-cta">
          {isActive ? 'Close ↑' : 'See details →'}
        </span>
      </div>
    </article>
  );
}
