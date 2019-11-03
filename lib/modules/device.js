/* ------------------------------------------------------------------
* node-linking - device.js
*
* Copyright (c) 2017-2019, Futomi Hatano, All rights reserved.
* Released under the MIT license
* Date: 2019-11-03
* ---------------------------------------------------------------- */
'use strict';
const LinkingAdvertising = require('./advertising.js');
const LinkingService = require('./service.js');

/* ------------------------------------------------------------------
* Constructor: LinkingDevice(peripheral)
* - peripheral:
*     A Peripheral object of the noble module
* ---------------------------------------------------------------- */
const LinkingDevice = function (noble, peripheral) {
	this.PRIMARY_SERVICE_UUID = 'b3b3690150d34044808d50835b13a6cd';
	this.WRITE_CHARACTERRISTIC_UUID = 'b3b3910150d34044808d50835b13a6cd';
	this.INDICATE_CHARACTERRISTIC_UUID = 'b3b3910250d34044808d50835b13a6cd';

	this.info = {};
	this.advertisement = LinkingAdvertising.parse(peripheral);
	this.connected = false;

	this.onconnect = null;
	this.onconnectprogress = null;
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
		pressure: null,
		openclose: null,
		human: null,
		move: null,
		illuminance: null
	};

	// Private
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
LinkingDevice.prototype.connect = function () {
	let promise = new Promise((resolve, reject) => {
		if (this.connected === true) {
			reject(new Error('The device has been already connected.'));
			return;
		}

		let p = this._peripheral;

		let onprogress = this.onconnectprogress;
		if (!this._isFunction(this.onconnectprogress)) {
			onprogress = () => { };
		}

		onprogress({ step: 1, desc: 'CONNECTING' });

		p.connect((error) => {
			if (error) {
				reject(new Error('Failed to connect to the device: ' + error.message));
				return;
			}
			onprogress({ step: 2, desc: 'CONNECTION_ESTABLISHED' });

			p.once('disconnect', () => {
				this._clean();
				if (this._isFunction(this.ondisconnect)) {
					this.ondisconnect({ 'wasClean': false });
				}
			});

			this._wait(300).then(() => {
				onprogress({ step: 3, desc: 'GETTING_CHARACTERISTICS' });
				return this._getServicesAndChars();
			}).then(() => {
				onprogress({ step: 4, desc: 'SUBSCRIBING' });
				return this._subscribeForIndicate();
			}).then(() => {
				onprogress({ step: 5, desc: 'GETTING_DEVICE_INFOMATION' });
				return this.write('GET_DEVICE_INFORMATION');
			}).then((res) => {
				this.info['id'] = '';
				if ('deviceId' in res['data']) {
					this.info['id'] = res['data']['deviceId'];
				}
				this.info['uid'] = '';
				if ('deviceUid' in res['data']) {
					this.info['uid'] = res['data']['deviceUid'];
				}
				this.info['services'] = {};
				if ('serviceList' in res['data']) {
					res['data']['serviceList'].forEach((o) => {
						this.info['services'][o['name']] = o['id'];
					});
				}
				this.info['capabilities'] = {};
				if ('deviceCapability' in res['data']) {
					res['data']['deviceCapability'].forEach((o) => {
						this.info['capabilities'][o['name']] = o['id'];
					});
				}
				this.info['exsensors'] = {};
				if ('exSensorType' in res['data']) {
					res['data']['exSensorType'].forEach((o) => {
						this.info['exsensors'][o['name']] = o['id'];
					});
				}
				onprogress({ step: 6, desc: 'GETTING_NOTIFY_CATEGORIES' });
				return this._writeConfirmNotifyCategory();
			}).then((res) => {
				this.info['notifyCategories'] = {};
				if (res) {
					if ('notifyCategory' in res['data']) {
						res['data']['notifyCategory'].forEach((o) => {
							this.info['notifyCategories'][o['name']] = o['id'];
						});
					}
				}
				onprogress({ step: 7, desc: 'GETTING_SETTING_INFORMATION' });
				return this._writeGetSettingInformation();
			}).then((res) => {
				this.info['settings'] = {};
				if (res) {
					if ('settingInformationData' in res['data']) {
						res['data']['settingInformationData'].forEach((o) => {
							this.info['settings'][o['name']] = o;
						});
					}
				}
				onprogress({ step: 8, desc: 'GETTING_LED_COLOR_NAMES' });
				return this._writeGetSettingName('LEDColorName');
			}).then((res) => {
				if (res) {
					this.info['settings']['LED']['colors'] = res['data']['settingNameData'];
				}
				onprogress({ step: 9, desc: 'GETTING_LED_PATTERN_NAMES' });
				return this._writeGetSettingName('LEDPatternName');
			}).then((res) => {
				if (res) {
					this.info['settings']['LED']['patterns'] = res['data']['settingNameData'];
				}
				onprogress({ step: 10, desc: 'GETTING_VIBRATION_PATTERN_NAMES' });
				return this._writeGetSettingName('VibrationPatternName');
			}).then((res) => {
				if (res) {
					this.info['settings']['Vibration']['patterns'] = res['data']['settingNameData'];
				}
				onprogress({ step: 11, desc: 'GETTING_BEEP_PATTERN_NAMES' });
				return this._writeGetSettingName('BeepPatternName');
			}).then((res) => {
				if (res) {
					this.info['settings']['Beep']['patterns'] = res['data']['settingNameData'];
				}
				this._LinkingService.setDeviceInfo(this.info);
				this._initServices();

				this.connected = true;
				if (this._isFunction(this.onconnect)) {
					this.onconnect();
				}

				onprogress({ step: 12, desc: 'COMPLETED' });
				resolve();
			}).catch((error) => {
				p.disconnect();
				onprogress({ step: 0, desc: 'FAILED' });
				reject(error);
			});
		});
	});
	return promise;
};

