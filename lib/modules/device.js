/* ------------------------------------------------------------------
* node-linking - device.js
*
* Copyright (c) 2017-2018, Futomi Hatano, All rights reserved.
* Released under the MIT license
* Date: 2018-06-06
* ---------------------------------------------------------------- */
'use strict';
const LinkingAdvertising = require('./advertising.js');
const LinkingService     = require('./service.js');

/* ------------------------------------------------------------------
* Constructor: LinkingDevice(peripheral)
* - peripheral:
*     A Peripheral object of the noble module
* ---------------------------------------------------------------- */
const LinkingDevice = function(noble, peripheral) {
	this.PRIMARY_SERVICE_UUID          = 'b3b3690150d34044808d50835b13a6cd';
	this.WRITE_CHARACTERRISTIC_UUID    = 'b3b3910150d34044808d50835b13a6cd';
	this.INDICATE_CHARACTERRISTIC_UUID = 'b3b3910250d34044808d50835b13a6cd';

	this.info = {};
	this.advertisement = LinkingAdvertising.parse(peripheral);
	this.connected = false;

	this.onconnect = null;
	this.ondisconnect = null;
	this.onnotify = null;

	this.services = {
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
		pressure: null
	};

	// Private
	this._wasClean = false;
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
};

/* ------------------------------------------------------------------
* Method: connect()
* ---------------------------------------------------------------- */
LinkingDevice.prototype.connect = function() {
	let promise = new Promise((resolve, reject) => {
		if(this.connected === false) {
			let p = this._peripheral;
			p.once('disconnect', () => {
				this.connected = false;
				if(this._isFunction(this.ondisconnect)) {
					this.ondisconnect({'wasClean': this._wasClean});
					this._wasClean = false;
				}
			});
			p.connect((error) => {
				if(error) {
					reject(new Error('Failed to connect to the device: ' + error.message));
				} else {
					this._init().then(() => {
						return this.write('GET_DEVICE_INFORMATION');
					}).then((res) => {
						this.info['id'] = '';
						if('deviceId' in res['data']) {
							this.info['id'] = res['data']['deviceId'];
						}
						this.info['uid'] = '';
						if('deviceUid' in res['data']) {
							this.info['uid'] = res['data']['deviceUid'];
						}
						this.info['services'] = {};
						if('serviceList' in res['data']) {
							res['data']['serviceList'].forEach((o) => {
								this.info['services'][o['name']] = o['id'];
							});
						}
						this.info['capabilities'] = {};
						if('deviceCapability' in res['data']) {
							res['data']['deviceCapability'].forEach((o) => {
								this.info['capabilities'][o['name']] = o['id'];
							});
						}
						this.info['exsensors'] = {};
						if('exSensorType' in res['data']) {
							res['data']['exSensorType'].forEach((o) => {
								this.info['exsensors'][o['name']] = o['id'];
							});
						}
						return this._writeConfirmNotifyCategory();
					}).then((res) => {
						this.info['notifyCategories'] = {};
						if(res) {
							if('notifyCategory' in res['data']) {
								res['data']['notifyCategory'].forEach((o) => {
									this.info['notifyCategories'][o['name']] = o['id'];
								});
							}
						}
						return this._writeGetSettingInformation();
					}).then((res) => {
						this.info['settings'] = {};
						if(res) {
							if('settingInformationData' in res['data']) {
								res['data']['settingInformationData'].forEach((o) => {
									this.info['settings'][o['name']] = o;
								});
							}
						}
						return this._writeGetSettingName('LEDColorName');
					}).then((res) => {
						if(res) {
							this.info['settings']['LED']['colors'] = res['data']['settingNameData'];
						}
						return this._writeGetSettingName('LEDPatternName');
					}).then((res) => {
						if(res) {
							this.info['settings']['LED']['patterns'] = res['data']['settingNameData'];
						}
						return this._writeGetSettingName('VibrationPatternName');
					}).then((res) => {
						if(res) {
							this.info['settings']['Vibration']['patterns'] = res['data']['settingNameData'];
						}
						return this._writeGetSettingName('BeepPatternName');
					}).then((res) => {
						if(res) {
							this.info['settings']['Beep']['patterns'] = res['data']['settingNameData'];
						}
						this._LinkingService.setDeviceInfo(this.info);
						this._initServices();

						this.connected = true;
						if(this._isFunction(this.onconnect)) {
							this.onconnect();
						}

						resolve();
					}).catch((error) => {
						reject(new Error('Failed to connect to the device: ' + error.message));
					});
				}
			});
		} else {
			reject(new Error('The device has been already connected.'));
		}
	});
	return promise;
};

