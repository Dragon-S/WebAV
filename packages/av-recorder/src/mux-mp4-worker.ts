import mp4box from 'mp4box'
import { autoReadStream, file2stream, recodemux } from '@webav/av-cliper'
import { TAsyncClearFn, TClearFn, EWorkerMsg, IWorkerOpts } from './types'

if (import.meta.env.DEV) {
  mp4box.Log.setLogLevel(mp4box.Log.debug)
}

enum State {
  Preparing = 'preparing',
  Running = 'running',
  Stopped = 'stopped'
}

let STATE = State.Preparing

let clear: TAsyncClearFn | null = null
self.onmessage = async (evt: MessageEvent) => {
  const { type, data } = evt.data

  switch (type) {
    case EWorkerMsg.Start:
      if (STATE === State.Preparing) {
        STATE = State.Running
        clear = init(data, () => {
          STATE = State.Stopped
        })
      }
      break
    case EWorkerMsg.Stop:
      STATE = State.Stopped
      await clear?.()
      self.postMessage({ type: EWorkerMsg.SafeExit })
      break
  }
}

function init (opts: IWorkerOpts, onEnded: TClearFn): TAsyncClearFn {
  let stopEncodeVideo: TClearFn | null = null
  let stopEncodeAudio: TClearFn | null = null

  // opts.audio = null
  const recoder = recodemux({
    video: opts.video,
    audio: opts.audio,
    bitrate: opts.bitrate ?? 2_000_000
  })
  recoder.onEnded = onEnded

  if (opts.streams.video != null) {
    const encode = encodeVideoFrame(opts.video.expectFPS, recoder.encodeVideo)
    stopEncodeVideo = autoReadStream(opts.streams.video, {
      onChunk: async vf => {
        encode(vf)
      },
      onDone: () => {}
    })
  }

  if (opts.audio != null && opts.streams.audio != null) {
    stopEncodeAudio = autoReadStream(opts.streams.audio, {
      onChunk: async ad => {
        recoder.encodeAudio(ad)
      },
      onDone: () => {}
    })
  }

  const { stream, stop: stopStream } = file2stream(
    recoder.mp4file,
    opts.timeSlice,
    onEnded
  )
  self.postMessage(
    {
      type: EWorkerMsg.OutputStream,
      data: stream
    },
    // @ts-expect-error
    [stream]
  )

  return async () => {
    stopEncodeVideo?.()
    stopEncodeAudio?.()
    stopStream()
  }
}

function encodeVideoFrame (expectFPS: number, encode: VideoEncoder['encode']) {
  let frameCount = 0
  const startTime = performance.now()
  let lastTime = startTime

  const maxFPS = expectFPS * 1.1

  let frameCnt = 0
  return (frame: VideoFrame) => {
    const now = performance.now()
    const offsetTime = now - startTime
    // 避免帧率超出期望太高
    if ((frameCnt / offsetTime) * 1000 > maxFPS) {
      frame.close()
      return
    }

    const vf = new VideoFrame(frame, {
      // timestamp 单位 微妙
      timestamp: offsetTime * 1000,
      duration: (now - lastTime) * 1000
    })
    lastTime = now

    encode(vf, { keyFrame: frameCount % 150 === 0 })
    frameCnt += 1
    vf.close()
    frame.close()
    frameCount += 1
  }
}
