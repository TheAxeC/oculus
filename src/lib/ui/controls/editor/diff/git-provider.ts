// Layer 3, primitive, partial of kit/load.ts and diff/DiffEditor.svelte. The diff a diff editor
// draws when its file carries git's line changes. Monaco's diff editor asks one service of the
// page, `diffProviderFactoryService`, for the diff of its two models, and kit/load.ts hands Monaco
// this module's service in place of its own with the first editor of the page. A diff editor whose
// file carries git's changes holds them here under its modified model's URI (`hold`). While the two
// models hold the texts the changes were read with, the provider answers git's changes, each
// changed run with the character changes Monaco's own computation finds inside it; every other diff
// is Monaco's own, computed by its worker as Monaco computes it unaided, and so is a diff whose
// models were edited away from those texts or whose changes do not fit Monaco's lines.
//
// The character changes are found off the page's thread, by the worker inner-changes.worker.ts,
// whose constructor kit/load.ts hands in (`start`) and this module calls at the first ask that has
// git's runs. The page posts the two sides' lines and git's runs, and builds Monaco's ranges from
// the numbers the worker answers. The answer is Monaco's own diff when the worker cannot start,
// fails or answers what does not fit the runs asked. When the held changes or the models' lines
// moved while the worker computed, the computation answers as cancelled, which Monaco's diff editor
// reads as no result, since the move starts a newer computation of the same editor that draws the
// diff of what they hold now. A worker that fails is ended, and the next ask starts another. The
// editor asks with no time limit (its `maxComputationTime` is 0), so none is set.
//
// Each provider is listed by the modified model it last computed, so `hold` reaches the editors
// that draw that file; a provider is listed from its first computation, and `release`, which the
// diff editor calls as it is destroyed, drops the providers of its model with their listeners.
//
// Git counts a text's lines by its line feeds, a final one ending the last line. Monaco gives a
// text that is empty or ends with a line break one more line, which is empty. Where only one of the
// two texts has that line (one ends with a line break and the other does not, which git shows as a
// change of the last line), git's last change reaches the end of both texts, and the change takes
// that line on the side that has it. A text with a carriage return that no line feed follows has
// more lines in Monaco than in git, so its diff is Monaco's own.

import type * as Monaco from 'monaco-editor';
import { Range } from 'monaco-editor/editor/common/core/range';
import { LineRange } from 'monaco-editor/editor/common/core/ranges/lineRange';
import {
    DetailedLineRangeMapping,
    RangeMapping
} from 'monaco-editor/editor/common/diff/rangeMapping';
import type { DiffLineChange } from '../types';
import type { InnerAnswer, InnerAsk } from './inner-changes.worker';

/** The two texts of a file and git's line changes between them, as the pane read them. */
type HeldDiff = {
    original: string;
    modified: string;
    changes: readonly DiffLineChange[];
};

/** What Monaco's diff editor hands a provider with the two models. */
type DiffOptions = {
    ignoreTrimWhitespace: boolean;
    maxComputationTimeMs: number;
    computeMoves: boolean;
    extendToSubwords?: boolean;
};

/** A diff as a provider answers it to Monaco's diff editor. */
type DocumentDiff = {
    identical: boolean;
    quitEarly: boolean;
    changes: readonly DetailedLineRangeMapping[];
    moves: readonly unknown[];
};

/** A provider of the diff of two models, as Monaco's diff editor reads one. */
type DiffProvider = {
    onDidChange: (listener: () => void) => Monaco.IDisposable;
    computeDiff: (
        original: Monaco.editor.ITextModel,
        modified: Monaco.editor.ITextModel,
        options: DiffOptions,
        token: unknown
    ) => Promise<DocumentDiff>;
    dispose: () => void;
};

/** The diffs the page's diff editors hold, and the service Monaco reads them through. */
export type GitDiffs = {
    /** Hold git's changes for the diff editor whose modified model has this URI, or drop them. */
    hold: (model: string, held: HeldDiff | null) => void;
    /** Drop the changes held for a destroyed diff editor's modified model, and its providers. */
    release: (model: Monaco.editor.ITextModel) => void;
    /** The `diffProviderFactoryService` kit/load.ts hands Monaco. */
    service: { createDiffProvider: (options: object) => DiffProvider };
};

/** The worker inner-changes.worker.ts, the part of it the page uses. */
type InnerWorker = Pick<Worker, 'postMessage' | 'addEventListener' | 'terminate'>;

/** What the page asks the worker, without the number the ask is posted under. */
type Inner = Omit<InnerAsk, 'id'>;

/** One change as two runs of model lines, each from its first line to the line after its last. */
type ModelChange = { original: [number, number]; modified: [number, number] };

/** A side of a change as a run of lines: a side of no line sits after its start. */
function runOf(start: number, end: number): [number, number] {
    return end === 0 ? [start + 1, start + 1] : [start, end + 1];
}

