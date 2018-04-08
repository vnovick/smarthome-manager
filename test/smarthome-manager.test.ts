import { SmartHomeManager } from '../src/smarthome-manager'

/**
 * Dummy test
 */
describe('Dummy test', () => {
  it('works if true is truthy', () => {
    expect(true).toBeTruthy()
  })

  it('SmartHomeManager is instantiable', () => {
    expect(new SmartHomeManager([])).toBeInstanceOf(SmartHomeManager)
  })
})
