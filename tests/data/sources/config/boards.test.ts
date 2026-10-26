// Layer 1, data tests. The `boards` map of config/defaults/layout.yml and the `categories` list of
// config/catalogs/vocab.yml as the config check reads them: the shipped map and list give no
// finding, and each malformed form gives one finding naming the board, the category, the field,
// the block or the record. Findings are compared whole, in order.

import { describe, expect, it } from 'vitest';
import { engineDir, loadConfig, textCatalog } from '../../../../src/lib/data/sources/config.ts';
import {
    boardsFindings,
    categoriesFindings
} from '../../../../src/lib/data/sources/config/sections/boards.ts';
import { categoriesOf, categoryOf } from '../../../../src/lib/data/shapes/boards/categories.ts';

const SHIPPED = loadConfig(engineDir()).config;
const CATALOG = textCatalog(SHIPPED);

/** The words a board's view is named by and draws, which every board names. */
const WORDS = { label: 'views.projects', glyph: 'views.projects_glyph' };

/** The findings over the shipped config with `boards` replaced, each as its key and sentence. */
function saidOf(boards: unknown): string[] {
    return boardsFindings({ ...SHIPPED, boards }, () => 'layout.yml', CATALOG).map(
        (one) => `${one.key}: ${one.message}`
    );
}

/**
 * The findings of `saidOf` with every board that is a map given WORDS first, so a row shows the
 * findings of its own fields alone.
 */
function said(boards: unknown): string[] {
    if (boards === null || typeof boards !== 'object' || Array.isArray(boards)) {
        return saidOf(boards);
    }
    const rows = Object.entries(boards as Record<string, unknown>);
    const named = rows.map(([key, row]): [string, unknown] => [
        key,
        row !== null && typeof row === 'object' && !Array.isArray(row) ? { ...WORDS, ...row } : row
    ]);
    return saidOf(Object.fromEntries(named));
}

describe('boardsFindings', () => {
    it('reads the shipped boards with no finding', () => {
        expect(boardsFindings(SHIPPED, () => 'layout.yml', CATALOG)).toEqual([]);
    });

    it.each([
        [3, ['boards: boards must be a map; no board is read']],
        [
            { projects: 3 },
            [
                "boards.projects: boards.projects must be a map of the board's fields; the board is not read"
            ]
        ],
        [
            { projects: { tier: 'nosuch' } },
            [
                'boards.projects.tier: boards.projects.tier must be one of the items of the list tiers; it is not read'
            ]
        ],
        [
            { projects: { width: 3 } },
            [
                'boards.projects.width: boards.projects.width is not a field a board takes; it is not read'
            ]
        ],
        [
            { projects: { columns: 'title' } },
            [
                'boards.projects.columns: boards.projects.columns must be a list of maps; it is not read'
            ]
        ],
        [
            { projects: { columns: [{ label: 'Project' }] } },
            [
                'boards.projects.columns[0]: boards.projects.columns[0] must be a map holding its cell; it is not read'
            ]
        ],
        [
            { projects: { stages: { words: ['nonsense'] } } },
            [
                'boards.projects.stages.words: boards.projects.stages.words must be one of the items of the list project_stages; it is not read'
            ]
        ],
        [
            { projects: { stages: { flags: ['nonsense'] } } },
            [
                'boards.projects.stages.flags: boards.projects.stages.flags must be one of the items of the list stage_flags; it is not read'
            ]
        ],
        [
            { projects: { stages: { some: ['nascent'] } } },
            [
                'boards.projects.stages.some: boards.projects.stages.some must be one of words, not_words, flags, not_flags; it is not read'
            ]
        ],
        [
            { projects: { stages: ['nascent'] } },
            ['boards.projects.stages: boards.projects.stages must be a map; it is not read']
        ],
        [
            { projects: { forms: { flags: ['terminal'] } } },
            [
                'boards.projects.forms.flags: boards.projects.forms.flags must be one of words, not_words; it is not read'
            ]
        ],
        [
            { projects: { chips: { not_words: ['nosuch'] } } },
            [
                'boards.projects.chips.not_words: boards.projects.chips.not_words must be one of the items of the list status_chips; it is not read'
            ]
        ],
        [
            { projects: { role: ['lead', 'nosuch'] } },
            [
                'boards.projects.role: boards.projects.role must be one of the items of the list roles; it is not read'
            ]
        ],
        [{ projects: { tier: ['research', 'personal'], role: 'lead' } }, []],
        [
            { projects: { match: { nosuch: ['ecg'] } } },
            [
                'boards.projects.match.nosuch: boards.projects.match.nosuch must be one of tier, stage, form, chips, domain, pillars, funding, datasets, venue, compute, related, lead, collaborators, supervisors, tags, year; it is not read'
            ]
        ],
        [
            { projects: { match: { domain: 'ecg' } } },
            [
                'boards.projects.match.domain: boards.projects.match.domain must be a list of texts; it is not read'
            ]
        ],
        [
            { projects: { cards: 'stack' } },
            [
                'boards.projects.cards: boards.projects.cards must be one of sections, grid; it is not read'
            ]
        ],
        [
            { projects: { label_mode: 'long' } },
            [
                'boards.projects.label_mode: boards.projects.label_mode must be one of short, full; it is not read'
            ]
        ]
    ])('words the boards %j', (boards, expected) => {
        expect(said(boards)).toEqual(expected);
    });

    it.each([
        [
            'case 3: a board naming no label',
            { theses: { tier: 'research', glyph: 'views.projects_glyph' } },
            [
                'boards.theses.label: the board theses names no label; a board with no label word is drawn with its key, and one with no glyph word with the glyph views.board_glyph names'
            ]
        ],
        [
            'a board naming no glyph',
            { theses: { tier: 'research', label: 'views.projects' } },
            [
                'boards.theses.glyph: the board theses names no glyph; a board with no label word is drawn with its key, and one with no glyph word with the glyph views.board_glyph names'
            ]
        ],
        [
            'a board naming words the catalog lacks',
            { theses: { tier: 'research', label: 'views.nosuch', glyph: 'views.nosuch_glyph' } },
            [
                'boards.theses.label: the label of the board theses names views.nosuch, which the text catalog lacks; a board with no label word is drawn with its key, and one with no glyph word with the glyph views.board_glyph names',
                'boards.theses.glyph: the glyph of the board theses names views.nosuch_glyph, which the text catalog lacks; a board with no label word is drawn with its key, and one with no glyph word with the glyph views.board_glyph names'
            ]
        ]
    ])('words %s', (_, boards, expected) => {
        expect(saidOf(boards)).toEqual(expected);
    });

    it('gives no finding for a board keyed as a view id, which the page reports', () => {
        expect(saidOf({ focus: { ...WORDS, tier: 'research' } })).toEqual([]);
    });
});

