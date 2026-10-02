// What the Repositories store does for the new right-click items: the untracked files sent to the
// Trash, Add to .gitignore, Checkout (Detached), a branch and a tag from a commit, Cherry Pick,
// Delete Branch, Open File (HEAD), the compare diffs and Open Worktree. Each write is asserted by
// the action and the fields it posts, and the confirm it carries.
//
// The stores the store works through are recorders, so no component is mounted and no server runs.
// What this does NOT cover: the server's handling of each action, which tests/routes/git holds.

import { describe, expect, it } from 'vitest';
import {
    createRepositories,
    DIFF_VIEW
} from '../../../../../src/lib/state/sources/repositories/repositories.svelte.ts';
import {
    diffActs,
    diffState,
    diffUrl,
    headUrl,
    heldDiff,
    openWorktree
} from '../../../../../src/lib/state/sources/repositories/repositories.ts';
import {
    latestRead,
    refCompareUrl,
    workspaceUrl
} from '../../../../../src/lib/state/sources/repositories/diff/compare.ts';
import { engineDir, loadConfig, textCatalog } from '../../../../../src/lib/data/sources/config.ts';
import { setCatalog } from '../../../../../src/lib/state/shared/words/text.ts';
import { layoutRecorder } from '../layout-recorder.ts';
import type { TerminalsStore } from '../../../../../src/lib/state/sessions/terminals.svelte.ts';
import type {
    SendOptions,
    WriteAnswer,
    WritesStore
} from '../../../../../src/lib/state/client/writes.svelte.ts';

const ROOT = '/hub';
const HASH = 'abc1234';

const catalog = textCatalog(loadConfig(engineDir()).config);
setCatalog(catalog);

/** The three stores the view's own store works through, each a recorder the case reads. */
function harness(
    answer: (action: string) => WriteAnswer = () => ({
        ok: true,
        changed: [],
        refused: [],
        output: ''
    })
) {
    const sent: { action: string; root: string; fields: Record<string, unknown> }[] = [];
    const options: (SendOptions | undefined)[] = [];
    const opened: { view: string; state: unknown; beside: boolean }[] = [];
    const writes = {
        writeGit: (
            action: string,
            root: string,
            fields: Record<string, unknown> = {},
            sending?: SendOptions
        ) => {
            sent.push({ action, root, fields });
            options.push(sending);
            return Promise.resolve(answer(action));
        }
    } as unknown as WritesStore;
    const terminals = {} as unknown as TerminalsStore;
    const layout = layoutRecorder(opened);
    const access = {
        served: () => [{ key: 'hub', dir: ROOT }],
        instanceState: () => undefined,
        setInstanceState: () => undefined
    };
    return { store: createRepositories(writes, terminals, layout, access), sent, options, opened };
}

