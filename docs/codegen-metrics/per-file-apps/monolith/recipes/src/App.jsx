import React, { useState } from 'react';
import { initialRecipes, COURSES } from './data/recipes';
import Header from './components/Header';
import RecipeGrid from './components/RecipeGrid';
import RecipeDetail from './components/RecipeDetail';
import AddRecipeModal from './components/AddRecipeModal';
import styles from './App.module.css';

export default function App() {
  const [recipes, setRecipes] = useState(initialRecipes);
  const [search, setSearch] = useState('');
  const [course, setCourse] = useState('All');
  const [selected, setSelected] = useState(null);
  const [showAdd, setShowAdd] = useState(false);

  const filtered = recipes.filter(r => {
    const matchCourse = course === 'All' || r.course === course;
    const matchSearch = r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.description.toLowerCase().includes(search.toLowerCase());
    return matchCourse && matchSearch;
  });

  function handleAdd(recipe) {
    const newRecipe = { ...recipe, id: Date.now() };
    setRecipes(prev => [newRecipe, ...prev]);
    setShowAdd(false);
  }

  return (
    <div className={styles.app}>
      <Header
        search={search}
        onSearch={setSearch}
        onAdd={() => setShowAdd(true)}
      />
      <main className={styles.main}>
        <CourseFilter course={course} onChange={setCourse} />
        <RecipeGrid recipes={filtered} onSelect={setSelected} />
      </main>
      {selected && (
        <RecipeDetail recipe={selected} onClose={() => setSelected(null)} />
      )}
      {showAdd && (
        <AddRecipeModal onAdd={handleAdd} onClose={() => setShowAdd(false)} />
      )}
    </div>
  );
}

function CourseFilter({ course, onChange }) {
  return (
    <div className={styles.filters}>
      {COURSES.map(c => (
        <button
          key={c}
          className={`${styles.filterBtn} ${course === c ? styles.active : ''}`}
          onClick={() => onChange(c)}
        >
          {c}
        </button>
      ))}
    </div>
  );
}
