import React from 'react';

export default function Hero() {
  return (
    <section className="hero" id="home">
      {/* Decorative background SVG */}
      <div className="hero-bg" aria-hidden="true">
        <svg viewBox="0 0 1200 600" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
          {/* Warm layered background */}
          <rect width="1200" height="600" fill="#2c1a0e" />
          <ellipse cx="900" cy="150" rx="420" ry="320" fill="#7a3b1e" opacity="0.45" />
          <ellipse cx="200" cy="480" rx="350" ry="260" fill="#c4622d" opacity="0.25" />
          <ellipse cx="600" cy="300" rx="500" ry="200" fill="#e8a87c" opacity="0.08" />

          {/* Stylised plate */}
          <circle cx="600" cy="310" r="170" fill="none" stroke="#e8a87c" strokeWidth="1.5" opacity="0.4" />
          <circle cx="600" cy="310" r="140" fill="#3d2010" opacity="0.7" />

          {/* Food elements */}
          <ellipse cx="600" cy="295" rx="70" ry="50" fill="#c4622d" opacity="0.8" />
          <ellipse cx="580" cy="285" rx="45" ry="32" fill="#e07b3a" opacity="0.9" />
          <ellipse cx="620" cy="300" rx="38" ry="26" fill="#d4541e" opacity="0.85" />

          {/* Herb garnish */}
          <path d="M560 270 Q555 255 565 248 Q570 260 560 270Z" fill="#5a8a3c" opacity="0.9" />
          <path d="M572 265 Q568 250 578 244 Q582 257 572 265Z" fill="#6aa048" opacity="0.9" />
          <path d="M584 262 Q581 247 591 242 Q594 255 584 262Z" fill="#5a8a3c" opacity="0.85" />

          {/* Sauce drizzle */}
          <path d="M540 310 Q560 295 580 315 Q600 330 620 310 Q640 292 660 308"
            fill="none" stroke="#f0c080" strokeWidth="2" opacity="0.5" strokeLinecap="round" />

          {/* Cutlery */}
          <rect x="440" y="220" width="4" height="180" rx="2" fill="#c8b89a" opacity="0.5" />
          <ellipse cx="442" cy="215" rx="10" ry="14" fill="#c8b89a" opacity="0.5" />
          <rect x="756" y="220" width="4" height="180" rx="2" fill="#c8b89a" opacity="0.5" />
          <path d="M754 220 Q750 240 754 260 Q758 240 762 220Z" fill="#c8b89a" opacity="0.5" />

          {/* Ambient light */}
          <radialGradient id="heroLight" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f5d9b0" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#2c1a0e" stopOpacity="0" />
          </radialGradient>
          <rect width="1200" height="600" fill="url(#heroLight)" />
        </svg>
      </div>

      <div className="hero-content">
        <p className="hero-eyebrow">Freelance Food Photography</p>
        <h1 className="hero-name">Clara Voss</h1>
        <p className="hero-tagline">Making every dish irresistible — one frame at a time.</p>
        <p className="hero-bio">
          I'm a Berlin-based food photographer with over eight years of experience shooting
          for restaurants, cookbooks, and food brands. My work blends natural light with
          thoughtful styling to tell the story behind every plate. Whether you're launching
          a new menu or building a brand identity, I'll help your food look as good as it tastes.
        </p>
        <div className="hero-actions">
          <a href="#portfolio" className="btn btn-primary">View Portfolio</a>
          <a href="#quote" className="btn btn-outline">Request a Quote</a>
        </div>
      </div>
    </section>
  );
}
