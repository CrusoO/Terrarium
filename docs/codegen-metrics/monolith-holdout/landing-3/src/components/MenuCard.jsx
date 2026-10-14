import React, { useState } from 'react';

function MenuCard({ item }) {
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  return (
    <article className="menu-card" aria-label={item.name}>
      {/* Emoji illustration */}
      <div className="menu-card__visual" aria-hidden="true">
        <span className="menu-card__emoji">{item.emoji}</span>
        {item.badge && (
          <span className="menu-card__badge">{item.badge}</span>
        )}
      </div>

      <div className="menu-card__body">
        <div className="menu-card__meta">
          <span className="menu-card__category">{item.category}</span>
          <span className="menu-card__price">${item.price.toFixed(2)}</span>
        </div>
        <h3 className="menu-card__name">{item.name}</h3>
        <p className="menu-card__desc">{item.description}</p>
      </div>

      <div className="menu-card__footer">
        <button
          className={`btn btn--sm menu-card__btn${added ? ' menu-card__btn--added' : ''}`}
          onClick={handleAdd}
          aria-label={added ? `${item.name} added` : `Add ${item.name} to order`}
        >
          {added ? '✓ Added!' : '+ Add to Order'}
        </button>
      </div>
    </article>
  );
}

export default MenuCard;
