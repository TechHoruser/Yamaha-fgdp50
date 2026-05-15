export interface LoopEngineConfig {
  sampleRate: number
  inputDeviceId?: string
}

interface TrackAudio {
  buffer: AudioBuffer | null
  source: AudioBufferSourceNode | null
  startTime: number // ctx.currentTime when source started, 0 if not playing
  gain: GainNode
  muted: boolean
  volume: number
}

type EngineMode = 'idle' | 'recording' | 'overdubbing' | 'playing'

const BUFFER_SIZE = 2048
const WAVEFORM_BARS = 80

function downsampleWaveform(samples: Float32Array, bars: number): number[] {
  const blockSize = Math.floor(samples.length / bars)
  if (blockSize <= 0) return []
  const out: number[] = []
  for (let i = 0; i < bars; i++) {
    let max = 0
    const start = i * blockSize
    for (let j = 0; j < blockSize; j++) {
      const v = Math.abs(samples[start + j])
      if (v > max) max = v
    }
    out.push(max)
  }
  return out
}

function mergeChunks(chunks: Float32Array[]): Float32Array {
  const total = chunks.reduce((s, c) => s + c.length, 0)
  const merged = new Float32Array(total)
  let offset = 0
  for (const c of chunks) {
    merged.set(c, offset)
    offset += c.length
  }
  return merged
}

export class LoopEngine {
  private context: AudioContext | null = null
  private mediaStream: MediaStream | null = null
  private sourceNode: MediaStreamAudioSourceNode | null = null
  private processor: ScriptProcessorNode | null = null
  private masterGain: GainNode | null = null
  private monitorGain: GainNode | null = null

  private tracks = new Map<number, TrackAudio>()
  private recordingTrack: number | null = null
  private recordingChunks: Float32Array[] = []
  private recordingStartCtxTime = 0
  private recordingMode: 'fresh' | 'overdub' = 'fresh'
  private monitoring = false

  private listeners = new Set<() => void>()

