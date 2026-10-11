// Layer 2, server. One local file, read from a directory the configuration names and streamed to
// the page. routes/api/(files)/file/[root]/[...path]/+server.ts is the endpoint and holds nothing
// but the GET, since a route module may export only its verbs.
//
// It is what DESIGN.md's decision needs, "a local HTML file under a configured root opens as a
// tab": the manuals of cathedra and game-engine are single HTML files beside their own stylesheets
// and images, and a browser resolves `css/manual.css` against the document's own URL, so every
// asset the page asks for comes back through this same route without the file being rewritten.
//
// Nothing outside a root is ever served, which is DESIGN.md's "Auth" applied to a route that reads
// a path the request names. The root's directory and the resolved file are both put through
// realpath first, so a symbolic link pointing out of the root is refused rather than followed, and
// the file is then required to be the directory itself or something under it. Where the request
// came from is answered before any of that, by the origin guard in src/hooks.server.ts.
//
// Whether a path lies in a folder and where a path really is are read from server/core/paths.ts
// (`inside`, `realPath`).

import { createReadStream, existsSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, extname, isAbsolute, join, relative, resolve } from 'node:path';
import { Readable } from 'node:stream';
import mime from 'mime';
import { z } from 'zod';
import { inAppsFolder } from '../../data/helpers/files/apps/apps.ts';
import { ENGINE_ROOT, HUB_ROOT, MANIFEST, ROOT_FOLDER } from '../../data/helpers/hub-names.ts';
import { findingText } from '../../data/helpers/finding-text.ts';
import { folderOnDisk } from '../../data/places/folder-on-disk.ts';
import { configDir, textCatalog } from '../../data/sources/config.ts';
import type { Finding, Project } from '../../data/model/index.ts';
import { inside, realPath } from '../core/paths.ts';

/**
 * A project's folder from the snapshot, resolved beneath the configured hub root unless it is a
 * repository's, which is the repository's own folder. Every action that starts a terminal in a
 * project's own folder, and the LaTeX reader of its manuscript folder, resolves it here, so the
 * check that a hub folder did not leave the hub exists once.
 */
export function projectDirectory(
    hub: string,
    project: Pick<Project, 'folder' | 'repository'>
): string {
    const cwd = folderOnDisk(hub, project);
    if (project.repository !== undefined) return cwd;
    const within = relative(hub, cwd);
    if (within.startsWith('..') || isAbsolute(within)) {
        throw new Error('the project folder is outside the configured hub');
    }
    return cwd;
}

/**
 * One directory the server may serve files from: the key a URL names it by, and where it is. A root
 * marked `hub` is built as a hub of its own and merged into the portfolio. A root whose
 * `.oculus/project.yml` is there is a project of the first hub with the key for its id, unless
 * `noProject` is set, which `readRoots` does when the key or the directory forbids it and which
 * leaves the root served and read by nothing else.
 */
export type Root = { key: string; dir: string; hub?: true; noProject?: true };

/** Anything mime does not name is bytes: the browser is told nothing it cannot check. */
const FALLBACK = 'application/octet-stream';

/**
 * The extensions mime names as MPEG transport streams, which a code tree holds as TypeScript,
 * served as bytes, as any other source file the browser is not meant to run.
 */
const TYPESCRIPT: readonly string[] = ['.ts', '.mts', '.cts'];

/**
 * A minute. The file is the reader's own and changes under them, so it is re-read soon; it is
 * private because a manual is the machine's own document and no proxy has any business holding it.
 */
export const CACHE = 'private, max-age=60';

/**
 * The type a name is served as, by its extension, as mime names it: a text type and JSON with the
 * charset every file here is read in, anything mime does not know and TypeScript as bytes. A bare
 * dotfile such as `.png` has no extension, and is bytes too.
 */
export function typeOf(name: string): string {
    const extension = extname(name).toLowerCase();
    const type = TYPESCRIPT.includes(extension) ? null : mime.getType(extension);
    if (type === null) return FALLBACK;
    const text = type.startsWith('text/') || type === 'application/json';
    return text ? `${type}; charset=utf-8` : type;
}

