# First try at an AQL formatter for VS Code


Homemade formatter for AQL file. AQL is a query language for ArangoDB.

## How to use

* Install an extension to allow custom scripts in VS Code. I use [Custom Local Formatters](https://github.com/JKillian/vscode-custom-local-formatters).
* Follow the instructions in the extension to link the script 'formatter.js' to the extension.
* When formatting an AQL file, the script will be executed and the file will be formatted.

## How it works

The script reads the input from stdin, formats it and writes the output to stdout.
