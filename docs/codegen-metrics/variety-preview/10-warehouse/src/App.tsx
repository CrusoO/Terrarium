import { useState } from 'react'
import AppShell from './components/AppShell.tsx'
import Navbar from './components/Navbar.tsx'
import ListPage from './views/ListPage.tsx'
import DetailPage from './views/DetailPage.tsx'
import FormPage from './views/FormPage.tsx'
import DashboardPage from './views/DashboardPage.tsx'

export default function App() {
  const [route, setRoute] = useState<'list' | 'detail' | 'form' | 'dashboard'>('list')
  const titles: Record<string, string> = { list: "Warehouse board", detail: "Warehouse board", form: "Warehouse board", dashboard: "Warehouse board" }
  return (
    <AppShell>
      <div className="layout-page theme-harbor">
      
      <Navbar title={titles[route] || titles.list} />
      <nav className="route-nav"><button type="button" data-route="list" onClick={() => setRoute('list')}>List</button>
        <button type="button" data-route="detail" onClick={() => setRoute('detail')}>Detail</button>
        <button type="button" data-route="form" onClick={() => setRoute('form')}>New</button>
        <button type="button" data-route="dashboard" onClick={() => setRoute('dashboard')}>Totals</button></nav>
      { route === 'list' ? (
        <ListPage onOpen={() => setRoute('detail')} />
      ) : route === 'detail' ? (
        <DetailPage />
      ) : route === 'form' ? (
        <FormPage onDone={() => setRoute('list')} />
      ) : route === 'dashboard' ? (
        <DashboardPage />
      ) : null }
      </div>
    </AppShell>
  )
}
