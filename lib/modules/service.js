/* ------------------------------------------------------------------
* node-linking - service.js
*
* Copyright (c) 2017, Futomi Hatano, All rights reserved.
* Released under the MIT license
* Date: 2017-04-15
* ---------------------------------------------------------------- */
'use strict';
const LinkingServiceProperty     = require('./service-property.js');
const LinkingServiceNotification = require('./service-notification');
const LinkingServiceOperation    = require('./service-operation.js');
const LinkingServiceSensor       = require('./service-sensor.js');
const LinkingServiceSetting      = require('./service-setting.js');

/* ------------------------------------------------------------------
* Constructor: LinkingService()
* ---------------------------------------------------------------- */
const LinkingService = function() {
	this._services = {
		'00': new LinkingServiceProperty(),
		'01': new LinkingServiceNotification(),
		'02': new LinkingServiceOperation(),
		'03': new LinkingServiceSensor(),
		'04': new LinkingServiceSetting()
	};

	this._write_message_name_map = {
		// PeripheralDevicePropertyInformation Service
		'GET_DEVICE_INFORMATION'     : '00',
		// PeripheralDeviceNotification Service
		'CONFIRM_NOTIFY_CATEGORY'    : '01',
		'NOTIFY_INFORMATION'         : '01',
		// PeripheralDeviceSensorInformation Service
		'GET_SENSOR_INFO'            : '03',
		'SET_NOTIFY_SENSOR_INFO'     : '03',
		// PeripheralDeviceSettingOperation Service
		'GET_APP_VERSION'            : '04',
		'CONFIRM_INSTALL_APP'        : '04',
		'GET_SETTING_INFORMATION'    : '04',
		'GET_SETTING_NAME'           : '04',
		'SELECT_SETTING_INFORMATION' : '04'
	};

	this._device_info = null;
};

/* ------------------------------------------------------------------
* Method: setDeviceInfo(device_info)
* ---------------------------------------------------------------- */
LinkingService.prototype.setDeviceInfo = function(device_info) {
	for(let code in this._services) {
		this._services[code].setDeviceInfo(device_info);
	}
	this._device_info = device_info;
};

/* ------------------------------------------------------------------
* Method: parse(buf)
* ---------------------------------------------------------------- */
LinkingService.prototype.parseResponse = function(buf) {
	let service_id_hex = buf.slice(1, 2).toString('hex');
	let service = this._services[service_id_hex];
	if(!service) {
		return null;
	}
	let service_id = buf.readUInt8(1);
	let msg_id = buf.readUInt16LE(2);
	//let msg_id = buf.readUInt8(2);
	let msg_id_hex = buf.slice(2, 3).toString('hex');
	let pnum = buf.readUInt8(4);
	let payload_buf = buf.slice(5, buf.length);
	let parameters = service.parsePayload(pnum, payload_buf);

	let parsed = {
		buffer      : buf,
		serviceId   : service_id,
		serviceName : service.SERVICE_NAME,
		messageId   : msg_id,
		messageName : service.MESSAGE_NAME_MAP[msg_id_hex],
		parameters  : parameters 
	};
	return parsed;
};

/* ------------------------------------------------------------------
* Method: createRequest(message_name, params)
* ---------------------------------------------------------------- */
LinkingService.prototype.createRequest = function(message_name, params) {
	if(!(message_name in this._write_message_name_map)) {
		return null;
	}
	let sid = this._write_message_name_map[message_name];
	let service = this._services[sid];
	let buf = service.createRequest(message_name, params);
	return buf;
};

/* ------------------------------------------------------------------
* Method: isSupportedWriteMessageName(message_name)
* ---------------------------------------------------------------- */
LinkingService.prototype.isSupportedWriteMessageName = function(message_name) {
	if(!message_name) {
		return false;
	}
	let sid = this._write_message_name_map[message_name];
	if(!sid) {
		return false;
	}
	sid = parseInt(sid, 10);
	let services = (this._device_info && this._device_info['services']) ? this._device_info['services'] : null;
	if(!services) {
		return false;
	}
	let res = false;
	for(let k in services) {
		if(services[k] === sid) {
			res = true;
			break;
		}
	}
	return res;
};

module.exports = LinkingService;