LinkingDevice.prototype._wait = function (msec) {
	let promise = new Promise((resolve, reject) => {
		setTimeout(() => {
			resolve();
		}, msec);
	});
	return promise;
};

LinkingDevice.prototype._writeConfirmNotifyCategory = function () {
	let promise = new Promise((resolve, reject) => {
		if (!('PeripheralDeviceNotification' in this.info['services'])) {
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

LinkingDevice.prototype._writeGetSettingInformation = function () {
	let promise = new Promise((resolve, reject) => {
		if (!('PeripheralDeviceSettingOperation' in this.info['services'])) {
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

LinkingDevice.prototype._writeGetSettingName = function (name) {
	let promise = new Promise((resolve, reject) => {
		if (!('PeripheralDeviceSettingOperation' in this.info['services'])) {
			resolve(null);
			return;
		}

		let s = this.info['settings'];
		if (name === 'LEDColorName') {
			if (!(('LED' in s) && s['LED']['colorMax'])) {
				resolve(null);
				return;
			}
		} else if (name === 'LEDPatternName') {
			if (!(('LED' in s) && s['LED']['patternMax'])) {
				resolve(null);
				return;
			}
		} else if (name === 'VibrationPatternName') {
			if (!(('Vibration' in s) && s['Vibration']['patternMax'])) {
				resolve(null);
				return;
			}
		} else if (name === 'BeepPatternName') {
			if (!(('Beep' in s) && s['Beep']['patternMax'])) {
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
	return promise;
};

LinkingDevice.prototype._isFunction = function (o) {
	return (o && typeof (o) === 'function') ? true : false;
};

LinkingDevice.prototype._getServicesAndChars = function () {
	let p = this._peripheral;
	let promise = new Promise((resolve, reject) => {
		// Set timeout timer
		let timer = setTimeout(() => {
			reject(new Error('Failed to discover services and characteristics: TIMEOUT'));
		}, 5000);

		// Discover services and characteristics
		p.discoverAllServicesAndCharacteristics((error, services, chars) => {
			clearTimeout(timer);
			timer = null;
			if (error) {
				reject(new Error('Failed to discover services and characteristics: ' + error.message));
				return;
			}

			// Linking BLE Services
			let service = null;
			services.forEach((s) => {
				if (s.uuid === this.PRIMARY_SERVICE_UUID) {
					service = s;
				}
			});
			if (!service) {
				reject(new Error('No service was found'));
				return;
			}

			// Linking BLE Characteristics
			let write_char = null;
			let indicate_char = null;
			chars.forEach((c) => {
				if (c.uuid === this.WRITE_CHARACTERRISTIC_UUID) {
					write_char = c;
				} else if (c.uuid === this.INDICATE_CHARACTERRISTIC_UUID) {
					indicate_char = c;
				}
			});
			if (!(write_char && indicate_char)) {
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
				if (s.uuid === this._generic_access_service['SERVICE_UUID']) {
					ga_service = s;
				}
			});
			let ga_char = null;
			chars.forEach((c) => {
				if (c.uuid === this._generic_access_service['device_name']['CHARACTERRISTIC_UUID']) {
					ga_char = c;
				}
			});
			if (ga_service && ga_char) {
				this._generic_access_service['service'] = ga_service;
				this._generic_access_service['device_name']['char'] = ga_char;
			}

			resolve();
		});
	});
	return promise;
};

LinkingDevice.prototype._subscribeForIndicate = function () {
	let promise = new Promise((resolve, reject) => {
		// Set timeout timer
		let timer = setTimeout(() => {
			reject(new Error('Failed to subscribe to a characteristic for indicate: TIMEOUT'));
		}, 5000);

		// Subscribe to the characteristic for indicate
		this._chars['indicate'].subscribe((error) => {
			clearTimeout(timer);
			timer = null;
			if (error) {
				reject(new Error('Failed to subscribe to a characteristic for indicate: ' + error.message));
			} else {
				this._chars['indicate'].on('data', (buf) => {
					this._receivedPacket(buf);
				});
				resolve();
			}
		});
	});
	return promise;
};

LinkingDevice.prototype._receivedPacket = function (buf) {
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
};

LinkingDevice.prototype._isExecutedPacket = function (buf) {
	let ph = buf.readUInt8(0);
	return (ph & 0x00000001) ? true : false;
}

LinkingDevice.prototype._receivedIndicate = function (buf) {
	let parsed = this._LinkingService.parseResponse(buf);
	if (!parsed) {
		return;
	}
	if (parsed['messageName'].match(/_RESP$/)) {
		if (this._onresponse) {
			this._onresponse(parsed);
		}
	} else {
		// All notifications
		if (this._isFunction(this.onnotify)) {
			this.onnotify(parsed);
		}
		// Button
		if (parsed['serviceId'] === 2) { // PeripheralDeviceOperation Service
			if (parsed['messageId'] === 0) { // NOTIFY_PD_OPERATION
				//let f = this.services['button']['onnotify'];
				let f = null;
				if (this.services['button']) {
					if (this._isFunction(this.services['button']['onnotify'])) {
						f = this.services['button']['onnotify'];
					}
				}
				if (f) {
					let button = null;
					parsed['parameters'].forEach((p) => {
						if (p['parameterId'] === 2) { // ButtonId
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
		} else if (parsed['serviceId'] === 3) { // PeripheralDeviceSensorInformation Service
			if (parsed['messageId'] === 4) { // NOTIFY_PD_SENSOR_INFO
				let sensor_type = -1;
				let res = {};
				parsed['parameters'].forEach((p) => {
					let pid = p['parameterId'];
					if (pid === 2) { // SensorType
						sensor_type = p['sensorTypeCode'];
					} else {
						if (sensor_type.toString().match(/^(0|1|2)$/)) { // Gyroscope, Accelerometer, Orientation
							if (pid === 4) { // X_value
								res['x'] = p['xValue'];
							} else if (pid === 5) { // Y_value
								res['y'] = p['yValue'];
							} else if (pid === 6) { // Z_value
								res['z'] = p['zValue'];
							}
						} else if (sensor_type === 3) { // Battery
							res = {
								'charge': p['charge'],
								'level': p['level']
							};
						} else if (sensor_type === 4) { // Temperature
							res['temperature'] = p['temperature'];
						} else if (sensor_type === 5) { // Humidity
							res['humidity'] = p['humidity'];
						} else if (sensor_type === 6) { // Aire pressure
							res['pressure'] = p['pressure'];
						} else if (sensor_type === 7) { // Opening and closing
							res['openclose'] = p['openclose'];
						} else if (sensor_type === 8) { // Human detection
							res['human'] = p['human'];
						} else if (sensor_type === 9) { // Move
							res['move'] = p['move'];
						} else if (sensor_type === 0x0a) { // Illuminance
							res['illuminance'] = p['illuminance'];
						}
					}
				});

				let f = null;
				if (sensor_type === 0) {
					if (this.services['gyroscope']) {
						f = this.services['gyroscope']['onnotify'];
					}
				} else if (sensor_type === 1) {
					if (this.services['accelerometer']) {
						f = this.services['accelerometer']['onnotify'];
					}
				} else if (sensor_type === 2) {
					if (this.services['orientation']) {
						f = this.services['orientation']['onnotify'];
					}
				} else if (sensor_type === 3) {
					if (this.services['battery']) {
						f = this.services['battery']['onnotify'];
					}
				} else if (sensor_type === 4) {
					if (this.services['temperature']) {
						f = this.services['temperature']['onnotify'];
					}
				} else if (sensor_type === 5) {
					if (this.services['humidity']) {
						f = this.services['humidity']['onnotify'];
					}
				} else if (sensor_type === 6) {
					if (this.services['pressure']) {
						f = this.services['pressure']['onnotify'];
					}
				} else if (sensor_type === 7) {
					if (this.services['openclose']) {
						f = this.services['openclose']['onnotify'];
					}
				} else if (sensor_type === 8) {
					if (this.services['human']) {
						f = this.services['human']['onnotify'];
					}
				} else if (sensor_type === 9) {
					if (this.services['move']) {
						f = this.services['move']['onnotify'];
					}
				} else if (sensor_type === 0x0a) {
					if (this.services['illuminance']) {
						f = this.services['illuminance']['onnotify'];
					}
				}

				if (this._isFunction(f)) {
					f(res);
				}
			}
		}

	}
};

/* ------------------------------------------------------------------
* Method: disconnect()
* ---------------------------------------------------------------- */
LinkingDevice.prototype.disconnect = function () {
	let promise = new Promise((resolve, reject) => {
		if (this.connected === false) {
			this._clean();
			resolve();
			return;
		}
		this._clean();
		this._peripheral.disconnect(() => {
			if (this._isFunction(this.ondisconnect)) {
				this.ondisconnect({ 'wasClean': true });
			}
			resolve();
		});
	});
	return promise;
};

LinkingDevice.prototype._clean = function () {
	let p = this._peripheral;
	if (!p) {
		return;
	}
	if (this._chars['indicate']) {
		this._chars['indicate'].unsubscribe();
		this._chars['indicate'].removeAllListeners();
	}
	p.removeAllListeners();
	this.connected = false;
	this._service = null;
	this._chars = {
		write: null,
		indicate: null
	};
	this._div_packet_queue = [];
	this._onresponse = null;
};

/* ------------------------------------------------------------------
* Method: write(message_name, params)
* ---------------------------------------------------------------- */
LinkingDevice.prototype.write = function (message_name, params) {
	let promise = new Promise((resolve, reject) => {
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
			if (res['messageName'] === message_name + '_RESP') {
				this._onresponse = null;
				clearTimeout(timer);
				let data = this._margeResponsePrameters(res);
				if (data) {
					res['data'] = data;
					resolve(res);
				} else {
					reject(new Error('Unknown response'));
				}
			}
		};

		this._chars['write'].write(buf, false, (err) => {
			if (err) {
				reject(new Error('Failed to write the data: ' + err.message));
				return;
			}
		});
	});
	return promise;
};

LinkingDevice.prototype._margeResponsePrameters = function (res) {
	if (!res) {
		return null;
	}
	let parameters = res['parameters'];
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
};

/* ------------------------------------------------------------------
* Services
* ---------------------------------------------------------------- */

LinkingDevice.prototype._initServices = function () {
	let device_name = this.advertisement.localName;
	// Device Name
	if (this._generic_access_service['device_name']['char']) {
		this.services['deviceName'] = {
			get: this._deviceNameGet.bind(this),
			set: this._deviceNameSet.bind(this)
		};
	}
	// Button
	if ('Button' in this.info.exsensors || device_name.match(/^(Linking Board01|BLEAD\-LK\-TSH)/)) {
		this.services['button'] = {
			onnotify: null
		};
	}
	// LED
	if ('LED' in this.info.settings) {
		let o = this.info.settings['LED'];
		if (o['colors'] && o['colors'].length > 0 && o['patterns'] && o['patterns'].length > 0) {
			let colors = {};
			for (let i = 0; i < o['colors'].length; i++) {
				colors[o['colors'][i]] = i + 1;
			}
			let patterns = {};
			for (let i = 0; i < o['patterns'].length; i++) {
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
	if ('Vibration' in this.info.settings) {
		let o = this.info.settings['Vibration'];
		if (o['patterns'] && o['patterns'].length > 0) {
			let patterns = {};
			for (let i = 0; i < o['patterns'].length; i++) {
				patterns[o['patterns'][i]] = i + 1;
			}
			this.services['vibration'] = {
				patterns: patterns,
				turnOn: this._vibrationTurnOn.bind(this),
				turnOff: this._vibrationTurnOff.bind(this)
			};
		}
	}
	// Gyroscope
	if ('Gyroscope' in this.info.capabilities) {
		this.services['gyroscope'] = this._createSensorServiceObject(0x00);
	}
	// Accelerometer
	if ('Accelerometer' in this.info.capabilities) {
		this.services['accelerometer'] = this._createSensorServiceObject(0x01);
	}
	// Orientation
	if ('Orientation' in this.info.capabilities) {
		this.services['orientation'] = this._createSensorServiceObject(0x02);
	}
	// Battery
	if ('Battery' in this.info.capabilities) {
		this.services['battery'] = this._createSensorServiceObject(0x03);
	}
	// Temperature
	if ('Temperature' in this.info.capabilities) {
		this.services['temperature'] = this._createSensorServiceObject(0x04);
	}
	// Humidity
	if ('Humidity' in this.info.capabilities) {
		this.services['humidity'] = this._createSensorServiceObject(0x05);
	}
	// Atmospheric pressure
	if ('Atmospheric pressure' in this.info.capabilities) {
		this.services['pressure'] = this._createSensorServiceObject(0x06);
	}
	// Opening and closing
	if ('Opening and closing' in this.info.exsensors) {
		this.services['openclose'] = this._createSensorServiceObject(0x07);
	}
	// Human detection
	if ('Human detection' in this.info.exsensors) {
		this.services['human'] = this._createSensorServiceObject(0x08);
	}
	// Move
	if ('Move' in this.info.exsensors) {
		this.services['move'] = this._createSensorServiceObject(0x09);
	}
	// Illuminance
	if ('Illuminance' in this.info.exsensors) {
		this.services['illuminance'] = this._createSensorServiceObject(0x0a);
	}
};

LinkingDevice.prototype._deviceNameGet = function () {
	let promise = new Promise((resolve, reject) => {
		let char = this._generic_access_service['device_name']['char'];
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
	return promise;
};

LinkingDevice.prototype._deviceNameSet = function (name) {
	let promise = new Promise((resolve, reject) => {
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
		let char = this._generic_access_service['device_name']['char'];
		char.write(buf, false, (error) => {
			if (error) {
				reject(error);
			} else {
				resolve();
			}
		});
	});
	return promise;
};

LinkingDevice.prototype._ledTurnOn = function (color, pattern, duration) {
	let color_number = 1;
	if (color) {
		let colors = this.services.led.colors;
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
		let patterns = this.services.led.patterns;
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
			resolve(res['data']);
		}).catch((error) => {
			reject(error);
		});
	});
	return promise;
};

LinkingDevice.prototype._ledTurnOff = function () {
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

LinkingDevice.prototype._vibrationTurnOn = function (pattern, duration) {
	let pattern_number = 2;
	if (pattern) {
		let patterns = this.services.vibration.patterns;
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

LinkingDevice.prototype._vibrationTurnOff = function () {
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

LinkingDevice.prototype._createSensorServiceObject = function (sensor_type) {
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
};

LinkingDevice.prototype._setNotifySensorInfo = function (sensor_type, status) {
	let promise = new Promise((resolve, reject) => {
		this.write('SET_NOTIFY_SENSOR_INFO', {
			SensorType: sensor_type,
			Status: status
		}).then((res) => {
			resolve(res['data']);
		}).catch((error) => {
			reject(error);
		});
	});
	return promise;
};

LinkingDevice.prototype._getSensorInfo = function (sensor_type) {
	let promise = new Promise((resolve, reject) => {
		this.write('GET_SENSOR_INFO', {
			SensorType: sensor_type
		}).then((res) => {
			if (sensor_type.toString().match(/^(0|1|2)$/)) { // Gyroscope, Accelerometer, Orientation
				let d = res['data'];
				let data = {
					x: d['xValue'],
					y: d['yValue'],
					z: d['zValue']
				};
				resolve(data);
			} else {
				resolve(res['data']);
			}
		}).catch((error) => {
			reject(error);
		});
	});
	return promise;
};

module.exports = LinkingDevice;
