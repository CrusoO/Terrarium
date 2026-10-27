import React from 'react';
import { useSelectedRecipe } from '../hooks/useData.ts';
import AppShell from '../components/AppShell';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/StatusBadge';

export default function DetailPage() {
  const recipe = useSelectedRecipe();

  return (
    <AppShell>
      <Navbar title="Recipe Details" />
      <div className="page">
        {recipe ? (
          <div className="entity-card">
            <div>
              <h2>{recipe.name}</h2>
              <p>
                <strong>ID:</strong> {recipe.id}
              </p>
              <p>
                <strong>Course:</strong> <StatusBadge status={recipe.course} />
              </p>
              <p>
                <strong>Minutes:</strong> {recipe.minutes}
              </p>
              <p>
                <strong>Serves:</strong> {recipe.serves}
              </p>
            </div>
          </div>
        ) : (
          <div className="page">
            <p>No recipe selected.</p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
