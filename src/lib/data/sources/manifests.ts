// Layer 1, data. Walks the scan tiers and reads every project.yml into a raw record with
// provenance. Server side only: it reads the filesystem and no client module may import it. It
// validates nothing and resolves nothing. Every failure is a Finding; nothing here throws, so one
// unparseable manifest costs its own record and no more.

import { existsSync, lstatSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { findingText, type TextCatalog } from '../helpers/finding-text.ts';
import type {
    Finding,
    RawManifest,
    RawPersonal,
    RepositoryRoot,
    ScanRule,
    Tier
} from '../model/index.ts';
import { MANIFEST, ROOT_FOLDER, isSideTier } from '../helpers/hub-names.ts';
import { optionalText } from '../shapes/shapes.ts';
import { DECK_FILE, PROJECT_DECK } from './deck/read.ts';
import { projectDocs } from './docs.ts';
import { errorLine, readYamlMap } from './yaml-file.ts';

/** Folder names the walk never descends into: a project's own code and attic hold no manifests. */
const NEVER_DESCEND = ['code', 'attic'];

/**
 * The most a side project's manifest may hold. Its sixteen keys are a few lines each, so a larger
 * file is not one; the bound keeps a mistaken path (a log, a dump) from being read whole on every
 * rebuild.
 */
export const PERSONAL_MAX_BYTES = 64 * 1024;

/** Remove the filing prefix from a folder's display title. */
function stripPrefix(name: string): string {
    return name.replace(/^\[[^\]]+\]\s*/, '');
}

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

/**
 * What a side project's folder holds besides its manifest: its fixed documents and its deck. `at`
 * is the folder's path against the Files root that holds it, empty for a repository's top.
 */
function folderHolds(dir: string, at: string): Pick<RawPersonal, 'dir' | 'docs' | 'deck'> {
    const deck = at === '' ? PROJECT_DECK : `${at}/${PROJECT_DECK}`;
    const held = existsSync(join(dir, PROJECT_DECK, DECK_FILE));
    return { dir, docs: projectDocs(dir), ...(held ? { deck } : {}) };
}

function hasManifest(dir: string): boolean {
    try {
        return statSync(join(dir, MANIFEST)).isFile();
    } catch {
        return false;
    }
}

/** Visible subdirectories in name order, skipping the ones no manifest ever sits under. */
function subdirs(dir: string): string[] {
    let entries;
    try {
        entries = readdirSync(dir, { withFileTypes: true });
    } catch {
        return [];
    }
    return entries
        .filter(
            (e) => e.isDirectory() && !e.name.startsWith('.') && !NEVER_DESCEND.includes(e.name)
        )
        .map((e) => e.name)
        .sort();
}

/**
 * Every folder under `base` that holds a project.yml, at any depth, as its path segments from
 * `base`. The walk stops at a project: nothing inside one is a project of its own, which is what
 * keeps a `code/project.yml` decoy out. Free-form filing folders in between carry no meaning
 * beyond the first, which is the category.
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

/**
 * Build one record of the project `id` whose folder is `folder` (hub-relative, or a repository's
 * absolute path) and whose manifest is `file`. Provenance wins over the manifest for `id`, and for
 * `type` on a flat tier; the manifest's own values are kept (`manifestId`, `typeWritten`) or
 * reported (`id`), never silently replaced. A flat tier's `type` that the manifest writes
 * differently is kept as `typeWritten`, which the Audit lists beside the tier.
 */
function record(
    place: { file: string; folder: string; id: string },
    data: Record<string, unknown>,
    tier: Tier,
    category: string | undefined,
    ruleType: string | undefined,
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

    const written = optionalText(data.type);
    const type = ruleType ?? written;

    const built: RawManifest = { ...data, file, folder, id, tier, ghost: false };
    const changed = mtimeOf(file);
    if (changed !== undefined) built.fileMtime = changed;
    if (category !== undefined) built.category = category;
    if (type !== undefined) built.type = type;
    if (data.id !== undefined) built.manifestId = data.id;
    delete built.typeWritten;
    if (ruleType !== undefined && written !== undefined && written !== '' && written !== ruleType) {
        built.typeWritten = written;
    }
    return built;
}

