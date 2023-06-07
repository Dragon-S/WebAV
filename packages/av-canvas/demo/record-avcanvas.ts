import { AVCanvas, AudioSprite, FontSprite, ImgSprite, VideoSprite } from '../src/index'
import { AVRecorder } from '@webav/av-recorder'

// 创建无序列表元素
const unorderedList = document.getElementById('list');

// 创虚拟div用于视频布局
const layout = document.createElement('div')
layout.style.visibility = 'hidden'
layout.style.width = 1920
layout.style.height = 1080
// document.querySelector('#app') as HTMLElement
const avCvs = new AVCanvas(layout, {
  bgColor: '#333',
  resolution: {
    width: 1920,
    height: 1080
  }
})

console.log({ avCvs })

;(async (): Promise<void> => {
  // const is = new ImgSprite('img', 'https://neo-pages.bilibili.com/bbfe/neo/assets/img/neo-pages-overview.48f7bb81.png')
  // await avCvs.spriteManager.addSprite(is)
})().catch(console.error)
document.querySelector('#userMedia')?.addEventListener('click', () => {
  ;(async () => {
    // const mediaStream = await navigator.mediaDevices.getUserMedia({
    //   video: true,
    //   audio: true
    // })
    const mediaStream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: 1280,
        height: 720,
        frameRate: 25,
        deviceId: "19e8c66efe2ddf3d2eec39358cb35097b431d7ed3e1cd5d7451723b41d3096bc",
      },
      audio: true,
    })
    const vs = new VideoSprite('userMedia', mediaStream, {
      audioCtx: avCvs.spriteManager.audioCtx
    })
    await avCvs.spriteManager.addSprite(vs)

    // 创建列表项元素
    const listItem = document.createElement('li');
    listItem.textContent = '摄像头视频';

    // 将列表项添加到无序列表中
    unorderedList.appendChild(listItem);
  })().catch(console.error)
})

document.querySelector('#display')?.addEventListener('click', () => {
  ;(async () => {
    const mediaStream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        frameRate: 25,
      },
      audio: true
    })
    const vs = new VideoSprite('display', mediaStream, {
      audioCtx: avCvs.spriteManager.audioCtx
    })
    await avCvs.spriteManager.addSprite(vs)

    // 创建列表项元素
    const listItem = document.createElement('li');
    listItem.textContent = '屏幕视频';

    // 将列表项添加到无序列表中
    unorderedList.appendChild(listItem);
  })().catch(console.error)
})

document.querySelector('#localImg')?.addEventListener('click', () => {
  ;(async () => {
    const [imgFH] = await (window as any).showOpenFilePicker({
      types: [{
        description: 'Images',
        accept: {
          'image/*': ['.png', '.gif', '.jpeg', '.jpg']
        }
      }]
    })
    const is = new ImgSprite('img', await imgFH.getFile())
    await avCvs.spriteManager.addSprite(is)
  })().catch(console.error)
})

document.querySelector('#localVideo')?.addEventListener('click', () => {
  ;(async () => {
    const [imgFH] = await (window as any).showOpenFilePicker({
      types: [{
        description: 'Video',
        accept: {
          'video/*': ['.webm', '.mp4']
        }
      }]
    })
    const vs = new VideoSprite('vs', await imgFH.getFile())
    await avCvs.spriteManager.addSprite(vs)
  })().catch(console.error)
})

document.querySelector('#localAudio')?.addEventListener('click', () => {
  ;(async () => {
    const [imgFH] = await (window as any).showOpenFilePicker({
      types: [{
        description: 'Audio',
        accept: {
          'audio/*': ['.mp3', '.wav', '.ogg']
        }
      }]
    })
    const as = new AudioSprite('vs', await imgFH.getFile())
    await avCvs.spriteManager.addSprite(as)
  })().catch(console.error)
})

document.querySelector('#fontExamp')?.addEventListener('click', () => {
  ;(async () => {
    const fs = new FontSprite('font', '示例文字')
    await avCvs.spriteManager.addSprite(fs)
  })().catch(console.error)
})

let recorder: AVRecorder | null = null
document.querySelector('#startRecod')?.addEventListener('click', () => {
  ;(async () => {
    const writer = await createFileWriter('mp4')
    recorder = new AVRecorder(avCvs.captureStream(), {
      width: 1920,
      height: 1080,
      bitrate: 3_000_000,
      expectFPS: 25,
      audioCodec: 'aac'
    })
    await recorder.start()
    recorder.outputStream?.pipeTo(writer).catch(console.error)
  })().catch(console.error)
})
document.querySelector('#stopRecod')?.addEventListener('click', () => {
  ;(async () => {
    await recorder?.stop()
    alert('save done')
  })().catch(console.error)
})

document.querySelector('#removeCameraStream')?.addEventListener('click', () => {
  ;(async () => {
    const sprites = avCvs.spriteManager.getSprites();
    for (let index = 0; index < sprites.length; index++) {
      const sprite = sprites[index];
      if (sprite.name == "userMedia") {
        avCvs.spriteManager.removeSprite(sprite)
        const listItems = document.querySelectorAll('li');
        for (let index = 0; index < listItems.length; index++) {
          const element = listItems[index];
          if (element.textContent == '摄像头视频') {
            element.remove();
            break
          }
        }
      }
      break
    }
  })().catch(console.error)
})

document.querySelector('#removeDisplayStream')?.addEventListener('click', () => {
  ;(async () => {
    const sprites = avCvs.spriteManager.getSprites();
    for (let index = 0; index < sprites.length; index++) {
      const sprite = sprites[index];
      if (sprite.name == "display") {
        avCvs.spriteManager.removeSprite(sprite)
        const listItems = document.querySelectorAll('li');
        for (let index = 0; index < listItems.length; index++) {
          const element = listItems[index];
          if (element.textContent == '屏幕视频') {
            element.remove();
            break
          }
        }
      }
      break
    }
  })().catch(console.error)
})

async function createFileWriter (extName: string): Promise<FileSystemWritableFileStream> {
  const fileHandle = await window.showSaveFilePicker({
    suggestedName: `WebAv-export-${Date.now()}.${extName}`
  })
  return fileHandle.createWritable()
}

export {}