LinkingDevice.prototype._writeConfirmNotifyCategory = function() {
	let promise = new Promise((resolve, reject) => {
		if(!('PeripheralDeviceNotification' in this.info['services'])) {
			resolve(null);
			return;
		}
		this.write('CONFIRM_NOTIFY_CATEGORY').then((res) => {
			resolve(res);
		}).catch((error) => {
			reject(error);
		});
	});
	return promise;
};

LinkingDevice.prototype._writeGetSettingInformation = function() {
	let promise = new Promise((resolve, reject) => {
		if(!('PeripheralDeviceSettingOperation' in this.info['services'])) {
			resolve(null);
			return;
		}
		this.write('GET_SETTING_INFORMATION').then((res) => {
			resolve(res);
		}).catch((error) => {
			reject(error);
		});
	});
	return promise;
};

LinkingDevice.prototype._writeGetSettingName = function(name) {
	let promise = new Promise((resolve, reject) => {
		if(!('PeripheralDeviceSettingOperation' in this.info['services'])) {
			resolve(null);
			return;
		}

		let s = this.info['settings'];
		if(name === 'LEDColorName') {
			if(!(('LED' in s) && s['LED']['colorMax'])) {
				resolve(null);
				return;
			}
		} else if(name === 'LEDPatternName') {
			if(!(('LED' in s) && s['LED']['patternMax'])) {
				resolve(null);
				return;
			}
		} else if(name === 'VibrationPatternName') {
			if(!(('Vibration' in s) && s['Vibration']['patternMax'])) {
				resolve(null);
				return;
			}
		} else if(name === 'BeepPatternName') {
			if(!(('Beep' in s) && s['Beep']['patternMax'])) {
				resolve(null);
				return;
			}
		}
		this.write('GET_SETTING_NAME', {SettingNameType: name}).then((res) => {
			resolve(res);
		}).catch((error) => {
			reject(error);
		});
	});
	return promise;
};

LinkingDevice.prototype._isFunction = function(o) {
	return (o && typeof(o) === 'function') ? true : false;
};

LinkingDevice.prototype._init = function() {
	let p = this._peripheral;
	let promise = new Promise((resolve, reject) => {
		this._getServicesAndChars().then(() => {
			return this._subscribeForIndicate();
		}).then(() => {
			resolve();
		}).catch((error) => {
			reject(new Error('Failed to initialize the device: ' + error.message));
		});
	});
	return promise;
};

LinkingDevice.prototype._getServicesAndChars = function() {
	let p = this._peripheral;
	let promise = new Promise((resolve, reject) => {
		p.discoverAllServicesAndCharacteristics((error, services, chars) => {
			if(error) {
				reject(new Error('Failed to discover services and characteristics: ' + error.message));
				return;
			}

			// Linking BLE Services
			let service = null;
			services.forEach((s) => {
				if(s.uuid === this.PRIMARY_SERVICE_UUID) {
					service = s;
				}
			});
			if(!service) {
				reject(new Error('No service was found'));
				return;
			}

			// Linking BLE Characteristics
			let write_char = null;
			let indicate_char = null;
			chars.forEach((c) => {
				if(c.uuid === this.WRITE_CHARACTERRISTIC_UUID) {
					write_char = c;
				} else if(c.uuid === this.INDICATE_CHARACTERRISTIC_UUID) {
					indicate_char = c;
				}
			});
			if(!(write_char && indicate_char)) {
				reject(new Error('No characteristic was found'));
				return;
			}

			this._service = service;
			this._chars = {
				write: write_char,
				indicate: indicate_char
			};

			// GATT Generic Access
			let ga_service = null;
			services.forEach((s) => {
				if(s.uuid === this._generic_access_service['SERVICE_UUID']) {
					ga_service = s;
				}
			});
			let ga_char = null;
			chars.forEach((c) => {
				if(c.uuid === this._generic_access_service['device_name']['CHARACTERRISTIC_UUID']) {
					ga_char = c;
				}
			});
			if(ga_service && ga_char) {
				this._generic_access_service['service'] = ga_service;
				this._generic_access_service['device_name']['char'] = ga_char;
			}

			resolve();
		});
	});
	return promise;
};

