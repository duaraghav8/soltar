/**
 *@fileoverview Exposes the module's API
 *@author Raghav Dua
 */

'use strict';

module.exports = {
	generate: require ('./lib/generator'),
	version: require ('./package.json').version
};