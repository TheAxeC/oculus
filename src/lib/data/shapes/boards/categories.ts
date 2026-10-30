// Layer 1, data, pure. The categories of `categories:` in config/catalogs/vocab.yml, the one list
// of what a project is filed under on every board: a project's category is the first row, in the
// list's order, whose `stages:` and `forms:` blocks it meets, and a project no row holds has none.
// The board cards and their sections, the slices of a board's bar, the rail's count and the
// Pillars view's Archival band all read a project's category through `categoryOf`, so the rule is
// written once and the boards name no categories of their own. A project is filed under the
// categories and the words of its own hub (`categoriesBy`).

import { z } from 'zod';
import type { Rooted } from '../../model/index.ts';
import { HEX_COLOUR } from '../catalog-files/common.ts';
import { readAs, rowsShape } from '../shapes.ts';
import { recordWords, type WordsOf } from '../vocab-keys.ts';
import { blockHolds, blockOf, wordList, type WordBlock } from './words.ts';

/** One row of `categories:` as the code reads it. */
export type Category = {
    key: string;
    /** The words the row is drawn with: its `label`, or its key when it names none. */
    label: string;
    /** The row's `color`, the empty text when it names none. */
    color: string;
    stages: WordBlock | null;
    forms: WordBlock | null;
    /** `rail: true`: a board's rail count is the count of its projects in such rows. */
    rail: boolean;
    /** `archival: true`: the Pillars view's Archival band, and no real work. */
    archival: boolean;
};

/** A project as a category reads it: its stage and its form. */
export type Filed = { stage?: string; form?: string };

/** One row of `categories:` as written: a map with a key, its other fields read by `rowOf`. */
const rowShape = z.looseObject({ key: z.string().min(1) });

/**
 * The row's own colour, the empty text when it names none; the config check reports such a row
 * (data/sources/config/sections/boards.ts `categoriesFindings`).
 */
function colourOf(own: unknown): string {
    return typeof own === 'string' ? own.trim() : '';
}

/**
 * The rows of `categories:` in the merged config, in the list's order. A row without a key is no
 * category, and a key a row before it holds is the first row's alone.
 */
export function categoriesOf(config: Record<string, unknown>): Category[] {
    const rows = readAs(rowsShape(rowShape), config.categories) ?? [];
    const seen = new Set<string>();
    const categories: Category[] = [];
    for (const row of rows) {
        if (seen.has(row.key)) continue;
        seen.add(row.key);
        const stages = blockOf(row.stages);
        const label = typeof row.label === 'string' && row.label !== '' ? row.label : row.key;
        categories.push({
            key: row.key,
            label,
            color: colourOf(row.color),
            stages,
            forms: blockOf(row.forms),
            rail: row.rail === true,
            archival: row.archival === true
        });
    }
    return categories;
}

/** Whether a project meets a row's `stages:` and `forms:` blocks. */
function categoryHolds(
    category: Category,
    project: Filed,
    config: Record<string, unknown>
): boolean {
    return (
        blockHolds(category.stages, wordList(project.stage), config.stages) &&
        blockHolds(category.forms, wordList(project.form), config.forms)
    );
}

/** The category of a project: the first row that holds it, and none when no row does. */
export function categoryOf(
    project: Filed,
    categories: readonly Category[],
    config: Record<string, unknown>
): Category | undefined {
    return categories.find((category) => categoryHolds(category, project, config));
}

/**
 * The words a record is filed under and their categories: its own hub's as `wordsOf` gives them,
 * `config`'s without it, each set of words read once.
 */
export function categoriesBy(
    config: Record<string, unknown>,
    wordsOf?: WordsOf
): (record: Rooted) => { words: Record<string, unknown>; categories: Category[] } {
    const read = new Map<Record<string, unknown>, Category[]>();
    return (record) => {
        const words = recordWords(config, wordsOf, record);
        const categories = read.get(words) ?? categoriesOf(words);
        read.set(words, categories);
        return { words, categories };
    };
}

/** Whether a project's category carries `archival: true`, which makes it no real work. */
export function isArchival(
    project: Filed,
    categories: readonly Category[],
    config: Record<string, unknown>
): boolean {
    return categoryOf(project, categories, config)?.archival === true;
}

/**
 * What a board gives the rail: how many of its projects are in a row carrying `rail: true`, each
 * project filed under its own hub's words when `wordsOf` gives them and under `config` and
 * `categories` without it, and the colour `rail_color` of `config` gives, the empty text when it
 * gives none written `#rrggbb`.
 */
export function railCount(
    projects: readonly (Filed & Rooted)[],
    categories: readonly Category[],
    config: Record<string, unknown>,
    wordsOf?: WordsOf
): { count: number; color: string } {
    const filed = categoriesBy(config, wordsOf);
    const count = projects.filter((project) => {
        const own = wordsOf === undefined ? { words: config, categories } : filed(project);
        return categoryOf(project, own.categories, own.words)?.rail === true;
    }).length;
    const color = config.rail_color;
    return { count, color: typeof color === 'string' && HEX_COLOUR.test(color) ? color : '' };
}
