// Layer 1, data. What is wrong with the `focus:` block of the merged config, as findings of the
// file each value was read from: a block that is no map, a value its options-catalog entry refuses
// (a horizon that is no number, a list of statuses that is no list of words), and a row of
// `focus.ticker_sources` that the Command Center cannot read. The page reads the block itself
// (state/boards/ticker.ts, focus.ts, focus/focus-lanes.ts) and passes over what it cannot read, so
// each finding says the value, the row or the field is not read. They are worded from the merged
// catalog, as iconFindings' are.

import { findingText, type TextCatalog } from '../../../helpers/finding-text.ts';
import { focusBlock, isMap } from '../../../helpers/guards.ts';
import type { Finding } from '../../../model/index.ts';
import { catalogOf, type CatalogEntry } from '../catalog/options.ts';
import { valueProblem, type ValueProblem } from '../catalog/value-rule.ts';
import { mustBe } from '../catalog/value-words.ts';

/** The block the findings are about, and the prefix of its entries in the options catalog. */
const FOCUS = 'focus';

/** The fields a row of `ticker_sources` cannot do without; a row missing one is not read. */
const ROW_NEEDS = ['collection', 'category'];

/** A problem the rule cannot word: the empty choice, which has a finding line of its own. */
type Worded = Exclude<ValueProblem, { kind: 'empty' }>;

/** The value at a dotted path under `focus:`, or undefined where the block holds none. */
function heldAt(block: Record<string, unknown>, path: string): unknown {
    let node: unknown = block;
    for (const segment of path.split('.')) {
        if (!isMap(node)) return undefined;
        node = node[segment];
    }
    return node;
}

/** What is wrong with one field of a row, or null; a needed field must be a text of one letter. */
function fieldProblem(name: string, spec: CatalogEntry, value: unknown): Worded | null {
    const needed = ROW_NEEDS.includes(name);
    if (value === undefined && !needed) return null;
    if (needed && (typeof value !== 'string' || value === '')) return { kind: 'text' };
    const problem = valueProblem(spec, value);
    return problem === null || problem.kind === 'empty' ? null : problem;
}

/**
 * One finding for each value under `focus:` that its entry of the options catalog refuses, for a
 * list of rows that is no list, for each row of it that is no map or lacks a needed field (the
 * Command Center reads no such row), and for each other field of a row that is wrong (the row is
 * read without it). A block that is no map is one finding, and a key the block does not hold gives
 * none. Each finding names the file `fileOf` gives for the option it is about.
 */
export function focusFindings(
    config: Record<string, unknown>,
    fileOf: (key: string) => string,
    catalog: TextCatalog
): Finding[] {
    if (config[FOCUS] === undefined) return [];
    if (!isMap(config[FOCUS])) {
        return [
            {
                file: fileOf(FOCUS),
                key: FOCUS,
                message: findingText(catalog, 'findings.config.focus_block')
            }
        ];
    }
    const block = focusBlock(config);
    const value = (key: string, spec: CatalogEntry, problem: Worded): Finding => ({
        file: fileOf(key),
        key,
        message: findingText(
            catalog,
            'findings.config.focus_value',
            key,
            mustBe(catalog, spec, problem)
        )
    });
    const row = (key: string, spec: CatalogEntry, problem: Worded, option: string): Finding => ({
        file: fileOf(option),
        key,
        message: findingText(
            catalog,
            'findings.config.focus_row',
            key,
            mustBe(catalog, spec, problem)
        )
    });
    const field = (key: string, spec: CatalogEntry, problem: Worded, option: string): Finding => ({
        file: fileOf(option),
        key,
        message: findingText(
            catalog,
            'findings.config.setting_field',
            key,
            mustBe(catalog, spec, problem)
        )
    });
    const found: Finding[] = [];
    const entries = catalogOf(config)['behavior.yml'] ?? {};
    for (const [key, spec] of Object.entries(entries)) {
        if (!key.startsWith(`${FOCUS}.`)) continue;
        const held = heldAt(block, key.slice(FOCUS.length + 1));
        if (held === undefined) continue;
        if (spec.fields === undefined) {
            const problem = valueProblem(spec, held);
            if (problem !== null && problem.kind !== 'empty') found.push(value(key, spec, problem));
            continue;
        }
        if (!Array.isArray(held)) {
            found.push(value(key, { ...spec, control: 'records' }, { kind: 'records' }));
            continue;
        }
        held.forEach((one: unknown, index) => {
            const at = `${key}[${String(index)}]`;
            if (!isMap(one)) {
                found.push(row(at, { ...spec, control: 'records' }, { kind: 'records' }, key));
                return;
            }
            for (const [name, spec] of Object.entries(entries[key].fields ?? {})) {
                const problem = fieldProblem(name, spec, one[name]);
                if (problem === null) continue;
                const say = ROW_NEEDS.includes(name) ? row : field;
                found.push(say(`${at}.${name}`, spec, problem, key));
                if (ROW_NEEDS.includes(name)) break;
            }
        });
    }
    return found;
}
