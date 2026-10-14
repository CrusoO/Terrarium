import React, { useState } from 'react';
import Hero from './components/Hero.jsx';
import MenuTeaser from './components/MenuTeaser.jsx';
import Footer from './components/Footer.jsx';

function App() {
  const [activeCategory, setActiveCategory] = useState('all');

  const scrollToMenu = () => {
    document.getElementById('menu-teaser').scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="app">
      <Hero onCtaClick={scrollToMenu} />
      <MenuTeaser
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
      />
      <Footer />
    </div>
  );
}

export default App;
