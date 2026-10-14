import { useState } from 'react'
import AppShell from './components/AppShell.tsx'
import Navbar from './components/Navbar.tsx'
import ListPage from './views/ListPage.tsx'
import DetailPage from './views/DetailPage.tsx'
import FormPage from './views/FormPage.tsx'

export default function App() {
  const [route, setRoute] = useState('list')
  const titles = { list: "Build a greenhouse log. Gardeners search", detail: "Detail", form: "New" }
  return (
    <AppShell>
      <div className="layout-page theme-ledger">
      
      <Navbar title={titles[route] || titles.list} />
      <nav className="route-nav"><button type="button" data-route="list" onClick={() => setRoute('list')}>List</button>
        <button type="button" data-route="detail" onClick={() => setRoute('detail')}>Detail</button>
        <button type="button" data-route="form" onClick={() => setRoute('form')}>New</button></nav>
      { route === 'list' ? (
        <ListPage onOpen={() => setRoute('detail')} />
      ) : route === 'detail' ? (
        <DetailPage />
      ) : route === 'form' ? (
        <FormPage onDone={() => setRoute('list')} />
      ) : null }
      </div>
    </AppShell>
  )
}