LinkingDevice.prototype._subscribeForIndicate = function() {
	let s = this._service;
	let c = this._chars['indicate'];
	let promise = new Promise((resolve, reject) => {
		c.on('data', (buf) => {
			this._receivedPacket(buf);
		});
		c.subscribe((error) => {
			if(error) {
				reject(new Error('Failed to subscribe for indicate: ' +  error.message));
			} else {
				resolve();
			}
		});
	});
	return promise;
};

LinkingDevice.prototype._receivedPacket = function(buf) {
	let new_buf = Buffer.alloc(buf.length - 1);
	buf.copy(new_buf, 0, 1, buf.length);
	this._div_packet_queue.push(new_buf);
	if(this._isExecutedPacket(buf)) {
		let header_byte = Buffer.from([buf.readUInt8(0)]);
		this._div_packet_queue.unshift(header_byte);
		let total_buf = Buffer.concat(this._div_packet_queue);
		this._receivedIndicate(total_buf);
		this._div_packet_queue = [];
	}
};

LinkingDevice.prototype._isExecutedPacket = function(buf) {
	let ph = buf.readUInt8(0);
	return (ph & 0x00000001) ? true : false;
}

LinkingDevice.prototype._receivedIndicate = function(buf) {
	let parsed = this._LinkingService.parseResponse(buf);
	if(!parsed) {
		return;
	}
	if(parsed['messageName'].match(/_RESP$/)) {
		if(this._onresponse) {
			this._onresponse(parsed);
		}
	} else {
		// All notifications
		if(this._isFunction(this.onnotify)) {
			this.onnotify(parsed);
		}
		// Button
		if(parsed['serviceId'] === 2) { // PeripheralDeviceOperation Service
			if(parsed['messageId'] === 0) { // NOTIFY_PD_OPERATION
				//let f = this.services['button']['onnotify'];
				let f = null;
				if(this.services['button']) {
					if(this._isFunction(this.services['button']['onnotify'])) {
						f = this.services['button']['onnotify'];
					}
				}
				if(f) {
					let button = null;
					parsed['parameters'].forEach((p) => {
						if(p['parameterId'] === 2) { // ButtonId
							button = {
								buttonId: p['buttonId'],
								buttonName: p['buttonName']
							};
						}
					});
					f(button);
				}
			}
		// Sensors
		} else if(parsed['serviceId'] === 3) { // PeripheralDeviceSensorInformation Service
			if(parsed['messageId'] === 4) { // NOTIFY_PD_SENSOR_INFO
				let sensor_type = -1;
				let res = {};
				parsed['parameters'].forEach((p) => {
					let pid = p['parameterId'];
					if(pid === 2) { // SensorType
						sensor_type = p['sensorTypeCode'];
					} else {
						if(sensor_type.toString().match(/^(0|1|2)$/)) { // Gyroscope, Accelerometer, Orientation
							if(pid === 4) { // X_value
								res['x'] = p['xValue'];
							} else if(pid === 5) { // Y_value
								res['y'] = p['yValue'];
							} else if(pid === 6) { // Z_value
								res['z'] = p['zValue'];
							}
						} else if(sensor_type === 3) { // Battery
							res = {
								'charge': p['charge'],
								'level'   : p['level']
							};
						} else if(sensor_type === 4) { // Temperature
							res['temperature'] = p['temperature'];
						} else if(sensor_type === 5) { // Humidity
							res['humidity'] = p['humidity'];
						}
					}
				});

				let f = null;
				if(sensor_type === 0) {
					if(this.services['gyroscope']) {
						f = this.services['gyroscope']['onnotify'];
					}
				} else if(sensor_type === 1) {
					if(this.services['accelerometer']) {
						f = this.services['accelerometer']['onnotify'];
					}
				} else if(sensor_type === 2) {
					if(this.services['orientation']) {
						f = this.services['orientation']['onnotify'];
					}
				} else if(sensor_type === 3) {
					if(this.services['battery']) {
						f = this.services['battery']['onnotify'];
					}
				} else if(sensor_type === 4) {
					if(this.services['temperature']) {
						f = this.services['temperature']['onnotify'];
					}
				} else if(sensor_type === 5) {
					if(this.services['humidity']) {
						f = this.services['humidity']['onnotify'];
					}
				}

				if(this._isFunction(f)) {
					f(res);
				}
			}
		}

	}
};