/** A flat-tier folder with no manifest, with only its filesystem provenance and scan rule. */
function ghost(
    hub: string,
    folderPath: string,
    tier: Tier,
    ruleType: string | undefined
): RawManifest {
    const folder = hubPath(hub, folderPath);
    const id = folder.split('/').pop() ?? folder;
    return {
        file: join(folderPath, MANIFEST),
        folder,
        id,
        tier,
        ghost: true,
        title: stripPrefix(id),
        ...(ruleType === undefined ? {} : { type: ruleType })
    };
}

/**
 * Read every project.yml the scan rules reach.
 *
 * A flat rule reads `<hub>/<dir>/<name>/project.yml` and gives each manifest the rule's `type`. A
 * nested rule walks `<hub>/<dir>` to any depth, takes `type` from the manifest, and records the
 * first folder under the tier as `category`. A flat-tier folder without a project.yml is a ghost; a
 * manifest that does not parse, or parses to something other than a map, is a finding and no
 * record. A missing scan directory is a finding unless the rule is `optional`, which is how a tier
 * the hub need not have costs nothing until its folder exists. Records come back sorted by
 * `folder`, so two runs on one tree agree byte for byte.
 */
export function readManifests(
    hub: string,
    scan: ScanRule[],
    catalog: TextCatalog
): { manifests: RawManifest[]; findings: Finding[] } {
    const manifests: RawManifest[] = [];
    const findings: Finding[] = [];

    for (const rule of scan) {
        if (isSideTier(rule)) continue;
        const base = join(hub, rule.dir);
        const tier = (rule.dir.split('/').pop() ?? rule.dir) as Tier;
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

        const paths: string[][] = rule.nested
            ? nestedProjects(base)
            : subdirs(base).map((name) => [name]);

        for (const segments of paths) {
            const folderPath = join(base, ...segments);
            if (!hasManifest(folderPath)) {
                manifests.push(ghost(hub, folderPath, tier, rule.type));
                continue;
            }
            const data = readYamlMap(join(folderPath, MANIFEST), catalog, findings, (error) =>
                findingText(catalog, 'findings.file.does_not_parse', errorLine(error))
            );
            if (data === null) continue;
            const category = rule.nested && segments.length > 1 ? segments[0] : undefined;
            const folder = hubPath(hub, folderPath);
            const place = {
                file: join(folderPath, MANIFEST),
                folder,
                id: folder.split('/').pop() ?? folder
            };
            manifests.push(record(place, data, tier, category, rule.type, catalog, findings));
        }
    }

    manifests.sort((a, b) => (a.folder < b.folder ? -1 : a.folder > b.folder ? 1 : 0));
    findings.sort((a, b) => `${a.file}\0${a.key}`.localeCompare(`${b.file}\0${b.key}`));
    return { manifests, findings };
}

/**
 * The scan rule a repository with a research `tier` is read under, or the finding saying why none
 * is, on the entry (`entry`, with the root's key) or on the manifest's `type`. Every rule is of the
 * repository's tier word. Under `projects` the rule is the flat one whose `type` the manifest
 * names, and under `coauthor` and `archive` it is the rule of that word, whose manifests carry
 * their own `type`.
 */
function repositoryRule(
    root: RepositoryRoot & { tier: string },
    rules: ScanRule[],
    written: string | undefined,
    catalog: TextCatalog
): { rule: ScanRule } | { entry: boolean; key: string; message: string } {
    if (rules.length === 0) {
        const message = findingText(
            catalog,
            'findings.manifests.repository_tier_no_rule',
            root.tier
        );
        return { entry: true, key: root.key, message };
    }
    if (root.tier !== 'projects') return { rule: rules[0] };
    if (written === undefined || written === '') {
        const message = findingText(catalog, 'findings.manifests.repository_type_missing');
        return { entry: false, key: 'type', message };
    }
    const rule = rules.find((one) => one.nested !== true && one.type === written);
    if (rule !== undefined) return { rule };
    const message = findingText(
        catalog,
        'findings.manifests.repository_type_unknown',
        written,
        root.tier
    );
    return { entry: false, key: 'type', message };
}

