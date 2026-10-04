// Layer 2, client-state tests. The count the rail item that opens the Repositories view carries:
// the held counts of the merge, staged, changed and untracked groups summed over the repositories
// the git channel lists (VS Code's git.countBadge "all", with oculus's separate Untracked group).
//
// What this does NOT cover: how the rail draws the badge, which tests/shell holds.

import { beforeEach, describe, expect, it } from 'vitest';
import { engineDir, loadConfig, textCatalog } from '../../../../../src/lib/data/sources/config.ts';
import { setCatalog } from '../../../../../src/lib/state/shared/words/text.ts';
import { badgeOf } from '../../../../../src/lib/state/workbench/navigation/registry.ts';
import { registerAll } from '../../../../../src/routes/views.ts';
import { present } from '../../../../fixtures/present.ts';
import { git } from '../../../../fixtures/sessions-fixture.ts';
import { createClientState, type ClientState } from '../../../../fixtures/client.ts';

const { config } = loadConfig(engineDir());
setCatalog(textCatalog(config));

let client: ClientState;

beforeEach(() => {
    client = createClientState();
    registerAll(client.registry);
});

function entries(
    count: number,
    prefix = 'f'
): { path: string; status: string; added: number; deleted: number }[] {
    return Array.from({ length: count }, (_, at) => ({
        path: `${prefix}${String(at)}.txt`,
        status: 'M',
        added: 1,
        deleted: 0
    }));
}

function put(payload: Record<string, unknown>): void {
    client.entities.receive({ channel: 'git', version: 1, payload });
}

function badge(): string {
    return badgeOf(present(client.registry.viewFor('repositories'), 'repositories view'), client)
        .text;
}

describe('the Repositories rail badge', () => {
    // Revert: count the changed group of the first repository alone.
    it('sums the groups of every listed repository', () => {
        put({
            '/a': git({ unstaged: entries(3) }),
            '/b': git({ staged: entries(2, 's'), untracked: entries(2, 'u') })
        });
        expect(badge()).toBe('7');
    });

    // Revert: count a path once however many groups hold it.
    it('counts a file staged and changed again twice', () => {
        put({
            '/a': git({ staged: entries(1), unstaged: entries(1) })
        });
        expect(badge()).toBe('2');
    });

    // Revert: leave the merge group out of the sum.
    it('counts the merge group', () => {
        put({
            '/a': git({
                conflicted: [{ path: 'c.txt', status: 'UU', added: 0, deleted: 0 }],
                unstaged: entries(1)
            })
        });
        expect(badge()).toBe('2');
    });

    // Revert: sum the lengths of the lists instead of the counts they held before the cut.
    it('counts what a cut list held, not the rows it shows', () => {
        put({
            '/a': git({
                unstaged: entries(200),
                held: { staged: 0, changes: 250, untracked: 0, merge: 0 }
            })
        });
        expect(badge()).toBe('250');
    });

    // Revert: count a root that is no repository.
    it('counts nothing for a root that is no repository', () => {
        put({
            '/a': git({ unstaged: entries(2) }),
            '/notes': git({ repository: false, error: 'not a git repository' })
        });
        expect(badge()).toBe('2');
    });

    // Revert: draw a badge of 0.
    it('draws no badge for none', () => {
        put({ '/a': git() });
        expect(badge()).toBe('');
        put({});
        expect(badge()).toBe('');
    });

    // Revert: leave a closed repository out of the sum.
    it('counts a repository a Repositories tab has closed', () => {
        put({
            '/a': git({ unstaged: entries(3) }),
            '/b': git({ staged: entries(2, 's') })
        });
        client.ui.setInstanceState('repositories-one', { root: '/a', closed: ['/b'] });
        expect(badge()).toBe('5');
    });
});
