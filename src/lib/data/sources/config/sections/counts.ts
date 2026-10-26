// Layer 1, data. The `counts` map of config/defaults/layout.yml: for each view that draws a count,
// whether its tabs draw it and whether the rail sums it, and what a collection, or Position Leads,
// counts. countsFindings words what is wrong with the map as findings of the file it came from,
// worded from the merged catalog, and each says the row or the field is not read. The page reads a
// row through countRow in state/workbench/rail-badges/rail-badges.ts, which takes each field the
// way the options catalog's rule here takes it.
//
// Which views draw a count is fixed by the views themselves: each one's registration has a count
// hook. They are the boards of `boards`, the collections, which count by the `match` of their row
// (one flagged `open_badge` by its own rule), and the views of COUNTED. Which of them the rail sums
// is the row's `rail`, read nowhere else.

import { findingText, type TextCatalog } from '../../../helpers/finding-text.ts';
import { fields, isMap } from '../../../helpers/guards.ts';
import { collectionFiles } from '../../../helpers/hub-names.ts';
import type { Finding } from '../../../model/index.ts';
import { catalogOf, sourcedItems, type CatalogEntry } from '../catalog/options.ts';
import { valueProblem } from '../catalog/value-rule.ts';
import { mustBe } from '../catalog/value-words.ts';

/** The top-level key of config/defaults/layout.yml the rows live under. */
const COUNTS = 'counts';

/** The views besides the boards and the collections whose count is computed in code. */
const COUNTED: readonly string[] = [
    'inbox',
    'leads',
    'calendar',
    'repositories',
    'problems',
    'findings',
    'audit',
    'processes',
    'hpc',
    'session-list'
];

/** The view whose row takes `days`. */
const LEADS = 'leads';

/** The fields a row of a collection takes, beside `tab` and `rail`. */
const COLLECTION_FIELDS = ['match', 'label', 'tone'];

/**
 * The fields one row may hold, or null when the view draws no count: a board's and a fixed view's
 * `tab` and `rail`, a collection's `match`, `label` and `tone` besides (a collection flagged
 * `open_badge`, which counts its open entries by its own rule, none of them), and Position Leads'
 * `days`.
 */
function fieldsOf(config: Record<string, unknown>, view: string, row: Record<string, unknown>) {
    const flags = ['tab', 'rail'];
    if (view === LEADS) return [...flags, 'days'];
    const entry = collectionFiles(config.collections).find((one) => one.key === view);
    if (COUNTED.includes(view) || entry?.open_badge === true) return flags;
    if (Object.hasOwn(fields(config.boards), view)) return flags;
    if (entry !== undefined && row.match !== undefined) return [...flags, ...COLLECTION_FIELDS];
    return null;
}

/**
 * One finding for a `counts` that is not a map; for each row that is not a map or whose id is no
 * view that draws a count (an unknown id, LinkedIn's mark, a collection with no `match`), whose
 * row is then not read; for each field a row does not take (`days` on any row but Position Leads',
 * `match`, `label` or `tone` on a view that is no collection or on one flagged `open_badge`, any
 * other name);
 * and for each field whose value its entry of the options catalog refuses (a `tab` of `yes`).
 */
export function countsFindings(
    config: Record<string, unknown>,
    file: string,
    catalog: TextCatalog
): Finding[] {
    const held = config[COUNTS];
    if (held === undefined) return [];
    if (!isMap(held)) {
        return [
            { file, key: COUNTS, message: findingText(catalog, 'findings.config.counts_block') }
        ];
    }
    const layout: Partial<Record<string, CatalogEntry>> = catalogOf(config)['layout.yml'] ?? {};
    const specs: Partial<Record<string, CatalogEntry>> = layout[COUNTS]?.fields ?? {};
    const found: Finding[] = [];
    for (const [view, row] of Object.entries(held)) {
        const key = `${COUNTS}.${view}`;
        const takes = isMap(row) ? fieldsOf(config, view, row) : null;
        if (!isMap(row) || takes === null) {
            const message = findingText(catalog, 'findings.config.counts_view', key);
            found.push({ file, key, message });
            continue;
        }
        for (const [name, value] of Object.entries(row)) {
            const at = `${key}.${name}`;
            if (!takes.includes(name)) {
                const message = findingText(catalog, 'findings.config.counts_field', at);
                found.push({ file, key: at, message });
                continue;
            }
            const spec: CatalogEntry | undefined = specs[name];
            const lists = spec === undefined ? {} : { sourced: sourcedItems(spec, config), config };
            const problem = spec === undefined ? null : valueProblem(spec, value, lists);
            if (spec === undefined || problem === null || problem.kind === 'empty') continue;
            const words = mustBe(catalog, spec, problem);
            const message = findingText(catalog, 'findings.config.counts_value', at, words);
            found.push({ file, key: at, message });
        }
    }
    return found;
}