/** Whether a text has a line Monaco adds after a final line break, or the one line of no text. */
function extraLine(text: string): boolean {
    return text === '' || text.endsWith('\n');
}

/** The number of lines git counts in a text without a lone carriage return. */
function gitCount(lines: readonly string[], text: string): number {
    return extraLine(text) ? lines.length - 1 : lines.length;
}

/** Whether two lists of lines are the same lines. */
function sameLines(a: readonly string[], b: readonly string[]): boolean {
    return a.length === b.length && a.every((line, at) => line === b[at]);
}

/**
 * Git's changes as runs of the two models' lines, or null where they do not fit them: a text with
 * a lone carriage return, models whose lines are not the held texts', or changes that are out of
 * order, leave the models' lines, or pair runs of unequal length between them.
 */
function modelChanges(
    held: HeldDiff,
    originalLines: readonly string[],
    modifiedLines: readonly string[]
): ModelChange[] | null {
    if (/\r(?!\n)/.test(held.original) || /\r(?!\n)/.test(held.modified)) return null;
    if (!sameLines(held.original.split(/\r\n|\n/), originalLines)) return null;
    if (!sameLines(held.modified.split(/\r\n|\n/), modifiedLines)) return null;
    const runs: ModelChange[] = held.changes.map((change) => ({
        original: runOf(change.originalStartLineNumber, change.originalEndLineNumber),
        modified: runOf(change.modifiedStartLineNumber, change.modifiedEndLineNumber)
    }));
    const extra = { original: extraLine(held.original), modified: extraLine(held.modified) };
    if (extra.original !== extra.modified) {
        const last = runs.at(-1);
        const ends = {
            original: gitCount(originalLines, held.original) + 1,
            modified: gitCount(modifiedLines, held.modified) + 1
        };
        if (last === undefined) return null;
        if (last.original[1] !== ends.original || last.modified[1] !== ends.modified) return null;
        const side = extra.original ? last.original : last.modified;
        side[1] += 1;
    }
    let before = 1;
    let after = 1;
    for (const run of runs) {
        const [from, to] = run.original;
        const [start, end] = run.modified;
        if (from < before || start < after || to < from || end < start) return null;
        if (from - before !== start - after || (from === to && start === end)) return null;
        before = to;
        after = end;
    }
    const left = originalLines.length + 1 - before;
    return left === modifiedLines.length + 1 - after && left >= 0 ? runs : null;
}

/** Whether an answer's ranges fit the runs asked: whole positive numbers, eight a range. */
function fits(ranges: unknown, runs: number): ranges is number[][] {
    return (
        Array.isArray(ranges) &&
        ranges.length === runs &&
        ranges.every(
            (run) =>
                Array.isArray(run) &&
                run.length % 8 === 0 &&
                run.every((value) => Number.isInteger(value) && (value as number) >= 1)
        )
    );
}

/**
 * The page's end of the worker: each ask answers the ranges of its runs, or null where the worker
 * failed or answered what does not fit them. The worker is started at the first ask, and a worker
 * that fails is ended, its asks answered null, and another started at the next ask.
 */
function innerAsker(start: () => InnerWorker): (ask: Inner) => Promise<number[][] | null> {
    let worker: InnerWorker | null = null;
    let next = 0;
    /** Each ask the worker has not answered, by its number: its count of runs, and its answer. */
    const waiting = new Map<number, { runs: number; answer: (got: number[][] | null) => void }>();

    function failed(made: InnerWorker): void {
        if (worker !== made) return;
        made.terminate();
        worker = null;
        for (const { answer } of waiting.values()) answer(null);
        waiting.clear();
    }

    function started(): InnerWorker {
        const made = start();
        made.addEventListener('message', (event: MessageEvent<unknown>) => {
            if (worker !== made) return;
            const data = event.data;
            const id = typeof data === 'object' && data !== null && 'id' in data ? data.id : null;
            const asked = typeof id === 'number' ? waiting.get(id) : undefined;
            if (asked === undefined) {
                failed(made);
                return;
            }
            waiting.delete(id as number);
            const ranges = (data as Partial<InnerAnswer>).ranges;
            asked.answer(fits(ranges, asked.runs) ? ranges : null);
        });
        made.addEventListener('error', () => failed(made));
        made.addEventListener('messageerror', () => failed(made));
        return made;
    }

    return (ask) =>
        new Promise((answer) => {
            let made: InnerWorker;
            try {
                made = worker ?? started();
            } catch {
                // A worker the page may not start (a policy, a module that does not load) answers
                // null, so the diff is Monaco's own.
                answer(null);
                return;
            }
            worker = made;
            const id = next;
            next += 1;
            waiting.set(id, { runs: ask.runs.length, answer });
            try {
                const posted: InnerAsk = { ...ask, id };
                made.postMessage(posted);
            } catch {
                failed(made);
            }
        });
}

