import { createEl } from '../utils'
import { BaseSprite } from 'avrecorder-cliper'

interface IAudioSpriteOpts {
  audioCtx?: AudioContext
}

export class AudioSprite extends BaseSprite {
  #audioEl = createEl('audio') as HTMLAudioElement

  // 音频节点没有可视内容
  readonly visible = false

  constructor (name: string, icon: File | string, source: MediaStream | File, opts: IAudioSpriteOpts = {}) {
    super(name, icon)
    this.initReady = (source instanceof MediaStream
      ? this.#init4MS(source, opts)
      : this.#init4File(source, opts)
    ).then(({ audioEl, audioSource }) => {
      audioEl.loop = true
      this.#audioEl = audioEl

      if (audioSource != null && opts.audioCtx != null) {
        this.audioNode = opts.audioCtx.createGain()
        audioSource.connect(this.audioNode)
      }
    })
  }

  async #init4MS (ms: MediaStream, opts: IAudioSpriteOpts): Promise<{
    audioEl: HTMLAudioElement
    audioSource: AudioNode | null
  }> {
    const audioEl = document.createElement('audio')

    let audioSource = null
    if (opts.audioCtx != null && ms.getAudioTracks().length > 0) {
      audioSource = opts.audioCtx.createMediaStreamSource(ms)
    }

    return { audioEl, audioSource }
  }

  async #init4File (audioFile: File, opts: IAudioSpriteOpts): Promise<{
    audioEl: HTMLAudioElement
    audioSource: AudioNode | null
  }> {
    if (
      !['audio/mpeg', 'audio/ogg', 'audio/wav'].includes(audioFile.type)
    ) throw new Error('Unsupport audio format')
    const audioEl = createEl('audio') as HTMLAudioElement
    audioEl.src = URL.createObjectURL(audioFile)
    await audioEl.play()

    let audioSource = null
    if (opts.audioCtx != null) {
      audioSource = opts.audioCtx.createMediaElementSource(audioEl)
    }

    return { audioEl, audioSource }
  }

  destroy (): void {
    this.#audioEl.remove()
    this.audioNode?.disconnect()
    URL.revokeObjectURL(this.#audioEl.src)
  }
}
