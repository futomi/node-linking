/* ------------------------------------------------------------------
* node-linking - ieee754.js
*
* Copyright (c) 2017, Futomi Hatano, All rights reserved.
* Released under the MIT license
* Date: 2017-04-13
* ---------------------------------------------------------------- */
'use strict';

/* ------------------------------------------------------------------
* Constructor: LinkingIEEE754()
* ---------------------------------------------------------------- */
const LinkingIEEE754 = function() {};

/* ------------------------------------------------------------------
* Method: read(n, slen, elen, flen)
* - n   : Integer representing the buffer object (2 bytes)
* - slen: bit length of the sign (0 or 1)
* - elen: bit length of the exponent (4 or 5)
* - flen: bit length of the fraction (7 or 8)
* ---------------------------------------------------------------- */
LinkingIEEE754.prototype.read = function(n, slen, elen, flen) {
	let sgn = slen ? ((n >>> 11) & 0b1) : 0; // sign
	let max = Math.pow(2, elen) - 1; // maximum of exponent
	let exp = (n >>> flen) & max; // exponent
	let fra = 0; // fraction
	for(let i=0; i<flen; i++) {
		if((n >>> (flen - i - 1)) & 0b1) {
			fra += Math.pow(2, -(i+1));
		}
	}
	if(exp === 0 && fra === 0) {
		return 0;
	} else if(exp === 0 && fra !== 0) {
		let m = Math.pow(2, elen - 1) - 1; // median (7 or 15)
		let v = Math.pow(-1, sgn) * fra * Math.pow(2, (1 - m));
		return v;
	} else if(exp >= 1 && exp <= max - 1) {
		let m = Math.pow(2, elen - 1) - 1; // median (7 or 15)
		let v = Math.pow(-1, sgn) * (1 + fra) * Math.pow(2, (exp - m));
		return v;
	} else if(exp === max && fra === 0) {
		return Infinity;
	} else {
		return NaN;
	}
};

module.exports = new LinkingIEEE754();