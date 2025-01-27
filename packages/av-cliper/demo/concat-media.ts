import { AudioClip, ImgClip, MP4Clip, concatAudioClip } from '../src/clips'
import { Combinator } from '../src/combinator'
import { Log } from '../src/log'
import { OffscreenSprite } from '../src/offscreen-sprite'
import { renderTxt2ImgBitmap } from '../src/dom-utils'
import { EmbedSubtitlesClip } from '../src/clips/embed-subtitles-clip'
import { playOutputStream } from './play-video'

// const cvs = document.querySelector('canvas') as HTMLCanvasElement
// const ctx = cvs.getContext('2d')!

const playerContiner = document.querySelector('#player-continer')!

document.querySelector('#mp4-img')?.addEventListener('click', evt => {
  ;(async () => {
    const resList = ['./public/video/webav1.mp4', './public/img/bunny.png']
    const { updateState, loadStream } = playOutputStream(
      resList,
      playerContiner
    )

    const spr1 = new OffscreenSprite(
      'spr1',
      new MP4Clip((await fetch(resList[0])).body!)
    )
    const spr3 = new OffscreenSprite(
      'spr3',
      new ImgClip(
        await createImageBitmap(await (await fetch(resList[1])).blob())
      )
    )
    // 初始旋转 180°
    spr3.rect.angle = Math.PI
    spr3.setAnimation(
      {
        from: { angle: Math.PI, x: 0, y: 0, opacity: 1 },
        to: { angle: Math.PI * 2, x: 300, y: 300, opacity: 0 }
      },
      { duration: 3 }
    )

    const spr4 = new OffscreenSprite(
      'spr4',
      new ImgClip(
        await renderTxt2ImgBitmap(
          '水印',
          `font-size:40px; color: white; text-shadow: 2px 2px 6px red;`
        )
      )
    )
    spr4.setAnimation(
      {
        '0%': { x: 0, y: 0 },
        '25%': { x: 1200, y: 680 },
        '50%': { x: 1200, y: 0 },
        '75%': { x: 0, y: 680 },
        '100%': { x: 0, y: 0 }
      },
      { duration: 4, iterCount: 1 }
    )
    spr4.zIndex = 10
    spr4.opacity = 0.5

    const com = new Combinator({
      width: 1280,
      height: 720,
      bgColor: 'white'
    })

    await com.add(spr4, { offset: 0, duration: 5 })
    await com.add(spr1, { offset: 0, duration: 35 })
    await com.add(spr3, { offset: 35, duration: 3 })

    com.on('OutputProgress', v => {
      console.log('----- progress:', v)
      updateState(`progress: ${Math.round(v * 100)}%`)
    })
    await loadStream(com.output())
  })().catch(Log.error)
})

document.querySelector('#mp4-mp3')?.addEventListener('click', () => {
  ;(async () => {
    const resList = [
      './public/video/webav1.mp4',
      './public/audio/44.1kHz-2chan.mp3'
    ]
    const { updateState, loadStream } = playOutputStream(
      resList,
      playerContiner
    )

    // const resp1 = await fetch('./public/video/pri-bunny_avc_frag.mp4')
    const resp1 = await fetch(resList[0])
    const spr1 = new OffscreenSprite('spr1', new MP4Clip(resp1.body!))

    const resp2 = await fetch(resList[1])
    const spr2 = new OffscreenSprite(
      'spr2',
      new AudioClip(resp2.body!, {
        // volume: 2,
        loop: true
      })
    )
    const com = new Combinator({
      width: 1280,
      height: 720
    })
    await com.add(spr1, { duration: 10, main: true })
    await com.add(spr2)

    com.on('OutputProgress', v => {
      console.log('----- progress:', v)
      updateState(`progress: ${Math.round(v * 100)}%`)
    })
    await loadStream(com.output())
  })().catch(Log.error)
})

