/* ------------------------------------------------------------------
* node-linking - device.js
*
* Copyright (c) 2017-2021, Futomi Hatano, All rights reserved.
* Released under the MIT license
* Date: 2021-04-13
* ---------------------------------------------------------------- */
'use strict';
const LinkingAdvertising = require('./advertising.js');
const LinkingService = require('./service.js');

class LinkingDevice {
  /* ------------------------------------------------------------------
  * Constructor
  *
  * [Arguments]
  * - noble      | Object | Required | Nobel object
  * - peripheral | Object | Required | Peripheral object of noble.
  * ---------------------------------------------------------------- */
  constructor(noble, peripheral) {
    this.PRIMARY_SERVICE_UUID = 'b3b3690150d34044808d50835b13a6cd';
    this.WRITE_CHARACTERRISTIC_UUID = 'b3b3910150d34044808d50835b13a6cd';
    this.INDICATE_CHARACTERRISTIC_UUID = 'b3b3910250d34044808d50835b13a6cd';

    this._info = {};
    this._advertisement = LinkingAdvertising.parse(peripheral);
    this._connected = false;

    this._onconnect = null;
    this._onconnectprogress = null;
    this._ondisconnect = null;
    this._onnotify = null;

    this._services = {
      deviceName: null,
      led: null,
      vibration: null,
      button: null,
      gyroscope: null,
      accelerometer: null,
      orientation: null,
      battery: null,
      temperature: null,
      humidity: null,
      pressure: null,
      openclose: null,
      human: null,
      move: null,
      illuminance: null
    };

    this._noble = noble;
    this._peripheral = peripheral;
    this._service = null;
    this._chars = {
      write: null,
      indicate: null
    };
    this._div_packet_queue = [];
    this._LinkingService = new LinkingService();
    this._onresponse = null;
    this._write_response_timeout = 30000; // msec

    this._generic_access_service = {
      SERVICE_UUID: '1800',
      service: null,
      device_name: {
        CHARACTERRISTIC_UUID: '2a00',
        char: null
      }
    };
  }

  get advertisement() {
    return JSON.parse(JSON.stringify(this._advertisement));
  }

  get connected() {
    return this._connected;
  }

  get services() {
    return this._services;
  }

  set onconnect(func) {
    if (typeof (func) === 'function') {
      this._onconnect = func;
    } else {
      throw new Error('The `onconnect` must be a function.');
    }
  }

  set onconnectprogress(func) {
    if (typeof (func) === 'function') {
      this._onconnectprogress = func;
    } else {
      throw new Error('The `onconnectprogress` must be a function.');
    }
  }

  set ondisconnect(func) {
    if (typeof (func) === 'function') {
      this._ondisconnect = func;
    } else {
      throw new Error('The `ondisconnect` must be a function.');
    }
  }

  set onnotify(func) {
    if (typeof (func) === 'function') {
      this._onnotify = func;
    } else {
      throw new Error('The `onnotify` must be a function.');
    }
  }

  /* ------------------------------------------------------------------
  * Method: connect()
  * ---------------------------------------------------------------- */
  async connect() {
    const TRY_MAX = 3;
    let last_error = null;
    for (let n = 0; n < TRY_MAX; n++) {
      try {
        await this._connect();
        last_error = null;
        break;
      } catch (error) {
        last_error = error;
        await this._wait(500);
      }
    }

    if (last_error) {
      throw last_error;
    }
  }