/* ------------------------------------------------------------------
* Method: disconnect()
* ---------------------------------------------------------------- */
LinkingDevice.prototype.disconnect = function() {
	let promise = new Promise((resolve, reject) => {
		let p = this._peripheral;
		if(this.connected === true) {
			this._wasClean = true;
			if('indicate' in this._chars) {
				this._chars['indicate'].unsubscribe();
				this._chars['indicate'].removeAllListeners();
			}
			p.disconnect((error) => {
				if(error) {
					reject(new Error('Failed to disconnect the device: ' + error.message));
				} else {
					this.connected = false;
					resolve();
				}
			});
		} else {
			resolve();
		}
	});
	return promise;
};

/* ------------------------------------------------------------------
* Method: write(message_name, params)
* ---------------------------------------------------------------- */
LinkingDevice.prototype.write = function(message_name, params) {
	let promise = new Promise((resolve, reject) => {
		let buf = this._LinkingService.createRequest(message_name, params);
		if(buf) {
			this._chars['write'].write(buf, false, (err) => {
				if(err) {
					reject(new Error('Failed to write the data: ' + err.message));
				} else {
					let timer = setTimeout(() => {
						this._onresponse = null;
						reject(new Error('Timeout'));
					}, this._write_response_timeout);
					this._onresponse = (res) => {
						if(res['messageName'] === message_name + '_RESP') {
							this._onresponse = null;
							clearTimeout(timer);
							let data = this._margeResponsePrameters(res);
							if(data) {
								res['data'] = data;
								resolve(res);
							} else {
								reject(new Error('Unknown response'));
							}
						}
					};
				}
			});
		} else {
			reject(new Error('The specified parameters are invalid.'));
		}
	});
	return promise;
};

LinkingDevice.prototype._margeResponsePrameters = function(res) {
	if(!res) {
		return null;
	}
	let parameters = res['parameters'];
	if(parameters && Array.isArray(parameters) && parameters.length > 0) {
		let data = {};
		parameters.forEach((p) => {
			for(let k in p) {
				if(!k.match(/^(name|parameterId)$/)) {
					data[k] = p[k];
				}
			}
		});
		return data;
	} else {
		return null;
	}
};

/* ------------------------------------------------------------------
* Services
* ---------------------------------------------------------------- */

