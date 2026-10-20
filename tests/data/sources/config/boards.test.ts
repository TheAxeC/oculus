// Layer 1, data tests. The `boards` map of config/defaults/layout.yml as the config check reads
// it: the shipped map gives no finding, and each malformed form gives one finding naming the
// board, the field or the record. Findings are compared whole, in order.

import { describe, expect, it } from 'vitest';
import { engineDir, loadConfig, textCatalog } from '../../../../src/lib/data/sources/config.ts';
import { boardsFindings } from '../../../../src/lib/data/sources/config/sections/boards.ts';

const SHIPPED = loadConfig(engineDir()).config;
const CATALOG = textCatalog(SHIPPED);

/** The findings over the shipped config with `boards` replaced, each as its key and sentence. */
function said(boards: unknown): string[] {
    return boardsFindings({ ...SHIPPED, boards }, () => 'layout.yml', CATALOG).map(
        (one) => `${one.key}: ${one.message}`
    );
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
                'boards.projects.columns[0]: boards.projects.columns[0] must be a map holding its cell or its words; it is not read'
            ]
        ],
        [
            { projects: { groups: [{ label: 'idea', keys: ['nosuch'], color: '#7c5cff' }] } },
            [
                'boards.projects.groups[0].keys: boards.projects.groups[0].keys must be one of the items of the list status_chips, project_types; it is not read'
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
});
