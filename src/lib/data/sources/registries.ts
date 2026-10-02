// Layer 1, data. Reads the eight registry files into raw entries with provenance. Server side only:
// it reads the filesystem and no client module may import it. It validates nothing and resolves
// nothing. Every failure is a Finding; nothing here throws, so a missing or broken registry costs
// its own entries and no more.

import { join } from 'node:path';
import { findingText, type TextCatalog } from '../helpers/finding-text.ts';
import { filledText, itemsShape, mapShape, readAs } from '../shapes/shapes.ts';
import { readYamlMap } from './yaml-file.ts';
import type {
    Finding,
    RawRegistry,
    RawRegistryEntry,
    RegistryFiles,
    RegistryMeta,
    RegistryName
} from '../model/index.ts';

/** The eight hub-relative paths, one per registry; declared with the other types in data/model/. */
export type { RegistryFiles } from '../model/index.ts';

/** The paths on the hub today, which the config falls back to for a key it does not hold. */
export const REGISTRY_FILES: RegistryFiles = {
    venues: 'registries/venues.yml',
    datasets: 'registries/data.yml',
    pillars: 'registries/pillars.yml',
    domains: 'registries/domains.yml',
    funding: 'funding/funding.yml',
    people: 'registries/people.yml',
    organisations: 'registries/organisations.yml',
    resources: 'registries/resources.yml'
};

/**
 * How each file names its entry list and its id field. The seven registries keyed by `key` and the
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
    organisations: { list: 'entries', idField: 'key', idRequired: true },
    resources: { list: 'entries', idField: 'key', idRequired: true }
};

const NAMES: RegistryName[] = [
    'venues',
    'datasets',
    'pillars',
    'domains',
    'funding',
    'people',
    'organisations',
    'resources'
];

function empty(): RawRegistry {
    return { entries: [], meta: {} };
}

/**
 * One registry: its entries in file order with provenance, and every other top-level key as meta.
 */
function readRegistry(
    hub: string,
    name: RegistryName,
    relPath: string,
    catalog: TextCatalog,
    findings: Finding[]
): RawRegistry {
    const shape = SHAPES[name];
    const file = join(hub, relPath);
    const data = readYamlMap(file, catalog, findings, () =>
        findingText(catalog, 'findings.registries.file_missing')
    );
    if (data === null) return empty();

    // An own `__proto__` key is skipped: assigning to it would replace the new map's prototype.
    const meta: RegistryMeta = {};
    for (const [key, value] of Object.entries(data)) {
        if (key !== shape.list && key !== '__proto__') meta[key] = value;
    }

    const list = readAs(itemsShape, data[shape.list]);
    if (list === null) {
        const message =
            shape.list in data
                ? findingText(catalog, 'findings.file.list_not_a_list', shape.list)
                : findingText(catalog, 'findings.file.list_missing', shape.list);
        findings.push({ file, key: shape.list, message });
        return { entries: [], meta };
    }

    const entries: RawRegistryEntry[] = [];
    list.forEach((item, index) => {
        const where = `${shape.list}[${index}]`;
        const raw = readAs(mapShape, item);
        if (raw === null) {
            findings.push({
                file,
                key: where,
                message: findingText(catalog, 'findings.file.entry_not_a_map')
            });
            return;
        }
        const key = filledText(raw[shape.idField]) ?? '';
        if (key === '' && shape.idRequired) {
            findings.push({
                file,
                key: where,
                message: findingText(catalog, 'findings.registries.entry_no_id', shape.idField)
            });
        }
        entries.push({ ...raw, registry: name, key, file });
    });

    return { entries, meta };
}

/**
 * Read the eight registries. Each returns its entries and the file's other top-level keys as
 * `meta`, both untouched apart from the `registry`, `key` and `file` provenance added to every
 * entry. A file that is missing, does not parse, is not a map, or has no entry list gives an empty
 * list and one finding; nothing here throws and no entry is repaired.
 */
export function readRegistries(
    hub: string,
    files: RegistryFiles,
    catalog: TextCatalog
): Record<RegistryName, RawRegistry> & { findings: Finding[] } {
    const findings: Finding[] = [];
    const out = {} as Record<RegistryName, RawRegistry>;
    for (const name of NAMES) {
        out[name] = readRegistry(hub, name, files[name], catalog, findings);
    }
    return { ...out, findings };
}
