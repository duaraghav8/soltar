(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 *@fileoverview Implementation of code generating engine
 *@author Raghav Dua
 */

'use strict';

var Syntax = require ('sol-explore').Syntax,
	Soltar = {
		version: require ('./package.json').version
	};

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
		i !== null &&	//because typeof null equals 'object', make sure the object is non-null
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

function isHex (literal) {
	var reg = /^[0-9a-f]+$/i;

	//test for '0x' separately because hex notation should not be a part of the standard RegExp
	if (literal.slice (0, 2) !== '0x') {
		return false;
	}

	return reg.test (literal.slice (2));
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
			GENERATOR_OBJECT._space
		];

		if (node.is.length) {
			result.push (Syntax.is, GENERATOR_OBJECT._space);
			node.is.forEach (function (parent) {
				result.push (
					GENERATOR_OBJECT [parent.type] (parent),
					GENERATOR_OBJECT._space
				);
			});
		}

		result.push ('{');

		if (node.body.length) {
			result.push (GENERATOR_OBJECT._lineBreak);
			GENERATOR_OBJECT._indent = append (GENERATOR_OBJECT._indent, GENERATOR_OBJECT._indentStyle);

			node.body.forEach (function (item) {
				result.push (
					GENERATOR_OBJECT._indent,
					GENERATOR_OBJECT [item.type] (item),
					GENERATOR_OBJECT._lineBreak,
					GENERATOR_OBJECT._lineBreak
				);
			});

			result.pop ();	//remove the last (extra) line break
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

	ForInStatement: function (node) {
		var GENERATOR_OBJECT = this, result;

		result = [
			Syntax.for,
			GENERATOR_OBJECT._space,
			'(',
			GENERATOR_OBJECT [node.left.type] (node.left),
			GENERATOR_OBJECT._space,
			Syntax.in,
			GENERATOR_OBJECT._space,
			GENERATOR_OBJECT [node.right.type] (node.right),
			')',
			GENERATOR_OBJECT._space,
			GENERATOR_OBJECT [node.body.type] (node.body)
		];

		return result;
	},

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

	FunctionDeclaration: function (node) {
		var GENERATOR_OBJECT = this, result;

		result = [
			Syntax.function,
			GENERATOR_OBJECT._space
		];

		if (node.name) {
			result.push (
				node.name,
				GENERATOR_OBJECT._space
			);
		}

		result.push ('(');

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
			result.push (GENERATOR_OBJECT._space);
			node.modifiers.forEach (function (modifier) {
				result.push (
					GENERATOR_OBJECT [modifier.type] (modifier),
					GENERATOR_OBJECT._space
				);
			});
			result.splice (-1, 1);
		}

		if (node.is_abstract) {
			result.push (';');
		} else if (node.body) {
			result.push (
				GENERATOR_OBJECT._space,
				GENERATOR_OBJECT [node.body.type] (node.body)
			);
		} else {
			throw new Error ('Invalid format for FunctionDeclaration');
		}

		return result;
	},

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

	LibraryStatement: function (node) {
		var GENERATOR_OBJECT = this, result;

		result = [
			Syntax.library,
			GENERATOR_OBJECT._space,
			node.name,
			GENERATOR_OBJECT._space
		];

		if (node.is.length) {
			result.push (Syntax.is, GENERATOR_OBJECT._space);
			node.is.forEach (function (parent) {
				result.push (
					GENERATOR_OBJECT [parent.type] (parent),
					GENERATOR_OBJECT._space
				);
			});
		}

		result.push ('{');

		if (node.body) {
			result.push (GENERATOR_OBJECT._lineBreak);
			GENERATOR_OBJECT._indent = append (GENERATOR_OBJECT._indent, GENERATOR_OBJECT._indentStyle);

			node.body.forEach (function (item) {
				result.push (
					GENERATOR_OBJECT._indent,
					GENERATOR_OBJECT [item.type] (item),
					GENERATOR_OBJECT._lineBreak,
					GENERATOR_OBJECT._lineBreak
				);
			});

			result.pop ();	//remove the last (extra) line break
			GENERATOR_OBJECT._indent = removeAppended (GENERATOR_OBJECT._indent, GENERATOR_OBJECT._indentStyle);
			result.push (GENERATOR_OBJECT._indent);
		}

		result.push ('}');

		return result;
	},

	ModifierDeclaration: function (node) {
		var GENERATOR_OBJECT = this, result;

		result = [
			Syntax.modifier,
			GENERATOR_OBJECT._space,
			node.name,
			GENERATOR_OBJECT._space
		];

		if (node.params === null) {
			result.push ('()');
		} else if (node.params.length) {
			result.push ('(');
			
			node.params.forEach (function (param) {
				result.push (
					GENERATOR_OBJECT [param.type] (param),
					',',
					GENERATOR_OBJECT._space
				);
			});

			result [result.length - 2] = ')';
		}

		if (node.modifiers) {
			node.modifiers.forEach (function (modifier) {
				result.push (
					GENERATOR_OBJECT [modifier.type] (modifier),
					GENERATOR_OBJECT._space
				);
			});
		}

		result.push (GENERATOR_OBJECT [node.body.type] (node.body));

		return result;
	},

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

	UnaryExpression: function (node) {
		var GENERATOR_OBJECT = this, result;
		var possibleSpace = (
			(node.operator === Syntax.void ||
			node.operator === Syntax.delete ||
			node.operator === Syntax.typeof) ?
				GENERATOR_OBJECT._space : ''
		);

		result = [
			node.operator,
			possibleSpace,	//provide space if operator is 'delete', 'void' or 'typeof'
			GENERATOR_OBJECT [node.argument.type] (node.argument)
		];

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

	DenominationLiteral: function (node) {
		return (
			node.literal +
			this._space +
			node.denomination
		);
	},

	Identifier:function (node) {
		return node.name;
	},

	Literal: function (node) {
		var GENERATOR_OBJECT = this;

		if (node.value === null) {
			return Syntax.null;
		} else if (node.value && node.value.constructor === RegExp) {
			return node.value.toString ();
		}

		switch (typeof node.value) {
			case 'number':
			case 'boolean':
				return node.value.toString ();
			case 'string':
				if (isHex (node.value)) {
					return node.value;
				}

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

		result = isStrictlyObject (node.literal) ?
			[GENERATOR_OBJECT [node.literal.type] (node.literal)] :
			[node.literal];

		for (var i = 0; i < node.members.length; i++) {
			result.push (
				'.',
				node.members [i]
			);
		}

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

Soltar.generate = function generate (node, options) {
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

if (typeof window !== 'undefined') {	//export to browser
	window.Soltar = Soltar;
}

module.exports = Soltar;

},{"./package.json":7,"sol-explore":2}],2:[function(require,module,exports){
/**
 *@fileoverview Exposes all the exploration-related functions through main object
 *@author Raghav Dua
 */

'use strict';

module.exports = {
	traverse: require ('./lib/traverse'),
	traversalOptions: require ('./lib/traversalOptions'),
	Syntax: require ('./lib/syntax'),
	version: require ('./package.json').version
};
},{"./lib/syntax":3,"./lib/traversalOptions":4,"./lib/traverse":5,"./package.json":6}],3:[function(require,module,exports){
module.exports = {
	'as': 'as',
	'break': 'break',
	'case': 'case',
	'catch': 'catch',
	'class': 'class',
	'const': 'const',
	'constant': 'constant',
	'continue': 'continue',
	'contract': 'contract',
	'debugger': 'debugger',
	'default': 'default',
	'delete': 'delete',
	'do': 'do',
	'else': 'else',
	'enum': 'enum',
	'ether': 'ether',
	'event': 'event',
	'export': 'export',
	'extends': 'extends',
	'false': 'false',
	'finally': 'finally',
	'finney': 'finney',
	'for': 'for',
	'from': 'from',
	'function': 'function',
	'get': 'get',
	'if': 'if',
	'is': 'is',
	'indexed': 'indexed',
	'instanceof': 'instanceof',
	'in': 'in',
	'import': 'import',
	'internal': 'internal',
	'library': 'library',
	'mapping': 'mapping',
	'memory': 'memory',
	'modifier': 'modifier',
	'new': 'new',
	'null': 'null',
	'private': 'private',
	'public': 'public',
	'return': 'return',
	'returns': 'returns',
	'set': 'set',
	'storage': 'storage',
	'struct': 'struct',
	'super': 'super',
	'switch': 'switch',
	'szabo': 'szabo',
	'this': 'this',
	'throw': 'throw',
	'true': 'true',
	'try': 'try',
	'typeof': 'typeof',
	'var': 'var',
	'void': 'void',
	'wei': 'wei',
	'while': 'while',
	'with': 'with'
};
},{}],4:[function(require,module,exports){
/**
 *@fileoverview options that a visitor may include in their enter() or leave() functions to alter normal traversal behavior
 *@author Raghav Dua
 */

'use strict';

module.exports = {
	STOP_TRAVERSAL: 'stop',
	SKIP_NODES_BELOW: 'skip'
};
},{}],5:[function(require,module,exports){
/**
 *@fileoverview Depth First Traversal of the given Abstract Syntax Tree
 *@author Raghav Dua
 */

'use strict';

var traversalOptions = require ('./traversalOptions');

/**
 * Constructor for creating an Element wrapper around node (to bundle other information with it)
 * @param {Object} node The node to wrap
 * @private
 */
var Element = function (node) {
	if (!(this instanceof Element)) {
		return new Element (node);
	}

	this.node = node;
};

/**
 * Determine if a given object property is an explorable AST Node
 * @param {Object} node The node to check
 * @param {String} name Name of the key whose value is this node, to make sure we never explore a node's parent
 * @private
 */
function isASTNode (node, name) {
	return (
		node !== null &&	//node shouldn't be null
		typeof (node) === 'object' &&	//must be data type object
		node.hasOwnProperty ('type') &&	//a 'type' key must exist in the node
		typeof (node.type) === 'string' &&	//node.type's value must be a string
		name !== 'parent'	//the key whose value is this entire node must not be 'parent'
	);
}

/**
 * Constructor for the internal Controller object
 * @private
 */
function Controller () {}

/**
 * Set the Controller-wide flag
 * @param {String} flag The flag to set
 * @private
 */
Controller.prototype.notify = function notify (flag) {
	this.__flag = flag;
};

/**
 * Notify to set the Controller-wide flag for halting traversal
 * @private
 */
Controller.prototype.skipNodesBelow = function skip () {
	this.notify (traversalOptions.SKIP_NODES_BELOW);
};

/**
 * Notify to set the Controller-wide flag for skipping child nodes of the current node
 * @private
 */
Controller.prototype.stopTraversal = function stop () {
	this.notify (traversalOptions.STOP_TRAVERSAL);
};

/**
 * Initialize the state of the internal Controller Object before starting traversal
 * @param {object} root The Abstract Syntax Tree object (treated as the AST's root itself)
 * @param {Object} visitorActions The object containing enter and leave behaviors
 * @private
 */
Controller.prototype.init = function init (root, visitorActions) {
	this.root = root;
	this.visitorActions = visitorActions;

	this.__flag = null;
	this.__current = null;
};

/**
 * Execute user-provided callback, providing it with 'this' as context
 * @param {Function} callback The callback to execute
 * @param {Object} element The Element object containing the node currently being entered/left
 * @returns {(String|undefined)} result Returns commands sent by the callback (for stopping or skipping)
 * @private
 */
Controller.prototype.exec = function exec (callback, element) {
	var prev, result;

	prev = this.__current;
	this.__flag = null;
	this.__current = element;

	if (typeof (callback) === 'function') {
		result = callback.call (this, element.node);
	}

	this.__current = prev;
	return result;
};

/**
 * Implementation of the DFS traversal and executing callbacks upon enter & leave phases
 * @param {object} root The Abstract Syntax Tree object (treated as the AST's root itself) to traverse
 * @param {Object} visitorActions The object containing enter and leave behaviors
 * @private
 */
Controller.prototype.traverse = function traverse (root, visitorActions) {
	if (!isASTNode (root) ||
		this.__flag === traversalOptions.STOP_TRAVERSAL) {

		return;
	}

	//access Controller Object's context inside nested functions (where 'this' may not refer to the main object)
	var CTRL_OBJECT = this;
	var ret = this.exec (visitorActions.enter, new Element (root));

	if (ret === traversalOptions.STOP_TRAVERSAL) {
		
		this.notify (ret);
		return;

	} else if (!(ret === traversalOptions.SKIP_NODES_BELOW ||
		this.__flag === traversalOptions.SKIP_NODES_BELOW)) {

		Object.keys (root).forEach (function (key) {
			var child = root [key];

			if (isASTNode (child)) {
				CTRL_OBJECT.traverse (child, visitorActions);
			} else if (child.constructor === Array) {
				child.forEach (function (childItem) {
					CTRL_OBJECT.traverse (childItem, visitorActions);
				});
			}
		});

	}

	if (this.__flag !== traversalOptions.STOP_TRAVERSAL) {
		this.exec (visitorActions.leave, new Element (root));
	}
};

/**
 * The single function exposed to the user
 * @param {object} ast The Abstract Syntax Tree object to traverse
 * @param {Object} visitorEnterOrActions The object containing enter and leave behaviors
 */
 module.exports = function (ast, visitorEnterOrActions) {
 	var visitorActions = {};

 	if (typeof (visitorEnterOrActions) === 'function') {
 		visitorActions = {
 			enter: visitorEnterOrActions
 		};
 	} else {
 		visitorActions.enter = visitorEnterOrActions.enter || function () {};
 		visitorActions.leave = visitorEnterOrActions.leave || function () {};
 	}

 	return new Controller ().traverse (ast, visitorActions);
 };
},{"./traversalOptions":4}],6:[function(require,module,exports){
module.exports={
  "_args": [
    [
      {
        "name": "sol-explore",
        "raw": "sol-explore",
        "rawSpec": "",
        "scope": null,
        "spec": "latest",
        "type": "tag"
      },
      "/home/raghav/Desktop/github/soltar"
    ]
  ],
  "_from": "sol-explore@latest",
  "_id": "sol-explore@1.5.0",
  "_inCache": true,
  "_installable": true,
  "_location": "/sol-explore",
  "_nodeVersion": "4.2.6",
  "_npmOperationalInternal": {
    "host": "packages-12-west.internal.npmjs.com",
    "tmp": "tmp/sol-explore-1.5.0.tgz_1469639766416_0.4083775805775076"
  },
  "_npmUser": {
    "email": "duaraghav8@gmail.com",
    "name": "the-mad-king"
  },
  "_npmVersion": "3.9.6",
  "_phantomChildren": {},
  "_requested": {
    "name": "sol-explore",
    "raw": "sol-explore",
    "rawSpec": "",
    "scope": null,
    "spec": "latest",
    "type": "tag"
  },
  "_requiredBy": [
    "/"
  ],
  "_resolved": "https://registry.npmjs.org/sol-explore/-/sol-explore-1.5.0.tgz",
  "_shasum": "bce099255ef44a48f14fff8252edd51a915cf319",
  "_shrinkwrap": null,
  "_spec": "sol-explore",
  "_where": "/home/raghav/Desktop/github/soltar",
  "author": {
    "name": "Raghav Dua"
  },
  "bugs": {
    "url": "https://github.com/duaraghav8/sol-explore/issues"
  },
  "dependencies": {},
  "description": "Traversal functions for solidity-parser generated AST",
  "devDependencies": {},
  "directories": {},
  "dist": {
    "shasum": "bce099255ef44a48f14fff8252edd51a915cf319",
    "tarball": "https://registry.npmjs.org/sol-explore/-/sol-explore-1.5.0.tgz"
  },
  "gitHead": "2923d7422bc23763afbdfe0c747337ddb139ae70",
  "homepage": "https://github.com/duaraghav8/sol-explore#readme",
  "keywords": [
    "Abstract-Syntax-Tree",
    "Traversal",
    "Solidity"
  ],
  "license": "MIT",
  "main": "index.js",
  "maintainers": [
    {
      "email": "duaraghav8@gmail.com",
      "name": "the-mad-king"
    }
  ],
  "name": "sol-explore",
  "optionalDependencies": {},
  "readme": "ERROR: No README data found!",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/duaraghav8/sol-explore.git"
  },
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "version": "1.5.0"
}

},{}],7:[function(require,module,exports){
module.exports={
  "name": "soltar",
  "version": "1.2.1",
  "description": "Generate Solidity Code from solidity-parser's AST",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/duaraghav8/soltar.git"
  },
  "keywords": [
    "Solidity",
    "Code-Generation",
    "Abstract-Syntax-Tree"
  ],
  "author": "duaraghav8@gmail.com",
  "license": "MIT",
  "bugs": {
    "url": "https://github.com/duaraghav8/soltar/issues"
  },
  "homepage": "https://github.com/duaraghav8/soltar#readme",
  "dependencies": {
    "sol-explore": "^1.5.0"
  }
}

},{}]},{},[1]);