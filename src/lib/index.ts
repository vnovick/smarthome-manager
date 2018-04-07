export * from './utils'
export interface Controller {}

export enum Devices {
  philipsHue = 'philipsHue',
  wemo = 'wemo',
  magicHome = 'magicHome'
}

export type DeviceOptions = {
  ip?: String | null
  setupUrl?: String
  userName?: String
}

export type DeviceType = {
  type: Devices
  options?: DeviceOptions
}

export type SSDPClient = {
  on: Function
}
