import React from 'react'
import { TrackPanel } from './ui/components/TrackPanel'
import { TransportBar } from './ui/components/TransportBar'
import { Metronome } from './ui/components/Metronome'

const App: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', padding: '1rem', gap: '1rem' }}>
      <h1 style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '0.05em' }}>FGDP LOOPER</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', flex: 1 }}>
        {[1, 2, 3, 4].map((id) => (
          <TrackPanel key={id} trackId={id} />
        ))}
      </div>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <TransportBar />
        <Metronome />
      </div>
    </div>
  )
}

export default App
