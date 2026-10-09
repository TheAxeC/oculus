// Layer 1, data. Walks the scan tiers and reads every project.yml into a raw record with
// provenance. Server side only: it reads the filesystem and no client module may import it. It
// validates nothing and resolves nothing. Every failure is a Finding; nothing here throws, so one
// unparseable manifest costs its own record and no more.

import { lstatSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { findingText, type TextCatalog } from '../helpers/finding-text.ts';
import type {
    Finding,
    PersonalRoot,
    RawManifest,
    RawPersonal,
    ScanRule,
    Tier
} from '../model/index.ts';
import { MANIFEST, ROOT_FOLDER, isSideTier } from '../helpers/hub-names.ts';
import { optionalText } from '../shapes/shapes.ts';
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
 * Build one record. Provenance wins over the manifest for `id`, and for `type` on a flat tier;
 * the manifest's own values are kept (`manifestId`) or reported (`type`), never silently replaced.
 */
function record(
    hub: string,
    folderPath: string,
    data: Record<string, unknown>,
    tier: Tier,
    category: string | undefined,
    ruleType: string | undefined,
    catalog: TextCatalog,
    findings: Finding[]
): RawManifest {
    const file = join(folderPath, MANIFEST);
    const folder = hubPath(hub, folderPath);
    const id = folder.split('/').pop() ?? folder;

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

    let type: string | undefined;
    if (ruleType !== undefined) {
        type = ruleType;
        if (data.type !== undefined && data.type !== ruleType) {
            findings.push({
                file,
                key: 'type',
                message: findingText(
                    catalog,
                    'findings.manifests.type_not_tier',
                    JSON.stringify(data.type),
                    ruleType
                )
            });
        }
    } else {
        type = optionalText(data.type);
    }

    const built: RawManifest = { ...data, file, folder, id, tier, ghost: false };
    const written = mtimeOf(file);
    if (written !== undefined) built.fileMtime = written;
    if (category !== undefined) built.category = category;
    if (type !== undefined) built.type = type;
    if (data.id !== undefined) built.manifestId = data.id;
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
            manifests.push(
                record(hub, folderPath, data, tier, category, rule.type, catalog, findings)
            );
        }
    }

    manifests.sort((a, b) => (a.folder < b.folder ? -1 : a.folder > b.folder ? 1 : 0));
    findings.sort((a, b) => `${a.file}\0${a.key}`.localeCompare(`${b.file}\0${b.key}`));
    return { manifests, findings };
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
                    data: read.data
                });
            }
        }
    }
}

/**
 * The side projects of the roots it is handed, one per root whose `.oculus/project.yml` is there,
 * in the order given. Which roots those are is decided before this runs (server/root/watch
 * portfolio.ts, personalRoots): a root that is not on this machine, has no `.oculus` folder or
 * holds no manifest is not a side project and not a finding.
 */
function rootPersonal(
    roots: PersonalRoot[],
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
                data: read.data
            });
        }
    }
}

/**
 * Read every side project: the folders of the hub's side-projects tier and the `.oculus` manifests
 * of the roots. Nothing here shares a code path with readManifests, so a side project is never a
 * research record. Each result is a raw manifest with where it came from; what its fields hold is
 * checked and shaped by snapshot/normalise-personal.ts, and the Personal board and the Focus ticker
 * read the records that make.
 */
export function readPersonal(
    hub: string,
    scan: ScanRule[],
    roots: PersonalRoot[],
    catalog: TextCatalog
): { personal: RawPersonal[]; findings: Finding[] } {
    const personal: RawPersonal[] = [];
    const findings: Finding[] = [];
    hubPersonal(hub, scan, catalog, personal, findings);
    rootPersonal(roots, catalog, personal, findings);
    findings.sort((a, b) => `${a.file}\0${a.key}`.localeCompare(`${b.file}\0${b.key}`));
    return { personal, findings };
}
