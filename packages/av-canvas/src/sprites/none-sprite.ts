import { BaseSprite, renderTxt2Img } from 'avrecorder-cliper'

export class NoneSprite extends BaseSprite {
  #nameImage = new Image()

  #iconImage = new Image()

  #iconImageRect = {x: 0, y: 0, w: 0, h: 0}

  #nameImageRect = {x: 0, y: 0, w: 0, h: 0}

  constructor (name: string, icon: File | string) {
    super(name, icon)

    if (name !== null) {
      this.name = name
      // 名字转换为图片，并计算宽高
      const style = {
        color: '#ffffff',
        size: 100,
        family: 'sans-serif'
      }

      this.#nameImage = renderTxt2Img(
        this.name,
        `
          font-size: ${style.size}px;
          color: ${style.color};
          font-family: ${style.family};
        `
      )
      this.#nameImageRect.w = this.#nameImage.width
      this.#nameImageRect.h = this.#nameImage.height
    }

    if (icon !== null) {
      if ( this.icon instanceof File &&
        !['image/png', 'image/jpg', 'image/jpeg', 'image/bmp', 'image/gif']
          .includes(this.icon.type)) {
        console.log('Unsupport image format')
        return
      }
      this.icon = icon
      this.initReady = this.#initIconImage(icon)
    }
  }

  async #initIconImage (icon: File | string): Promise<void> {
    const imgLoad = new Promise<void>((resolve, reject) => {
      this.#iconImage.onload = () => {
        this.#iconImageRect.w = this.#iconImage.width
        this.#iconImageRect.h = this.#iconImage.height
        resolve()
      }
      this.#iconImage.onerror = reject
    })

    this.#iconImage.src = icon instanceof File
      ? await file2B64(icon)
      : icon

    await imgLoad
  }

  updateExternalRect (rect: { x: number; y: number; w: number; h: number }): void {
    super.updateExternalRect(rect)
    // 计算名字及icon的位置
    if (this.icon !== null) {
      const factor =  Math.min(this.externalRect.w / this.rect.w, this.externalRect.h * 0.5 / this.rect.h)
      this.#iconImageRect.w = this.#iconImageRect.w * factor
      this.#iconImageRect.h = this.#iconImageRect.h * factor
      this.#iconImageRect.x = this.externalRect.x + (this.externalRect.w - this.#iconImageRect.w) / 2
      this.#iconImageRect.y = this.externalRect.y + (this.externalRect.h * 0.5 - this.#iconImageRect.h) / 2
      if (this.name !== null) {
        const factor =  Math.min(this.externalRect.w / this.rect.w, this.externalRect.h * 0.5 / this.rect.h)
        this.#nameImageRect.w = this.#nameImageRect.w * factor
        this.#nameImageRect.h = this.#nameImageRect.h * factor
        this.#nameImageRect.x = this.externalRect.x + (this.externalRect.w - this.#nameImageRect.w) / 2
        this.#nameImageRect.y = this.externalRect.y * 1.5 + (this.externalRect.h * 0.5 - this.#nameImageRect.h) / 2
      }
    } else if (this.name !== null) {
      const factor =  Math.min(this.externalRect.w / this.rect.w, this.externalRect.h / this.rect.h)
      this.#nameImageRect.w = this.#nameImageRect.w * factor
      this.#nameImageRect.h = this.#nameImageRect.h * factor
      this.#nameImageRect.x = this.externalRect.x + (this.externalRect.w - this.#nameImageRect.w) / 2
      this.#nameImageRect.y = this.externalRect.y + (this.externalRect.h - this.#nameImageRect.h) / 2
    }
  }

  render (ctx: CanvasRenderingContext2D): void {
    super.render(ctx)
    if (this.name !== null) {
      ctx.drawImage(this.#nameImage, this.#nameImageRect.x,
        this.#nameImageRect.y, this.#nameImageRect.w, this.#nameImageRect.h)
    }

    if (this.icon !== null) {
      ctx.drawImage(this.#iconImage, this.#iconImageRect.x,
        this.#iconImageRect.y, this.#iconImageRect.w, this.#iconImageRect.h)
    }
  }

  destroy(): void {
    this.#iconImage.remove()
    this.#nameImage.remove()
  }
}

async function file2B64 (file: File): Promise<string> {
  return await new Promise((resolve) => {
    const fileReader = new FileReader()
    fileReader.onload = function (e) {
      resolve((e.target as FileReader).result as string)
    }
    fileReader.readAsDataURL(file)
  })
}
