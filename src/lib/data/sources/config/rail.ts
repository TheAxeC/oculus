// Layer 1, data. The rule over the `rail:` list of config/layout.yml: which entries are rail pages
// and what is wrong with the ones that are not, and the one reading of a list as rows of three
// strings. Pure, over parsed YAML, and read by every caller: the page drawing the rail, the
// Settings view listing the rows and checking them before it sends them, and the server refusing a
// write, recording and undoing one, and reporting a hand edit as a finding. Each checks glyphs
// against the same names, glyphNames below, so an entry the finding says is not drawn is not
// drawn.
//
// The findings a hand edit earns are here too, worded from the catalog the server holds.
//
// An entry is `{ label, glyph, page }`, three non-empty strings, where `page` names a key of
// `arrangements:` and no earlier entry names the same key. The page key is what a saved page is
// tied to, so two entries on one key would be two buttons over one page; the second is dropped.

import { z } from 'zod';
import { findingText, type TextCatalog } from '../../helpers/finding-text.ts';
import type { Finding } from '../../model/index.ts';
import { itemsShape, mapShape, readAs, text } from '../../shapes/shapes.ts';

/** One button of the rail: its words, its glyph name, and the arrangement key of its page. */
export type RailEntry = { label: string; glyph: string; page: string };

/** Why one entry of the list is not a rail page. */
export type RailWhy =
    'shape' | 'label' | 'glyph' | 'glyph_unknown' | 'page' | 'page_unknown' | 'repeated';

/** One entry the rule refused: its place in the list, the reason, and the page it named if any. */
export type RailProblem = { index: number; why: RailWhy; page: string };

/** The entries the rail draws, in order, and every entry it leaves out with the reason. */
export type RailRead = { entries: RailEntry[]; problems: RailProblem[] };

/** A string with something in it besides white space, answered as it was written. */
const unblankShape = z.string().regex(/\S/);

/** A non-empty string, or null. */
function word(value: unknown): string | null {
    return readAs(unblankShape, value);
}

/**
 * A rail list as rows of three strings, whether or not the rule keeps each one: a field that is not
 * a string, and an item that is not a map, reads as empty strings. Null for anything that is not a
 * list. This is what the Settings view lists for the reader to mend, what a Settings tab holds
 * while it is typed in, and what the server records before and after a write.
 */
export function railRows(raw: unknown): RailEntry[] | null {
    const list = readAs(itemsShape, raw);
    if (list === null) return null;
    return list.map((row) => {
        const one = readAs(mapShape, row) ?? {};
        return { label: text(one.label), glyph: text(one.glyph), page: text(one.page) };
    });
}

/**
 * The glyph names of the `glyphs:` map of a merged config, the vocabulary of
 * config/catalogs/glyphs.yml, or undefined for a config holding no such map, which then checks no
 * glyph against one.
 */
export function glyphNames(config: Record<string, unknown> | undefined): string[] | undefined {
    const held = readAs(mapShape, config?.glyphs);
    return held === null ? undefined : Object.keys(held);
}

/**
 * The keys of `arrangements:`, in the order the file writes them. Anything that is not a map names
 * none, so every rail entry is then refused for naming an unknown page.
 */
export function arrangementKeys(raw: unknown): string[] {
    const held = readAs(mapShape, raw);
    return held === null ? [] : Object.keys(held);
}

/**
 * Read the rail list against the arrangement keys and, when given, the glyph names of
 * config/catalogs/glyphs.yml. A list that is not a list is no entries and no problems, which is a
 * config that has not got the key; an entry refused is reported and the ones after it still read.
 */
export function readRail(raw: unknown, arrangements: string[], glyphs?: string[]): RailRead {
    const entries: RailEntry[] = [];
    const problems: RailProblem[] = [];
    const list = readAs(itemsShape, raw);
    if (list === null) return { entries, problems };
    for (const [index, item] of list.entries()) {
        const held = readAs(mapShape, item);
        if (held === null) {
            problems.push({ index, why: 'shape', page: '' });
            continue;
        }
        const page = word(held.page);
        const label = word(held.label);
        const glyph = word(held.glyph);
        const named = page ?? '';
        if (label === null) problems.push({ index, why: 'label', page: named });
        else if (glyph === null) problems.push({ index, why: 'glyph', page: named });
        else if (page === null) problems.push({ index, why: 'page', page: named });
        else if (!arrangements.includes(page)) {
            problems.push({ index, why: 'page_unknown', page });
        } else if (entries.some((entry) => entry.page === page)) {
            problems.push({ index, why: 'repeated', page });
        } else if (glyphs !== undefined && !glyphs.includes(glyph)) {
            problems.push({ index, why: 'glyph_unknown', page });
        } else {
            entries.push({ label, glyph, page });
        }
    }
    return { entries, problems };
}

/**
 * The rail list's problems as findings of config/layout.yml, one per entry the rail leaves out and
 * one for a `rail:` that is not a list. Each is reported and never repaired: a hand edit that
 * breaks an entry shows up in the Findings view rather than as a button that is not there.
 */
export function railFindings(
    config: Record<string, unknown>,
    file: string,
    catalog: TextCatalog
): Finding[] {
    const raw = config.rail;
    if (raw === undefined) return [];
    if (readAs(itemsShape, raw) === null) {
        return [{ file, key: 'rail', message: findingText(catalog, 'findings.rail.not_a_list') }];
    }
    const read = readRail(raw, arrangementKeys(config.arrangements), glyphNames(config));
    return read.problems.map((problem) => ({
        file,
        key: `rail[${problem.index}]`,
        message: whyText(catalog, problem)
    }));
}

/** The finding sentence for one reason an entry is left out, naming the page it gave. */
function whyText(catalog: TextCatalog, problem: RailProblem): string {
    const page = problem.page;
    if (problem.why === 'shape') return findingText(catalog, 'findings.rail.shape');
    if (problem.why === 'label') return findingText(catalog, 'findings.rail.label', page);
    if (problem.why === 'glyph') return findingText(catalog, 'findings.rail.glyph', page);
    if (problem.why === 'glyph_unknown') {
        return findingText(catalog, 'findings.rail.glyph_unknown', page);
    }
    if (problem.why === 'page') return findingText(catalog, 'findings.rail.page');
    if (problem.why === 'page_unknown') {
        return findingText(catalog, 'findings.rail.page_unknown', page);
    }
    return findingText(catalog, 'findings.rail.repeated', page);
}
