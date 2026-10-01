// What the Repositories view and its diff pane keep about themselves and what the controls of the
// view ask: the list or tree mode and the reveal request of the view's instance state, the id of a
// diff over a whole change group, the folded files and the folded unchanged runs of a diff pane,
// the paths a group holds, the reads of a group's diff made a few at a time, and the words of the
// questions the sync, pull, push and publish controls share. Pure, so each case is a value written
// out here.

import { describe, expect, it } from 'vitest';
import {
    diffActs,
    diffState,
    diffViewOf,
    groupFrom,
    groupPaths,
    groupWaits,
    publishWords,
    pullWords,
    pushWords,
    readAll,
    repositoriesViewOf,
    syncWords,
    toggleFolded,
    unfolded
} from '../../../../src/lib/state/sources/repositories/repositories.ts';
import {
    revealAsked,
    revealDue
} from '../../../../src/lib/state/sources/repositories/diff-hunks.ts';
import { engineDir, loadConfig, textCatalog } from '../../../../src/lib/data/sources/config.ts';
import { setCatalog } from '../../../../src/lib/state/shared/words/text.ts';
import { git } from '../../../fixtures/sessions-fixture.ts';

const catalog = textCatalog(loadConfig(engineDir()).config);
setCatalog(catalog);

/** A catalog sentence with its `{n}` places filled. */
function said(key: string, ...args: (string | number)[]): string {
    return args.reduce<string>(
        (text, arg, at) => text.replace(`{${String(at)}}`, String(arg)),
        catalog[key]
    );
}

const ENTRY = (path: string) => ({ path, status: 'M', added: 1, deleted: 0 });

describe('the mode of the view', () => {
    it('is the list for an absent or an unknown value and the tree only when it says tree', () => {
        expect(repositoriesViewOf({}).mode).toBe('list');
        expect(repositoriesViewOf(null).mode).toBe('list');
        expect(repositoriesViewOf({ mode: 'tree' }).mode).toBe('tree');
        expect(repositoriesViewOf({ mode: 'list' }).mode).toBe('list');
        expect(repositoriesViewOf({ mode: 'grid' }).mode).toBe('list');
        expect(repositoriesViewOf({ mode: 3 }).mode).toBe('list');
    });

    it('keeps the request to open the Branches section only as that word', () => {
        expect(repositoriesViewOf({}).reveal).toBe('');
        expect(repositoriesViewOf({ reveal: 'branches' }).reveal).toBe('branches');
        expect(repositoriesViewOf({ reveal: 'tags' }).reveal).toBe('');
        expect(repositoriesViewOf({ reveal: 4 }).reveal).toBe('');
    });
});

describe('the id of a diff over a change group', () => {
    const subject = (group: 'staged' | 'changed', root = '/hub') => ({
        root,
        path: '',
        staged: group === 'staged',
        worktree: false,
        group
    });

    it('holds the group and the root, so the staged and the changed group are two panes', () => {
        const staged = diffState(subject('staged'), 'Staged').id;
        const changed = diffState(subject('changed'), 'Changed').id;
        expect(staged).toContain('group@staged');
        expect(staged).toContain('/hub');
        expect(changed).toContain('group@changed');
        expect(staged).not.toBe(changed);
        expect(diffState(subject('staged'), 'Staged').id).toBe(staged);
    });

    it('tells the same group of two repositories apart', () => {
        expect(diffState(subject('staged'), 'a').id).not.toBe(
            diffState(subject('staged', '/other'), 'a').id
        );
    });

    it('is no id of a file, a stash or a worktree diff over the same empty path', () => {
        const group = diffState(subject('staged'), 'a').id;
        const stash = diffState(
            { root: '/hub', path: '', staged: false, worktree: false, stash: 'stash@{0}' },
            'a'
        ).id;
        const tree = diffState({ root: '/hub', path: '', staged: false, worktree: true }, 'a').id;
        const file = diffState({ root: '/hub', path: '', staged: true, worktree: false }, 'a').id;
        expect([file, stash, tree]).not.toContain(group);
    });

    it('allows no hunk action, as a stash does not', () => {
        expect(diffActs(subject('staged'))).toBe(false);
        expect(diffActs({ root: '/hub', path: 'a.ts', staged: true, worktree: false })).toBe(true);
    });
});

describe('the paths of a change group', () => {
    const state = git({
        staged: [ENTRY('a.ts'), ENTRY('b.ts')],
        unstaged: [ENTRY('c.ts')],
        untracked: [ENTRY('d.ts')]
    });

    it('are the staged paths for the staged group and the changed ones for the changed group', () => {
        expect(groupPaths(state, 'staged')).toEqual(['a.ts', 'b.ts']);
        expect(groupPaths(state, 'changed')).toEqual(['c.ts']);
        expect(groupPaths(git(), 'staged')).toEqual([]);
    });
});

describe('the old path of a renamed file of a change group', () => {
    const moved = { ...ENTRY('new.ts'), status: 'R', from: 'old.ts' };
    const state = git({ staged: [moved, ENTRY('a.ts')], unstaged: [ENTRY('c.ts')] });

    // Revert: leave groupFrom without the `from` of the entry.
    it('is the entry`s old path in its group, and the empty string for a plain change', () => {
        expect(groupFrom(state, 'staged', 'new.ts')).toBe('old.ts');
        expect(groupFrom(state, 'staged', 'a.ts')).toBe('');
        expect(groupFrom(state, 'changed', 'new.ts')).toBe('');
        expect(groupFrom(null, 'staged', 'new.ts')).toBe('');
    });
});

