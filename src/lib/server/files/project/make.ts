// Layer 2, server. Make Folder a Hub and Make Folder a Project of the Files view, as POST
// /api/folders/make: what a folder of the workspace offers, and the files each control writes.
//
// The folder is a root's key and a path under it, resolved by real path inside its root, so no
// name walks out of the workspace. `offer` answers which of the two controls the folder offers,
// with the collections a new hub may keep, by the rule of data/helpers/hub-names.ts's `makeOffer`
// over what the folder holds (`folderMarks`) and whether a folder above it is a hub (`hubAbove`):
// a project offers neither control, a folder inside a hub offers no hub, a hub is never a project,
// and the home folder, whose `.oculus` is oculus's own state folder and never a hub, offers
// neither and stops the walk up. The Files view's listings carry the same marks of each folder
// (fs.ts, `listShown`, and `workspacesAnswer` for the folders of the workspace), so its menu
// draws the two items as it opens; `markedBy` names the folder whose marks a written path may
// change, which the git watcher lists again (watch/git.ts). `hub` writes `.oculus/config.yml`
// with the chosen collections and each chosen collection's data file at its default path,
// `project` writes `.oculus/project.yml`, both from the templates of oculus's docs/templates.md
// (data/sources/documents/templates.ts), and only on that press.
//
// A make runs in the write chain of the Files view's operations (fs/ops.ts), asks the offer again
// there before it writes, refuses when any file it would write is there already, and writes each
// file with an exclusive create, so a file that appears meanwhile is refused rather than replaced.
// It is recorded in the change log as New File and New Folder are, one `files` record whose field
// is `create` and whose `after` stamps each path the make brought into being (a file, or the
// highest folder it made), so History takes it back by moving those paths to the Trash. A make
// that stopped part way records what it made. The refusals, in order: the token, a body that is no
// make, `outside` and `missing` for the folder, `not-offered`, `unknown-collection`,
// `no-template`, `exists` with the path, and `failed` for what the system answers.

