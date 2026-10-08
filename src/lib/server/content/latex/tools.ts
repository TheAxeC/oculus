// Layer 2, server. The reading of what the LaTeX endpoint's `texcount` run writes: the words of a
// main file and the files it includes. The program runs through the shared runner
// (core/program.ts), with no shell and its arguments as a list, in the folder of the main file and
// under the time limit every LaTeX program has. A program that is not installed, a program that
// runs out of time and a program that fails are three answers of their own, because the page words
// each differently.
//
// `texcount` reports its own failures on standard output and exits 0, so its output is read for
// them: a line starting `!!!` carries the reason between the marks, and `(errors:N)` with N above
// zero marks a count that did not complete. The words are the first line that is only a number.

/** What the words of a count came to: the number, or the reason texcount gave for not counting. */
export type Counted = { words: number } | { failure: string };

const MARKS = /^!!!\s*|\s*!!!\s*$/g;
const ERRORS = /\(errors:(\d+)\)/;
const NUMBER = /^\s*(\d+)\s*$/;

/** The words of a texcount output, or the reason it did not count; empty when it gave none. */
export function readCount(stdout: string): Counted {
    const lines = stdout.split(/\r?\n/);
    const marked = lines.find((line) => line.startsWith('!!!'));
    if (marked !== undefined) return { failure: marked.replace(MARKS, '').trim() };
    if (lines.some((line) => Number(ERRORS.exec(line)?.[1] ?? 0) > 0)) return { failure: '' };
    const number = lines.map((line) => NUMBER.exec(line)).find((found) => found !== null);
    return number === undefined ? { failure: '' } : { words: Number(number[1]) };
}
