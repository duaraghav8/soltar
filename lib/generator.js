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
};

CodeGenerator.prototype.generateStatement = function (node) {
	return this.Statement [node.type] (node);
};

CodeGenerator.prototype.generateExpression = function (node) {
	return this.Expression [node.type] (node);
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
	VariableDeclaration: function (node) {},
	VariableDeclarator: function (node) {},
	EmptyStatement: function (node) {},
	ExpressionStatement: function (node) {},
	IfStatement: function (node) {},
	ImportStatement: function (node) {},
	Symbol: function (node) {},
	DoWhileStatement: function (node) {},
	WhileStatement: function (node) {},
	ForStatement: function (node) {},
	ForInStatement: function (node) {},
	ContinueStatement: function (node) {},
	BreakStatement: function (node) {},
	ReturnStatement: function (node) {},
	WithStatement: function (node) {},
	SwitchStatement: function (node) {},
	SwitchCase: function (node) {},
	LabeledStatement: function (node) {},
	ThrowStatement: function (node) {},
	TryStatement: function (node) {},
	CatchClause: function (node) {},
	DebuggerStatement: function (node) {},
	ContractStatement: function (node) {},
	LibraryStatement: function (node) {},
	IsStatement: function (node) {},
	EventDeclaration: function (node) {},
	ModifierDeclaration: function (node) {},
	FunctionDeclaration: function (node) {},
	FunctionName: function (node) {},
	ModifierName: function (node) {},
	InformalParameter: function (node) {},
	EnumDeclaration: function (node) {},
	StructDeclaration: function (node) {},
	DeclarativeExpressionList: function (node) {},
	Program: function (node) {}
};

mergeObjects (CodeGenerator.prototype, CodeGenerator.Statement);

CodeGenerator.Expression = {
	ThisExpression: function (node) {},
	ArrayExpression: function (node) {},
	ObjectExpression: function (node) {},
	NewExpression: function (node) {},
	MemberExpression: function (node) {},
	CallExpression: function (node) {},
	Type: function (node) {},
	DeclarativeExpression: function (node) {},
	MappingExpression: function (node) {},
	UpdateExpression: function (node) {},
	ConditionalExpression: function (node) {},
	AssignmentExpression: function (node) {},
	SequenceExpression: function (node) {}
};

mergeObjects (CodeGenerator.prototype, CodeGenerator.Expression);

module.exports = function (node, options) {
	var defaultOptions = options.format.minify ? getMinifyOptions () : getDefaultOptions (),
		sourceCode;

 	//make sure any un-specified options are set to their default values
 	options = fillGapsDeeply (defaultOptions, options);
 	sourceCode = new CodeGenerator ()
		.init (options)
		.generate (node);

 	return sourceCode;
};