// Layer 2, server (the desktop host). The line of a failed process's error output that a dialog
// shows as the reason. The last line of a Node or Vite error stream closes the report (a `}`, a
// `Node.js v24.21.0`), so the reason is the last line that names an error, and the last line of the
// stream only when no line does. The build and the server process both pick their reason here.

/**
 * An error's name followed by a colon: a word ending in `Error` (`Error`, `SyntaxError`), then an
 * optional bracketed code (`Error [ERR_MODULE_NOT_FOUND]:`), after any leading spaces.
 */
const ERROR_LINE = /^ *\w*Error(?: \[[^\]]*\])?:/;

/** What a stream's reason is built from: each line is noted as it arrives. */
type ErrorReason = {
    /** Note the next line of the error stream. */
    note: (line: string) => void;
    /** The last line that names an error, else the last line, else an empty string. */
    text: () => string;
};

/** A reason with no line noted yet. */
export function errorReason(): ErrorReason {
    let named = '';
    let last = '';
    return {
        note: (line) => {
            last = line;
            if (ERROR_LINE.test(line)) named = line;
        },
        text: () => (named === '' ? last : named)
    };
}