/**
 * The research projects of the repositories whose `roots:` entry names a research tier, one per
 * root whose `.oculus/project.yml` is there. The record is a scan project's, read from the same
 * kind of file under the same checks as a side project's, with the root's key for its id, the
 * tier and type of the scan rule (`repositoryRule`) and `repository` naming the root and its
 * folder. A repository that cannot be read in its tier (a key a scan project has, a tier word no
 * rule carries, a type no rule takes) is a finding and a side project, so it never vanishes, and
 * `side` holds the roots left to the side-project reader. A root with a tier and no manifest is a
 * finding and nothing more. A finding about the entry is filed on `rootsFile`, the file the
 * `roots:` list is written in and the file `readRoots` files its entry findings on; a finding about
 * a manifest that exists is filed on the manifest.
 */
function repositoryManifests(
    roots: RepositoryRoot[],
    scan: ScanRule[],
    taken: ReadonlySet<string>,
    catalog: TextCatalog,
    rootsFile: string
): { manifests: RawManifest[]; findings: Finding[]; side: RepositoryRoot[] } {
    const manifests: RawManifest[] = [];
    const findings: Finding[] = [];
    const side: RepositoryRoot[] = [];
    for (const root of roots) {
        if (root.tier === undefined) {
            side.push(root);
            continue;
        }
        const file = join(root.dir, ROOT_FOLDER, MANIFEST);
        const asSide = (on: string, key: string, message: string): void => {
            findings.push({ file: on, key, message });
            side.push({ key: root.key, dir: root.dir });
        };
        if (taken.has(root.key)) {
            const message = findingText(catalog, 'findings.manifests.repository_id_taken');
            asSide(rootsFile, root.key, message);
            continue;
        }
        const read = readPersonalFile(file, catalog, findings);
        if (read.kind === 'absent') {
            const message = findingText(catalog, 'findings.manifests.repository_no_manifest');
            findings.push({ file: rootsFile, key: root.key, message });
        }
        if (read.kind !== 'map') continue;
        const rules = scan.filter((one) => !isSideTier(one) && one.tier === root.tier);
        const written = optionalText(read.data.type);
        const found = repositoryRule({ ...root, tier: root.tier }, rules, written, catalog);
        if ('rule' in found) {
            const { rule } = found;
            const tier = (rule.dir.split('/').pop() ?? rule.dir) as Tier;
            const place = { file, folder: root.dir, id: root.key };
            const project = record(place, read.data, tier, undefined, rule.type, catalog, findings);
            manifests.push({ ...project, repository: { root: root.key, dir: root.dir } });
        } else {
            asSide(found.entry ? rootsFile : file, found.key, found.message);
        }
    }
    return { manifests, findings, side };
}

/**
 * Every research manifest of the first hub: the scan folders' (`readManifests`) and the
 * repositories' that `roots` name with a research tier (`repositoryManifests`). It is the one
 * reader of the first hub's research projects, so the build and every reader that finds a project
 * to read or write it see the same set. `side` are the roots the side-project reader is left,
 * which `readPersonal` takes. `rootsFile` is the file the entries are written in.
 */