/** Resolve an existing file under a named root, refusing missing roots, directories and escapes. */
export function resolveRootFile(list: Root[], key: string, path: string): string | null {
    const result = resolveRootFileResult(list, key, path);
    return 'path' in result ? result.path : null;
}

/** The same resolution, retaining the distinction between a missing file and a root escape. */
export function resolveRootFileResult(
    list: Root[],
    key: string,
    path: string
): { path: string } | { error: 'outside' | 'missing' } {
    const found = resolveRootPath(list, key, path);
    if ('error' in found) return found;
    try {
        return statSync(found.path).isFile() ? found : { error: 'missing' };
    } catch {
        return { error: 'missing' };
    }
}

/**
 * The real path a root's key and a relative path name, whatever is there: a file, a directory or
 * nothing. Both ends go through realpath first, so a symbolic link pointing out of the root is
 * refused rather than followed, and the result is then required to be the root itself or something
 * under it. The file route and the directory listing share this, so neither can drift from the
 * other on what is inside a root.
 */
export function resolveRootPath(
    list: Root[],
    key: string,
    path: string
): { path: string } | { error: 'outside' | 'missing' } {
    const root = list.find((one) => one.key === key);
    if (root === undefined) return { error: 'outside' };
    const dir = realPath(root.dir);
    if (dir === null) return { error: 'outside' };
    const candidate = resolve(dir, path);
    const full = realPath(candidate);
    if (full === null) {
        if (!inside(candidate, dir)) return { error: 'outside' };
        // A missing child of a symlinked directory can still be outside the named root.
        let parent = dirname(candidate);
        while (inside(parent, dir)) {
            const ancestor = realPath(parent);
            if (ancestor !== null) return { error: inside(ancestor, dir) ? 'missing' : 'outside' };
            const next = dirname(parent);
            if (next === parent) break;
            parent = next;
        }
        return { error: 'missing' };
    }
    if (!inside(full, dir)) return { error: 'outside' };
    return { path: full };
}

/** A served root: a key and a directory, each text that is not empty. */
export const rootShape = z.object({
    key: z.string().min(1),
    dir: z.string().min(1)
}) satisfies z.ZodType<Root>;

/**
 * One entry of the `roots:` list: a map, whose `key`, `dir` and `hub` are checked one at a time and
 * whose `tier` is named when it is there.
 */
const rootEntryShape = z.looseObject({
    key: z.unknown().optional(),
    dir: z.unknown().optional(),
    hub: z.unknown().optional(),
    tier: z.unknown().optional()
});

/** The `roots:` value: a list, of entries nothing has checked yet. */
const rootListShape = z.array(z.unknown());

/**
 * The keys a hub root or a repository project may not carry: each is a fixed root the merged ids
 * already use.
 */
const RESERVED_HUB_KEYS: readonly string[] = [HUB_ROOT, ENGINE_ROOT];

/**
 * A directory's place on disk, links followed, or the directory as written when it is not there.
 */
function placeOf(dir: string): string {
    return realPath(dir, true) ?? resolve(dir);
}

/**
 * The sentence saying why a root marked `hub: true` is read as a plain root, or null when it is a
 * hub: a key that is reserved or holds a colon, a directory that is, lies inside or holds the first
 * hub, or that is, lies inside or holds the directory of a hub root listed above it.
 */
function hubRefusal(
    catalog: Record<string, string>,
    key: string,
    dir: string,
    first: string,
    taken: readonly Root[]
): string | null {
    if (RESERVED_HUB_KEYS.includes(key) || key.includes(':')) {
        return findingText(catalog, 'findings.roots.hub_reserved_key');
    }
    const place = placeOf(dir);
    const home = placeOf(first);
    if (inside(place, home) || inside(home, place)) {
        return findingText(catalog, 'findings.roots.hub_is_first');
    }
    for (const one of taken) {
        const other = placeOf(one.dir);
        if (place === other) return findingText(catalog, 'findings.roots.hub_same_dir');
        if (inside(place, other) || inside(other, place)) {
            return findingText(catalog, 'findings.roots.hub_nested');
        }
    }
    return null;
}

/** Whether a directory holds the manifest that makes it a project. */
function holdsManifest(dir: string): boolean {
    return existsSync(join(dir, ROOT_FOLDER, MANIFEST));
}

