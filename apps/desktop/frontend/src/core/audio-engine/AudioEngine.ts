export interface AudioEngineConfig {
  sampleRate: number
  bufferSize: number
  inputDeviceId?: string
}

export class AudioEngine {
  private context: AudioContext | null = null
  private sourceNode: MediaStreamAudioSourceNode | null = null
  private readonly config: AudioEngineConfig

  constructor(config: AudioEngineConfig) {
    this.config = config
  }

  async init(): Promise<void> {
    this.context = new AudioContext({ sampleRate: this.config.sampleRate })
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        deviceId: this.config.inputDeviceId ? { exact: this.config.inputDeviceId } : undefined,
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      },
    })
    this.sourceNode = this.context.createMediaStreamSource(stream)
  }

  getContext(): AudioContext | null {
    return this.context
  }

  getSourceNode(): MediaStreamAudioSourceNode | null {
    return this.sourceNode
  }

  async destroy(): Promise<void> {
    this.sourceNode?.disconnect()
    await this.context?.close()
    this.context = null
    this.sourceNode = null
  }
}
