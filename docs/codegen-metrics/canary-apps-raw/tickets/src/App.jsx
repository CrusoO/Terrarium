import { useState } from 'react'
import AppShell from './components/AppShell.jsx'
import Navbar from './components/Navbar.jsx'
import ListPage from './views/ListPage.jsx'
import DetailPage from './views/DetailPage.jsx'
import FormPage from './views/FormPage.jsx'

export default function App() {
  const [route, setRoute] = useState('list')
  const titles = { list: "Tickets", detail: "Detail", form: "New" }
  return (
    <AppShell>
      <div className="layout-split theme-harbor">
      <Navbar title={titles[route] || titles.list} />
      <nav className="route-nav"><button type="button" data-route="list" onClick={() => setRoute('list')}>List</button>
        <button type="button" data-route="detail" onClick={() => setRoute('detail')}>Detail</button>
        <button type="button" data-route="form" onClick={() => setRoute('form')}>New</button></nav>
      { route === 'list' ? (
        <div className="split"><ListPage onOpen={() => setRoute('detail')} /><DetailPage /></div>
      ) : route === 'form' ? (
        <FormPage onDone={() => setRoute('list')} />
      ) : null }
      </div>
    </AppShell>
  )
}