  private notify(): void {
    for (const l of this.listeners) l()
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  async init(config: LoopEngineConfig): Promise<void> {
    const ctx = new AudioContext({ sampleRate: config.sampleRate })
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        deviceId: config.inputDeviceId ? { exact: config.inputDeviceId } : undefined,
        sampleRate: config.sampleRate,
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      },
    })

    this.context = ctx
    this.mediaStream = stream
    this.sourceNode = ctx.createMediaStreamSource(stream)

    this.masterGain = ctx.createGain()
    this.masterGain.gain.value = 1
    this.masterGain.connect(ctx.destination)

    this.monitorGain = ctx.createGain()
    this.monitorGain.gain.value = 0
    this.sourceNode.connect(this.monitorGain)
    this.monitorGain.connect(this.masterGain)

    this.processor = ctx.createScriptProcessor(BUFFER_SIZE, 1, 1)
    this.processor.onaudioprocess = (e) => {
      if (this.recordingTrack === null) return
      const input = e.inputBuffer.getChannelData(0)
      this.recordingChunks.push(new Float32Array(input))
    }
    // Source must reach destination for ScriptProcessor to run.
    this.sourceNode.connect(this.processor)
    const sink = ctx.createGain()
    sink.gain.value = 0
    this.processor.connect(sink)
    sink.connect(ctx.destination)
  }

  private ensureTrack(id: number): TrackAudio {
    let t = this.tracks.get(id)
    if (!t) {
      const gain = this.context!.createGain()
      gain.gain.value = 1
      gain.connect(this.masterGain!)
      t = { buffer: null, source: null, startTime: 0, gain, muted: false, volume: 1 }
      this.tracks.set(id, t)
    }
    return t
  }

  /** Returns true while recording into any track. */
  isRecording(): boolean { return this.recordingTrack !== null }
  recordingTrackId(): number | null { return this.recordingTrack }
  isMonitoring(): boolean { return this.monitoring }
  isPlaying(): boolean {
    for (const [, t] of this.tracks) if (t.source) return true
    return false
  }
  getMode(): EngineMode {
    if (this.recordingMode === 'overdub' && this.recordingTrack !== null) return 'overdubbing'
    if (this.recordingTrack !== null) return 'recording'
    if (this.isPlaying()) return 'playing'
    return 'idle'
  }

  hasLoop(trackId: number): boolean {
    return !!this.tracks.get(trackId)?.buffer
  }

  getWaveform(trackId: number): number[] | null {
    const t = this.tracks.get(trackId)
    if (!t?.buffer) return null
    return downsampleWaveform(t.buffer.getChannelData(0), WAVEFORM_BARS)
  }

  setMonitoring(enabled: boolean): void {
    if (!this.monitorGain) return
    this.monitoring = enabled
    this.monitorGain.gain.value = enabled ? 1 : 0
    this.notify()
  }

  toggleMonitoring(): void { this.setMonitoring(!this.monitoring) }

  setMuted(trackId: number, muted: boolean): void {
    const t = this.ensureTrack(trackId)
    t.muted = muted
    t.gain.gain.value = muted ? 0 : t.volume
    this.notify()
  }

  setVolume(trackId: number, volume: number): void {
    const t = this.ensureTrack(trackId)
    t.volume = Math.max(0, Math.min(1, volume))
    if (!t.muted) t.gain.gain.value = t.volume
  }

  /** Begin recording on the given track. Stops any existing record first. */
  startRecording(trackId: number, mode: 'fresh' | 'overdub' = 'fresh'): void {
    if (!this.context) return
    if (this.recordingTrack !== null) this.stopRecording()
    this.context.resume()
    this.ensureTrack(trackId)
    this.recordingTrack = trackId
    this.recordingChunks = []
    this.recordingStartCtxTime = this.context.currentTime
    this.recordingMode = mode
    this.notify()
  }

  /**
   * Stop recording and commit the captured samples into the track buffer.
   * - fresh mode: creates a brand-new buffer with the captured samples.
   * - overdub mode: mixes captured samples into the existing buffer,
   *   wrapping at the loop boundary so the overdub aligns with playback.
   */
  stopRecording(): void {
    if (this.recordingTrack === null || !this.context) return
    const trackId = this.recordingTrack
    const mode = this.recordingMode
    this.recordingTrack = null
    this.recordingMode = 'fresh'

    const captured = mergeChunks(this.recordingChunks)
    this.recordingChunks = []
    if (captured.length === 0) { this.notify(); return }

    const track = this.ensureTrack(trackId)

    if (mode === 'fresh' || !track.buffer) {
      const buf = this.context.createBuffer(1, captured.length, this.context.sampleRate)
      buf.getChannelData(0).set(captured)
      this.replaceBuffer(trackId, buf, this.isPlaying())
    } else {
      const old = track.buffer.getChannelData(0)
      const newData = new Float32Array(old.length)
      newData.set(old)
      // Align the first captured sample with the loop position at recordingStartCtxTime
      const loopElapsed = (this.recordingStartCtxTime - track.startTime) * this.context.sampleRate
      const startOffset = Math.max(0, Math.floor(loopElapsed)) % old.length
      for (let i = 0; i < captured.length; i++) {
        const idx = (startOffset + i) % old.length
        // Soft-clip to keep mix within [-1, 1]
        const sum = newData[idx] + captured[i]
        newData[idx] = sum > 1 ? 1 : sum < -1 ? -1 : sum
      }
      const buf = this.context.createBuffer(1, newData.length, this.context.sampleRate)
      buf.getChannelData(0).set(newData)
      this.replaceBuffer(trackId, buf, this.isPlaying())
    }
    this.notify()
  }

  private replaceBuffer(trackId: number, buffer: AudioBuffer, resume: boolean): void {
    if (!this.context) return
    const track = this.ensureTrack(trackId)
    if (track.source) {
      try { track.source.stop() } catch { /* already stopped */ }
      track.source.disconnect()
      track.source = null
    }
    track.buffer = buffer
    if (resume) {
      this.startTrackSource(trackId, this.context.currentTime + 0.02)
    }
  }

  private startTrackSource(trackId: number, when: number): void {
    if (!this.context) return
    const track = this.ensureTrack(trackId)
    if (!track.buffer || track.source) return
    const src = this.context.createBufferSource()
    src.buffer = track.buffer
    src.loop = true
    src.connect(track.gain)
    src.start(when)
    track.source = src
    track.startTime = when
  }

  /** Start playback of every track that has a recorded loop. */
  playAll(): void {
    if (!this.context) return
    this.context.resume()
    const when = this.context.currentTime + 0.04
    for (const [id, t] of this.tracks) {
      if (t.buffer && !t.source) this.startTrackSource(id, when)
    }
    this.notify()
  }

  /** Stop playback and any in-progress recording. */
  stopAll(): void {
    if (this.recordingTrack !== null) this.stopRecording()
    for (const [, t] of this.tracks) {
      if (t.source) {
        try { t.source.stop() } catch { /* already stopped */ }
        t.source.disconnect()
        t.source = null
        t.startTime = 0
      }
    }
    this.notify()
  }

  /** Remove the loop from a track (audio + state). */
  clearTrack(trackId: number): void {
    const t = this.tracks.get(trackId)
    if (!t) return
    if (t.source) {
      try { t.source.stop() } catch { /* already stopped */ }
      t.source.disconnect()
      t.source = null
    }
    t.buffer = null
    t.startTime = 0
    t.muted = false
    t.gain.gain.value = t.volume
    this.notify()
  }

  /** Same as clearTrack — undo is a single-level "remove loop" today. */
  undoTrack(trackId: number): void { this.clearTrack(trackId) }

  async destroy(): Promise<void> {
    this.stopAll()
    this.processor?.disconnect()
    this.sourceNode?.disconnect()
    this.monitorGain?.disconnect()
    this.masterGain?.disconnect()
    for (const [, t] of this.tracks) t.gain.disconnect()
    this.tracks.clear()
    this.mediaStream?.getTracks().forEach((t) => t.stop())
    if (this.context && this.context.state !== 'closed') {
      try { await this.context.close() } catch { /* already closed */ }
    }
    this.context = null
    this.sourceNode = null
    this.processor = null
    this.masterGain = null
    this.monitorGain = null
    this.mediaStream = null
  }
}
