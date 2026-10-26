// Layer 1, data. The rule over the `rail:` list of config/defaults/layout.yml: which entries are
// rail pages and what is wrong with the ones that are not, and the one reading of a list as rows of
// five strings. Pure, over parsed YAML, and read by every caller: the page drawing the rail, the
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
// An entry may also hold `chord` and `group_glyph`, the one-letter keyboard prefix and the heading
// glyph of the page's group in the view catalogue, whose heading is the entry's label. A chord
// that is not one lowercase letter, or a group glyph the vocabulary does not hold, is a problem
// too, and the entry is kept without it: the button is drawn and the group has no chord or takes
// the glyph of its first view.
//
// One entry carries `unplaced_collections: true`: its page's group is where a collection view whose
// `collections:` entry names no `group:` is placed. One entry carries `project_boards: true`: its
// page's group is where the project boards of `boards:` are registered. For each flag, a value that
// is not true or false is a problem and the entry is kept without it; no flagged entry, or more
// than one, is a finding on the rail, the first flagged entry the one read and, with none, those
// views in no group.

import { z } from 'zod';
import { findingText, type TextCatalog } from '../../helpers/finding-text.ts';
import type { Finding } from '../../model/index.ts';
import { itemsShape, mapShape, readAs, text } from '../../shapes/shapes.ts';

/**
 * One button of the rail: its words, its glyph name, the arrangement key of its page, and the chord
 * letter and heading glyph of the page's group in the view catalogue, each empty when it has none,
 * whether the page's group takes the collection views whose entry names no group, and whether it
 * takes the project boards.
 */
export type RailEntry = {
    label: string;
    glyph: string;
    page: string;
    chord: string;
    group_glyph: string;
    unplaced_collections: boolean;
    project_boards: boolean;
};

/** The flags of a rail entry that place a family of views in the entry's group. */
type GroupFlag = 'unplaced_collections' | 'project_boards';

/**
 * Why one entry of the list is not a rail page, or, for `chord`, `group_glyph_unknown`, `unplaced`
 * and `boards`, why the page's group goes without its chord, its heading glyph, the collection
 * views no entry places or the project boards.
 */
export type RailWhy =
    | 'shape'
    | 'label'
    | 'glyph'
    | 'glyph_unknown'
    | 'page'
    | 'page_unknown'
    | 'repeated'
    | 'chord'
    | 'group_glyph_unknown'
    | 'unplaced'
    | 'boards';

/** A chord letter: one lowercase letter. */
const chordShape = z.string().regex(/^[a-z]$/);

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
 * A rail list as rows of five strings and the two flags, whether or not the rule keeps each one: a
 * field that is not a string, and an item that is not a map, reads as empty strings, and a flag
 * that is not true as false. Null for anything that is not a list. This is what the Settings view
 * lists for the reader to mend, what a Settings tab holds while it is typed in, and what the server
 * records before and after a write.
 */
export function railRows(raw: unknown): RailEntry[] | null {
    const list = readAs(itemsShape, raw);
    if (list === null) return null;
    return list.map((row) => {
        const one = readAs(mapShape, row) ?? {};
        return {
            label: text(one.label),
            glyph: text(one.glyph),
            page: text(one.page),
            chord: text(one.chord),
            group_glyph: text(one.group_glyph),
            unplaced_collections: one.unplaced_collections === true,
            project_boards: one.project_boards === true
        };
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
            entries.push({ label, glyph, page, ...groupOf(held, index, page, glyphs, problems) });
        }
    }
    return { entries, problems };
}

/** Whether a field is written with something: present, and not the empty text. */
function written(value: unknown): boolean {
    return value !== undefined && value !== '';
}

/**
 * The chord, the heading glyph and the two flags of a kept entry's group: each as written, or empty
 * or false when it is missing, and empty or false with a problem when the chord is no lowercase
 * letter, the glyph is no string or no name of the vocabulary, or a flag is not true or false.
 */
function groupOf(
    held: Record<string, unknown>,
    index: number,
    page: string,
    glyphs: string[] | undefined,
    problems: RailProblem[]
): Pick<RailEntry, 'chord' | 'group_glyph' | GroupFlag> {
    let chord = text(held.chord);
    if (written(held.chord) && !chordShape.safeParse(held.chord).success) {
        problems.push({ index, why: 'chord', page });
        chord = '';
    }
    let group = text(held.group_glyph);
    const unheld = glyphs !== undefined && !glyphs.includes(group);
    if (written(held.group_glyph) && (typeof held.group_glyph !== 'string' || unheld)) {
        problems.push({ index, why: 'group_glyph_unknown', page });
        group = '';
    }
    const flagged = (name: GroupFlag, why: RailWhy): boolean => {
        const flag = held[name];
        if (flag !== undefined && typeof flag !== 'boolean') problems.push({ index, why, page });
        return flag === true;
    };
    return {
        chord,
        group_glyph: group,
        unplaced_collections: flagged('unplaced_collections', 'unplaced'),
        project_boards: flagged('project_boards', 'boards')
    };
}

