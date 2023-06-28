import { EventTool } from '../event-tool'
import { BaseSprite } from 'avrecorder-cliper'

export enum ESpriteManagerEvt {
  ActiveSpriteChange = 'activeSpriteChange',
  AddSprite = 'addSprite',
  UpdateLayout = 'updateLayout'
}

export class SpriteManager {
  #sprites: BaseSprite[] = []

  #activeSprite: BaseSprite | null = null

  #evtTool = new EventTool<{
    [ESpriteManagerEvt.AddSprite]: (s: BaseSprite) => void
    [ESpriteManagerEvt.ActiveSpriteChange]: (s: BaseSprite | null) => void
    [ESpriteManagerEvt.UpdateLayout]: (s: BaseSprite | null) => void
  }>()

  audioCtx = new AudioContext()

  audioMSDest = this.audioCtx.createMediaStreamDestination()

  on = this.#evtTool.on

  get activeSprite (): BaseSprite | null { return this.#activeSprite }
  set activeSprite (s: BaseSprite | null) {
    if (s === this.#activeSprite) return
    this.#activeSprite = s
    this.#evtTool.emit(ESpriteManagerEvt.ActiveSpriteChange, s)
  }

  constructor () {
    this.#bgAudio()
  }

  async addSprite<S extends BaseSprite>(s: S): Promise<void> {
    await s.initReady
    this.#sprites.push(s)
    s.index = this.#sprites.length - 1
    this.#sprites = this.#sprites.sort((a, b) => a.zIndex - b.zIndex)
    s.audioNode?.connect(this.audioMSDest)

    this.#evtTool.emit(ESpriteManagerEvt.AddSprite, s)

    // 根据布局参数计算sprite的位置和大小
  }

  removeSprite (spr: BaseSprite): void {
    this.#sprites = this.#sprites.filter(s => s !== spr)
    spr.destroy()
  }

  removeSpriteByUuid (uuid: string): void {
    const s = this.#sprites.find(s => s.uuid === uuid)
    if (s == null) return
    this.#sprites = this.#sprites.filter(s => s.uuid !== uuid)
    s.destroy()
  }

  updateSpriteIndexByUuid (uuid: string, index: number): void {
    const s = this.#sprites.find(s => s.uuid === uuid)
    if (s == null) return
    s.index = index
  }

  updateSpriteNameByUuid (uuid: string, name: string): void {
    const s = this.#sprites.find(s => s.uuid === uuid)
    if (s == null) return
    s.name = name
  }

  updateSpriteIconByUuid (uuid: string, icon: HTMLImageElement): void {
    const s = this.#sprites.find(s => s.uuid === uuid)
    if (s == null) return
    s.icon = icon
  }

  updateSpriteActivationStatusByUuid (uuid: string, active: boolean): void {
    const s = this.#sprites.find(s => s.uuid === uuid)
    if (s == null) return
    s.active = active
  }

  updateSpritesRect (): void {
    // 获取
    this.#sprites.forEach((sprite: BaseSprite) => {
      sprite.rect.x = sprite.icon?.offsetLeft ?? 0
      sprite.rect.y = sprite.icon?.offsetTop ?? 0
      sprite.rect.w = sprite.icon?.offsetWidth ?? 0
      sprite.rect.h = sprite.icon?.offsetHeight ?? 0
    })
  }

  getSprites (): BaseSprite[] {
    return [...this.#sprites]
  }

  destroy (): void {
    this.#evtTool.destroy()
    this.#sprites.forEach(s => s.destroy())
    this.#sprites = []
    this.audioMSDest.disconnect()
    this.audioCtx.close().catch(console.error)
  }

  // 添加背景音，如果没有音频，录制的webm不正常
  #bgAudio (): void {
    const oscillator = this.audioCtx.createOscillator()
    const wave = this.audioCtx.createPeriodicWave(
      new Float32Array([0, 0]),
      new Float32Array([0, 0]),
      { disableNormalization: true }
    )
    oscillator.setPeriodicWave(wave)
    oscillator.connect(this.audioMSDest)
    oscillator.start()
  }
}
