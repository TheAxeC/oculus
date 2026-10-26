// Layer 1, data. What is wrong with the `focus:` block of the merged config and with the words of
// the command center's `ticker_categories` (config/catalogs/vocab.yml), as findings of the file
// each value was read from: a block that is no map, a value its options-catalog entry refuses (a
// horizon that is no number, a list of statuses that is no list of words), a `focus.sections` that
// is no list or names a word that is no section of the board or a section twice, and a field of a
// word of `ticker_categories` that names no word of the text catalog. The page reads the block and
// the words itself (state/boards/ticker.ts, focus.ts, focus/focus-lanes.ts, and the sections
// through data/shapes/boards/focus-sections.ts, which Focus.svelte draws its sections by) and
// passes over what it cannot read, so each finding says the value or the field is not read. They
// are worded from the merged catalog, as iconFindings' are.

import { findingText, type TextCatalog } from '../../../helpers/finding-text.ts';
import { focusBlock, isMap } from '../../../helpers/guards.ts';
import type { Finding } from '../../../model/index.ts';
import { FOCUS_SECTIONS, focusSections } from '../../../shapes/boards/focus-sections.ts';
import { catalogOf, type CatalogEntry } from '../catalog/options.ts';
import { valueProblem } from '../catalog/value-rule.ts';
import { mustBe } from '../catalog/value-words.ts';

/** The block the findings are about, and the prefix of its entries in the options catalog. */
const FOCUS = 'focus';

/** The entries of the options catalog that describe config/defaults/behavior.yml. */
function behaviorEntries(config: Record<string, unknown>): Partial<Record<string, CatalogEntry>> {
    return catalogOf(config)['behavior.yml'] ?? {};
}

/**
 * One finding for a `focus.sections` that is no list (while the block holds one), one for each
 * listed word that is no section, and one for each section listed more than once.
 */
function sectionFindings(
    config: Record<string, unknown>,
    fileOf: (key: string) => string,
    catalog: TextCatalog
): Finding[] {
    const read = focusSections(config, behaviorEntries(config)[FOCUS_SECTIONS]);
    if (!read.held) return [];
    const file = fileOf(FOCUS_SECTIONS);
    const note = (message: string): Finding => ({ file, key: FOCUS_SECTIONS, message });
    if (!read.listed) return [note(findingText(catalog, 'findings.config.focus_sections'))];
    return [
        ...read.unknown.map((word) =>
            note(findingText(catalog, 'findings.config.focus_section_unknown', word))
        ),
        ...read.twice.map((word) =>
            note(findingText(catalog, 'findings.config.focus_section_twice', word))
        )
    ];
}

/** The vocabulary key of the command center's deadline categories. */
const CATEGORIES = 'ticker_categories';

/** The fields of a word of `ticker_categories` that name a word of the text catalog. */
const WORD_FIELDS = ['label', 'glyph', 'noun', 'overdue_noun'];

/**
 * One finding for each field of a word of `ticker_categories` that names no word of the catalog,
 * naming the word; a field that is no text is the vocabulary shape's finding, not this one's.
 */
function categoryFindings(
    config: Record<string, unknown>,
    fileOf: (key: string) => string,
    catalog: TextCatalog
): Finding[] {
    const words = config[CATEGORIES];
    if (!isMap(words)) return [];
    const found: Finding[] = [];
    for (const [word, row] of Object.entries(words)) {
        if (!isMap(row)) continue;
        for (const field of WORD_FIELDS) {
            const key = row[field];
            if (typeof key !== 'string' || Object.hasOwn(catalog, key)) continue;
            found.push({
                file: fileOf(CATEGORIES),
                key: `${CATEGORIES}.${word}.${field}`,
                message: findingText(
                    catalog,
                    'findings.collections.ticker_word_unknown',
                    field,
                    word
                )
            });
        }
    }
    return found;
}

/**
 * One finding for each value under `focus:` that its entry of the options catalog refuses, the
 * findings of `focus.sections` (`sectionFindings`), and one for each field of a word of
 * `ticker_categories` that names no word of the catalog. A block that is no map is one finding, and
 * a key the block does not hold gives none. Each finding names the file `fileOf` gives for the key
 * it is about.
 */
export function focusFindings(
    config: Record<string, unknown>,
    fileOf: (key: string) => string,
    catalog: TextCatalog
): Finding[] {
    const words = categoryFindings(config, fileOf, catalog);
    if (config[FOCUS] === undefined) return words;
    if (!isMap(config[FOCUS])) {
        return [
            {
                file: fileOf(FOCUS),
                key: FOCUS,
                message: findingText(catalog, 'findings.config.focus_block')
            },
            ...words
        ];
    }
    const block = focusBlock(config);
    const found: Finding[] = sectionFindings(config, fileOf, catalog);
    for (const [key, spec] of Object.entries(behaviorEntries(config))) {
        if (!key.startsWith(`${FOCUS}.`) || key === FOCUS_SECTIONS || spec === undefined) continue;
        let held: unknown = block;
        for (const segment of key.slice(FOCUS.length + 1).split('.')) {
            held = isMap(held) ? held[segment] : undefined;
        }
        if (held === undefined) continue;
        const problem = valueProblem(spec, held);
        if (problem === null || problem.kind === 'empty') continue;
        found.push({
            file: fileOf(key),
            key,
            message: findingText(
                catalog,
                'findings.config.focus_value',
                key,
                mustBe(catalog, spec, problem)
            )
        });
    }
    return [...found, ...words];
}