/** The shipped `categories` with rows added after them. */
function withRows(...rows: unknown[]): Record<string, unknown> {
    return { ...SHIPPED, categories: [...(SHIPPED.categories as unknown[]), ...rows] };
}

/** The findings over a config, each as its key and sentence. */
function categoriesSaid(config: Record<string, unknown>): string[] {
    return categoriesFindings(config, () => 'vocab.yml', CATALOG).map(
        (one) => `${one.key}: ${one.message}`
    );
}

describe('categoriesFindings', () => {
    it('reads the shipped categories with no finding', () => {
        expect(categoriesSaid(SHIPPED)).toEqual([]);
    });

    it('reads a row added after dead-ends with no finding, the first row still holding a project', () => {
        const config = withRows({
            key: 'x',
            label: 'x',
            color: '#16a34a',
            stages: { words: ['building'] }
        });
        expect(categoriesSaid(config)).toEqual([]);
        expect(categoryOf({ stage: 'building' }, categoriesOf(config), config)?.key).toBe(
            'in-flight'
        );
    });

    it.each([
        [
            [{ key: 'y', label: 'y', forms: { words: ['poster'] } }],
            ['categories[7]: categories[7] names no color, so it is drawn in no colour']
        ],
        [
            [{ key: 'y', label: 'y', stages: { words: ['submitted'] } }],
            ['categories[7]: categories[7] names no color, so it is drawn in no colour']
        ],
        [
            [{ key: 'y', color: '#9ca3af', stages: { words: ['nonsense'] } }],
            [
                'categories[7].stages.words: categories[7].stages.words must be one of the items of the list project_stages; it is not read'
            ]
        ],
        [
            [{ key: 'idea', stages: { words: ['nascent'] } }],
            [
                'categories[7]: categories[7] must be a map with a key no earlier row holds; the row is not read'
            ]
        ],
        [
            [{ label: 'z', color: '#9ca3af' }],
            [
                'categories[7]: categories[7] must be a map with a key no earlier row holds; the row is not read'
            ]
        ]
    ])('words the added rows %j', (rows, expected) => {
        expect(categoriesSaid(withRows(...rows))).toEqual(expected);
    });

    it('words a categories that is no list', () => {
        expect(categoriesSaid({ ...SHIPPED, categories: 3 })).toEqual([
            'categories: categories must be a list of maps; no category is read'
        ]);
    });
});
