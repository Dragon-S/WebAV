import { createEl } from '../utils'
import { BaseSprite } from 'avrecorder-cliper'

interface IShareSpriteOpts {
  audioCtx?: AudioContext
}

export class ShareSprite extends BaseSprite {
  #videoEl: HTMLVideoElement | null = null

  constructor (name: string, icon: File | string, source: MediaStream | File, opts: IShareSpriteOpts = {}) {
    super(name, icon)
    this.initReady = (source instanceof MediaStream
      ? this.#init4MS(source, opts)
      : this.#init4File(source, opts)
    ).then(({ videoEl, audioSource }) => {
      videoEl.loop = true
      this.rect.w = videoEl.videoWidth
      this.rect.h = videoEl.videoHeight
      this.#videoEl = videoEl

      if (audioSource != null && opts.audioCtx != null) {
        this.audioNode = opts.audioCtx.createGain()
        audioSource.connect(this.audioNode)
      }
    })
  }

  async #init4MS (ms: MediaStream, opts: IShareSpriteOpts): Promise<{
    videoEl: HTMLVideoElement
    audioSource: AudioNode | null
  }> {
    const audioMS = new MediaStream()
    ms.getAudioTracks().forEach((track) => {
      // 给视频消音，否则会从扬声器重新播放出来，跟背景音重叠
      ms.removeTrack(track)
      audioMS.addTrack(track)
    })

    const videoEl = await mediaStream2Video(ms)
    await videoEl.play()

    let audioSource = null
    if (opts.audioCtx != null && audioMS.getAudioTracks().length > 0) {
      audioSource = opts.audioCtx.createMediaStreamSource(audioMS)
    }

    return { videoEl, audioSource }
  }

  async #init4File (videoFile: File, opts: IShareSpriteOpts): Promise<{
    videoEl: HTMLVideoElement
    audioSource: AudioNode | null
  }> {
    if (
      !['video/mp4', 'video/webm'].includes(videoFile.type)
    ) throw Error('Unsupport video format')
    const videoEl = createEl('video') as HTMLVideoElement
    videoEl.src = URL.createObjectURL(videoFile)
    await videoEl.play()

    let audioSource = null
    if (opts.audioCtx != null) {
      audioSource = opts.audioCtx.createMediaElementSource(videoEl)
    }

    return { videoEl, audioSource }
  }

  #updateRect (): void {
    if (this.#videoEl == null) return
    const factor =  Math.min(this.externalRect.w / this.rect.w, this.externalRect.h / this.rect.h)
    this.rect.w = this.#videoEl.videoWidth * factor
    this.rect.h = this.#videoEl.videoHeight * factor
    this.rect.x = this.externalRect.x + (this.externalRect.w - this.rect.w) / 2
    this.rect.y = this.externalRect.y + (this.externalRect.h - this.rect.h) / 2
  }

  updateExternalRect (rect: { x: number; y: number; w: number; h: number }): void {
    super.updateExternalRect(rect)
    this.#updateRect()
  }

  render (ctx: CanvasRenderingContext2D): void {
    if (this.#videoEl == null) return
    super.render(ctx)
    // 当流中的视频的大小发生变化时,需要更新
    this.#updateRect()
    ctx.drawImage(this.#videoEl, this.rect.x, this.rect.y, this.rect.w, this.rect.h)
    // TODO:需要绘制“name正在共享”文字
  }

  get volume (): number {
    return this.audioNode?.gain.value ?? 0
  }

  set volume (v: number) {
    if (this.audioNode == null) return
    this.audioNode.gain.value = v
  }

  destroy (): void {
    this.#videoEl?.remove()
    if (this.#videoEl?.src != null) URL.revokeObjectURL(this.#videoEl.src)
    this.#videoEl = null
    this.audioNode?.disconnect()
  }
}

async function mediaStream2Video (
  stream: MediaStream
): Promise<HTMLVideoElement> {
  const video = document.createElement('video')

  let timer: number

  video.srcObject = stream

  return await new Promise((resolve, reject) => {
    let failed = false
    video.addEventListener('loadeddata', () => {
      if (failed) return
      clearTimeout(timer)
      resolve(video)
    })
    timer = window.setTimeout(() => {
      failed = true
      reject(new Error('video load failed'))
    }, 2000)
  })
}
