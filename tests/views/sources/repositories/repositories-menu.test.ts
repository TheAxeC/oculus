// Layer 3, view test. The Repositories view's right-click menus, built by
// views/sources/repositories/menus/: a changed file's by its group, a group head's, a graph
// commit's with its Checkout and Delete Tag submenus, a name's on the graph, a repository row's and
// a worktree row's; and what a pick runs, a Discard and a tag's removal behind the questions the
// row controls ask.
//
// The words are a stand-in `t` that answers each key as `@key`, so an item is asserted by the key
// it is worded by.
//
// What this does NOT cover: the menus opened by a right-click or by Shift+F10, and the dialog the
// question is asked in, which need a DOM and are seen at the look.

import { describe, expect, it } from 'vitest';
import {
    changeMenu,
    changePicked,
    groupMenu,
    hasMenu,
    type ChangeDeps
} from '../../../../src/lib/views/sources/repositories/menus/change-menu.ts';
import {
    askTagDelete,
    commitMenu,
    graphPick,
    refKind,
    refMenu
} from '../../../../src/lib/views/sources/repositories/menus/graph-menu.ts';
import {
    repoRowMenu,
    worktreeMenu
} from '../../../../src/lib/views/sources/repositories/menus/repo-menu.ts';

const words = (key: string, ...args: (string | number)[]): string =>
    args.length === 0 ? `@${key}` : `@${key}(${args.join(',')})`;

const labels = (items: { label: string }[]): string[] => items.map((item) => item.label);

/** Every call a pick can make, recorded by name and arguments. */
function recorder(): { deps: ChangeDeps; calls: string[]; asked: (() => void)[] } {
    const calls: string[] = [];
    const asked: (() => void)[] = [];
    const call =
        (name: string) =>
        (...args: string[]) =>
            calls.push(`${name}:${args.join(',')}`);
    return {
        calls,
        asked,
        deps: {
            ask: (message, detail, act) => {
                calls.push(`ask:${message},${detail}`);
                asked.push(act);
            },
            openChange: call('openChange'),
            openFile: call('openFile'),
            stage: call('stage'),
            unstage: call('unstage'),
            discard: call('discard'),
            reveal: call('reveal')
        }
    };
}

describe('a changed file row menu', () => {
    // Revert: offer Discard Changes on the untracked group in changeMenu.
    it('audits that offers each group the items VS Code offers there, Untracked without Discard', () => {
        expect(labels(changeMenu('changed', false, words))).toEqual([
            '@repositories.menu_open_changes',
            '@repositories.open_file',
            '@repositories.menu_stage',
            '@repositories.menu_discard',
            '@repositories.menu_reveal'
        ]);
        expect(labels(changeMenu('staged', false, words))).toEqual([
            '@repositories.menu_open_changes',
            '@repositories.open_file',
            '@repositories.menu_unstage',
            '@repositories.menu_reveal'
        ]);
        expect(labels(changeMenu('untracked', false, words))).toEqual([
            '@repositories.open_file',
            '@repositories.menu_stage',
            '@repositories.menu_reveal'
        ]);
    });

    // Revert: ignore `busy` in changeMenu.
    it('audits that offers no write while a write is in flight', () => {
        expect(labels(changeMenu('changed', true, words))).toEqual([
            '@repositories.menu_open_changes',
            '@repositories.open_file',
            '@repositories.menu_reveal'
        ]);
    });

    // Revert: return the groups flattened instead of grouped() in changeMenu.
    it('audits that draws a rule between the groups', () => {
        const rules = changeMenu('changed', false, words).map((item) => item.rule === true);
        expect(rules).toEqual([false, false, true, false, true]);
    });

    // Revert: make hasMenu return true for 'merge'.
    it('audits that has no menu on the merge group', () => {
        expect(['changed', 'staged', 'untracked', 'merge'].map(hasMenu)).toEqual([
            true,
            true,
            true,
            false
        ]);
    });
});

