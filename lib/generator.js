/**
 *@fileoverview Implementation of code generating engine
 *@author Raghav Dua
 */

 'use strict';

function getDefaultOptions () {

}

function fillGapsDeeply (defaultOpts, opts) {
	var options = {};

	Object.keys (defaultOpts).forEach (function (key) {
 		var defOpt = defaultOpts [key];

 		if (typeof defOpt === 'object') {
 			options [key] = fillGapsDeeply (defOpt, opts [key] || {})
 		} else {
 			options [key] = opts [key] || defOpt;
 		}
 	});

 	return options;
}

 module.exports = function (ast, options) {
 	var defaultOptions = getDefaultOptions (),
 		result;

 	//make sure any un-specified options are set to their default values
 	options = fillGapsDeeply (defaultOptions, options);
 };