/**
 *@fileoverview Implementation of code generating engine
 *@author Raghav Dua
 */

 'use strict';

function getDefaultOptions () {

}

function getMinifyOptions () {

}

function isStatement (node) {
	return CodeGenerator.Statement.hasOwnProperty (node.type);
}

function isExpression (node) {
	return CodeGenerator.Expression.hasOwnProperty (node.type);
}

function mergeWithProto (class, object) {
	
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

function CodeGenerator () {}

CodeGenerator.prototype.init = function (config) {

};

CodeGenerator.prototype.generate = function (node) {

};

CodeGenerator.Statement = {

};

mergeWithProto (CodeGenerator, CodeGenerator.Statement);

CodeGenerator.Expression = {

};

mergeWithProto (CodeGenerator, CodeGenerator.Expression);

module.exports = function (node, options) {
	var defaultOptions = options.minify ? getMinifyOptions () : getDefaultOptions (),
		sourceCode;

 	//make sure any un-specified options are set to their default values
 	options = fillGapsDeeply (defaultOptions, options);
 	sourceCode = new CodeGenerator ()
		.init (options)
		.generate (node);

 	return sourceCode;
};