describe('a pick from a changed file row menu', () => {
    // Revert: call deps.openFile for CHANGE_OPEN_CHANGES in changePicked.
    it('audits that runs the call the row control runs', () => {
        const { deps, calls } = recorder();
        const row = { root: '/r', group: 'changed', path: 'a.ts' };
        for (const item of changeMenu('changed', false, words)) {
            if (item.label !== '@repositories.menu_discard')
                changePicked(item.id, row, deps, words);
        }
        expect(calls).toEqual([
            'openChange:/r,changed,a.ts',
            'openFile:/r,a.ts',
            'stage:/r,a.ts',
            'reveal:/r,a.ts'
        ]);
    });

    // Revert: call deps.discard directly for CHANGE_DISCARD in changePicked.
    it('audits that asks the row control question before a Discard and discards only on yes', () => {
        const { deps, calls, asked } = recorder();
        const discard = changeMenu('changed', false, words).find(
            (item) => item.label === '@repositories.menu_discard'
        );
        changePicked(
            discard?.id ?? '',
            { root: '/r', group: 'changed', path: 'a.ts' },
            deps,
            words
        );
        expect(calls).toEqual(['ask:@git.discard_confirm(a.ts),@git.discard_detail']);
        asked[0]();
        expect(calls.at(-1)).toBe('discard:/r,a.ts');
    });
});

describe('a group head menu', () => {
    // Revert: drop the `count === 0` test from groupMenu.
    it('audits that offers what the head controls offer, and nothing on an empty or busy group', () => {
        expect(labels(groupMenu('changed', 2, false, words))).toEqual([
            '@git.stage_all',
            '@git.discard_all'
        ]);
        expect(labels(groupMenu('staged', 1, false, words))).toEqual(['@git.unstage_all']);
        expect(labels(groupMenu('untracked', 1, false, words))).toEqual([
            '@git.stage_all_untracked'
        ]);
        expect(groupMenu('changed', 0, false, words)).toEqual([]);
        expect(groupMenu('changed', 2, true, words)).toEqual([]);
    });
});

describe('a graph commit menu', () => {
    // Revert: make refKind answer 'branch' for every name.
    it('audits that holds Checkout with its local branch alone and Delete Tag with its tag', () => {
        const items = commitMenu(
            { refs: ['main', 'origin/main'], tags: ['v1'] },
            { local: ['main', 'dev'], current: 'dev' },
            false,
            words
        );
        expect(labels(items)).toEqual([
            '@repositories.menu_open_changes',
            '@repositories.copy_id',
            '@repositories.copy_message',
            '@repositories.menu_checkout',
            '@repositories.tag_delete'
        ]);
        expect(labels(items[3].items ?? [])).toEqual(['main']);
        expect(labels(items[4].items ?? [])).toEqual(['v1']);
    });

    // Revert: drop the `name !== branches.current` test from refKind.
    it('audits that leaves the checked-out branch out of Checkout', () => {
        const items = commitMenu(
            { refs: ['main'], tags: [] },
            { local: ['main'], current: 'main' },
            false,
            words
        );
        // The branch is checked out already, and the Branches section offers no switch to it.
        expect(labels(items)).not.toContain('@repositories.menu_checkout');
    });

    // Revert: add the Checkout item to commitMenu when it holds no branch.
    it('audits that holds neither submenu on a commit with no branch and no tag', () => {
        const items = commitMenu(
            { refs: [], tags: [] },
            { local: ['main'], current: 'main' },
            false,
            words
        );
        expect(labels(items)).toEqual([
            '@repositories.menu_open_changes',
            '@repositories.copy_id',
            '@repositories.copy_message'
        ]);
    });

    // Revert: ignore `busy` in commitMenu.
    it('audits that offers no checkout and no tag removal while a write is in flight', () => {
        const items = commitMenu(
            { refs: ['main'], tags: ['v1'] },
            { local: ['main'], current: '' },
            true,
            words
        );
        expect(labels(items)).toHaveLength(3);
    });

    // Revert: make graphPick slice one character fewer off a checkout id.
    it('audits that hands back the name each submenu item was built from', () => {
        const items = commitMenu(
            { refs: ['feature/x'], tags: ['v1.0'] },
            { local: ['feature/x'], current: 'main' },
            false,
            words
        );
        const ids = [...(items[3].items ?? []), ...(items[4].items ?? [])].map((item) => item.id);
        expect(ids.map(graphPick)).toEqual([
            { kind: 'checkout', name: 'feature/x' },
            { kind: 'delete-tag', name: 'v1.0' }
        ]);
        expect(items.slice(0, 3).map((item) => graphPick(item.id))).toEqual([
            { kind: 'open' },
            { kind: 'copy-id' },
            { kind: 'copy-message' }
        ]);
        expect(graphPick('checkout:')).toBeNull();
    });
});

