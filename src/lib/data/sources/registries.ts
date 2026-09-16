// Layer 1, data. Reads the seven registry files into raw entries with provenance.
// Server side only: it reads the filesystem and no client module may import it.
// It validates nothing and resolves nothing. Every failure is a Finding; nothing here throws, so a
// missing or broken registry costs its own entries and no more.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import type {
    Finding,
    RawRegistry,
    RawRegistryEntry,
    RegistryFiles,
    RegistryMeta,
    RegistryName
} from '../model.ts';

/** The seven hub-relative paths, one per registry; declared with the other types in model.ts. */
export type { RegistryFiles } from '../model.ts';

/** The paths on the hub today; a caller may pass its own. */
export const REGISTRY_FILES: RegistryFiles = {
    venues: 'registries/venues.yml',
    datasets: 'registries/data.yml',
    pillars: 'registries/pillars.yml',
    domains: 'registries/domains.yml',
    funding: 'funding/funding.yml',
    people: 'registries/people.yml',
    organisations: 'registries/organisations.yml'
};

/**
 * How each file names its entry list and its id field. The six registries keyed by `key` and the
 * venue registry keyed by `id` are what the files hold; funding's `key` is the cross-link anchor a
 * manifest names and its own schema marks it optional, so an entry without one is not a finding.
 */
const SHAPES: Record<RegistryName, { list: string; idField: string; idRequired: boolean }> = {
    venues: { list: 'entries', idField: 'id', idRequired: true },
    datasets: { list: 'datasets', idField: 'key', idRequired: true },
    pillars: { list: 'entries', idField: 'key', idRequired: true },
    domains: { list: 'entries', idField: 'key', idRequired: true },
    funding: { list: 'entries', idField: 'key', idRequired: false },
    people: { list: 'entries', idField: 'key', idRequired: true },
    organisations: { list: 'entries', idField: 'key', idRequired: true }
};

const NAMES: RegistryName[] = [
    'venues',
    'datasets',
    'pillars',
    'domains',
    'funding',
    'people',
    'organisations'
];

function empty(): RawRegistry {
    return { entries: [], meta: {} };
}

/** Read and parse one registry file. A map is returned; anything else is a finding and null. */
function readFile(file: string, findings: Finding[]): Record<string, unknown> | null {
    let text: string;
    try {
        text = readFileSync(file, 'utf8');
    } catch {
        findings.push({ file, key: '', message: 'registry file does not exist' });
        return null;
    }
    let parsed: unknown;
    try {
        parsed = parse(text);
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

/** One registry: its entries in file order with provenance, and every other top-level key as meta. */
function readRegistry(
    hub: string,
    name: RegistryName,
    relPath: string,
    findings: Finding[]
): RawRegistry {
    const shape = SHAPES[name];
    const file = join(hub, relPath);
    const data = readFile(file, findings);
    if (data === null) return empty();

    const meta: RegistryMeta = {};
    for (const [key, value] of Object.entries(data)) {
        if (key !== shape.list) meta[key] = value;
    }

    const list = data[shape.list];
    if (!Array.isArray(list)) {
        const had = shape.list in data ? 'is not a list' : 'is missing';
        findings.push({ file, key: shape.list, message: `entry list ${shape.list} ${had}` });
        return { entries: [], meta };
    }

    const entries: RawRegistryEntry[] = [];
    list.forEach((item: unknown, index: number) => {
        const where = `${shape.list}[${index}]`;
        if (typeof item !== 'object' || item === null || Array.isArray(item)) {
            findings.push({ file, key: where, message: 'entry is not a map of keys' });
            return;
        }
        const raw = item as Record<string, unknown>;
        const id = raw[shape.idField];
        let key = '';
        if (typeof id === 'string' && id.length > 0) key = id;
        else if (shape.idRequired) {
            findings.push({ file, key: where, message: `entry has no string ${shape.idField}` });
        }
        entries.push({ ...raw, registry: name, key, file });
    });

    return { entries, meta };
}

/**
 * Read the seven registries. Each returns its entries and the file's other top-level keys as `meta`,
 * both untouched apart from the `registry`, `key` and `file` provenance added to every entry. A file
 * that is missing, does not parse, is not a map, or has no entry list gives an empty list and one
 * finding; nothing here throws and no entry is repaired.
 */
export function readRegistries(
    hub: string,
    files: RegistryFiles = REGISTRY_FILES
): Record<RegistryName, RawRegistry> & { findings: Finding[] } {
    const findings: Finding[] = [];
    const out = {} as Record<RegistryName, RawRegistry>;
    for (const name of NAMES) {
        out[name] = readRegistry(hub, name, files[name], findings);
    }
    return { ...out, findings };
}
