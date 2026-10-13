import { useSelectedRecipe, useRecipeActions } from '../hooks/useData.js'
import StatusBadge from '../components/StatusBadge.jsx'

/**
 * DetailPage component
 * Displays the details of a selected recipe
 * @returns {JSX.Element}
 */
export default function DetailPage() {
  const recipe = useSelectedRecipe()
  const { select } = useRecipeActions()

  if (!recipe) {
    return (
      
        
        <div className="page">
          <p>No recipe selected</p>
        </div>
      
    )
  }

  return (
    
      
      <div className="page">
        <div className="entity-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
            <div>
              <h2>{recipe.name}</h2>
              <StatusBadge status={recipe.course} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <p style={{ margin: '0.5rem 0', color: '#666', fontSize: '0.875rem' }}>Course</p>
              <p style={{ margin: '0', fontSize: '1rem', fontWeight: '500' }}>{recipe.course}</p>
            </div>
            <div>
              <p style={{ margin: '0.5rem 0', color: '#666', fontSize: '0.875rem' }}>Time</p>
              <p style={{ margin: '0', fontSize: '1rem', fontWeight: '500' }}>{recipe.minutes} minutes</p>
            </div>
            <div>
              <p style={{ margin: '0.5rem 0', color: '#666', fontSize: '0.875rem' }}>Serves</p>
              <p style={{ margin: '0', fontSize: '1rem', fontWeight: '500' }}>{recipe.serves} people</p>
            </div>
            <div>
              <p style={{ margin: '0.5rem 0', color: '#666', fontSize: '0.875rem' }}>ID</p>
              <p style={{ margin: '0', fontSize: '1rem', fontWeight: '500' }}>{recipe.id}</p>
            </div>
          </div>
        </div>
      </div>
    
  )
}
