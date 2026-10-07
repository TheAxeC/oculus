// Layer 2, client state. The References view's end of the language servers: what each References
// tab holds (state/system/machine/lsp/references.ts, kept with the tab's instance), the walk of
// Go to Next and Previous Reference through the latest result, and the calls that run a search
// again and open one node of a hierarchy.
//
// A search is made by a source tab's editor, which holds the model the server knows, so a history
// row is run again through the asker the editor of that file registered. A row of a file no tab
// holds opens the file, and the search runs when its tab registers. A call or type hierarchy
// search leaves a tree (hierarchy.ts): its first level is read when the search runs, with the
// children of each node it names, and each node below is opened with one more request through the
// asker of the search's file, the file being opened first when no tab holds it, which runs the
// search again from its first level.

import type { InstanceStates } from '../../../shared/stores/shapes.ts';
import {
    DIRECTIONS,
    nodesOf,
    toggled,
    withChildren,
    type HierarchyDirection,
    type HierarchyEntry,
    type RefNode
} from './hierarchy.ts';
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

/** What an editor answers for a search. */
type RefAsker = {
    /** The files with their lines, or null when the server failed. */
    files: (search: RefSearch) => Promise<RefFile[] | null>;
    /**
     * The entries of a hierarchy: the items at the search's caret when `item` is null, and the
     * items one level below `item` in the direction otherwise; null when the server failed.
     */
    entries: (
        search: RefSearch,
        direction: HierarchyDirection,
        item: unknown
    ) => Promise<HierarchyEntry[] | null>;
};

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
    /**
     * Run a search the editor made and, once the server answered, keep its result for the tab
     * `view` gives; a search the server failed leaves the tabs as they were.
     */
    start: (search: RefSearch, ask: RefAsker, view: () => string) => Promise<void>;
    /** Keep a hierarchy for a tab, putting its search first in the history. */
    setHierarchy: (
        id: string,
        search: RefSearch,
        direction: HierarchyDirection,
        nodes: RefNode[]
    ) => void;
    /** Open a node of a tab's hierarchy, asking the server for its children the first time. */
    openNode: (id: string, node: string, opening: RefOpening) => Promise<void>;
    /** Read a tab's hierarchy the other way round, from its first level. */
    reverse: (id: string, opening: RefOpening) => Promise<void>;
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
    let waiting: { id: string; search: RefSearch; direction?: HierarchyDirection } | null = null;
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
        write(id, { search, files, hierarchy: null, history: remembered(held.history, search) });
        current = id;
        at = -1;
    }

    function setHierarchy(
        id: string,
        search: RefSearch,
        direction: HierarchyDirection,
        nodes: RefNode[]
    ): void {
        const held = refsState(id);
        write(id, {
            search,
            files: [],
            hierarchy: { direction, nodes },
            history: remembered(held.history, search)
        });
        current = null;
    }

    /** The first level of a hierarchy, each node of it opened one level. */
    async function firstLevel(
        search: RefSearch,
        direction: HierarchyDirection,
        ask: RefAsker
    ): Promise<RefNode[] | null> {
        const entries = await ask.entries(search, direction, null);
        if (entries === null) return null;
        let nodes = nodesOf(null, entries);
        for (const root of nodes.filter((node) => node.parent === null)) {
            const below = await ask.entries(search, direction, root.item);
            if (below !== null) nodes = withChildren(nodes, root.id, nodesOf(root, below));
        }
        return nodes;
    }

    /** Ask for a search's result; the call that keeps it for a tab, or null when it failed. */
    async function made(
        search: RefSearch,
        ask: RefAsker,
        direction?: HierarchyDirection
    ): Promise<((id: string) => void) | null> {
        if (search.kind === 'calls' || search.kind === 'types') {
            const way = direction ?? DIRECTIONS[search.kind][0];
            const nodes = await firstLevel(search, way, ask);
            return nodes === null ? null : (id) => setHierarchy(id, search, way, nodes);
        }
        const files = await ask.files(search);
        return files === null ? null : (id) => setResult(id, search, files);
    }

    async function run(
        id: string,
        search: RefSearch,
        ask: RefAsker,
        direction?: HierarchyDirection
    ): Promise<void> {
        (await made(search, ask, direction))?.(id);
    }

    return {
        refsState,
        setResult,
        setHierarchy,
        start: async (search, ask, view) => {
            (await made(search, ask))?.(view());
        },
        openNode: async (id, node, opening) => {
            const held = refsState(id);
            const tree = held.hierarchy;
            const found = tree?.nodes.find((one) => one.id === node);
            if (tree === null || found === undefined || held.search === null) return;
            if (found.loaded) {
                write(id, { ...held, hierarchy: { ...tree, nodes: toggled(tree.nodes, node) } });
                return;
            }
            const ask = askers.get(keyOf(held.search.root, held.search.path));
            if (ask === undefined) {
                waiting = { id, search: held.search };
                opening.open(held.search, held.search.line, held.search.column);
                return;
            }
            const entries = await ask.entries(held.search, tree.direction, found.item);
            if (entries === null) return;
            const now = refsState(id);
            if (now.hierarchy === null) return;
            write(id, {
                ...now,
                hierarchy: {
                    ...now.hierarchy,
                    nodes: withChildren(now.hierarchy.nodes, node, nodesOf(found, entries))
                }
            });
        },
        reverse: async (id, opening) => {
            const { search, hierarchy } = refsState(id);
            if (search === null || hierarchy === null) return;
            const kind = search.kind === 'types' ? 'types' : 'calls';
            const [first, second] = DIRECTIONS[kind];
            const ask = askers.get(keyOf(search.root, search.path));
            const way = hierarchy.direction === first ? second : first;
            if (ask === undefined) {
                waiting = { id, search, direction: way };
                opening.open(search, search.line, search.column);
                return;
            }
            await run(id, search, ask, way);
        },
        clear: (id) => write(id, { ...refsState(id), search: null, files: [], hierarchy: null }),
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
                void run(due.id, due.search, ask, due.direction);
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
