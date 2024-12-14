/** The content of a line */
type AnalyzedLine = {
    /** The value of the line */
    line: string;
    /** The type of the line */
    type: "LET" | "FOR" | "RETURN" | "FILTER" | "OPTIONS" | "RETURN" | "CONDITION" | "UNKNOWN" | "COMMENT" | "LINE_COMMENT" | "BLOCK_COMMENT_START" | "BLOCK_COMMENT_END";
}

// Create a function to read from stdin
const readStdin = () => new Promise((resolve) => {
    let data = "";
    process.stdin.on('data', chunk => data += chunk);
    process.stdin.on('end', () => resolve(data));
});

/** Function to print some content for debugging */
const debug_print: typeof console.log = (...args) => {
    console.log("\n~~ SYSTEM OUTPUT ~~");
    console.log(...args);
    console.log("~~ END SYSTEM OUTPUT ~~\n");
}

// Main async function to handle the process
const main = async () => {
    // Read from stdin (optional, since we're just outputting "Hello world")
    const input = await readStdin() as string;
    // Split the input into lines
    const input_lines = input.split("\n");
    // Prepare the output
    const analyzed_lines: AnalyzedLine[] = [];
    // The formatted output
    const formatted_output: string[] = [];
    // Loop through the lines and categorize them for easier processing
    for (let line_index = 0; line_index < input_lines.length; line_index++) {
        // Get the current line
        const line = input_lines[line_index];
        // Remove leading and trailing whitespace
        const trimmed_line = line.trim();
        // The current line is part of a block comment
        let is_in_block_comment = false;
        for (let i = analyzed_lines.length - 1; i >= 0; i--) {
            // A block comment was started, the current line is part of a block comment
            if (analyzed_lines[i].type === "BLOCK_COMMENT_START") {
                is_in_block_comment = true;
                break;
            }
            // A block comment was ended, the current line can't be part of a block comment
            else if (analyzed_lines[i].type === "BLOCK_COMMENT_END") break;
        }
        // This line is part of a block comment
        if (is_in_block_comment) analyzed_lines.push({ line: trimmed_line, type: "COMMENT" });
        // Is the line a single line comment?
        else if (trimmed_line.startsWith("//")) analyzed_lines.push({ line: trimmed_line, type: "LINE_COMMENT" });
        // Is the line the start of a block comment?
        else if (trimmed_line.startsWith("/*") && !trimmed_line.includes("*/")) analyzed_lines.push({ line: trimmed_line, type: "BLOCK_COMMENT_START" });
        // Is the line the end of a block comment?
        else if (trimmed_line.endsWith("*/")) analyzed_lines.push({ line: trimmed_line, type: "BLOCK_COMMENT_END" });
        // The line is a declaration of a variable
        else if (trimmed_line.startsWith("LET")) analyzed_lines.push({ line: trimmed_line, type: "LET" });
        // The line is a FOR loop
        else if (trimmed_line.startsWith("FOR")) analyzed_lines.push({ line: trimmed_line, type: "FOR" });
        // The line is a RETURN statement
        else if (trimmed_line.startsWith("RETURN")) analyzed_lines.push({ line: trimmed_line, type: "RETURN" });
        // The line is a FILTER statement
        else if (trimmed_line.startsWith("FILTER")) analyzed_lines.push({ line: trimmed_line, type: "FILTER" });
        // The line is an OPTIONS statement
        else if (trimmed_line.startsWith("OPTIONS")) analyzed_lines.push({ line: trimmed_line, type: "OPTIONS" });
        // The line is a multiline condition
        else if (trimmed_line.startsWith("||") || trimmed_line.startsWith("&&")) analyzed_lines.push({ line: trimmed_line, type: "CONDITION" });
        // The line is unknown
        else analyzed_lines.push({ line: trimmed_line, type: "UNKNOWN" });
    }
    // Keep track of the indent level
    let indent_level = 0;
    // Keep track of the open logic blocks
    const logic_blocks: (AnalyzedLine["type"] | "COMMENT")[] = [];
    // Flag for updating the indent level of the previous line with the current one
    let update_previous_indent_level: number[] = [];

    // Loop through the processed lines and format them
    for (let line_index = 0; line_index < analyzed_lines.length; line_index++) {
        let post_decrease_indent = false;
        let post_increase_indent = false;
        const line = analyzed_lines[line_index];
        const previous_line_type = analyzed_lines[line_index - 1]?.type;

        // Indent the comment to the next line indent level
        if (line.type === "COMMENT" || line.type === "LINE_COMMENT" || line.type === "BLOCK_COMMENT_END" || line.type === "BLOCK_COMMENT_START") {
            formatted_output.push(line.line);
            update_previous_indent_level.push(line_index);
        }
        else {

            // Increase indent for a FOR if under a RETURN or a LET
            if (line.type === "FOR" && (previous_line_type === "RETURN" || previous_line_type === "LET")) indent_level++;
            // Decrease indent after a RETURN
            if (line.type === "RETURN") post_decrease_indent = true;
            // Increase the indent after a FILTER
            if (line.type === "FILTER") post_increase_indent = true;

            // TODO

            // Create the indentation string with the current indent level
            const indentation = "\t".repeat(indent_level);
            // Add the indentation to the line
            formatted_output.push(indentation + line.line);
            // Update the indent level of the previous line with the current one
            if (update_previous_indent_level.length > 0) {
                update_previous_indent_level.forEach(i_line => formatted_output[i_line] = indentation + formatted_output[i_line]);
                update_previous_indent_level = [];
            }
            // Decrease the indent
            if (post_decrease_indent && indent_level > 0) indent_level--;
            // Increase the indent
            if (post_increase_indent) indent_level++;
        }
    }
    // Output "Hello world"
    process.stdout.write(formatted_output.join("\n"));
}

// Run the main function
// process.stdout.write("Hello world\n");
main().catch(console.error);