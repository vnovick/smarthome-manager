import { Controller, DeviceOptions } from '../lib'

export interface IHueController extends Controller {}

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

export class HueController implements IHueController {
  username: String = ''

  private hueEndPoint: string

  constructor(options: DeviceOptions | undefined) {
    if (options === undefined) {
      throw new Error('No options provided to HueController')
    }
    this.username = options.userName as string
    this.hueEndPoint = `http://${options.ip as string}/api`
  }

  async generateUser(devicetype: String) {
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

  async toggleHueState(lightId: number, state: HueStateObject) {
    try {
      console.log(`${this.hueEndPoint}/${this.username}/lights/state`)
      const response = await fetch(
        `${this.hueEndPoint}/${this.username}/lights/${lightId}/state`,
        { method: 'PUT', body: JSON.stringify(state) }
      )
      const rsp = await response.json()
      console.log(rsp)
    } catch (e) {
      throw new Error(e)
    }
  }
}
