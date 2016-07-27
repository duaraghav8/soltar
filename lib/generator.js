/**
 *@fileoverview Implementation of code generating engine
 *@author Raghav Dua
 */

'use strict';

var Syntax = require ('sol-explore').Syntax;

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
		GENERATOR_OBJECT._indent = append (GENERATOR_OBJECT._indent, GENERATOR_OBJECT._indentStyle);

		node.body.forEach (function (item) {
			result.push (
				GENERATOR_OBJECT._indent,
				GENERATOR_OBJECT [item.type] (item),
				GENERATOR_OBJECT._lineBreak
			);
		});

		GENERATOR_OBJECT._indent = removeAppended (GENERATOR_OBJECT._indent, GENERATOR_OBJECT._indentStyle);
		result.push (GENERATOR_OBJECT._indent, '}');

		return result;
	},

	BreakStatement: function (node) {
		var GENERATOR_OBJECT = this, result;

		result = [
			Syntax.break
		];

		if (node.label) {
			result.push (
				GENERATOR_OBJECT._space,
				GENERATOR_OBJECT [node.label.type] (node.label)
			);
		}

		result.push (';');

		return result;
	},

	CatchClause: function (node) {
		var GENERATOR_OBJECT = this, result;

		result = [
			Syntax.catch,
			GENERATOR_OBJECT._space,
			'(',
			GENERATOR_OBJECT [node.param.type] (node.param),
			')',
			GENERATOR_OBJECT._space,
			GENERATOR_OBJECT [node.body.type] (node.body)
		];

		return result;
	},

	ContinueStatement: function (node) {
		return (
			Syntax.continue +
			(node.label ?
				(this._space + this [node.label.type] (node.label)) : ''
			) +
			';'
		);
	},

	ContractStatement: function (node) {
		var GENERATOR_OBJECT = this, result;

		result = [
			Syntax.contract,
			GENERATOR_OBJECT._space,
			node.name,
			GENERATOR_OBJECT._space,
			'{'
		];

		if (node.body.length) {
			result.push (GENERATOR_OBJECT._lineBreak);
			GENERATOR_OBJECT._indent = append (GENERATOR_OBJECT._indent, GENERATOR_OBJECT._indentStyle);

			node.body.forEach (function (item) {
				result.push (
					GENERATOR_OBJECT._indent,
					GENERATOR_OBJECT [item.type] (item),
					GENERATOR_OBJECT._lineBreak
				);
			});

			GENERATOR_OBJECT._indent = removeAppended (GENERATOR_OBJECT._indent, GENERATOR_OBJECT._indentStyle);
		}

		result.push (GENERATOR_OBJECT._indent, '}');

		return result;
	},

	DebuggerStatement: function (node) {
		return 'debugger;';
	},

	DoWhileStatement: function (node) {
		var GENERATOR_OBJECT = this, result;

		result = [
			Syntax.do,
			GENERATOR_OBJECT._space,
			GENERATOR_OBJECT [node.body.type] (node.body),
			GENERATOR_OBJECT._space,
			Syntax.while,
			GENERATOR_OBJECT._space,
			'(',
			GENERATOR_OBJECT [node.test.type] (node.test),
			');'
		];

		return result;
	},

	EmptyStatement: function (node) {
		return '';
	},

	EnumDeclaration: function (node) {
		var GENERATOR_OBJECT = this, result;

		result = [
			Syntax.enum,
			GENERATOR_OBJECT._space,
			node.name,
			GENERATOR_OBJECT._space,
			'{',
			GENERATOR_OBJECT._lineBreak
		];

		GENERATOR_OBJECT._indent = append (GENERATOR_OBJECT._indent, GENERATOR_OBJECT._indentStyle);

		node.members.forEach (function (member) {
			result.push (
				GENERATOR_OBJECT._indent,
				member,
				',',
				GENERATOR_OBJECT._lineBreak
			);
		});

		GENERATOR_OBJECT._indent = removeAppended (GENERATOR_OBJECT._indent, GENERATOR_OBJECT._indentStyle);
		result [result.length - 2] = GENERATOR_OBJECT._lineBreak;
		result [result.length - 1] = GENERATOR_OBJECT._indent;
		result.push ('}');

		return result;
	},

	EventDeclaration: function (node) {
		var GENERATOR_OBJECT = this, result;

		result = [
			Syntax.event,
			GENERATOR_OBJECT._space,
			node.name,
			GENERATOR_OBJECT._space,
			'('
		];

		if (node.params) {
			node.params.forEach (function (param) {
				result.push (
					GENERATOR_OBJECT [param.type] (param),
					',',
					GENERATOR_OBJECT._space
				);
			});
			result.splice (-2, 2);
		}

		result.push (')');

		if (node.modifiers) {
			node.modifiers.forEach (function (modifier) {
				result.push (
					GENERATOR_OBJECT._space,
					GENERATOR_OBJECT [modifier.type] (modifier)
				);
			});
		}

		result.push (';');

		return result;
	},

	ExpressionStatement: function (node) {
		var GENERATOR_OBJECT = this, result = [];

		result = [
			GENERATOR_OBJECT [node.expression.type] (node.expression),
			';'
		];

		return result;
	},

	ForInStatement: function (node) {},

	ForStatement: function (node) {
		var GENERATOR_OBJECT = this, result;

		result = [
			Syntax.for,
			GENERATOR_OBJECT._space,
			'('
		];

		if (node.init) {
			result.push (GENERATOR_OBJECT [node.init.type] (node.init));
		}

		result.push (';');

		if (node.test) {
			result.push (
				GENERATOR_OBJECT._space,
				GENERATOR_OBJECT [node.test.type] (node.test)
			);
		}

		result.push (';');

		if (node.update) {
			result.push (
				GENERATOR_OBJECT._space,
				GENERATOR_OBJECT [node.update.type] (node.update)
			);
		}

		result.push (
			')',
			GENERATOR_OBJECT._space,
			GENERATOR_OBJECT [node.body.type] (node.body)
		);

		return result;
	},

	FunctionDeclaration: function (node) {},
	FunctionName: function (node) {},

	IfStatement: function (node) {
		var GENERATOR_OBJECT = this, result;

		result = [
			Syntax.if,
			GENERATOR_OBJECT._space,
			'(',
			GENERATOR_OBJECT [node.test.type] (node.test),
			')',
			GENERATOR_OBJECT._space,
			GENERATOR_OBJECT [node.consequent.type] (node.consequent)
		];

		if (node.alternate) {
			result.push (
				GENERATOR_OBJECT._space,
				Syntax.else,
				GENERATOR_OBJECT._space,
				GENERATOR_OBJECT [node.alternate.type] (node.alternate)
			);
		}

		return result;
	},

	ImportStatement: function (node) {
		var GENERATOR_OBJECT = this, result;

		result = [
			Syntax.import,
			GENERATOR_OBJECT._space
		];

		if (node.symbols.length) {

			if (node.symbols.length === 1) {
				result.push (
					GENERATOR_OBJECT [node.symbols [0].type] (node.symbols [0])
				);
			} else {
				result.push ('{', GENERATOR_OBJECT._space);

				node.symbols.forEach (function (symbol) {
					result.push (
						GENERATOR_OBJECT [symbol.type] (symbol),
						',',
						GENERATOR_OBJECT._space
					);
				});

				result [result.length - 2] = GENERATOR_OBJECT._space;	//remove last comma & add space
				result [result.length - 1] = '}';
			}

			result.push (
				GENERATOR_OBJECT._space,
				Syntax.from,
				GENERATOR_OBJECT._space,
				GENERATOR_OBJECT._quote,
				node.from,
				GENERATOR_OBJECT._quote,
				';'
			);

		} else if (node.alias) {

			result.push (
				GENERATOR_OBJECT._quote,
				node.from,
				GENERATOR_OBJECT._quote,
				GENERATOR_OBJECT._space,
				Syntax.as,
				GENERATOR_OBJECT._space,
				node.alias,
				';'
			);

		} else {
			result.push (
				GENERATOR_OBJECT._quote,
				node.from,
				GENERATOR_OBJECT._quote,
				';'
			);
		}

		return result;
	},

	InformalParameter: function (node) {
		var GENERATOR_OBJECT = this, result;

		result = [GENERATOR_OBJECT [node.literal.type] (node.literal)];

		if (node.is_indexed) {
			result.push (
				GENERATOR_OBJECT._space,
				Syntax.indexed
			);
		}
		if (node.is_storage) {
			result.push (
				GENERATOR_OBJECT._space,
				Syntax.storage
			);
		}
		if (node.id) {
			result.push (
				GENERATOR_OBJECT._space,
				node.id
			);
		}

		return result;
	},

	IsStatement: function (node) {
		var GENERATOR_OBJECT = this, result;

		result = [

		];

		return result;
	},

	LabeledStatement: function (node) {
		var GENERATOR_OBJECT = this, result;

		result = [
			GENERATOR_OBJECT [node.label.type] (node.label),
			':',
			GENERATOR_OBJECT._space,
			GENERATOR_OBJECT [node.body.type] (node.body)
		];

		return result;
	},

	LibraryStatement: function (node) {},

	ModifierDeclaration: function (node) {},

	ModifierName: function (node) {
		var GENERATOR_OBJECT = this, result = [node.name];

		if (node.params.length) {
			result.push (
				GENERATOR_OBJECT._space,
				'('
			);

			node.params.forEach (function (param) {
				result.push (
					GENERATOR_OBJECT [param.type] (param),
					',',
					GENERATOR_OBJECT._space
				);
			});

			result.splice (-2, 1);
			result [result.length - 1] = ')';
		}

		return result;
	},

	Program: function (node) {
		var GENERATOR_OBJECT = this, result = [];

		if (!node.body.length) {
			return '';
		}

		node.body.forEach (function (item) {
			result.push (
				GENERATOR_OBJECT._indent,
				GENERATOR_OBJECT [item.type] (item),
				GENERATOR_OBJECT._lineBreak,
				GENERATOR_OBJECT._lineBreak
			);
		});

		result = result.slice (0, -2);	//remove last 2 empty lines

		return result;
	},

	ReturnStatement: function (node) {
		var GENERATOR_OBJECT = this, result;

		result = [
			Syntax.return
		];

		if (node.argument) {
			result.push (
				GENERATOR_OBJECT._space,
				GENERATOR_OBJECT [node.argument.type] (node.argument)
			);
		}

		result.push (';');

		return result;
	},

	StructDeclaration: function (node) {
		var GENERATOR_OBJECT = this, result;

		result = [
			Syntax.struct,
			GENERATOR_OBJECT._space,
			node.name,
			GENERATOR_OBJECT._space,
			'{'
		];

		if (node.body.length) {
			result.push (GENERATOR_OBJECT._lineBreak);
			GENERATOR_OBJECT._indent = append (GENERATOR_OBJECT._indent, GENERATOR_OBJECT._indentStyle);

			node.body.forEach (function (item) {
				result.push (
					GENERATOR_OBJECT._indent,
					GENERATOR_OBJECT [item.type] (item),
					';',
					GENERATOR_OBJECT._lineBreak
				);
			});

			GENERATOR_OBJECT._indent = removeAppended (GENERATOR_OBJECT._indent, GENERATOR_OBJECT._indentStyle);
		}

		result.push (GENERATOR_OBJECT._indent, '}');

		return result;
	},

	SwitchCase: function (node) {
		var GENERATOR_OBJECT = this, result;

		if (node.test) {

			result = [
				Syntax.case,
				GENERATOR_OBJECT._space,
				GENERATOR_OBJECT [node.test.type] (node.test)
			];

		} else {
			result = [Syntax.default];
		}

		result.push (':');

		if (node.consequent.length) {
			GENERATOR_OBJECT._indent = append (GENERATOR_OBJECT._indent, GENERATOR_OBJECT._indentStyle);

			node.consequent.forEach (function (item) {
				result.push (
					GENERATOR_OBJECT._lineBreak,
					GENERATOR_OBJECT._indent,
					GENERATOR_OBJECT [item.type] (item)
				);
			});

			GENERATOR_OBJECT._indent = removeAppended (GENERATOR_OBJECT._indent, GENERATOR_OBJECT._indentStyle);
		}

		return result;
	},

	SwitchStatement: function (node) {
		var GENERATOR_OBJECT = this, result;

		result = [
			Syntax.switch,
			GENERATOR_OBJECT._space,
			'(',
			GENERATOR_OBJECT [node.discriminant.type] (node.discriminant),
			')',
			GENERATOR_OBJECT._space,
			'{'
		];

		if (node.cases.length) {
			GENERATOR_OBJECT._indent = append (GENERATOR_OBJECT._indent, GENERATOR_OBJECT._indentStyle);

			node.cases.forEach (function (caseHandler) {
				result.push (
					GENERATOR_OBJECT._lineBreak,
					GENERATOR_OBJECT._indent,
					GENERATOR_OBJECT [caseHandler.type] (caseHandler)
				);
			});

			result.push (GENERATOR_OBJECT._lineBreak);
			GENERATOR_OBJECT._indent = removeAppended (GENERATOR_OBJECT._indent, GENERATOR_OBJECT._indentStyle);
		}

		result.push (GENERATOR_OBJECT._indent, '}');

		return result;
	},

	Symbol: function (node) {
		if (node.name === node.alias) {
			return node.name;
		}

		return (
			node.name + this._space + Syntax.as + this._space + node.alias
		);
	},

	ThrowStatement: function (node) {
		return Syntax.throw + ';';
	},

	TryStatement: function (node) {
		var GENERATOR_OBJECT = this, result;

		result = [
			Syntax.try,
			GENERATOR_OBJECT._space,
			GENERATOR_OBJECT [node.block.type] (node.block)
		];

		if (node.handler) {
			result.push (
				GENERATOR_OBJECT._space,
				GENERATOR_OBJECT [node.handler.type] (node.handler)
			);
		}
		if (node.finalizer) {
			result.push (
				GENERATOR_OBJECT._space,
				Syntax.finally,
				GENERATOR_OBJECT._space,
				GENERATOR_OBJECT [node.finalizer.type] (node.finalizer)
			);
		}

		return result;
	},

	VariableDeclaration: function (node) {
		var GENERATOR_OBJECT = this, result;

		result = [Syntax.var];

		node.declarations.forEach (function (declaration) {
			result.push (
				GENERATOR_OBJECT._space,
				GENERATOR_OBJECT [declaration.type] (declaration),
				','
			);
		});
		result [result.length - 1] = ';';	//replace trailing comman with semicolon

		return result;
	},

	VariableDeclarator: function (node) {
		var GENERATOR_OBJECT = this, result;

		result = [GENERATOR_OBJECT [node.id.type] (node.id)];

		if (node.init) {
			result.push (
				GENERATOR_OBJECT._space,
				'=',
				GENERATOR_OBJECT._space,
				GENERATOR_OBJECT [node.init.type] (node.init)
			);
		}

		return result;
	},

	WhileStatement: function (node) {
		var GENERATOR_OBJECT = this, result;

		result = [
			Syntax.while,
			GENERATOR_OBJECT._space,
			'(',
			GENERATOR_OBJECT [node.test.type] (node.test),
			')',
			GENERATOR_OBJECT._space,
			GENERATOR_OBJECT [node.body.type] (node.body)
		];

		return result;
	},

	WithStatement: function (node) {
		var GENERATOR_OBJECT = this, result;

		result = [
			Syntax.with,
			GENERATOR_OBJECT._space,
			'(',
			GENERATOR_OBJECT [node.object.type] (node.object),
			')',
			GENERATOR_OBJECT._space,
			GENERATOR_OBJECT [node.body.type] (node.body)
		];

		return result;
	}

};

mergeObjects (CodeGenerator.prototype, CodeGenerator.Statement);

CodeGenerator.Expression = {

	ArrayExpression: function (node) {
		var GENERATOR_OBJECT = this, result;
		
		if (!node.elements.length) {
			return '[]';
		}

		result = ['[', GENERATOR_OBJECT._lineBreak];
		GENERATOR_OBJECT._indent = append (GENERATOR_OBJECT._indent, GENERATOR_OBJECT._indentStyle);

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
		GENERATOR_OBJECT._indent = removeAppended (GENERATOR_OBJECT._indent, GENERATOR_OBJECT._indentStyle);
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

		GENERATOR_OBJECT._indent = append (GENERATOR_OBJECT._indent, GENERATOR_OBJECT._indentStyle);
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
		GENERATOR_OBJECT._indent = removeAppended (GENERATOR_OBJECT._indent, GENERATOR_OBJECT._indentStyle);
		result.push (GENERATOR_OBJECT._indent, '}');

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