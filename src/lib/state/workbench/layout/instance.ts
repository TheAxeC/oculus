// Layer 2, client state. Instance identities and tree lookups, independent of tree mutations and
// storage. It sits in the layout folder beside the tree its lookups walk, which every layout module
// reads it for, and the client folder above reads it from here.
//
// A field of a tab's saved state that names a record holds the record's hub and its key, two
// fields (state/shared/page/records.ts): a card cursor, a `reveal` or a list of records is written
// here by `recordField` and read back through `recordShape` of data/shapes/shapes.ts.

import { z } from 'zod';
import type { Instance, Layout, Pane, ViewId } from './index.ts';
import { isMap, item } from '../../../data/helpers/guards.ts';
import { nameOf } from '../../../data/helpers/files/paths.ts';
import { EDITOR_VIEW } from '../../../data/helpers/files/apps/views.ts';
import { sourceTabState } from '../../sessions/source/draft.ts';
import { recordField } from '../../shared/page/records.ts';
import {
    anyNumberShape,
    filledTextShape,
    mapShape,
    readAs,
    readOr,
    recordShape,
    wordShape
} from '../../../data/shapes/shapes.ts';

/** The field of a view's saved state that holds its keyboard-selected card. */
const cursorShape = z.object({ cursor: recordShape });

/** The fields of a view's saved state that tell which record the instance shows. */
const identityShape = z.object({
    id: filledTextShape,
    collection: filledTextShape,
    hub: z.string().optional().catch(undefined),
    key: filledTextShape,
    session: filledTextShape,
    agent: filledTextShape,
    root: filledTextShape,
    path: filledTextShape
});

/** The field of a view's saved state that holds the words its tab carries. */
const labelShape = z.object({ label: filledTextShape });

/**
 * The saved state of a tab as a map, and the empty map for any other value. A map is answered as
 * it was given, so a view that writes its state back with a field added keeps the others, an own
 * `__proto__` key among them.
 */
export function instanceMap(state: unknown): Record<string, unknown> {
    return readOr(mapShape, state, {});
}

/** The text a tab's saved state holds under `key`, and the empty text when it holds none. */
export function instanceText(state: unknown, key: string): string {
    return wordShape.parse(readAs(mapShape, state)?.[key]);
}

/**
 * The choice a tab remembers under `key` while it is among `present`, else the first of them, and
 * the empty text when there are none.
 */
export function instanceChoice(state: unknown, key: string, present: string[]): string {
    const held = instanceText(state, key);
    return present.includes(held) ? held : (present[0] ?? '');
}

/** A tab's saved state with `key` set to `value` and every other key kept as it is. */
export function withInstanceKey(
    state: unknown,
    key: string,
    value: unknown
): Record<string, unknown> {
    return { ...readAs(mapShape, state), [key]: value };
}

/** Whether a tab's saved state holds `true` under `key`; any other value is not a set flag. */
export function instanceFlag(state: unknown, key: string): boolean {
    return readAs(mapShape, state)?.[key] === true;
}

/** The view that draws one Markdown document as a tab of its own. */
export const DOC_VIEW = 'doc';

/**
 * The paths of the hub's documents a tree holds as tabs, in the order of its tabs. A tab over a
 * document of oculus's own folder, which carries `engine: true`, is not one of them.
 */
export function docPaths(layout: Layout): string[] {
    return tabsOf(layout)
        .filter((tab) => tab.view === DOC_VIEW && !instanceFlag(tab.state, 'engine'))
        .map((tab) => instanceText(tab.state, 'path'))
        .filter((path) => path !== '');
}

/**
 * The views a tree holds as tabs, each once, in the order of its first tab: every view but the
 * document view, whose tabs `docPaths` names by their documents.
 */
export function viewIds(layout: Layout): string[] {
    return [
        ...new Set(
            tabsOf(layout)
                .map((tab) => tab.view)
                .filter((view) => view !== DOC_VIEW)
        )
    ];
}

/** The words a tab's saved state carries as its `label`, or null when it carries none. */
export function instanceLabel(state: unknown): string | null {
    return readAs(labelShape, state)?.label ?? null;
}

/**
 * The number a tab's saved state holds under `key`, `NaN` and the infinities included, and 0 when
 * it holds none.
 */
export function instanceNumber(state: unknown, key: string): number {
    return readOr(anyNumberShape, readAs(mapShape, state)?.[key], 0);
}

