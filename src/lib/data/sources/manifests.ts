// Layer 1, data. Walks the scan tiers and reads every project.yml into a raw record with provenance.
// Server side only: it reads the filesystem and no client module may import it.
// It validates nothing and resolves nothing. Every failure is a Finding; nothing here throws, so one
// unparseable manifest costs its own record and no more.

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { parse } from 'yaml';
import type { Finding, RawManifest, ScanRule, Tier } from '../model.ts';

/** Folder names the walk never descends into: a project's own code and attic hold no manifests. */
const NEVER_DESCEND = ['code', 'attic'];

/** The one filename a scan tier's folder is read for. */
export const MANIFEST = 'project.yml';

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

/** Read and parse one project.yml. A map is returned; anything else is a finding and null. */
function readManifest(file: string, findings: Finding[]): Record<string, unknown> | null {
    let parsed: unknown;
    try {
        parsed = parse(readFileSync(file, 'utf8'));
    } catch (error) {
        const message = error instanceof Error ? error.message.split('\n')[0] : String(error);
        findings.push({ file, key: '', message: `does not parse: ${message}` });
        return null;
    }
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        findings.push({ file, key: '', message: 'is not a map of keys' });
        return null;
    }
    return parsed as Record<string, unknown>;
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
    findings: Finding[]
): RawManifest {
    const file = join(folderPath, MANIFEST);
    const folder = hubPath(hub, folderPath);
    const id = folder.split('/').pop() ?? folder;

    if (data.id !== undefined && data.id !== id) {
        findings.push({
            file,
            key: 'id',
            message: `id ${JSON.stringify(data.id)} is not the folder name ${id}`
        });
    }

    let type: string | undefined;
    if (ruleType !== undefined) {
        type = ruleType;
        if (data.type !== undefined && data.type !== ruleType) {
            findings.push({
                file,
                key: 'type',
                message: `type ${JSON.stringify(data.type)} is not the tier's ${ruleType}`
            });
        }
    } else if (typeof data.type === 'string') {
        type = data.type;
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
 * A flat rule reads `<hub>/<dir>/<name>/project.yml` and gives each manifest the rule's `type`.
 * A nested rule walks `<hub>/<dir>` to any depth, takes `type` from the manifest, and records the
 * first folder under the tier as `category`. A flat-tier folder without a project.yml is a ghost;
 * a manifest that does not parse, or parses to something other than a map, is a finding and no
 * record. A missing scan directory is a finding unless the rule is `optional`, which is how a tier
 * the hub need not have costs nothing until its folder exists. Records come back sorted by `folder`,
 * so two runs on one tree agree byte for byte.
 */
export function readManifests(
    hub: string,
    scan: ScanRule[]
): { manifests: RawManifest[]; findings: Finding[] } {
    const manifests: RawManifest[] = [];
    const findings: Finding[] = [];

    for (const rule of scan) {
        const base = join(hub, rule.dir);
        const tier = (rule.dir.split('/').pop() ?? rule.dir) as Tier;
        if (!isDir(base)) {
            if (rule.optional !== true) {
                findings.push({
                    file: base,
                    key: 'scan',
                    message: 'scan directory does not exist'
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
            const data = readManifest(join(folderPath, MANIFEST), findings);
            if (data === null) continue;
            const category = rule.nested && segments.length > 1 ? segments[0] : undefined;
            manifests.push(record(hub, folderPath, data, tier, category, rule.type, findings));
        }
    }

    manifests.sort((a, b) => (a.folder < b.folder ? -1 : a.folder > b.folder ? 1 : 0));
    findings.sort((a, b) => `${a.file}\0${a.key}`.localeCompare(`${b.file}\0${b.key}`));
    return { manifests, findings };
}