import { json } from '@sveltejs/kit';
import { existsSync, lstatSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { z } from 'zod';
import { FILES_KIND, type FileStamp } from '../../../data/file-ops.ts';
import {
    HUB_FILE,
    MANIFEST,
    ROOT_FOLDER,
    makeOffer,
    type FolderMarks
} from '../../../data/helpers/hub-names.ts';
import {
    TEMPLATES_PAGE,
    collectionTemplates,
    hubConfigText,
    projectText,
    type CollectionTemplate
} from '../../../data/sources/documents/templates.ts';
import { tokenedBody } from '../../core/auth.ts';
import { logChanges, type ChangeLog } from '../../core/changes.ts';
import { chained, type FsWrites } from '../../core/json.ts';
import { realPath } from '../../core/paths.ts';
import { resolveRootPath, type Root } from '../files.ts';
import { recordOf, stampOf } from '../fs/file-changes.ts';

/** What every answer of this route carries besides its type: nothing of it is cached. */
const NO_STORE = { 'cache-control': 'no-store' };

/** The manifest a repository keeps in its own `.oculus` folder. */
const OWN_MANIFEST = `${ROOT_FOLDER}/${MANIFEST}`;

/** A request of the route: the folder, and for a hub the keys of the chosen collections. */
const makeShape = z.object({
    action: z.enum(['offer', 'hub', 'project']),
    root: z.string(),
    path: z.string(),
    keys: z.array(z.string()).optional()
});

/** A collection a new hub may keep, as the dialog lists it. */
type MakeCollection = { key: string; file: string };

/** Which controls a folder offers, and the collections a new hub may keep. */
type MakeOffer = { hub: boolean; project: boolean; collections: MakeCollection[] };

/**
 * What the route needs: the served roots, oculus's own folder, which holds the templates, the
 * write chain of the file operations, the change log a make is recorded in (none records nothing)
 * and the home folder, the machine's by default.
 */
export type MakeTarget = {
    roots: Root[];
    engine: string;
    writes: FsWrites;
    changes?: ChangeLog;
    home?: string;
};

/** A refusal of the route, with its status. */
function refuse(error: string, status = 400, fields: Record<string, string> = {}): Response {
    return json({ error, ...fields }, { status, headers: NO_STORE });
}

/**
 * Whether a folder or one above it holds a hub settings file. The walk stops below the home
 * folder, whose `.oculus` is oculus's own state folder, and at the file system's root.
 */
function inHub(folder: string, home: string): boolean {
    for (let dir = folder; dir !== home; dir = dirname(dir)) {
        if (existsSync(join(dir, HUB_FILE))) return true;
        if (dirname(dir) === dir) return false;
    }
    return false;
}

/** What the folder at a real path holds that the two controls are offered by; `home` is real. */
export function folderMarks(folder: string, home: string): FolderMarks {
    const project = existsSync(join(folder, OWN_MANIFEST)) || existsSync(join(folder, MANIFEST));
    return {
        ...(existsSync(join(folder, HUB_FILE)) ? { hub: true as const } : {}),
        ...(project ? { project: true as const } : {}),
        ...(folder === home ? { home: true as const } : {})
    };
}

/**
 * Whether a folder above the one at a real path, up to the home folder and not including it,
 * holds a hub settings file; `home` is the home folder's real path.
 */
export function hubAbove(folder: string, home: string): boolean {
    return folder !== home && dirname(folder) !== folder && inHub(dirname(folder), home);
}

/**
 * The folder whose marks an event at a path under a root may change, or null for none: the folder
 * holding a `project.yml` or a `.oculus` folder named by the path, or the folder whose
 * `.oculus` holds the `config.yml` or `project.yml` named; `''` is the root itself.
 */
export function markedBy(path: string): string | null {
    const parts = path.split(/[\\/]/);
    const inner = parts.slice(-2).join('/');
    if (inner === HUB_FILE || inner === OWN_MANIFEST) return parts.slice(0, -2).join('/');
    const last = parts[parts.length - 1];
    return last === MANIFEST || last === ROOT_FOLDER ? parts.slice(0, -1).join('/') : null;
}

/** The templates page of oculus's folder, or null when it cannot be read. */
function readPage(engine: string): string | null {
    try {
        return readFileSync(join(engine, TEMPLATES_PAGE), 'utf8');
    } catch {
        return null;
    }
}

/** Which controls the folder at a real path offers; `home` is the home folder's real path. */
function offerOf(folder: string, page: string | null, home: string): MakeOffer {
    return {
        ...makeOffer(folderMarks(folder, home), hubAbove(folder, home)),
        collections: collectionTemplates(page ?? '').map(({ key, file }) => ({ key, file }))
    };
}

/**
 * Whether anything is at a path, a link included whatever it points at, so a link whose target is
 * gone is a path that is there: a make neither writes through it nor records it as its own.
 */
function present(path: string): boolean {
    return lstatSync(path, { throwIfNoEntry: false }) !== undefined;
}

/**
 * The paths a make brings into being, in the order of its files: for each file, the highest of
 * the file and its folders under the made folder that is not there yet, once each.
 */
function newPaths(folder: string, files: readonly string[]): string[] {
    const paths: string[] = [];
    for (const file of files) {
        const segments = file.split('/');
        const first = segments.findIndex(
            (_, at) => !present(join(folder, ...segments.slice(0, at + 1)))
        );
        if (first < 0) continue;
        const path = join(folder, ...segments.slice(0, first + 1));
        if (!paths.includes(path)) paths.push(path);
    }
    return paths;
}

/** Append a make to the change log as one `files` record of the paths it made that are there. */
async function recordMake(changes: ChangeLog | undefined, made: readonly string[]): Promise<void> {
    const after = made.map((path) => stampOf(path)).filter((one): one is FileStamp => one !== null);
    if (after.length === 0) return;
    await logChanges(changes, FILES_KIND, [recordOf('create', [], after)]);
}

/** The files a make writes, by their path under the folder, or the refusal that stops it. */
function filesOf(
    action: 'hub' | 'project',
    page: string | null,
    keys: readonly string[]
): { files: [string, string][] } | Response {
    if (page === null) return refuse('no-template', 500);
    if (action === 'project') {
        const text = projectText(page);
        return text === null ? refuse('no-template', 500) : { files: [[OWN_MANIFEST, text]] };
    }
    const known = collectionTemplates(page);
    const unknown = keys.find((key) => !known.some((one) => one.key === key));
    if (unknown !== undefined) return refuse('unknown-collection', 400, { key: unknown });
    const chosen: CollectionTemplate[] = known.filter((one) => keys.includes(one.key));
    return {
        files: [
            [HUB_FILE, hubConfigText(page, chosen)],
            ...chosen.map((one): [string, string] => [one.file, one.body])
        ]
    };
}

/**
 * POST /api/folders/make: answer what a folder offers, or make it a hub or a project. The make
 * writes only when the folder offers it and none of its files is there.
 */
export async function handleMake(
    request: Request,
    token: string,
    target: MakeTarget
): Promise<Response> {
    const read = await tokenedBody(request, token, {
        headers: NO_STORE,
        words: { token: 'token', json: 'not-json' }
    });
    if (read instanceof Response) return read;
    const asked = makeShape.safeParse(read.body);
    if (!asked.success) return refuse('not-a-make');
    const { action, root, path, keys = [] } = asked.data;
    const found = resolveRootPath(target.roots, root, path);
    if ('error' in found) return refuse(found.error, found.error === 'outside' ? 403 : 404);
    if (!statSync(found.path).isDirectory()) return refuse('missing', 404);
    const home = target.home ?? homedir();
    const homeReal = realPath(home) ?? home;
    if (action === 'offer') {
        const offer = offerOf(found.path, readPage(target.engine), homeReal);
        return json({ ok: true, ...offer }, { headers: NO_STORE });
    }
    return chained(target.writes, () => make(found.path, action, keys, target, homeReal));
}

/**
 * Make the folder at a real path a hub or a project, in its turn of the write chain: the offer is
 * asked again, every file is checked free, the files are written, and what was made is recorded.
 */
async function make(
    folder: string,
    action: 'hub' | 'project',
    keys: readonly string[],
    target: MakeTarget,
    home: string
): Promise<Response> {
    const page = readPage(target.engine);
    if (!offerOf(folder, page, home)[action]) return refuse('not-offered', 409);
    const planned = filesOf(action, page, keys);
    if (planned instanceof Response) return planned;
    const taken = planned.files.find(([file]) => present(join(folder, file)));
    if (taken !== undefined) return refuse('exists', 409, { path: taken[0] });
    const made = newPaths(
        folder,
        planned.files.map(([file]) => file)
    );
    const written: string[] = [];
    let failed = false;
    try {
        for (const [file, text] of planned.files) {
            const full = join(folder, file);
            mkdirSync(dirname(full), { recursive: true });
            writeFileSync(full, text, { flag: 'wx' });
            written.push(file);
        }
    } catch {
        failed = true;
    }
    await recordMake(target.changes, made);
    if (failed) return refuse('failed', 500, { written: written.join(', ') });
    return json({ ok: true, written }, { headers: NO_STORE });
}
