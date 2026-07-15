import { useEffect, useState } from 'react'
import BuildingList from './components/BuildingList'
import BuildingDetail from './components/BuildingDetail'

// Navigazione basata su hash, così il tasto "indietro" del browser/telefono
// funziona come atteso anche in modalità PWA.
function parseHash() {
  const h = window.location.hash.replace(/^#/, '')
  const m = h.match(/^\/edificio\/(.+)$/)
  if (m) return { view: 'building', buildingId: m[1] }
  return { view: 'list' }
}

export default function App() {
  const [route, setRoute] = useState(parseHash)

  useEffect(() => {
    const onHash = () => setRoute(parseHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  function openBuilding(id) {
    window.location.hash = `/edificio/${id}`
  }

  function goHome() {
    window.location.hash = ''
  }

  if (route.view === 'building') {
    return (
      <BuildingDetail
        key={route.buildingId}
        buildingId={route.buildingId}
        onBack={goHome}
      />
    )
  }

  return <BuildingList onOpenBuilding={openBuilding} />
}
