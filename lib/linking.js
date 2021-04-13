/* ------------------------------------------------------------------
* node-linking - linking.js
*
* Copyright (c) 2017-2021, Futomi Hatano, All rights reserved.
* Released under the MIT license
* Date: 2021-04-11
* ---------------------------------------------------------------- */
'use strict';
const LinkingDevice = require('./modules/device.js');
const LinkingAdvertising = require('./modules/advertising.js');

class Linking {
  /* ------------------------------------------------------------------
  * Constructor
  *
  * [Arguments]
  * - params  | Object  | Optional |
  *   - noble | Noble   | Optional | The Nobel object created by the noble module.
  *           |         |          | This parameter is optional.
  *           |         |          | If you don't specify this parameter, this
  *           |         |          | module automatically creates it.
  * ---------------------------------------------------------------- */
  constructor(params) {
    this._noble = null;
    if (params && 'noble' in params) {
      if (typeof (params['noble']) === 'object') {
        this._noble = params['noble'];
      } else {
        throw new Error('The value of the "noble" property is invalid.');
      }
    } else {
      try {
        this._noble = require('@abandonware/noble');
      } catch (e) {
        this._noble = require('noble');
      }
    }
    this._onadvertisement = null;
    this._ondiscover = null;

    this.PRIMARY_SERVICE_UUID_LIST = ['b3b3690150d34044808d50835b13a6cd', 'fe4e'];

    this._DISCOVER_WAIT = 3000; // ms
    this._discover_status = false;
    this._discover_timer = null;
    this._peripherals = {};
  }

  get noble() {
    return this._noble;
  }

  set onadvertisement(func) {
    if (!func || typeof (func) !== 'function') {
      throw new Error('The `onadvertisement` must be a function.');
    }
    this._onadvertisement = func;
  }

  set ondiscover(func) {
    if (!func || typeof (func) !== 'function') {
      throw new Error('The `ondiscover` must be a function.');
    }
    this._ondiscover = func;
  }

  /* ------------------------------------------------------------------
  * init()
  * - Initialize this object.
  * 
  * [Arguments]
  * - None
  * 
  * [Returen value]
  * - Promise object
  *   Nothing will be passed to the `resolve()`.
  * ---------------------------------------------------------------- */
  init() {
    return new Promise((resolve, reject) => {
      this.initialized = false;
      if (this._noble.state === 'poweredOn') {
        this.initialized = true;
        resolve();
      } else {
        this._noble.once('stateChange', (state) => {
          if (state === 'poweredOn') {
            this.initialized = true;
            resolve();
          } else {
            let err = new Error('Failed to initialize the Noble object: ' + state);
            reject(err);
          }
        });
      }
    });
  }

  /* ------------------------------------------------------------------
  * discover([params])
  * - Find Linking devices
  * 
  * [Arguments]
  * - params       | Object  | Optional |
  *   - duration   | Integer | Optional | Duration for discovery process (msec).
  *                |         |          | The default value is 5000 (msec).
  *   - nameFilter | String  | Optional | If this value is set, the devices whose
  *                |         |          | name (localName) does not start with the
  *                |         |          | specified keyword will be ignored.
  *   - idFilter   | String  | Optional | If this value is set, the device whose
  *                |         |          | ID (id) does not start with the specified
  *                |         |          | keyword will be ignored.
  *   - quick      | Boolean | Optional | If this value is true, this method finishes
  *                |         |          | the discovery process when the first device
  *                |         |          | is found, then calls the resolve() function
  *                |         |          | without waiting the specified duration.
  *                |         |          | The default value is false.
  * 
  * [Returen value]
  * - Promise object
  *   An array will be passed to the `resolve()`, which includes
  *   `LinkingDevice` objects representing the found devices 
  * ---------------------------------------------------------------- */
  discover(params) {
    this._checkInitialized();

    let duration = 5000;
    let name_filter = '';
    let id_filter = '';
    let quick = false;
    if (params && typeof (params) === 'object') {
      if (('duration' in params) && typeof (params.duration) === 'number') {
        duration = params.duration;
        if (duration < 1000) {
          duration = 1000;
        }
      }
      if (('nameFilter' in params) && typeof (params.nameFilter === 'string')) {
        name_filter = params.nameFilter;
      }
      if (('idFilter' in params) && typeof (params.idFilter === 'string')) {
        id_filter = params.idFilter;
      }
      if (('quick' in params) && typeof (params.quick === 'boolean')) {
        quick = params.quick;
      }
    }

    return new Promise((resolve) => {
      let timer = null;
      let finishDiscovery = () => {
        if (timer) {
          clearTimeout(timer);
        }
        this.stopScan();
        let device_list = [];
        for (let addr in this._peripherals) {
          device_list.push(this._peripherals[addr]);
        }
        resolve(device_list);
      };
      this._peripherals = {};
      this._noble.on('discover', (peripheral) => {
        let dev = this._discoveredDevice(peripheral, name_filter, id_filter);
        if (quick && dev) {
          finishDiscovery();
          return;
        }
      });
      this._scanDevices();
      this._discover_status = true;
      timer = setTimeout(() => {
        finishDiscovery();
      }, duration);
    });
  }

