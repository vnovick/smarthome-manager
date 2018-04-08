import { Controller, DeviceOptions, Devices, Statefull } from '../lib'

export interface IHueController extends Controller {
  getHueState(): Promise<any>
  generateUser(devicetype: String): Promise<any>
  toggleHueState(lightId: number, state: HueStateObject): Promise<any>
  hueAuthorizedApiCall(endpoint: String, options: RequestInit): Promise<any>
  hueRawApiCall(endpoint: String, options: RequestInit): Promise<any>
}

export type HueBridge = {
  bridgeId?: String
  ip: String | null
}

export type HueStateObject = {
  on: Boolean
  sat: number
  bri: number
  hue: number
}

export class HueController extends Statefull implements IHueController {
  username: String = ''

  private hueEndPoint: string

  constructor(options: DeviceOptions | undefined) {
    super()
    if (options === undefined) {
      throw new Error('No options provided to HueController')
    }
    this.username = options.userName as string
    this.hueEndPoint = `http://${options.ip as string}/api`
    if (this.username) {
      this.getHueState()
    }
  }

  async getHueState() {
    const lights = await this.hueAuthorizedApiCall('lights')
    const groups = await this.hueAuthorizedApiCall('groups')
    const sensors = await this.hueAuthorizedApiCall('sensors')
    this.changeState({
      lights,
      sensors,
      groups
    })
    return this.state
  }

  async generateUser(devicetype: String): Promise<any> {
    try {
      const response = await fetch(this.hueEndPoint, {
        method: 'POST',
        body: JSON.stringify({ devicetype })
      })
      const rsp = await response.json()
      if (rsp[0].success) {
        this.username = rsp[0].success.username
      }
      return rsp
    } catch (e) {
      throw new Error(e)
    }
  }

  async toggleHueState(lightId: number, state: HueStateObject): Promise<any> {
    try {
      const response = await fetch(
        `${this.hueEndPoint}/${this.username}/lights/${lightId}/state`,
        {
          method: 'PUT',
          body: JSON.stringify(state)
        }
      )
      const rsp = await response.json()
      return rsp
    } catch (e) {
      throw new Error(e)
    }
  }

  async hueAuthorizedApiCall(
    endpoint: String,
    options: RequestInit = { method: 'GET' }
  ): Promise<any> {
    try {
      const response = await fetch(
        `${this.hueEndPoint}/${this.username}/${endpoint}`,
        options
      )
      return await response.json()
    } catch (e) {
      throw new Error(e)
    }
  }

  async hueRawApiCall(
    endpoint: String,
    options: RequestInit = { method: 'GET' }
  ): Promise<any> {
    try {
      const response = await fetch(`${this.hueEndPoint}/${endpoint}`, options)
      return await response.json()
    } catch (e) {
      throw new Error(e)
    }
  }
}
