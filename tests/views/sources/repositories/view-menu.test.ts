// Layer 4, test. The groups of the Repositories view's `...` menu that do not depend on a
// repository: the group that reopens closed repositories and the group that clones a repository of
// the reader's account, which a tab that shows no readable repository offers too.

import { describe, expect, it } from 'vitest';
import { engineDir, loadConfig, textCatalog } from '../../../../src/lib/data/sources/config.ts';
import { setCatalog, t } from '../../../../src/lib/state/shared/words/text.ts';
import { viewMenu } from '../../../../src/lib/views/sources/repositories/menus/view-menu.ts';

setCatalog(textCatalog(loadConfig(engineDir()).config));

describe('the view menu of a tab with no readable repository', () => {
    const cases: { name: string; closed: number; ids: string[] }[] = [
        { name: 'only the clone group when no repository is closed', closed: 0, ids: ['clone'] },
        {
            name: 'the reopen group, then the clone group, for a closed one',
            closed: 2,
            ids: ['closed', 'clone']
        }
    ];
    it.each(cases)('holds $name', ({ closed, ids }) => {
        expect(viewMenu(closed, null).map((group) => group.id)).toEqual(ids);
    });

    it('names the clone item Clone Repository...', () => {
        const group = viewMenu(0, null).find((one) => one.id === 'clone');
        expect(group?.items.map((item) => item.label)).toEqual([t('repositories.clone')]);
        expect(t('repositories.clone')).toBe('Clone Repository...');
    });
});
