export interface IPoint { x: number, y: number }

export interface IResolution { width: number, height: number }

export interface ICvsRatio { w: number, h: number }

export enum AVCanvasLayoutMode {
  SIDEBYSIDE = 0, //侧边栏
  GALLERY = 1, //宫格
  FULLSCREEN = 2, //全屏
  SPEAKER = 3, //演讲者
  FLOOTING = 4, //悬浮
}
