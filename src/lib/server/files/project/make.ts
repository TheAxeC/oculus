// Layer 2, server. The make items of the Files view, as POST /api/folders/make: Make Folder a
// Hub..., Make Folder a Project, Make Folder a Git Repository and Add Repository Configuration...,
// what a folder of the workspace offers, and what each item writes.
//
// The folder is a root's key and a path under it, resolved by real path inside its root, so no
// name walks out of the workspace. `offer` answers which items the folder offers, with the
// collections a new hub may keep and which repository configuration files the folder holds, by
// the rule of data/helpers/hub-names.ts's `makeOffer` over what the folder holds (`folderMarks`),
// whether a folder above it is a hub (`hubAbove`) and whether it is the served root: a project
// offers no hub and no project, a folder inside a hub offers no hub, a hub is never a project,
// and the home folder, oculus's state folder `~/.oculus` and every folder under it offer nothing,
// the home folder also stopping the walk up. The Files view's listings carry the same marks of
// each folder (fs.ts, `listShown`, and `workspacesAnswer` for the folders of the workspace), so
// its menu draws the items as it opens; `markedBy` names the folder whose marks a written path may
// change, which the git watcher lists again (watch/git.ts).
//
// `hub` writes `.oculus/config.yml` with the chosen collections, then the chosen hub files of
// HUB_CHOICES (`local`: `.oculus/local.yml`, mode 600, with the `.oculus/.gitignore` that keeps
// it out of git; `schedules`: `.oculus/schedules.yml`), then each chosen collection's data file at
// its default path. `project` writes `.oculus/project.yml`, and `repository` the chosen files of
// REPOSITORY_FILES. Every file comes from its template in oculus's docs/templates.md
// (data/sources/documents/templates.ts), and only on that press. `git` runs `git init -q` in the
// folder through the target's `initGit`, one argument vector and no shell.
//
// A make runs in the write chain of the Files view's operations (fs/ops.ts), asks the offer again
// there before it writes, refuses when any file it would write is there already, and writes each
// file with an exclusive create, so a file that appears meanwhile is refused rather than replaced.
// It is recorded in the change log as New File and New Folder are, one `files` record whose field
// is `create` and whose `after` stamps each path the make brought into being (a file, or the
// highest folder it made; the `.git` folder of a git make), so History takes it back by moving
// those paths to the Trash. A make that stopped part way records what it made. The refusals, in
// order: the token, a body that is no make, `outside` and `missing` for the folder, `not-offered`,
// `unknown-collection` and `unknown-file` with the name, `no-template`, `exists` with the path,
// `failed` for what the system answers, and `git` with git's own sentence.

