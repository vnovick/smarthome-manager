import { Controller, DeviceOptions } from '../lib'
import { Control } from 'magic-home'

export interface IMagicHomeController extends Controller {}

export class MagicHomeController implements IMagicHomeController {
  ip: String
  control: Function

  constructor(options: DeviceOptions | undefined) {
    if (options === undefined) {
      throw new Error('No options provided to MagicHomeController')
    }
    this.ip = options.ip as String
    this.control = new Control(options.ip)
  }
}
