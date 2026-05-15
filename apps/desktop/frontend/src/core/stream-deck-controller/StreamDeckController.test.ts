import { describe, it, expect, vi, beforeEach } from 'vitest'
import { StreamDeckController } from './StreamDeckController'
import { StreamDeckAction } from './commands'

describe('StreamDeckController', () => {
  const mockFetch = vi.fn()

  beforeEach(() => {
    mockFetch.mockClear()
    vi.stubGlobal('fetch', mockFetch)
    mockFetch.mockResolvedValue({ ok: true } as Response)
  })

  it('sends POST to /command with JSON body', async () => {
    const c = new StreamDeckController('http://localhost:9001')
    await c.send({ action: StreamDeckAction.Record })

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:9001/command',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: StreamDeckAction.Record }),
      }),
    )
  })

  it('defaults to localhost:9001', async () => {
    const c = new StreamDeckController()
    await c.send({ action: StreamDeckAction.Stop })
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:9001/command',
      expect.anything(),
    )
  })

  it('includes payload when provided', async () => {
    const c = new StreamDeckController()
    await c.send({ action: StreamDeckAction.SelectTrack1, payload: { track: 1 } })
    const body = JSON.parse((mockFetch.mock.calls[0][1] as RequestInit).body as string)
    expect(body.payload).toEqual({ track: 1 })
  })
})
