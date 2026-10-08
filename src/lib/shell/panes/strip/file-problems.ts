// Layer 3, shell. How a pane learns the errors and warnings of the file a tab shows. The shell may
// not read the problems store, so the page makes one function from it and provides it to the
// panes under a context key, as it hands the status bar its words; a pane that has none (a test
// drawing one pane alone) shows no count.

import { getContext, setContext } from 'svelte';
import type { Tab } from '$lib/ui/tabs/tab-strip';

/**
 * The mark of one file: its count in words, the hover words and the hue of the worst, or null for
 * a file that holds no error and no warning.
 */
export type FileProblems = (file: { root: string; path: string }) => Tab['problem'] | null;

/** The context key the page provides the function under. */
const FILE_PROBLEMS = Symbol('file problems');

/** Provide the function to every pane below the caller. Called by the page alone. */
export function provideFileProblems(problemsOf: FileProblems): void {
    setContext(FILE_PROBLEMS, problemsOf);
}

/** The function the page provided, or one that answers null for every file. */
export function useFileProblems(): FileProblems {
    return getContext<FileProblems | undefined>(FILE_PROBLEMS) ?? (() => null);
}
