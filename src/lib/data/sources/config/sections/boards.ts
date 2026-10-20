// Layer 1, data. What is wrong with the `boards` map family, as findings of the file each board was
// read from (the open workspace file for a board its `settings:` sets, else
// config/defaults/layout.yml): a map that is no map, a board row that is no map, a field a board
// does not take, and a value its entry of the options catalog refuses (a tier `tiers` does not
// hold, a list of columns or groups that is no list of records, a column with no cell, a group with
// no words). The page reads the map itself (state/boards/board/presets.ts) and passes over what it
// cannot read, so each finding says what is not read. They are worded from the merged catalog.

import { findingText, type TextCatalog } from '../../../helpers/finding-text.ts';
import { isMap } from '../../../helpers/guards.ts';
import type { Finding } from '../../../model/index.ts';
import { catalogOf, sourcedItems, type CatalogEntry } from '../catalog/options.ts';
import { valueProblem } from '../catalog/value-rule.ts';
import { mustBe } from '../catalog/value-words.ts';

/** The top-level key of config/defaults/layout.yml the boards live under. */
const BOARDS = 'boards';

/** The field of each list of records a record cannot do without; a record lacking it is dropped. */
const NEEDS: Record<string, string> = { columns: 'cell', groups: 'label' };

/**
 * One finding for a `boards` that is not a map, and for each board row that is not a map (the
 * board is not read); for each field of a row the catalog's `boards` entry does not describe, and
 * each value of a field its spec refuses (the field is not read); and inside `columns` and
 * `groups`, for each record that is not a map or lacks its needed field (the record is not read),
 * each field of a record its spec does not describe, and each other field its spec refuses.
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
    const layout: Partial<Record<string, CatalogEntry>> = catalogOf(config)['layout.yml'] ?? {};
    const specs: Partial<Record<string, CatalogEntry>> = layout[BOARDS]?.fields ?? {};
    const found: Finding[] = [];
    const note = (key: string, message: string): void => {
        found.push({ file: fileOf(key), key, message });
    };
    const refused = (key: string, spec: CatalogEntry, value: unknown): boolean => {
        const problem = valueProblem(spec, value, { sourced: sourcedItems(spec, config), config });
        if (problem === null || problem.kind === 'empty') return false;
        const words = mustBe(catalog, spec, problem);
        note(key, findingText(catalog, 'findings.config.boards_value', key, words));
        return true;
    };
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
                continue;
            }
            if (refused(at, spec, value) || spec.fields === undefined || !Array.isArray(value)) {
                continue;
            }
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
    }
    return found;
}
