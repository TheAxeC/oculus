// Layer 2, client state. The References view's end of the language servers: what each References
// tab holds (state/system/machine/lsp/references.ts, kept with the tab's instance), the walk of
// Go to Next and Previous Reference through the latest result, and the call that runs a search
// again.
//
// A search is made by a source tab's editor, which holds the model the server knows, so a history
// row is run again through the asker the editor of that file registered. A row of a file no tab
// holds opens the file, and the search runs when its tab registers.

import type { InstanceStates } from '../../../shared/stores/shapes.ts';
import {
    copyText,
    parseRefsState,
    picks,
    remembered,
    stepped,
    withoutFile,
    withoutLine,
    type RefFile,
    type RefPick,
    type RefSearch,
    type RefsState
} from './references.ts';

/** What an editor answers for a search: the files with their lines, or null when it failed. */
type RefAsker = (search: RefSearch) => Promise<RefFile[] | null>;

/** What the store needs of the page: to open a file, of a root or a library one, at a place. */
type RefOpening = {
    open: (
        file: { root: string; path: string; library?: string },
        line: number,
        column: number
    ) => void;
};

export type ReferencesStore = {
    /** What one References tab holds. */
    refsState: (id: string) => RefsState;
    /** Keep a result for a tab, putting its search first in the history. */
    setResult: (id: string, search: RefSearch, files: RefFile[]) => void;
    /** Empty a tab's result, keeping its history. */
    clear: (id: string) => void;
    /** Empty a tab's history. */
    clearHistory: (id: string) => void;
    /** Take one location out of a tab's result. */
    dismissLine: (id: string, root: string, path: string, line: number, start: number) => void;
    /** Take a file's locations out of a tab's result. */
    dismissFile: (id: string, root: string, path: string) => void;
    /** The text Copy All puts on the clipboard for a tab's result. */
    copyAll: (id: string) => string;
    /** Say which tab holds the result Go to Next Reference walks. */
    latest: (id: string) => void;
    /** Whether the tab last named holds a result. */
    hasResult: () => boolean;
    /** The location after or before the one last visited in the latest result, or null. */
    step: (delta: 1 | -1) => RefPick | null;
    /** Make the editor that holds a file answerable for searches from it. */
    registerAsker: (root: string, path: string, ask: RefAsker) => () => void;
    /** Run a search again for a tab. False when no editor holds its file yet. */
    rerun: (id: string, search: RefSearch, opening: RefOpening) => Promise<boolean>;
};

export function createReferences(ui: InstanceStates): ReferencesStore {
    const askers = new Map<string, RefAsker>();
    /** The search waiting for the editor of its file, and the tab it is for. */
    let waiting: { id: string; search: RefSearch } | null = null;
    /** The tab whose result Go to Next Reference walks, which the editors' actions read. */
    let current: string | null = $state(null);
    let at = -1;

    const keyOf = (root: string, path: string): string => JSON.stringify([root, path]);

    function refsState(id: string): RefsState {
        return parseRefsState(ui.instanceState(id));
    }

    function write(id: string, next: RefsState): void {
        ui.setInstanceState(id, next);
    }

    function setResult(id: string, search: RefSearch, files: RefFile[]): void {
        const held = refsState(id);
        write(id, { search, files, history: remembered(held.history, search) });
        current = id;
        at = -1;
    }

    async function run(id: string, search: RefSearch, ask: RefAsker): Promise<void> {
        const files = await ask(search);
        if (files !== null) setResult(id, search, files);
    }

    return {
        refsState,
        setResult,
        clear: (id) => write(id, { ...refsState(id), search: null, files: [] }),
        clearHistory: (id) => write(id, { ...refsState(id), history: [] }),
        dismissLine: (id, root, path, line, start) => {
            const held = refsState(id);
            write(id, { ...held, files: withoutLine(held.files, root, path, line, start) });
        },
        dismissFile: (id, root, path) => {
            const held = refsState(id);
            write(id, { ...held, files: withoutFile(held.files, root, path) });
        },
        copyAll: (id) => copyText(refsState(id).files),
        latest: (id) => {
            current = id;
            at = -1;
        },
        hasResult: () => current !== null && refsState(current).files.length > 0,
        step: (delta) => {
            if (current === null) return null;
            const list = picks(refsState(current).files);
            at = stepped(list.length, at, delta);
            return at < 0 ? null : list[at];
        },
        registerAsker: (root, path, ask) => {
            const key = keyOf(root, path);
            askers.set(key, ask);
            const due = waiting;
            if (due !== null && keyOf(due.search.root, due.search.path) === key) {
                waiting = null;
                void run(due.id, due.search, ask);
            }
            return () => {
                if (askers.get(key) === ask) askers.delete(key);
            };
        },
        rerun: async (id, search, opening) => {
            const ask = askers.get(keyOf(search.root, search.path));
            if (ask !== undefined) {
                await run(id, search, ask);
                return true;
            }
            waiting = { id, search };
            opening.open(search, search.line, search.column);
            return false;
        }
    };
}
