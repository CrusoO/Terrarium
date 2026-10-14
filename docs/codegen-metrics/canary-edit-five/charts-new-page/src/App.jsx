import { useState } from 'react'
import AppShell from './components/AppShell.jsx'
import Navbar from './components/Navbar.jsx'
import ListPage from './views/ListPage.jsx'
import DetailPage from './views/DetailPage.jsx'
import FormPage from './views/FormPage.jsx'
import DashboardPage from './views/DashboardPage.jsx'
import ComparePage from './views/ComparePage.jsx'

export default function App() {
  const [route, setRoute] = useState('list')
  const titles = { list: "Build a sales chart page with", detail: "Detail", form: "New", dashboard: "Totals", compare: "Compare" }
  return (
    <AppShell>
      <div className="layout-split theme-harbor">
      <div className="chart-bars" aria-label="chart"><span style={{height: "20px"}} /><span style={{height: "38px"}} /><span style={{height: "56px"}} /><span style={{height: "74px"}} /></div>
      <Navbar title={titles[route] || titles.list} />
      <nav className="route-nav"><button type="button" data-route="list" onClick={() => setRoute('list')}>List</button>
        <button type="button" data-route="detail" onClick={() => setRoute('detail')}>Detail</button>
        <button type="button" data-route="form" onClick={() => setRoute('form')}>New</button>
        <button type="button" data-route="dashboard" onClick={() => setRoute('dashboard')}>Totals</button>
        <button type="button" data-route="compare" onClick={() => setRoute('compare')}>Compare</button></nav>
      { route === 'list' ? (
        <div className="split"><ListPage onOpen={() => setRoute('detail')} /><DetailPage /></div>
      ) : route === 'form' ? (
        <FormPage onDone={() => setRoute('list')} />
      ) : route === 'dashboard' ? (
        <DashboardPage />
      ) : route === 'compare' ? (
        <ComparePage />
      ) : null }
      </div>
    </AppShell>
  )
}
