import { AVCanvas, AudioSprite, VideoSprite } from '../src/index'
import { AVRecorder } from 'avrecorder-recorder'

const avCvs = new AVCanvas({
  bgColor: '#333',
  resolution: {
    width: 1920,
    height: 1080
  }
})

document.querySelector('#micphone')?.addEventListener('click', () => {
  ;(async () => {
    const mediaStream = await navigator.mediaDevices.getUserMedia({
      video: false,
      audio: true
    })
    const audioSprite = new AudioSprite('micphone', mediaStream, {
      audioCtx: avCvs.spriteManager.audioCtx
    })
    await avCvs.spriteManager.addSprite(audioSprite)

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

async function createFileWriter (extName: string): Promise<FileSystemWritableFileStream> {
  const fileHandle = await window.showSaveFilePicker({
    suggestedName: `WebAv-export-${Date.now()}.${extName}`
  })
  return fileHandle.createWritable()
}

export {}