/** Why a root that holds a manifest is no project: the three reasons `projectRefusalKind` names. */
type ProjectRefusal = 'reserved_key' | 'is_first' | 'same_dir';

/**
 * The reason a root that holds a manifest is no project, or null when it is one: a key that holds
 * a colon, a slash or whitespace or is reserved (the key becomes the project's id), a directory
 * that is, lies inside or holds the first hub, or whose real directory an earlier project root
 * has. `taken` are the roots listed above it.
 */
function projectRefusalKind(
    key: string,
    dir: string,
    first: string,
    taken: readonly Root[]
): ProjectRefusal | null {
    if (RESERVED_HUB_KEYS.includes(key) || /[:/\s]/.test(key)) return 'reserved_key';
    const place = placeOf(dir);
    const home = placeOf(first);
    if (inside(place, home) || inside(home, place)) return 'is_first';
    if (taken.some((one) => isProject(one) && placeOf(one.dir) === place)) return 'same_dir';
    return null;
}

/** The sentence of each reason a root holding a manifest is no project. */
function refusalText(catalog: Record<string, string>, kind: ProjectRefusal | 'in_hub'): string {
    switch (kind) {
        case 'reserved_key':
            return findingText(catalog, 'findings.roots.project_reserved_key');
        case 'is_first':
            return findingText(catalog, 'findings.roots.project_is_first');
        case 'same_dir':
            return findingText(catalog, 'findings.roots.project_same_dir');
        case 'in_hub':
            return findingText(catalog, 'findings.roots.project_in_hub');
    }
}

/** The sentence of `projectRefusalKind`, or null when the root can be a project. */
function projectRefusal(
    catalog: Record<string, string>,
    key: string,
    dir: string,
    first: string,
    taken: readonly Root[]
): string | null {
    const kind = projectRefusalKind(key, dir, first, taken);
    return kind === null ? null : refusalText(catalog, kind);
}

/** Whether a project root's directory is, lies inside or holds the directory of a hub root. */
function overlapsHub(root: Root, roots: readonly Root[]): boolean {
    const place = placeOf(root.dir);
    return roots
        .filter((one) => one.hub === true)
        .map((one) => placeOf(one.dir))
        .some((hub) => inside(place, hub) || inside(hub, place));
}

/**
 * The roots a reader added in the file browser that hold a manifest and cannot be a project, each
 * with the reason `readRoots` refuses a configured root for: the key, a directory that overlaps
 * the first hub or a hub root, or one a root above it already reads. `configured` are the roots
 * listed before them.
 */
function addedRefusals(
    configured: readonly Root[],
    added: readonly Root[],
    first: string
): { root: Root; kind: ProjectRefusal | 'in_hub' | null }[] {
    const listed: Root[] = [...configured];
    return added.map((one) => {
        const kind = !holdsManifest(one.dir)
            ? null
            : (projectRefusalKind(one.key, one.dir, first, listed) ??
              (overlapsHub(one, listed) ? 'in_hub' : null));
        const root: Root = kind === null ? one : { ...one, noProject: true };
        listed.push(root);
        return { root, kind };
    });
}

/**
 * The roots a reader added in the file browser, each marked `noProject` that holds a manifest and
 * cannot be a project (`addedRefusals`). The manifest of an added root is read as a project of the
 * first hub exactly when a configured root's is.
 */
export function markAddedProjects(
    configured: readonly Root[],
    added: readonly Root[],
    first: string
): Root[] {
    return addedRefusals(configured, added, first).map((one) => one.root);
}

/**
 * A finding on the saved workspaces file `file` for each root a reader added that holds a
 * manifest and is no project, in the words a configured root refused for the same reason gets, so
 * a folder added to the workspace never drops off the boards without saying why.
 */
export function addedProjectFindings(
    configured: readonly Root[],
    added: readonly Root[],
    first: string,
    file: string,
    catalog: Record<string, string>
): Finding[] {
    return addedRefusals(configured, added, first).flatMap(({ root, kind }) =>
        kind === null ? [] : [{ file, key: root.key, message: refusalText(catalog, kind) }]
    );
}

