import { AVCanvas, VideoSprite } from '../src/index'
import { AVRecorder } from 'avrecorder-recorder'

const avCvs = new AVCanvas({
  bgColor: '#333',
  resolution: {
    width: 1920,
    height: 1080
  }
})

const recorder = new AVRecorder(avCvs.captureStream(), {
  width: 1920,
  height: 1080,
  bitrate: 1_500_000,
  expectFPS: 25,
  audioCodec: 'aac'
})

document.querySelector('#camera')?.addEventListener('click', () => {
  ;(async () => {
    const mediaStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    })
    const vidoeSprite = new VideoSprite('camera', mediaStream, {
      audioCtx: avCvs.spriteManager.audioCtx
    })
    await avCvs.spriteManager.addSprite(vidoeSprite)

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
    const displaySprite = new VideoSprite('display', mediaStream, {
      audioCtx: avCvs.spriteManager.audioCtx
    })
    await avCvs.spriteManager.addSprite(displaySprite)
  })().catch(console.error)
})

document.querySelector('#startRecod')?.addEventListener('click', () => {
  ;(async () => {
    const writer = await createFileWriter('mp4')
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

async function createFileWriter (extName: string): Promise<FileSystemWritableFileStream> {
  const fileHandle = await window.showSaveFilePicker({
    suggestedName: `WebAv-export-${Date.now()}.${extName}`
  })
  return fileHandle.createWritable()
}

export {}