  _checkInitialized() {
    if (this.initialized === false) {
      throw new Error('The `init()` method has not been called yet.');
    }
    if (this._discover_status === true) {
      throw new Error('The `discover()` or the `startScan()` method is in progress.');
    }
  }

  _discoveredDevice(peripheral, name_filter, id_filter) {
    var ad = peripheral.advertisement;
    if (!ad.localName) { return null; }
    if (!peripheral.id) { return null; }
    if (name_filter && ad.localName.indexOf(name_filter) !== 0) { return null; }
    if (id_filter && peripheral.id.indexOf(id_filter) !== 0) { return null; }
    var addr = peripheral.address;
    if (this._peripherals[addr]) {
      return null;
    }
    let device = new LinkingDevice(this._noble, peripheral);
    if (this._ondiscover) {
      this._ondiscover(device);
    }
    this._peripherals[addr] = device;
    return device;
  }

  _scanDevices() {
    this._noble.startScanning(this.PRIMARY_SERVICE_UUID_LIST, false);
    this._discover_timer = setTimeout(() => {
      this._noble.stopScanning();
      if (this._discover_status === true) {
        this._scanDevices();
      }
    }, this._DISCOVER_WAIT);
  }

  /* ------------------------------------------------------------------
  * startScan([params])
  * - Start to scan advertising packets from Linking devices
  * 
  * [Arguments]
  * - params       | Object  | Optional |
  *   - nameFilter | String  | Optional | If this value is set, the devices whose
  *                |         |          | name (localName) does not start with the
  *                |         |          | specified keyword will be ignored.
  *   - idFilter   | String  | Optional | If this value is set, the device whose
  *                |         |          | ID (id) does not start with the specified
  *                |         |          | keyword will be ignored.
  * 
  * [Returen value]
  * - Promise object
  *   Nothing will be passed to the `resolve()`
  * ---------------------------------------------------------------- */
  startScan(params) {
    return new Promise((resolve, reject) => {
      this._checkInitialized();
      let name_filter = '';
      let id_filter = '';
      if (params && typeof (params) === 'object') {
        if (('nameFilter' in params) && typeof (params.nameFilter === 'string')) {
          name_filter = params.nameFilter;
        }
        if (('idFilter' in params) && typeof (params.idFilter === 'string')) {
          id_filter = params.idFilter;
        }
      }
      this._noble.on('discover', (peripheral) => {
        var ad = peripheral.advertisement;
        if (!ad.localName) { return; }
        if (name_filter && ad.localName.indexOf(name_filter) !== 0) { return; }
        if (id_filter && peripheral.id.indexOf(id_filter) !== 0) { return; }
        if (this._onadvertisement) {
          let parsed = LinkingAdvertising.parse(peripheral);
          if (parsed) {
            this._onadvertisement(parsed);
          }
        }
      });
      this._noble.startScanning(this.PRIMARY_SERVICE_UUID_LIST, true, (error) => {
        if (error) {
          reject(error);
        } else {
          this._discover_status = true;
          resolve();
        }
      });
    });
  }

  /* ------------------------------------------------------------------
  * stopScan()
  * - Stop to scan advertising packets from Linking devices
  * 
  * [Arguments]
  * - None
  * 
  * [Returen value]
  * - Promise object
  *   Nothing will be passed to the `resolve()`
  * ---------------------------------------------------------------- */
  stopScan() {
    return new Promise((resolve) => {
      this._noble.removeAllListeners('discover');
      if (this._discover_status === false) {
        resolve();
        return;
      }
      this._discover_status = false;
      if (this._discover_timer !== null) {
        clearTimeout(this._discover_timer);
        this._discover_timer = null;
      }
      this._noble.stopScanning(() => {
        resolve();
      });
    });
  }

  /* ------------------------------------------------------------------
  * wait(msec) {
  * - Wait for the specified time (msec)
  *
  * [Arguments]
  * - msec | Integer | Required | Msec.
  *
  * [Returen value]
  * - Promise object
  *   Nothing will be passed to the `resolve()`.
  * ---------------------------------------------------------------- */
  wait(msec) {
    return new Promise((resolve, reject) => {
      // Check the parameters
      if(typeof(msec) !== 'number' || msec % 1 !== 0 || msec < 0) {
        reject(new Error('The `msec` must be an integer grater than 0.'));
        return;
      }
      // Set a timer
      setTimeout(resolve, msec);
    });
  }

}

module.exports = Linking;
