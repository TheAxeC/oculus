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
    askTrash,
    changeMenu,
    changePicked,
    folderMenu,
    folderPicked,
    groupMenu,
    hasMenu,
    type ChangeDeps
} from '../../../../../src/lib/views/sources/repositories/menus/change-menu.ts';
import type { BranchDeletion } from '../../../../../src/lib/state/sources/repositories/repositories.svelte.ts';
import {
    askBranchDelete,
    askTagDelete,
    commitMenu,
    graphPick,
    refKind,
    refMenu
} from '../../../../../src/lib/views/sources/repositories/menus/graph-menu.ts';
import {
    closedChoices,
    repoPick,
    repoRowMenu,
    worktreeMenu,
    worktreePick
} from '../../../../../src/lib/views/sources/repositories/menus/repo-menu.ts';

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
            ask: (message, detail, act, confirm) => {
                calls.push(`ask:${message},${detail}${confirm === undefined ? '' : `,${confirm}`}`);
                asked.push(act);
            },
            openChange: call('openChange'),
            openHead: call('openHead'),
            openFile: call('openFile'),
            stage: call('stage'),
            unstage: call('unstage'),
            discard: call('discard'),
            trash: (root: string, paths: readonly string[]) =>
                calls.push(`trash:${root},${paths.join('|')}`),
            ignore: (root: string, paths: readonly string[]) =>
                calls.push(`ignore:${root},${paths.join('|')}`),
            compareWorkspace: call('compareWorkspace'),
            reveal: call('reveal')
        }
    };
}