describe('the writes the new right-click items send', () => {
    // Revert: leave trashUntracked out of the store, or send it without the confirm.
    it('sends untracked paths to the Trash behind the confirm', async () => {
        const { store, sent } = harness();
        await store.trashUntracked(ROOT, ['u.txt', 'dir/']);
        expect(sent).toEqual([
            {
                action: 'trashUntracked',
                root: ROOT,
                fields: { paths: ['u.txt', 'dir/'], confirm: true }
            }
        ]);
    });

    // Revert: send ignore with the confirm, or open the file whatever the answer.
    it('adds paths to .gitignore with no confirm, then opens .gitignore in a source tab', async () => {
        const { store, sent, opened } = harness();
        await store.ignore(ROOT, ['a/b.txt']);
        expect(sent).toEqual([{ action: 'ignore', root: ROOT, fields: { paths: ['a/b.txt'] } }]);
        expect(opened).toEqual([
            {
                view: 'source',
                state: { root: 'hub', path: '.gitignore', label: '.gitignore' },
                beside: false
            }
        ]);
    });

    it('opens no .gitignore when the write was refused, and says why', async () => {
        const { store, opened } = harness(() => ({
            ok: false,
            changed: [],
            refused: [],
            output: '',
            error: 'the .gitignore is a link'
        }));
        await store.ignore(ROOT, ['a.txt']);
        expect(opened).toEqual([]);
        expect(store.outcome(ROOT)).toBe('the .gitignore is a link');
    });

    // Revert: send checkoutDetached without the ref, or without the confirm.
    it('checks a commit or a remote branch out detached behind the confirm', async () => {
        const { store, sent } = harness();
        await expect(store.checkoutDetached(ROOT, HASH)).resolves.toBe(true);
        await store.checkoutDetached(ROOT, 'origin/main');
        expect(sent.map((one) => [one.action, one.fields])).toEqual([
            ['checkoutDetached', { ref: HASH, confirm: true }],
            ['checkoutDetached', { ref: 'origin/main', confirm: true }]
        ]);
    });

    // Revert: drop `start` from createBranch or createTag.
    it('names the commit as the start point of a branch and a tag, and none otherwise', async () => {
        const { store, sent } = harness();
        await store.createBranch(ROOT, 'x', HASH);
        await store.createBranch(ROOT, 'y');
        await store.createTag(ROOT, 'v1', 'first', HASH);
        await store.createTag(ROOT, 'v2', '');
        expect(sent.map((one) => [one.action, one.fields])).toEqual([
            ['createBranch', { name: 'x', start: HASH, confirm: true }],
            ['createBranch', { name: 'y', confirm: true }],
            ['createTag', { name: 'v1', message: 'first', start: HASH }],
            ['createTag', { name: 'v2', message: '' }]
        ]);
    });

    // Revert: send cherryPick or deleteBranch without the confirm.
    it('cherry picks a commit and deletes a branch behind the confirm', async () => {
        const { store, sent } = harness();
        await store.cherryPick(ROOT, HASH);
        await store.deleteBranch(ROOT, 'old');
        expect(sent.map((one) => [one.action, one.fields])).toEqual([
            ['cherryPick', { ref: HASH, confirm: true }],
            ['deleteBranch', { name: 'old', confirm: true }]
        ]);
    });

    // Revert: answer 'deleted' whatever git said, or read the refusal's words instead of its code.
    it('tells a branch git keeps as not fully merged from every other refusal, by the code', async () => {
        const refusal = (code?: string, error = 'git said no') =>
            ({ ok: false, changed: [], refused: [], error, code }) as WriteAnswer;
        const merged = harness();
        await expect(merged.store.deleteBranch(ROOT, 'old')).resolves.toBe('deleted');
        const unmerged = harness(() => refusal('not-merged', 'the branch is not fully merged'));
        await expect(unmerged.store.deleteBranch(ROOT, 'old')).resolves.toBe('not-merged');
        // The question is the answer to that refusal, so the panel's outcome line stays empty.
        expect(unmerged.store.outcome(ROOT)).toBe('');
        expect(unmerged.options).toEqual([{ asked: ['not-merged'] }]);
        const other = harness(() => refusal(undefined, 'the branch is not fully merged'));
        await expect(other.store.deleteBranch(ROOT, 'old')).resolves.toBe('refused');
        expect(other.store.outcome(ROOT)).toBe('the branch is not fully merged');
    });

    // Revert: send deleteBranchAnyway without the confirm.
    it('sends the -D delete behind the confirm', async () => {
        const { store, sent } = harness();
        await store.deleteBranchAnyway(ROOT, 'old');
        expect(sent).toEqual([
            { action: 'deleteBranchAnyway', root: ROOT, fields: { name: 'old', confirm: true } }
        ]);
    });
});

describe('the tabs the new right-click items open', () => {
    // Revert: open a Changes row's HEAD file from HEAD instead of the index.
    it('opens the file at HEAD from a staged row and in the index from a changed row', () => {
        const { store, opened } = harness();
        store.openHead(ROOT, 'staged', 'src/a.ts');
        store.openHead(ROOT, 'changed', 'src/a.ts');
        expect(opened.map((one) => [one.view, one.beside])).toEqual([
            ['source', false],
            ['source', false]
        ]);
        expect(opened[0].state).toEqual({
            id: `head:head:${ROOT}:src/a.ts`,
            root: ROOT,
            path: 'src/a.ts',
            label: 'a.ts (HEAD)',
            head: 'head'
        });
        expect(opened[1].state).toEqual({
            id: `head:index:${ROOT}:src/a.ts`,
            root: ROOT,
            path: 'src/a.ts',
            label: 'a.ts (Index)',
            head: 'index'
        });
    });

    it('offers no HEAD file of an untracked row', () => {
        const { store, opened } = harness();
        store.openHead(ROOT, 'untracked', 'u.txt');
        expect(opened).toEqual([]);
    });

    it('reads the HEAD file from the head read, a literal path escaped', () => {
        expect(headUrl(ROOT, 'a b/[1].txt', 'index')).toBe(
            '/api/git?head=%2Fhub&path=a+b%2F%5B1%5D.txt&stage=index'
        );
    });

    // Revert: key the compare pane without the ref it compares against.
    it('opens a compare of a ref and a commit in a diff pane of its own, one per pair', () => {
        const { store, opened } = harness();
        store.openCompare(ROOT, 'origin/main', HASH);
        store.openCompare(ROOT, 'v1', HASH);
        expect(opened.map((one) => [one.view, one.beside])).toEqual([
            [DIFF_VIEW, true],
            [DIFF_VIEW, true]
        ]);
        const states = opened.map((one) => heldDiff(one.state));
        expect(states[0]).toMatchObject({
            root: ROOT,
            path: '',
            compare: { from: 'origin/main', to: HASH }
        });
        expect(states[0].id).not.toBe(states[1].id);
        expect(states[0].label).toBe(
            catalog['repositories.compare_label']
                .replace('{0}', 'origin/main')
                .replace('{1}', 'abc1234')
        );
        expect(diffActs(states[0])).toBe(false);
    });

    // Revert: open Compare with Workspace over the worktree's own diff.
    it('opens the main worktree file against this worktree file, read from disk', () => {
        const { store, opened } = harness();
        store.compareWorkspace(ROOT, 'src/a.ts');
        const state = heldDiff(opened[0].state);
        expect(opened[0].beside).toBe(true);
        expect(state).toMatchObject({ root: ROOT, path: 'src/a.ts', workspace: true });
        expect(diffActs(state)).toBe(false);
        expect(diffUrl(state)).toBe(workspaceUrl(ROOT, 'src/a.ts'));
    });
});

