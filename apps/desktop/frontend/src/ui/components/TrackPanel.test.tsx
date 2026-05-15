import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TrackPanel } from './TrackPanel'

describe('TrackPanel', () => {
  it('renders the track number', () => {
    render(<TrackPanel trackId={2} />)
    expect(screen.getByText('TRACK 2')).toBeInTheDocument()
  })

  it('shows EMPTY when no loop', () => {
    render(<TrackPanel trackId={1} hasLoop={false} />)
    expect(screen.getByText('EMPTY')).toBeInTheDocument()
  })

  it('shows PLAYING when has loop and not muted', () => {
    render(<TrackPanel trackId={1} hasLoop muted={false} />)
    expect(screen.getByText('PLAYING')).toBeInTheDocument()
  })

  it('shows MUTED when muted with loop', () => {
    render(<TrackPanel trackId={1} hasLoop muted />)
    expect(screen.getByText('MUTED')).toBeInTheDocument()
  })

  it('applies reduced opacity when muted', () => {
    const { container } = render(<TrackPanel trackId={1} muted />)
    const div = container.firstChild as HTMLElement
    expect(div.style.opacity).toBe('0.4')
  })

  it('applies green border when active', () => {
    const { container } = render(<TrackPanel trackId={1} active />)
    const div = container.firstChild as HTMLElement
    // jsdom normalises hex colours to rgb(); check for either form
    expect(div.style.border).toMatch(/#4caf50|rgb\(76,\s*175,\s*80\)/)
  })
})