/**
 * A view's state as its file holds it: `reveal`, the record a pick asked the tab to show, and each
 * field of `lists` that lists records (the cards whose description is drawn whole, the pillars a
 * map draws), each record written by `recordField`. The state a view's reader parsed holds them as
 * internal ids, and a view writes the state back through this.
 */
export function storedState(state: object, lists: readonly string[] = []): Record<string, unknown> {
    const out: Record<string, unknown> = { ...state };
    if (typeof out.reveal === 'string' && out.reveal !== '') out.reveal = recordField(out.reveal);
    for (const name of lists) {
        const held = out[name];
        if (!Array.isArray(held)) continue;
        out[name] = held.filter((one) => typeof one === 'string').map(recordField);
    }
    return out;
}

/** The card id held by an instance, or null when keyboard navigation has selected none. */
export function cardCursor(state: unknown): string | null {
    return readAs(cursorShape, state)?.cursor ?? null;
}

/** Preserve a view's own state while setting or removing its held card cursor. */
export function withCardCursor(state: unknown, cursor: string | null): unknown {
    if (cursor !== null) return { ...(isMap(state) ? state : {}), cursor: recordField(cursor) };
    if (!isMap(state) || !Object.hasOwn(state, 'cursor')) return state;
    const held = { ...state };
    delete held.cursor;
    return held;
}

/** Keep a cursor across a card-list render, clearing it only when its id is no longer present. */
export function reconcileCardCursor(state: unknown, cards: readonly string[]): unknown {
    const cursor = cardCursor(state);
    return cursor === null || cards.includes(cursor) ? state : withCardCursor(state, null);
}

/**
 * The state a bookmarked document is opened with. The `id` is what makes two bookmarks two tabs: a
 * state carrying one names which instance is wanted, so a second press on the same bookmark
 * activates the tab it already has and a press on another one opens a second tab beside it.
 *
 * It lives here rather than beside the rail because the rail and the file browser both open a
 * bookmark, and the same document opened from the two would otherwise be two tabs.
 */
export function documentState(mark: { label: string; root: string; path: string }): {
    id: string;
    root: string;
    path: string;
    label: string;
} {
    return {
        id: `${mark.root}/${mark.path}`,
        root: mark.root,
        path: mark.path,
        label: mark.label
    };
}

/** What opening a file asks of the apps. */
export type AppOpens = {
    /**
     * Whether a file of a root, by the root's key and the path under it, lies in an apps folder,
     * which opens as source text and never as a page.
     */
    holds: (root: string, path: string) => boolean;
    /** The custom editor a file opens in without being asked, or null for none. */
    editorFor: (root: string, path: string) => { app: string; viewType: string } | null;
};

/**
 * The view and the state a custom editor's tab is opened with. The `id` names the editor as well as
 * the file, so one file opened in two editors is two tabs and a second press on one activates its
 * tab.
 */
export function editorTab(
    editor: { app: string; viewType: string },
    root: string,
    path: string
): { view: string; state: unknown } {
    return {
        view: EDITOR_VIEW,
        state: {
            id: JSON.stringify([editor.viewType, root, path]),
            app: editor.app,
            viewType: editor.viewType,
            root,
            path,
            label: nameOf(path)
        }
    };
}

/**
 * The view and the state a file opens in once an editor is chosen for it: the text editor, which is
 * the source tab, or a custom editor of an app.
 */
export function tabWithEditor(
    choice: { kind: 'text' } | { kind: 'editor'; app: string; viewType: string },
    root: string,
    path: string
): { view: string; state: unknown } {
    return choice.kind === 'text'
        ? { view: 'source', state: sourceTabState(root, path) }
        : editorTab(choice, root, path);
}

/**
 * The view a file of one kind opens in, and the state that tab is given: a file in an apps folder
 * or a text file in the source tab, a file a `default` custom editor of an app matches in that
 * editor, an HTML file in the document view, anything else in the file view. A file the route says
 * is gone opens in the source tab too, which says it cannot be opened. The tree's rows know the
 * size of a file; a caller that has only the path passes undefined. A file in an apps folder opens
 * as source text whatever its kind, since an app's page is code to read and never a page to run in
 * the document view. It sits here beside `documentState`, which it builds, because the file
 * browser, the palette and the source tab's read-again all choose a view by it.
 */