import { json } from '@sveltejs/kit';
import { existsSync, lstatSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, sep } from 'node:path';
import { z } from 'zod';
import { FILES_KIND, type FileStamp } from '../../../data/file-ops.ts';
import {
    HUB_CHOICES,
    HUB_FILE,
    LOCAL_FILE,
    MANIFEST,
    REPOSITORY_FILES,
    ROOT_FOLDER,
    makeOffer,
    type FolderMarks,
    type MakeItems
} from '../../../data/helpers/hub-names.ts';
import {
    TEMPLATES_PAGE,
    collectionTemplates,
    fileText,
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

/** The folder git keeps a repository in. */
const GIT_FOLDER = '.git';

/** The mode `local.yml` is created with: only the account the server runs as reads it. */
const LOCAL_MODE = 0o600;

/** A request of the route: the folder, the chosen collections and the chosen files. */
const makeShape = z.object({
    action: z.enum(['offer', 'hub', 'project', 'git', 'repository']),
    root: z.string(),
    path: z.string(),
    keys: z.array(z.string()).optional(),
    files: z.array(z.string()).optional()
});

/** The items that write files from the templates. */
type FileAction = 'hub' | 'project' | 'repository';

/** A collection a new hub may keep, as the dialog lists it. */
type MakeCollection = { key: string; file: string };

/** A repository configuration file, and whether the folder holds it already. */
type MakeConfig = { name: string; file: string; there: boolean };

/**
 * Which items a folder offers, the collections a new hub may keep, and the repository
 * configuration files with whether each is there.
 */
type MakeOffer = MakeItems & { collections: MakeCollection[]; configs: MakeConfig[] };

/** A file a make writes: its path under the folder, its text, and its mode if not the default. */
type Planned = { file: string; text: string; mode?: number };

/**
 * What the route needs: the served roots, oculus's own folder, which holds the templates, the
 * write chain of the file operations, the change log a make is recorded in (none records nothing),
 * the home folder, the machine's by default, and the run of `git init -q` in a folder, which the
 * route hands in as the real git (server/git/clone/clone-git.ts), answering git's own sentence
 * when it fails.
 */
export type MakeTarget = {
    roots: Root[];
    engine: string;
    writes: FsWrites;
    changes?: ChangeLog;
    home?: string;
    initGit: (folder: string) => Promise<{ ok: boolean; error: string }>;
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

/**
 * Whether anything is at a path, a link included whatever it points at, so a link whose target is
 * gone is a path that is there: a make neither writes through it nor records it as its own.
 */
function present(path: string): boolean {
    return lstatSync(path, { throwIfNoEntry: false }) !== undefined;
}

/**
 * What the folder at a real path holds that the make items are offered by; `home` is real. The
 * state folder is told by its path under the home folder, so nothing under it is read for it.
 */
export function folderMarks(folder: string, home: string): FolderMarks {
    const project = existsSync(join(folder, OWN_MANIFEST)) || existsSync(join(folder, MANIFEST));
    const state = join(home, ROOT_FOLDER);
    const configured = REPOSITORY_FILES.every(([, file]) => existsSync(join(folder, file)));
    return {
        ...(existsSync(join(folder, HUB_FILE)) ? { hub: true as const } : {}),
        ...(project ? { project: true as const } : {}),
        ...(folder === home ? { home: true as const } : {}),
        ...(folder === state || folder.startsWith(state + sep) ? { state: true as const } : {}),
        ...(present(join(folder, GIT_FOLDER)) ? { git: true as const } : {}),
        ...(folder.split(sep).includes(GIT_FOLDER) ? { inGit: true as const } : {}),
        ...(configured ? { configured: true as const } : {})
    };
}

/**
 * Whether a folder above the one at a real path, up to the home folder and not including it,
 * holds a hub settings file; `home` is the home folder's real path.
 */
export function hubAbove(folder: string, home: string): boolean {
    return folder !== home && dirname(folder) !== folder && inHub(dirname(folder), home);
}

/** Whether a path under a folder names a file of its `.oculus` whose presence changes its marks. */
function marking(inner: string): boolean {
    return (
        inner === HUB_FILE ||
        inner === OWN_MANIFEST ||
        REPOSITORY_FILES.some(([, file]) => file === inner)
    );
}

/**
 * The folder whose marks an event at a path under a root may change, or null for none: the folder
 * holding a `project.yml`, a `.oculus` folder or a `.git` named by the path, or the folder whose
 * `.oculus` holds the `config.yml`, `project.yml` or repository configuration file named; `''` is
 * the root itself.
 */
export function markedBy(path: string): string | null {
    const parts = path.split(/[\\/]/);
    const inner = parts.slice(-2).join('/');
    if (marking(inner)) return parts.slice(0, -2).join('/');
    const last = parts[parts.length - 1];
    return last === MANIFEST || last === ROOT_FOLDER || last === GIT_FOLDER
        ? parts.slice(0, -1).join('/')
        : null;
}

/** The templates page of oculus's folder, or null when it cannot be read. */
function readPage(engine: string): string | null {
    try {
        return readFileSync(join(engine, TEMPLATES_PAGE), 'utf8');
    } catch {
        return null;
    }
}

/**
 * What the folder at a real path offers; `home` is the home folder's real path and `root` whether
 * the folder is the served root it was asked under.
 */
function offerOf(folder: string, page: string | null, home: string, root: boolean): MakeOffer {
    return {
        ...makeOffer(folderMarks(folder, home), hubAbove(folder, home), root),
        collections: collectionTemplates(page ?? '').map(({ key, file }) => ({ key, file })),
        configs: REPOSITORY_FILES.map(([name, file]) => ({
            name,
            file,
            there: present(join(folder, file))
        }))
    };
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

/**
 * The files of the chosen names of a list of choices (HUB_CHOICES, or REPOSITORY_FILES with one
 * file each), in the list's order, each from the template under the heading of its file's name in
 * docs/templates.md; a name the list lacks is refused as `unknown-file`, and a file whose template
 * the page lacks as `no-template`.
 */
function chosenFiles(
    page: string,
    choices: readonly (readonly [string, string | readonly string[]])[],
    names: readonly string[]
): Planned[] | Response {
    const unknown = names.find((name) => !choices.some(([known]) => known === name));
    if (unknown !== undefined) return refuse('unknown-file', 400, { file: unknown });
    const planned: Planned[] = [];
    for (const [name, files] of choices) {
        if (!names.includes(name)) continue;
        for (const file of typeof files === 'string' ? [files] : files) {
            const text = fileText(page, file.slice(ROOT_FOLDER.length + 1));
            if (text === null) return refuse('no-template', 500);
            planned.push({ file, text, ...(file === LOCAL_FILE ? { mode: LOCAL_MODE } : {}) });
        }
    }
    return planned;
}

/** The files a make writes, by their path under the folder, or the refusal that stops it. */
function filesOf(
    action: FileAction,
    page: string | null,
    keys: readonly string[],
    names: readonly string[]
): Planned[] | Response {
    if (page === null) return refuse('no-template', 500);
    if (action === 'project') {
        const text = projectText(page);
        return text === null ? refuse('no-template', 500) : [{ file: OWN_MANIFEST, text }];
    }
    if (action === 'repository') return chosenFiles(page, REPOSITORY_FILES, names);
    const known = collectionTemplates(page);
    const unknown = keys.find((key) => !known.some((one) => one.key === key));
    if (unknown !== undefined) return refuse('unknown-collection', 400, { key: unknown });
    const extra = chosenFiles(page, HUB_CHOICES, names);
    if (extra instanceof Response) return extra;
    const chosen: CollectionTemplate[] = known.filter((one) => keys.includes(one.key));
    return [
        { file: HUB_FILE, text: hubConfigText(page, chosen) },
        ...extra,
        ...chosen.map((one) => ({ file: one.file, text: one.body }))
    ];
}

/**
 * POST /api/folders/make: answer what a folder offers, or make it what the action names. The make
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
    const { action, root, path, keys = [], files = [] } = asked.data;
    const found = resolveRootPath(target.roots, root, path);
    if ('error' in found) return refuse(found.error, found.error === 'outside' ? 403 : 404);
    if (!statSync(found.path).isDirectory()) return refuse('missing', 404);
    const home = target.home ?? homedir();
    const homeReal = realPath(home) ?? home;
    const dir = target.roots.find((one) => one.key === root)?.dir ?? '';
    const atRoot = found.path === realPath(dir);
    const place: Place = { folder: found.path, home: homeReal, root: atRoot };
    if (action === 'offer') {
        const offer = offerOf(found.path, readPage(target.engine), homeReal, atRoot);
        return json({ ok: true, ...offer }, { headers: NO_STORE });
    }
    if (action === 'git') return chained(target.writes, () => makeGit(place, target));
    return chained(target.writes, () => make(place, action, keys, files, target));
}

/** The folder a make is asked of, by its real path, with the home folder's real path. */
type Place = { folder: string; home: string; root: boolean };

/**
 * Make the folder a git repository, in its turn of the write chain: the offer is asked again,
 * `git init -q` runs in the folder, and the `.git` folder it made is recorded.
 */
async function makeGit(place: Place, target: MakeTarget): Promise<Response> {
    if (!offerOf(place.folder, null, place.home, place.root).git) {
        return refuse('not-offered', 409);
    }
    const ran = await target.initGit(place.folder);
    await recordMake(target.changes, [join(place.folder, GIT_FOLDER)]);
    if (!ran.ok) return refuse('git', 500, { said: ran.error });
    return json({ ok: true, written: [GIT_FOLDER] }, { headers: NO_STORE });
}

/**
 * Make the folder a hub, a project or a configured repository, in its turn of the write chain: the
 * offer is asked again, every file is checked free, the files are written, and what was made is
 * recorded.
 */
async function make(
    place: Place,
    action: FileAction,
    keys: readonly string[],
    names: readonly string[],
    target: MakeTarget
): Promise<Response> {
    const { folder } = place;
    const page = readPage(target.engine);
    if (!offerOf(folder, page, place.home, place.root)[action]) return refuse('not-offered', 409);
    const planned = filesOf(action, page, keys, names);
    if (planned instanceof Response) return planned;
    const taken = planned.find(({ file }) => present(join(folder, file)));
    if (taken !== undefined) return refuse('exists', 409, { path: taken.file });
    const made = newPaths(
        folder,
        planned.map(({ file }) => file)
    );
    const written: string[] = [];
    let failed = false;
    try {
        for (const { file, text, mode } of planned) {
            const full = join(folder, file);
            mkdirSync(dirname(full), { recursive: true });
            writeFileSync(full, text, { flag: 'wx', ...(mode === undefined ? {} : { mode }) });
            written.push(file);
        }
    } catch {
        failed = true;
    }
    await recordMake(target.changes, made);
    if (failed) return refuse('failed', 500, { written: written.join(', ') });
    return json({ ok: true, written }, { headers: NO_STORE });
}
