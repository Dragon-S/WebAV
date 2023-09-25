import { AVCanvas, VideoSprite, AudioSprite } from '../src/index'
import { AVRecorder } from 'avrecorder-recorder'

const avCvs = new AVCanvas({
  bgColor: '#333',
  resolution: {
    width: 1920,
    height: 1080
  }
})

let inputMedia = {
  camera: false,
  display: false,
  mic: false,
  system: false
}

const inputVideo = (document.querySelector('#inputVideo') as HTMLSelectElement).value
if (inputVideo === 'camera+display') {
  inputMedia.camera = true
  inputMedia.display = true
} else if (inputVideo === 'camera') {
  inputMedia.camera = true
} else if (inputVideo === 'display') {
  inputMedia.display = true
}

const inputAudio = (document.querySelector('#inputAudio') as HTMLSelectElement).value
if (inputAudio === 'mic+system') {
  inputMedia.mic = true
  inputMedia.system = true
} else if (inputAudio === 'mic') {
  inputMedia.mic = true
} else if (inputAudio === 'system') {
  inputMedia.system = true
}

let layout = (document.querySelector('#layout') as HTMLSelectElement).value
let outputResolution = (document.querySelector('#outputResolution') as HTMLSelectElement).value
let outputFramerate = (document.querySelector('#outputFramerate') as HTMLSelectElement).value

const video = document.createElement("video")
video.autoplay = true
video.style.cssText = `
width: 100%;
height: 100%;
`
video.width = 1920
video.height = 1080
document.querySelector('#app')?.appendChild(video)

let cameraStream: MediaStream | null = null
let cameraSprite: VideoSprite | null = null
async function updateCameraStream () {
  if (inputMedia.camera) {
    console.log("创建相机流")
    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false
    })
    video.srcObject = cameraStream

    cameraSprite = new VideoSprite('camera', cameraStream, {
      audioCtx: avCvs.spriteManager.audioCtx
    })
    await avCvs.spriteManager.addSprite(cameraSprite)
  } else {
    console.log("移除相机流")
    avCvs.spriteManager.removeSprite(cameraSprite)
    cameraSprite?.destroy()
    cameraSprite = null

    video.srcObject = null
    cameraStream?.getVideoTracks()[0].stop()
    cameraStream = null
  }
}

let micStream: MediaStream | null = null
let micSprite: AudioSprite | null = null
async function updateMicStream () {
  if (inputMedia.mic) {
    console.log("创建麦克风流")
    micStream = await navigator.mediaDevices.getUserMedia({
      video: false,
      audio: true
    })

    micSprite = new AudioSprite('mic', micStream, {
      audioCtx: avCvs.spriteManager.audioCtx
    })
    await avCvs.spriteManager.addSprite(micSprite)
  } else {
    console.log("移除麦克风流")
    avCvs.spriteManager.removeSprite(micSprite)
    micSprite?.destroy()
    micSprite = null

    micStream?.getVideoTracks()[0].stop()
    micStream = null
  }
}

let displayStream: MediaStream | null = null
let displaySprite: VideoSprite | null = null
async function updateDisplayStream() {
  if (inputMedia.display) {
    console.log("创建屏幕流")
    displayStream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        frameRate: 25,
      },
      audio: true
    })

    displaySprite = new VideoSprite('display', displayStream, {
      audioCtx: avCvs.spriteManager.audioCtx
    })
    await avCvs.spriteManager.addSprite(displaySprite)
  } else {
    console.log("移除屏幕流")
    avCvs.spriteManager.removeSprite(displaySprite)
    displaySprite?.destroy()
    displaySprite = null

    displayStream?.getVideoTracks()[0].stop()
    displayStream = null
  }
}

let systemAudioStream: MediaStream | null = null
let isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
async function updateSystemAudioStream() {
  if (inputMedia.system) {
    console.log("创建系统声音流")
    if (isMac) {
      systemAudioStream = await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: {
          deviceId: {
            exact: 'Built-in Microphone'
          }
        }
      })
    } else {
      systemAudioStream = await navigator.mediaDevices.getDisplayMedia({
        video: false,
        audio: true
      })
    }
  } else {
    console.log("移除系统声音流")
    systemAudioStream?.getAudioTracks()[0].stop()
    systemAudioStream = null
  }
}

updateCameraStream()
// updateDisplayStream()
updateMicStream()
// updateSystemAudioStream()

const recorder = new AVRecorder(avCvs.captureStream(), {
  width: 1920,
  height: 1080,
  bitrate: 1_500_000,
  expectFPS: 25,
  audioCodec: 'aac'
})

document.querySelector('#inputVideo')?.addEventListener('change', (event: any) => {
  const type = event.target?.value;
  switch (type) {
    case "camera+display":
      console.log("sll---inputVideo = ", type)
      if (inputMedia.camera == false) {
        inputMedia.camera = true
        updateCameraStream()
      }
      if (inputMedia.display == false) {
        inputMedia.display = true
        updateDisplayStream()
      }
      break;

    case "camera":
      console.log("sll---inputVideo = ", type)
      if (inputMedia.camera == false) {
        inputMedia.camera = true
        updateCameraStream()
      }
      if (inputMedia.display == true) {
        inputMedia.display = false
        updateDisplayStream()
      }
      break;

    case "display":
      console.log("sll---inputVideo = ", type)
      if (inputMedia.display == false) {
        inputMedia.display = true
        updateDisplayStream()
      }
      if (inputMedia.camera == true) {
        inputMedia.camera = false
        updateCameraStream()
      }
      break;

    default:
      break;
  }
})

document.querySelector('#inputAudio')?.addEventListener('change', (event: any) => {
  const type = event.target?.value;
  switch (type) {
    case "mic+system":
      console.log("sll---inputAudio = ", type)
      if (inputMedia.mic == false) {
        inputMedia.mic = true
        updateMicStream()
      }
      if (inputMedia.system == false) {
        inputMedia.system = true
        updateSystemAudioStream()
      }
      break;

    case "mic":
      console.log("sll---inputAudio = ", type)
      if (inputMedia.mic == false) {
        inputMedia.mic = true
        updateMicStream()
      }
      if (inputMedia.system == true) {
        inputMedia.system = false
        updateSystemAudioStream()
      }
      break;

    case "system":
      console.log("sll---inputAudio = ", type)
      if (inputMedia.system == false) {
        inputMedia.system = true
        updateSystemAudioStream()
      }
      if (inputMedia.mic == true) {
        inputMedia.mic = false
        updateMicStream()
      }
      break;

    default:
      break;
  }
})

document.querySelector('#layout')?.addEventListener('change', (event: any) => {
  layout = event.target.value
  const type = event.target?.value;
  switch (type) {
    case "sidebyside":
      console.log("sll---layout = ", type)
      break;

    case "floating":
      console.log("sll---layout = ", type)
      break;

    default:
      break;
  }
})

document.querySelector('#outputResolution')?.addEventListener('change', (event: any) => {
  outputResolution = event.target.value
  const type = event.target?.value;
  switch (type) {
    case "1080P":
      console.log("sll---outputResolution = ", type)
      break;

    case "720P":
      console.log("sll---outputResolution = ", type)
      break;

    default:
      break;
  }
})

document.querySelector('#outputFramerate')?.addEventListener('change', (event: any) => {
  outputFramerate = event.target.value
  const type = event.target?.value;
  switch (type) {
    case "30fps":
      console.log("sll---outputFramerate = ", type)
      break;

    case "25fps":
      console.log("sll---outputFramerate = ", type)
      break;

    default:
      break;
  }
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
