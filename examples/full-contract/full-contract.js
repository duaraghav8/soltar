'use strict';

let AuctionContract = {
  "type": "Program",
  "body": [
    {
      "type": "ContractStatement",
      "name": "Auction",
      "is": [],
      "body": [
        {
          "type": "EventDeclaration",
          "name": "AuctionClosed",
          "params": [
            {
              "type": "InformalParameter",
              "literal": {
                "type": "Type",
                "literal": "uint",
                "members": [],
                "array_parts": []
              },
              "id": "highestBid",
              "is_indexed": false,
              "is_storage": false
            }
          ],
          "modifiers": null
        },
        {
          "type": "ExpressionStatement",
          "expression": {
            "type": "DeclarativeExpression",
            "name": "creator",
            "literal": {
              "type": "Type",
              "literal": "address",
              "members": [],
              "array_parts": []
            },
            "is_constant": false,
            "is_public": true,
            "is_memory": false
          }
        },
        {
          "type": "FunctionDeclaration",
          "name": "Auction",
          "params": null,
          "modifiers": null,
          "body": {
            "type": "BlockStatement",
            "body": [
              {
                "type": "ExpressionStatement",
                "expression": {
                  "type": "AssignmentExpression",
                  "operator": "=",
                  "left": {
                    "type": "Identifier",
                    "name": "creator"
                  },
                  "right": {
                    "type": "MemberExpression",
                    "object": {
                      "type": "Identifier",
                      "name": "msg"
                    },
                    "property": {
                      "type": "Identifier",
                      "name": "sender"
                    },
                    "computed": false
                  }
                }
              }
            ]
          },
          "is_abstract": false
        },
        {
          "type": "FunctionDeclaration",
          "name": "closeAuction",
          "params": [
            {
              "type": "InformalParameter",
              "literal": {
                "type": "Type",
                "literal": "uint",
                "members": [],
                "array_parts": []
              },
              "id": "someRandomBid",
              "is_indexed": false,
              "is_storage": false
            }
          ],
          "modifiers": null,
          "body": {
            "type": "BlockStatement",
            "body": [
              {
                "type": "IfStatement",
                "test": {
                  "type": "BinaryExpression",
                  "operator": "==",
                  "left": {
                    "type": "MemberExpression",
                    "object": {
                      "type": "Identifier",
                      "name": "msg"
                    },
                    "property": {
                      "type": "Identifier",
                      "name": "sender"
                    },
                    "computed": false
                  },
                  "right": {
                    "type": "Identifier",
                    "name": "creator"
                  }
                },
                "consequent": {
                  "type": "BlockStatement",
                  "body": [
                    {
                      "type": "ExpressionStatement",
                      "expression": {
                        "type": "CallExpression",
                        "callee": {
                          "type": "Identifier",
                          "name": "AuctionClosed"
                        },
                        "arguments": [
                          {
                            "type": "Identifier",
                            "name": "someRandomBid"
                          }
                        ]
                      }
                    },
                    {
                      "type": "ReturnStatement",
                      "argument": null
                    }
                  ]
                },
                "alternate": null
              },
              {
                "type": "ThrowStatement"
              }
            ]
          },
          "is_abstract": false
        }
      ]
    },
    {
      "type": "ContractStatement",
      "name": "Voting",
      "is": [],
      "body": [
        {
          "type": "StructDeclaration",
          "name": "Voter",
          "body": [
            {
              "type": "DeclarativeExpression",
              "name": "hasVoted",
              "literal": {
                "type": "Type",
                "literal": "bool",
                "members": [],
                "array_parts": []
              },
              "is_constant": false,
              "is_public": false,
              "is_memory": false
            },
            {
              "type": "DeclarativeExpression",
              "name": "weight",
              "literal": {
                "type": "Type",
                "literal": "uint",
                "members": [],
                "array_parts": []
              },
              "is_constant": false,
              "is_public": false,
              "is_memory": false
            }
          ]
        },
        {
          "type": "StructDeclaration",
          "name": "Proposal",
          "body": [
            {
              "type": "DeclarativeExpression",
              "name": "author",
              "literal": {
                "type": "Type",
                "literal": "string",
                "members": [],
                "array_parts": []
              },
              "is_constant": false,
              "is_public": false,
              "is_memory": false
            },
            {
              "type": "DeclarativeExpression",
              "name": "description",
              "literal": {
                "type": "Type",
                "literal": "string",
                "members": [],
                "array_parts": []
              },
              "is_constant": false,
              "is_public": false,
              "is_memory": false
            },
            {
              "type": "DeclarativeExpression",
              "name": "id",
              "literal": {
                "type": "Type",
                "literal": "uint",
                "members": [],
                "array_parts": []
              },
              "is_constant": false,
              "is_public": false,
              "is_memory": false
            },
            {
              "type": "DeclarativeExpression",
              "name": "votes",
              "literal": {
                "type": "Type",
                "literal": "uint",
                "members": [],
                "array_parts": []
              },
              "is_constant": false,
              "is_public": false,
              "is_memory": false
            }
          ]
        },
        {
          "type": "ExpressionStatement",
          "expression": {
            "type": "DeclarativeExpression",
            "name": "universalProposalId",
            "literal": {
              "type": "Type",
              "literal": "uint",
              "members": [],
              "array_parts": []
            },
            "is_constant": false,
            "is_public": false,
            "is_memory": false
          }
        },
        {
          "type": "ExpressionStatement",
          "expression": {
            "type": "DeclarativeExpression",
            "name": "chairperson",
            "literal": {
              "type": "Type",
              "literal": "address",
              "members": [],
              "array_parts": []
            },
            "is_constant": false,
            "is_public": true,
            "is_memory": false
          }
        },
        {
          "type": "ExpressionStatement",
          "expression": {
            "type": "DeclarativeExpression",
            "name": "voters",
            "literal": {
              "type": "Type",
              "literal": {
                "type": "MappingExpression",
                "from": {
                  "type": "Type",
                  "literal": "address",
                  "members": [],
                  "array_parts": []
                },
                "to": {
                  "type": "Type",
                  "literal": "Voter",
                  "members": [],
                  "array_parts": []
                }
              },
              "members": [],
              "array_parts": []
            },
            "is_constant": false,
            "is_public": true,
            "is_memory": false
          }
        },
        {
          "type": "ExpressionStatement",
          "expression": {
            "type": "DeclarativeExpression",
            "name": "proposals",
            "literal": {
              "type": "Type",
              "literal": "Proposal",
              "members": [],
              "array_parts": [
                null
              ]
            },
            "is_constant": false,
            "is_public": true,
            "is_memory": false
          }
        },
        {
          "type": "EventDeclaration",
          "name": "newVoter",
          "params": [
            {
              "type": "InformalParameter",
              "literal": {
                "type": "Type",
                "literal": "address",
                "members": [],
                "array_parts": []
              },
              "id": "voterAddress",
              "is_indexed": false,
              "is_storage": false
            }
          ],
          "modifiers": null
        },
        {
          "type": "EventDeclaration",
          "name": "fuckoff",
          "params": [
            {
              "type": "InformalParameter",
              "literal": {
                "type": "Type",
                "literal": "uint",
                "members": [],
                "array_parts": []
              },
              "id": "x",
              "is_indexed": false,
              "is_storage": false
            }
          ],
          "modifiers": null
        },
        {
          "type": "FunctionDeclaration",
          "name": "Voting",
          "params": null,
          "modifiers": null,
          "body": {
            "type": "BlockStatement",
            "body": [
              {
                "type": "ExpressionStatement",
                "expression": {
                  "type": "AssignmentExpression",
                  "operator": "=",
                  "left": {
                    "type": "Identifier",
                    "name": "chairperson"
                  },
                  "right": {
                    "type": "MemberExpression",
                    "object": {
                      "type": "Identifier",
                      "name": "msg"
                    },
                    "property": {
                      "type": "Identifier",
                      "name": "sender"
                    },
                    "computed": false
                  }
                }
              },
              {
                "type": "ExpressionStatement",
                "expression": {
                  "type": "AssignmentExpression",
                  "operator": "=",
                  "left": {
                    "type": "Identifier",
                    "name": "universalProposalId"
                  },
                  "right": {
                    "type": "Literal",
                    "value": 0
                  }
                }
              },
              {
                "type": "ExpressionStatement",
                "expression": {
                  "type": "AssignmentExpression",
                  "operator": "=",
                  "left": {
                    "type": "MemberExpression",
                    "object": {
                      "type": "Identifier",
                      "name": "voters"
                    },
                    "property": {
                      "type": "Identifier",
                      "name": "chairperson"
                    },
                    "computed": true
                  },
                  "right": {
                    "type": "CallExpression",
                    "callee": {
                      "type": "Identifier",
                      "name": "Voter"
                    },
                    "arguments": [
                      {
                        "type": "ObjectExpression",
                        "properties": [
                          {
                            "key": {
                              "type": "Identifier",
                              "name": "hasVoted"
                            },
                            "value": {
                              "type": "Literal",
                              "value": false
                            },
                            "kind": "init"
                          },
                          {
                            "key": {
                              "type": "Identifier",
                              "name": "weight"
                            },
                            "value": {
                              "type": "Literal",
                              "value": 1
                            },
                            "kind": "init"
                          }
                        ]
                      }
                    ]
                  }
                }
              },
              {
                "type": "ExpressionStatement",
                "expression": {
                  "type": "CallExpression",
                  "callee": {
                    "type": "Identifier",
                    "name": "newVoter"
                  },
                  "arguments": [
                    {
                      "type": "Identifier",
                      "name": "chairperson"
                    }
                  ]
                }
              }
            ]
          },
          "is_abstract": false
        },
        {
          "type": "FunctionDeclaration",
          "name": "addProposal",
          "params": [
            {
              "type": "InformalParameter",
              "literal": {
                "type": "Type",
                "literal": "string",
                "members": [],
                "array_parts": []
              },
              "id": "author",
              "is_indexed": false,
              "is_storage": false
            },
            {
              "type": "InformalParameter",
              "literal": {
                "type": "Type",
                "literal": "string",
                "members": [],
                "array_parts": []
              },
              "id": "desc",
              "is_indexed": false,
              "is_storage": false
            }
          ],
          "modifiers": null,
          "body": {
            "type": "BlockStatement",
            "body": [
              {
                "type": "ExpressionStatement",
                "expression": {
                  "type": "CallExpression",
                  "callee": {
                    "type": "MemberExpression",
                    "object": {
                      "type": "Identifier",
                      "name": "proposals"
                    },
                    "property": {
                      "type": "Identifier",
                      "name": "push"
                    },
                    "computed": false
                  },
                  "arguments": [
                    {
                      "type": "CallExpression",
                      "callee": {
                        "type": "Identifier",
                        "name": "Proposal"
                      },
                      "arguments": [
                        {
                          "type": "ObjectExpression",
                          "properties": [
                            {
                              "key": {
                                "type": "Identifier",
                                "name": "author"
                              },
                              "value": {
                                "type": "Identifier",
                                "name": "author"
                              },
                              "kind": "init"
                            },
                            {
                              "key": {
                                "type": "Identifier",
                                "name": "description"
                              },
                              "value": {
                                "type": "Identifier",
                                "name": "desc"
                              },
                              "kind": "init"
                            },
                            {
                              "key": {
                                "type": "Identifier",
                                "name": "id"
                              },
                              "value": {
                                "type": "UpdateExpression",
                                "operator": "++",
                                "argument": {
                                  "type": "Identifier",
                                  "name": "universalProposalId"
                                },
                                "prefix": false
                              },
                              "kind": "init"
                            },
                            {
                              "key": {
                                "type": "Identifier",
                                "name": "votes"
                              },
                              "value": {
                                "type": "Literal",
                                "value": 0
                              },
                              "kind": "init"
                            }
                          ]
                        }
                      ]
                    }
                  ]
                }
              }
            ]
          },
          "is_abstract": false
        },
        {
          "type": "FunctionDeclaration",
          "name": "castVote",
          "params": [
            {
              "type": "InformalParameter",
              "literal": {
                "type": "Type",
                "literal": "uint",
                "members": [],
                "array_parts": []
              },
              "id": "id",
              "is_indexed": false,
              "is_storage": false
            }
          ],
          "modifiers": null,
          "body": {
            "type": "BlockStatement",
            "body": [
              {
                "type": "IfStatement",
                "test": {
                  "type": "BinaryExpression",
                  "operator": ">",
                  "left": {
                    "type": "MemberExpression",
                    "object": {
                      "type": "MemberExpression",
                      "object": {
                        "type": "Identifier",
                        "name": "voters"
                      },
                      "property": {
                        "type": "MemberExpression",
                        "object": {
                          "type": "Identifier",
                          "name": "msg"
                        },
                        "property": {
                          "type": "Identifier",
                          "name": "sender"
                        },
                        "computed": false
                      },
                      "computed": true
                    },
                    "property": {
                      "type": "Identifier",
                      "name": "weight"
                    },
                    "computed": false
                  },
                  "right": {
                    "type": "Literal",
                    "value": 0
                  }
                },
                "consequent": {
                  "type": "BlockStatement",
                  "body": [
                    {
                      "type": "ExpressionStatement",
                      "expression": {
                        "type": "AssignmentExpression",
                        "operator": "+=",
                        "left": {
                          "type": "MemberExpression",
                          "object": {
                            "type": "MemberExpression",
                            "object": {
                              "type": "Identifier",
                              "name": "proposals"
                            },
                            "property": {
                              "type": "Identifier",
                              "name": "id"
                            },
                            "computed": true
                          },
                          "property": {
                            "type": "Identifier",
                            "name": "votes"
                          },
                          "computed": false
                        },
                        "right": {
                          "type": "Literal",
                          "value": 20
                        }
                      }
                    },
                    {
                      "type": "ExpressionStatement",
                      "expression": {
                        "type": "UpdateExpression",
                        "operator": "--",
                        "argument": {
                          "type": "MemberExpression",
                          "object": {
                            "type": "MemberExpression",
                            "object": {
                              "type": "Identifier",
                              "name": "voters"
                            },
                            "property": {
                              "type": "MemberExpression",
                              "object": {
                                "type": "Identifier",
                                "name": "msg"
                              },
                              "property": {
                                "type": "Identifier",
                                "name": "sender"
                              },
                              "computed": false
                            },
                            "computed": true
                          },
                          "property": {
                            "type": "Identifier",
                            "name": "weight"
                          },
                          "computed": false
                        },
                        "prefix": false
                      }
                    }
                  ]
                },
                "alternate": null
              }
            ]
          },
          "is_abstract": false
        },
        {
          "type": "FunctionDeclaration",
          "name": "chairBalance",
          "params": null,
          "modifiers": [
            {
              "type": "ModifierName",
              "name": "returns",
              "params": [
                {
                  "type": "InformalParameter",
                  "literal": {
                    "type": "Type",
                    "literal": "uint",
                    "members": [],
                    "array_parts": []
                  },
                  "id": "bal",
                  "is_indexed": false,
                  "is_storage": false
                }
              ]
            }
          ],
          "body": {
            "type": "BlockStatement",
            "body": [
              {
                "type": "ReturnStatement",
                "argument": {
                  "type": "MemberExpression",
                  "object": {
                    "type": "Identifier",
                    "name": "chairperson"
                  },
                  "property": {
                    "type": "Identifier",
                    "name": "balance"
                  },
                  "computed": false
                }
              }
            ]
          },
          "is_abstract": false
        },
        {
          "type": "FunctionDeclaration",
          "name": "c",
          "params": null,
          "modifiers": null,
          "body": {
            "type": "BlockStatement",
            "body": [
              {
                "type": "ExpressionStatement",
                "expression": {
                  "type": "CallExpression",
                  "callee": {
                    "type": "Identifier",
                    "name": "Proposal"
                  },
                  "arguments": [
                    {
                      "type": "ObjectExpression",
                      "properties": [
                        {
                          "key": {
                            "type": "Identifier",
                            "name": "author"
                          },
                          "value": {
                            "type": "Literal",
                            "value": "ragahv"
                          },
                          "kind": "init"
                        },
                        {
                          "key": {
                            "type": "Identifier",
                            "name": "description"
                          },
                          "value": {
                            "type": "Literal",
                            "value": "ddd"
                          },
                          "kind": "init"
                        },
                        {
                          "key": {
                            "type": "Identifier",
                            "name": "id"
                          },
                          "value": {
                            "type": "Literal",
                            "value": 190
                          },
                          "kind": "init"
                        },
                        {
                          "key": {
                            "type": "Identifier",
                            "name": "votes"
                          },
                          "value": {
                            "type": "Literal",
                            "value": 19
                          },
                          "kind": "init"
                        }
                      ]
                    }
                  ]
                }
              }
            ]
          },
          "is_abstract": false
        }
      ]
    }
  ]
}

let soltar = require ('soltar');

console.log (soltar.generate (AuctionContract));