export function tabForKind(
    kind: string,
    root: string,
    path: string,
    size: number | undefined,
    opens: AppOpens
): { view: string; state: unknown } {
    const label = nameOf(path);
    if (opens.holds(root, path)) return { view: 'source', state: sourceTabState(root, path) };
    const editor = opens.editorFor(root, path);
    if (editor !== null) return editorTab(editor, root, path);
    if (kind === 'html') return { view: 'document', state: documentState({ label, root, path }) };
    if (kind === 'text' || kind === 'missing') {
        return { view: 'source', state: sourceTabState(root, path) };
    }
    return { view: 'file', state: { root, path, label, size } };
}

/**
 * A fresh instance of a view, with the id every operation addresses it by. The state is the view's
 * own and is empty unless the opener has something to say: the editor is opened for one project, so
 * the card that opens it hands over which.
 */
export function newInstance(view: ViewId, state: unknown = {}): Instance {
    return { id: crypto.randomUUID(), view, state };
}

/**
 * The path of the pane an opened view lands in: the pane holding the instance that was last
 * activated, and the first pane when that instance is gone or none has been activated yet.
 */
export function activePath(layout: Layout, id: string | null): number[] {
    if (id !== null && id !== '') {
        const found = findInstance(layout, id);
        if (found !== null) return found.path;
    }
    return panes(layout)[0]?.path ?? [];
}

/**
 * The identity an instance state carries, or null for a state that carries none. A view of its own
 * kind uses `id`; a record uses its hub and its key, and an entry of a collection or a feed its
 * `collection` as well; a session or terminal pin uses `session`, and a subagent's transcript its
 * session and `agent`; a local file uses its root and path. Each makes two records two instances
 * of one registered view, while opening the same record again activates its existing instance.
 */
export function stateId(state: unknown): string | null {
    const held = readAs(identityShape, state);
    if (held === null) return null;
    if (held.id !== undefined) return held.id;
    if (held.key !== undefined && held.hub !== undefined) {
        return JSON.stringify([held.collection ?? '', held.hub, held.key]);
    }
    if (held.session !== undefined) {
        return held.agent === undefined ? held.session : JSON.stringify([held.session, held.agent]);
    }
    if (held.root !== undefined && held.path !== undefined) {
        return JSON.stringify([held.root, held.path]);
    }
    return null;
}

/** Whether a tab has this view and identity. An omitted identity matches every instance. */
export function isInstanceOf(tab: Instance, view: ViewId, id?: string | null): boolean {
    if (tab.view !== view) return false;
    return id === undefined || stateId(tab.state) === id;
}

/**
 * The instance of this view in the tree, or null when the tree holds none. An omitted identity
 * finds any instance, an explicit null finds the unpinned one, and a string finds that record's
 * instance.
 */
export function findView(layout: Layout, view: ViewId, id?: string | null): Instance | null {
    for (const { pane } of panes(layout)) {
        const found = pane.tabs.find((tab) => isInstanceOf(tab, view, id));
        if (found !== undefined) return found;
    }
    return null;
}

/** Every pane with its path, depth first, left to right. */
export function panes(layout: Layout): { path: number[]; pane: Pane }[] {
    const found: { path: number[]; pane: Pane }[] = [];
    const walk = (node: Layout, path: number[]): void => {
        if (node.kind === 'pane') {
            found.push({ path, pane: node });
            return;
        }
        // A page leaf holds no pane of its own: the panes it shows are the named page's, and they
        // are found by walking that page's tree.
        if (node.kind !== 'split') return;
        node.children.forEach((child, index) => walk(child, [...path, index]));
    };
    walk(layout, []);
    return found;
}

/**
 * Every tab of one tree, pane by pane in the order panes walks them. A page leaf contributes none:
 * the tabs it shows belong to the page it names, and are that page's tree's tabs.
 */
export function tabsOf(layout: Layout): Instance[] {
    return panes(layout).flatMap(({ pane }) => pane.tabs);
}

/** The instance with this id, the path of the pane holding it and its index in that pane's tabs. */
export function findInstance(
    layout: Layout,
    id: string
): { instance: Instance; path: number[]; index: number } | null {
    for (const { path, pane } of panes(layout)) {
        const index = pane.tabs.findIndex((tab) => tab.id === id);
        const instance = item(pane.tabs, index);
        if (instance !== undefined) return { instance, path, index };
    }
    return null;
}
