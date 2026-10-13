// Layer 2, server. The comments of a code file, found by a worker thread. A comment is a place the
// writing rules mark and code is not, and only a grammar tells the two apart: a `#` inside a
// string, a `//` inside a regular expression and the text of a JSX element are not comments, and
// a block comment or a Python docstring spans lines. The grammar is Shiki's, the one the editor
// colours with, and tokenising a large file takes it hundreds of milliseconds, so it runs in the
// thread of comment-worker.mjs and never in the route's.
//
// `HeldComments` is the client of that thread, one per server (the server context makes it and
// closes it; nothing is held in a module). The first request starts the thread, two requests that
// arrive together start one, and the thread loads each grammar once. A request that takes longer
// than `limitMs` ends the thread and fails, and the next request starts a new one. A request after
// `close` fails, and so does a request whose signal fires. A line longer than the thread reads
// (`LONG_LINE` in comment-worker.mjs) ends the reading there: the comments after it are not found
// and the run answers `ok`.
//
// `languageOf` is the Shiki id of a path's extension. The map is written here because the server
// imports nothing from `ui/`, where the editor keeps the names of its own languages
// (`ui/controls/editor/kit/languages/grammars.ts`); `.tsx` and `.jsx` have grammars of their own so
// that the text of an element carries no comment scope.

import { Worker } from 'node:worker_threads';
import { extname, join } from 'node:path';
import { systemClock, type Clock } from '../../../../core/file-poll.ts';
import { ownFolder } from '../../../lsp/servers.ts';

/** The Shiki grammar of each extension the writing rules read comments of. */
const LANGUAGES: Record<string, string> = {
    '.py': 'python',
    '.pyi': 'python',
    '.ts': 'typescript',
    '.mts': 'typescript',
    '.cts': 'typescript',
    '.tsx': 'tsx',
    '.js': 'javascript',
    '.mjs': 'javascript',
    '.cjs': 'javascript',
    '.jsx': 'jsx',
    '.svelte': 'svelte',
    '.sh': 'shellscript',
    '.bash': 'shellscript',
    '.zsh': 'shellscript',
    '.slurm': 'shellscript',
    '.css': 'css',
    '.scss': 'scss',
    '.c': 'c',
    '.cpp': 'cpp',
    '.cc': 'cpp',
    '.cxx': 'cpp',
    '.hpp': 'cpp',
    '.hh': 'cpp',
    '.hxx': 'cpp',
    '.h': 'cpp',
    '.lua': 'lua',
    '.tex': 'latex',
    '.latex': 'latex'
};

/** The Shiki grammar of a code file, or null when its comments are not read. */
export function languageOf(path: string): string | null {
    return LANGUAGES[extname(path).toLowerCase()] ?? null;
}

/** The milliseconds a request is given before the thread is ended. */
const REQUEST_LIMIT_MS = 5000;

/** A comment or a Python docstring: its offsets in the text, the end not included. */
export type CommentRange = { from: number; to: number; docstring: boolean };

/**
 * Why a request gave no ranges. `detail` is the thread's first line of why the request failed for
 * `grammar`, a grammar that could not be loaded among them.
 */
export type CommentFailure = {
    kind: 'grammar' | 'ended' | 'timeout' | 'closed' | 'stopped';
    detail?: string;
};

/**
 * What a request came to: the ranges, or the failure. A line longer than the thread reads ends the
 * reading there, and the comments after it are not in the ranges.
 */
export type CommentRun =
    { ok: true; ranges: CommentRange[] } | { ok: false; failure: CommentFailure };

/** The answer of the thread to one request, as comment-worker.mjs writes it. */
type Answer = {
    id: number;
    ranges?: number[];
    error?: string;
};

/** What a test may set: another thread file, a clock, a limit. */
export type HeldCommentsOptions = {
    /** The worker file; comment-worker.mjs beside this module unless a test names another. */
    file?: string;
    clock?: Clock;
    limitMs?: number;
};

/** The thread that reads comments and the requests waiting on it. */
export class HeldComments {
    #file: string;
    #clock: Clock;
    #limitMs: number;
    #worker: Worker | null = null;
    #waiting = new Map<number, (run: CommentRun) => void>();
    #next = 1;
    #closed = false;

    constructor(options: HeldCommentsOptions = {}) {
        this.#file =
            options.file ??
            join(ownFolder(), 'src/lib/server/machine/runs/lint/writing/comment-worker.mjs');
        this.#clock = options.clock ?? systemClock;
        this.#limitMs = options.limitMs ?? REQUEST_LIMIT_MS;
    }

    /** The comments of `text`, a file's text up to some line's end, read as `language`. */
    read(text: string, language: string, signal: AbortSignal): Promise<CommentRun> {
        if (this.#closed) return Promise.resolve(fail('closed'));
        if (signal.aborted) return Promise.resolve(fail('stopped'));
        const worker = this.#worker ?? this.#start();
        if (worker === null) return Promise.resolve(fail('ended'));
        const id = this.#next++;
        return new Promise((resolve) => {
            const timer = this.#clock.setTimeout(() => {
                settle(fail('timeout'));
                this.#end(fail('ended'));
            }, this.#limitMs);
            const onAbort = (): void => settle(fail('stopped'));
            const settle = (run: CommentRun): void => {
                if (!this.#waiting.delete(id)) return;
                this.#clock.clearTimeout(timer);
                signal.removeEventListener('abort', onAbort);
                resolve(run);
            };
            this.#waiting.set(id, settle);
            signal.addEventListener('abort', onAbort, { once: true });
            worker.postMessage({ id, language, text });
        });
    }

    /** End the thread; every request waiting on it fails as closed, and later ones too. */
    close(): void {
        this.#closed = true;
        this.#end(fail('closed'));
    }

    #start(): Worker | null {
        let worker: Worker;
        try {
            worker = new Worker(this.#file);
        } catch {
            return null;
        }
        worker.unref();
        this.#worker = worker;
        worker.on('message', (answer: Answer) => this.#answer(answer));
        worker.on('error', (error: Error) => this.#lost(worker, error.message));
        worker.on('exit', () => this.#lost(worker, undefined));
        return worker;
    }

    #answer(answer: Answer): void {
        const settle = this.#waiting.get(answer.id);
        if (settle === undefined) return;
        if (answer.error !== undefined) {
            settle(fail('grammar', answer.error));
            return;
        }
        const flat = answer.ranges ?? [];
        const ranges: CommentRange[] = [];
        for (let at = 0; at + 2 < flat.length; at += 3) {
            ranges.push({ from: flat[at], to: flat[at + 1], docstring: flat[at + 2] === 1 });
        }
        settle({ ok: true, ranges });
    }

    /** The thread ended by itself: the requests waiting on it fail and the next starts another. */
    #lost(worker: Worker, detail: string | undefined): void {
        if (this.#worker !== worker) return;
        this.#worker = null;
        this.#settleAll(fail('ended', detail));
    }

    #end(failure: CommentRun): void {
        const worker = this.#worker;
        this.#worker = null;
        if (worker !== null) void worker.terminate();
        this.#settleAll(failure);
    }

    #settleAll(run: CommentRun): void {
        for (const settle of [...this.#waiting.values()]) settle(run);
    }
}

function fail(kind: CommentFailure['kind'], detail?: string): CommentRun {
    return { ok: false, failure: detail === undefined ? { kind } : { kind, detail } };
}