/** Whether a root is read as a project: no hub, none refused, and its manifest is there. */
function isProject(root: Root): boolean {
    return root.hub !== true && root.noProject !== true && holdsManifest(root.dir);
}

/**
 * The `roots:` list of the merged sources.yml (the hub layer's list), and a finding for every entry
 * that is not usable: one that is not a pair of strings, a key two entries share, a directory that
 * is not on this machine, a `hub: true` that cannot be honoured, a `tier` key (an entry takes key,
 * dir and hub only, and the entry is read without it) and a root holding a project manifest that
 * cannot be a project. A finding is reported and never repaired, so a root whose directory has
 * moved shows up in the Findings view rather than as a tab that silently serves nothing. A root
 * whose `hub` is not true, or whose `hub: true` is refused, is a plain root. `first` is the first
 * hub's directory, which no hub root and no project root may overlap, and no project root may
 * overlap a hub root that stands.
 */
export function readRoots(
    config: Record<string, unknown>,
    file: string,
    first: string
): { roots: Root[]; findings: Finding[] } {
    const roots: Root[] = [];
    const findings: Finding[] = [];
    if (config.roots === undefined) return { roots, findings };
    const catalog = textCatalog(config);
    const list = rootListShape.safeParse(config.roots);
    if (!list.success) {
        findings.push({
            file,
            key: 'roots',
            message: findingText(catalog, 'findings.roots.not_a_list')
        });
        return { roots, findings };
    }
    for (const item of list.data) {
        const entry = rootEntryShape.safeParse(item);
        if (!entry.success) {
            findings.push({
                file,
                key: 'roots',
                message: findingText(catalog, 'findings.roots.not_a_map')
            });
            continue;
        }
        const key = rootShape.shape.key.safeParse(entry.data.key);
        if (!key.success) {
            findings.push({
                file,
                key: 'roots',
                message: findingText(catalog, 'findings.roots.no_key')
            });
            continue;
        }
        const named = rootShape.shape.dir.safeParse(entry.data.dir);
        if (!named.success) {
            findings.push({
                file,
                key: key.data,
                message: findingText(catalog, 'findings.roots.no_dir')
            });
            continue;
        }
        if (roots.some((one) => one.key === key.data)) {
            findings.push({
                file,
                key: key.data,
                message: findingText(catalog, 'findings.roots.repeated_key')
            });
            continue;
        }
        const dir = expandHome(named.data);
        if (!isAbsolute(dir)) {
            findings.push({
                file,
                key: key.data,
                message: findingText(catalog, 'findings.roots.relative', named.data)
            });
            continue;
        }
        const root: Root = { key: key.data, dir };
        if (entry.data.tier !== undefined) {
            findings.push({
                file,
                key: key.data,
                message: findingText(catalog, 'findings.roots.tier_key')
            });
        }
        if (realPath(dir) === null) {
            findings.push({
                file,
                key: key.data,
                message: findingText(catalog, 'findings.roots.missing_dir', dir)
            });
        } else {
            if (entry.data.hub === true) {
                const refusal = hubRefusal(
                    catalog,
                    key.data,
                    dir,
                    first,
                    roots.filter((one) => one.hub === true)
                );
                if (refusal === null) root.hub = true;
                else findings.push({ file, key: key.data, message: refusal });
            } else if (entry.data.hub !== undefined && entry.data.hub !== false) {
                findings.push({
                    file,
                    key: key.data,
                    message: findingText(catalog, 'findings.roots.hub_not_boolean')
                });
            }
            if (root.hub !== true && holdsManifest(dir)) {
                const refusal = projectRefusal(catalog, key.data, dir, first, roots);
                if (refusal !== null) {
                    root.noProject = true;
                    findings.push({ file, key: key.data, message: refusal });
                }
            }
        }
        roots.push(root);
    }
    // A project root never reads the folder of a hub root that stands, whichever of the two the
    // list names first, so one folder is never both a hub and a project of the first hub.
    for (const root of roots) {
        if (!isProject(root) || !overlapsHub(root, roots)) continue;
        root.noProject = true;
        findings.push({
            file,
            key: root.key,
            message: findingText(catalog, 'findings.roots.project_in_hub')
        });
    }
    return { roots, findings };
}

