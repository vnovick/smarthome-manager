# SmartHome Manager

[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)
<!-- [![Greenkeeper badge](https://badges.greenkeeper.io/vnovick/smarthome-manager.svg)](https://greenkeeper.io/) -->
[![Travis](https://travis-ci.org/vnovick/smarthome-manager.svg?branch=master)](https://travis-ci.org/vnovick/smarthome-manager)



## Project consolidates several SmartHome devices brands into one manager

> Built for **Node** environment since one of the brands requires to actually run your own server to parse requests

# Supported Brands 

## PhilipsHue
[<img src="https://i.imgur.com/hhu3KRr.png" width="100px">](https://www2.meethue.com/en-us)

Philips Hue is a high end smart home supplier supplying huge variety of devices from simple dimmable leds to complex sensors etc. 

Philips Hue devices use [Zigbee](https://en.wikipedia.org/wiki/Zigbee) protocol to communicate between themselves and the bridge. [Bridge](https://www2.meethue.com/en-us/p/hue-bridge/046677458478) is connected to local network. Communication between devices and the bridge is done solely through the bridge by using Philips hue REST API.

SmartHome Manager abstracts this api to be available through `async` calls on `HueController` object.
for example:


[<img src="https://i.imgur.com/enuh4u8.png" width="100px">](http://www.belkin.com/us/Products/home-automation/c/wemo-home-automation/)

Wemo is home automation branch by Belkin which works over local Wifi by sending [SOAP](https://en.wikipedia.org/wiki/SOAP) requests from and to device. Wemo also has a Bridge that gives an ability to interact with various devices

Wemo part of `smarthome-manager` is an abstraction and syntactic sugar over [wemo-client](https://github.com/timonreinhard/wemo-client) library that enables more easier API

[<img src="https://i.imgur.com/gWfWpzI.png" width="100px">](https://www.amazon.com/s/ref=nb_sb_noss_2?url=search-alias%3Dmi&field-keywords=magic+home)

MagicHome is a series of Chinese manufactured low end light bulbs that connects to your local wifi through setup process and then is available through tcp socket. 
library uses under the hood [magic-home](https://github.com/jangxx/node-magichome) library and abstrats things on top of it


# Setup & Discovery

Before setting everything up it's important to understand which devices you want to consolidate inside a bridge. If you have `PhilipsHue` and `Wemo`, you can choose to use `smarthome-manager` [autoDiscovery](#AutoDiscovery) mode. If you have magicHome too unfortunately you have to find out to which IP it's connected. Read about this in [Discovery](#Discovery) section

## Install

```bash
# npm
npm install smarthome-manager --save

#yarn

yarn add smarthome-manager
```

> Bring in `smarthome-manager` into your project

```javascript
// in babel transpiled Node Environment or Typescript
import { SmartHomeManager } from 'smarthome-manager'

// in Node without traspilation

const { SmartHomeManager } = require('smarthome-manager')
```


## Configuration

> SmartHomeManager Object receives an array of [`DeviceOptions`]() with [`Devices`]() type and special options for each device. 

> :exclamation: Currently Wemo supports only one device


```typescript
const manager = new SmartHomeManager(DeviceType[], Config)
```

> And the example:

```javascript
import { SmartHomeManager, Devices } from 'smarthome-manager'


const manager = new SmartHomeManager([{
  type: Devices.philipsHue,
  options: {
    userName: "n3fnnJQzwEqeFtJ1J4cRIo1O98bztFp5R8TT109y",
    ip: "10.0.0.1"
  }
}, {
  type: Devices.wemo,
  options: {
    setupUrl: 'http://10.0.0.10:49154/setup.xml',
  }
}, {
  type: Devices.magicHome,
  options: {
    ip: "10.0.0.3"
  }
}],{
  onReady: (state, controllers) => {
    
  }
})
```

In this example IPs of all devices are already known. `smarthome-manager` constructs `SmartHomeControllers` object available as a second argument in onReady function. Then you are free to access the following controllers and call methods on them:

- [`philipsHueController`]()
- [`wemoController`]()
- [`magicHomeController`]()


## Discovery

In order to discover Ips of all your devices you need to basically sniff your network for packet data. It can be done by enabling proxy between your mobile phone with controlling app for each device. For MagicHome it's the most complicated process since you cannot use regular tools like [CharlesProxy](https://www.charlesproxy.com/) and need to use [WireShark](https://www.wireshark.org/) to sniff actual TCP packet transfer data.

Below are steps if you use MacOS and have an Iphone. If you are on Windows and use Android you will use different steps that will be added here later on.


- Create new interface for your device UUID

```bash
instruments -s devices
# Known Devices:
# MyPhone(11.2.6) [c93402350920923402342094]
rvictl -s c93402350920923402342094
# Starting device c93402350920923402342094 [SUCCEEDED] with interface rvi0
ifconfig rvi0
```

- Open [WireShark](https://www.wireshark.org/)

![Wireshark Image]()

MagicHome uses port `5577` so in order to sniff packet data and get the actual device Ip we can enable the following filter in Wireshark: `tcp.port == 5577 || udp.port === 5577`

![Wireshark Image]()

:celebration: Congratulations: You got your MagicHome IP


#### Philips Hue and Wemo Devices

Both Philips Hue and Wemo Devices are discoverable by sniffing [UPNP](https://en.wikipedia.org/wiki/Universal_Plug_and_Play) services in your local network. Philips Hue also has [Broker Service](https://www.meethue.com/api/nupnp) you can use to discover Hue Bridge IP


# AutoDiscovery

`smarthome-manager` has autoDiscovery mode for both PhilipsHue and Wemo devices. it uses external SSDP Client that should be passed into `SmartHomeManager` so basically you can switch the client to the one of your choice. 

```typescript
export type ManagerOptions = {
  onReady?: Function
  SSDPClient?: any
  ssdpOptions?: any
  autoDiscovery?: Boolean
}
```


# Examples and Usage

For convenience all examples are divided by smarthome device and looks as it is written in onReady function after destructuring controllers from second arguments. 

```javascript
//...
onReady: (state, controllers) => {
  const {
    philipsHueController,
    wemoController,
    magicHomeController
  } = controllers
}
//...
```
___

## PhilipsHue

> Philips Hue API is available [here](https://www.developers.meethue.com/philips-hue-api)

Library abstracts only basic API calls. rest api calls are available by calling `hueAuthorizedApiCall` or `hueRawApiCall` methods to access any Philips Hue functionality

```typescript
export interface IHueController extends Controller {
  generateUser(devicetype: String): Promise<any>
  getHueState(): Promise<any>
  toggleHueState(lightId: number, state: HueStateObject): Promise<any>
  hueAuthorizedApiCall(endpoint: String, options: RequestInit): Promise<any>
  hueRawApiCall(endpoint: String, options: RequestInit): Promise<any>
}
```


### Examples


> Generate new user for api (initially there is no user unless it's passed in `DeviceOptions`) 
:exclamation: It's important to physically press link button on Hue bridge as mentioned [here](https://www.developers.meethue.com/documentation/getting-started)

```javascript
    // By using promises

    philipsHueController.generateUser("test-app").then(user => {
      console.log(user)
    })

    //Async await

    const response = await philipsHueController.generateUser("test-app")
```

> Toggle state `{on: true }`(see [`HueState`]() for available options) of lightbulb with `id=2`  for available options

```javascript
    // By using promises

    philipsHueController.toggleHueState(2, {
      on: true
    }).then(response => {
      console.log(response)
    })


    //Async await

    const response = await 
      philipsHueController.toggleHueState(2, { state: on })
```

> Use for any authorized Philips Hue call. Accepts regular fetch request options for second argument


```javascript
    // By using promises

    philipsHueController.hueAuthorizedApiCall('groups').then(response => {
      console.log(response)
    })
    

    //Async await

    const response = await philipsHueController.hueAuthorizedApiCall("test-app")
```


> Use for unauthorized Philips Hue call. Accepts regular fetch request options for second argument


```javascript
    // By using promises

    philipsHueController.hueRawApiCall("username").then(user => {
      console.log(user)
    })

    //Async await

    const response = await philipsHueController.hueRawApiCall("username")
```
___

## Magic Home

MagicHomeControllers implements the following interface and abstracts usage of [magic-home]() library

```typescript
export interface IMagicHomeController extends Controller, Control {
  turnOn(): Promise<any>
  turnOff(): Promise<any>
  setColor(red: number, green: number, blue: number): Promise<any>
  setColorWithBrightness(red: number, green: number, blue: number, brightness: number): Promise<any>
  setPattern(pattern: PatternList, speed: number): Promise<any>
  queryState(): Promise<any>
  startEffectMode(): Promise<any>
}
```

### Examples

> Turn light Off by accessing raw `magic-home` library using callbacks

```javascript
  magicHomeController.control.turnOff(function(err,success){
    console.log(err, success)
  })
```

> Promise abstraction on top

```javascript

  magicHomeController.turnOn().then(response => {
    console.log(response)
  })

```


> Set Light Color

```javascript
  magicHomeController.setColor(255,255,255).then((response) => {
    console.log(response)
  })
```

> Set both color and brightness

```javascript
  magicHomeController.setColorWithBrightness(255,255,255, 100).then((response) => {
    console.log(response)
  })
```

> Set pattern out of PatternList

```javascript
  magicHomeController.setPattern(PatternList.blue_gradual_change, 100).then(response => {
    console.log(response)
  })
```

Pattern List you can use:

```typescript
export enum PatternList {
  seven_color_cross_fade = 'seven_color_cross_fade',
  red_gradual_change = 'red_gradual_change',
  green_gradual_change = 'green_gradual_change',
  blue_gradual_change = 'blue_gradual_change',
  yellow_gradual_change = 'yellow_gradual_change',
  cyan_gradual_change = 'cyan_gradual_change',
  purple_gradual_change = 'purple_gradual_change',
  white_gradual_change = 'white_gradual_change',
  red_green_cross_fade = 'red_green_cross_fade',
  red_blue_cross_fade = 'red_blue_cross_fade',
  green_blue_cross_fade = 'green_blue_cross_fade',
  seven_color_strobe_flash = 'seven_color_strobe_flash',
  red_strobe_flash = 'red_strobe_flash',
  green_strobe_flash = 'green_strobe_flash',
  blue_stobe_flash = 'blue_stobe_flash',
  yellow_strobe_flash = 'yellow_strobe_flash',
  cyan_strobe_flash = 'cyan_strobe_flash',
  purple_strobe_flash = 'purple_strobe_flash',
  white_strobe_flash = 'white_strobe_flash',
  seven_color_jumping = 'seven_color_jumping'
}
```

> Query light state

```javascript
  magicHomeController.queryState().then(response => {
    console.log(response)
  })
```

___

##  Wemo

library use under the hoode [`wemo-client`]() library 

```typescript
export interface IWemoController extends Controller {
  connect(): Promise<any>
  getEndDevices(): Promise<any>
  getBrightness(): Promise<any>
  setBrightness(brightness: number): Promise<any>
  getAttributes(): Promise<any>
  getDeviceStatus(deviceId: String): Promise<any>
  setDeviceStatus(deviceId: String, capability: String, value: String): Promise<any>
  setLightColor(deviceId: String, red: String, green: String, blue: String): Promise<any>
  getInsightParams(): Promise<any>
  setAttributes(attributes: Object): Promise<any>
  getBinaryState(client: any): Promise<any>
}
```


### Examples

> Connect and set binary state 
```javascript
  wemoController.connect().then(result => {
      console.log(result)
      wemoController.setBinaryState(0)
    }
  )
```
__

# Subscriptions

All controllers inherit from `StateFull` class and hence have subscription behavior

```javascript
subscribeToState
removeStateListener
```

```javascript
    // Subscribe to state
    const listenerId = wemoController.subscribeToState((binaryState) => {
      console.log(binaryState)
    }, 'binaryState')

    //Remove Listener
    wemoController.removeStateListener(listenerId)
```

:exclamation: Subscriptions for all state changes are not yet finished

### RoadMap
- Finish subscriptions for all state changes
- Add full test Coverage
- Perform physical tests on all available Philips Hue, Wemo and Magic Home available devices
- Wrap additional Philips Hue Apis
- Add GraphQL Helpers to simplify building GraphQL server
- Improve Documentation



### Contributing

Contributing is really welcomed since I don't have all smarthome devices to physically test. Also library lacks basic tests so tests are really welcomed.

Library is based on the package [typescript-library-starter]() so all testing, coverage reporting guidelines are listed there.

[Read more](./CONTRIBUTING.md)

## Resources

### Presentation at ReactAmsterdam: 
- Slides: [smarthome-manager-presentation.surge.sh](smarthome-manager-presentation.surge.sh)
- Video: **TBD**
- presentation repo: [https://github.com/vnovick/smarthome-manager-presentation](https://github.com/vnovick/smarthome-manager-presentation)


## Credits

Made with :heart: by [@vnovick](https://twitter.com/VladimirNovick)

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore -->
<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/kentcdodds/all-contributors) specification. Contributions of any kind are welcome!
