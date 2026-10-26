// Layer 2, client-state tests. The board views registered from the merged config's `boards:`
// (presets.ts `boardViews`): one view per board in its order, in the group of the rail entry
// carrying `project_boards`, each with its label and glyph words, and a board keyed as a view id a
// module registers or as a collection key is a finding naming it and is not registered. The config
// is oculus's own, with boards or rail entries laid on it.
//
// It does not cover the page registering the views or the catalogue drawing them, which the look
// does.

import { describe, expect, it } from 'vitest';
import { findingText } from '../../../../src/lib/data/helpers/finding-text.ts';
import { engineDir, loadConfig, textCatalog } from '../../../../src/lib/data/sources/config.ts';
import { boardViews, boardsSource } from '../../../../src/lib/state/boards/board/index.ts';

const { config: CONFIG } = loadConfig(engineDir());
const CATALOG = textCatalog(CONFIG);

/** The merged config with other boards in `boards:` after the shipped ones. */
function withBoards(boards: Record<string, unknown>): Record<string, unknown> {
    return { ...CONFIG, boards: { ...(CONFIG.boards as Record<string, unknown>), ...boards } };
}

describe('the board views', () => {
    /** The board views of a merged config, with the view ids and collection keys `taken`. */
    function viewsOf(config: Record<string, unknown>, taken: string[] = []) {
        return boardViews(
            boardsSource(config, () => 'layout.yml'),
            CATALOG,
            new Set(taken)
        );
    }

    it("registers one view per board of oculus's boards, in its order, in the Projects group", () => {
        const read = viewsOf(CONFIG);
        expect(read.findings).toEqual([]);
        expect(read.views).toEqual(
            ['projects', 'supervision', 'coauthor', 'archive', 'personal', 'software'].map(
                (id, at) => ({
                    id,
                    label: `views.${id}`,
                    glyph: `views.${id}_glyph`,
                    group: 'projects',
                    order: at + 1
                })
            )
        );
    });

    it('case 2: a seventh board in boards is a seventh view after Software in the Projects group', () => {
        const theses = { tier: 'research', label: 'views.projects', glyph: 'views.projects_glyph' };
        const read = viewsOf(withBoards({ theses }));
        expect(read.findings).toEqual([]);
        expect(read.views.at(-1)).toEqual({
            id: 'theses',
            label: 'views.projects',
            glyph: 'views.projects_glyph',
            group: 'projects',
            order: 7
        });
    });

    it('case 3: a board naming no label is drawn with its key, and no glyph with the board glyph', () => {
        const read = viewsOf(withBoards({ theses: { tier: 'research' } }));
        expect(read.views.at(-1)).toEqual({
            id: 'theses',
            label: '',
            words: 'theses',
            glyph: 'views.board_glyph',
            group: 'projects',
            order: 7
        });
    });

    it('case 4: with no rail entry carrying project_boards the boards are in no group', () => {
        const rail = (CONFIG.rail as Record<string, unknown>[]).map((entry) => ({
            ...entry,
            project_boards: false
        }));
        const read = viewsOf({ ...CONFIG, rail });
        expect(read.views.map((view) => view.group)).toEqual(['', '', '', '', '', '']);
    });

    it.each([
        { name: 'a view a module registers', key: 'focus', taken: ['focus', 'files'] },
        { name: 'a collection key', key: 'venues', taken: ['files', 'venues'] }
    ])('case 17: a board keyed as $name is a finding naming it and is not registered', (row) => {
        const read = viewsOf(withBoards({ [row.key]: { tier: 'research' } }), row.taken);
        expect(read.views.map((view) => view.id)).toEqual([
            'projects',
            'supervision',
            'coauthor',
            'archive',
            'personal',
            'software'
        ]);
        expect(read.findings).toEqual([
            {
                file: 'layout.yml',
                key: `boards.${row.key}`,
                message: findingText(CATALOG, 'findings.config.boards_view', row.key)
            }
        ]);
    });
});