/** The roots among the given ones that are hubs, in the order of `roots:`. */
export function hubRoots(list: readonly Root[]): Root[] {
    return list.filter((one) => one.hub === true);
}

/**
 * A dir written as `~` or `~/...` with the home directory in place of the tilde, so the tracked
 * config carries no user path (the hub's rule) and the same file serves another account unchanged.
 */
export function expandHome(dir: string): string {
    if (dir === '~') return homedir();
    if (dir.startsWith('~/')) return join(homedir(), dir.slice(2));
    return dir;
}

/**
 * The file the request names, streamed from disk. 404 covers every way there is nothing to send: a
 * root nothing configures, a root whose directory is not there, a path that leaves the root once
 * both ends are resolved, a file that is not there, and a directory.
 */
export function serveFile(
    list: Root[],
    key: string,
    path: string,
    appFolders: readonly string[] = []
): Response {
    const full = resolveRootFile(list, key, path);
    if (full === null) return new Response(null, { status: 404 });
    // The bytes are streamed: a manual is megabytes and nothing here holds one in memory.
    const body = Readable.toWeb(createReadStream(full)) as ReadableStream;
    // A file of an apps folder is app code. It is sent as plain text with sniffing off, so a page
    // that opens it (the Document view's frame has this origin) shows its source and never runs it.
    const app = inAppsFolder(appFolders, full, '');
    return new Response(body, {
        status: 200,
        headers: {
            'content-type': app ? 'text/plain; charset=utf-8' : typeOf(full),
            'cache-control': CACHE,
            ...(app ? { 'x-content-type-options': 'nosniff' } : {})
        }
    });
}

/**
 * The engine's sources.yml, the name `configuredRootsOf` gives `readRoots`; only the roots it reads
 * are kept, so the name labels no finding that is shown.
 */
function rootsFile(engine: string): string {
    return join(configDir(engine), 'sources.yml');
}

// The keys the hub and the engine's config folder are served under, which the file routes' callers
// import from here.
export { ENGINE_ROOT, HUB_ROOT };

/**
 * The engine's config folder as a root, which is the directory loadConfig merges its files from and
 * loadLocal reads local.yml in: the folder the page lists and saves into is the folder the server
 * reads, so a run started over another engine directory never writes the checkout.
 */
export function engineRoot(engine: string): Root {
    return { key: ENGINE_ROOT, dir: configDir(engine) };
}

/**
 * The roots the merged `roots:` list names, without the hub in front of them, out of a config
 * already read.
 */
export function configuredRootsOf(
    config: Record<string, unknown>,
    engine: string,
    hub: string
): Root[] {
    return readRoots(config, rootsFile(engine), hub).roots;
}

/**
 * The configured roots with the two fixed ones in front of them, the hub under `hub` and the
 * engine's config folder under `engine`, unless the config names that key itself, in which case the
 * config's entry stands. The hub is where `local.yml` says it is, so the tracked config never
 * carries it twice.
 */
export function withFixed(list: Root[], hub: string, engine: string): Root[] {
    const fixed: Root[] = [];
    if (!list.some((one) => one.key === HUB_ROOT)) fixed.push({ key: HUB_ROOT, dir: hub });
    if (!list.some((one) => one.key === ENGINE_ROOT)) fixed.push(engineRoot(engine));
    return [...fixed, ...list];
}

/**
 * The roots api/file serves: the hub, the engine's config folder, the configured ones, and the ones
 * `added` names.
 *
 * `added` is the current workspace's own roots, so a folder the reader added in the file browser is
 * served exactly as a configured one is. The two fixed keys and every configured key win over an
 * added root carrying the same key, so a saved workspace can only ever add a root and never
 * redirect one the rest of the application reads; the inside-root check is the same for both.
 */
export function rootsFrom(
    configured: Root[],
    hub: string,
    engine: string,
    added: Root[] = []
): Root[] {
    const taken = new Set([HUB_ROOT, ENGINE_ROOT, ...configured.map((one) => one.key)]);
    const extra = added.filter((one) => !taken.has(one.key));
    return withFixed([...configured, ...extra], hub, engine);
}
