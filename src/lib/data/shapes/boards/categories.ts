// Layer 1, data, pure. The categories of `categories:` in config/catalogs/vocab.yml, the one list
// of what a project is filed under on every board: a project's category is the first row, in the
// list's order, whose `stages:` and `forms:` blocks it meets, and a project no row holds has none.
// The board cards and their sections, the category facet, the rail's count and the Pillars view's
// Archival band all read a project's category through `categoryOf`, so the rule is written once
// and the boards name no categories of their own.

import { z } from 'zod';
import { mapShape, readAs, rowsShape } from '../shapes.ts';
import { blockHolds, blockOf, wordList, type WordBlock } from './words.ts';

/** One row of `categories:` as the code reads it. */
export type Category = {
    key: string;
    /** The words the row is drawn with: its `label`, or its key when it names none. */
    label: string;
    /**
     * The row's `color`, or the colour of the first stage, in the order of `stages:`, that its
     * `stages:` block takes; the empty text when it has neither.
     */
    color: string;
    stages: WordBlock | null;
    forms: WordBlock | null;
    /** `record: true`: the row is a record of the work's output. */
    record: boolean;
    /** `rail: true`: a board's rail count is the count of its projects in such rows. */
    rail: boolean;
    /** `archival: true`: the Pillars view's Archival band, and no real work. */
    archival: boolean;
};

/** A project as a category reads it: its stage and its form. */
export type Filed = { stage?: string; form?: string };

/** One row of `categories:` as written: a map with a key, its other fields read by `rowOf`. */
const rowShape = z.looseObject({ key: z.string().min(1) });

/** The colour of a stage of `stages:` in the merged config, or the empty text. */
function stageColour(stages: unknown, word: string): string {
    const row = readAs(mapShape, readAs(mapShape, stages)?.[word]);
    const colour = row?.color;
    return typeof colour === 'string' ? colour : '';
}

/** The row's own colour, else the colour of the first stage its `stages:` block takes. */
function colourOf(own: unknown, block: WordBlock | null, config: Record<string, unknown>): string {
    if (typeof own === 'string' && own.trim() !== '') return own;
    if (block === null) return '';
    const stages = config.stages;
    const first = Object.keys(readAs(mapShape, stages) ?? {}).find((word) =>
        blockHolds(block, [word], stages)
    );
    return first === undefined ? '' : stageColour(stages, first);
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
            color: colourOf(row.color, stages, config),
            stages,
            forms: blockOf(row.forms),
            record: row.record === true,
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

/** Whether a project's category carries `archival: true`, which makes it no real work. */
export function isArchival(
    project: Filed,
    categories: readonly Category[],
    config: Record<string, unknown>
): boolean {
    return categoryOf(project, categories, config)?.archival === true;
}

/**
 * What a board gives the rail: how many of its projects are in a row carrying `rail: true`, and
 * the colour of the first such row of the list, the empty text when the list has none.
 */
export function railCount(
    projects: readonly Filed[],
    categories: readonly Category[],
    config: Record<string, unknown>
): { count: number; color: string } {
    const count = projects.filter(
        (project) => categoryOf(project, categories, config)?.rail === true
    ).length;
    return { count, color: categories.find((category) => category.rail)?.color ?? '' };
}
