import { useEffect, useState } from 'react'
import AziendaList from './components/AziendaList'
import AziendaDetail from './components/AziendaDetail'

// Navigazione basata su hash, così il tasto "indietro" del browser/telefono
// funziona come atteso anche in modalità PWA.
function parseHash() {
  const h = window.location.hash.replace(/^#/, '')
  const m = h.match(/^\/azienda\/(.+)$/)
  if (m) return { view: 'azienda', aziendaId: m[1] }
  return { view: 'list' }
}

export default function App() {
  const [route, setRoute] = useState(parseHash)

  useEffect(() => {
    const onHash = () => setRoute(parseHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  function openAzienda(id) {
    window.location.hash = `/azienda/${id}`
  }

  function goHome() {
    window.location.hash = ''
  }

  if (route.view === 'azienda') {
    return (
      <AziendaDetail
        key={route.aziendaId}
        aziendaId={route.aziendaId}
        onBack={goHome}
      />
    )
  }

  return <AziendaList onOpenAzienda={openAzienda} />
}
