/**
 *@fileoverview Implementation of code generating engine
 *@author Raghav Dua
 */

'use strict';

var Syntax = require ('./syntax');

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

function append (mainString, subString) {
	return mainString + subString;
}

function removeAppended (mainString, subString) {
	return mainString.slice (0, -subString.length);
}

function flatten (arrayOrString) {
	if (typeof arrayOrString === 'string') {

		return arrayOrString;

	} else if (typeof arrayOrString === 'object' &&
		arrayOrString.constructor === Array) {

		var result = '';

		for (var i = 0; i < arrayOrString.length; i++) {
			result += flatten (arrayOrString [i]);
		}
		return result;

	}

	throw new Error ('Invalid argument type');
}

function fillGapsDeeply (defaultOpts, opts) {
	var options = {};

	Object.keys (defaultOpts).forEach (function (key) {
 		var defOpt = defaultOpts [key];

 		if (isStrictlyObject (defOpt)) {
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
	this._indentStyle = format.indent.style;
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

	return this;	//because chainability = SWAG
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

	BlockStatement: function (node) {
		var GENERATOR_OBJECT = this, result = [];

		if (!node.body.length) {
			return '{}';
		}

		result = [
			'{',
			GENERATOR_OBJECT._lineBreak
		];
		this._indent = append (this._indent, this._indentStyle);

		node.body.forEach (function (item) {
			result.push (
				GENERATOR_OBJECT._indent,
				GENERATOR_OBJECT [item.type] (item),
				GENERATOR_OBJECT._lineBreak
			);
		});

		this._indent = removeAppended (this._indent, this._indentStyle);
		result.push (GENERATOR_OBJECT._indent, '}');

		return result;
	},

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

	ExpressionStatement: function (node) {
		var GENERATOR_OBJECT = this, result = [];

		result = [
			GENERATOR_OBJECT [node.expression.type] (node.expression),
			';'
		];

		return result;
	},

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

		result = ['[', this._lineBreak];
		this._indent = append (this._indent, this._indentStyle);

		node.elements.forEach (function (element) {
			result.push (
				GENERATOR_OBJECT._indent,
				GENERATOR_OBJECT [element.type] (element),
				',',
				GENERATOR_OBJECT._lineBreak
			);
		});

		//remove the last (extra) comma, restore indentation and add whitespace chars & closing bracket
		result [result.length - 2] = GENERATOR_OBJECT._lineBreak;
		this._indent = removeAppended (this._indent, this._indentStyle);
		result [result.length - 1] = GENERATOR_OBJECT._indent;
		result.push (']');
		
		return result;
	},

	AssignmentExpression: function (node) {
		var GENERATOR_OBJECT = this, result;

		result = [
			GENERATOR_OBJECT [node.left.type] (node.left),
			GENERATOR_OBJECT._space,
			node.operator,
			GENERATOR_OBJECT._space,
			GENERATOR_OBJECT [node.right.type] (node.right)
		];

		return result;
	},

	BinaryExpression: function (node) {
		var GENERATOR_OBJECT = this, result;

		result = [
			GENERATOR_OBJECT [node.left.type] (node.left),
			GENERATOR_OBJECT._space,
			node.operator,
			GENERATOR_OBJECT._space,
			GENERATOR_OBJECT [node.right.type] (node.right)
		];

		return result;
	},

	CallExpression: function (node) {
		var GENERATOR_OBJECT = this, result;

		result = [
			GENERATOR_OBJECT [node.callee.type] (node.callee),
			GENERATOR_OBJECT._space,
			'('
		];

		if (node.arguments.length) {
			node.arguments.forEach (function (arg) {
				result.push (
					GENERATOR_OBJECT [arg.type] (arg),
					',',
					GENERATOR_OBJECT._space
				);
			});
			result = result.slice (0, -2);	//remove trailing comma & space
		}

		result.push (')');

		return result;
	},

	ConditionalExpression: function (node) {
		var GENERATOR_OBJECT = this, result;

		result = [
			GENERATOR_OBJECT [node.test.type] (node.test),
			GENERATOR_OBJECT._space,
			'?',
			GENERATOR_OBJECT._space,
			GENERATOR_OBJECT [node.consequent.type] (node.consequent),
			GENERATOR_OBJECT._space,
			':',
			GENERATOR_OBJECT._space,
			GENERATOR_OBJECT [node.alternate.type] (node.alternate)
		];

		return result;
	},

	DeclarativeExpression: function (node) {
		var GENERATOR_OBJECT = this, result;

		result = [
			GENERATOR_OBJECT [node.literal.type] (node.literal),
			GENERATOR_OBJECT._space,
			node.is_constant ? Syntax.constant + GENERATOR_OBJECT._space : '',
			node.is_public ? Syntax.public + GENERATOR_OBJECT._space : '',
			node.is_memory ? Syntax.memory + GENERATOR_OBJECT._space : '',
			node.name
		];

		return result;
	},

	Identifier:function (node) {
		return node.name;
	},

	Literal: function (node) {
		var GENERATOR_OBJECT = this;

		if (node.value === null) {
			return 'null';
		} else if (node.value && node.value.constructor === RegExp) {
			return node.value.toString ();
		}

		switch (typeof node.value) {
			case 'number':
			case 'boolean':
				return node.value.toString ();
			case 'string':
				return GENERATOR_OBJECT._quote +
					node.value +
					GENERATOR_OBJECT._quote;
			default:
				throw new Error ('Invalid Literal');
		}
	},

	MappingExpression: function (node) {
		var GENERATOR_OBJECT = this, result;

		result = [
			Syntax.mapping,
			GENERATOR_OBJECT._space,
			'(',
			GENERATOR_OBJECT [node.from.type] (node.from),
			GENERATOR_OBJECT._space,
			'=>',
			GENERATOR_OBJECT._space,
			GENERATOR_OBJECT [node.to.type] (node.to),
			')'
		];

		return result;
	},

	MemberExpression: function (node) {
		var GENERATOR_OBJECT = this, result;

		result = [
			GENERATOR_OBJECT [node.object.type] (node.object)
		];

		if (node.computed) {
			result.push (
				GENERATOR_OBJECT._space,
				'[',
				GENERATOR_OBJECT [node.property.type] (node.property),
				']'
			);
		} else {
			var prop = GENERATOR_OBJECT [node.property.type] (node.property);

			result.push (
				'.',
				//Literal wraps strings in quotes.
				//We need to remove them to retrieve object.property instead of object.'property'
				prop.replace (new RegExp (GENERATOR_OBJECT._quote, 'g'), '')
			);
		}

		return result;
	},

	NewExpression: function (node) {
		var GENERATOR_OBJECT = this, result;

		result = [
			Syntax.new,
			GENERATOR_OBJECT._space,
			GENERATOR_OBJECT [node.callee.type] (node.callee),
			GENERATOR_OBJECT._space,
			'('
		];

		if (node.arguments.length) {
			node.arguments.forEach (function (arg) {
				result.push (
					GENERATOR_OBJECT [arg.type] (arg),
					',',
					GENERATOR_OBJECT._space
				);
			});
			result = result.slice (0, -2);
		}
		result.push (')');

		return result;
	},

	ObjectExpression: function (node) {
		var GENERATOR_OBJECT = this, result;

		if (!node.properties.length) {
			return '{}';
		}

		this._indent = append (this._indent, this._indentStyle);
		result = [
			'{',
			GENERATOR_OBJECT._lineBreak
		];

		node.properties.forEach (function (property) {
			result.push (
				GENERATOR_OBJECT._indent,
				GENERATOR_OBJECT [property.key.type] (property.key),
				':',
				GENERATOR_OBJECT._space,
				GENERATOR_OBJECT [property.value.type] (property.value),
				',',
				GENERATOR_OBJECT._lineBreak
			);
		});

		result.splice (result.length - 2, 1);	//remove the (unnecessary) comma after last value
		this._indent = removeAppended (this._indent, this._indentStyle);
		result.push (this._indent, '}');

		return result;
	},

	SequenceExpression: function (node) {
		var GENERATOR_OBJECT = this, result = [];

		node.expressions.forEach (function (expr) {
			result.push (
				GENERATOR_OBJECT [expr.type] (expr),
				',',
				GENERATOR_OBJECT._space
			);
		});

		if (result.length >= 2) {
			result = result.slice (0, -2);
		}

		return result;
	},

	ThisExpression: function (node) {
		return Syntax.this;
	},

	Type: function (node) {
		var GENERATOR_OBJECT = this, result;

		if (isStrictlyObject (node.literal)) {
			return [GENERATOR_OBJECT [node.literal.type] (node.literal)];
		}

		result = [node.literal];

		if (node.array_parts.length) {
			result.push (
				node.array_parts [0] === null ? '[]' : '[' + node.array_parts [0] + ']'
			);
		}

		return result;
	},

	UpdateExpression: function (node) {
		var GENERATOR_OBJECT = this, result;

		result = [
			node.prefix ? node.operator : '',
			GENERATOR_OBJECT [node.argument.type] (node.argument),
			node.prefix ? '' : node.operator
		];

		return result;
	}

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

 	return flatten (sourceCode);
};