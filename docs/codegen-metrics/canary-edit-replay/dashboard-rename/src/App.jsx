import { useState } from 'react'
import AppShell from './components/AppShell.jsx'
import Navbar from './components/Navbar.jsx'
import ListPage from './views/ListPage.jsx'
import DetailPage from './views/DetailPage.jsx'
import FormPage from './views/FormPage.jsx'
import DashboardPage from './views/DashboardPage.jsx'

export default function App() {
  const [route, setRoute] = useState('list')
  const titles = { list: "Operations", detail: "Detail", form: "New", dashboard: "Totals" }
  return (
    <AppShell>
      <div className="layout-board theme-ink">
      
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
