// Layer 1, data. Walks the scan folders and the repositories and reads every project.yml into a raw
// record with provenance. Server side only: it reads the filesystem and no client module may import
// it. It validates nothing and resolves nothing. Every failure is a Finding; nothing here throws,
// so one unparseable manifest costs its own record and no more.
//
// One reader serves every project: a project of a scan folder and a project of a workspace folder
// are the same record, and the manifest's own `tier` and `stage` say which board and which stage it
// is on. The folder a project lies in decides neither.
//
// A project is a folder holding `project.yml` at its top or `.oculus/project.yml`, in a scan folder
// and in a workspace folder alike. A folder holding both is read from its top file and the other is
// a finding naming both. A folder that is a hub (it holds `.oculus/config.yml`) is never a project.
// A manifest is read once, by its real path: a workspace folder whose manifest a hub's scan reads
// is that scan project, and every other workspace folder's manifest is read as its project wherever
// the folder lies, inside a hub, inside a scan folder or holding a hub.
//
// A folder that is a clone of another project is not a project of its own: when the `origin` of the
// folder's repository is the `repository.url` of another project read in the same pass, the folder
// is that project's clone. It is left out with no finding, whichever of the two the walk met first.

import { lstatSync, readdirSync, realpathSync, statSync } from 'node:fs';
import { basename, join, relative, sep } from 'node:path';
import { findingText, type TextCatalog } from '../helpers/finding-text.ts';
import { isMap } from '../helpers/guards.ts';
import type { Finding, RawManifest, RepositoryRoot, ScanRule } from '../model/index.ts';
import { HUB_FILE, MANIFEST, ROOT_FOLDER, entersFolder } from '../helpers/hub-names.ts';
import { gitFolderOf, originOf, repositoryStandIns, sameAddress } from './origin.ts';
import { errorLine, readYamlMap } from './yaml-file.ts';

/** The folder of a project that holds its code, which is what the deposit mirrors. */
export const CODE_FOLDER = 'code';

/**
 * The most a project's manifest may hold. Its keys are a few lines each, so a larger file is not
 * one; the bound keeps a mistaken path (a log, a dump) from being read whole on every rebuild.
 */
const MANIFEST_MAX_BYTES = 64 * 1024;

/** Hub-relative path with forward slashes, whatever the platform's separator is. */
function hubPath(hub: string, dir: string): string {
    return relative(hub, dir).split(sep).join('/');
}

function isDir(path: string): boolean {
    try {
        return statSync(path).isDirectory();
    } catch {
        return false;
    }
}

/** When the manifest was last written, in milliseconds, or nothing when it cannot be stat'ed. */
function mtimeOf(file: string): number | undefined {
    try {
        return statSync(file).mtimeMs;
    } catch {
        return undefined;
    }
}

/** Whether a path is a file, a link to one included. */
function isFile(path: string): boolean {
    try {
        return statSync(path).isFile();
    } catch {
        return false;
    }
}

/** Whether a folder is a hub: it holds the hub's settings file, `.oculus/config.yml`. */
export function isHubFolder(dir: string): boolean {
    return isFile(join(dir, HUB_FILE));
}

/** The manifest file of a project folder, and the file it shadows when the folder holds both. */
export type ProjectFile = { file: string; shadowed: string | null };

/**
 * The manifest of the project a folder is: its top `project.yml`, else `.oculus/project.yml`, with
 * the second named as `shadowed` when the folder holds both. Null for a folder that holds neither
 * and for a hub, which is never a project.
 */
export function projectFileIn(dir: string): ProjectFile | null {
    if (isHubFolder(dir)) return null;
    const top = join(dir, MANIFEST);
    const nested = join(dir, ROOT_FOLDER, MANIFEST);
    const hasTop = isFile(top);
    const hasNested = isFile(nested);
    if (hasTop) return { file: top, shadowed: hasNested ? nested : null };
    return hasNested ? { file: nested, shadowed: null } : null;
}

/** A folder's place on disk, links followed, or the folder as it is when that cannot be read. */
function placeOf(dir: string): string {
    try {
        return realpathSync(dir);
    } catch {
        return dir;
    }
}

/**
 * Subdirectories in name order that a walk enters: the ones that are folders themselves, so a
 * symbolic link to a folder is not entered, and that are neither dot folders nor a package tree.
 */
function subdirs(dir: string): string[] {
    let entries;
    try {
        entries = readdirSync(dir, { withFileTypes: true });
    } catch {
        return [];
    }
    return entries
        .filter((e) => e.isDirectory() && entersFolder(e.name))
        .map((e) => e.name)
        .sort();
}

