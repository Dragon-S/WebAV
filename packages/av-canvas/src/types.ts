export interface IPoint { x: number, y: number }

export interface IResolution { width: number, height: number }

export interface ICvsRatio { w: number, h: number }

export enum ILayoutType {
    SIDEBYSIDE=  "sidebyside", //侧边栏
    FLOOTING = "floating", //宫格
    FULLSCREEN = "fullscreen", //全屏
  }