describe('a group diff before the git channel has answered', () => {
    it('waits while no repository is known and reads once any is, even one other than its own', () => {
        expect(groupWaits(null, [])).toBe(true);
        expect(groupWaits(null, ['/other'])).toBe(false);
        expect(groupWaits(git(), [])).toBe(false);
        expect(groupWaits(git(), ['/hub'])).toBe(false);
    });
});

describe('the reads of a group diff', () => {
    it('answer in the order of the paths and run at most the limit at once', async () => {
        let running = 0;
        let most = 0;
        const paths = Array.from({ length: 15 }, (_, at) => `f${String(at)}`);
        const answers = await readAll(paths, 6, async (path) => {
            running += 1;
            most = Math.max(most, running);
            await new Promise((settle) => setTimeout(settle, 2));
            running -= 1;
            return path.toUpperCase();
        });
        expect(answers).toEqual(paths.map((path) => path.toUpperCase()));
        expect(most).toBe(6);
    });

    it('answer for no path, and for fewer paths than the limit', async () => {
        expect(await readAll([], 6, (path) => Promise.resolve(path))).toEqual([]);
        expect(await readAll(['a', 'b'], 6, (path) => Promise.resolve(path))).toEqual(['a', 'b']);
    });
});

describe('what a diff pane keeps of its files', () => {
    it('folds the unchanged runs and no file to start with', () => {
        expect(diffViewOf({})).toEqual({
            mode: 'side',
            views: {},
            unchanged: 'folded',
            folded: []
        });
    });

    it('reads the unchanged choice and the folded files, and defaults anything it cannot read', () => {
        expect(diffViewOf({ unchanged: 'shown', folded: ['a', 'b'] })).toMatchObject({
            unchanged: 'shown',
            folded: ['a', 'b']
        });
        expect(diffViewOf({ unchanged: 'other', folded: 'a' })).toMatchObject({
            unchanged: 'folded',
            folded: []
        });
        expect(diffViewOf({ folded: ['a', 4, null] }).folded).toEqual(['a']);
    });

    it('drops a folded file that is not among the files of the diff', () => {
        expect(diffViewOf({ folded: ['a', 'gone'] }, ['a', 'b']).folded).toEqual(['a']);
        expect(diffViewOf({ folded: ['a', 'gone'] }).folded).toEqual(['a', 'gone']);
    });

    it('folds a file that is open and opens one that is folded', () => {
        expect(toggleFolded(['a'], 'b')).toEqual(['a', 'b']);
        expect(toggleFolded(['a', 'b'], 'a')).toEqual(['b']);
        expect(toggleFolded([], 'a')).toEqual(['a']);
    });

    it('opens a folded file a step lands on and leaves the rest as they were', () => {
        expect(unfolded(['a', 'b'], 'a')).toEqual(['b']);
        expect(unfolded(['a'], 'x')).toEqual(['a']);
        expect(unfolded([], 'x')).toEqual([]);
    });
});

describe('a reveal asked of a diff section', () => {
    it('is done at once by a section whose editor is drawn and has reported its changes', () => {
        expect(revealAsked(true, 2)).toEqual({ now: 2, pending: null });
    });

    it('is kept by a folded or not yet drawn section, and done when its editor reports its changes', () => {
        const asked = revealAsked(false, 3);
        expect(asked).toEqual({ now: null, pending: 3 });

        const due = revealDue(asked.pending);
        expect(due).toEqual({ now: 3, pending: null });
        // the change it landed on is done once: the next report of changes has nothing kept
        expect(revealDue(due.pending)).toEqual({ now: null, pending: null });
    });

    it("keeps each reveal asked before the editor reports as that reveal's own pending hunk", () => {
        const first = revealAsked(false, 1);
        const second = revealAsked(false, 4);

        expect(first.pending).toBe(1);
        expect(revealDue(second.pending).now).toBe(4);
    });

    it('keeps nothing for a step whose hunk is not known yet, since the pane asks again once it is', () => {
        expect(revealAsked(false, -1)).toEqual({ now: null, pending: null });
        expect(revealAsked(true, -1)).toEqual({ now: -1, pending: null });
    });

    it('does nothing when the editor reports its changes and none is kept', () => {
        expect(revealDue(null)).toEqual({ now: null, pending: null });
    });
});

describe('the questions the sync, pull, push and publish controls share', () => {
    const tracked = git({
        branch: 'main',
        ahead: 2,
        behind: 1,
        upstream: true,
        remotes: ['origin'],
        branches: [{ name: 'main', upstream: 'origin/main', current: true }]
    });

    it('name the branch and its upstream, and what the write will do', () => {
        expect(syncWords(tracked)).toEqual({
            message: said('repositories.sync_confirm', 'main', 'origin/main'),
            detail: said('repositories.sync_detail', 1, 2)
        });
        expect(pullWords(tracked)).toEqual({
            message: said('repositories.pull_confirm', 'main', 'origin/main'),
            detail: catalog['repositories.pull_detail']
        });
        expect(pushWords(tracked)).toEqual({
            message: said('git.push_confirm', 'main', 'origin/main'),
            detail: said('git.push_detail', 2)
        });
    });

    it('name the remote a branch is published to', () => {
        expect(publishWords(tracked, 'origin')).toEqual({
            message: said('repositories.publish_confirm', 'main', 'origin'),
            detail: catalog['repositories.publish_detail']
        });
    });
});
