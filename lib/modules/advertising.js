/* ------------------------------------------------------------------
* node-linking - advertising.js
*
* Copyright (c) 2017-2021, Futomi Hatano, All rights reserved.
* Released under the MIT license
* Date: 2021-04-10
* ---------------------------------------------------------------- */
'use strict';
const LinkingIEEE754 = require('./ieee754.js');

class LinkingAdvertising {
  /* ------------------------------------------------------------------
  * Constructor
  * ---------------------------------------------------------------- */
  constructor() { }

  /* ------------------------------------------------------------------
  * parse(peripheral)
  * - Parse an advertising packet
  * 
  * [Arguments]
  * - peripheral   | Object  | Required | `Peripheral` object of the noble
  * 
  * [Returen value]
  * - An object representing the advertising packet
  * ---------------------------------------------------------------- */
  parse(peripheral) {
    let ad = peripheral.advertisement;
    let manu = ad.manufacturerData;
    if (!manu || manu.length < 8) {
      return null;
    }
    // Company identifier
    let company_id = manu.readUInt16LE(0);
    let company_name = 'Unknown';
    if (company_id === 0x02E2) {
      company_name = 'NTT docomo';
    }
    // Version
    let version = (manu.readUInt8(2) >>> 4);
    // Vendor identifier
    let vendor_id = ((manu.readUInt16BE(2) >>> 4) & 0b11111111);
    // Individual number
    let indi_num = ((manu.readUInt32BE(3) >>> 8) & (Math.pow(2, 20) - 1));
    // Beacon Data
    let beacon_data_list = [];
    for (let offset = 6; offset < manu.length; offset += 2) {
      let beacon_buf = manu.slice(offset, offset + 2);
      // Beacon service data
      if (beacon_buf.length === 2) {
        let beacon_data = this._parseBeaconServiceData(beacon_buf);
        beacon_data_list.push(beacon_data);
      }
    }

    return {
      id: peripheral.id,
      uuid: peripheral.uuid,
      address: peripheral.address,
      localName: ad.localName,
      serviceUuids: ad.serviceUuids,
      txPowerLevel: ad.txPowerLevel,
      rssi: peripheral.rssi,
      distance: Math.pow(10, (ad.txPowerLevel - peripheral.rssi) / 20),
      companyId: company_id,
      companyName: company_name,
      version: version,
      vendorId: vendor_id,
      individualNumber: indi_num,
      beaconDataList: beacon_data_list
    };
  }

  _parseBeaconServiceData(buf) {
    let bufn = buf.readUInt16BE(0);
    let service_id = (bufn >>> 12);
    let n = bufn & 0b0000111111111111;
    let res = {};
    if (service_id === 0) {
      res = {
        name: 'General',
      };
    } else if (service_id === 1) {
      res = {
        name: 'Temperature (°C)',
        temperature: LinkingIEEE754.read(n, 1, 4, 7)
      };
    } else if (service_id === 2) {
      res = {
        name: 'Humidity (%)',
        humidity: LinkingIEEE754.read(n, 0, 4, 8)
      };
    } else if (service_id === 3) {
      res = {
        name: 'Air pressure (hPa)',
        pressure: LinkingIEEE754.read(n, 0, 5, 7)
      };
    } else if (service_id === 4) {
      res = {
        name: 'Remaining battery power (Threshold value or less)',
        chargeRequired: (n & 0b0000100000000000) ? true : false,
        chargeLevel: Math.min((n & 0b0000011111111111) / 10, 100)
      };
    } else if (service_id === 5) {
      let code = n & 0b0000111111111111;
      let text = '';
      if (code === 0x00) {
        text = 'Power';
      } else if (code === 0x01) {
        text = 'Return';
      } else if (code === 0x02) {
        text = 'SingleClick';
      } else if (code === 0x03) {
        text = 'Home';
      } else if (code === 0x04) {
        text = 'DoubleClick';
      } else if (code === 0x05) {
        text = 'VolumeUp';
      } else if (code === 0x06) {
        text = 'VolumeDown';
      } else if (code === 0x07) {
        text = 'LongPress';
      } else if (code === 0x08) {
        text = 'Pause';
      } else if (code === 0x09) {
        text = 'LongPressRelease';
      } else if (code === 0x0A) {
        text = 'FastForward';
      } else if (code === 0x0B) {
        text = 'ReWind';
      } else if (code === 0x0C) {
        text = 'Shutter';
      } else if (code === 0x0D) {
        text = 'Up';
      } else if (code === 0x0E) {
        text = 'Down';
      } else if (code === 0x0F) {
        text = 'Left';
      } else if (code === 0x10) {
        text = 'Right';
      } else if (code === 0x11) {
        text = 'Enter';
      } else if (code === 0x12) {
        text = 'Menu';
      } else if (code === 0x13) {
        text = 'Play';
      } else if (code === 0x14) {
        text = 'Stop';
      }

      res = {
        name: 'Pressed button information',
        buttonId: code,
        buttonName: text
      };
    } else if (service_id === 6) {
      res = {
        name: 'Opening/closing',
        openingStatus: (n & 0b0000100000000000) ? true : false,
        openingCount: (n & 0b0000011111111111)
      };
    } else if (service_id === 7) {
      res = {
        name: 'Human detection',
        humanDetectionResponse: (n & 0b0000100000000000) ? true : false,
        humanDetectionCount: (n & 0b0000011111111111)
      };
    } else if (service_id === 8) {
      res = {
        name: 'Vibration',
        moveResponse: (n & 0b0000100000000000) ? true : false,
        moveCount: (n & 0b0000011111111111)
      };
    } else if (service_id === 9) {
      let illuminance = n;
      if (n >> 11) {
        illuminance = ((n - 2047) * 50) + 2000;
      }
      res = {
        name: 'Illuminance (lx)',
        illuminance: illuminance
      };
    } else if (service_id === 15) {
      res = {
        name: 'Vendor',
        bin: ('000000000000' + n.toString(2)).slice(-12),
      };
    }
    res['serviceId'] = service_id;
    return res;
  }
}

module.exports = new LinkingAdvertising();