  async _connect() {
    if (this._connected === true) {
      throw new Error('The device has been already connected.');
    }

    let onprogress = () => { };
    if (this._onconnectprogress) {
      onprogress = this._onconnectprogress;
    }

    onprogress({ step: 1, desc: 'CONNECTING' });

    await this._peripheralConnect();
    onprogress({ step: 2, desc: 'CONNECTION_ESTABLISHED' });

    this._peripheral.once('disconnect', () => {
      this._clean();
      if (this._ondisconnect) {
        this._ondisconnect({ 'wasClean': false });
      }
    });


    onprogress({ step: 3, desc: 'GETTING_CHARACTERISTICS' });
    await this._getServicesAndChars();

    onprogress({ step: 4, desc: 'SUBSCRIBING' });
    await this._subscribeForIndicate();

    onprogress({ step: 5, desc: 'GETTING_DEVICE_INFOMATION' });
    let dev_info_res = await this.write('GET_DEVICE_INFORMATION');

    this._info.id = '';
    if ('deviceId' in dev_info_res.data) {
      this._info.id = dev_info_res.data.deviceId;
    }
    this._info.uid = '';
    if ('deviceUid' in dev_info_res.data) {
      this._info.uid = dev_info_res.data.deviceUid;
    }
    this._info.services = {};
    if ('serviceList' in dev_info_res.data) {
      dev_info_res.data.serviceList.forEach((o) => {
        this._info.services[o.name] = o.id;
      });
    }
    this._info.capabilities = {};
    if ('deviceCapability' in dev_info_res.data) {
      dev_info_res.data.deviceCapability.forEach((o) => {
        this._info.capabilities[o.name] = o.id;
      });
    }
    this._info.exsensors = {};
    if ('exSensorType' in dev_info_res.data) {
      dev_info_res.data.exSensorType.forEach((o) => {
        this._info.exsensors[o.name] = o.id;
      });
    }

    onprogress({ step: 6, desc: 'GETTING_NOTIFY_CATEGORIES' });
    let noti_cate_res = await this._writeConfirmNotifyCategory();
    this._info.notifyCategories = {};
    if (noti_cate_res) {
      if ('notifyCategory' in noti_cate_res.data) {
        noti_cate_res.data.notifyCategory.forEach((o) => {
          this._info.notifyCategories[o.name] = o.id;
        });
      }
    }

    onprogress({ step: 7, desc: 'GETTING_SETTING_INFORMATION' });
    let set_info_res = await this._writeGetSettingInformation();
    this._info.settings = {};
    if (set_info_res) {
      if ('settingInformationData' in set_info_res.data) {
        set_info_res.data.settingInformationData.forEach((o) => {
          this._info.settings[o.name] = o;
        });
      }
    }

    onprogress({ step: 8, desc: 'GETTING_LED_COLOR_NAMES' });
    let led_color_res = await this._writeGetSettingName('LEDColorName');
    if (led_color_res) {
      this._info.settings.LED.colors = led_color_res.data.settingNameData;
    }

    onprogress({ step: 9, desc: 'GETTING_LED_PATTERN_NAMES' });
    let led_pattern_res = await this._writeGetSettingName('LEDPatternName');
    if (led_pattern_res) {
      this._info.settings.LED.patterns = led_pattern_res.data.settingNameData;
    }

    onprogress({ step: 10, desc: 'GETTING_VIBRATION_PATTERN_NAMES' });
    let vib_pat_res = await this._writeGetSettingName('VibrationPatternName');
    if (vib_pat_res) {
      this._info.settings.Vibration.patterns = vib_pat_res.data.settingNameData;
    }

    onprogress({ step: 11, desc: 'GETTING_BEEP_PATTERN_NAMES' });
    let beep_pt_res = await this._writeGetSettingName('BeepPatternName');
    if (beep_pt_res) {
      this._info.settings.Beep.patterns = beep_pt_res.data.settingNameData;
    }

    this._LinkingService.setDeviceInfo(this._info);
    this._initServices();

    this._connected = true;
    if (this._onconnect) {
      this._onconnect();
    }

    onprogress({ step: 12, desc: 'COMPLETED' });
    return;
  }

