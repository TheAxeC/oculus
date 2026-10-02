// Layer 2, client state, pure. What the folder panel's answer comes to: the paths it printed or the
// word it was refused with, the folders an Add Folder to Workspace adds and the ones it skips, and
// where an Open Folder goes.
//
// The panel (POST /api/folders/pick) lists and serves nothing; a path it returns becomes a root
// only through the add, and a folder is shown in a Files tab only when a served root holds it.

import { z } from 'zod';
import { readAs } from '../../../../data/shapes/shapes.ts';
import { t } from '../../../shared/words/text.ts';
import type { FsRoot } from '../view/place.ts';
import { rootHolding } from '../view/tab-roots.ts';

/** The words the route refuses with. */
export type PickRefusal = 'unsupported' | 'busy' | 'failed' | 'token' | 'network';

/**
 * What the panel came to: the folders chosen (none when it was cancelled), or why it did not open.
 */
export type Picked = { ok: true; paths: string[] } | { ok: false; error: PickRefusal };

const pickedShape = z.object({ ok: z.literal(true), paths: z.array(z.string()) });
const refusedShape = z.object({ error: z.enum(['unsupported', 'busy', 'failed', 'token']) });

/**
 * The answer of the panel's route as a verdict. A request that never reached the server is
 * `network`, and a body that is neither the list nor one of the refusal words is `failed`.
 */
export function pickedOf(body: unknown, failed: string): Picked {
    if (failed !== '') return { ok: false, error: 'network' };
    const listed = readAs(pickedShape, body);
    if (listed !== null) return { ok: true, paths: listed.paths.filter((one) => one !== '') };
    return { ok: false, error: readAs(refusedShape, body)?.error ?? 'failed' };
}

/** The path of a folder without a closing slash, the form a root's `dir` is written in. */
function bare(dir: string): string {
    return dir.length > 1 && dir.endsWith('/') ? dir.slice(0, -1) : dir;
}

/**
 * What Add Folder to Workspace does with the folders the panel returned: those to add, in the
 * order given and each once, and those already a root, which are skipped with a line.
 */
export function foldersToAdd(
    paths: string[],
    roots: FsRoot[]
): { add: string[]; skipped: string[] } {
    const held = new Set(roots.map((one) => bare(one.dir)));
    const add: string[] = [];
    const skipped: string[] = [];
    for (const path of paths.map(bare)) {
        if (held.has(path)) skipped.push(path);
        else if (!add.includes(path)) add.push(path);
    }
    return { add, skipped };
}

/** Where Open Folder goes: a folder a served root holds, or one outside every root. */
export type FolderChoice =
    | { kind: 'none' }
    | { kind: 'inside'; root: string; path: string }
    | { kind: 'outside'; dir: string };

/** Open Folder takes the first folder of the panel's answer. */
export function folderChoice(paths: string[], roots: FsRoot[]): FolderChoice {
    const first = paths.at(0);
    if (first === undefined) return { kind: 'none' };
    const dir = bare(first);
    const found = rootHolding(roots, dir);
    return found === null
        ? { kind: 'outside', dir }
        : { kind: 'inside', root: found.root.key, path: found.path };
}

/** The sentence for a panel that did not open, by the word the route refused with. */
export function pickerLine(error: PickRefusal): string {
    if (error === 'unsupported') return t('files.picker_unsupported');
    if (error === 'busy') return t('files.picker_busy');
    if (error === 'token') return t('files.picker_token');
    if (error === 'network') return t('files.picker_network');
    return t('files.picker_failed');
}

/**
 * What Add Folder to Workspace came to: the panel was refused or cancelled, or the folders it
 * returned were added (`added`), those already a root skipped (`skipped`), and the first refusal
 * of the write that added one (`refused`, a code of the endpoint, empty for none).
 */
export type FoldersAdded =
    | { ok: false; picker: PickRefusal }
    | { ok: true; added: number; skipped: string[]; refused: string };

/**
 * The line an Add Folder to Workspace leaves: why the panel did not open, the refusal of the first
 * write that was refused, or the folders skipped for being a root already. `refuse` words a code
 * of the write's endpoint. A run that added every folder it was given says nothing.
 */
export function addedLine(answer: FoldersAdded, refuse: (code: string) => string): string {
    if (!answer.ok) return pickerLine(answer.picker);
    if (answer.refused !== '') return refuse(answer.refused);
    if (answer.skipped.length > 0) return t('files.add_skipped', answer.skipped.join(', '));
    return '';
}
