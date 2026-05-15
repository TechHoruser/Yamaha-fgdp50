import type { StreamDeckCommand } from './commands'

export class StreamDeckController {
  private readonly baseUrl: string

  constructor(baseUrl: string = 'http://localhost:9001') {
    this.baseUrl = baseUrl
  }

  async send(cmd: StreamDeckCommand): Promise<void> {
    await fetch(`${this.baseUrl}/command`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cmd),
    })
  }
}