describe('a name on the graph', () => {
    // Revert: give a tag the Checkout item in refMenu.
    it('audits that offers Checkout on a local branch not checked out and Delete Tag on a tag', () => {
        const branches = { local: ['main', 'dev'], current: 'dev' };
        expect(refKind('main', branches)).toBe('branch');
        expect(refKind('dev', branches)).toBe('none');
        expect(refKind('origin/main', branches)).toBe('none');
        expect(labels(refMenu('main', 'branch', false, words))).toEqual([
            '@repositories.menu_checkout'
        ]);
        expect(labels(refMenu('v1', 'tag', false, words))).toEqual(['@repositories.tag_delete']);
        expect(refMenu('v1', 'tag', true, words)).toEqual([]);
        expect(refMenu('dev', 'none', false, words)).toEqual([]);
    });

    /** A fake question that holds its answer, so the test answers it or never does. */
    function held(): {
        asked: string[];
        gone: string[];
        answers: (() => void)[];
        deps: Parameters<typeof askTagDelete>[1];
    } {
        const asked: string[] = [];
        const gone: string[] = [];
        const answers: (() => void)[] = [];
        return {
            asked,
            gone,
            answers,
            deps: {
                ask: (message, detail, act) => {
                    asked.push(`${message}|${detail}`);
                    answers.push(act);
                },
                deleteTag: (name) => gone.push(name)
            }
        };
    }

    // Revert: call deps.deleteTag before deps.ask in askTagDelete, outside the answer.
    it('audits that asks the Tags section question and deletes the tag only on its answer', () => {
        const { asked, gone, answers, deps } = held();
        askTagDelete('v1', deps, words);
        expect(asked).toEqual([
            '@repositories.tag_delete_confirm(v1)|@repositories.tag_delete_detail'
        ]);
        // The question is open, so nothing may have been deleted yet.
        expect(gone).toEqual([]);
        answers[0]();
        expect(gone).toEqual(['v1']);
    });

    // Revert: call deps.deleteTag before deps.ask in askTagDelete, outside the answer.
    it('audits that a question never answered deletes nothing', () => {
        const { asked, gone, deps } = held();
        askTagDelete('v1', deps, words);
        expect(asked).toHaveLength(1);
        // No answer came, so the tag stays.
        expect(gone).toEqual([]);
    });
});

describe('a repository row and a worktree row', () => {
    // Revert: ignore `present` in repoRowMenu.
    it('audits that offers a shell and a reveal while the folder is there', () => {
        expect(labels(repoRowMenu(true, words))).toEqual([
            '@repositories.menu_terminal',
            '@repositories.menu_reveal_finder'
        ]);
        expect(repoRowMenu(false, words)).toEqual([]);
    });

    // Revert: ignore `busy` in worktreeMenu.
    it('audits that offers a shell and Delete Worktree, the removal not while a write is in flight', () => {
        expect(labels(worktreeMenu(false, words))).toEqual([
            '@repositories.menu_terminal',
            '@repositories.menu_delete_worktree'
        ]);
        expect(labels(worktreeMenu(true, words))).toEqual(['@repositories.menu_terminal']);
    });
});
