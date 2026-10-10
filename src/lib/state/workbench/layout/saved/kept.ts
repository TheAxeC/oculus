// Layer 2, client state. Reading the folder part of a saved envelope: the folder a page belongs to,
// the item it was opened for, and the layouts of the folder pages that were closed. Each part is
// read apart from the rest, so a value that does not add up costs only itself: a folder that reads
// as none makes the page a plain one, and a kept layout that does not read is dropped while the
// other kept layouts and every page are kept. A Files or LaTeX tab of a workbench whose saved label
// is the folder's name loses the label, so the tab reads Files or LaTeX; a label the reader gave it
// stays.

import { z } from 'zod';
import { instanceLabel, instanceMap, tabsOf } from '../instance.ts';
import {
    KEPT_MAX,
    folderName,
    sameFolder,
    type FolderItem,
    type FolderRef,
    type KeptWorkbench,
    type Page,
    type Workbench
} from '../model.ts';
import { restate } from '../tree.ts';
import { isMap } from '../../../../data/helpers/guards.ts';
import { readAs } from '../../../../data/shapes/shapes.ts';

/** A saved folder: a root key that carries something and a path, empty for the root itself. */
const folderShape = z.object({ root: z.string().min(1), path: z.string() });

/** A saved item: the view that opens, with the state it opens with read as it came. */
const itemShape = z.object({ view: z.string().min(1), state: z.unknown().optional() });

/** One saved kept layout: its folder, its tree and its states, each read where it is used. */
const keptShape = z.object({
    folder: z.unknown(),
    workbench: z.unknown(),
    states: z.unknown()
});

/**
 * The folder a saved page belongs to, or null for none. A value that is no folder, and a folder an
 * earlier page already belongs to, read as none: one folder is one page, and the later of two
 * becomes a page of its own.
 */
export function folderOf(value: unknown, earlier: readonly Page[]): FolderRef | null {
    const folder = readAs(folderShape, value);
    if (folder === null) return null;
    const read: FolderRef = { root: folder.root, path: folder.path };
    return earlier.some((page) => page.folder !== undefined && sameFolder(page.folder, read))
        ? null
        : read;
}

/** The item a saved folder page was opened for, or null for none. */
export function itemOf(value: unknown): FolderItem | null {
    const item = readAs(itemShape, value);
    return item === null ? null : { view: item.view, state: item.state };
}

/** Whether a workbench names this view's tab by the view: Files and LaTeX. */
function namedByView(view: string): boolean {
    return view === 'files' || view === 'latex';
}

/**
 * The workbench of a folder with the folder's name taken off its Files and LaTeX tabs: a tab of
 * those views whose saved `label` is the folder's name loses the label, so the tab reads Files or
 * LaTeX as a new workbench's does. A label that is not the folder's name stays.
 */
export function withoutFolderLabels(workbench: Workbench, folder: FolderRef): Workbench {
    const name = folderName(folder);
    let root = workbench.root;
    for (const tab of tabsOf(root)) {
        if (!namedByView(tab.view) || instanceLabel(tab.state) !== name) continue;
        const { label: _label, ...rest } = instanceMap(tab.state);
        root = restate(root, tab.id, rest);
    }
    return { ...workbench, root };
}

/**
 * The kept layouts of a saved envelope, oldest first. A value that is no list holds none. An entry
 * is dropped for a folder that does not read, a folder an earlier entry holds, a tree that does not
 * read, an instance id that is held by a page or a float or by an earlier entry, and `states` that
 * is no map or names an instance the tree does not hold. Only the last `KEPT_MAX` are kept.
 */
export function keptOf(
    value: unknown,
    readWorkbench: (value: unknown) => Workbench | null,
    taken: ReadonlySet<string>
): KeptWorkbench[] {
    if (!Array.isArray(value)) return [];
    const kept: KeptWorkbench[] = [];
    const ids = new Set(taken);
    for (const raw of value) {
        const entry = keptEntry(raw, readWorkbench, ids, kept);
        if (entry === null) continue;
        kept.push(entry);
        for (const tab of tabsOf(entry.workbench.root)) ids.add(tab.id);
    }
    return kept.slice(-KEPT_MAX);
}

/** One saved kept layout, or null for one that does not add up against what is already held. */
function keptEntry(
    raw: unknown,
    readWorkbench: (value: unknown) => Workbench | null,
    ids: ReadonlySet<string>,
    earlier: readonly KeptWorkbench[]
): KeptWorkbench | null {
    const held = readAs(keptShape, raw);
    const folder = readAs(folderShape, held?.folder);
    if (held === null || folder === null) return null;
    if (earlier.some((one) => sameFolder(one.folder, folder))) return null;
    const read = readWorkbench(held.workbench);
    if (read === null) return null;
    const workbench = withoutFolderLabels(read, folder);
    const own = tabsOf(workbench.root).map((tab) => tab.id);
    if (own.some((id) => ids.has(id))) return null;
    if (!isMap(held.states)) return null;
    const keys = Object.keys(held.states);
    if (keys.some((key) => !own.includes(key))) return null;
    const states = Object.fromEntries(
        keys.map((key) => [key, (held.states as Record<string, unknown>)[key]])
    );
    return { folder: { root: folder.root, path: folder.path }, workbench, states };
}