/**
 * The page of the first kept entry carrying the flag `name`, whose group takes the views the flag
 * places, or null when no entry carries it.
 */
function flaggedPage(entries: readonly RailEntry[], name: GroupFlag): string | null {
    return entries.find((entry) => entry[name])?.page ?? null;
}

/** The kept entries of a merged config's rail. */
function railEntries(config: Record<string, unknown>): RailEntry[] {
    return readRail(config.rail, arrangementKeys(config.arrangements), glyphNames(config)).entries;
}

/**
 * The group of a merged config's rail that takes the collection views no entry places: the page of
 * its first kept entry carrying `unplaced_collections`, or null.
 */
export function unplacedGroup(config: Record<string, unknown>): string | null {
    return flaggedPage(railEntries(config), 'unplaced_collections');
}

/**
 * The group of a merged config's rail the project boards of `boards:` are registered in: the page
 * of its first kept entry carrying `project_boards`, or null.
 */
export function boardsGroup(config: Record<string, unknown>): string | null {
    return flaggedPage(railEntries(config), 'project_boards');
}

/** How a finding about a group flag is worded: with no entry carrying it, and with two. */
type FlagWords = { none: () => string; twice: (second: string, first: string) => string };

/**
 * The finding on the rail when no kept entry carries the flag `name`, worded by `none`, or more
 * than one does, worded by `twice` with the pages of the second and the first; null when one entry
 * carries it.
 */
function flagFinding(
    entries: readonly RailEntry[],
    name: GroupFlag,
    words: FlagWords
): string | null {
    const flagged = entries.filter((entry) => entry[name]);
    if (flagged.length === 1) return null;
    return flagged.length === 0 ? words.none() : words.twice(flagged[1].page, flagged[0].page);
}

/**
 * The rail list's problems as findings, one per entry the rail leaves out and one for a `rail:`
 * that is not a list, each naming the file `fileOf` gives for its key (the open workspace file when
 * its `settings:` sets the rail, else config/defaults/layout.yml), then one on the rail for each of
 * `unplaced_collections` and `project_boards` that no kept entry carries or more than one does.
 * Each is reported and never repaired: a hand edit that breaks an entry shows up in the Findings
 * view rather than as a button that is not there.
 */
export function railFindings(
    config: Record<string, unknown>,
    fileOf: (key: string) => string,
    catalog: TextCatalog
): Finding[] {
    const raw = config.rail;
    if (raw === undefined) return [];
    if (readAs(itemsShape, raw) === null) {
        return [
            {
                file: fileOf('rail'),
                key: 'rail',
                message: findingText(catalog, 'findings.rail.not_a_list')
            }
        ];
    }
    const read = readRail(raw, arrangementKeys(config.arrangements), glyphNames(config));
    const found = read.problems.map((problem) => {
        const key = `rail[${problem.index}]`;
        return { file: fileOf(key), key, message: whyText(catalog, problem) };
    });
    const messages = [
        flagFinding(read.entries, 'unplaced_collections', {
            none: () => findingText(catalog, 'findings.rail.unplaced_none'),
            twice: (second, first) =>
                findingText(catalog, 'findings.rail.unplaced_twice', second, first)
        }),
        flagFinding(read.entries, 'project_boards', {
            none: () => findingText(catalog, 'findings.rail.boards_none'),
            twice: (second, first) =>
                findingText(catalog, 'findings.rail.boards_twice', second, first)
        })
    ];
    const rail = messages.flatMap((message) =>
        message === null ? [] : [{ file: fileOf('rail'), key: 'rail', message }]
    );
    return [...found, ...rail];
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
    if (problem.why === 'chord') return findingText(catalog, 'findings.rail.chord', page);
    if (problem.why === 'group_glyph_unknown') {
        return findingText(catalog, 'findings.rail.group_glyph_unknown', page);
    }
    if (problem.why === 'unplaced') return findingText(catalog, 'findings.rail.unplaced', page);
    if (problem.why === 'boards') return findingText(catalog, 'findings.rail.boards', page);
    if (problem.why === 'page') return findingText(catalog, 'findings.rail.page');
    if (problem.why === 'page_unknown') {
        return findingText(catalog, 'findings.rail.page_unknown', page);
    }
    return findingText(catalog, 'findings.rail.repeated', page);
}
