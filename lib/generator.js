/**
 *@fileoverview Implementation of code generating engine
 *@author Raghav Dua
 */

'use strict';

function getDefaultOptions () {
	return {
		format: {
			indent: {
				style: '\t',
				base: 0
			},
			newline: '\n',
			space: ' ',
			quotes: 'single',
			minify: false
		}
	};
}

function getMinifyOptions () {
	return {
		format: {
			indent: {
				style: '',
				base: 0
			},
			newline: '',
			space: ' ',
			quotes: 'single',
			minify: true
		}
	};
}

function isStrictlyObject (i) {
	return (
		i !== null &&
		typeof i === 'object' &&
		i.constructor !== Array
	);
}

function isASTNode (possibleNode) {
	return (
		isStrictlyObject (possibleNode) &&
		possibleNode.type &&
		typeof possibleNode.type === 'string'
	);
}

function isStatement (node) {
	return CodeGenerator.Statement.hasOwnProperty (node.type);
}

function isExpression (node) {
	return CodeGenerator.Expression.hasOwnProperty (node.type);
}

function mergeObjects (target, source) {
	Object.keys (source).forEach (function (key) {
		target [key] = source [key];
	});

	return target;
}

function repeatString (str, times) {
	return Array (times+1).join (str);
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

var CodeGenerator = function CodeGenerator () {
	if (!(this instanceof CodeGenerator)) {
		return new CodeGenerator ();
	}
}

CodeGenerator.prototype.init = function (config) {
	var format = config.format;

	this._indent = repeatString (format.indent.style, format.indent.base);
	this._space = format.space;
	this._lineBreak = format.newline;

	switch (format.quotes) {
		case 'single':
			this._quote = '\'';
			break;
		case 'double':
			this._quote = '\"';
			break;
		default:
			throw new Error ('Invalid value specified for quotes (use \'single\' or \'double\')');
	}

	return this;	//becaue chainability = SWAG
};

CodeGenerator.prototype.generateStatement = function (node) {
	return this [node.type] (node);
};

CodeGenerator.prototype.generateExpression = function (node) {
	return this [node.type] (node);
};

CodeGenerator.prototype.generate = function (node) {
	if (isStatement (node)) {
		return this.generateStatement (node);
	}
	if (isExpression (node)) {
		return this.generateExpression (node);
	}

	throw new Error ('Unknown node type: ' + node.type);
};

CodeGenerator.Statement = {

	BlockStatement: function (node) {},
	BreakStatement: function (node) {},
	CatchClause: function (node) {},
	ContinueStatement: function (node) {},
	ContractStatement: function (node) {},
	DebuggerStatement: function (node) {},
	DeclarativeExpressionList: function (node) {},
	DoWhileStatement: function (node) {},
	EmptyStatement: function (node) {},
	EnumDeclaration: function (node) {},
	EventDeclaration: function (node) {},
	ExpressionStatement: function (node) {},
	ForInStatement: function (node) {},
	ForStatement: function (node) {},
	FunctionDeclaration: function (node) {},
	FunctionName: function (node) {},
	IfStatement: function (node) {},
	ImportStatement: function (node) {},
	InformalParameter: function (node) {},
	IsStatement: function (node) {},
	LabeledStatement: function (node) {},
	LibraryStatement: function (node) {},
	ModifierDeclaration: function (node) {},
	ModifierName: function (node) {},
	Program: function (node) {},
	ReturnStatement: function (node) {},
	StructDeclaration: function (node) {},
	SwitchCase: function (node) {},
	SwitchStatement: function (node) {},
	Symbol: function (node) {},
	ThrowStatement: function (node) {},
	TryStatement: function (node) {},
	VariableDeclaration: function (node) {},
	VariableDeclarator: function (node) {},
	WhileStatement: function (node) {},
	WithStatement: function (node) {}
	
};

mergeObjects (CodeGenerator.prototype, CodeGenerator.Statement);

CodeGenerator.Expression = {

	ArrayExpression: function (node) {
		var GENERATOR_OBJECT = this, result;
		
		if (!node.elements.length) {
			return '[]';
		}

		result = ['['];
		node.elements.forEach (function (element) {
			result.push (
				GENERATOR_OBJECT [element.type] (element),
				','
			);
		});
		result [result.length - 1] = ']';	//remove the last (extra) comma and add closing bracket
		
		return result;
	},

	AssignmentExpression: function (node) {},
	CallExpression: function (node) {},
	ConditionalExpression: function (node) {},
	DeclarativeExpression: function (node) {},

	Literal: function (node) {
		return ([node.value]);
	},

	MappingExpression: function (node) {},
	MemberExpression: function (node) {},
	NewExpression: function (node) {},
	ObjectExpression: function (node) {},
	SequenceExpression: function (node) {},
	ThisExpression: function (node) {},
	Type: function (node) {},
	UpdateExpression: function (node) {}

};

mergeObjects (CodeGenerator.prototype, CodeGenerator.Expression);

module.exports = function (node, options) {
	var defaultOptions = options &&
		options.format &&
		options.format.minify ?
		getMinifyOptions () : getDefaultOptions ();
	var sourceCode;

	if (!isASTNode (node)) {
		throw new Error ('Invalid Argument for node');
	}
	if (options && !isStrictlyObject (options)) {
		throw new Error ('Invalid argument for options');
	}

 	//make sure any un-specified options are set to their default values
 	options = fillGapsDeeply (defaultOptions, options || {});
 	sourceCode = new CodeGenerator ()
		.init (options)
		.generate (node);

 	return sourceCode;
};