/**
 * Every folder under `base` that is a project, at any depth, as its path segments from `base`. The
 * walk stops at a project: nothing inside one is a project of its own, which keeps a
 * `code/project.yml` out. A folder that is no project (a filing folder, or a hub) is walked
 * through; the first of its segments above a project is the project's category.
 */
function nestedProjects(base: string, segments: string[] = []): string[][] {
    const found: string[][] = [];
    for (const name of subdirs(join(base, ...segments))) {
        const path = [...segments, name];
        if (projectFileIn(join(base, ...path)) !== null) found.push(path);
        else found.push(...nestedProjects(base, path));
    }
    return found;
}

/** What reading one manifest file found. */
type ManifestFile =
    { kind: 'absent' } | { kind: 'unusable' } | { kind: 'map'; data: Record<string, unknown> };

/**
 * One project's manifest. Only a regular file within the size bound is opened: a directory, a
 * symbolic link, a named pipe or a device is a finding and is never read, so a path that points
 * somewhere else, or at something that blocks, costs the project and nothing more. A file that is
 * not there is `absent`, and the caller decides whether that is a finding.
 */
function readManifestFile(file: string, catalog: TextCatalog, findings: Finding[]): ManifestFile {
    let stat;
    try {
        stat = lstatSync(file);
    } catch (error) {
        const code = (error as NodeJS.ErrnoException).code;
        if (code === 'ENOENT' || code === 'ENOTDIR') return { kind: 'absent' };
        findings.push({
            file,
            key: '',
            message: findingText(catalog, 'findings.file.does_not_parse', errorLine(error))
        });
        return { kind: 'unusable' };
    }
    if (!stat.isFile()) {
        findings.push({
            file,
            key: '',
            message: findingText(catalog, 'findings.manifests.not_file')
        });
        return { kind: 'unusable' };
    }
    if (stat.size > MANIFEST_MAX_BYTES) {
        findings.push({
            file,
            key: '',
            message: findingText(catalog, 'findings.manifests.too_large', MANIFEST_MAX_BYTES)
        });
        return { kind: 'unusable' };
    }
    const data = readYamlMap(file, catalog, findings, (error) =>
        findingText(catalog, 'findings.file.does_not_parse', errorLine(error))
    );
    return data === null ? { kind: 'unusable' } : { kind: 'map', data };
}

/**
 * Build one record of the project `id` whose folder is `folder` (hub-relative, or a workspace
 * folder's absolute path) and whose manifest is `file`. Provenance wins over the manifest for `id`;
 * the manifest's own value is kept (`manifestId`) or reported, never silently replaced. Every other
 * key, `tier` and `stage` among them, is the manifest's as written.
 */
function record(
    place: { file: string; folder: string; id: string; dir: string },
    data: Record<string, unknown>,
    category: string | undefined,
    catalog: TextCatalog,
    findings: Finding[]
): RawManifest {
    const { file, folder, id } = place;

    if (data.id !== undefined && data.id !== id) {
        findings.push({
            file,
            key: 'id',
            message: findingText(
                catalog,
                'findings.manifests.id_not_folder',
                JSON.stringify(data.id),
                id
            )
        });
    }

    const built: RawManifest = { ...data, file, folder, id };
    const changed = mtimeOf(file);
    if (changed !== undefined) built.fileMtime = changed;
    if (category !== undefined) built.category = category;
    if (data.id !== undefined) built.manifestId = data.id;
    if (isDir(join(place.dir, CODE_FOLDER))) built.codeFolder = true;
    return built;
}

/**
 * The ids the projects read so far hold, each with the manifest it came from. A second project of
 * a taken id is one finding, filed on its own manifest and naming both, and is not read.
 */
function claimer(catalog: TextCatalog, findings: Finding[]): (id: string, file: string) => boolean {
    const claimed = new Map<string, string>();
    return (id, file) => {
        const first = claimed.get(id);
        if (first === undefined) {
            claimed.set(id, file);
            return true;
        }
        findings.push({
            file,
            key: 'id',
            message: findingText(catalog, 'findings.manifests.id_twice', id, first, file)
        });
        return false;
    };
}

/**
 * Note a folder that holds both manifests: the top `project.yml` is read, and the finding on the
 * `.oculus/project.yml` names both files.
 */
function noteShadowed(placed: ProjectFile, catalog: TextCatalog, findings: Finding[]): void {
    if (placed.shadowed === null) return;
    findings.push({
        file: placed.shadowed,
        key: '',
        message: findingText(catalog, 'findings.manifests.both_files', placed.file, placed.shadowed)
    });
}

/**
 * A project folder found by a walk and read, before its id is claimed. `findings` are what reading
 * it raised, which are kept only when the folder is a project of its own. `root` is set on the
 * folder of a workspace.
 */
