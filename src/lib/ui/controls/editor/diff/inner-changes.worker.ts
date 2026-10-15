// Layer 3, primitive. The web worker that finds the changed characters inside git's line changes,
// so a large changed block never holds the page's own thread while its diff opens. The page's end
// is git-provider.ts, which posts the two sides' lines with git's changed runs and starts this
// module, through the `?worker` constructor kit/load.ts imports, at its first ask with git's runs.
// Each run is refined by the diff editor's own computation (`refineDiff`), with no time limit, as
// the diff editor asks of every diff it draws; the answer is plain numbers, from which
// git-provider.ts builds Monaco's ranges, and a run the computation refuses makes the answer null.

import { DefaultLinesDiffComputer } from 'monaco-editor/editor/common/diff/defaultLinesDiffComputer/defaultLinesDiffComputer';
import {
    InfiniteTimeout,
    SequenceDiff
} from 'monaco-editor/editor/common/diff/defaultLinesDiffComputer/algorithms/diffAlgorithm';
import { OffsetRange } from 'monaco-editor/editor/common/core/ranges/offsetRange';

/**
 * What the page asks: the two sides' lines, and git's changed runs, each as the first line of the
 * original side, the line after its last, and the same two of the modified side, counted from 0.
 */
export type InnerAsk = {
    id: number;
    original: string[];
    modified: string[];
    runs: [number, number, number, number][];
    considerWhitespaceChanges: boolean;
    extendToSubwords: boolean;
};

/**
 * What the worker answers: for each run, eight numbers per changed range of characters (the start
 * line, start column, end line and end column of the original side, then of the modified side),
 * or null where the computation refused a run.
 */
export type InnerAnswer = { id: number; ranges: number[][] | null };

/** The changed characters inside each run of an ask, as the answer carries them. */
function innerChanges(ask: InnerAsk): number[][] | null {
    const computer = new DefaultLinesDiffComputer();
    try {
        return ask.runs.map(([from, to, start, end]) =>
            computer
                .refineDiff(
                    ask.original,
                    ask.modified,
                    new SequenceDiff(new OffsetRange(from, to), new OffsetRange(start, end)),
                    InfiniteTimeout.instance,
                    ask.considerWhitespaceChanges,
                    { extendToSubwords: ask.extendToSubwords }
                )
                .mappings.flatMap(({ originalRange: original, modifiedRange: modified }) => [
                    original.startLineNumber,
                    original.startColumn,
                    original.endLineNumber,
                    original.endColumn,
                    modified.startLineNumber,
                    modified.startColumn,
                    modified.endLineNumber,
                    modified.endColumn
                ])
        );
    } catch {
        // The computation refuses a run it cannot place; the page then draws Monaco's own diff.
        return null;
    }
}

self.onmessage = (event: MessageEvent<InnerAsk>) => {
    const answer: InnerAnswer = { id: event.data.id, ranges: innerChanges(event.data) };
    self.postMessage(answer);
};
