# soltar
Generate Solidity Code from its Abstract Syntax Tree. (The AST must follow the Spider Monkey API for defining AST nodes).

An NPM module, [solidity-parser](https://github.com/ConsenSys/solidity-parser), exists if you want to generate AST of your solidity code.

```bash
npm install solidity-parser
```

#Installation
```bash
npm install --save soltar
```

#Documentation

In order to access Soltar's functionality, ```require()``` it like:
```js
let Soltar = require ('soltar');
```

Soltar provides several objects:

1. **generate** - The main function that takes 2 arguments:
ast (the Solidity Contract's abstract syntax tree (following the Spider monkey API) &
options (optional) to confgure the output

2. **version** - Get version information

#Example
A typical AST would look like:

```json
{
  "type": "Program",
  "body": [
    {
      "type": "ExpressionStatement",
      "expression": {
        "type": "AssignmentExpression",
        "operator": "=",
        "left": {
          "type": "DeclarativeExpression",
          "name": "myVar",
          "literal": {
            "type": "Type",
            "literal": "uint",
            "members": [],
            "array_parts": [
              3
            ]
          },
          "is_constant": false,
          "is_public": false,
          "is_memory": false
        },
        "right": {
          "type": "ArrayExpression",
          "elements": [
            {
              "type": "Literal",
              "value": 1
            },
            {
              "type": "Literal",
              "value": 2
            },
            {
              "type": "Literal",
              "value": 3
            }
          ]
        }
      }
    }
  ]
}
```

The default options configuration is:
```js
let options = {
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
}
```

##Usage

```js
/*
	AST is the solidity-parser generated Abstract Syntax Tree
	soltar is the require()d object
*/

let options = {
	format: {
		indent: {
			style: '\t',
			base: 0
		},
		newline: '\n\n',
		space: ' ',
		quotes: 'double'
	}
};
	
let sourceCode = soltar.generate (AST, options);

console.log (sourceCode);
```

##Output

```
contract Vote {

	address public creator;
	
	function Vote () {
	
		creator = msg.sender;
		
	}
	
}
```

The above solidity code corresponds to [this](https://github.com/duaraghav8/soltar/blob/master/examples/customized-options/AST.json) Abstract Syntax Tree

See **examples** for a [full contract](https://github.com/duaraghav8/soltar/tree/master/examples/full-contract) example.

#Future enhancements:

	1. Browser Support
	2. Commanline utility

#PROBLEMS WITH solidity-parser
There are currently a few bugs in solidity-parser. I've [listed them](https://github.com/duaraghav8/soltar/issues/6) so you can make sure you're not a victim of 1 of those. 
I will soon release a fork of solidity-parser which I will actively maintain, with all known issues fixed.
