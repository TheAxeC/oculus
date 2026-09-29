// Layer 4, test helper. Monaco's own line diff, run in the test as the diff editor runs it: the
// advanced algorithm (`DefaultLinesDiffComputer`) over the two texts' lines, with the options the
// diff primitive sets (whitespace changes shown, no time limit), and its mappings turned into the
// line changes `getLineChanges()` answers, by the same rule the editor's `toLineChanges` applies:
// an empty side names the line before where it would be, with an end of 0.

// @ts-expect-error -- monaco-editor ships no types for its internal diff modules.
import { DefaultLinesDiffComputer } from 'monaco-editor/editor/common/diff/defaultLinesDiffComputer/defaultLinesDiffComputer.js';

/** One line change as the diff editor answers it. */
export type MonacoLineChange = {
    originalStartLineNumber: number;
    originalEndLineNumber: number;
    modifiedStartLineNumber: number;
    modifiedEndLineNumber: number;
};

/** A line range of a mapping, from its first line to the line after its last. */
type LineRange = { startLineNumber: number; endLineNumberExclusive: number; isEmpty: boolean };

type Computed = { changes: { original: LineRange; modified: LineRange }[] };

type Computer = {
    computeDiff: (
        original: string[],
        modified: string[],
        options: {
            ignoreTrimWhitespace: boolean;
            maxComputationTimeMs: number;
            computeMoves: boolean;
            extendToSubwords: boolean;
        }
    ) => Computed;
};

/** The lines of a text as a Monaco model holds them: a final newline leaves an empty last line. */
export function modelLines(text: string): string[] {
    return text.split(/\r\n|\r|\n/);
}

/** The line changes Monaco's diff editor answers for two texts. */
export function monacoLineChanges(original: string, modified: string): MonacoLineChange[] {
    const computer = new (DefaultLinesDiffComputer as new () => Computer)();
    const result = computer.computeDiff(modelLines(original), modelLines(modified), {
        ignoreTrimWhitespace: false,
        maxComputationTimeMs: 0,
        computeMoves: false,
        extendToSubwords: false
    });
    return result.changes.map(({ original: from, modified: to }) => ({
        originalStartLineNumber: from.isEmpty ? from.startLineNumber - 1 : from.startLineNumber,
        originalEndLineNumber: from.isEmpty ? 0 : from.endLineNumberExclusive - 1,
        modifiedStartLineNumber: to.isEmpty ? to.startLineNumber - 1 : to.startLineNumber,
        modifiedEndLineNumber: to.isEmpty ? 0 : to.endLineNumberExclusive - 1
    }));
}
