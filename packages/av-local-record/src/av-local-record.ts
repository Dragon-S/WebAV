import { AVRecorder } from 'avrecorder-recorder'
import { AVCanvas, VideoSprite, AudioSprite, NoneSprite, ShareSprite, AVCanvasLayoutMode } from 'avrecorder-canvas'
import * as fs from 'fs'
import { ReadableWebToNodeStream } from 'web-to-node-readablestream'
import { BaseSprite } from 'avrecorder-cliper'

export enum AVLocalRecordStreamType {
  AUDIO = 'audio', //音频流，只有音频轨，无视频轨，相当于目前会议中的mix流
  VIDEO = 'video', //视频流，必须有视频轨，音频轨可选（有无都可以）
  SHARE = 'share', //共享流, 必须有视频轨，音频轨可选（有无都可以）
  NONE = 'none', //无流, 针对没有开视频的参会者
}

export class AVLocalRecord {
  #resolution: { width: number; height: number }

  #backgroundColor: string

  #sidebarBackgroundColor: string

  #saveFileDir: string

  #avcanvas: AVCanvas

  #avrecorder: AVRecorder

  constructor (opts: {
    resolution: {
      width: number
      height: number
    }
    saveFileDir: string
    layoutMode: AVCanvasLayoutMode
    backgroundColor: string
    sidebarBackgroundColor: string
  }) {
    this.#resolution = opts.resolution
    this.#backgroundColor = opts.backgroundColor
    this.#sidebarBackgroundColor = opts.sidebarBackgroundColor
    this.#saveFileDir = opts.saveFileDir

    this.#avcanvas = new AVCanvas(null, {
      bgColor: this.#backgroundColor,
      resolution: this.#resolution,
      sidebarBgColor: this.#sidebarBackgroundColor,
      layoutMode: opts.layoutMode
    })

    this.#avrecorder = new AVRecorder(this.#avcanvas.captureStream(), {
        width: this.#resolution.width,
        height: this.#resolution.height,
        bitrate: 3_000_000,
        expectFPS: 25,
        audioCodec: 'aac'
    })
  }

  #createSprite (name: string,
    icon: File | string,
    stream: MediaStream,
    streamType: AVLocalRecordStreamType): BaseSprite {
    if (streamType == AVLocalRecordStreamType.AUDIO) {
      const audioSprite = new AudioSprite(name, icon, stream, {
        audioCtx: this.#avcanvas.spriteManager.audioCtx
      })
      return audioSprite
    } else if (streamType == AVLocalRecordStreamType.VIDEO) {
      const videoSprite = new VideoSprite(name, icon, stream, {
        audioCtx: this.#avcanvas.spriteManager.audioCtx
      })
      return videoSprite
    } else if (streamType == AVLocalRecordStreamType.SHARE) {
      const shareSprite = new ShareSprite(name, icon, stream, {
        audioCtx: this.#avcanvas.spriteManager.audioCtx
      })
      return shareSprite
    } else {
      const noneSprite = new NoneSprite(name, icon)
      return noneSprite
    }
  }

  startRecord (fileName: string | null): void {
    if (fileName == null) {
        fileName = `${new Date().getTime()}.mp4`
    }
    const filePath = `${this.#saveFileDir}/${fileName}`
    const writeStream = fs.createWriteStream(filePath)
    this.#avrecorder.start()

    if (this.#avrecorder.outputStream) {
      // FIXME:需要解决readStream转换失败的问题
      const nodeReadableStream = new ReadableWebToNodeStream(this.#avrecorder.outputStream);
      console.log(nodeReadableStream)
      const readStream = fs.createReadStream('file.txt', { encoding: 'utf-8' });
      readStream.pipe(writeStream);
    }
  }

  stopRecord (): void {
    this.#avrecorder.stop()
  }

  pauseRecord (): void {

  }

  resumeRecord (): void {

  }

  updateRecorderLayoutMode (mode: AVCanvasLayoutMode): void {
    this.#avcanvas.updateLayoutMode(mode)
  }

  addSprite (name: string,
    icon: File | string,
    stream: MediaStream,
    streamType: AVLocalRecordStreamType): string {
    const sprite = this.#createSprite(name, icon, stream, streamType)
    this.#avcanvas.spriteManager.addSprite(sprite)

    return sprite.uuid
  }

  removeSpriteByUuid (uuid: string): void {
    this.#avcanvas.spriteManager.removeSpriteByUuid(uuid)
  }

  updateSpriteIndexByUuid (uuid: string, index: number): void {
    this.#avcanvas.spriteManager.updateSpriteIndexByUuid(uuid, index)
  }

  updateSpriteNameByUuid (uuid: string, name: string): void {
    this.#avcanvas.spriteManager.updateSpriteNameByUuid(uuid, name)
  }

  updateSpriteIconByUuid (uuid: string, icon: File | string): void {
    this.#avcanvas.spriteManager.updateSpriteIconByUuid(uuid, icon)
  }

  updateSpriteActivationStatusByUuid (uuid: string, active: boolean): void {
    this.#avcanvas.spriteManager.updateSpriteActivationStatusByUuid(uuid, active)
  }

  destroy (): void {
    this.#avcanvas.destroy()
  }
}