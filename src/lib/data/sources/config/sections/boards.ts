// Layer 1, data. What is wrong with the `boards` map family and the `categories` list, as findings
// of the file each was read from (the open workspace file for a board its `settings:` sets, else
// config/defaults/layout.yml; config/catalogs/vocab.yml for `categories`). For `boards`: a map that
// is no map, a board row that is no map, a field a board does not take, a value its entry of the
// options catalog refuses (a tier `tiers` does not hold, a role `roles` does not hold, a word or a
// flag a block's vocabulary does not hold, a list of columns that is no list of records, a column
// with no cell), and a `label:` or `glyph:` that is absent or names no word of the text catalog.
// For `categories`: a row with no key or a key an earlier row holds, a row naming no `color`, and a
// block's word or flag its vocabulary does not hold, read by the same entries of the catalog as a
// board's blocks. The page reads both itself (data/shapes/boards/) and passes over what it cannot
// read, so each finding says what is not read. They are worded from the merged catalog.

import { findingText, type TextCatalog } from '../../../helpers/finding-text.ts';
import { isMap } from '../../../helpers/guards.ts';
import type { Finding } from '../../../model/index.ts';
import {
    catalogOf,
    pickedSources,
    sourcedItems,
    type CatalogEntry,
    type FieldSpec
} from '../catalog/options.ts';
import { isPairs } from '../catalog/schemas/options.ts';
import { valueProblem } from '../catalog/value-rule.ts';
import { mustBe } from '../catalog/value-words.ts';

/** The top-level key of config/defaults/layout.yml the boards live under. */
const BOARDS = 'boards';

/** The top-level key of config/catalogs/vocab.yml the categories live under. */
const CATEGORIES = 'categories';

/** The block fields of a category, read by the board entry's fields of the same name. */
const CATEGORY_BLOCKS = ['stages', 'forms'];

/** The fields of a board naming the text-catalog words its view is named by and draws. */
const BOARD_WORDS = ['label', 'glyph'];

/** The field of each list of records a record cannot do without; a record lacking it is dropped. */
const NEEDS: Record<string, string> = { columns: 'cell' };

/** Where a finding is filed and what it says. */
type Note = (key: string, message: string) => void;

/** The fields of the catalog's `boards` entry, by field name. */
function boardSpecs(config: Record<string, unknown>): Partial<Record<string, CatalogEntry>> {
    const layout: Partial<Record<string, CatalogEntry>> = catalogOf(config)['layout.yml'] ?? {};
    return layout[BOARDS]?.fields ?? {};
}

/**
 * One finding when a value is one its spec refuses, worded by the catalog; true when it was. The
 * empty choice of a spec that does not take it is no finding here.
 */
function refusedBy(
    note: Note,
    config: Record<string, unknown>,
    catalog: TextCatalog
): (key: string, spec: CatalogEntry, value: unknown) => boolean {
    return (key, spec, value) => {
        const problem = valueProblem(spec, value, { sourced: sourcedItems(spec, config), config });
        if (problem === null || problem.kind === 'empty') return false;
        const words = mustBe(catalog, spec, problem);
        note(key, findingText(catalog, 'findings.config.boards_value', key, words));
        return true;
    };
}

/**
 * The spec of the value at one key of a map field: the field's `value`, its source picked by the
 * key as one listed source, so a finding names the one list the value is held to.
 */
function valueSpec(fields: Record<string, FieldSpec>, key: string): FieldSpec {
    const value = fields.value;
    const picked = pickedSources(value)?.sources[key];
    return picked === undefined ? value : { ...value, from: [picked] };
}

/**
 * The findings of a field that maps keys to values (a board's `stages`, `chips`, `forms` and
 * `match`): a value that is no map, a key its `key` field refuses, and a value its `value` field
 * refuses.
 */
function mapFindings(
    at: string,
    spec: CatalogEntry,
    value: unknown,
    note: Note,
    refused: (key: string, spec: CatalogEntry, value: unknown) => boolean,
    catalog: TextCatalog
): void {
    const fields = spec.fields ?? {};
    if (!isMap(value)) {
        const words = findingText(catalog, 'findings.shape.is_map');
        note(at, findingText(catalog, 'findings.config.boards_value', at, words));
        return;
    }
    for (const [key, inner] of Object.entries(value)) {
        const where = `${at}.${key}`;
        if (refused(where, fields.key, key)) continue;
        refused(where, valueSpec(fields, key), inner);
    }
}

/**
 * The findings of a list of records (a board's `columns`): a record that is not a map or lacks its
 * needed field, a field its spec does not describe, and a field its spec refuses.
 */
