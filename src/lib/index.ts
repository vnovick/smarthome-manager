export * from './utils'
import { distinct } from './utils'
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
  wemoOptions?: Object
}

export type DeviceType = {
  type: Devices
  options?: DeviceOptions
}

export type SSDPClient = {
  on: Function
}

export type StateListener = {
  id: String
  listener: Function
  listenProp?: String
}

export class Statefull {
  state: any = {}
  protected stateListeners: StateListener[] = []

  changeState(state: any, listenProp?: String) {
    const oldState = this.state
    this.state = {
      ...this.state,
      ...state
    }
    this.stateListeners.forEach(({ listenProp, listener }) => {
      if (listenProp && this.state[`${listenProp}`] !== oldState[`${listenProp}`]) {
        listener(this.state[`${listenProp}`])
      } else {
        listener(this.state)
      }
    })
  }

  subscribeToState(listener: Function, listenProp?: String) {
    const listenerId = new Date().getTime().toString()
    this.stateListeners = [...this.stateListeners, { id: listenerId, listener, listenProp }]
    return listenerId
  }

  removeStateListener(id: String) {
    this.stateListeners = this.stateListeners.filter(listener => listener.id !== id)
  }
}
