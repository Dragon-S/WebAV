import mp4box from 'mp4box'
import { autoReadStream, file2stream, recodemux } from 'avrecorder-cliper'
import { TClearFn, EWorkerMsg, IWorkerOpts } from './types'

if (import.meta.env.DEV) {
  mp4box.Log.setLogLevel(mp4box.Log.debug)
}

enum State {
  Preparing = 'preparing',
  Running = 'running',
  Stopped = 'stopped'
}

class RecoderPauseCtrl {
  // 当前帧的偏移时间，用于计算帧的 timestamp
  #offsetTime = performance.now()

  // 编码上一帧的时间，用于计算出当前帧的持续时长
  #lastTime = this.#offsetTime

  // 用于限制 帧率
  #frameCnt = 0

  // 如果为true，则暂停编码数据
  // 取消暂停时，需要减去
  #paused = false

  // 触发暂停的时间，用于计算暂停持续了多久
  #pauseTime = 0

  constructor() { }

  play() {
    if (!this.#paused) return
    this.#paused = false

    this.#offsetTime += performance.now() - this.#pauseTime
    this.#lastTime += performance.now() - this.#pauseTime
  }

  pause() {
    if (this.#paused) return
    this.#paused = true
    this.#pauseTime = performance.now()
  }

  transfrom(frame: VideoFrame, maxFPS: number) {
    const now = performance.now()
    const offsetTime = now - this.#offsetTime
    if (
      this.#paused ||
      // 避免帧率超出期望太高
      (this.#frameCnt / offsetTime) * 1000 > maxFPS
    ) {
      frame.close()
      return
    }

    const vf = new VideoFrame(frame, {
      // timestamp 单位 微秒
      timestamp: offsetTime * 1000,
      duration: (now - this.#lastTime) * 1000
    })
    this.#lastTime = now

    this.#frameCnt += 1
    frame.close()
    return {
      vf,
      opts: { keyFrame: this.#frameCnt % 30 === 0 }
    }
  }
}

const VIDEO_PAUSE_CTRL = new RecoderPauseCtrl()

let STATE = State.Preparing

// 当前是否处于暂停状态
let PAUSED = false

let clear: TClearFn | null = null
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
      clear?.()
      self.postMessage({ type: EWorkerMsg.SafeExit })
      break
    case EWorkerMsg.Paused:
      PAUSED = data
      if (data) {
        VIDEO_PAUSE_CTRL.pause()
      } else {
        VIDEO_PAUSE_CTRL.play()
      }
  }
}

function init (opts: IWorkerOpts, onEnded: TClearFn): TClearFn {
  let stopEncodeVideo: TClearFn | null = null
  let stopEncodeAudio: TClearFn | null = null

  const recoder = recodemux({
    video: opts.video,
    audio: opts.audio,
    bitrate: opts.bitrate ?? 2_000_000
  })

  const maxFPS = opts.video.expectFPS * 1.1

  let stoped = false
  if (opts.streams.video != null) {
    stopEncodeVideo = autoReadStream(opts.streams.video, {
      onChunk: async (chunk: VideoFrame) => {
        if (stoped) {
          chunk.close()
          return
        }
        const vfWrap = VIDEO_PAUSE_CTRL.transfrom(chunk, maxFPS)
        if (vfWrap == null) {
          chunk.close()
          return
        }

        recoder.encodeVideo(vfWrap.vf, vfWrap.opts)
        chunk.close()
      },
      onDone: () => {}
    })
  }

  if (opts.audio != null && opts.streams.audio != null) {
    stopEncodeAudio = autoReadStream(opts.streams.audio, {
      onChunk: async (ad: AudioData) => {
        if (stoped || PAUSED) {
          ad.close()
          return
        }
        recoder.encodeAudio(ad)
        ad.close()
      },
      onDone: () => {}
    })
  }

  const { stream, stop: stopStream } = file2stream(
    recoder.mp4file,
    opts.timeSlice,
    () => {
      exit()
      onEnded()
    }
  )
  self.postMessage(
    {
      type: EWorkerMsg.OutputStream,
      data: stream
    },
    // @ts-expect-error
    [stream]
  )

  function exit () {
    stoped = true

    stopEncodeVideo?.()
    stopEncodeAudio?.()
    recoder.close()
    stopStream()
  }

  return exit
}