export function readHubManifests(
    hub: string,
    scan: ScanRule[],
    roots: RepositoryRoot[],
    catalog: TextCatalog,
    rootsFile = ''
): { manifests: RawManifest[]; findings: Finding[]; side: RepositoryRoot[] } {
    const folders = readManifests(hub, scan, catalog);
    const taken = new Set(folders.manifests.map((one) => one.id));
    const repositories = repositoryManifests(roots, scan, taken, catalog, rootsFile);
    const findings = [...folders.findings, ...repositories.findings];
    findings.sort((a, b) => `${a.file}\0${a.key}`.localeCompare(`${b.file}\0${b.key}`));
    return {
        manifests: [...folders.manifests, ...repositories.manifests],
        findings,
        side: repositories.side
    };
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

/** What reading one side project's manifest file found. */
type PersonalFile =
    { kind: 'absent' } | { kind: 'unusable' } | { kind: 'map'; data: Record<string, unknown> };

/**
 * One side project's manifest. Only a regular file within the size bound is opened: a directory, a
 * symbolic link, a named pipe or a device is a finding and is never read, so a path that points
 * somewhere else, or at something that blocks, costs the card and nothing more. A file that is not
 * there is `absent`, and the caller decides whether that is a finding.
 */
function readPersonalFile(file: string, catalog: TextCatalog, findings: Finding[]): PersonalFile {
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
            message: findingText(catalog, 'findings.manifests.personal_not_file')
        });
        return { kind: 'unusable' };
    }
    if (stat.size > PERSONAL_MAX_BYTES) {
        findings.push({
            file,
            key: '',
            message: findingText(
                catalog,
                'findings.manifests.personal_too_large',
                PERSONAL_MAX_BYTES
            )
        });
        return { kind: 'unusable' };
    }
    const data = readYamlMap(file, catalog, findings, (error) =>
        findingText(catalog, 'findings.file.does_not_parse', errorLine(error))
    );
    return data === null ? { kind: 'unusable' } : { kind: 'map', data };
}

/** The side projects of the hub's side-projects tier, a folder each. */
function hubPersonal(
    hub: string,
    scan: ScanRule[],
    catalog: TextCatalog,
    personal: RawPersonal[],
    findings: Finding[]
): void {
    for (const rule of scan) {
        if (!isSideTier(rule)) continue;
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
        for (const name of subdirs(base)) {
            const folderPath = join(base, name);
            const file = join(folderPath, MANIFEST);
            const read = readPersonalFile(file, catalog, findings);
            if (read.kind === 'absent') {
                findings.push({
                    file,
                    key: '',
                    message: findingText(catalog, 'findings.manifests.personal_no_manifest')
                });
            } else if (read.kind === 'map') {
                personal.push({
                    source: { kind: 'hub', folder: hubPath(hub, folderPath) },
                    file,
                    data: read.data,
                    ...folderHolds(folderPath, hubPath(hub, folderPath))
                });
            }
        }
    }
}

/**
 * The side projects of the roots it is handed, one per root whose `.oculus/project.yml` is there,
 * in the order given. Which roots those are is decided before this runs (server/files/roots.ts,
 * repositoriesOf, and `readHubManifests`, which keeps the roots with a research tier apart): a
 * root that is not on this machine, has no `.oculus` folder or holds no manifest is not a side
 * project and not a finding.
 */
function rootPersonal(
    roots: RepositoryRoot[],
    catalog: TextCatalog,
    personal: RawPersonal[],
    findings: Finding[]
): void {
    for (const root of roots) {
        if (!isDir(join(root.dir, ROOT_FOLDER))) continue;
        const file = join(root.dir, ROOT_FOLDER, MANIFEST);
        const read = readPersonalFile(file, catalog, findings);
        if (read.kind === 'map') {
            personal.push({
                source: { kind: 'root', key: root.key, dir: root.dir },
                file,
                data: read.data,
                ...folderHolds(root.dir, '')
            });
        }
    }
}

/**
 * Read every side project: the folders of the hub's side-projects tier and the `.oculus` manifests
 * of the roots. Nothing here shares a code path with readManifests, so a side project is never a
 * research record. Each result is a raw manifest with where it came from, the absolute path of its
 * folder, which of the fixed project documents the folder holds and, when the folder holds
 * `present/present.yml`, the path of its deck. What its fields hold is checked and shaped by
 * snapshot/normalise-parts/personal.ts, and the Personal board, the project view, the editor, the
 * palette and the Focus ticker read the records that make.
 */
export function readPersonal(
    hub: string,
    scan: ScanRule[],
    roots: RepositoryRoot[],
    catalog: TextCatalog
): { personal: RawPersonal[]; findings: Finding[] } {
    const personal: RawPersonal[] = [];
    const findings: Finding[] = [];
    hubPersonal(hub, scan, catalog, personal, findings);
    rootPersonal(roots, catalog, personal, findings);
    findings.sort((a, b) => `${a.file}\0${a.key}`.localeCompare(`${b.file}\0${b.key}`));
    return { personal, findings };
}