function recordFindings(
    at: string,
    name: string,
    spec: CatalogEntry,
    value: unknown[],
    note: Note,
    refused: (key: string, spec: CatalogEntry, value: unknown) => boolean,
    catalog: TextCatalog
): void {
    value.forEach((record: unknown, index) => {
        const place = `${at}[${String(index)}]`;
        const needed = NEEDS[name];
        const lacks =
            isMap(record) && (typeof record[needed] !== 'string' || record[needed] === '');
        if (!isMap(record) || lacks) {
            note(place, findingText(catalog, 'findings.config.boards_record', place));
            return;
        }
        const fields = spec.fields ?? {};
        for (const [field, inner] of Object.entries(record)) {
            const where = `${place}.${field}`;
            if (Object.hasOwn(fields, field)) refused(where, fields[field], inner);
            else note(where, findingText(catalog, 'findings.config.boards_field', where));
        }
    });
}

/**
 * One finding for a `boards` that is not a map, and for each board row that is not a map (the board
 * is not read); for each field of a row the catalog's `boards` entry does not describe, and each
 * value of a field its spec refuses (the field is not read); inside a block or `match`, for each
 * key and value their specs refuse; inside `columns`, for each record that is not a map or lacks
 * its cell, each field of a record its spec does not describe, and each other field its spec
 * refuses; and for each `label:` and `glyph:` a board does not name or names a key the text catalog
 * lacks.
 */
export function boardsFindings(
    config: Record<string, unknown>,
    fileOf: (key: string) => string,
    catalog: TextCatalog
): Finding[] {
    const held = config[BOARDS];
    if (held === undefined) return [];
    if (!isMap(held)) {
        return [
            {
                file: fileOf(BOARDS),
                key: BOARDS,
                message: findingText(catalog, 'findings.config.boards_block')
            }
        ];
    }
    const specs = boardSpecs(config);
    const found: Finding[] = [];
    const note: Note = (key, message) => {
        found.push({ file: fileOf(key), key, message });
    };
    const refused = refusedBy(note, config, catalog);
    for (const [board, row] of Object.entries(held)) {
        const key = `${BOARDS}.${board}`;
        if (!isMap(row)) {
            note(key, findingText(catalog, 'findings.config.boards_row', key));
            continue;
        }
        for (const [name, value] of Object.entries(row)) {
            const at = `${key}.${name}`;
            const spec: CatalogEntry | undefined = name === 'key' ? undefined : specs[name];
            if (spec === undefined) {
                note(at, findingText(catalog, 'findings.config.boards_field', at));
            } else if (spec.fields !== undefined && isPairs(spec.fields)) {
                mapFindings(at, spec, value, note, refused, catalog);
            } else if (!refused(at, spec, value) && spec.fields !== undefined) {
                if (Array.isArray(value)) {
                    recordFindings(at, name, spec, value, note, refused, catalog);
                }
            }
        }
        wordFindings(board, key, row, note, catalog);
    }
    return found;
}

/**
 * One finding for each of a board's `label:` and `glyph:` that is absent or empty, and one for each
 * naming a key the text catalog lacks; a value that is no text is the value check's finding. The
 * board is then drawn with its key and the glyph of a board naming none.
 */
function wordFindings(
    board: string,
    key: string,
    row: Record<string, unknown>,
    note: Note,
    catalog: TextCatalog
): void {
    for (const field of BOARD_WORDS) {
        const word = row[field];
        const at = `${key}.${field}`;
        if (word === undefined || word === '') {
            note(at, findingText(catalog, 'findings.config.boards_word_none', board, field));
        } else if (typeof word === 'string' && !Object.hasOwn(catalog, word)) {
            note(
                at,
                findingText(catalog, 'findings.config.boards_word_unknown', board, field, word)
            );
        }
    }
}

/**
 * The findings of `categories`: a list that is no list, a row that is no map, a row with no key or
 * one whose key an earlier row holds (the row is not read), a row naming no `color` (it is drawn in
 * no colour), and inside its `stages` and `forms` blocks each list and word the board entry's
 * fields of the same name refuse.
 */
export function categoriesFindings(
    config: Record<string, unknown>,
    fileOf: (key: string) => string,
    catalog: TextCatalog
): Finding[] {
    const held = config[CATEGORIES];
    if (held === undefined) return [];
    const found: Finding[] = [];
    const note: Note = (key, message) => {
        found.push({ file: fileOf(CATEGORIES), key, message });
    };
    if (!Array.isArray(held)) {
        note(CATEGORIES, findingText(catalog, 'findings.config.categories_block'));
        return found;
    }
    const specs = boardSpecs(config);
    const refused = refusedBy(note, config, catalog);
    const seen = new Set<string>();
    held.forEach((row: unknown, index) => {
        const at = `${CATEGORIES}[${String(index)}]`;
        const key = isMap(row) && typeof row.key === 'string' ? row.key : '';
        if (key === '' || seen.has(key)) {
            note(at, findingText(catalog, 'findings.config.categories_row', at));
            return;
        }
        seen.add(key);
        const fields = isMap(row) ? row : {};
        if (!Object.hasOwn(fields, 'color')) {
            note(at, findingText(catalog, 'findings.config.categories_colour', at));
        }
        for (const name of CATEGORY_BLOCKS) {
            const spec = specs[name];
            if (spec === undefined || !Object.hasOwn(fields, name)) continue;
            mapFindings(`${at}.${name}`, spec, fields[name], note, refused, catalog);
        }
    });
    return found;
}
