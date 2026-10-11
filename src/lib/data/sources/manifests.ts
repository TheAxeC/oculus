// Layer 1, data. Walks the scan folders and the repositories and reads every project.yml into a raw
// record with provenance. Server side only: it reads the filesystem and no client module may import
// it. It validates nothing and resolves nothing. Every failure is a Finding; nothing here throws,
// so one unparseable manifest costs its own record and no more.
//
// One reader serves every project: a project of a scan folder and a project of a repository are the
// same record, and the manifest's own `tier` and `type` say which board and which stage it is on.
// The folder a project lies in decides neither.

import { lstatSync, readdirSync, realpathSync, statSync } from 'node:fs';
import { basename, join, relative, sep } from 'node:path';
import { findingText, type TextCatalog } from '../helpers/finding-text.ts';
import type { Finding, RawManifest, RepositoryRoot, ScanRule } from '../model/index.ts';
import { MANIFEST, ROOT_FOLDER, entersFolder } from '../helpers/hub-names.ts';
import { errorLine, readYamlMap } from './yaml-file.ts';

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

function hasManifest(dir: string): boolean {
    try {
        return statSync(join(dir, MANIFEST)).isFile();
    } catch {
        return false;
    }
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
 * Every folder under `base` that holds a project.yml, at any depth, as its path segments from
 * `base`. The walk stops at a project: nothing inside one is a project of its own, which keeps a
 * `code/project.yml` out. A folder with no manifest is a filing folder and is walked through; the
 * first of its segments above a project is the project's category.
 */
function nestedProjects(base: string, segments: string[] = []): string[][] {
    const found: string[][] = [];
    for (const name of subdirs(join(base, ...segments))) {
        const path = [...segments, name];
        if (hasManifest(join(base, ...path))) found.push(path);
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
 * Build one record of the project `id` whose folder is `folder` (hub-relative, or a repository's
 * absolute path) and whose manifest is `file`. Provenance wins over the manifest for `id`; the
 * manifest's own value is kept (`manifestId`) or reported, never silently replaced. Every other
 * key, `tier` and `type` among them, is the manifest's as written.
 */
function record(
    place: { file: string; folder: string; id: string },
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
 * Read every project.yml the scan rules reach.
 *
 * Each rule's `dir` is walked to any depth. A folder holding a project.yml is a project and is not
 * walked further, the scan folder itself included; a folder with none is a filing folder, so no
 * record is made for it. The first folder under the scan folder is the project's `category` when
 * the project lies deeper than one level. A manifest reached by two rules is read once. A manifest
 * that does not parse, or parses to something other than a map, is a finding and no record. A
 * missing scan directory is a finding unless the rule is `optional`. A project whose id an earlier
 * one holds is a finding and is not read; the scan folders count in the order listed and the
 * folders of one in name order. Records come back sorted by `folder`, so two runs on one tree agree
 * byte for byte.
 */
export function readManifests(
    hub: string,
    scan: ScanRule[],
    catalog: TextCatalog,
    claim?: (id: string, file: string) => boolean
): { manifests: RawManifest[]; findings: Finding[] } {
    const manifests: RawManifest[] = [];
    const findings: Finding[] = [];
    const take = claim ?? claimer(catalog, findings);
    const reached = new Set<string>();

    for (const rule of scan) {
        const base = join(hub, rule.dir);
        if (!isDir(base)) {
            if (rule.optional !== true) {
                findings.push({
                    file: base,
                    key: 'scan',
                    message: findingText(catalog, 'findings.manifests.scan_missing')
                });
            }
            continue;
        }

        const paths: string[][] = hasManifest(base) ? [[]] : nestedProjects(base);
        for (const segments of paths) {
            const folderPath = join(base, ...segments);
            const place = placeOf(folderPath);
            if (reached.has(place)) continue;
            reached.add(place);
            const file = join(folderPath, MANIFEST);
            const read = readManifestFile(file, catalog, findings);
            if (read.kind !== 'map') continue;
            const folder = hubPath(hub, folderPath);
            const id = basename(folderPath);
            if (!take(id, file)) continue;
            const category = segments.length > 1 ? segments[0] : undefined;
            manifests.push(record({ file, folder, id }, read.data, category, catalog, findings));
        }
    }

    manifests.sort((a, b) => (a.folder < b.folder ? -1 : a.folder > b.folder ? 1 : 0));
    findings.sort((a, b) => `${a.file}\0${a.key}`.localeCompare(`${b.file}\0${b.key}`));
    return { manifests, findings };
}

/**
 * The projects of the repositories the roots name, one per root whose `.oculus/project.yml` is
 * there: a root without one, or whose directory is not on this machine, is no project and no
 * finding. The record is a scan project's, read from the same kind of file under the same checks,
 * with the root's key for its id and `repository` naming the root and its folder.
 */
function repositoryManifests(
    roots: RepositoryRoot[],
    catalog: TextCatalog,
    claim: (id: string, file: string) => boolean,
    findings: Finding[]
): RawManifest[] {
    const manifests: RawManifest[] = [];
    for (const root of roots) {
        const file = join(root.dir, ROOT_FOLDER, MANIFEST);
        const read = readManifestFile(file, catalog, findings);
        if (read.kind !== 'map') continue;
        if (!claim(root.key, file)) continue;
        const place = { file, folder: root.dir, id: root.key };
        const project = record(place, read.data, undefined, catalog, findings);
        manifests.push({ ...project, repository: { root: root.key, dir: root.dir } });
    }
    return manifests;
}

/**
 * Every project manifest of the first hub: the scan folders' (`readManifests`) and the
 * repositories' that `roots` name (`repositoryManifests`). It is the one reader of the first hub's
 * projects, so the build and every reader that finds a project to read or write it see the same
 * set. The scan folders are read before the roots, so a root whose key a scan project holds is the
 * one that is not read.
 */
export function readHubManifests(
    hub: string,
    scan: ScanRule[],
    roots: RepositoryRoot[],
    catalog: TextCatalog
): { manifests: RawManifest[]; findings: Finding[] } {
    const findings: Finding[] = [];
    const claim = claimer(catalog, findings);
    const folders = readManifests(hub, scan, catalog, claim);
    const repositories = repositoryManifests(roots, catalog, claim, findings);
    findings.push(...folders.findings);
    findings.sort((a, b) => `${a.file}\0${a.key}`.localeCompare(`${b.file}\0${b.key}`));
    return { manifests: [...folders.manifests, ...repositories], findings };
}

/**
 * The absolute folder of a manifest's project: the repository the project is read from, or the
 * hub-relative `folder` under the hub.
 */
export function manifestDir(
    hub: string,
    manifest: Pick<RawManifest, 'folder' | 'repository'>
): string {
    return manifest.repository?.dir ?? join(hub, manifest.folder);
}