LinkingDevice.prototype._initServices = function() {
	let device_name = this.advertisement.localName;
	// Device Name
	if(this._generic_access_service['device_name']['char']) {
		this.services['deviceName'] = {
			get: this._deviceNameGet.bind(this),
			set: this._deviceNameSet.bind(this)
		};
	}
	// Button
	if('Button' in this.info.exsensors || device_name.match(/^(Linking Board01|BLEAD\-LK\-TSH)/)) {
		this.services['button'] = {
			onnotify: null
		};
	}
	// LED
	if('LED' in this.info.settings) {
		let o = this.info.settings['LED'];
		if(o['colors'] && o['colors'].length > 0 && o['patterns'] && o['patterns'].length > 0) {
			let colors = {};
			for(let i=0; i<o['colors'].length; i++) {
				colors[o['colors'][i]] = i + 1;
			}
			let patterns = {};
			for(let i=0; i<o['patterns'].length; i++) {
				patterns[o['patterns'][i]] = i + 1;
			}
			this.services['led'] = {
				colors: colors,
				patterns: patterns,
				turnOn: this._ledTurnOn.bind(this),
				turnOff: this._ledTurnOff.bind(this)
			};
		} 
	}
	// Vibration
	if('Vibration' in this.info.settings) {
		let o = this.info.settings['Vibration'];
		if(o['patterns'] && o['patterns'].length > 0) {
			let patterns = {};
			for(let i=0; i<o['patterns'].length; i++) {
				patterns[o['patterns'][i]] = i + 1;
			}
			this.services['vibration'] = {
				patterns: patterns,
				turnOn: this._vibrationTurnOn.bind(this),
				turnOff: this._vibrationTurnOff.bind(this)
			};
		} 
	}
	// Battery
	if('Battery' in this.info.capabilities) {
		this.services['battery'] = {
			onnotify: null,
			start: this._batteryStart.bind(this),
			stop: this._batteryStop.bind(this),
			get: this._batteryGet.bind(this)
		};
	}
	// Gyroscope
	if('Gyroscope' in this.info.capabilities) {
		this.services['gyroscope'] = {
			onnotify: null,
			start: this._gyroscopeStart.bind(this),
			stop: this._gyroscopeStop.bind(this),
		};
	}
	// Accelerometer
	if('Accelerometer' in this.info.capabilities) {
		this.services['accelerometer'] = {
			onnotify: null,
			start: this._accelerometerStart.bind(this),
			stop: this._accelerometerStop.bind(this),
		};
	}
	// Orientation
	if('Orientation' in this.info.capabilities) {
		this.services['orientation'] = {
			onnotify: null,
			start: this._orientationStart.bind(this),
			stop: this._orientationStop.bind(this),
		};
	}
	// Temperature
	if('Temperature' in this.info.capabilities) {
		this.services['temperature'] = {
			onnotify: null,
			start: this._temperatureStart.bind(this),
			stop: this._temperatureStop.bind(this),
		};
	}
	// Humidity
	if('Humidity' in this.info.capabilities) {
		this.services['humidity'] = {
			onnotify: null,
			start: this._humidityStart.bind(this),
			stop: this._humidityStop.bind(this),
		};
	}
	// Atmospheric pressure
	if('Atmospheric pressure' in this.info.capabilities) {
		this.services['pressure'] = {
			onnotify: null,
			start: this._pressureStart.bind(this),
			stop: this._pressureStop.bind(this),
		};
	}
};

LinkingDevice.prototype._deviceNameGet = function() {
	let promise = new Promise((resolve, reject) => {
		let char = this._generic_access_service['device_name']['char'];
		char.read((error, data) => {
			if(error) {
				reject(error);
			} else {
				resolve({
					deviceName: data.toString('utf8')
				});
			}
		});
	});
	return promise;
};

LinkingDevice.prototype._deviceNameSet = function(name) {
	let promise = new Promise((resolve, reject) => {
		if(!name) {
			reject(new Error('Device name is required.'));
			return;
		} else if(typeof(name) !== 'string') {
			reject(new Error('Device name must be a string.'));
			return;
		} else if(name.length > 32) {
			reject(new Error('Device name is too long. The length must be in the range 1 to 32.'));
			return;
		}
		let buf = Buffer.from(name, 'utf8');
		let char = this._generic_access_service['device_name']['char'];
		char.write(buf, false, (error) => {
			if(error) {
				reject(error);
			} else {
				resolve();
			}
		});
	});
	return promise;
};

LinkingDevice.prototype._ledTurnOn = function(color, pattern, duration) {
	let color_number = 1;
	if(color) {
		let colors = this.services.led.colors;
		if(typeof(color) === 'number') {
			for(let name in colors) {
				if(colors[name] === color) {
					color_number = color;
					break;
				}
			}
		} else if(typeof(color) === 'string') {
			if(color in colors) {
				color_number = colors[color];
			}
		}
	}
	let pattern_number = 2;
	if(pattern) {
		let patterns = this.services.led.patterns;
		if(typeof(pattern) === 'number') {
			for(let name in patterns) {
				if(patterns[name] === pattern) {
					pattern_number = pattern;
					break;
				}
			}
		} else if(typeof(pattern) === 'string') {
			if(pattern in patterns) {
				pattern_number = patterns[pattern];
			}
		}
	}
	if(!duration || typeof(duration) !== 'number' || duration % 1 !== 0) {
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
			resolve(res['data']);
		}).catch((error) => {
			reject(error);
		});
	});
	return promise;
};

