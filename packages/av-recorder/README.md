# AVRecorder

Record MediaStream to MP4, Use Webcodecs API encode VideoFrame and AudioData, [mp4box.js](https://github.com/gpac/mp4box.js) as muxer.
录制 MediaStream 到 MP4，使用 Webcodecs API 编码 VideoFrame、AudioData，mp4box.js 封装。

## Example
Record camera & microphone, save data to MP4 file.
录制摄像头和麦克风，保存为 MP4 文件。

```ts
import { AVRecorder } from 'avrecorder-recorder'

// MediaStream from: getUserMedia, displayMedia, VideoHTMLElement.captureStream, VideoCanvasElement.captureStream, AVCanvas.captureStream etc...
const mediaStream = await navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true
})

const recorder = new AVRecorder(mediaStream, {
  width: 1280,
  height: 720,
})
await recorder.start()

// pause recording
recorder.pause()

// resume recording
recorder.resume()

const fileHandle = await window.showSaveFilePicker({
  suggestedName: `av-recorder.mp4`
})

recorder.outputStream
  .pipeTo(await fileHandle.createWritable())


// await recorder.stop()
```

## Demo
[Record camera & microphone](https://github.com/Dragon-S/WebAV/demo/record-usermedia.html)
[Demo code](./demo/record-usermedia.ts)