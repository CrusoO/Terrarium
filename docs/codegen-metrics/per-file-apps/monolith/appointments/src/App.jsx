import React, { useState } from 'react'
import AppShell from './components/AppShell'
import ListView from './views/ListView'
import DetailView from './views/DetailView'
import CreateModal from './components/CreateModal'

export default function App() {
  const [selectedId, setSelectedId] = useState(null)
  const [showCreate, setShowCreate] = useState(false)

  return (
    <AppShell onNew={() => setShowCreate(true)}>
      {selectedId ? (
        <DetailView id={selectedId} onBack={() => setSelectedId(null)} />
      ) : (
        <ListView onSelect={setSelectedId} onNew={() => setShowCreate(true)} />
      )}
      {showCreate && (
        <CreateModal
          onClose={() => setShowCreate(false)}
          onCreated={id => { setShowCreate(false); setSelectedId(id) }}
        />
      )}
    </AppShell>
  )
}
