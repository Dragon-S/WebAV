import { AVCanvas, VideoSprite, AudioSprite } from '../src/index'
import { AVRecorder } from 'avrecorder-recorder'
import { ILayoutType } from '../src/types'

const avCvs = new AVCanvas(document.querySelector('#app') as HTMLElement, {
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
const layoutTest =  document.querySelector('#layout') as HTMLSelectElement
layoutTest.hidden = false
console.log("sll----inputVideo", inputVideo)
if (inputVideo === 'camera+display') {
  inputMedia.camera = true
  inputMedia.display = true
  layoutTest.hidden = false
  avCvs.updateLayoutType(ILayoutType.SIDEBYSIDE)
} else if (inputVideo === 'camera') {
  inputMedia.camera = true
  layoutTest.hidden = true
  avCvs.updateLayoutType(ILayoutType.FULLSCREEN)
} else if (inputVideo === 'display') {
  inputMedia.display = true
  layoutTest.hidden = true
  avCvs.updateLayoutType(ILayoutType.FULLSCREEN)
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

let cameraStream: MediaStream | null = null
let cameraSprite: VideoSprite | null = null
async function updateCameraStream () {
  if (inputMedia.camera) {
    console.log("创建相机流")
    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: 1280,
        height: 720,
        frameRate: 30
      },
      audio: false
    })

    cameraSprite = new VideoSprite('camera', cameraStream, {
      audioCtx: avCvs.spriteManager.audioCtx
    })
    cameraSprite.zIndex = 10 // 使摄像头视频始终在最上层
    await avCvs.spriteManager.addSprite(cameraSprite)
  } else {
    console.log("移除相机流")
    avCvs.spriteManager.removeSprite(cameraSprite)
    cameraSprite?.destroy()
    cameraSprite = null

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

    micStream?.getAudioTracks()[0].stop()
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
        width: 1920,
        height: 1080,
        frameRate: 30,
      },
      audio: false
    })

    displaySprite = new VideoSprite('display', displayStream, {
      audioCtx: avCvs.spriteManager.audioCtx
    })
    await avCvs.spriteManager.addSprite(displaySprite)
  } else {
    console.log("移除屏幕流")
    if (displaySprite != null) {
      avCvs.spriteManager.removeSprite(displaySprite)
      displaySprite?.destroy()
      displaySprite = null
    }

    displayStream?.getVideoTracks()[0].stop()
    displayStream = null
  }
}

let systemAudioStream: MediaStream | null = null
let systemAudioSprite: AudioSprite | null = null
let isMac = false //navigator.platform.toUpperCase().indexOf('MAC') >= 0
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
        video: true,
        audio: true
      })
      systemAudioStream.removeTrack(systemAudioStream.getVideoTracks()[0])
    }

    systemAudioSprite = new AudioSprite('mic', systemAudioStream, {
      audioCtx: avCvs.spriteManager.audioCtx
    })
    await avCvs.spriteManager.addSprite(systemAudioSprite)
  } else {
    console.log("移除系统声音流")
    if (systemAudioSprite != null) {
      avCvs.spriteManager.removeSprite(systemAudioSprite)
      systemAudioSprite?.destroy()
      systemAudioSprite = null
    }

    systemAudioStream?.getAudioTracks()[0].stop()
    systemAudioStream = null
  }
}

updateCameraStream()
updateDisplayStream()
updateMicStream()
updateSystemAudioStream()

const recorder = new AVRecorder(avCvs.captureStream(), {
  width: 1920,
  height: 1080,
  bitrate: 2_500_000,
  expectFPS: 30,
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
      layoutTest.hidden = false
      avCvs.updateLayoutType(ILayoutType.SIDEBYSIDE)
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
      layoutTest.hidden = true
      avCvs.updateLayoutType(ILayoutType.FULLSCREEN)
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
      layoutTest.hidden = true
      avCvs.updateLayoutType(ILayoutType.FULLSCREEN)
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

let layout = (document.querySelector('#layout') as HTMLSelectElement).value
document.querySelector('#layout')?.addEventListener('change', (event: any) => {
  console.log("sll---layout = ", event.target.value)
  layout = event.target.value
  avCvs.updateLayoutType(layout as ILayoutType)
})

let outputResolution = (document.querySelector('#outputResolution') as HTMLSelectElement).value
document.querySelector('#outputResolution')?.addEventListener('change', (event: any) => {
  outputResolution = event.target.value
})

let outputFramerate = (document.querySelector('#outputFramerate') as HTMLSelectElement).value
document.querySelector('#outputFramerate')?.addEventListener('change', (event: any) => {
  outputFramerate = event.target.value
})

document.querySelector('#startRecod')?.addEventListener('click', () => {
  ;(async () => {
    const width = outputResolution === '1080P' ? 1920 : 1280
    const height = outputResolution === '1080P' ? 1080 : 720
    const frameRate = outputFramerate === '25fps' ? 25 : 30
    let bitrate = 1_500_000
    if ((outputResolution === '1080P' && outputFramerate === '25fps')
      || (outputResolution === '720P' && outputFramerate === '30fps')) {
      bitrate = 2_000_000
    } else if (outputResolution === '1080P' && outputFramerate === '30fps') {
      bitrate = 2_500_000
    }

    recorder.updateConf({
      width: width,
      height: height,
      bitrate: bitrate,
      expectFPS: frameRate
    })

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
