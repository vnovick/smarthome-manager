import { Controller, DeviceOptions, Statefull } from '../lib'
import { Control } from 'magic-home'

export enum PatternList {
  seven_color_cross_fade = 'seven_color_cross_fade',
  red_gradual_change = 'red_gradual_change',
  green_gradual_change = 'green_gradual_change',
  blue_gradual_change = 'blue_gradual_change',
  yellow_gradual_change = 'yellow_gradual_change',
  cyan_gradual_change = 'cyan_gradual_change',
  purple_gradual_change = 'purple_gradual_change',
  white_gradual_change = 'white_gradual_change',
  red_green_cross_fade = 'red_green_cross_fade',
  red_blue_cross_fade = 'red_blue_cross_fade',
  green_blue_cross_fade = 'green_blue_cross_fade',
  seven_color_strobe_flash = 'seven_color_strobe_flash',
  red_strobe_flash = 'red_strobe_flash',
  green_strobe_flash = 'green_strobe_flash',
  blue_stobe_flash = 'blue_stobe_flash',
  yellow_strobe_flash = 'yellow_strobe_flash',
  cyan_strobe_flash = 'cyan_strobe_flash',
  purple_strobe_flash = 'purple_strobe_flash',
  white_strobe_flash = 'white_strobe_flash',
  seven_color_jumping = 'seven_color_jumping'
}

export interface EffectInterface {
  start(interval: Function): void
  setColor(red: String, green: String, blue: String): any
  delay(milliseconds: number): void
  stop(): void
}

export interface IMagicHomeController extends Controller, Control {
  turnOn(): Promise<any>
  turnOff(): Promise<any>
  setColor(red: number, green: number, blue: number): Promise<any>
  setColorWithBrightness(red: number, green: number, blue: number, brightness: number): Promise<any>
  setPattern(pattern: PatternList, speed: number): Promise<any>
  queryState(): Promise<any>
  startEffectMode(): Promise<any>
}

export interface Control {
  turnOn(callback: Function): void
  turnOff(callback: Function): void
  setColor(red: number, green: number, blue: number, callback: Function): void
  setColorWithBrightness(
    red: number,
    green: number,
    blue: number,
    brightness: number,
    callback: Function
  ): void
  setPattern(pattern: PatternList, speed: number, callback: Function): void
  queryState(callback: Function): void
  startEffectMode(callback: Function): void
}

export class MagicHomeController extends Statefull implements IMagicHomeController {
  ip: String
  control: Control

  constructor(options: DeviceOptions | undefined) {
    super()
    if (options === undefined) {
      throw new Error('No options provided to MagicHomeController')
    }
    this.ip = options.ip as String
    this.control = new Control(options.ip)
  }

  turnOn() {
    return new Promise((resolve, reject) => {
      this.control.turnOn((err: any, response: any) => {
        if (err) {
          reject(err)
        } else {
          resolve(response)
        }
      })
    })
  }

  turnOff() {
    return new Promise((resolve, reject) => {
      this.control.turnOff((err: any, response: any) => {
        if (err) {
          reject(err)
        } else {
          resolve(response)
        }
      })
    })
  }

  setColor(red: number, green: number, blue: number) {
    return new Promise((resolve, reject) => {
      this.control.setColor(red, green, blue, (err: any, response: any) => {
        if (err) {
          reject(err)
        } else {
          resolve(response)
        }
      })
    })
  }
  setColorWithBrightness(red: number, green: number, blue: number, brightness: number) {
    return new Promise((resolve, reject) => {
      this.control.setColorWithBrightness(
        red,
        green,
        blue,
        brightness,
        (err: any, response: any) => {
          if (err) {
            reject(err)
          } else {
            resolve(response)
          }
        }
      )
    })
  }
  setPattern(pattern: PatternList, speed: number) {
    return new Promise((resolve, reject) => {
      this.control.setPattern(pattern, speed, (err: any, response: any) => {
        if (err) {
          reject(err)
        } else {
          resolve(response)
        }
      })
    })
  }

  queryState() {
    return new Promise((resolve, reject) => {
      this.control.queryState((err: any, response: any) => {
        if (err) {
          reject(err)
        } else {
          resolve(response)
        }
      })
    })
  }

  startEffectMode() {
    return new Promise((resolve, reject) => {
      this.control.startEffectMode((effectMode: EffectInterface) => {
        resolve(effectMode)
      })
    })
  }
}