LinkingDevice.prototype._ledTurnOff = function() {
	let promise = new Promise((resolve, reject) => {
		this.write('SELECT_SETTING_INFORMATION', {
			SettingInformationRequest: {
				requestName: 'STOP_DEMONSTRATION'
			}
		}).then((res) => {
			resolve(res['data']);
		}).catch((error) => {
			reject(error);
		});
	});
	return promise;
};

LinkingDevice.prototype._vibrationTurnOn = function(pattern, duration) {
	let pattern_number = 2;
	if(pattern) {
		let patterns = this.services.vibration.patterns;
		if(typeof(pattern) === 'number') {
			for(let name in patterns) {
				if(patterns[name] === pattern) {
					pattern_number = pattern;
					break;
				}
			}
		} else if(typeof(pattern) === 'string') {
			if(pattern in patterns) {
				pattern_number = patterns[pattern];
			}
		}
	}
	if(!duration || typeof(duration) !== 'number' || duration % 1 !== 0) {
		duration = 5;
	}
	let promise = new Promise((resolve, reject) => {
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
			resolve(res['data']);
		}).catch((error) => {
			reject(error);
		});
	});
	return promise;
};

LinkingDevice.prototype._vibrationTurnOff = function() {
	let promise = new Promise((resolve, reject) => {
		this.write('SELECT_SETTING_INFORMATION', {
			SettingInformationRequest: {
				requestName: 'STOP_DEMONSTRATION'
			}
		}).then((res) => {
			resolve(res['data']);
		}).catch((error) => {
			reject(error);
		});
	});
	return promise;
};

LinkingDevice.prototype._batteryStart = function() {
	let promise = new Promise((resolve, reject) => {
		this.write('SET_NOTIFY_SENSOR_INFO', {
			SensorType: 0x03, // Battery
			Status: 1
		}).then((res) => {
			resolve(res['data']);
		}).catch((error) => {
			reject(error);
		});
	});
	return promise;
};

LinkingDevice.prototype._batteryStop = function() {
	let promise = new Promise((resolve, reject) => {
		this.write('SET_NOTIFY_SENSOR_INFO', {
			SensorType: 0x03, // Battery
			Status: 0
		}).then((res) => {
			resolve(res['data']);
		}).catch((error) => {
			reject(error);
		});
	});
	return promise;
};

LinkingDevice.prototype._batteryGet = function() {
	let promise = new Promise((resolve, reject) => {
		this.write('GET_SENSOR_INFO', {
			SensorType: 0x03 // Battery
		}).then((res) => {
			resolve(res['data']);
		}).catch((error) => {
			reject(error);
		});
	});
	return promise;
};

LinkingDevice.prototype._gyroscopeStart = function() {
	let promise = new Promise((resolve, reject) => {
		this.write('SET_NOTIFY_SENSOR_INFO', {
			SensorType: 0x00, // Gyroscope
			Status: 1
		}).then((res) => {
			resolve(res['data']);
		}).catch((error) => {
			reject(error);
		});
	});
	return promise;
};

LinkingDevice.prototype._gyroscopeStop = function() {
	let promise = new Promise((resolve, reject) => {
		this.write('SET_NOTIFY_SENSOR_INFO', {
			SensorType: 0x00, // Gyroscope
			Status: 0
		}).then((res) => {
			resolve(res['data']);
		}).catch((error) => {
			reject(error);
		});
	});
	return promise;
};

LinkingDevice.prototype._accelerometerStart = function() {
	let promise = new Promise((resolve, reject) => {
		this.write('SET_NOTIFY_SENSOR_INFO', {
			SensorType: 0x01, // Accelerometer
			Status: 1
		}).then((res) => {
			resolve(res['data']);
		}).catch((error) => {
			reject(error);
		});
	});
	return promise;
};

