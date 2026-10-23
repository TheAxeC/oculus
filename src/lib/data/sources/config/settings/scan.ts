// Layer 1, data. The values of a hub's sources settings that place its projects and pictures:
// `scan:`, the folders a project is looked for in, `new_project_dir:`, the folder a new project of
// each tier is made in, and `wallpaper_dir:` and `memories_dir:`, the picture folders. Each is read
// here and checked, every finding filed on the sources file the value was read from; the build
// (data/index.ts) reads the values and gathers the findings.

import { z } from 'zod';
import { isMap } from '../../../helpers/guards.ts';
import { hubFolderIn } from '../../../helpers/files/paths.ts';
import { findingText, type TextCatalog } from '../../../helpers/finding-text.ts';
import { TIERS, folderOf, inScan } from '../../../helpers/hub-names.ts';
import { readOr, rowsShape } from '../../../shapes/shapes.ts';
import type { Finding, ScanRule, Tier } from '../../../model/index.ts';

/** The keys a `scan:` entry takes. */
const SCAN_KEYS = ['dir', 'optional'];

/**
 * One `scan:` rule: a map with a `dir` that is a text, carrying its `optional` mark when it is
 * true. Any other key is not read; `scanFindings` names it.
 */
const scanRuleShape = z
    .object({
        dir: z.string(),
        optional: z.literal(true).optional().catch(undefined)
    })
    .transform((item): ScanRule => {
        const rule: ScanRule = { dir: item.dir };
        if (item.optional !== undefined) rule.optional = item.optional;
        return rule;
    }) satisfies z.ZodType<ScanRule>;

/** The `scan:` list, the rules that name a directory. */
const scanRulesShape = rowsShape(scanRuleShape);

/**
 * The `scan:` rules of the layout config. A rule with no `dir` names no directory and is dropped.
 */
export function scanRules(value: unknown): ScanRule[] {
    return readOr(scanRulesShape, value, []);
}

/**
 * What is wrong with the `scan:` value, each finding filed on `file`, the sources file that holds
 * it: a value that is no list, an entry that is no map or names no `dir`, and every key of an entry
 * besides `dir` and `optional`, which the entry is read without.
 */
export function scanFindings(value: unknown, file: string, text: TextCatalog): Finding[] {
    const found: Finding[] = [];
    const raise = (id: string, ...args: (string | number)[]): void => {
        found.push({ file, key: 'scan', message: findingText(text, id, ...args) });
    };
    if (value === undefined) return found;
    if (!Array.isArray(value)) {
        raise('findings.manifests.scan_not_a_list');
        return found;
    }
    for (const [index, entry] of value.entries()) {
        if (!isMap(entry) || typeof entry.dir !== 'string') {
            raise('findings.manifests.scan_no_dir', index + 1);
            continue;
        }
        for (const key of Object.keys(entry)) {
            if (!SCAN_KEYS.includes(key)) raise('findings.manifests.scan_key', entry.dir, key);
        }
    }
    return found;
}

/** What is wrong with a picture folder key of a hub: no text, or a folder outside the hub. */
export function pictureFolderFindings(
    merged: Record<string, unknown>,
    hub: string,
    key: string,
    fallback: string,
    file: string,
    text: TextCatalog
): Finding[] {
    const { problem } = hubFolderIn(hub, merged[key], fallback);
    if (problem === null) return [];
    const message =
        problem === 'text'
            ? findingText(text, 'findings.manifests.picture_folder_text', key, fallback)
            : findingText(
                  text,
                  'findings.manifests.picture_folder_outside',
                  key,
                  String(merged[key]),
                  fallback
              );
    return [{ file, key, message }];
}

/**
 * The `new_project_dir:` value read as the folder a new project of each tier is made in, with a
 * finding naming the key of every entry that is not used: a value that is no map, a key that is not
 * one of the five tiers, a value that is no folder text, and a folder outside every scan folder.
 */
export function newProjectDirs(
    value: unknown,
    scan: ScanRule[],
    file: string,
    text: TextCatalog
): { dirs: Partial<Record<Tier, string>>; findings: Finding[] } {
    const dirs: Partial<Record<Tier, string>> = {};
    const findings: Finding[] = [];
    const raise = (id: string, ...args: (string | number)[]): void => {
        findings.push({ file, key: 'new_project_dir', message: findingText(text, id, ...args) });
    };
    if (value === undefined) return { dirs, findings };
    if (!isMap(value)) {
        raise('findings.manifests.new_project_dir_not_a_map');
        return { dirs, findings };
    }
    for (const [key, folder] of Object.entries(value)) {
        const tier = TIERS.find((one) => one === key);
        if (tier === undefined) {
            raise('findings.manifests.new_project_dir_tier', key, TIERS.join(', '));
        } else if (typeof folder !== 'string' || folderOf(folder) === '') {
            raise('findings.manifests.new_project_dir_folder', key);
        } else if (
            !inScan(
                folder,
                scan.map((rule) => rule.dir)
            )
        ) {
            raise('findings.manifests.new_project_dir_outside', key, folder);
        } else {
            dirs[tier] = folderOf(folder);
        }
    }
    return { dirs, findings };
}