describe('a changed file row menu', () => {
    // Revert: drop Add to .gitignore, Open File (HEAD) or Discard Changes from changeMenu.
    it('audits that offers each group the items VS Code offers there', () => {
        expect(labels(changeMenu('changed', false, words))).toEqual([
            '@repositories.menu_open_changes',
            '@repositories.menu_open_head',
            '@repositories.open_file',
            '@repositories.menu_stage',
            '@repositories.menu_discard',
            '@repositories.menu_ignore',
            '@repositories.menu_reveal'
        ]);
        expect(labels(changeMenu('staged', false, words))).toEqual([
            '@repositories.menu_open_changes',
            '@repositories.menu_open_head',
            '@repositories.open_file',
            '@repositories.menu_unstage',
            '@repositories.menu_reveal'
        ]);
        expect(labels(changeMenu('untracked', false, words))).toEqual([
            '@repositories.open_file',
            '@repositories.menu_stage',
            '@repositories.menu_discard',
            '@repositories.menu_ignore',
            '@repositories.menu_reveal'
        ]);
    });

    // Revert: ignore `busy` in changeMenu.
    it('audits that offers no write while a write is in flight', () => {
        for (const group of ['changed', 'untracked'] as const) {
            const left = labels(changeMenu(group, true, words));
            // A write in flight blocks the discard of files, so the busy menu leaves that item out.
            expect(left).not.toContain('@repositories.menu_discard');
            // A write in flight blocks appending to the ignore file, so the busy menu omits it.
            expect(left).not.toContain('@repositories.menu_ignore');
        }
        expect(labels(changeMenu('changed', true, words))).toEqual([
            '@repositories.menu_open_changes',
            '@repositories.menu_open_head',
            '@repositories.open_file',
            '@repositories.menu_reveal'
        ]);
    });

    // Revert: return the groups flattened instead of grouped() in changeMenu.
    it('audits that draws a rule between the groups', () => {
        const rules = changeMenu('changed', false, words).map((item) => item.rule === true);
        expect(rules).toEqual([false, false, false, true, false, false, true]);
    });

    // Revert: offer Compare with Workspace without the `linked` flag.
    it('audits that offers Compare with Workspace on a linked worktree only', () => {
        for (const group of ['changed', 'staged', 'untracked'] as const) {
            // The main worktree has no other worktree to compare with, only a linked one has it.
            expect(labels(changeMenu(group, false, words))).not.toContain(
                '@repositories.menu_compare_workspace'
            );
            const linked = changeMenu(group, false, words, true);
            expect(labels(linked).at(-1)).toBe('@repositories.menu_compare_workspace');
            expect(linked.at(-1)?.rule).toBe(true);
        }
        // A read, so a write in flight does not take it away.
        expect(labels(changeMenu('changed', true, words, true))).toContain(
            '@repositories.menu_compare_workspace'
        );
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
        for (const item of changeMenu('changed', false, words, true)) {
            if (item.label !== '@repositories.menu_discard')
                changePicked(item.id, row, deps, words);
        }
        expect(calls).toEqual([
            'openChange:/r,changed,a.ts',
            'openHead:/r,changed,a.ts',
            'openFile:/r,a.ts',
            'stage:/r,a.ts',
            'ignore:/r,a.ts',
            'reveal:/r,a.ts',
            'compareWorkspace:/r,changed,a.ts'
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

    // Revert: discard an untracked path through deps.discard, which restores tracked paths only.
    it('audits that asks the Trash question for an untracked file and sends it to the Trash', () => {
        const { deps, calls, asked } = recorder();
        const discard = changeMenu('untracked', false, words).find(
            (item) => item.label === '@repositories.menu_discard'
        );
        changePicked(
            discard?.id ?? '',
            { root: '/r', group: 'untracked', path: 'u.txt' },
            deps,
            words
        );
        expect(calls).toEqual([
            'ask:@git.trash_confirm(u.txt),@git.trash_detail,@git.trash_button'
        ]);
        // Nothing moved while the question is open.
        asked[0]();
        expect(calls.at(-1)).toBe('trash:/r,u.txt');
        expect(calls.some((call) => call.startsWith('discard:'))).toBe(false);
    });

    // Revert: name the whole path in askTrash instead of the base name.
    it('audits that names the base name of a nested untracked file', () => {
        const { deps, calls } = recorder();
        askTrash('/r', ['src/deep/u.txt'], deps, words);
        expect(calls).toEqual([
            'ask:@git.trash_confirm(u.txt),@git.trash_detail,@git.trash_button'
        ]);
    });

    // Revert: ask for one path in askTrash whatever the count.
    it('audits that words the Trash question in the plural for several paths', () => {
        const { deps, calls, asked } = recorder();
        askTrash('/r', ['a.txt', 'b.txt'], deps, words);
        expect(calls).toEqual([
            'ask:@git.trash_confirm_many(2),@git.trash_detail_many,@git.trash_button'
        ]);
        asked[0]();
        expect(calls.at(-1)).toBe('trash:/r,a.txt|b.txt');
    });

    // Revert: drop the dot-slash handling: a path is handed on as the row named it.
    it('audits that hands the path of the row to Add to .gitignore as one list entry', () => {
        const { deps, calls } = recorder();
        changePicked('ignore', { root: '/r', group: 'untracked', path: 'dir/' }, deps, words);
        expect(calls).toEqual(['ignore:/r,dir/']);
    });
});

describe('a folder row menu', () => {
    // Revert: leave Discard and Add to .gitignore out of the untracked folder items.
    it('audits that offers Discard Changes and Add to .gitignore on an untracked and a changed folder', () => {
        expect(labels(folderMenu('untracked', false, words))).toEqual([
            '@repositories.menu_stage',
            '@repositories.menu_discard',
            '@repositories.menu_ignore'
        ]);
        expect(labels(folderMenu('changed', false, words))).toEqual([
            '@repositories.menu_stage',
            '@repositories.menu_discard',
            '@repositories.menu_ignore'
        ]);
        expect(labels(folderMenu('staged', false, words))).toEqual(['@repositories.menu_unstage']);
        expect(folderMenu('untracked', true, words)).toEqual([]);
    });

    function folderDeps() {
        const calls: string[] = [];
        const asked: (() => void)[] = [];
        return {
            calls,
            asked,
            deps: {
                ask: (message: string, detail: string, act: () => void, confirm?: string) => {
                    calls.push(
                        `ask:${message},${detail}${confirm === undefined ? '' : `,${confirm}`}`
                    );
                    asked.push(act);
                },
                stagePaths: (root: string, paths: readonly string[]) =>
                    calls.push(`stage:${root},${paths.join('|')}`),
                unstagePaths: (root: string, paths: readonly string[]) =>
                    calls.push(`unstage:${root},${paths.join('|')}`),
                discardPaths: (root: string, paths: readonly string[]) =>
                    calls.push(`discard:${root},${paths.join('|')}`),
                trashPaths: (root: string, paths: readonly string[]) =>
                    calls.push(`trash:${root},${paths.join('|')}`),
                ignorePaths: (root: string, paths: readonly string[]) =>
                    calls.push(`ignore:${root},${paths.join('|')}`)
            }
        };
    }

    // Revert: send an untracked folder through discardPaths.
    it('audits that sends an untracked folder to the Trash behind the question', () => {
        const { calls, asked, deps } = folderDeps();
        const target = {
            root: '/r',
            folder: 'd',
            paths: ['d/a.txt', 'd/b.txt'],
            group: 'untracked'
        };
        folderPicked('discard', target, deps, words);
        expect(calls).toEqual(['ask:@git.trash_confirm(d),@git.trash_detail,@git.trash_button']);
        asked[0]();
        expect(calls.at(-1)).toBe('trash:/r,d/a.txt|d/b.txt');
        folderPicked('ignore', target, deps, words);
        expect(calls.at(-1)).toBe('ignore:/r,d/a.txt|d/b.txt');
    });

    // Revert: name the whole folder path in the Trash question.
    it('audits that names the base name of a nested untracked folder', () => {
        const { calls, deps } = folderDeps();
        const paths = ['src/deep/a', 'src/deep/b'];
        folderPicked(
            'discard',
            { root: '/r', folder: 'src/deep', paths, group: 'untracked' },
            deps,
            words
        );
        expect(calls).toEqual(['ask:@git.trash_confirm(deep),@git.trash_detail,@git.trash_button']);
    });

    // Revert: send a changed folder through trashPaths.
    it('audits that discards a changed folder through the restore, not the Trash', () => {
        const { calls, asked, deps } = folderDeps();
        const target = { root: '/r', folder: 'd', paths: ['d/a.txt'], group: 'changed' };
        folderPicked('discard', target, deps, words);
        asked[0]();
        expect(calls.at(-1)).toBe('discard:/r,d/a.txt');
        expect(calls.some((call) => call.startsWith('trash:'))).toBe(false);
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
            '@git.stage_all_untracked',
            '@git.discard_all_untracked'
        ]);
        expect(groupMenu('changed', 0, false, words)).toEqual([]);
        expect(groupMenu('changed', 2, true, words)).toEqual([]);
    });
});

describe('a graph commit menu', () => {
    const NO_COMPARE = { upstream: '', base: '' };

    // Revert: make refKind answer 'branch' for every name.
    it('audits that holds Checkout with its local branch alone and Delete Tag with its tag', () => {
        const items = commitMenu(
            { refs: ['main', 'origin/main'], tags: ['v1'] },
            { local: ['main', 'dev'], current: 'dev', remotes: ['origin'] },
            false,
            words,
            NO_COMPARE
        );
        const checkout = items.find((item) => item.label === '@repositories.menu_checkout');
        const tags = items.find((item) => item.label === '@repositories.tag_delete');
        expect(labels(checkout?.items ?? [])).toEqual(['main']);
        expect(labels(tags?.items ?? [])).toEqual(['v1']);
    });

    // Revert: drop the `name !== branches.current` test from refKind.
    it('audits that leaves the checked-out branch out of Checkout', () => {
        const items = commitMenu(
            { refs: ['main'], tags: [] },
            { local: ['main'], current: 'main', remotes: [] },
            false,
            words,
            NO_COMPARE
        );
        // The branch is checked out already, and the Branches section offers no switch to it.
        expect(labels(items)).not.toContain('@repositories.menu_checkout');
    });

    // Revert: leave the five new items out of commitMenu.
    it('audits that offers every commit Checkout (Detached), Create Branch, Create Tag and Cherry Pick', () => {
        const items = commitMenu(
            { refs: [], tags: [] },
            { local: ['main'], current: 'main', remotes: [] },
            false,
            words,
            NO_COMPARE
        );
        expect(labels(items)).toEqual([
            '@repositories.menu_open_changes',
            '@repositories.copy_id',
            '@repositories.copy_message',
            '@repositories.menu_checkout_detached',
            '@repositories.menu_create_branch',
            '@repositories.menu_create_tag',
            '@repositories.menu_cherry_pick',
            '@repositories.menu_compare_with'
        ]);
        expect(items.map((item) => item.rule === true)).toEqual([
            false,
            true,
            false,
            true,
            false,
            false,
            true,
            true
        ]);
    });

    // Revert: offer Compare with Remote and Merge Base whatever the facts.
    it('audits that offers Compare with Remote and Merge Base when the branch has them', () => {
        const compare = (upstream: string, base: string) =>
            labels(
                commitMenu(
                    { refs: [], tags: [] },
                    { local: ['main'], current: 'main', remotes: [] },
                    false,
                    words,
                    { upstream, base }
                )
            ).filter((label) => label.startsWith('@repositories.menu_compare'));
        expect(compare('', '')).toEqual(['@repositories.menu_compare_with']);
        expect(compare('origin/main', '')).toEqual([
            '@repositories.menu_compare_remote',
            '@repositories.menu_compare_with'
        ]);
        expect(compare('', 'origin/main')).toEqual([
            '@repositories.menu_compare_base',
            '@repositories.menu_compare_with'
        ]);
        expect(compare('origin/main', 'origin/main')).toEqual([
            '@repositories.menu_compare_remote',
            '@repositories.menu_compare_base',
            '@repositories.menu_compare_with'
        ]);
    });

    // Revert: ignore `busy` in commitMenu.
    it('audits that offers no write while a write is in flight, and the compare items still', () => {
        const items = commitMenu(
            { refs: ['main'], tags: ['v1'] },
            { local: ['main'], current: '', remotes: [] },
            true,
            words,
            { upstream: 'origin/main', base: 'origin/main' }
        );
        expect(labels(items)).toEqual([
            '@repositories.menu_open_changes',
            '@repositories.copy_id',
            '@repositories.copy_message',
            '@repositories.menu_compare_remote',
            '@repositories.menu_compare_base',
            '@repositories.menu_compare_with'
        ]);
    });

    // Revert: make graphPick slice one character fewer off a checkout id.
    it('audits that hands back the name each submenu item was built from', () => {
        const items = commitMenu(
            { refs: ['feature/x'], tags: ['v1.0'] },
            { local: ['feature/x'], current: 'main', remotes: [] },
            false,
            words,
            { upstream: 'origin/main', base: 'origin/dev' }
        );
        const ids = [
            ...(items.find((item) => item.label === '@repositories.menu_checkout')?.items ?? []),
            ...(items.find((item) => item.label === '@repositories.tag_delete')?.items ?? [])
        ].map((item) => item.id);
        expect(ids.map(graphPick)).toEqual([
            { kind: 'checkout', name: 'feature/x' },
            { kind: 'delete-tag', name: 'v1.0' }
        ]);
        expect(items.map((item) => graphPick(item.id)).filter((pick) => pick !== null)).toEqual([
            { kind: 'open' },
            { kind: 'copy-id' },
            { kind: 'copy-message' },
            { kind: 'detach' },
            { kind: 'create-branch' },
            { kind: 'create-tag' },
            { kind: 'cherry-pick' },
            { kind: 'compare-remote' },
            { kind: 'compare-base' },
            { kind: 'compare-with' }
        ]);
        expect(graphPick('checkout:')).toBeNull();
    });
});

describe('a name on the graph', () => {
    // Revert: give a tag the Checkout item in refMenu.
    it('audits that offers Checkout and Delete Branch on a local branch, Detached Checkout on a remote one and Delete Tag on a tag', () => {
        const branches = { local: ['main', 'dev'], current: 'dev', remotes: ['origin'] };
        expect(refKind('main', branches)).toBe('branch');
        expect(refKind('dev', branches)).toBe('none');
        expect(refKind('origin/main', branches)).toBe('remote');
        expect(refKind('other/main', branches)).toBe('none');
        expect(labels(refMenu('main', 'branch', false, words))).toEqual([
            '@repositories.menu_checkout',
            '@repositories.menu_delete_branch'
        ]);
        expect(labels(refMenu('origin/main', 'remote', false, words))).toEqual([
            '@repositories.menu_checkout_detached'
        ]);
        expect(labels(refMenu('v1', 'tag', false, words))).toEqual(['@repositories.tag_delete']);
        expect(refMenu('v1', 'tag', true, words)).toEqual([]);
        expect(refMenu('main', 'branch', true, words)).toEqual([]);
        expect(refMenu('origin/main', 'remote', true, words)).toEqual([]);
        expect(refMenu('dev', 'none', false, words)).toEqual([]);
    });

    // Revert: make graphPick return the checkout kind for a detach id.
    it('audits that hands back the remote name and the branch name each item was built from', () => {
        const [detach] = refMenu('origin/feature/x', 'remote', false, words);
        expect(graphPick(detach.id)).toEqual({ kind: 'detach-ref', name: 'origin/feature/x' });
        const [, remove] = refMenu('feature/x', 'branch', false, words);
        expect(graphPick(remove.id)).toEqual({ kind: 'delete-branch', name: 'feature/x' });
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

    /** The two stores' writes as recorders, and the questions asked, for one Delete Branch. */
    function branchHeld(done: BranchDeletion) {
        const asked: string[] = [];
        const answers: (() => void)[] = [];
        const sent: string[] = [];
        askBranchDelete(
            'feature',
            {
                ask: (message, detail, act, confirm) => {
                    asked.push(`${message}|${detail}|${confirm}`);
                    answers.push(act);
                },
                deleteBranch: (name) => {
                    sent.push(`-d ${name}`);
                    return Promise.resolve(done);
                },
                deleteAnyway: (name) => sent.push(`-D ${name}`)
            },
            words
        );
        return { asked, answers, sent };
    }

    const FIRST =
        '@repositories.branch_delete_confirm(feature)|@repositories.branch_delete_detail|@repositories.branch_delete_button';
    const SECOND =
        '@repositories.branch_unmerged_confirm(feature)|@repositories.branch_unmerged_detail|@repositories.branch_delete_button';

    // Revert: call deps.deleteBranch before deps.ask in askBranchDelete, outside the answer.
    it('audits that asks VS Code question before deleting a branch and deletes only on its answer', async () => {
        const { asked, answers, sent } = branchHeld('deleted');
        expect(asked).toEqual([FIRST]);
        expect(sent).toEqual([]);
        answers[0]();
        await Promise.resolve();
        expect(sent).toEqual(['-d feature']);
        // A merged branch is gone after the first question, so no second one is asked.
        expect(asked).toEqual([FIRST]);
    });

    // Revert: run the -D delete without the second question, or drop the second question.
    it('audits that asks the second question for an unmerged branch and runs -D only on its yes', async () => {
        const { asked, answers, sent } = branchHeld('not-merged');
        answers[0]();
        await Promise.resolve();
        await Promise.resolve();
        expect(asked).toEqual([FIRST, SECOND]);
        expect(sent).toEqual(['-d feature']);
        answers[1]();
        expect(sent).toEqual(['-d feature', '-D feature']);
    });

    // Revert: ask the second question for every refusal and not for not-merged alone.
    it('audits that asks no second question when the first delete was refused for another reason', async () => {
        const { asked, answers, sent } = branchHeld('refused');
        answers[0]();
        await Promise.resolve();
        await Promise.resolve();
        expect(asked).toEqual([FIRST]);
        expect(sent).toEqual(['-d feature']);
    });
});

describe('a repository row and a worktree row', () => {
    // Revert: ignore `present` in repoRowMenu.
    it('audits that offers a shell and a reveal while the folder is there', () => {
        expect(labels(repoRowMenu(true, 3, words))).toEqual([
            '@repositories.menu_terminal',
            '@repositories.menu_reveal_finder',
            '@repositories.menu_close_repository',
            '@repositories.menu_close_others'
        ]);
        expect(repoRowMenu(false, 3, words).map((item) => item.label)).toEqual([
            '@repositories.menu_close_repository',
            '@repositories.menu_close_others'
        ]);
    });

    // Revert: offer Close Other Repositories with one repository listed.
    it('audits that offers Close Other Repositories only while more than one is listed', () => {
        expect(labels(repoRowMenu(true, 2, words))).toContain('@repositories.menu_close_others');
        expect(labels(repoRowMenu(true, 1, words))).toEqual([
            '@repositories.menu_terminal',
            '@repositories.menu_reveal_finder',
            '@repositories.menu_close_repository'
        ]);
    });

    // Revert: make repoPick answer the same pick for Close Repository and Close Other.
    it('audits that names what each item of a repository row does', () => {
        const picks = repoRowMenu(true, 2, words).map((item) => repoPick(item.id));
        expect(picks).toEqual(['terminal', 'reveal', 'close', 'close-others']);
        expect(repoPick('nonsense')).toBeNull();
    });

    // Revert: ignore `busy` in worktreeMenu.
    it('audits that offers a shell, both Open Worktree items and Delete Worktree, the removal not while a write is in flight', () => {
        expect(labels(worktreeMenu(false, words))).toEqual([
            '@repositories.menu_terminal',
            '@repositories.menu_open_worktree',
            '@repositories.menu_open_worktree_window',
            '@repositories.menu_delete_worktree'
        ]);
        expect(labels(worktreeMenu(true, words))).toEqual([
            '@repositories.menu_terminal',
            '@repositories.menu_open_worktree',
            '@repositories.menu_open_worktree_window'
        ]);
        expect(worktreeMenu(false, words).map((item) => worktreePick(item.id))).toEqual([
            'terminal',
            'open',
            'open-window',
            'delete'
        ]);
    });
});

describe('the Reopen Closed Repositories quick pick', () => {
    // Revert: add the separator and All Repositories for one closed repository.
    it('audits that lists a lone closed repository alone', () => {
        const rows = closedChoices(['/a'], { '/a': 'a' }, words);
        expect(rows).toEqual([{ id: '/a', label: 'a' }]);
    });

    // Revert: leave the All Repositories row out of closedChoices.
    it('audits that lists several with a separator and All Repositories after them', () => {
        const rows = closedChoices(['/a', '/b'], { '/a': 'a', '/b': 'b' }, words);
        expect(rows).toEqual([
            { id: '/a', label: 'a' },
            { id: '/b', label: 'b' },
            { id: '*', label: '@repositories.reopen_all', rule: true }
        ]);
    });

    it('audits that lists none for none closed', () => {
        expect(closedChoices([], {}, words)).toEqual([]);
    });
});