/**
 * The error Monaco's diff editor reads as a computation with no result (`isCancellationError`), so
 * a computation whose texts or changes moved while the worker computed draws nothing, and the newer
 * computation that the move started draws the diff.
 */
function canceled(): Error {
    const error = new Error('Canceled');
    error.name = 'Canceled';
    return error;
}

/** The changed ranges of characters of one run, from the eight numbers the worker gives a range. */
function mappingsOf(numbers: readonly number[]): RangeMapping[] {
    const mappings: RangeMapping[] = [];
    for (let at = 0; at < numbers.length; at += 8) {
        mappings.push(
            new RangeMapping(
                new Range(numbers[at], numbers[at + 1], numbers[at + 2], numbers[at + 3]),
                new Range(numbers[at + 4], numbers[at + 5], numbers[at + 6], numbers[at + 7])
            )
        );
    }
    return mappings;
}

/** Git's changes as Monaco's diff, each with the changed characters the worker found inside it. */
function documentDiff(runs: readonly ModelChange[], ranges: readonly number[][]): DocumentDiff {
    const changes = runs.map(
        ({ original, modified }, at) =>
            new DetailedLineRangeMapping(
                new LineRange(original[0], original[1]),
                new LineRange(modified[0], modified[1]),
                mappingsOf(ranges[at])
            )
    );
    return { identical: changes.length === 0, quitEarly: false, changes, moves: [] };
}

/** What the worker is asked for git's runs of two models' lines, its lines counted from 0. */
function innerAsk(
    lines: { original: string[]; modified: string[] },
    runs: readonly ModelChange[],
    options: DiffOptions
): Inner {
    return {
        original: lines.original,
        modified: lines.modified,
        runs: runs.map(({ original, modified }) => [
            original[0] - 1,
            original[1] - 1,
            modified[0] - 1,
            modified[1] - 1
        ]),
        considerWhitespaceChanges: !options.ignoreTrimWhitespace,
        extendToSubwords: options.extendToSubwords === true
    };
}

/**
 * The page's held diffs, with the service whose providers answer them; `own` makes Monaco's own
 * provider, which answers every other diff, and `start` the worker that finds the changed
 * characters inside git's changes.
 */
export function createGitDiffs(
    own: (options: object) => DiffProvider,
    start: () => InnerWorker
): GitDiffs {
    const held = new Map<string, HeldDiff>();
    const inner = innerAsker(start);
    /** Each provider that has computed, by its signal: the modified model it last computed. */
    const asked = new Map<() => void, { uri: string; model: object; dispose: () => void }>();

    function createDiffProvider(options: object): DiffProvider {
        const monaco = own(options);
        const listeners = new Set<() => void>();
        const fire = (): void => {
            for (const listener of [...listeners]) listener();
        };
        const relayed = monaco.onDidChange(fire);
        const dispose = (): void => {
            asked.delete(fire);
            relayed.dispose();
            listeners.clear();
            monaco.dispose();
        };
        return {
            onDidChange: (listener) => {
                listeners.add(listener);
                return { dispose: () => listeners.delete(listener) };
            },
            computeDiff: async (original, modified, wanted, token) => {
                const uri = modified.uri.toString();
                asked.set(fire, { uri, model: modified, dispose });
                const entry = held.get(uri);
                if (entry === undefined || original.isDisposed() || modified.isDisposed()) {
                    return monaco.computeDiff(original, modified, wanted, token);
                }
                const lines = {
                    original: original.getLinesContent(),
                    modified: modified.getLinesContent()
                };
                const runs = modelChanges(entry, lines.original, lines.modified);
                if (runs === null) return monaco.computeDiff(original, modified, wanted, token);
                const ranges = runs.length === 0 ? [] : await inner(innerAsk(lines, runs, wanted));
                const current =
                    held.get(uri) === entry &&
                    !original.isDisposed() &&
                    !modified.isDisposed() &&
                    sameLines(original.getLinesContent(), lines.original) &&
                    sameLines(modified.getLinesContent(), lines.modified);
                if (!current) throw canceled();
                return ranges !== null
                    ? documentDiff(runs, ranges)
                    : monaco.computeDiff(original, modified, wanted, token);
            },
            dispose
        };
    }

    function hold(model: string, entry: HeldDiff | null): void {
        if (entry === null) held.delete(model);
        else held.set(model, entry);
        for (const [fire, last] of [...asked]) {
            if (last.uri === model) fire();
        }
    }

    return {
        hold,
        release(model) {
            hold(model.uri.toString(), null);
            for (const last of [...asked.values()]) {
                if (last.model === model) last.dispose();
            }
        },
        service: { createDiffProvider }
    };
}