describe('the addresses of the compare reads', () => {
    it('names the files of a compare, and one file of it with its path', () => {
        expect(refCompareUrl(ROOT, 'origin/main', HASH)).toBe(
            '/api/git?compare=%2Fhub&from=origin%2Fmain&to=abc1234'
        );
        expect(refCompareUrl(ROOT, 'origin/main', HASH, 'a b.ts')).toBe(
            '/api/git?compare=%2Fhub&from=origin%2Fmain&to=abc1234&path=a+b.ts'
        );
        expect(workspaceUrl(ROOT, 'a b.ts')).toBe('/api/git?workspace=%2Fhub&path=a+b.ts');
    });

    it('reads a compare pane from the compare address', () => {
        const subject = {
            root: ROOT,
            path: '',
            staged: false,
            worktree: false,
            compare: { from: 'v1', to: HASH }
        };
        expect(diffUrl(subject)).toBe(refCompareUrl(ROOT, 'v1', HASH));
        expect(diffState(subject, 'x').id).toContain('v1');
    });

    // Revert: make latestRead answer true for every read it handed out.
    it('drops the answer of a compare read a later read for the same tab superseded', () => {
        const read = latestRead();
        const first = read();
        const second = read();
        expect(first()).toBe(false);
        expect(second()).toBe(true);
        const third = read();
        expect(second()).toBe(false);
        expect(third()).toBe(true);
    });
});

describe('Open Worktree', () => {
    function deps(added: WriteAnswer = { ok: true, changed: [], refused: [], output: '' }) {
        const calls: string[] = [];
        return {
            calls,
            deps: {
                addRoot: (dir: string) => {
                    calls.push(`add:${dir}`);
                    return Promise.resolve(added);
                },
                showInFiles: (path: string) => {
                    calls.push(`files:${path}`);
                    return 'one';
                },
                openWindow: (address: string) => calls.push(`window:${address}`),
                address: () => 'http://127.0.0.1:8787/'
            }
        };
    }

    // Revert: add the root after showing it in Files.
    it('adds the folder as a root of the workspace and shows it in Files', async () => {
        const { calls, deps: held } = deps();
        await expect(openWorktree('/hub/.agents/worktrees/a', false, held)).resolves.toBe('');
        expect(calls).toEqual(['add:/hub/.agents/worktrees/a', 'files:/hub/.agents/worktrees/a']);
    });

    // Revert: open the window before the root is added and shown.
    it('in a new window does the same, then opens the page address', async () => {
        const { calls, deps: held } = deps();
        await openWorktree('/hub/.agents/worktrees/a', true, held);
        expect(calls).toEqual([
            'add:/hub/.agents/worktrees/a',
            'files:/hub/.agents/worktrees/a',
            'window:http://127.0.0.1:8787/'
        ]);
    });

    it('takes a folder that is a root already as opened', async () => {
        const { calls, deps: held } = deps({
            ok: false,
            changed: [],
            refused: [],
            output: '',
            error: 'root-held'
        });
        await expect(openWorktree('/w', true, held)).resolves.toBe('');
        expect(calls).toEqual(['add:/w', 'files:/w', 'window:http://127.0.0.1:8787/']);
    });

    // Revert: open the window although the root was refused.
    it('opens nothing and answers the refusal when the root is refused', async () => {
        const { calls, deps: held } = deps({
            ok: false,
            changed: [],
            refused: [],
            output: '',
            error: 'no-such-dir'
        });
        await expect(openWorktree('/w', true, held)).resolves.toBe('no-such-dir');
        expect(calls).toEqual(['add:/w']);
    });
});
