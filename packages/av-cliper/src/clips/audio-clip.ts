import {
  concatPCMFragments,
  extractPCM4AudioBuffer,
  ringSliceFloat32Array
} from '../av-utils'
import { Log } from '../log'
import { DEFAULT_AUDIO_SAMPLE_RATE, IClip } from './iclip'

interface IAudioClipOpts {
  loop?: boolean
  volume?: number
}

export class AudioClip implements IClip {
  static ctx: AudioContext | null = null

  ready: IClip['ready']

  #meta = {
    // 微秒
    duration: 0,
    width: 0,
    height: 0
  }

  #chan0Buf = new Float32Array()
  #chan1Buf = new Float32Array()
  getPCMData (): Float32Array[] {
    return [this.#chan0Buf, this.#chan1Buf]
  }

  // 微秒
  #ts = 0

  #frameOffset = 0

  #opts

  constructor (
    dataSource: ReadableStream<Uint8Array> | Float32Array[],
    opts: IAudioClipOpts = {}
  ) {
    this.#opts = {
      loop: false,
      volume: 1,
      ...opts
    }

    this.ready = this.#init(dataSource).then(() => ({
      // audio 没有宽高，无需绘制
      width: 0,
      height: 0,
      duration: opts.loop ? Infinity : this.#meta.duration
    }))
  }

  async #init (
    dataSource: ReadableStream<Uint8Array> | Float32Array[]
  ): Promise<void> {
    if (AudioClip.ctx == null) {
      AudioClip.ctx = new AudioContext({
        sampleRate: DEFAULT_AUDIO_SAMPLE_RATE
      })
    }

    const tStart = performance.now()
    const pcm =
      dataSource instanceof ReadableStream
        ? await parseStream2PCM(dataSource, AudioClip.ctx)
        : dataSource

    Log.info('Audio clip decoded complete:', performance.now() - tStart)

    const volume = this.#opts.volume
    if (volume !== 1) {
      for (const chan of pcm)
        for (let i = 0; i < chan.length; i += 1) chan[i] *= volume
    }

    this.#meta.duration = (pcm[0].length / DEFAULT_AUDIO_SAMPLE_RATE) * 1e6

    this.#chan0Buf = pcm[0]
    // 单声道 转 立体声
    this.#chan1Buf = pcm[1] ?? this.#chan0Buf

    Log.info(
      'Audio clip convert to AudioData, time:',
      performance.now() - tStart
    )
  }

  async tick (time: number): Promise<{
    audio: Float32Array[]
    state: 'success' | 'done'
  }> {
    if (time < this.#ts) throw Error('time not allow rollback')
    if (!this.#opts.loop && time >= this.#meta.duration) {
      // 待观察：如果time跨度较大，返回done，理论上会丢失一些音频帧
      return { audio: [], state: 'done' }
    }

    const deltaTime = time - this.#ts
    this.#ts = time

    const frameCnt = Math.ceil(deltaTime * (DEFAULT_AUDIO_SAMPLE_RATE / 1e6))
    const endIdx = this.#frameOffset + frameCnt
    const audio = this.#opts.loop
      ? [
          ringSliceFloat32Array(this.#chan0Buf, this.#frameOffset, endIdx),
          ringSliceFloat32Array(this.#chan1Buf, this.#frameOffset, endIdx)
        ]
      : [
          this.#chan0Buf.slice(this.#frameOffset, endIdx),
          this.#chan1Buf.slice(this.#frameOffset, endIdx)
        ]
    this.#frameOffset = endIdx

    return { audio, state: 'success' }
  }

  destroy (): void {
    this.#chan0Buf = new Float32Array(0)
    this.#chan1Buf = new Float32Array(0)
    Log.info('---- audioclip destroy ----')
  }
}

export async function concatAudioClip (
  clips: AudioClip[],
  opts?: IAudioClipOpts
) {
  const bufs: Float32Array[][] = []
  for (const clip of clips) {
    await clip.ready
    bufs.push(clip.getPCMData())
  }
  return new AudioClip(concatPCMFragments(bufs), opts)
}

async function parseStream2PCM (
  stream: ReadableStream<Uint8Array>,
  ctx: AudioContext | OfflineAudioContext
): Promise<Float32Array[]> {
  const buf = await new Response(stream).arrayBuffer()
  return extractPCM4AudioBuffer(await ctx.decodeAudioData(buf))
}
