import React from 'react';
import Hero from './components/Hero.jsx';
import Portfolio from './components/Portfolio.jsx';
import QuoteForm from './components/QuoteForm.jsx';

export default function App() {
  return (
    <div className="page">
      {/* Sticky nav */}
      <nav className="nav">
        <span className="nav-brand">Clara Voss</span>
        <div className="nav-links">
          <a href="#portfolio">Portfolio</a>
          <a href="#quote" className="nav-cta">Get a Quote</a>
        </div>
      </nav>

      <main>
        <Hero />
        <Portfolio />
        <QuoteForm />
      </main>

      <footer className="footer">
        <p>© {new Date().getFullYear()} Clara Voss Photography · All rights reserved</p>
      </footer>
    </div>
  );
}
