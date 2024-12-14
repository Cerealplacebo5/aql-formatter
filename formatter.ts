// const process = require("process");

// Create a function to read from stdin
const readStdin = () => new Promise((resolve) => {
    let data = "";
    process.stdin.on('data', chunk => data += chunk);
    process.stdin.on('end', () => resolve(data));
});

// Main async function to handle the process
const main = async () => {
    // Read from stdin (optional, since we're just outputting "Hello world")
    const input = await readStdin() as string;
    // Split the input into lines
    const input_lines = input.split("\n");
    // Prepare the output
    const output_lines = new Array(input_lines.length);

    // console.log("~~ SYSTEM OUTPUT ~~");
    // console.log(input_lines);
    // console.log("~~ END SYSTEM OUTPUT ~~\n\n");








    let current_indent = 0;

    for (let line_index = 0; line_index < input_lines.length; line_index++) {
        // Get the current line
        const line = input_lines[line_index];




        // Remove leading and trailing whitespace
        const trimmed_line = line.trim();


        // Is the line a comment? If yes, it should be indented at the level of the next line
        // if (trimmed_line.startsWith("//") || trimmed_line.startsWith("/*")){}


    }










    // Output "Hello world"
    process.stdout.write(input + "\n\nHello world\n");
}

// Run the main function
// process.stdout.write("Hello world\n");
main().catch(console.error);