document.querySelector('#mix-audio')?.addEventListener('click', () => {
  ;(async () => {
    const resList = [
      './public/audio/44.1kHz-2chan.m4a',
      './public/audio/16kHz-1chan.mp3'
    ]
    const { updateState, loadStream } = playOutputStream(
      resList,
      playerContiner
    )

    const resp1 = await fetch(resList[0])
    const resp2 = await fetch(resList[1])
    const spr1 = new OffscreenSprite(
      '1',
      new AudioClip(resp1.body!, { volume: 0.5 })
    )
    const spr2 = new OffscreenSprite('2', new AudioClip(resp2.body!))

    const com = new Combinator({ width: 1280, height: 720 })
    await com.add(spr1, { offset: 0, duration: 5 })
    await com.add(spr2, { offset: 0, duration: 4 })

    com.on('OutputProgress', v => {
      console.log('----- progress:', v)
      updateState(`progress: ${Math.round(v * 100)}%`)
    })
    await loadStream(com.output())
  })().catch(Log.error)
})

document.querySelector('#concat-audio')?.addEventListener('click', () => {
  ;(async () => {
    const resList = [
      './public/audio/16kHz-1chan.mp3',
      './public/audio/44.1kHz-2chan.m4a'
    ]
    const { updateState, loadStream } = playOutputStream(
      resList,
      playerContiner
    )

    const clip = await concatAudioClip(
      await Promise.all(
        resList.map(async url => new AudioClip((await fetch(url)).body!))
      )
    )
    const spr1 = new OffscreenSprite('1', clip)

    const com = new Combinator({ width: 1280, height: 720 })
    await com.add(spr1, { offset: 0, duration: 30 })

    com.on('OutputProgress', v => {
      console.log('----- progress:', v)
      updateState(`progress: ${Math.round(v * 100)}%`)
    })
    await loadStream(com.output())
  })().catch(Log.error)
})

document.querySelector('#gif-m4a')?.addEventListener('click', () => {
  ;(async () => {
    const resList = [
      './public/img/animated.gif',
      './public/audio/44.1kHz-2chan.m4a'
    ]
    const { updateState, loadStream } = playOutputStream(
      resList,
      playerContiner
    )

    const resp1 = await fetch(resList[0])
    const spr1 = new OffscreenSprite(
      's1',
      new ImgClip({ type: 'image/gif', stream: resp1.body! })
    )
    const resp2 = await fetch(resList[1])
    const spr2 = new OffscreenSprite('s2', new AudioClip(resp2.body!))
    const com = new Combinator({ width: 1280, height: 720 })
    await com.add(spr1, { duration: 10, offset: 0 })
    await com.add(spr2, { duration: 10, offset: 0 })

    com.on('OutputProgress', v => {
      console.log('----- progress:', v)
      updateState(`progress: ${Math.round(v * 100)}%`)
    })
    await loadStream(com.output())
  })()
})

document.querySelector('#mp4-srt')?.addEventListener('click', () => {
  ;(async () => {
    const resList = [
      './public/video/webav1.mp4',
      './public/subtitles/test-sample.srt'
    ]
    const { updateState, loadStream } = playOutputStream(
      resList,
      playerContiner
    )

    const resp1 = await fetch(resList[0])
    const spr1 = new OffscreenSprite('s1', new MP4Clip(resp1.body!))
    const resp2 = await fetch(resList[1])
    const spr2 = new OffscreenSprite(
      's2',
      new EmbedSubtitlesClip(await resp2.text(), {
        videoWidth: 1280,
        videoHeight: 720,
        fontSize: 44,
        fontFamily: 'Noto Sans SC',
        stroke: {
          color: '#000'
        },
        textShadow: {
          offsetX: 2,
          offsetY: 2,
          blur: 4,
          color: 'rgba(0,0,0,0.25)'
        }
      })
    )
    const com = new Combinator({ width: 1280, height: 720 })
    await com.add(spr1, { duration: 10, offset: 0 })
    await com.add(spr2, { duration: 10, offset: 0 })

    com.on('OutputProgress', v => {
      console.log('----- progress:', v)
      updateState(`progress: ${Math.round(v * 100)}%`)
    })
    await loadStream(com.output())
  })()
})
