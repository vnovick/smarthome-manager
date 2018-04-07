import { Controller, DeviceOptions, SSDPClient } from '../lib'

export interface IWemoController extends Controller {}

export type WemoDevices = {}

export class WemoController implements IWemoController {
  setupUrl: String
  ssdpClient: SSDPClient

  wemoRegistry = {
    activeClient: null,
    state: null,
    deviceInfo: null,
    errors: null
  }

  constructor(options: DeviceOptions | undefined, Client: SSDPClient) {
    if (options === undefined || !Client) {
      throw new Error('No options provided to WemoController')
    }
    this.setupUrl = options.setupUrl as String
    this.ssdpClient = Client
  }
}
