# soltar
Generate Solidity Code from solidity-parser's AST

#Documentation

\*Coming Soon\*

#Example

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
		newline: '\n',
		space: ' ',
		quotes: 'single'
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

The above code corresponds to [this](https://github.com/duaraghav8/soltar/blob/master/examples/AST.json) Abstract Syntax Tree (see examples/)
