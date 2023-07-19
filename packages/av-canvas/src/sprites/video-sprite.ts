import { createEl } from '../utils'
import { BaseSprite } from 'avrecorder-cliper'

interface IVideoSpriteOpts {
  audioCtx?: AudioContext
}

export class VideoSprite extends BaseSprite {
  #videoEl: HTMLVideoElement | null = null

  constructor (name: string, source: MediaStream | File, opts: IVideoSpriteOpts = {}) {
    super(name)
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

  async #init4MS (ms: MediaStream, opts: IVideoSpriteOpts): Promise<{
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

  async #init4File (videoFile: File, opts: IVideoSpriteOpts): Promise<{
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

  updateRect (): void {
    if (this.#videoEl == null) return

    this.rect.w = this.#videoEl.videoWidth
    this.rect.h = this.#videoEl.videoHeight
    const factor =  Math.min(1920 / this.rect.w, 1080 / this.rect.h)
    this.rect.w = this.rect.w * factor
    this.rect.h = this.rect.h * factor
    this.rect.x = (1920 - this.rect.w) / 2
    this.rect.y = (1080 - this.rect.h) / 2
  }

  render (ctx: CanvasRenderingContext2D): void {
    if (this.#videoEl == null) return

    super.render(ctx)

    this.updateRect()
    ctx.drawImage(this.#videoEl, this.rect.x, this.rect.y, this.rect.w, this.rect.h)
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

  // FIXME: 此处的timer依赖窗口，如果窗口处于非激活状态时，调用此处可能会存在问题
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
