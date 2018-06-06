/* ------------------------------------------------------------------
* node-linking - linking.js
*
* Copyright (c) 2017, Futomi Hatano, All rights reserved.
* Released under the MIT license
* Date: 2018-06-05
* ---------------------------------------------------------------- */
'use strict';
const LinkingDevice = require('./modules/device.js');
const LinkingAdvertising = require('./modules/advertising.js');

/* ------------------------------------------------------------------
* Constructor: Linking(params)
* - params:
*     noble  : The Nobel object created by the noble module.
*              This parameter is optional. If you don't specify
*              this parameter, this module automatically creates it.
* ---------------------------------------------------------------- */
const Linking = function(params) {
	// Plublic properties
	this.noble = null;
	if(params && 'noble' in params) {
		if(typeof(params['noble']) === 'object') {
			this.noble = params['noble'];
		} else {
			throw new Error('The value of the "noble" property is invalid.');
		}
	} else {
		this.noble = require('noble');
	}
	this.onadvertisement = null;
	this.ondiscover = null;

	this.PRIMARY_SERVICE_UUID_LIST = ['b3b3690150d34044808d50835b13a6cd', 'fe4e'];

	// Private properties
	this._discover_status = false;
	this._discover_wait = 3000; // ms
	this._discover_timer = null;
	this._peripherals = {};
};

/* ------------------------------------------------------------------
* Method: init()
* ---------------------------------------------------------------- */
Linking.prototype.init = function() {
	let promise = new Promise((resolve, reject) => {
		this.initialized = false;
		if(this.noble.state === 'poweredOn') {
			this.initialized = true;
			resolve();
		} else {
			this.noble.once('stateChange', (state) => {
				if(state === 'poweredOn') {
					this.initialized = true;
					resolve();
				} else {
					let err = new Error('Failed to initialize the Noble object: ' + state);
					reject(err);
				}
			});
		}
	});
	return promise;
};

/* ------------------------------------------------------------------
* Method: discover([p])
* - p = {
*     duration: 5000, // Duration for discovery process (msec)
*     nameFilter: '',  // Forward match
*     idFilter: '' // Forward match
*     quick: false
*   }
* ---------------------------------------------------------------- */
Linking.prototype.discover = function(p) {
	this._checkInitialized();

	let duration = 5000;
	let name_filter = '';
	let id_filter = '';
	let quick = false;
	if(p && typeof(p) === 'object') {
		if(('duration' in p) && typeof(p['duration']) === 'number') {
			duration = p['duration'];
			if(duration < 1000) {
				duration = 1000;
			}
		}
		if(('nameFilter' in p) && typeof(p['nameFilter'] === 'string')) {
			name_filter = p['nameFilter'];
		}
		if(('idFilter' in p) && typeof(p['idFilter'] === 'string')) {
			id_filter = p['idFilter'];
		}
		if(('quick' in p) && typeof(p['quick'] === 'boolean')) {
			quick = p['quick'];
		}
	}

	let promise = new Promise((resolve, reject) => {
		let timer = null;
		let finishDiscovery = () => {
			if(timer) {
				clearTimeout(timer);
			}
			this.stopScan();
			let device_list = [];
			for(let addr in this._peripherals) {
				device_list.push(this._peripherals[addr]);
			}
			resolve(device_list);
		};
		this._peripherals = {};
		this.noble.on('discover', (peripheral) => {
			let dev = this._discoveredDevice(peripheral, name_filter, id_filter);
			if(quick && dev) {
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
	return promise;
};

Linking.prototype._checkInitialized = function() {
	if(this.initialized === false) {
		throw new Error('The `init()` method has not been called yet.');
		return;
	}
	if(this._discover_status === true) {
		throw new Error('The `discover()` or the `startScan()` method is in progress.');
		return;
	}
};

Linking.prototype._discoveredDevice = function(peripheral, name_filter, id_filter) {
	var ad = peripheral.advertisement;
	if(!ad.localName) { return null; }
	if(!peripheral.id) { return null; }
	if(name_filter && ad.localName.indexOf(name_filter) !== 0) { return null; }
	if(id_filter && peripheral.id.indexOf(id_filter) !== 0) { return null; }
	var addr = peripheral.address;
	if(this._peripherals[addr]) {
		return null;
	}
	let device = new LinkingDevice(this.noble, peripheral);
	if(this.ondiscover && typeof(this.ondiscover) === 'function') {
		this.ondiscover(device);
	}
	this._peripherals[addr] = device;
	return device;
};

Linking.prototype._scanDevices = function() {
	this.noble.startScanning(this.PRIMARY_SERVICE_UUID_LIST, false);
	this._discover_timer = setTimeout(() => {
		this.noble.stopScanning();
		if(this._discover_status === true) {
			this._scanDevices();
		}
	}, this._discover_wait);
};

/* ------------------------------------------------------------------
* Method: stopScan()
* ---------------------------------------------------------------- */
Linking.prototype.stopScan = function() {
	this.noble.removeAllListeners('discover');
	if(this._discover_status === true) {
		this._discover_status = false;
		if(this._discover_timer !== null) {
			clearTimeout(this._discover_timer);
			this._discover_timer = null;
		}
		this.noble.stopScanning();
	}
};

/* ------------------------------------------------------------------
* Method: startScan([p])
* - p = {
*     nameFilter: '', // Forward match
*     idFilter: '' // Forward match
*   }
* ---------------------------------------------------------------- */
Linking.prototype.startScan = function(p) {
	this._checkInitialized();
	let name_filter = '';
	let id_filter = '';
	if(p && typeof(p) === 'object') {
		if(('nameFilter' in p) && typeof(p['nameFilter'] === 'string')) {
			name_filter = p['nameFilter'];
		}
		if(('idFilter' in p) && typeof(p['idFilter'] === 'string')) {
			id_filter = p['idFilter'];
		}
	}
	this.noble.on('discover', (peripheral) => {
		var ad = peripheral.advertisement;
		if(!ad.localName) { return; }
		if(name_filter && ad.localName.indexOf(name_filter) !== 0) { return; }
		if(id_filter && peripheral.id.indexOf(id_filter) !== 0) { return; }
		if(this.onadvertisement && typeof(this.onadvertisement) === 'function') {
			let parsed = LinkingAdvertising.parse(peripheral);
			if(parsed) {
				this.onadvertisement(parsed);
			}
		}
	});
	this.noble.startScanning(this.PRIMARY_SERVICE_UUID_LIST, true);
	this._discover_status = true;
};

module.exports = Linking;
