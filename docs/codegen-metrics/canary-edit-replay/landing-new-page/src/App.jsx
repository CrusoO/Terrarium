import { useState } from 'react'
import AppShell from './components/AppShell.jsx'
import Navbar from './components/Navbar.jsx'
import ListPage from './views/ListPage.jsx'
import DetailPage from './views/DetailPage.jsx'
import FormPage from './views/FormPage.jsx'
import ArchivePage from './views/ArchivePage.jsx'

export default function App() {
  const [route, setRoute] = useState('list')
  const titles = { list: "Build a landing page for a", detail: "Detail", form: "New", archive: "Archive" }
  return (
    <AppShell>
      <div className="layout-board theme-ink">
      <section className="hero"><p>Landing</p><h2>Build a landing page for a</h2><p>Plans, a short pitch, and a way to leave a name.</p></section>
      <Navbar title={titles[route] || titles.list} />
      <nav className="route-nav"><button type="button" data-route="list" onClick={() => setRoute('list')}>List</button>
        <button type="button" data-route="detail" onClick={() => setRoute('detail')}>Detail</button>
        <button type="button" data-route="form" onClick={() => setRoute('form')}>New</button>
        <button type="button" data-route="archive" onClick={() => setRoute('archive')}>Archive</button></nav>
      { route === 'list' ? (
        <ListPage onOpen={() => setRoute('detail')} />
      ) : route === 'detail' ? (
        <DetailPage />
      ) : route === 'form' ? (
        <FormPage onDone={() => setRoute('list')} />
      ) : route === 'archive' ? (
        <ArchivePage />
      ) : null }
      </div>
    </AppShell>
  )
}
