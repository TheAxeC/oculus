// Layer 2, client state. The page's end of the palette file mode's matching: one matcher per names
// answer, which hands the answer to a web worker (file-match.worker.ts) once, posts each query with
// a number, and keeps the rows of the newest query's answer. The worker prepares and matches the
// names, so the page's own thread does neither.
//
// An answer to an older query that arrives after a newer query was posted is dropped, and the rows
// of the last answer stay until the newest query is answered, so the list does not blank or flicker
// between keystrokes. A matcher is ended when the palette's file mode closes or a later answer
// replaces it: the worker stops, and what it answers afterwards is not read. The worker starts
// through a dynamic import, so no server bundle and no page that never opens the file mode
// carries it.

import type { NamesAnswer } from '../../../data/model/index.ts';
import {
    fileSummary,
    type FileMatch,
    type FileSummary,
    type FileWorkerIn,
    type FileWorkerOut
} from './file-match.ts';

/** A started worker as the matcher uses it: post to it, hear it, stop it. */
export type MatcherPort = {
    post: (message: FileWorkerIn) => void;
    /** Call `answer` with each answer and `broke` once if the worker fails. */
    listen: (answer: (out: FileWorkerOut) => void, broke: () => void) => void;
    end: () => void;
};

/** The names of one answer, matched in a worker. */
export type FileMatcher = {
    /** What the answer holds. */
    summary: FileSummary;
    /** The rows of the newest query that has been answered, none before the first answer. */
    rows: () => FileMatch[];
    /** The text of the query the rows answer, or null before the first answer. */
    answered: () => string | null;
    /** Whether the worker did not start or failed. */
    failed: () => boolean;
    /** Post a query; its answer replaces the rows if no newer query was posted by then. */
    ask: (query: string) => void;
    /** Stop the worker; nothing it answers after this is read. */
    end: () => void;
};

/** Start the file-matching worker. */
async function startFileWorker(): Promise<MatcherPort> {
    const { default: Made } = await import('./file-match.worker.ts?worker');
    const worker = new Made();
    return {
        post: (message) => worker.postMessage(message),
        listen: (answer, broke) => {
            worker.onmessage = (event: MessageEvent<FileWorkerOut>) => answer(event.data);
            worker.onerror = broke;
        },
        end: () => worker.terminate()
    };
}

/**
 * A matcher for a names answer. `spawn` starts the worker, which is asynchronous; a query asked
 * before it has started is posted, newest only, when it has.
 */
export function createFileMatcher(
    answer: NamesAnswer,
    spawn: () => Promise<MatcherPort> = startFileWorker
): FileMatcher {
    let rows = $state.raw<FileMatch[]>([]);
    let answered = $state<string | null>(null);
    let failed = $state(false);
    let newest = 0;
    let wanted: string | null = null;
    let port: MatcherPort | null = null;
    let ended = false;

    spawn().then(
        (made) => {
            if (ended) {
                made.end();
                return;
            }
            port = made;
            made.listen(
                (out) => {
                    if (ended || out.id !== newest) return;
                    rows = out.rows;
                    answered = wanted;
                },
                () => {
                    failed = true;
                }
            );
            made.post({ kind: 'names', answer });
            if (wanted !== null) made.post({ kind: 'query', id: newest, query: wanted });
        },
        () => {
            failed = true;
        }
    );

    return {
        summary: fileSummary(answer),
        rows: () => rows,
        answered: () => answered,
        failed: () => failed,
        ask(query) {
            newest += 1;
            wanted = query;
            port?.post({ kind: 'query', id: newest, query });
        },
        end() {
            ended = true;
            port?.end();
            port = null;
        }
    };
}