LinkingDevice.prototype._accelerometerStop = function() {
	let promise = new Promise((resolve, reject) => {
		this.write('SET_NOTIFY_SENSOR_INFO', {
			SensorType: 0x01, // Accelerometer
			Status: 0
		}).then((res) => {
			resolve(res['data']);
		}).catch((error) => {
			reject(error);
		});
	});
	return promise;
};

LinkingDevice.prototype._orientationStart = function() {
	let promise = new Promise((resolve, reject) => {
		this.write('SET_NOTIFY_SENSOR_INFO', {
			SensorType: 0x02, // Orientation
			Status: 1
		}).then((res) => {
			resolve(res['data']);
		}).catch((error) => {
			reject(error);
		});
	});
	return promise;
};

LinkingDevice.prototype._orientationStop = function() {
	let promise = new Promise((resolve, reject) => {
		this.write('SET_NOTIFY_SENSOR_INFO', {
			SensorType: 0x02, // Orientation
			Status: 0
		}).then((res) => {
			resolve(res['data']);
		}).catch((error) => {
			reject(error);
		});
	});
	return promise;
};

LinkingDevice.prototype._temperatureStart = function() {
	let promise = new Promise((resolve, reject) => {
		this.write('SET_NOTIFY_SENSOR_INFO', {
			SensorType: 0x04, // Temperature
			Status: 1
		}).then((res) => {
			resolve(res['data']);
		}).catch((error) => {
			reject(error);
		});
	});
	return promise;
};

LinkingDevice.prototype._temperatureStop = function() {
	let promise = new Promise((resolve, reject) => {
		this.write('SET_NOTIFY_SENSOR_INFO', {
			SensorType: 0x04, // Temperature
			Status: 0
		}).then((res) => {
			resolve(res['data']);
		}).catch((error) => {
			reject(error);
		});
	});
	return promise;
};

LinkingDevice.prototype._humidityStart = function() {
	let promise = new Promise((resolve, reject) => {
		this.write('SET_NOTIFY_SENSOR_INFO', {
			SensorType: 0x05, // Humidity
			Status: 1
		}).then((res) => {
			resolve(res['data']);
		}).catch((error) => {
			reject(error);
		});
	});
	return promise;
};

LinkingDevice.prototype._humidityStop = function() {
	let promise = new Promise((resolve, reject) => {
		this.write('SET_NOTIFY_SENSOR_INFO', {
			SensorType: 0x05, // Humidity
			Status: 0
		}).then((res) => {
			resolve(res['data']);
		}).catch((error) => {
			reject(error);
		});
	});
	return promise;
};

LinkingDevice.prototype._pressureStart = function() {
	let promise = new Promise((resolve, reject) => {
		this.write('SET_NOTIFY_SENSOR_INFO', {
			//SensorType: 0x00, // Gyroscope
			//SensorType: 0x01, // Accelerometer
			//SensorType: 0x02, // Orientation
			//SensorType: 0x03, // Battery
			//SensorType: 0x04, // Temperature
			//SensorType: 0x05, // Humidity
			SensorType: 0x06, // Atmospheric pressure
			//SensorType: 0x07, // Opening and closing
			//SensorType: 0x08, // Human detection
			//SensorType: 0x09, // Move
			Status: 1
		}).then((res) => {
			resolve(res['data']);
		}).catch((error) => {
			reject(error);
		});
	});
	return promise;
};

LinkingDevice.prototype._pressureStop = function() {
	let promise = new Promise((resolve, reject) => {
		this.write('SET_NOTIFY_SENSOR_INFO', {
			//SensorType: 0x00, // Gyroscope
			//SensorType: 0x01, // Accelerometer
			//SensorType: 0x02, // Orientation
			//SensorType: 0x03, // Battery
			//SensorType: 0x04, // Temperature
			//SensorType: 0x05, // Humidity
			SensorType: 0x06, // Atmospheric pressure
			//SensorType: 0x07, // Opening and closing
			//SensorType: 0x08, // Human detection
			//SensorType: 0x09, // Move
			Status: 0
		}).then((res) => {
			resolve(res['data']);
		}).catch((error) => {
			reject(error);
		});
	});
	return promise;
};






module.exports = LinkingDevice;
