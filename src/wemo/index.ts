import {
  Controller,
  DeviceOptions,
  DeviceType,
  Statefull,
  StateListener
} from '../lib'
import * as Wemo from 'wemo-client'
export interface IWemoController extends Controller {
  connect(): Promise<any>
  getEndDevices(): Promise<any>
  getBrightness(): Promise<any>
  setBrightness(brightness: number): Promise<any>
  getAttributes(): Promise<any>
  getDeviceStatus(deviceId: String): Promise<any>
  setDeviceStatus(
    deviceId: String,
    capability: String,
    value: String
  ): Promise<any>
  setLightColor(
    deviceId: String,
    red: String,
    green: String,
    blue: String
  ): Promise<any>
  getInsightParams(): Promise<any>
  setAttributes(attributes: Object): Promise<any>
  getBinaryState(client: any): Promise<any>
}

export type WemoOptions = {
  setupUrl: String
  wemoOptions?: any
}

export type Wemo = {
  discover: Function
  client: Function
  load: Function
}

export type AttributeList = {
  name: String
  value: String
  prevalue: String
  timestamp: String
}

export type InsightParams = {
  binaryState: String
  instantPower: String
  data: Object
}

export class WemoController extends Statefull implements IWemoController {
  setupUrl: String | undefined

  wemo: Wemo

  constructor(options: WemoOptions) {
    super()
    if (options === undefined) {
      throw new Error('No options provided to WemoController')
    }
    const defaultOptions = {
      port: 1900,
      discover_opts: {
        unicastBindPort: 1900
      }
    }
    this.setupUrl = options && options.setupUrl
    this.wemo = new Wemo(options.wemoOptions || defaultOptions)
  }

  async connect() {
    try {
      const deviceInfo = await this.wemoLoad(this.setupUrl as string)
      const client = this.wemo.client(deviceInfo)
      const binaryState = await this.getBinaryState(client)
      this.state = {
        ...this.state,
        ...{
          deviceInfo,
          activeClient: client,
          binaryState
        }
      }
      client.on('binaryState', (binaryState: number) =>
        this.changeState({
          binaryState
        })
      )
      client.on('attributeList', (...attributeList: AttributeList[]) => {
        this.changeState({
          attributes: {
            ...attributeList
          }
        })
      })
      client.on('insightParams', (...insightParams: InsightParams[]) => {
        this.changeState({
          insightParams: {
            ...insightParams
          }
        })
      })
      client.on(
        'statusChange',
        (deviceId: String, capabilityId: String, value: String) => {
          this.changeState({
            status: {
              deviceId,
              value,
              capabilityId
            }
          })
        }
      )
      client.on('error', (error: any) => this.changeState({ error }))
      return this.state
    } catch (e) {
      throw new Error(e)
    }
  }

  getEndDevices() {
    return new Promise((resolve, reject) => {
      this.state.activeClient.getEndDevices((err: any, result: any[]) => {
        if (err) {
          reject(err)
        } else {
          resolve(result)
        }
      })
    })
  }

  getBrightness() {
    return new Promise((resolve, reject) => {
      this.state.activeClient.getBrightness((err: any, value: number) => {
        if (err) {
          reject(err)
        } else {
          resolve(value)
        }
      })
    })
  }

  setBrightness(brightness: number) {
    return new Promise((resolve, reject) => {
      this.state.activeClient.setBrightness(
        brightness,
        (err: any, value: number) => {
          if (err) {
            reject(err)
          } else {
            resolve(value)
          }
        }
      )
    })
  }

  getAttributes() {
    return new Promise((resolve, reject) => {
      this.state.activeClient.getBrightness((err: any, value: number) => {
        if (err) {
          reject(err)
        } else {
          resolve(value)
        }
      })
    })
  }

  getDeviceStatus(deviceId: String) {
    return new Promise((resolve, reject) => {
      this.state.activeClient.getDeviceStatus(
        deviceId,
        (err: any, value: number) => {
          if (err) {
            reject(err)
          } else {
            resolve(value)
          }
        }
      )
    })
  }

  setDeviceStatus(deviceId: String, capability: String, value: String) {
    return new Promise((resolve, reject) => {
      this.state.activeClient.setDeviceStatus(
        deviceId,
        capability,
        value,
        (err: any, value: number) => {
          if (err) {
            reject(err)
          } else {
            resolve(value)
          }
        }
      )
    })
  }

  setLightColor(deviceId: String, red: String, green: String, blue: String) {
    return new Promise((resolve, reject) => {
      this.state.activeClient.setLightColor(
        deviceId,
        red,
        green,
        blue,
        (err: any, value: number) => {
          if (err) {
            reject(err)
          } else {
            resolve(value)
          }
        }
      )
    })
  }

  getInsightParams() {
    return new Promise((resolve, reject) => {
      this.state.activeClient.getInsightParams((err: any, value: number) => {
        if (err) {
          reject(err)
        } else {
          resolve(value)
        }
      })
    })
  }

  setAttributes(attributes: Object) {
    return new Promise((resolve, reject) => {
      this.state.activeClient.setAttributes((err: any, value: number) => {
        if (err) {
          reject(err)
        } else {
          resolve(value)
        }
      })
    })
  }

  getBinaryState(client: any) {
    return new Promise((resolve, reject) => {
      client.getBinaryState((err: any, value: number) => {
        if (err) {
          this.changeState({
            errors: err
          })
          reject(err)
        } else {
          resolve(value)
        }
      })
    })
  }

  setBinaryState(binaryState: number, autoConnect: Boolean = false) {
    return new Promise((resolve, reject) => {
      this.state.activeClient.setBinaryState(binaryState, (value: String) => {
        resolve(value)
        this.changeState({
          binaryState
        })
      })
    })
  }

  private wemoLoad(setupUrl: string) {
    return new Promise((resolve, reject) => {
      this.wemo.load(setupUrl, (err: any, deviceInfo: any) => {
        if (err) {
          throw new Error(err)
        }
        resolve(deviceInfo)
      })
    })
  }
}
