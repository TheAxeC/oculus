// Layer 1, data. The options catalog, config/catalogs/options.yml: every option of every config
// file described once, and the walk that says which key paths of a config file are options.
//
// The catalog's one top-level key, `options:`, rides in the merged config beside the other
// catalogs' keys. It maps a config file's name (`behavior.yml`, and `local.yml` for the machine's
// own keys) to a map of dotted key path to an entry: what the option does, the value the tracked
// file holds for it, and the control it is set with. It is there for an editor of the settings and
// a write of one key to look an option up, so a key path has one meaning wherever it is used.
//
// An option is a leaf of a config file: a scalar, a null, or a list. The walk descends into every
// map and never into a list, so a list is set as a whole. It stops at a family, a list of records
// or a map whose keys are names the data or the reader chooses (page names, tier names, project
// types, file extensions, theme names) rather than names oculus reads: a family is one option
// whose entry describes the record's `fields` once, since its members are not keys of this file in
// any fixed sense and a catalog line per member would be a line per row of someone's data.

import { byKey, isMap } from '../../helpers/guards.ts';
import { mapShape, readOr, unchangedAs } from '../../shapes/shapes.ts';

/** The controls an option is set with, which decide what a value of the option may be. */
export const CONTROLS = ['toggle', 'number', 'text', 'choice', 'list'] as const;

/** One of the words of CONTROLS. */
export type Control = (typeof CONTROLS)[number];

/**
 * One option, or one family. A leaf option carries `default`, the value the tracked file holds, and
 * `control`, plus `values` when the control is a `choice`. A family carries `fields` and none of
 * the three, and so does a `local.yml` key, which has a description alone. `section` is the heading
 * the option is shown under, and the first segment of its key path when absent.
 */
export type CatalogEntry = {
    description: string;
    default?: unknown;
    section?: string;
    control?: Control;
    values?: string[];
    fields?: Record<string, string>;
};

/** Config file name, then dotted key path, then entry. */
export type Catalog = Record<string, Record<string, CatalogEntry>>;

/** The catalog as a map, answered as it was given and held to the type above. */
const catalogShape = unchangedAs<Catalog>(mapShape);

/**
 * The catalog held by the merged config's `options` key, and an empty one when the key is missing
 * or is not a map. The shape inside is not checked here: the check in
 * tests/checks/config/options-catalog.test.ts fails a catalog that does not match the types above,
 * so a reader may rely on them.
 */
export function catalogOf(config: Record<string, unknown>): Catalog {
    return readOr(catalogShape, config.options, {});
}

/** Whether the catalog describes this path as a family, which is an entry holding `fields`. */
function isFamily(entries: Record<string, CatalogEntry>, path: string): boolean {
    const entry: unknown = byKey(entries, path);
    return isMap(entry) && Object.hasOwn(entry, 'fields');
}

/**
 * The key path of every option of one parsed config file. A map is descended into, a family
 * entry's path is returned as it stands without looking inside, and every other value is a leaf:
 * a scalar, a null, a list of any items, and a map with no keys. A file that is not a map has no
 * options. Two different keys can give one path (`a.b` beside `a` holding `b`); the path is
 * returned once for each.
 */
export function optionPaths(file: unknown, entries: Record<string, CatalogEntry>): string[] {
    const paths: string[] = [];
    const visit = (value: unknown, path: string): void => {
        if (path !== '' && isFamily(entries, path)) {
            paths.push(path);
        } else if (isMap(value) && Object.keys(value).length > 0) {
            for (const [key, inner] of Object.entries(value)) {
                visit(inner, path === '' ? key : `${path}.${key}`);
            }
        } else if (path !== '') {
            paths.push(path);
        }
    };
    if (isMap(file)) visit(file, '');
    return paths;
}