type Found = {
    file: string;
    folder: string;
    id: string;
    dir: string;
    category?: string;
    root?: RepositoryRoot;
    data: Record<string, unknown> | null;
    findings: Finding[];
};

/** The folder at `dir` read as a project: its manifest, and the findings that reading raised. */
function foundAt(
    placed: ProjectFile,
    place: { folder: string; id: string; dir: string; category?: string; root?: RepositoryRoot },
    catalog: TextCatalog
): Found {
    const findings: Finding[] = [];
    noteShadowed(placed, catalog, findings);
    const read = readManifestFile(placed.file, catalog, findings);
    return { ...place, file: placed.file, data: read.kind === 'map' ? read.data : null, findings };
}

/** The `repository.url` a manifest holds, or null. */
function urlOf(data: Record<string, unknown> | null): string | null {
    const block = data?.repository;
    const url = isMap(block) ? block.url : undefined;
    return typeof url === 'string' && url.trim() !== '' ? url : null;
}

/**
 * The projects among the folders found, in the order found. Folders that share one git folder, a
 * main checkout and its linked worktrees, are one repository and one project, read from the main
 * checkout when it was found and otherwise from the first of them; the others are left out, with
 * their findings (`repositoryStandIns` of origin.ts). A folder whose repository's `origin` is the
 * `repository.url` of a folder of another repository is that project's clone and is left out, with
 * its findings. Two folders that are clones of each other's address are two clones of one
 * repository, and the one found first stays. Each project that stays is claimed under its id and
 * made a record; an id an earlier project holds is a finding and the project is not read.
 */
function settle(
    found: Found[],
    claim: (id: string, file: string) => boolean,
    catalog: TextCatalog,
    findings: Finding[]
): RawManifest[] {
    const urls = found.map((one) => urlOf(one.data));
    const origins = found.map((one) => originOf(one.dir));
    const standIns = repositoryStandIns(found.map((one) => gitFolderOf(one.dir)));
    const cloneOf = (at: number): boolean => {
        const origin = origins[at];
        if (origin === null) return false;
        return urls.some((url, other) => {
            if (standIns[other] === standIns[at]) return false;
            if (url === null || !sameAddress(url, origin)) return false;
            const own = urls[at];
            const mutual =
                own !== null && origins[other] !== null && sameAddress(own, origins[other]);
            return !mutual || other < at;
        });
    };
    const manifests: RawManifest[] = [];
    found.forEach((one, at) => {
        if (standIns[at] !== at || cloneOf(at)) return;
        findings.push(...one.findings);
        if (one.data === null || !claim(one.id, one.file)) return;
        const place = { file: one.file, folder: one.folder, id: one.id, dir: one.dir };
        const project = record(place, one.data, one.category, catalog, findings);
        manifests.push(
            one.root === undefined
                ? project
                : { ...project, workspaceFolder: { root: one.root.key, dir: one.root.dir } }
        );
    });
    return manifests;
}

/** A project folder the scan rules reach: where it lies, its path in the scan folder, its file. */
type Reached = { dir: string; segments: string[]; placed: ProjectFile };

/**
 * The project folders the scan rules reach, in the order the walk meets them, each folder once
 * however many rules reach it, with no manifest read. `missing` is told the folder of each rule
 * whose folder is not there and that is not `optional`.
 */
function reachedBy(hub: string, scan: ScanRule[], missing: (base: string) => void): Reached[] {
    const found: Reached[] = [];
    const reached = new Set<string>();

    for (const rule of scan) {
        const base = join(hub, rule.dir);
        if (!isDir(base)) {
            if (rule.optional !== true) missing(base);
            continue;
        }

        const paths: string[][] = projectFileIn(base) !== null ? [[]] : nestedProjects(base);
        for (const segments of paths) {
            const dir = join(base, ...segments);
            const place = placeOf(dir);
            if (reached.has(place)) continue;
            reached.add(place);
            const placed = projectFileIn(dir);
            if (placed !== null) found.push({ dir, segments, placed });
        }
    }
    return found;
}

/** The project folders the scan rules reach, read in the order the walk meets them. */
function scanned(
    hub: string,
    scan: ScanRule[],
    catalog: TextCatalog,
    findings: Finding[]
): Found[] {
    const missing = (base: string): void => {
        findings.push({
            file: base,
            key: 'scan',
            message: findingText(catalog, 'findings.manifests.scan_missing')
        });
    };
    return reachedBy(hub, scan, missing).map(({ dir, segments, placed }) => {
        const category = segments.length > 1 ? segments[0] : undefined;
        const place = { folder: hubPath(hub, dir), id: basename(dir), dir, category };
        return foundAt(placed, place, catalog);
    });
}

