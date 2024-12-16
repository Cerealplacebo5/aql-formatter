# First try at an AQL formatter for VS Code


Homemade formatter for AQL file. AQL is a query language for ArangoDB.

## How to use
* Install Typescript annd TS-Node globally
    ```
    npm install -g typescript
    npm install -g ts-node
    ```

* Install an extension to allow custom scripts in VS Code. I use [Custom Local Formatters](https://github.com/JKillian/vscode-custom-local-formatters).

* Update the config file of the extension to point to the formatter.ts file.
    ``` JSON
    "customLocalFormatters.formatters": [
            {
                "command": "ts-node path/to/formatter.ts",
                "languages": [
                    "aql"
                ]
            }
        ],
    ```

* When formatting an AQL file, the script will be executed and the file will be formatted.

## How it works

The script reads the input from stdin, formats it and writes the output to stdout.

## TODO list
* Capitalize the functions and keywords
* Replace double whitespaces with a single whitespace
* Space after a comma