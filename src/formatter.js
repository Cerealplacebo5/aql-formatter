const process = require("process");

// Create a function to read from stdin
const readStdin = () => new Promise((resolve) => {
    let data = "";
    process.stdin.on('data', chunk => data += chunk);
    process.stdin.on('end', () => resolve(data));
});

// Main async function to handle the process
const main = async () => {
    // Read from stdin (optional, since we're just outputting "Hello world")
    let input = await readStdin();

    let lines = input.split("\n");

    console.log("~~ SYSTEM OUTPUT ~~");
    console.log(lines);
    console.log("~~ END SYSTEM OUTPUT ~~\n\n");

    // Output "Hello world"
    process.stdout.write(input + "\n\nHello world\n");
}

// Run the main function
// process.stdout.write("Hello world\n");
main().catch(console.error);