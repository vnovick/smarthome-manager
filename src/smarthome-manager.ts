// Import here Polyfills if needed. Recommended core-js (npm i -D core-js)
// import "core-js/fn/array.find"
// ...
import { Controller, Devices, DeviceOptions, DeviceType, SSDPClient, Statefull } from './lib'
import { camelize, distinct, NOOP } from './lib/utils'
import { IHueController, HueBridge, HueStateObject, HueController } from './philipsHue'
import { WemoController, IWemoController, WemoOptions } from './wemo'
import { MagicHomeController, IMagicHomeController, PatternList } from './magicHome'

export type StateListener = {
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

class SmartHomeManager extends Statefull {
  state = {
    wemo: [],
    hue: {
      bridge: {},
      options: {}
    },
    magicHome: {}
  }

  get deviceList(): any {
    return {
      hue: this.state.hue,
      wemo: this.wemoDeviceList,
      magicHome: this.getOptionsForDevice(Devices.magicHome)
    }
  }

  get controllersList(): SmartHomeControllers {
    return this.controllers
  }

  private devices: DeviceType[] = []

  private ssdpClient: SSDPClient | any = null

  private HueBridge: HueBridge = {
    ip: null
  }

  private controllers: SmartHomeControllers = {}

  private wemoDeviceList: WemoOptions[] = []

  private managerOptions: ManagerOptions = {
    autoDiscovery: false
  }

  constructor(devices: DeviceType[], options: ManagerOptions = {}) {
    super()
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

  private handleSSDPResponse(msg: any, statusCode: any, rinfo: any) {
    if (msg[`HUE-BRIDGEID`]) {
      this.HueBridge = {
        ip: rinfo.address,
        bridgeId: msg[`HUE-BRIDGEID`]
      }
    }

    if (msg.ST && msg.ST === 'urn:Belkin:service:basicevent:1') {
      this.wemoDeviceList = [
        ...this.wemoDeviceList,
        {
          setupUrl: msg.LOCATION,
          wemoOptions: this.devices
            .filter(device => device.type === Devices.wemo)
            .reduce((acc, device) => device).options
        }
      ].filter((value, index, self) => self.indexOf(value) === index)
    }

    let state = {}

    if (this.deviceTypes.some(device => device.type === Devices.philipsHue)) {
      state = {
        ...state,
        hue: {
          bridge: this.HueBridge,
          options: this.devices.reduce((acc: Object, device: DeviceType) => {
            if (device.type === Devices.philipsHue) {
              return device.options || {}
            }
            return acc
          }, {})
        }
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

  // Works only with autodiscovery
  private discoverAllSSDP(cb: Function): any {
    if (!this.ssdpClient) {
      throw new Error('Trying to access autodiscovery even though SSDP is not defined')
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
                  this.devices.some(device => device.type === Devices.philipsHue) &&
                  this.HueBridge.ip !== null
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

  private async generateControllers(onReadyCb: Function, ctrlOptions?: DeviceOptions) {
    let controllers = {}

    if (this.hasWemo) {
      const options = this.getOptionsForDevice(Devices.wemo)
      controllers = {
        ...controllers,
        wemoController: new WemoController(
          this.managerOptions.autoDiscovery ? this.state.wemo[0] : options
        )
      }
    }
    if (this.hasHue) {
      const options = this.getOptionsForDevice(Devices.philipsHue)
      controllers = {
        ...controllers,
        philipsHueController: new HueController(
          this.managerOptions.autoDiscovery
            ? {
                ...this.state.hue.options,
                ip: this.HueBridge.ip
              }
            : options
        )
      }
    }
    if (this.hasMagicHome) {
      const options = this.getOptionsForDevice(Devices.magicHome)
      controllers = {
        ...controllers,
        magicHomeController: new MagicHomeController(options)
      }
    }

    this.controllers = controllers
    onReadyCb(this.state, controllers)
  }

  private getOptionsForDevice(deviceType: Devices) {
    return this.devices.reduce((acc: any, device: any) => {
      if (device.type === deviceType) {
        return {
          ...acc,
          ...device.options
        }
      }
      return acc
    }, {})
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
  IHueController,
  IMagicHomeController,
  IWemoController,
  SmartHomeManager,
  SSDPClient,
  PatternList,
  ManagerOptions
}
