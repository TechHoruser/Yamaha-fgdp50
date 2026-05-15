import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TrackPanel } from './TrackPanel'

describe('TrackPanel', () => {
  it('renders the track number in zero-padded format', () => {
    render(<TrackPanel trackId={2} trackName="Pista 2" />)
    expect(screen.getByText('02')).toBeInTheDocument()
  })

  it('renders the track name', () => {
    render(<TrackPanel trackId={1} trackName="Línea de Bajo" />)
    expect(screen.getByDisplayValue('Línea de Bajo')).toBeInTheDocument()
  })

  it('shows idle message when no loop and not recording', () => {
    render(<TrackPanel trackId={1} trackName="Pista 1" hasLoop={false} />)
    expect(screen.getByTestId('idle-status')).toBeInTheDocument()
  })

  it('shows waveform bars when has loop', () => {
    render(<TrackPanel trackId={1} trackName="Pista 1" hasLoop />)
    expect(screen.getByTestId('waveform-bars')).toBeInTheDocument()
  })

  it('shows recording status when recording and no loop', () => {
    render(<TrackPanel trackId={1} trackName="Pista 1" recording hasLoop={false} />)
    expect(screen.getByTestId('recording-status')).toBeInTheDocument()
  })

  it('applies reduced opacity when muted', () => {
    const { getByTestId } = render(<TrackPanel trackId={1} trackName="Pista 1" muted />)
    const row = getByTestId('track-row-1')
    expect(row.style.opacity).toBe('0.45')
  })

  it('calls onMute when M button is clicked', () => {
    const onMute = vi.fn()
    render(<TrackPanel trackId={1} trackName="Pista 1" onMute={onMute} />)
    fireEvent.click(screen.getByRole('button', { name: 'Mute' }))
    expect(onMute).toHaveBeenCalledTimes(1)
  })

  it('calls onSelect when row is clicked', () => {
    const onSelect = vi.fn()
    render(<TrackPanel trackId={1} trackName="Pista 1" onSelect={onSelect} />)
    fireEvent.click(screen.getByTestId('track-row-1'))
    expect(onSelect).toHaveBeenCalledTimes(1)
  })

  it('applies active background when active', () => {
    const { getByTestId } = render(<TrackPanel trackId={1} trackName="Pista 1" active />)
    const row = getByTestId('track-row-1')
    expect(row.style.background).toBe('rgb(20, 30, 46)')
  })
})
