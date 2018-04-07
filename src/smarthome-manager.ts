// Import here Polyfills if needed. Recommended core-js (npm i -D core-js)
// import "core-js/fn/array.find"
// ...
import {
  Controller,
  Devices,
  DeviceOptions,
  DeviceType,
  SSDPClient
} from './lib'
import { camelize, distinct, NOOP } from './lib/utils'
import {
  IHueController,
  HueBridge,
  HueStateObject,
  HueController
} from './philipsHue'
import { WemoController, IWemoController, WemoDevices } from './wemo'
import { MagicHomeController, IMagicHomeController } from './magicHome'

type StateListener = {
  id: String
  listener: Function
}

type ManagerOptions = {
  onReady?: Function
  SSDPClient?: any
  ssdpOptions?: any
  autoDiscovery?: Boolean
}

export type SmartHomeControllers = {
  [index: string]: {
    wemoController?: IWemoController
    hueController?: IHueController
    magicHomeController?: IMagicHomeController
  }
}

class SmartHomeManager {
  devices: DeviceType[] = []

  ssdpClient: SSDPClient | any = null

  ssdpServices: Object[] = []

  HueBridge: HueBridge = {
    ip: null
  }

  wemoDeviceList: WemoDevices[] = []

  managerOptions: ManagerOptions = {
    autoDiscovery: false
  }

  // Basic immutability
  state = {
    wemo: this.wemoDeviceList,
    hue: this.HueBridge,
    magicHome: {}
  }

  controllers: SmartHomeControllers = {}

  private stateListeners: StateListener[] = []

  constructor(devices: DeviceType[], options: ManagerOptions = {}) {
    this.validateDevices(devices)
    this.devices = devices
    this.managerOptions = options
    const cb = options.onReady || NOOP

    if (options && options.SSDPClient && options.autoDiscovery) {
      this.ssdpClient = new options.SSDPClient(options.ssdpOptions || {})
      this.ssdpClient.on('response', this.handleSSDPResponse)
      this.discoverAllSSDP(cb)
    } else {
      this.generateControllers(cb)
    }
  }

  // Public API
  get deviceTypes() {
    return this.devices
  }

  getController(type: Devices): Controller {
    return this.controllers[`${camelize(type)}Controller`] as Controller
  }

  private validateDevices(devices: DeviceType[]): any {
    devices.forEach(({ type }) => {
      if (!Object.values(Devices).includes(type)) {
        throw new Error(
          `Wrong Device type passed to constructor: ${type}. Should be one of ${Object.values(
            Devices
          )}`
        )
      }
      return true
    })
  }

  private changeState(state: any) {
    this.state = state
    this.stateListeners.forEach(listenerObj => {
      listenerObj.listener(this.state)
    })
  }

  private handleSSDPResponse(msg: any, statusCode: any, rinfo: any) {
    if (msg[`HUE-BRIDGEID`]) {
      this.HueBridge = {
        ip: rinfo.address,
        bridgeId: msg[`HUE-BRIDGEID`]
      }
    }

    if (msg.ST && msg.ST === 'urn:Belkin:service:basicevent:1') {
      this.wemoDeviceList = [...this.wemoDeviceList, msg.LOCATION].filter(
        (value, index, self) => self.indexOf(value) === index
      )
    }

    let state = {}

    if (this.deviceTypes.some(device => device.type === Devices.philipsHue)) {
      state = {
        ...state,
        hue: this.HueBridge
      }
    }

    if (this.deviceTypes.some(device => device.type === Devices.wemo)) {
      state = {
        ...state,
        wemo: this.wemoDeviceList
      }
    }
    this.changeState(state)
  }

  private subscribeToState(listener: Function) {
    const listenerId = new Date().getTime().toString()
    this.stateListeners = distinct(
      [...this.stateListeners, { id: listenerId, listener }],
      'id'
    )
    return listenerId
  }

  private removeStateListener(id: String) {
    this.stateListeners = this.stateListeners.filter(
      listener => listener.id !== id
    )
  }

  // Works only with autodiscovery
  private discoverAllSSDP(cb: Function): any {
    if (!this.ssdpClient) {
      throw new Error(
        'Trying to access autodiscovery even though SSDP is not defined'
      )
    }
    this.ssdpClient.removeAllListeners('response')
    const listenerId = this.subscribeToState((response: any) => {
      if (
        this.devices
          .map(device => {
            switch (device.type) {
              case Devices.wemo: {
                return (
                  this.devices.some(device => device.type === Devices.wemo) &&
                  this.wemoDeviceList.length > 0
                )
              }
              case Devices.philipsHue: {
                return (
                  this.devices.some(
                    device => device.type === Devices.philipsHue
                  ) && this.HueBridge.ip !== null
                )
              }
              default:
                return true
            }
          })
          .reduce((acc, flag) => acc && flag)
      ) {
        this.generateControllers(cb)
        this.removeStateListener(listenerId)
      }
    })
    this.ssdpClient.on('response', this.handleSSDPResponse.bind(this))
    if (this.hasWemo) {
      this.ssdpClient.search('urn:Belkin:service:basicevent:1')
    } else {
      this.ssdpClient.search('ssdp:all')
    }
  }

  private generateControllers(
    onReadyCb: Function,
    ctrlOptions?: DeviceOptions
  ) {
    let options: {
      wemo?: DeviceOptions
      philipsHue?: DeviceOptions
      magicHome?: DeviceOptions
    }

    if (this.managerOptions.autoDiscovery) {
      options = this.devices.reduce((acc, device) => {
        return {
          ...acc,
          [camelize(device.type)]: {
            ...device.options,
            setupUrl: device.type === Devices.wemo ? this.state.wemo[0] : null,
            ip:
              device.type === Devices.philipsHue
                ? this.state.hue.ip
                : device.type === Devices.wemo
                  ? this.state.wemo[0]
                  : device.options && device.options.ip
          }
        }
      }, {})
    } else {
      options = this.devices.reduce((acc, device) => {
        return {
          ...acc,
          [camelize(device.type)]: device.options
        }
      }, {})
    }
    let controllers = {}

    if (this.hasWemo) {
      controllers = {
        ...controllers,
        wemoController: new WemoController(
          options[Devices.wemo] as any,
          this.ssdpClient
        )
      }
    }
    if (this.hasHue) {
      controllers = {
        ...controllers,
        philipsHueController: new HueController(options[
          Devices.philipsHue
        ] as any)
      }
    }
    if (this.hasMagicHome) {
      controllers = {
        ...controllers,
        magicHomeController: new MagicHomeController(options[
          Devices.magicHome
        ] as any)
      }
    }

    this.controllers = controllers
    onReadyCb(this.state, controllers)
  }

  private get hasWemo() {
    return this.devices.some(device => device.type === Devices.wemo)
  }

  private get hasHue() {
    return this.devices.some(device => device.type === Devices.philipsHue)
  }

  private get hasMagicHome() {
    return this.devices.some(device => device.type === Devices.magicHome)
  }
}

export {
  Devices,
  DeviceOptions,
  DeviceType,
  SmartHomeManager,
  SSDPClient,
  ManagerOptions
}