/**
 * The real paths of the manifests the scan rules of a hub reach, with no manifest read: the files a
 * reader of the workspace's folders compares a folder's manifest with, since a folder whose
 * manifest a hub's scan reads is that hub's project and is not read a second time.
 */
export function scannedFiles(hub: string, scan: ScanRule[]): Set<string> {
    const reached = reachedBy(hub, scan, () => undefined);
    return new Set(reached.map((one) => placeOf(one.placed.file)));
}

/**
 * Read every project manifest the scan rules reach.
 *
 * Each rule's `dir` is walked to any depth. A folder that is a project (it holds `project.yml` at
 * its top or `.oculus/project.yml`, and is no hub) is not walked further, the scan folder itself
 * included; a folder that is none is a filing folder, so no record is made for it. The first folder
 * under the scan folder is the project's `category` when the project lies deeper than one level. A
 * manifest reached by two rules is read once. A manifest that does not parse, or parses to
 * something other than a map, is a finding and no record. A missing scan directory is a finding
 * unless the rule is `optional`. A project whose id an earlier one holds is a finding and is not
 * read; the scan folders count in the order listed and the folders of one in name order. A folder
 * that is a clone of another project is no project (see `settle`). Records come back sorted by
 * `folder`, so two runs on one tree agree byte for byte.
 */
export function readManifests(
    hub: string,
    scan: ScanRule[],
    catalog: TextCatalog,
    claim?: (id: string, file: string) => boolean
): { manifests: RawManifest[]; findings: Finding[] } {
    const findings: Finding[] = [];
    const found = scanned(hub, scan, catalog, findings);
    const manifests = settle(found, claim ?? claimer(catalog, findings), catalog, findings);
    manifests.sort((a, b) => (a.folder < b.folder ? -1 : a.folder > b.folder ? 1 : 0));
    findings.sort((a, b) => `${a.file}\0${a.key}`.localeCompare(`${b.file}\0${b.key}`));
    return { manifests, findings };
}

/**
 * The project folders of the workspace the roots name, one per root that is a project: a root
 * without a manifest, or whose directory is not on this machine, is no project and no finding, and
 * a root whose manifest's real path is in `read` (a manifest the scan of the hub reads) is the
 * scan's project, which is read once, so it is left out here with no finding. The record is a scan
 * project's, read from the same kind of file under the same checks, with the root's key for its id
 * and `workspaceFolder` naming the root and its folder.
 */
function workspaceFound(
    roots: RepositoryRoot[],
    catalog: TextCatalog,
    read: ReadonlySet<string>
): Found[] {
    const found: Found[] = [];
    for (const root of roots) {
        const placed = projectFileIn(root.dir);
        if (placed === null || read.has(placeOf(placed.file))) continue;
        found.push(
            foundAt(placed, { folder: root.dir, id: root.key, dir: root.dir, root }, catalog)
        );
    }
    return found;
}

/**
 * Every project manifest of the primary hub: the scan folders' and those of the project folders of
 * the workspace. It is the one reader of the primary hub's projects, so the build and every reader
 * that finds a project to read or write it see the same set. A project folder whose manifest is, by
 * its real path, one the scan reads is the scan's project: one record, the scan's, and no finding,
 * wherever the folder lies. The scan folders are read before the project folders, so a project
 * folder whose name a scan project holds is the one that is not read; a project folder that is a
 * clone of a project of the scan folders is not read either, and raises no finding (see `settle`).
 */
export function readHubManifests(
    hub: string,
    scan: ScanRule[],
    roots: RepositoryRoot[],
    catalog: TextCatalog
): { manifests: RawManifest[]; findings: Finding[] } {
    const findings: Finding[] = [];
    const fromScan = scanned(hub, scan, catalog, findings);
    const read = new Set(fromScan.map((one) => placeOf(one.file)));
    const found = [...fromScan, ...workspaceFound(roots, catalog, read)];
    const manifests = settle(found, claimer(catalog, findings), catalog, findings);
    const inScan = manifests.filter((one) => one.workspaceFolder === undefined);
    inScan.sort((a, b) => (a.folder < b.folder ? -1 : a.folder > b.folder ? 1 : 0));
    const inWorkspace = manifests.filter((one) => one.workspaceFolder !== undefined);
    findings.sort((a, b) => `${a.file}\0${a.key}`.localeCompare(`${b.file}\0${b.key}`));
    return { manifests: [...inScan, ...inWorkspace], findings };
}

/**
 * The absolute folder of a manifest's project: the workspace folder the project is read from, or
 * the hub-relative `folder` under the hub.
 */
export function manifestDir(
    hub: string,
    manifest: Pick<RawManifest, 'folder' | 'workspaceFolder'>
): string {
    return manifest.workspaceFolder?.dir ?? join(hub, manifest.folder);
}
