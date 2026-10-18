// Layer 4, test. The two versions a Staged or Changes row's menu opens: Open File (HEAD) opens the
// file as the last commit holds it and Open File (Index) as it is staged, each in a read-only tab
// of its own whose saved state names that version, so a reload draws the version the reader asked
// for and the two tabs of one file never become one.

import { describe, expect, it } from 'vitest';
import { engineDir, loadConfig, textCatalog } from '../../../../src/lib/data/sources/config.ts';
import { setCatalog, t } from '../../../../src/lib/state/shared/words/text.ts';
import { changeMenu } from '../../../../src/lib/views/sources/repositories/menus/change-menu.ts';
import { headTabState } from '../../../../src/lib/state/sources/repositories/file-git.ts';
import { headOf } from '../../../../src/lib/state/sessions/source/draft.ts';
import { headUrl } from '../../../../src/lib/state/sources/repositories/repositories.ts';

setCatalog(textCatalog(loadConfig(engineDir()).config));

/** The labels of a row's menu, every group in order. */
function labels(group: 'changed' | 'staged' | 'untracked'): string[] {
    return changeMenu(group, false, t).flatMap((item) => ('label' in item ? [item.label] : []));
}

describe('the versions a row of the Changes section opens', () => {
    const rows: { row: string; group: 'changed' | 'staged' | 'untracked'; offered: string[] }[] = [
        {
            row: 'a Staged row offers Open File (HEAD) and Open File (Index)',
            group: 'staged',
            offered: ['Open File (HEAD)', 'Open File (Index)']
        },
        {
            row: 'a Changes row offers Open File (HEAD) and Open File (Index)',
            group: 'changed',
            offered: ['Open File (HEAD)', 'Open File (Index)']
        },
        { row: 'an Untracked row offers neither', group: 'untracked', offered: [] }
    ];
    it.each(rows)('$row', ({ group, offered }) => {
        const held = labels(group).filter((label) => label.startsWith('Open File ('));
        expect(held).toEqual(offered);
    });

    const stages: { row: string; stage: 'head' | 'index' }[] = [
        { row: 'the HEAD tab names HEAD after a reload and reads HEAD', stage: 'head' },
        { row: 'the Index tab names the index after a reload and reads the index', stage: 'index' }
    ];
    it.each(stages)('$row', ({ stage }) => {
        const state = headTabState('r', 'src/a.txt', stage);
        const reloaded: unknown = JSON.parse(JSON.stringify(state));
        expect(headOf(reloaded)).toBe(stage);
        expect(
            new URL(headUrl('r', 'src/a.txt', stage), 'http://x').searchParams.get('stage')
        ).toBe(stage);
    });

    it('gives the HEAD tab and the Index tab of one file two ids', () => {
        expect(headTabState('r', 'a.txt', 'head').id).not.toBe(
            headTabState('r', 'a.txt', 'index').id
        );
    });
});
