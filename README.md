node-linking
===============

The node-linking is a Node.js module which allows you to communicate with the BLE devices supporting the Linking Profile developed by Linking Project (NTT DoCoMo) in Japan.

The [Linking Profile](https://linkingiot.com/developer/en/api.html) is a BLE profile mainly used for IoT devices such as LEDs, buttons, a variety of sensors, and so on. Though Linking Project provides documents in English, the [Linking devices](https://linkingiot.com/en/devices.html) are available only in Japan for now.

The node-linking exposes APIs which allow you to access your Linking devices easily. You do not have to know the details of the Linking Profile.

## Supported OS

The node-linking works on Linux-based OSes, such as Raspbian, Ubuntu, and so on. Unfortunately, this module does not work on Windows and Mac OS.

## Dependencies

* [Node.js](https://nodejs.org/en/) 6 +
* [noble](https://github.com/sandeepmistry/noble)

See the document of the [noble](https://github.com/sandeepmistry/noble) for details on installing the [noble](https://github.com/sandeepmistry/noble).

Note that the noble has to be run as root on most of Linux environments. Though the default user of Raspbian `pi` can run the noble on Raspbian, noarmal users can not access the BLE using the noble generally. See the the document of the [noble](https://github.com/sandeepmistry/noble) for details.

## Installation

```
$ cd ~
$ npm install noble
$ npm install node-linking
```

---------------------------------------
## Table of Contents

* [Quick Start](#Quick-Start)
  * [Discovering and connecting to a Linking device](#Quick-Start-1)
  * [Watching button actions](#Quick-Start-2)
  * [Watching sensor data](#Quick-Start-3)
  * [Turning on and off LEDs](#Quick-Start-4)
* [`Linking` object](#Linking-object)
  * [init() method](#Linking-init-method)
  * [discover(*[params]*) method](#Linking-discover-method)
  * [`ondiscover` event handler](#Linking-ondiscover-event-handler)
  * [scartScan(*[params]*) method](#Linking-startScan-method)
  * [stopScan() method](#Linking-stopScan-method)
  * [`onadvertisement` event handler](#Linking-onadvertisement-event-handler)
* [`LinkingDevice` object](#LinkingDevice-object)
  * [connect() method](#LinkingDevice-connect-method)
  * [disconnect() method](#LinkingDevice-disconnect-method)
  * [Properties](#LinkingDevice-properties)
  * [`onconnect` event handler](#LinkingDevice-onconnect-event-handler)
  * [`ondisconnect` event handler](#LinkingDevice-ondisconnect-event-handler)
* [`LinkingAdvertisement` object](#LinkingAdvertisement-object)
* [`LinkingServices` object](#LinkingServices-object)
* [`LinkingDeviceName` object](#LinkingDeviceName-object)
  * [get() method](#LinkingDeviceName-get-method)
  * [set() method](#LinkingDeviceName-set-method)
* [`LinkingBattery` object](#LinkingBattery-object)
  * [start() method](#LinkingBattery-start-method)
  * [`onnotify` property](#LinkingBattery-onnotify-property)
  * [stop() method](#LinkingBattery-stop-method)
* [`LinkingLed` object](#LinkingLed-object)
  * [`LinkingLedColors` object](#LinkingLedColors-object)
  * [`LinkingLedPatterns` object](#LinkingLedPatterns-object)
  * [turnOn() method](#LinkingLed-turnOn-method)
  * [turnOff() method](#LinkingLed-turnOff-method)
* [`LinkingVibration` object](#LinkingVibration-object)
  * [`LinkingVibrationPatterns` object](#LinkingVibrationPatterns-object)
  * [turnOn() method](#LinkingVibration-turnOn-method)
  * [turnOff() method](#LinkingVibration-turnOff-method)
* [`LinkingButton` object](#LinkingButton-object)
  * [`onnotify` property](#LinkingButton-onnotify-property)
* [`LinkingGyroscope` object](#LinkingGyroscope-object)
  * [start() method](#LinkingGyroscope-start-method)
  * [`onnotify` property](#LinkingGyroscope-onnotify-property)
  * [stop() method](#LinkingGyroscope-stop-method)
* [`LinkingAccelerometer` object](#LinkingAccelerometer-object)
  * [start() method](#LinkingAccelerometer-start-method)
  * [`onnotify` property](#LinkingAccelerometer-onnotify-property)
  * [stop() method](#LinkingAccelerometer-stop-method)
* [`LinkingOrientation` object](#LinkingOrientation-object)
  * [start() method](#LinkingOrientation-start-method)
  * [`onnotify` property](#LinkingOrientation-onnotify-property)
  * [stop() method](#LinkingOrientation-stop-method)
* [`LinkingTemperature` object](#LinkingTemperature-object)
  * [start() method](#LinkingTemperature-start-method)
  * [`onnotify` property](#LinkingTemperature-onnotify-property)
  * [stop() method](#LinkingTemperature-stop-method)
* [`LinkingHumidity` object](#LinkingHumidity-object)
  * [start() method](#LinkingHumidity-start-method)
  * [`onnotify` property](#LinkingHumidity-onnotify-property)
  * [stop() method](#LinkingHumidity-stop-method)
* [`LinkingPressure` object](#LinkingPressure-object)
  * [start() method](#LinkingPressure-start-method)
  * [`onnotify` property](#LinkingPressure-onnotify-property)
  * [stop() method](#LinkingPressure-stop-method)
* [Supported devices](#Supported-devices)
* [References](#References)
* [License](#License)

---------------------------------------
## <a id="Quick-Start">Quick Start</a>

### <a id="Quick-Start-1">Discovering and connecting to a Linking device</a>

This sample code shows how to discover your Linking device, how to connect to it, and how to disconnect it. This code also shows how to get the device name and how to know which services it supports.

```JavaScript
// Load the node-linking and get a `Linking` constructor object
const Linking = require('node-linking');
// Create a `Linking` object
const linking = new Linking();

// `LinkingDevice` object
let device = null;

// Initialize the `LinkingDevice` object
linking.init().then(() => {
  // Discover devices whose name starts with `Tukeru` for 5 seconds
  return linking.discover({
    duration: 5000,
    nameFilter: 'Tukeru'
  });
}).then((device_list) => {
  if(device_list.length > 0) {
    // `LinkingDevice` object representing the found device
    device = device_list[0];
    // The name of the device
    let name = device.advertisement.localName;
    console.log('`' + name + '` was found.');
    // Connect to the device
    console.log('Connecting to `' + name + '`...');
    return device.connect();
  } else {
    throw new Error('No device was found.');
  }
}).then(() => {
  console.log('Connected.');
  console.log('This device suports:');
  for(let service_name in device.services) {
    if(device.services[service_name]) {
      console.log('- ' + service_name);
    }
  }
  // Disconnect the device
  console.log('Disconnecting...');
  return device.disconnect();
}).then(() => {
  console.log('Disconnected');
}).catch((error) => {
  console.log('[ERROR] ' + error.message);
  console.error(error);
});
```

First of all, you have to create a [`Linking`](#Linking-object) object from the `Linking` constructor object. In the code above, the variable `linking` is the [`Linking`](#Linking-object) object.

 Calling the [`init()`](#Linking-init-method) method, the [`Linking`](#Linking-object) object becomes ready for use. Never forget to call the method. Note that the all asynchronous methods implemented in the [`Linking`](#Linking-object) object return a `Promise` object.

The [`discover()`](#Linking-discover-method) method of the [`Linking`](#Linking-object) object discovers Linking devices. It takes 2 parameters in the 1st argument (The both are optional). In the code above, the discovery process waits for 5 seconds (5,000 msec) and finds devices whose name starts with `Tukeru`.

In the code above, the variable `device` is a [`LinkingDevice`](#LinkingDevice-object) object representing the found device. You can get the device name from the [`LinkingDevice.advertisement.localName`](#LinkingAdvertisement-object) property.

At this moment, you are not able to interact with the device yet. You have to call the [`connect()`](#LinkingDevice-connect-method) method in order to interact with it. The method also investigates what type of device it is, which services it has, and so on. The process will take about 10 seconds.

Once the device is connected, you can call the all services supported by it. You can know the services supported by the device checking the [`LinkingDevice.services`](#LinkingServices-object) property.

The sample code above will output the result as follows:

```
`Tukeru_th0164271` was found.
Connecting to `Tukeru_th0164271`...
Connected.
This device suports:
- deviceName
- led
- battery
- temperature
- humidity
Disconnecting...
Disconnected
```

As you can see, the device supports some kind of services such as `led`, `vibrations`, `temperature`, etc.

Finally, you can disconnect the device using [`disconnect()`](#LinkingDevice-disconnect-method) method. The process is also asynchronous, it returns an `Promise` object.

### <a id="Quick-Start-2">Watching button actions</a>

Some Linking devices such as "Pochiru" equip a button. The Linking Profile supports to notify button actions on such devices. The code snippet blow shows how to watch the button actions.

```JavaScript
// Check if the device supports the button service
if(device.services.button) {
  // Set a function called whenever a notification comes from the device
  device.services.button.onnotify = (res) => {
    console.log(JSON.stringify(res, null, '  '));
  };
}
```

If you want to watch button actions, it is recommended to check the `LinkingDeivce.services.button` property. If the device supports the button service, a [`LinkingButton`](#LinkingButton-object) object is set to it, which exposes APIs for the button action on the device. If the device does not support the button service, `null` is set to it.

To watch button actions on the device, a callback function has to be set to the [`onnotify`](#LinkingButton-onnotify-property) property, which called whenever a notification comes from the device.

The code above will output the result as follows:

```
{
  "buttonId": 2,
  "buttonName": "SingleClick"
}
{
  "buttonId": 4,
  "buttonName": "DoubleClick"
}
{
  "buttonId": 7,
  "buttonName": "LongClick"
}
{
  "buttonId": 9,
  "buttonName": "LongClickRelease"
}
```

The Linking Profile supports a variety of button actions. As you can see, you can tell which type of action occurred on the device, such as a single click, a double click, a long click, etc.

### <a id="Quick-Start-3">Watching sensor data</a>

This sample code shows how to start sensor notifications and monitor sensor data coming form the device. In the code snippet, the variable `device` is a [`LinkingDevice`](#LinkingDevice-object) object representing the device.

Note that the code snippet blow works after connecting to the device.

```JavaScript
// Check if the device supports the temperature service
if(device.services.temperature) {
  // Set a function called whenever a notification comes from the device
  device.services.temperature.onnotify = (res) => {
    console.log(res.temperature + ' °C');
  };
  // Start notifications
  console.log('Starting to listen to notifications.');
  device.services.temperature.start().then((res) => {
    console.log('Now listening to notifications.');
  });

  // Stop notification in 10 seconds
  setTimeout(() => {
    device.services.temperature.stop().then((res) => {;
      console.log('Stopped to listen to notifications.');
      // Disconnect the device
      return device.disconnect();
    }).then(() => {
      console.log('Disconnected');
    }).catch((error) => {
      throw new Error('Failed to stop notifications');
    });
  }, 10000);
}
```

If you want to watch temperature sensor data, it is recommended to check the `LinkingDeivce.services.temperature` property. If the device supports the temperature service, a [`LinkingTemperature`](#LinkingTemperature-object) object is set to it, which exposes APIs for the temperature sensor in the device. If the device does not support the temperature service, `null` is set to it.

Before starting the notifications, a callback function has to be set to the [`onnotify`](#LinkingTemperature-onnotify-property) property, which called whenever a notification comes from the device.

Unlike the button service, the [`start()`](#LinkingTemperature-start-method) method has to be called. After starting notifications successfully, the function set to the `onnotify` property will be called whenever the temperature changes.

The [`stop()`](#LinkingTemperature-stop-method) method of the [`LinkingTemperature`](#LinkingTemperature-object) object stops notifications. When the notifications are not necessary, it is recommended to call the method. Otherwise, the power of the battery will be drained in vain.

The code snippet above will output the result as follows:

```
Starting to listen to notifications.
Now listening to notifications.
27.25 °C
Stpped to listen to notifications.
Disconnected
```

### <a id="Quick-Start-4">Turning on and off LEDs</a>

A LED is equipped in most of Linking devices. The Linking Profile supports turning on/off a LED on a device. The code blow shows how to turn on and off a LED with a color and a pattern.

```JavaScript
// Check if the device supports the LED service
if(device.services.led) {
  // Show the supported colors
  console.log('- Supported colors:');
  Object.keys(device.services.led.colors).forEach((color) => {
    console.log('  - ' + color);
  });

  // Show the supported patterns
  console.log('- Supported patterns:');
  Object.keys(device.services.led.patterns).forEach((pattern) => {
    console.log('  - ' + pattern);
  });

  // Turn on the LED
  device.services.led.turnOn('Red', 'Pattern1').then((res) => {
    console.log('The LED was turned on');
    // Turn off the LED in 5 seconds
    setTimeout(() => {
      device.services.led.turnOff().then(() => {
        console.log('The LED was turned off');
      }).catch((error) => {
        throw error;
      });
    }, 5000);
  }).catch((error) => {
    throw error;
  });
}
```

If you want to turn on/off a LED, it is recommended to check the `LinkingDeivce.services.led` property. If the device supports the LED service, the value will be a [`LinkingLed`](#LinkingLed-object) object exposing APIs for the LED on the device. Otherwise, it is set to `null'.

You can know the supported colors from the [`LinkingLed.colors`](#LinkingLedColors-object) and the supported patterns from the [`LinkingLed.patterns`](#LinkingLedPatterns-object).

Calling the [`turnOn()`](#LinkingLed-turnOn-method) method on the [`LinkingLed`](#LinkingLed-object) object, the LED will be turned on. Calling the [`turnOff()`](#LinkingLed-turnOff-method) method, the LED will be turned off.

You can pass a color and a pattern to the [`turnOn()`](#LinkingLed-turnOn-method) method. Running the code above, the LED will light up in red until the [`turnOff()`](#LinkingLed-turnOff-method) method is called.

The code above will output the result as follows:

```
- Supported colors:
  - Red
  - Green
- Supported patterns:
  - OFF
  - Pattern1
  - Pattern2
  - Pattern3
  - Pattern4
  - Pattern5
  - Pattern6
The LED was turned on
The LED was turned off
```

---------------------------------------
## <a id="Linking-object">`Linking` object</a>

In order to use the node-linking, you have to load the node-linking module as follows:

```JavaScript
const Linking = require('node-linking');
```

You can get an `Linking` constructor from the code above. Then you have to create an `Linking` object from the `Linking` constructor as follows:

```JavaScript
const linking = new Linking();
```

The `Linking` constructor takes an argument optionally. It must be a hash object containing the properties as follows:

Property | Type   | Required | Description
:--------|:-------|:---------|:-----------
`noble`  | Noble  | option   | a Noble object of the [`noble`](https://www.npmjs.com/package/noble) module

The node-linking module uses the [`noble`](https://www.npmjs.com/package/noble) module in order to interact with the Linking device(s) on BLE. If you want to interact other BLE devices using the noble module, you can create an `Noble` object by yourself, then pass it to this module. If you don't specify a `Noble` object to the `noble` property, this module automatically create a `Noble` object internally.

The sample code below shows how to pass a `Nobel` object to the `Linking` constructor.

```JavaScript
// Create a Noble object
const noble = require('noble');

// Create a Linking object
const Linking = require('node-linking');
const linking = new Linking({'noble': noble});
```

In the code snippet above, the variable `linking` is a `Linking` object. The `Linking` object has methods as described in sections below.

### <a id="Linking-init-method">init() method</a>

A `Linking` object is not ready to use initially. It has to be initialized using the `init()` method as below:

```JavaScript
linking.init().then(() => {
  // You can call methods implemented in the `Linking` object
}).catch((error) => {
  console.error(error);
});
```

The `init()` method returns a `Promise` object. Once the `Linking` object is initialized successfully, you can call methods as described in the sections below.

### <a id="Linking-discover-method">discover(*[params]*) method</a>

The `discover` method finds Linking devices. This method returns a `Promise` object. This method takes an argument which is a hash object containing parameters as follow:

Property     | Type   | Required | Description
:------------|:-------|:---------|:------------
`duration`   | Number | Optional | Duration for discovery process (msec). The default value is 5000 (msec).
`nameFilter` | String | Optional | If this value is set, the devices whose name (`localName`) does not start with the specified keyword will be ignored.
`idFilter`   | String | Optional | If this value is set, the device whose ID (`id`) does not start with the specified keyword will be ignored.
`quick`      | Boolean | Optional | If this value is `true`, this method finishes the discovery process when the first device is found, then calls the `resolve()` function without waiting the specified `duration`. The default value is `false`.

In the code snippet below, the `duration` and `nameFilter` are passed to the `discover()` method:

```JavaScript
linking.init().then(() => {
  return linking.discover({
    duration: 5000,
    nameFilter: 'Pochiru'
  });
}).then((device_list) => {
  // Do something...
}).catch((error) => {
  console.error(error);
});
```

If Linking devices whose names start with "`Pochiru`" are found in 5 seconds, an `Array` object will be passed to the `resolve()` function, which contains [`LinkingDevice`](#LinkingDevice-object) objects representing the found devices. See the section "[`LinkingDevice`](#LinkingDevice-object) objects" for more details.

If you want a quick response, you can set the `quick` property to `true`.

```JavaScript
linking.init().then(() => {
  return linking.discover({
    duration: 5000,
    idFilter: 'edcbe4062d8',
    quick: true
  });
}).then((device_list) => {
  // Do something...
}).catch((error) => {
  console.error(error);
});
```

In this case, it is assumed that you know the ID of the device in advance. As the `quick` property is set to `true`, the `resolve()` function will be called immediately after the targeted device is found regardless the value of the `duration` property.

### <a id="Linking-ondiscover-event-handler">`ondiscover` event hander</a>

The `ondiscover` property on the [`Linking`](#Linking-object) object is a event handler whenever a device is newly found in the discovery process. A [`LinkingDevice`](#LinkingDevice-object) object is passed to the callback function set to the `ondiscover` property.

```JavaScript
linking.init().then(() => {
  linking.ondiscover = (device) => {
    let ad = device.advertisement;
    console.log('- ' + ad.id + ': ' + ad.localName);
    console.log('---------------------------------------');
  };
  return linking.discover({
    duration: 10000
  });
}).then((device_list) => {
  console.log('The discovery process was finished.');
  console.log(device_list.length + ' devices were found.');
  process.exit();
}).catch((error) => {
  console.error(error);
});
```

The code snippet above will output the result as follows:

```JavaScript
- edcbe4062d81: Tomoru00 02410
---------------------------------------
- da498d14138b: Furueru0098348
---------------------------------------
- c80077af0fb4: Linking Board01 00195
---------------------------------------
- d22ef3a4b7b0: Pochiru02 00313
---------------------------------------
The discovery process was finished.
4 devices were found.
```

### <a id="Linking-startScan-method">scartScan(*[params]*) method</a>

The `startScan()` method starts to scan advertising packets from Linking devices. This method takes an argument which is a hash object containing parameters as follow:

Property     | Type   | Required | Description
:------------|:-------|:---------|:------------
`nameFilter` | String | Optional | If this value is set, advertising packets from the devices whose name (`localName`) does not start with the specified keyword will be ignored.
`idFilter`   | String | Optional | If this value is set, advertising packets from the devices whose ID (`id`) does not start with the specified keyword will be ignored.

Whenever a packet is received, the callback function set to the [`onadvertisement`](#Linking-onadvertisement-event-handler) property of the `Linking` object will be called. When a packet is received, an [`LinkingAdvertisement`](#LinkingAdvertisement-object) object will be passed to the callback function.

```JavaScript
// Set a callback function called when a packet is received
linking.onadvertisement = (ad) => {
  console.log(JSON.stringify(ad, null, '  '));
};

// Start to scan advertising packets from Linking devices
linking.startScan({
  nameFilter: 'Tukeru'
});

// Stop to scan in 30 seconds
setTimeout(() => {
  linking.stopScan();
  process.exit();
}, 30000);
```

The code snippet above will output the result as follows:

```
{
  "id": "df50d23f1b60",
  "uuid": "df50d23f1b60",
  "address": "df:50:d2:3f:1b:60",
  "localName": "Tukeru_th0164069",
  "serviceUuids": [
    "b3b3690150d34044808d50835b13a6cd"
  ],
  "txPowerLevel": -96,
  "rssi": -67,
  "distance": 0.03548133892335755,
  "version": 0,
  "vendorId": 0,
  "individualNumber": 164069,
  "beaconServiceId": 1,
  "beaconServiceData": {
    "name": "Temperature (°C)",
    "temperature": 25.875
  }
}
{
  "id": "df50d23f1b60",
  "uuid": "df50d23f1b60",
  "address": "df:50:d2:3f:1b:60",
  "localName": "Tukeru_th0164069",
  "serviceUuids": [
    "b3b3690150d34044808d50835b13a6cd"
  ],
  "txPowerLevel": -96,
  "rssi": -66,
  "distance": 0.03162277660168379,
  "version": 0,
  "vendorId": 0,
  "individualNumber": 164069,
  "beaconServiceId": 2,
  "beaconServiceData": {
    "name": "Humidity (%)",
    "humidity": 63
  }
}
```

### <a id="Linking-stopScan-method">stopScan() method</a>

The `stopScan()` method stops to scan advertising packets from Linking devices. See the section "[`startScan()` method](#Linking-startScan-method)" for details.

### <a id="Linking-onadvertisement-event-handler">`onadvertisement` event handler</a>

If a callback function is set to the `onadvertisement` property, the callback function will be called whenever an advertising packet is received from a Linking device during the scan is active (from the moment when the `startScan()` method is called, to the moment when the `stopScan()` method is called).

See the section "[`startScan()` method](#Linking-startScan-method)" for details.

---------------------------------------
## <a id="LinkingDevice-object">`LinkingDevice` object</a>

The `LinkingDevice` object represents a Linking device found by calling the [`discover()`](#Linking-discover-method) method of the [`Linking`](#Linking-object) object.

### <a id="LinkingDevice-connect-method">connect() method</a>

The `connect()` method establishes a connection with the device (i.e., pairing). This method returns a `Promise` object.

This method investigates what type of device it is, which services it provides, and so on. The process will take about 10 seconds. Once the pairing process finishes successfully, you can know the capabilities of the device and send commands to the device with the [properties](#LinkingDevice-properties) and methods implemented in the `LinkingDevice` object.

The code snippet below establishes a connection with a device, then it shows the device name and the supported services, finally it disconnects the device:

```JavaScript
device.connect().then(() => {
  console.log('- Device Name: ' + device.advertisement.localName);
  console.log('- Supported services:');
  Object.keys(device.services).forEach((service_name) => {
    if(device.services[service_name] !== null) {
      console.log('  - ' + service_name);
    }
  });
  return device.disconnect();
}).then(() => {
  console.log('Disconnected');
}).catch((error) => {
  console.error(error);
});
```

The result will be as follows:

```
- Device Name: Pochiru02 00313
- Supported Services:
  - deviceName
  - battery
  - led
  - button
Disconnected
```

### <a id="LinkingDevice-disconnect-method">disconnect() method</a>

The `disconnect()` method disconnects the device. This method returns a `Promise` object.  See the [previous section](#LinkingDevice-connect-method) for details.

### <a id="LinkingDevice-properties">Properties</a>

The `LinkingDevice` object implements the properties listed below:

Property        | Type     | Description
:---------------|:---------|-----------------------------
`advertisement` | [`LinkingAdvertisement`](#LinkingAdvertisement-object) | The object represents the advertisement packet received when the device was discovered. See the section "[`LinkingAdvertisement` object](#LinkingAdvertisement-object)" for details.
`connected`     | Boolean  | If the device is connected, the value is `true`. Otherwise, `false`.
`services`      | [`LinkingServices`](#LinkingServices-object) | See the section "[`LinkingServices` object](#LinkingServices-object)" for details.
[`onconnect`](#LinkingDevice-onconnect-event-handler)     | Function | The function set to this property will be called when the device is connected. The default value is `null`. See the section "[`onconnect` event handler](#LinkingDevice-onconnect-event-handler)" for details.
[`ondisconnect`](#LinkingDevice-ondisconnect-event-handler)  | Function | The function set to this property will be called when the device is disconnected. The default value is `null`. See the section "[`ondisconnect` event handler](#LinkingDevice-ondisconnect-event-handler)" for details.

### <a id="LinkingDevice-onconnect-event-handler">`onconnect` event handler</a>

The `onconnect` of the `LinkingDevice` object is an event handler called when the device is connected. The code snippet below shows how to use the `onconnect` event handler:

```JavaScript
// Set a callback function called when the device is connected
device.onconnect = () => {
  console.log('Connected.');
};

// Start to establish a connection with the device
device.connect();
```

Practically, the code snippet above and below do the same thing:

```JavaScript
device.connect().then(() => {
  console.log('Connected.');
});
```

### <a id="LinkingDevice-ondisconnect-event-handler">`ondisconnect` event handler</a>

The `ondisconnect` of the `LinkingDevice` object is an event handler called when the device is disconnected. The code snippet below shows how to use the `ondisconnect` event handler:

```JavaScript
device.ondisconnect = (reason) => {
  console.log('Disconnected.');
  console.dir(reason);
};
```

The code snippet above will output the result as follows:

```
Disconnected.
{ wasClean: true }
```

An object will be passed to the callback function set to the `ondisconnect`, which represents the reason why the device was disconnected. If the `disconnect()` method is called, the value of the `wasClean` property will be `true`. Otherwise, it will be `false`. That means the device was disconnected unexpectedly.

---------------------------------------
## <a id="LinkingAdvertisement-object">`LinkingAdvertisement` object</a>

The `LinkingAdvertisement` object represents an advertising data coming from the Linking device. This object is just a hash object containing properties as follows:

```JavaScript
{
  "id": "edcbe4062d81",
  "uuid": "edcbe4062d81",
  "address": "ed:cb:e4:06:2d:81",
  "localName": "Tomoru00 02410",
  "serviceUuids": [
    "b3b3690150d34044808d50835b13a6cd"
  ],
  "txPowerLevel": -66,
  "rssi": -59,
  "distance": 0.44668359215096315,
  "companyId": 738,
  "companyName": "NTT docomo",
  "version": 0,
  "vendorId": 0,
  "individualNumber": 2410,
  "beaconDataList": [
    {
      "name": "Pressed button information",
      "buttonId": 2,
      "buttonName": "SingleClick",
      "serviceId": 5
    }
  ]
}
```

Some properties are Linking-specific data:

Property            | Type   | Description
:-------------------|:-------|:-----------
`distance`          | Number | The distance (meter) from the host (which is running the node-linking) to the Linking device.
`companyId`         | Number | [Company Identifier](https://www.bluetooth.com/specifications/assigned-numbers/company-identifiers) assigned by Bluetooth SIG. As far as I know, all Linking devices set it to `783` (NTT docomo).
`companyName`       | String | Company Name corresponding to the Company Identifier. (e.g., "NTT docomo" or "Unknown")
`version`           | Number | Linking version number. Currently, the Linking Profile does not use this property. The specification says it is for future use. As far as I know, all Linking devices set it to `0`.
`vendorId`          | Number | Vendor Identifier dispensed by the Linking Project. As far as I know, all Linking devices set it to `0`.
`individualNumber`  | Number | Unique number for each individual device.
`beaconDataList`    | Array  | List of the linking service data. The structure of each service data depends on the `serviceId` described below.

### General Service (serviceId: `0`)

```JavaScript
  "beaconDataList": [
    {
      "name": "General",
      "serviceId": 0
    }
  ]
```

This service means that the device does not provide any meaningful information in the advertising data.

### Temperature Service (serviceId: `1`)

```JavaScript
  "beaconDataList": [
    {
      "name": "Temperature (°C)",
      "temperature": 26.75,
      "serviceId": 1
    }
  ]
```

### Humidity Service (serviceId: `2`)

```JavaScript
  "beaconDataList": [
    {
      "name": "Humidity (%)",
      "humidity": 48.375,
      "serviceId": 2
    }
  ]
```

### Air pressure Service (serviceId: `3`)

```JavaScript
  "beaconDataList": [
    {
      "name": "Air pressure (hPa)",
      "pressure": 996,
      "serviceId": 3
    }
  ]
```

### Remaining battery power (Threshold value or less) Service (serviceId: `4`)

```JavaScript
  "beaconDataList": [
    {
      "name": "Remaining battery power (Threshold value or less)",
      "chargeRequired": false,
      "chargeLevel": 0,
      "serviceId": 4
    }
  ]
```

Property         | Type    | Description
:----------------|:--------|:-----------
`chargeRequired` | Boolean | Indicating the device requires charging or not. If the value is `true`, it means "Charging required". Otherwise, it means "Charging not required".
`chargeLevel`    | Number  | The remaining battery power (%).

As far as I know, all Linking devices supporting this service report the same result as the sample above. That is, the `required` is always `false`, the `level` is always `0`. I'm not sure this service works well.

### Pressed button information Service (serviceId: `5`)

```
  "beaconDataList": [
    {
      "name": "Pressed button information",
      "buttonId": 2,
      "buttonName": "SingleClick",
      "serviceId": 5
    }
  ]
```

Properties   | Type    | Description
:------------|:--------|:-----------
`buttonId`   | Number  | The button ID representing a button type or a button action.
`buttonName` | String  | The meaning of the `buttonId`.

The possible combinations of `buttonId` and `buttonName` are described below:

`buttonId` | `buttonName`
:---------|:----------------------------
`1`       | `Power`
`2`       | `SingleClick`
`3`       | `Home`
`4`       | `DoubleClick`
`5`       | `VolumeUp`
`6`       | `VolumeDown`
`7`       | `LongClick`
`8`       | `Pause`
`9`       | `Power`
`10`      | `FastForward`
`11`      | `ReWind`
`12`      | `Shutter`
`13`      | `Up`
`14`      | `Down`
`15`      | `Left`
`16`      | `Right`
`17`      | `Enter`
`18`      | `Menu`
`19`      | `Play`
`20`      | `Stop`

### Opening/closing sensor information Service (serviceId: `6`)

For now, only [`Oshieru`](https://linkingiot.com/developer/en/devices.html) supports this service. But the beacon data seems to be encrypted. It seems that we, 3rd party developers, are not allowed to handle the beacon data directly.

### Human detection (Motion) sensor information Service (serviceId: `7`)

For now, there is no device supporting this service.

### Vibration sensor information Service (serviceId: `8`)

For now, only [`Kizuku`](https://linkingiot.com/developer/en/devices.html) supports this service. But the beacon data seems to be encrypted. It seems that we, 3rd party developers, are not allowed to handle the beacon data directly.

---------------------------------------
## <a id="LinkingServices-object">`LinkingServices` object</a>

The `LinkingServices` object contains objects representing services supported in the pairing mode by the device:

Property        | Type                                                   | Description
:---------------|:-------------------------------------------------------|:-----------
`deviceName`    | [`LinkingDeviceName`](#LinkingDeviceName-object)       | This object represents a device name service which enables you to get and update the device name. This service is supported by all Linking device.
`battery`       | [`LinkingBattery`](#LinkingBattery-object)             | This object represents a battery service which enables you to monitor changes of battery level. If the device does not support this service, this value is `null`.
`led`           | [`LinkingLed`](#LinkingLed-object)                     | This object represents a LED service which enables you to turn on/off the LED on the device. If the device does not support this service, this value is `null`.
`vibration`     | [`LinkingVibration`](#LinkingVibration-object)         | This object represents a vibration service which enables you to vibrate the device and turn off the vibration. If the device does not support this service, this value is `null`.
`button`        | [`LinkingButton`](#LinkingButton-object)               | This object represents a button service which enables you to monitor the changes of the button state. If the device does not support this service, this value is `null`.
`gyroscope`     | [`LinkingGyroscope`](#LinkingGyroscope-object)         | This object represents a gyroscope service which enables you to monitor the sensor data. If the device does not support this service, this value is `null`.
`accelerometer` | [`LinkingAccelerometer`](#LinkingAccelerometer-object) | This object represents a accelerometer service which enables you to monitor the sensor data. If the device does not support this service, this value is `null`.
`orientation`   | [`LinkingOrientation`](#LinkingOrientation-object)     | This object represents a orientation service which enables you to monitor the sensor data. If the device does not support this service, this value is `null`.
`temperature`   | [`LinkingTemperature`](#LinkingTemperature-object)     | This object represents a temperature service which enables you to monitor the sensor data. If the device does not support this service, this value is `null`.
`humidity`      | [`LinkingHumidity`](#LinkingHumidity-object)           | This object represents a humidity service which enables you to monitor the sensor data. If the device does not support this service, this value is `null`.
`pressure`      | [`LinkingPressure`](#LinkingPressure-object)           | This object represents a air pressure service which enables you to monitor the sensor data. If the device does not support this service, this value is `null`.

You can know which services are supported by the device checking if each property is `null` or not. The code snippet below checks if the temperature service is supported by the device.

```JavaScript
if(device.services.temperature) {
  console.log('The device supports the temperature service.');
} else {
  console.log('The device does not support the temperature service.');
}
```

Note that the device may not support some services in pairing mode despite the data sheet says such services are supported. For example, though [the data sheet of the `Sizuku THA` says it supports an air pressure sensor](https://linkingiot.com/developer/en/devices.html), it does not support the service in the pairing mode. It actually supports the service only in the beacon mode. That is, you can obtain the sensor data only from the advertising data coming from the device.

---------------------------------------
## <a id="LinkingDeviceName-object">`LinkingDeviceName` object</a>

This object exposes APIs which enable you to read and write the device name.

### <a id="LinkingDeviceName-get-method">`get()` method</a>

This method reads the device name set in the device.

```JavaScript
device.services.deviceName.get().then((res) => {
  console.log(res.deviceName);
}).catch((error) => {
  console.error(error);
});
```

If this method successfully executed, an object will be passed to the `resolve()` function, which contains the properties as follows:

Property     | Type   | Description
:------------|:-------|:-----------
`deviceName` | String | Device name

### <a id="LinkingDeviceName-set-method">`set(deviceName)` method</a>

This method writes the device name to the device. A new device name must be passed to this method as the first argument.

```JavaScript
device.services.deviceName.set('New name').then(() => {
  console.log('The new name was set successfully.');
}).catch((error) => {
  console.error(error);
});
```

---------------------------------------
## <a id="LinkingBattery-object">`LinkingBattery` object</a>

This object exposes APIs which enable you to watch the battery status.

### <a id="LinkingBattery-start-method">`start()` method</a>

This method starts to watch the changes of the battery status.

```JavaScript
device.services.battery.onnotify = (res) => {
  console.log(JSON.stringify(res, null, '  '));
};

device.services.battery.start().then(() => {
  if(res.resultCode === 0) {
    console.log('Started to watch the changes of the battery status.');
  } else {
    console.error(res.resultCode + ': ' + res.resultText);
  }
}).catch((error) => {
  console.error(error);
});
```

Before call the `start()` method, a call back function must be set to the [`onnotify`](#LinkingBattery-onnotify-property) property.

This method returns a `Promise` object. If a response comes from the device, the `resolve()` function will be called. The [`LinkingResponse`](#LinkingResponse-object) object will be passed to the function.

Note that the request is not necessarily accepted even if the `resolve()` function is called. It is recommended to check the value of the `resultCode` in the [`LinkingResponse`](#LinkingResponse-object) object.

The code snippet above will output the result like this:

```JavaScript
{
  chargeRequired: true,
  chargeLevel: 0
}
```

As you can see in the code snippet above, an object is passed to the `resolve()` function, which contains the properties as follows:

Property         | Type    | Description
:----------------|:--------|:-----------
`chargeRequired` | Boolean | Indicating the device requires charging or not. If the value is `true`, it means "Charging required". Otherwise, it means "Charging not required".
`chargeLevel`    | Number  | The remaining battery power (%).

As far as I know, only `Sizuku 6X` sends indicates for this request. But the value of the `chargeRequired` is always `true` and the value of the `chargeLevel` is always `0`. I'm not sure this service works well.

### <a id="LinkingBattery-onnotify-property">`onnotify` property</a>

After the `start()` method is called, the callback function set to the `onnotify` property will be called whenever a notification comes from the devices.

### <a id="LinkingBattery-stop-method">`stop()` method</a>

This method stops to watch the changes of the battery status.

```JavaScript
device.services.battery.stop().then(() => {
  console.log('Stopped');
}).catch((error) => {
  console.error(error);
});
```

---------------------------------------
## <a id="LinkingLed-object">`LinkingLed` object</a>

This object exposes APIs which enable you to turn on and off the LED(s) on the device.

### <a id="LinkingLedColors-object">`LinkingLedColors` property</a>

This property represents the supported colors of the LED as an `Array` object.

```JavaScript
console.dir(device.services.led.colors);
```

The code above will output the result like this:

```JavaScript
{ Red: 1, Green: 2 }
```

Each property name means a color name, each value means a color code. These values are required when you call the [`turnOn()`](#LinkingLed-start-method) method.

### <a id="LinkingLedPatterns-object">`LinkingLedPatterns` property</a>

This property represents the supported patterns of the LED as an `Array` object.

```JavaScript
console.dir(device.services.led.patterns);
```

The code above will output the result like this:

```JavaScript
{ OFF: 1,
  Pattern1: 2,
  Pattern2: 3,
  Pattern3: 4,
  Pattern4: 5,
  Pattern5: 6,
  Pattern6: 7 }
```

Each property name means a pattern name, each value means a pattern code. These names and values are required when you call the [`turnOn()`](#LinkingLed-start-method) method.

### <a id="LinkingLed-turnOn-method">`turnOn([colorName[, patternName[, duration]]])` method</a>

This method turns on the LED with the specified color and pattern.

```JavaScript
device.services.led.turnOn('Red', 'Pattern2', 30).then((res) => {
  if(res.resultCode === 0) {
    console.log('The LED was turned on successfully.');
  } else {
    console.error(res.resultCode + ': ' + res.resultText);
  }
}).catch((error) => {
  console.error(error);
})
```

The parameter `colorName` or the `patternName` was omitted, one of the supported colors or patterns is adopted automatically.

If the parameter `duration` is omitted, it is set to `5` (seconds) automatically. The Linking Profile accepts any one of `0`, `5`, `10`, `30`, `60`, or `180` (seconds) as the duration. If a value other than the allowed duration is specified, the nearest allowed duration is set automatically.

This method returns a `Promise` object. If a response comes from the device, the `resolve()` function will be called with the [`LinkingResponse`](#LinkingResponse-object) object.

Note that the request is not necessarily accepted even if the `resolve()` method is called. It is recommended to check the value of the `resultCode` property in the [`LinkingResponse`](#LinkingResponse-object) object.

### <a id="LinkingLed-turnOff-method">`turnOff()` method</a>

This method turns off the LED on the device.

```JavaScript
device.services.led.turnOff().then((res) => {
  if(res.resultCode === 0) {
    console.log('The LED was turned off successfully.');
  } else {
    console.error(res.resultCode + ': ' + res.resultText);
  }
}).catch((error) => {
  console.error(error);
})
```

This method returns a `Promise` object. If a response comes from the device, the `resolve()` function will be called with the [`LinkingResponse`](#LinkingResponse-object) object.

Note that the request is not necessarily accepted even if the `resolve()` method is called. It is recommended to check the value of the `resultCode` property in the [`LinkingResponse`](#LinkingResponse-object) object.

---------------------------------------
## <a id="LinkingVibration-object">`LinkingVibration` object</a>

This object exposes APIs which enable you to vibrate the device and stop the vibration.

### <a id="LinkingVibrationPatterns-object">`LinkingVibrationPatterns` property</a>

This property represents the supported patterns as an `Array` object.

```JavaScript
console.dir(device.services.led.patterns);
```

The code above will output the result like this:

```JavaScript
{ OFF: 1,
  Pattern1: 2,
  Pattern2: 3,
  Pattern3: 4,
  Pattern4: 5,
  Pattern5: 6,
  Pattern6: 7,
  Pattern7: 8 }
```

Each property name means a pattern name, each value means a pattern code. These names and values are required when you call the [`turnOn()`](#LinkingVibration-start-method) method.

### <a id="LinkingVibration-turnOn-method">`turnOn([patternName[, duration]]])` method</a>

This method vibrates the device with the specified pattern.

```JavaScript
device.services.vibration.turnOn('Pattern2', 5).then((res) => {
  if(res.resultCode === 0) {
    console.log('The device is vibrating successfully.');
  } else {
    console.error(res.resultCode + ': ' + res.resultText);
  }
}).catch((error) => {
  console.error(error);
})
```

The parameter `patternName` was omitted, one of the supported patterns is adopted automatically.

If the parameter `duration` is omitted, it is set to `5` (seconds) automatically. The Linking Profile accepts any one of `0`, `5`, `10`, `30`, `60`, or `180` (seconds) as the duration. If a value other than the allowed duration is specified, the nearest allowed duration is set automatically.

This method returns a `Promise` object. If a response comes from the device, the `resolve()` function will be called with the [`LinkingResponse`](#LinkingResponse-object) object.

Note that the request is not necessarily accepted even if the `resolve()` method is called. It is recommended to check the value of the `resultCode` property in the [`LinkingResponse`](#LinkingResponse-object) object.

### <a id="LinkingVibration-turnOff-method">`turnOff()` method</a>

This method stops the vibration.

```JavaScript
device.services.vibration.turnOff().then((res) => {
  if(res.resultCode === 0) {
    console.log('The vibration was stopped successfully.');
  } else {
    console.error(res.resultCode + ': ' + res.resultText);
  }
}).catch((error) => {
  console.error(error);
})
```

This method returns a `Promise` object. If a response comes from the device, the `resolve()` function will be called with the [`LinkingResponse`](#LinkingResponse-object) object.

Note that the request is not necessarily accepted even if the `resolve()` method is called. It is recommended to check the value of the `resultCode` property in the [`LinkingResponse`](#LinkingResponse-object) object.

---------------------------------------
## <a id="LinkingButton-object">`LinkingButton` object</a>

This object exposes APIs which enable you to watch the button action on the device.

### <a id="LinkingButton-onnotify-property">`onnotify` property</a>

The `onnotify` property is an event handler called whenever a button action is occurred on the device.

```JavaScript
device.services.button.onnotify = (res) => {
  console.log('- Button action: ' + res.buttonName + ' (' + res.buttonId + ')');
};
```

The code snippet above will output the result like this:

```JavaScript
- Button action: SingleClick (2)
- Button action: DoubleClick (4)
- Button action: LongClick (7)
- Button action: LongClickRelease (9)
```

---------------------------------------
## <a id="LinkingGyroscope-object">`LinkingGyroscope` object</a>

This object exposes APIs which enable you to watch the data reported by the gyroscope in the device. 

### <a id="LinkingGyroscope-start-method">`start()` method</a>

This method starts to watch the data reported by the gyroscope in the device.

```JavaScript
device.services.gyroscope.onnotify = (res) => {
  console.log('x: ' + res.x + ', y: ' + res.y + ', z: ' + res.z);
};

device.services.gyroscope.start().then(() => {
  if(res.resultCode === 0) {
    console.log('Started to watch the data from the gyroscope.');
  } else {
    console.error(res.resultCode + ': ' + res.resultText);
  }
}).catch((error) => {
  console.error(error);
});
```

Before call the `start()` method, a call back function must be set to the [`onnotify`](#LinkingGyroscope-onnotify-property) property.

This method returns a `Promise` object. If a response comes from the device, the `resolve()` function will be called with the [`LinkingResponse`](#LinkingResponse-object) object.

Note that the request is not necessarily accepted even if the `resolve()` method is called. It is recommended to check the value of the `resultCode` property in the [`LinkingResponse`](#LinkingResponse-object) object.

The code snippet above will output the result like this:

```JavaScript
x: 0.7012194991111755, y: 0.9756097793579102, z: -0.12195122241973877
x: 0.6707317233085632, y: 1.097561001777649, z: 0.21341463923454285
x: 0.6402438879013062, y: 1.1585365533828735, z: 0.18292683362960815
```

As you can see in the code snippet above, an object is passed to the `resolve()` function, which contains the properties as follows:

Property | Type   | Description
:--------|:-------|:------------
`x`      | Number | X-axis rotational
`y`      | Number | Y-axis rotational
`z`      | Number | Z-axis rotational

The Linking Profile specification does not define the unit of each value. As far as I tried with some devices, it seems to be `deg/sec`.

The gyroscope in the "Board for apps developers" is [BOSCH BMI160](https://www.bosch-sensortec.com/bst/products/all_products/bmi160). According to [the data sheet](https://ae-bst.resource.bosch.com/media/_tech/media/datasheets/BST-BMI160-DS000-07.pdf), the unit is `deg/sec`. The gyroscope in the "Sizuku 6X" seems to be [InvenSense MPU-6500](https://www.invensense.com/products/motion-tracking/6-axis/mpu-6500/). According to [the data sheet](https://www.invensense.com/wp-content/uploads/2015/02/MPU-6500-Datasheet2.pdf), the unit is also `deg/sec`. These devices seems to put the reported data from the gyroscope on the Linking Profile directly.

### <a id="LinkingGyroscope-onnotify-property">`onnotify` property</a>

After the `start()` method is called, the callback function set to the `onnotify` property will be called whenever a notification comes from the devices.

### <a id="LinkingGyroscope-stop-method">`stop()` method</a>

This method stops to watch the data reported by the gyroscope in the device.

```JavaScript
device.services.gyroscope.stop().then(() => {
  console.log('Stopped');
}).catch((error) => {
  console.error(error);
});
```

---------------------------------------
## <a id="LinkingAccelerometer-object">`LinkingAccelerometer` object</a>

This object exposes APIs which enable you to watch the data reported by the accelerometer in the device. 

### <a id="LinkingAccelerometer-start-method">`start()` method</a>

This method starts to watch the data reported by the accelerometer in the device.

```JavaScript
device.services.accelerometer.onnotify = (res) => {
  console.log('x: ' + res.x + ', y: ' + res.y + ', z: ' + res.z);
};

device.services.accelerometer.start().then(() => {
  if(res.resultCode === 0) {
    console.log('Started to watch the data from the accelerometer.');
  } else {
    console.error(res.resultCode + ': ' + res.resultText);
  }
}).catch((error) => {
  console.error(error);
});
```

Before call the `start()` method, a callback function must be set to the [`onnotify`](#LinkingAccelerometer-onnotify-property) property.

This method returns a `Promise` object. If a response comes from the device, the `resolve()` function will be called with the [`LinkingResponse`](#LinkingResponse-object) object.

Note that the request is not necessarily accepted even if the `resolve()` method is called. It is recommended to check the value of the `resultCode` property in the [`LinkingResponse`](#LinkingResponse-object) object.

The code snippet above will output the result like this:

```JavaScript
x: -0.008999999612569809, y: -0.05299999937415123, z: 1
x: -0.007000000216066837, y: -0.052000001072883606, z: 1.0010000467300415
x: -0.008999999612569809, y: -0.05299999937415123, z: 1.003999948501587
```

As you can see in the code snippet above, an object is passed to the `resolve()` function, which contains the properties as follows:

Property | Type   | Description
:--------|:-------|:------------
`x`      | Number | X-axis acceleration
`y`      | Number | Y-axis acceleration
`z`      | Number | Z-axis acceleration

The Linking Profile specification does not define the unit of each value. As far as I tried with some devices, it seems to be `G` including gravity because the value of the `z` property is just `1.0` when the device remains quiescent.

The accelerometer in the "Board for apps developers" is [BOSCH BMI160](https://www.bosch-sensortec.com/bst/products/all_products/bmi160). According to [the data sheet](https://ae-bst.resource.bosch.com/media/_tech/media/datasheets/BST-BMI160-DS000-07.pdf), the unit is `G`. The accelerometer in the "Sizuku 6X" seems to be [InvenSense MPU-6500](https://www.invensense.com/products/motion-tracking/6-axis/mpu-6500/). According to [the data sheet](https://www.invensense.com/wp-content/uploads/2015/02/MPU-6500-Datasheet2.pdf), the unit is `G`. Though the "BLEAD-TSH-LK" also has an accelerometer, I was not able to know what it is. Anyway, these devices seems to put the reported data from the accelerometer on the Linking Profile directly.

### <a id="LinkingAccelerometer-onnotify-property">`onnotify` property</a>

After the `start()` method is called, the callback function set to the `onnotify` property will be called whenever a notification comes from the devices.

### <a id="LinkingAccelerometer-stop-method">`stop()` method</a>

This method stops to watch the data reported by the accelerometer in the device.

```JavaScript
device.services.accelerometer.stop().then(() => {
  console.log('Stopped');
}).catch((error) => {
  console.error(error);
});
```

---------------------------------------
## <a id="LinkingOrientation-object">`LinkingOrientation` object</a>

This object exposes APIs which enable you to watch the data reported by the orientation sensor in the device. 

### <a id="LinkingOrientation-start-method">`start()` method</a>

This method starts to watch the data reported by the orientation sensor in the device.

```JavaScript
device.services.orientation.onnotify = (res) => {
  console.log('x: ' + res.x + ', y: ' + res.y + ', z: ' + res.z);
};

device.services.orientation.start().then(() => {
  if(res.resultCode === 0) {
    console.log('Started to watch the data from the orientation sensor.');
  } else {
    console.error(res.resultCode + ': ' + res.resultText);
  }
}).catch((error) => {
  console.error(error);
});
```

Before call the `start()` method, a callback function must be set to the [`onnotify`](#LinkingOrientation-onnotify-property) property.

This method returns a `Promise` object. If a response comes from the device, the `resolve()` function will be called with the [`LinkingResponse`](#LinkingResponse-object) object.

Note that the request is not necessarily accepted even if the `resolve()` method is called. It is recommended to check the value of the `resultCode` property in the [`LinkingResponse`](#LinkingResponse-object) object.

The code snippet above will output the result like this:

```JavaScript
x: 1.128000020980835, y: 0.2849999964237213, z: 1.559000015258789
x: 1.128999948501587, y: 0.289000004529953, z: 1.5709999799728394
x: 1.128999948501587, y: 0.289000004529953, z: 1.5709999799728394
```

As you can see in the code snippet above, an object is passed to the `resolve()` function, which contains the properties as follows:

Property | Type   | Description
:--------|:-------|:------------
`x`      | Number | X-axis rotational angle
`y`      | Number | Y-axis rotational angle
`z`      | Number | Z-axis rotational angle

The Linking Profile specification does not define the unit of each value. The orientation sensor (magnetometer) in the "Board for apps developers" is [STMicroelectronics LIS3MDL](http://www.st.com/en/mems-and-sensors/lis3mdl.html). According to [the data sheet](http://www.st.com/resource/en/datasheet/lis3mdl.pdf), the unit is `gauss`. But I'm not sure the unit of the value coming from the device through the Linking Profile.

### <a id="LinkingOrientation-onnotify-property">`onnotify` property</a>

After the `start()` method is called, the callback function set to the `onnotify` property will be called whenever a notification comes from the devices.

### <a id="LinkingOrientation-stop-method">`stop()` method</a>

This method stops to watch the data reported by the orientation sensor in the device.

```JavaScript
device.services.orientation.stop()).then(() => {
  console.log('Stopped');
}).catch((error) => {
  console.error(error);
});
```

---------------------------------------
## <a id="LinkingTemperature-object">`LinkingTemperature` object</a>

This object exposes APIs which enable you to watch the data reported by the temperature sensor in the device. 

### <a id="LinkingTemperature-start-method">`start()` method</a>

This method starts to watch the data reported by the temperature sensor in the device.

```JavaScript
device.services.temperature.onnotify = (res) => {
  console.log(res.temperature + ' °C');
};

device.services.temperature.start().then(() => {
  if(res.resultCode === 0) {
    console.log('Started to watch the data from the temperature sensor.');
  } else {
    console.error(res.resultCode + ': ' + res.resultText);
  }
}).catch((error) => {
  console.error(error);
});
```

Before call the `start()` method, a call back function must be set to the [`onnotify`](#LinkingTemperature-onnotify-property) property.

This method returns a `Promise` object. If a response comes from the device, the `resolve()` function will be called with the [`LinkingResponse`](#LinkingResponse-object) object.

Note that the request is not necessarily accepted even if the `resolve()` method is called. It is recommended to check the value of the `resultCode` property in the [`LinkingResponse`](#LinkingResponse-object) object.

The code snippet above will output the result like this:

```JavaScript
25.125 °C
```

As you can see in the code snippet above, an object is passed to the `resolve()` function, which contains the properties as follows:

Property      | Type   | Description
:-------------|:-------|:------------
`temperature` | Number | Temperature (°C)

### <a id="LinkingTemperature-onnotify-property">`onnotify` property</a>

After the `start()` method is called, the callback function set to the `onnotify` property will be called whenever a notification comes from the devices.

### <a id="LinkingTemperature-stop-method">`stop()` method</a>

This method stops to watch the data reported by the temperature sensor in the device.

```JavaScript
device.services.temperature.stop().then(() => {
  console.log('Stopped');
}).catch((error) => {
  console.error(error);
});
```

---------------------------------------
## <a id="LinkingHumidity-object">`LinkingHumidity` object</a>

This object exposes APIs which enable you to watch the data reported by the humidity sensor in the device. 

### <a id="LinkingHumidity-start-method">`start()` method</a>

This method starts to watch the data reported by the humidity sensor in the device.

```JavaScript
device.services.humidity.onnotify = (res) => {
  console.log(res.humidity + ' %');
};

device.services.humidity.start().then(() => {
  if(res.resultCode === 0) {
    console.log('Started to watch the data from the humidity sensor.');
  } else {
    console.error(res.resultCode + ': ' + res.resultText);
  }
}).catch((error) => {
  console.error(error);
});
```

Before call the `start()` method, a call back function must be set to the [`onnotify`](#LinkingHumidity-onnotify-property) property.

This method returns a `Promise` object. If a response comes from the device, the `resolve()` function will be called with the [`LinkingResponse`](#LinkingResponse-object) object.

Note that the request is not necessarily accepted even if the `resolve()` method is called. It is recommended to check the value of the `resultCode` property in the [`LinkingResponse`](#LinkingResponse-object) object.

The code snippet above will output the result like this:

```JavaScript
49.875 %
```

As you can see in the code above, an object is passed to the `resolve()` function, which contains the properties as follows:

Property      | Type   | Description
:-------------|:-------|:------------
`humidity`    | Number | Humidity (%)

### <a id="LinkingHumidity-onnotify-property">`onnotify` property</a>

After the `start()` method is called, the callback function set to the `onnotify` property will be called whenever a notification comes from the devices.

### <a id="LinkingHumidity-stop-method">`stop()` method</a>

This method stops to watch the data reported by the humidity sensor in the device.

```JavaScript
device.services.humidity.stop().then(() => {
  console.log('Stopped');
}).catch((error) => {
  console.error(error);
});
```

---------------------------------------
## <a id="LinkingPressure-object">`LinkingPressure` object</a>

This object exposes APIs which enable you to watch the data reported by the air pressure sensor in the device.

Note that there is no device supporting this service for now. If you want to fetch the data reported by the air pressure sensor, scan advertisement data using the [`startScan()`](#Linking-startScan-method) method.

### <a id="LinkingPressure-start-method">`start()` method</a>

This method starts to watch the data reported by the air pressure sensor in the device.

```JavaScript
device.services.pressure.onnotify = (res) => {
  console.log(res.pressure + ' hPa');
};

device.services.pressure.start().then(() => {
  if(res.resultCode === 0) {
    console.log('Started to watch the data from the air pressure sensor.');
  } else {
    console.error(res.resultCode + ': ' + res.resultText);
  }
}).catch((error) => {
  console.error(error);
});
```

Before call the `start()` method, a callback function must be set to the [`onnotify`](#LinkingPressure-onnotify-property) property.

This method returns a `Promise` object. If a response comes from the device, the `resolve()` function will be called with the [`LinkingResponse`](#LinkingResponse-object) object.

Note that the request is not necessarily accepted even if the `resolve()` method is called. It is recommended to check the value of the `resultCode` property in the [`LinkingResponse`](#LinkingResponse-object) object.

The code snippet above will output the result like this:

```JavaScript
49.875 %
```

As you can see in the code snippet above, an object is passed to the `resolve()` function, which contains the properties as follows:

Property      | Type   | Description
:-------------|:-------|:------------
`pressure`    | Number | air pressure (hPa)

### <a id="LinkingPressure-onnotify-property">`onnotify` property</a>

After the `start()` method is called, the callback function set to the `onnotify` property will be called whenever a notification comes from the devices.

### <a id="LinkingPressure-stop-method">`stop()` method</a>

This method stops to watch the data reported by the air pressure sensor in the device.

```JavaScript
device.services.pressure.stop().then(() => {
  console.log('Stopped');
}).catch((error) => {
  console.error(error);
});
```

---------------------------------------
## <a id="LinkingResponse-object">`LinkingResponse` object</a>

This object represents the response from the device. This object contains the properties as follows:

Property     | Type   | Description
:------------|:-------|:-----------
`resultCode` | Number | If the value is `0`, it means that the request was accepted successfully. If the value is not `0`, it means that the request was not accepted.
`resultText` | String | The message corresponding to the `resultCode`.

The possible combinations of `resultCode` and `resultText` are described below:

`resultCode` | `resultText`
:------------|:------------
`0`          | `OK, request processed correctly`
`1`          | `Cancel`
`2`          | `Error, failed`
`3`          | `Error, no reason defined`
`4`          | `Error, data not available`
`5`          | `Error, not supported`

---------------------------------------
## <a id="Supported-devices">Supported devices</a>

The node-linking was tested with the devices as follows:

* [Braveridge Co., Ltd.](https://ssl.braveridge.com/)
  * [Board for apps developers](https://ssl.braveridge.com/store/html/products/detail.php?product_id=26)
  * [Tomoru](https://ssl.braveridge.com/store/html/products/detail.php?product_id=4)
  * [Pochiru](https://ssl.braveridge.com/store/html/products/detail.php?product_id=28)
  * [Sizuku LED](https://ssl.braveridge.com/store/html/products/detail.php?product_id=31)
  * [Sizuku THA](https://ssl.braveridge.com/store/html/products/detail.php?product_id=32)
  * [Sizuku 6X](https://ssl.braveridge.com/store/html/products/detail.php?product_id=33)
  * [Tukeru TH](https://ssl.braveridge.com/store/html/products/detail.php?product_id=34)
  * [Furueru](https://ssl.braveridge.com/store/html/products/detail.php?product_id=36)
  * [Pochiru(eco)](https://ssl.braveridge.com/store/html/products/detail.php?product_id=37)

* [HOUWA SYSTEM DESIGN K.K.](http://www.houwa-js.co.jp/index.php/en/)
  * [BLEAD-TSH-LK](http://blead.buyshop.jp/items/2858899)

Though Braveridge is also selling [Oshieru](https://ssl.braveridge.com/store/html/products/detail.php?product_id=39) and [Kizuku](https://ssl.braveridge.com/store/html/products/detail.php?product_id=38), the node-linking does not support these devices because the BLE data is encrypted using an unpublicized encryption method.

---------------------------------------
## <a id="Release-note">Release Note</a>

* v0.0.1 (2017-07-02)
  * First public release

---------------------------------------
## <a id="References">References</a>

* [Project Linking for users](https://linkingiot.com/en/index.html)
* [Project Linking for developers](https://linkingiot.com/developer/en/index.html)
* [Linking devices](https://linkingiot.com/developer/en/devices.html)
* [Linking API Guide](https://linkingiot.com/developer/en/api.html)

---------------------------------------
## <a id="License">License</a>

The MIT License (MIT)

Copyright (c) 2017 Futomi Hatano

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
