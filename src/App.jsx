import { useEffect, useState } from 'react'
import AziendaList from './components/AziendaList'
import AziendaDetail from './components/AziendaDetail'
import CloudScreen from './components/CloudScreen'
import { CloudProvider } from './cloud/CloudProvider'

// Navigazione basata su hash, così il tasto "indietro" del browser/telefono
// funziona come atteso anche in modalità PWA.
function parseHash() {
  const h = window.location.hash.replace(/^#/, '')
  const az = h.match(/^\/azienda\/(.+)$/)
  if (az) return { view: 'azienda', aziendaId: az[1] }
  if (h === '/cloud') return { view: 'cloud' }
  return { view: 'list' }
}

export default function App() {
  const [route, setRoute] = useState(parseHash)

  useEffect(() => {
    const onHash = () => setRoute(parseHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const openAzienda = (id) => {
    window.location.hash = `/azienda/${id}`
  }
  const openCloud = () => {
    window.location.hash = '/cloud'
  }
  const goHome = () => {
    window.location.hash = ''
  }

  let screen
  if (route.view === 'azienda') {
    screen = (
      <AziendaDetail
        key={route.aziendaId}
        aziendaId={route.aziendaId}
        onBack={goHome}
      />
    )
  } else if (route.view === 'cloud') {
    screen = <CloudScreen onBack={goHome} />
  } else {
    screen = (
      <AziendaList onOpenAzienda={openAzienda} onOpenCloud={openCloud} />
    )
  }

  return <CloudProvider>{screen}</CloudProvider>
}
