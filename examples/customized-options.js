'use strict';

let AST = require ('./AST.json'),
	soltar = require ('soltar'),
	
	options = {
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
	
let sourceCode = soltar.generate (AST, options);

console.log (sourceCode);