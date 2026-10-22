/**
 * DetailPage.jsx
 * Displays detailed information about a selected lead.
 * @component
 * @returns {JSX.Element} The detail page view
 */

import { useSelectedLead } from '../hooks/useData.js'

/**
 * DetailPage component
 * Shows the full details of a selected lead including id, name, email, plan, and phone.
 * @returns {JSX.Element}
 */
export default function DetailPage() {
  const selectedLead = useSelectedLead()

  if (!selectedLead) {
    return (
      <div className="page">
        <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
          No lead selected
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <div style={{ padding: '2rem' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: '#666' }}>
              ID
            </label>
            <div style={{ padding: '0.75rem', backgroundColor: '#f5f5f5', borderRadius: '0.375rem', fontFamily: 'monospace' }}>
              {selectedLead.id}
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: '#666' }}>
              Name
            </label>
            <div style={{ padding: '0.75rem', backgroundColor: '#f5f5f5', borderRadius: '0.375rem' }}>
              {selectedLead.name}
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: '#666' }}>
              Email
            </label>
            <div style={{ padding: '0.75rem', backgroundColor: '#f5f5f5', borderRadius: '0.375rem' }}>
              {selectedLead.email}
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: '#666' }}>
              Plan
            </label>
            <div style={{ padding: '0.75rem', backgroundColor: '#f5f5f5', borderRadius: '0.375rem' }}>
              {selectedLead.plan}
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: '#666' }}>
              Phone
            </label>
            <div style={{ padding: '0.75rem', backgroundColor: '#f5f5f5', borderRadius: '0.375rem' }}>
              {selectedLead.phone}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
