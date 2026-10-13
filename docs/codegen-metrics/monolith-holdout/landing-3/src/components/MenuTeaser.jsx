import React from 'react';
import { menuItems, categories } from '../data/bakeryData.js';
import MenuCard from './MenuCard.jsx';

function MenuTeaser({ activeCategory, onCategoryChange }) {
  const filtered =
    activeCategory === 'all'
      ? menuItems
      : menuItems.filter((item) => item.category === activeCategory);

  return (
    <section id="menu-teaser" className="menu-teaser" aria-label="Featured Menu">
      <div className="section-inner">
        <div className="section-header">
          <p className="section-eyebrow">Fresh From the Oven</p>
          <h2 className="section-title">A Taste of What's Inside</h2>
          <p className="section-subtitle">
            Every item is made by hand each morning using time-honored recipes and the finest local ingredients.
          </p>
        </div>

        {/* Category filter tabs */}
        <div className="category-tabs" role="tablist" aria-label="Menu categories">
          {categories.map((cat) => (
            <button
              key={cat.key}
              role="tab"
              aria-selected={activeCategory === cat.key}
              className={`category-tab${activeCategory === cat.key ? ' category-tab--active' : ''}`}
              onClick={() => onCategoryChange(cat.key)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Menu grid */}
        <div className="menu-grid" role="tabpanel">
          {filtered.map((item) => (
            <MenuCard key={item.id} item={item} />
          ))}
        </div>

        <div className="menu-teaser__cta">
          <p className="menu-teaser__cta-text">Hungry for more? Our full menu changes with the seasons.</p>
          <button
            className="btn btn--primary btn--lg"
            onClick={() => alert('Full menu coming soon — stop by the bakery to see today\'s specials!')}
          >
            View Full Menu
          </button>
        </div>
      </div>
    </section>
  );
}

export default MenuTeaser;
