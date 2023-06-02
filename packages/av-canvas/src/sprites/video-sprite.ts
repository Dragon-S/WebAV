import { createEl } from '../utils'
import { BaseSprite } from '@webav/av-cliper'

interface IVideoSpriteOpts {
  audioCtx?: AudioContext
}

export class VideoSprite extends BaseSprite {
  #videoEl: HTMLVideoElement | null = null

  width = 0
  height = 0
  x = 0
  y = 0

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
      // this.name = name

      // console.log("sll--------this.width = ", this.width)
      // console.log("sll--------this.height = ", this.height)
      // console.log("sll--------this.x = ", this.x)
      // console.log("sll--------this.y = ", this.y)

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
    const factor =  Math.min(1600 / this.rect.w, 1080 / this.rect.h)
    this.width = (this.name == "userMedia") ? 320 : this.rect.w * factor
    this.height = (this.name == "userMedia") ? 180 : this.rect.h * factor
    this.x = (this.name == "userMedia") ? 0 : 320 + (1600 - this.width) / 2
    this.y = (this.name == "userMedia") ? 0 + 180 * this.index : (1080 - this.height) / 2
  }

  render (ctx: CanvasRenderingContext2D): void {
    if (this.#videoEl == null) return
    super.render(ctx)
    // const { w, h } = this.rect
    this.updateRect()
    // console.log("sll--------this.rect.w = ", this.rect.w)
    // console.log("sll--------this.rect.h = ", this.rect.h)
    // console.log("sll--------this.width = ", this.width)
    // console.log("sll--------this.height = ", this.height)
    // console.log("sll--------this.x = ", this.x)
    // console.log("sll--------this.y = ", this.y)
    // console.log("sll--------this.#videoEl.width = ", this.#videoEl.width)
    // console.log("sll--------this.#videoEl.height = ", this.#videoEl.height)
    ctx.drawImage(this.#videoEl, this.x, this.y, this.width, this.height)
    // ctx.drawImage(this.#videoEl, -this.width / 2, -this.height / 2, this.width, this.height)
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