  _wait(msec) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, msec);
    });
  }

  _peripheralConnect() {
    return new Promise((resolve, reject) => {
      this._peripheral.connect((error) => {
        if (error) {
          reject(new Error('Failed to connect to the device: ' + error.message));
        } else {
          resolve();
        }
      });
    });
  }

  _writeConfirmNotifyCategory() {
    return new Promise((resolve, reject) => {
      if (!('PeripheralDeviceNotification' in this._info.services)) {
        resolve(null);
        return;
      }
      this.write('CONFIRM_NOTIFY_CATEGORY').then((res) => {
        resolve(res);
      }).catch((error) => {
        reject(error);
      });
    });
  }

  _writeGetSettingInformation() {
    return new Promise((resolve, reject) => {
      if (!('PeripheralDeviceSettingOperation' in this._info.services)) {
        resolve(null);
        return;
      }
      this.write('GET_SETTING_INFORMATION').then((res) => {
        resolve(res);
      }).catch((error) => {
        reject(error);
      });
    });
  }

  _writeGetSettingName(name) {
    return new Promise((resolve, reject) => {
      if (!('PeripheralDeviceSettingOperation' in this._info.services)) {
        resolve(null);
        return;
      }

      let s = this._info.settings;
      if (name === 'LEDColorName') {
        if (!(('LED' in s) && s.LED.colorMax)) {
          resolve(null);
          return;
        }
      } else if (name === 'LEDPatternName') {
        if (!(('LED' in s) && s.LED.patternMax)) {
          resolve(null);
          return;
        }
      } else if (name === 'VibrationPatternName') {
        if (!(('Vibration' in s) && s.Vibration.patternMax)) {
          resolve(null);
          return;
        }
      } else if (name === 'BeepPatternName') {
        if (!(('Beep' in s) && s.Beep.patternMax)) {
          resolve(null);
          return;
        }
      }
      this.write('GET_SETTING_NAME', { SettingNameType: name }).then((res) => {
        resolve(res);
      }).catch((error) => {
        reject(error);
      });
    });
  }

  _isFunction(o) {
    return (o && typeof (o) === 'function') ? true : false;
  }

  _getServicesAndChars() {
    return new Promise((resolve, reject) => {
      // Discover the BLE Services
      this._getServices().then(() => {
        // Discover the BLE Characteristics of the Linking
        return this._getChars();
      }).then(() => {
        // Discover the BLE Characteristics of the GATT Generic Access
        return this._getCharsGattGenericAccess();
      }).then(() => {
        resolve();
      }).catch((error) => {
        reject(error);
      });
    });
  }

  // Discover the BLE Services
  _getServices() {
    return new Promise((resolve, reject) => {
      let timer = setTimeout(() => {
        timer = null;
        reject(new Error('Failed to discover services: TIMEOUT'));
      }, 5000);

      this._peripheral.discoverServices([], (error, service_list) => {
        if (!timer) {
          return;
        }
        clearTimeout(timer);
        timer = null;

        if (error) {
          reject(error);
          return;
        }

        service_list.forEach((s) => {
          if (s.uuid === this.PRIMARY_SERVICE_UUID) {
            this._service = s;
          } else if (s.uuid === this._generic_access_service.SERVICE_UUID) {
            this._generic_access_service.service = s;
          }
        });

        if (this._service) {
          resolve();
        } else {
          reject(new Error('No service was found'));
        }
      });
    });
  }

  // Discover the Linking BLE Characteristics
  _getChars() {
    return new Promise((resolve, reject) => {
      let timer = setTimeout(() => {
        timer = null;
        reject(new Error('Failed to discover characteristics: TIMEOUT'));
      }, 5000);

      this._service.discoverCharacteristics([], (error, char_list) => {
        if (!timer) {
          return;
        }
        clearTimeout(timer);
        timer = null;

        if (error) {
          reject(error);
          return;
        }

        let write_char = null;
        let indicate_char = null;

        char_list.forEach((c) => {
          if (c.uuid === this.WRITE_CHARACTERRISTIC_UUID) {
            write_char = c;
          } else if (c.uuid === this.INDICATE_CHARACTERRISTIC_UUID) {
            indicate_char = c;
          }
        });

        if (write_char && indicate_char) {
          this._chars = {
            write: write_char,
            indicate: indicate_char
          };
          resolve();
        } else {
          reject(new Error('No characteristic was found'));
        }
      });
    });
  }

  // Discover the characteristics of the GATT Generic Access
  _getCharsGattGenericAccess() {
    return new Promise((resolve, reject) => {
      if (!this._generic_access_service.service) {
        resolve();
        return;
      }

      let timer = setTimeout(() => {
        timer = null;
        reject(new Error('Failed to discover characteristics: TIMEOUT'));
      }, 5000);

      this._generic_access_service.service.discoverCharacteristics([], (error, char_list) => {
        if (!timer) {
          return;
        }
        clearTimeout(timer);
        timer = null;

        if (error) {
          reject(error);
          return;
        }

        let ga_char = null;
        char_list.forEach((c) => {
          if (c.uuid === this._generic_access_service.device_name.CHARACTERRISTIC_UUID) {
            ga_char = c;
          }
        });
        if (ga_char) {
          this._generic_access_service.device_name.char = ga_char;
        }
        resolve();
      });
    });
  }

  _subscribeForIndicate() {
    return new Promise((resolve, reject) => {
      // Set timeout timer
      let timer = setTimeout(() => {
        timer = null;
        reject(new Error('Failed to subscribe to a characteristic for indicate: TIMEOUT'));
      }, 5000);

      // Subscribe to the characteristic for indicate
      this._chars.indicate.subscribe((error) => {
        if (!timer) {
          return;
        }
        clearTimeout(timer);
        timer = null;

        if (error) {
          reject(new Error('Failed to subscribe to a characteristic for indicate: ' + error.message));
          return;
        }

        this._chars.indicate.on('data', (buf) => {
          this._receivedPacket(buf);
        });
        resolve();
      });
    });
  }

  _receivedPacket(buf) {
    let new_buf = Buffer.alloc(buf.length - 1);
    buf.copy(new_buf, 0, 1, buf.length);
    this._div_packet_queue.push(new_buf);
    if (this._isExecutedPacket(buf)) {
      let header_byte = Buffer.from([buf.readUInt8(0)]);
      this._div_packet_queue.unshift(header_byte);
      let total_buf = Buffer.concat(this._div_packet_queue);
      this._receivedIndicate(total_buf);
      this._div_packet_queue = [];
    }
  }

  _isExecutedPacket(buf) {
    let ph = buf.readUInt8(0);
    return (ph & 0x00000001) ? true : false;
  }

  _receivedIndicate(buf) {
    let parsed = this._LinkingService.parseResponse(buf);
    if (!parsed) {
      return;
    }
    if (parsed.messageName.match(/_RESP$/)) {
      if (this._onresponse) {
        this._onresponse(parsed);
      }
    } else {
      // All notifications
      if (this._onnotify) {
        this._onnotify(parsed);
      }
      // Button
      if (parsed.serviceId === 2) { // PeripheralDeviceOperation Service
        if (parsed.messageId === 0) { // NOTIFY_PD_OPERATION
          //let f = this._services['button']['onnotify'];
          let f = null;
          if (this._services.button) {
            if (this._isFunction(this._services.button.onnotify)) {
              f = this._services.button.onnotify;
            }
          }
          if (f) {
            let button = null;
            parsed.parameters.forEach((p) => {
              if (p.parameterId === 2) { // ButtonId
                button = {
                  buttonId: p.buttonId,
                  buttonName: p.buttonName
                };
              }
            });
            f(button);
          }
        }
        // Sensors
      } else if (parsed.serviceId === 3) { // PeripheralDeviceSensorInformation Service
        if (parsed.messageId === 4) { // NOTIFY_PD_SENSOR_INFO
          let sensor_type = -1;
          let res = {};
          parsed.parameters.forEach((p) => {
            let pid = p.parameterId;
            if (pid === 2) { // SensorType
              sensor_type = p.sensorTypeCode;
            } else {
              if (sensor_type.toString().match(/^(0|1|2)$/)) { // Gyroscope, Accelerometer, Orientation
                if (pid === 4) { // X_value
                  res.x = p.xValue;
                } else if (pid === 5) { // Y_value
                  res.y = p.yValue;
                } else if (pid === 6) { // Z_value
                  res.z = p.zValue;
                }
              } else if (sensor_type === 3) { // Battery
                res = {
                  charge: p.charge,
                  level: p.level
                };
              } else if (sensor_type === 4) { // Temperature
                res.temperature = p.temperature;
              } else if (sensor_type === 5) { // Humidity
                res.humidity = p.humidity;
              } else if (sensor_type === 6) { // Aire pressure
                res.pressure = p.pressure;
              } else if (sensor_type === 7) { // Opening and closing
                res.openingStatus = p.openingStatus;
                res.openingCount = p.openingCount;
              } else if (sensor_type === 8) { // Human detection
                res.humanDetectionResponse = p.humanDetectionResponse;
                res.humanDetectionCount = p.humanDetectionCount;
              } else if (sensor_type === 9) { // Move
                res.moveResponse = p.moveResponse;
                res.moveCount = p.moveCount;
              } else if (sensor_type === 0x0a) { // Illuminance
                res.illuminance = p.illuminance;
              }
            }
          });

          let f = null;
          if (sensor_type === 0) {
            if (this._services.gyroscope) {
              f = this._services.gyroscope.onnotify;
            }
          } else if (sensor_type === 1) {
            if (this._services.accelerometer) {
              f = this._services.accelerometer.onnotify;
            }
          } else if (sensor_type === 2) {
            if (this._services.orientation) {
              f = this._services.orientation.onnotify;
            }
          } else if (sensor_type === 3) {
            if (this._services.battery) {
              f = this._services.battery.onnotify;
            }
          } else if (sensor_type === 4) {
            if (this._services.temperature) {
              f = this._services.temperature.onnotify;
            }
          } else if (sensor_type === 5) {
            if (this._services.humidity) {
              f = this._services.humidity.onnotify;
            }
          } else if (sensor_type === 6) {
            if (this._services.pressure) {
              f = this._services.pressure.onnotify;
            }
          } else if (sensor_type === 7) {
            if (this._services.openclose) {
              f = this._services.openclose.onnotify;
            }
          } else if (sensor_type === 8) {
            if (this._services.human) {
              f = this._services.human.onnotify;
            }
          } else if (sensor_type === 9) {
            if (this._services.move) {
              f = this._services.move.onnotify;
            }
          } else if (sensor_type === 0x0a) {
            if (this._services.illuminance) {
              f = this._services.illuminance.onnotify;
            }
          }

          if (this._isFunction(f)) {
            f(res);
          }
        }
      }

    }
  }

  /* ------------------------------------------------------------------
  * Method: disconnect()
  * ---------------------------------------------------------------- */
  disconnect() {
    return new Promise((resolve, reject) => {
      if (this._connected === false) {
        this._clean();
        resolve();
        return;
      }
      this._clean();
      this._peripheral.disconnect(() => {
        if (this._ondisconnect) {
          this._ondisconnect({ 'wasClean': true });
        }
        resolve();
      });
    });
  }

  _clean() {
    let p = this._peripheral;
    if (!p) {
      return;
    }
    if (this._chars.indicate) {
      this._chars.indicate.unsubscribe();
      this._chars.indicate.removeAllListeners();
    }
    p.removeAllListeners();
    this._connected = false;
    this._service = null;
    this._chars = {
      write: null,
      indicate: null
    };
    this._div_packet_queue = [];
    this._onresponse = null;
  }

  /* ------------------------------------------------------------------
  * Method: write(message_name, params)
  * ---------------------------------------------------------------- */
  write(message_name, params) {
    return new Promise((resolve, reject) => {
      let buf = this._LinkingService.createRequest(message_name, params);
      if (!buf) {
        reject(new Error('The specified parameters are invalid.'));
        return;
      }

      let timer = setTimeout(() => {
        this._onresponse = null;
        reject(new Error('Timeout'));
      }, this._write_response_timeout);

      this._onresponse = (res) => {
        if (res.messageName === message_name + '_RESP') {
          this._onresponse = null;
          clearTimeout(timer);
          let data = this._margeResponsePrameters(res);
          if (data) {
            res.data = data;
            resolve(res);
          } else {
            reject(new Error('Unknown response'));
          }
        }
      };

      this._chars.write.write(buf, false, (err) => {
        if (err) {
          reject(new Error('Failed to write the data: ' + err.message));
          return;
        }
      });
    });
  }

  _margeResponsePrameters(res) {
    if (!res) {
      return null;
    }
    let parameters = res.parameters;
    if (parameters && Array.isArray(parameters) && parameters.length > 0) {
      let data = {};
      parameters.forEach((p) => {
        for (let k in p) {
          if (!k.match(/^(name|parameterId)$/)) {
            data[k] = p[k];
          }
        }
      });
      return data;
    } else {
      return null;
    }
  }

  /* ------------------------------------------------------------------
  * Services
  * ---------------------------------------------------------------- */

  _initServices() {
    let device_name = this._advertisement.localName;
    // Device Name
    if (this._generic_access_service.device_name.char) {
      this._services.deviceName = {
        get: this._deviceNameGet.bind(this),
        set: this._deviceNameSet.bind(this)
      };
    }
    // Button
    if ('Button' in this._info.exsensors || device_name.match(/^(Linking Board01|BLEAD\-LK\-TSH)/)) {
      this._services.button = {
        onnotify: null
      };
    }
    // LED
    if ('LED' in this._info.settings) {
      let o = this._info.settings.LED;
      if (o.colors && o.colors.length > 0 && o.patterns && o.patterns.length > 0) {
        let colors = {};
        for (let i = 0; i < o.colors.length; i++) {
          colors[o.colors[i]] = i + 1;
        }
        let patterns = {};
        for (let i = 0; i < o.patterns.length; i++) {
          patterns[o.patterns[i]] = i + 1;
        }
        this._services.led = {
          colors: colors,
          patterns: patterns,
          turnOn: this._ledTurnOn.bind(this),
          turnOff: this._ledTurnOff.bind(this)
        };
      }
    }
    // Vibration
    if ('Vibration' in this._info.settings) {
      let o = this._info.settings.Vibration;
      if (o.patterns && o.patterns.length > 0) {
        let patterns = {};
        for (let i = 0; i < o.patterns.length; i++) {
          patterns[o.patterns[i]] = i + 1;
        }
        this._services.vibration = {
          patterns: patterns,
          turnOn: this._vibrationTurnOn.bind(this),
          turnOff: this._vibrationTurnOff.bind(this)
        };
      }
    }
    // Gyroscope
    if ('Gyroscope' in this._info.capabilities) {
      this._services.gyroscope = this._createSensorServiceObject(0x00);
    }
    // Accelerometer
    if ('Accelerometer' in this._info.capabilities) {
      this._services.accelerometer = this._createSensorServiceObject(0x01);
    }
    // Orientation
    if ('Orientation' in this._info.capabilities) {
      this._services.orientation = this._createSensorServiceObject(0x02);
    }
    // Battery
    if ('Battery' in this._info.capabilities) {
      this._services.battery = this._createSensorServiceObject(0x03);
    }
    // Temperature
    if ('Temperature' in this._info.capabilities) {
      this._services.temperature = this._createSensorServiceObject(0x04);
    }
    // Humidity
    if ('Humidity' in this._info.capabilities) {
      this._services.humidity = this._createSensorServiceObject(0x05);
    }
    // Atmospheric pressure
    if ('Atmospheric pressure' in this._info.capabilities) {
      this._services.pressure = this._createSensorServiceObject(0x06);
    }
    // Opening and closing
    if ('Opening and closing' in this._info.exsensors) {
      this._services.openclose = this._createSensorServiceObject(0x07);
    }
    // Human detection
    if ('Human detection' in this._info.exsensors) {
      this._services.human = this._createSensorServiceObject(0x08);
    }
    // Move
    if ('Move' in this._info.exsensors) {
      this._services.move = this._createSensorServiceObject(0x09);
    }
    // Illuminance
    if ('Illuminance' in this._info.exsensors) {
      this._services.illuminance = this._createSensorServiceObject(0x0a);
    }
  }

  _deviceNameGet() {
    return new Promise((resolve, reject) => {
      let char = this._generic_access_service.device_name.char;
      char.read((error, data) => {
        if (error) {
          reject(error);
        } else {
          resolve({
            deviceName: data.toString('utf8')
          });
        }
      });
    });
  }

  _deviceNameSet(name) {
    return new Promise((resolve, reject) => {
      if (!name) {
        reject(new Error('Device name is required.'));
        return;
      } else if (typeof (name) !== 'string') {
        reject(new Error('Device name must be a string.'));
        return;
      } else if (name.length > 32) {
        reject(new Error('Device name is too long. The length must be in the range 1 to 32.'));
        return;
      }
      let buf = Buffer.from(name, 'utf8');
      let char = this._generic_access_service.device_name.char;
      char.write(buf, false, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  _ledTurnOn(color, pattern, duration) {
    let color_number = 1;
    if (color) {
      let colors = this._services.led.colors;
      if (typeof (color) === 'number') {
        for (let name in colors) {
          if (colors[name] === color) {
            color_number = color;
            break;
          }
        }
      } else if (typeof (color) === 'string') {
        if (color in colors) {
          color_number = colors[color];
        }
      }
    }
    let pattern_number = 2;
    if (pattern) {
      let patterns = this._services.led.patterns;
      if (typeof (pattern) === 'number') {
        for (let name in patterns) {
          if (patterns[name] === pattern) {
            pattern_number = pattern;
            break;
          }
        }
      } else if (typeof (pattern) === 'string') {
        if (pattern in patterns) {
          pattern_number = patterns[pattern];
        }
      }
    }
    if (!duration || typeof (duration) !== 'number' || duration % 1 !== 0) {
      duration = 5;
    }
    let promise = new Promise((resolve, reject) => {
      this.write('SELECT_SETTING_INFORMATION', {
        SettingInformationRequest: {
          requestName: 'START_DEMONSTRATION'
        },
        SettingInformationData: [
          {
            settingName: 'LED',
            colorNumber: color_number,
            patternNumber: pattern_number,
            duration: duration
          }
        ]
      }).then((res) => {
        resolve(res.data);
      }).catch((error) => {
        reject(error);
      });
    });
    return promise;
  }

  _ledTurnOff() {
    return new Promise((resolve, reject) => {
      this.write('SELECT_SETTING_INFORMATION', {
        SettingInformationRequest: {
          requestName: 'STOP_DEMONSTRATION'
        }
      }).then((res) => {
        resolve(res.data);
      }).catch((error) => {
        reject(error);
      });
    });
  }

  _vibrationTurnOn(pattern, duration) {
    let pattern_number = 2;
    if (pattern) {
      let patterns = this._services.vibration.patterns;
      if (typeof (pattern) === 'number') {
        for (let name in patterns) {
          if (patterns[name] === pattern) {
            pattern_number = pattern;
            break;
          }
        }
      } else if (typeof (pattern) === 'string') {
        if (pattern in patterns) {
          pattern_number = patterns[pattern];
        }
      }
    }
    if (!duration || typeof (duration) !== 'number' || duration % 1 !== 0) {
      duration = 5;
    }
    return new Promise((resolve, reject) => {
      this.write('SELECT_SETTING_INFORMATION', {
        SettingInformationRequest: {
          requestName: 'START_DEMONSTRATION'
        },
        SettingInformationData: [
          {
            settingName: 'Vibration',
            patternNumber: pattern_number,
            duration: duration
          }
        ]
      }).then((res) => {
        resolve(res.data);
      }).catch((error) => {
        reject(error);
      });
    });
  }

  _vibrationTurnOff() {
    return new Promise((resolve, reject) => {
      this.write('SELECT_SETTING_INFORMATION', {
        SettingInformationRequest: {
          requestName: 'STOP_DEMONSTRATION'
        }
      }).then((res) => {
        resolve(res.data);
      }).catch((error) => {
        reject(error);
      });
    });
  }

  _createSensorServiceObject(sensor_type) {
    return {
      onnotify: null,
      start: () => {
        return this._setNotifySensorInfo(sensor_type, 1);
      },
      stop: () => {
        return this._setNotifySensorInfo(sensor_type, 0);
      },
      get: () => {
        return this._getSensorInfo(sensor_type);
      }
    };
  }

  _setNotifySensorInfo(sensor_type, status) {
    return new Promise((resolve, reject) => {
      this.write('SET_NOTIFY_SENSOR_INFO', {
        SensorType: sensor_type,
        Status: status
      }).then((res) => {
        resolve(res.data);
      }).catch((error) => {
        reject(error);
      });
    });
  }

  _getSensorInfo(sensor_type) {
    return new Promise((resolve, reject) => {
      this.write('GET_SENSOR_INFO', {
        SensorType: sensor_type
      }).then((res) => {
        if (sensor_type.toString().match(/^(0|1|2)$/)) { // Gyroscope, Accelerometer, Orientation
          let d = res.data;
          let data = {
            x: d.xValue,
            y: d.yValue,
            z: d.zValue
          };
          resolve(data);
        } else {
          resolve(res.data);
        }
      }).catch((error) => {
        reject(error);
      });
    });
  }
}

module.exports = LinkingDevice;
