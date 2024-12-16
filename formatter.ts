/** The content of a line */
type AnalyzedLine = {
    /** The value of the line */
    line: string;
    /** The type of the line */
    type: "LET" | "FOR" | "RETURN" | "FILTER" | "OPTIONS" | "RETURN" | "CONDITION" | "UNKNOWN" | "COMMENT" | "LINE_COMMENT"
    | "BLOCK_COMMENT_START" | "BLOCK_COMMENT_END" | "END_PARENTHESIS" | "END_BRACKET" | "TERNARY_CONDITION";
}

const KEY_WORDS = [
    "LET", "FILTER", "IN", "FOR", "RETURN", "OPTIONS", "LIMIT", "SEARCH", "SORT", "LIMIT",
    "COLLECT", "WINDOW", "REMOVE", "UPDATE", "REPLACE", "INSERT", "UPSERT", "WITH", "ANY", 
    "OUTBOUND", "INBOUND"
];

/** Create a function to read from stdin */
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
    let formatted_output: string[] = [];
    // Loop through the lines and categorize them for easier processing
    for (let line_index = 0; line_index < input_lines.length; line_index++) {
        // Get the current line
        const line = input_lines[line_index];
        // Remove leading and trailing whitespace
        let trimmed_line = line.trim();

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

        // Line is not a comment
        else {

            // Convert double whitespace to a single whitespace
            trimmed_line = trimmed_line.replace(/\s+/g, " ");
            // Capitalize the keywords
            for (let keyword of KEY_WORDS) {
                let regex = new RegExp(`\\b${keyword}\\b`, "ig");
                trimmed_line = trimmed_line.replace(regex, keyword.toUpperCase());
            }

            // Replace commas with a comma followed by a space
            trimmed_line = trimmed_line.replace(/,\s*/g, ", ");

            // The line is a declaration of a variable
            if (trimmed_line.startsWith("LET")) analyzed_lines.push({ line: trimmed_line, type: "LET" });
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
            // The line is an end parenthesis
            else if (trimmed_line.startsWith(")")) analyzed_lines.push({ line: trimmed_line, type: "END_PARENTHESIS" });
            // The line is an end bracket
            else if (trimmed_line.startsWith("}") || trimmed_line.endsWith("},")) analyzed_lines.push({ line: trimmed_line, type: "END_BRACKET" });
            // The line is a ternary condition spread on multiple lines
            else if (trimmed_line.startsWith("?") || trimmed_line.startsWith(":")) analyzed_lines.push({ line: trimmed_line, type: "TERNARY_CONDITION" });
            // The line is unknown
            else analyzed_lines.push({ line: trimmed_line, type: "UNKNOWN" });
        }
    }

    // Keep track of the indent level
    let indent_level = 0;
    // Flag for updating the indent level of the previous line with the current one
    let update_previous_indent_level: number[] = [];

    // Loop through the processed lines and format them
    for (let line_index = 0; line_index < analyzed_lines.length; line_index++) {
        let post_decrease_indent: number;
        let post_increase_indent = false;
        const line = analyzed_lines[line_index];
        const next_line_type = analyzed_lines[line_index + 1]?.type;
        const previous_line_type = analyzed_lines[line_index - 1]?.type;

        // Indent the comment to the next line indent level
        if (line.type === "COMMENT" || line.type === "LINE_COMMENT" || line.type === "BLOCK_COMMENT_END" || line.type === "BLOCK_COMMENT_START") {
            formatted_output.push(line.line);
            update_previous_indent_level.push(line_index);
        }
        else {
            // Increase indent for a FOR if under a RETURN or a LET
            if (line.type === "FOR" && (previous_line_type === "RETURN" || previous_line_type === "LET")) indent_level++;
            // Increase indent for a FOR, and double decrease indent after a RETURN, unless if it's the start of a multiline object definition
            if (line.type === "RETURN") {
                if (line.line.endsWith("{")) post_increase_indent = true;
                else post_decrease_indent = 1;
            }
            // Increase the indent after a FILTER, unless directly before a RETURN or another FILTER
            if (line.type === "FILTER" && next_line_type !== "RETURN" && next_line_type !== "FILTER" && next_line_type !== "CONDITION") post_increase_indent = true;
            // Increase the indent after a TERNARY_CONDITION, unless under another TERNARY_CONDITION
            if (line.type === "TERNARY_CONDITION" && previous_line_type !== "TERNARY_CONDITION") indent_level++;
            // Decrease the indent after a TERNARY_CONDITION, unless followed by another TERNARY_CONDITION
            if (line.type === "TERNARY_CONDITION" && next_line_type !== "TERNARY_CONDITION") post_decrease_indent = 1;

            // Increase the indent after a CONDITION, unless under another CONDITION
            if (line.type === "CONDITION" && previous_line_type !== "CONDITION") indent_level++;
            // Decrease the indent after a CONDITION, unless followed by another CONDITION
            if (line.type === "CONDITION" && next_line_type !== "CONDITION") post_decrease_indent = 1;

            // Retrieve the indent level of a line that ended with a start parenthesis
            else if (line.type === "END_PARENTHESIS") {
                let start_bracket_line_index = -1;
                let has_special_between_parenthesis = false;
                // Get the line that started the parenthesis
                for (let i_line = line_index - 1; i_line >= 0; i_line--) {
                    let analyzed_line = analyzed_lines[i_line];
                    let temp_line = formatted_output[i_line] || "";
                    // The line is a start parenthesis
                    if (temp_line.endsWith("(")) {
                        // Check if the last word is a function call
                        let separated_by_whitespace = temp_line.split(" ");
                        let last_word = separated_by_whitespace[separated_by_whitespace.length - 1];
                        // Last word is a function call, so increase the indent level
                        if (last_word.length > 1) has_special_between_parenthesis = false;
                        // Retrieve the indent level of the line that started the parenthesis
                        indent_level = (temp_line.match(/\t/g) || []).length;
                        start_bracket_line_index = i_line;
                        break;
                    }
                    else if (analyzed_line?.type !== "UNKNOWN") has_special_between_parenthesis = true;
                }
                // If the start bracket line index is found, increase the indent level of the lines between the start and end bracket
                if (start_bracket_line_index !== -1) {
                    // If there is no special character between the parenthesis, increase the indent level
                    if (!has_special_between_parenthesis) indent_level++;
                    for (let i_line = start_bracket_line_index + 1; i_line < line_index; i_line++) {
                        let line_indent_level = ((formatted_output[i_line] || "").match(/\t/g) || []).length;
                        if (line_indent_level < indent_level) formatted_output[i_line] = "\t".repeat(indent_level) + formatted_output[i_line].replace(/\t/g, "");
                    }
                    // If there is no special character between the parenthesis, decrease the indent level
                    if (!has_special_between_parenthesis) indent_level--;
                }
            }
            // Retrieve the indent level of a line that ended with a start bracket
            else if (line.type === "END_BRACKET") {
                let end_bracket_uncompleted = 0;
                let start_bracket_line_index = -1;
                let has_special_between_parenthesis = false;
                // Get the line that started the bracket
                for (let i_line = line_index - 1; i_line >= 0; i_line--) {
                    let analyzed_line = analyzed_lines[i_line];
                    let temp_line = formatted_output[i_line] || "";

                    if (temp_line.endsWith("}") || temp_line.endsWith("},")) end_bracket_uncompleted++;

                    // The line is a start bracket
                    if (temp_line.endsWith("{")) {
                        if (end_bracket_uncompleted > 0) end_bracket_uncompleted--;
                        else {
                            // Retrieve the indent level of the line that started the parenthesis
                            indent_level = (temp_line.match(/\t/g) || []).length;
                            start_bracket_line_index = i_line;
                            break;
                        }
                    }
                    else if (analyzed_line?.type !== "UNKNOWN") has_special_between_parenthesis = true;
                }
                // If the start bracket line index is found, increase the indent level of the lines between the start and end bracket
                if (start_bracket_line_index !== -1) {
                    // If there is no special character between the parenthesis, increase the indent level
                    if (!has_special_between_parenthesis) indent_level++;
                    for (let i_line = start_bracket_line_index + 1; i_line < line_index; i_line++) {
                        let line_indent_level = ((formatted_output[i_line] || "").match(/\t/g) || []).length;
                        if (line_indent_level < indent_level) formatted_output[i_line] = "\t".repeat(indent_level) + formatted_output[i_line].replace(/\t/g, "");
                    }
                    // If there is no special character between the parenthesis, decrease the indent level
                    if (!has_special_between_parenthesis) indent_level--;
                }
            }

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
            if (typeof post_decrease_indent == "number") {
                indent_level -= post_decrease_indent;
                post_decrease_indent = undefined;
                if (indent_level < 0) indent_level = 0;
            }
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