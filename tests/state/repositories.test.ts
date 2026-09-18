// What the Repositories view computes rather than draws, and what the writes store puts on the wire
// for the three actions it added.
//
// The rules are pure and are checked as such. The store is exercised with fetch replaced, so nothing
// here starts a server or reaches a repository: what the endpoint then does with the body is
// tests/routes/git.test.ts and tests/server/git-write.test.ts.

import { afterEach, describe, expect, it, vi } from 'vitest';
import type { GitEntry, GitState } from '../../src/lib/data/model.ts';
import { git } from '../sessions-fixture.ts';
import {
    diffState,
    diffUrl,
    fileDiffUrl,
    plannedPath,
    changeGroups,
    repositoriesViewOf,
    repositoryKeyRows,
    repositoryLabels,
    pickerRoots,
    shownRoot,
    statusStyle,
    statusWordKey,
    validName,
    worktreeDiffUrl,
    worktreeLabel,
    worktreePath,
    worktreesDir
} from '../../src/lib/state/repositories.ts';
import { ignoresWorktrees, IGNORE_RULE, isWorktreePath } from '../../src/lib/data/worktrees.ts';
import { createRepositories } from '../../src/lib/state/repositories.svelte.ts';
import { createWrites } from '../../src/lib/state/writes.svelte.ts';
import { engineDir, loadConfig, textCatalog } from '../../src/lib/data/sources/config.ts';
import { setCatalog } from '../../src/lib/state/text.ts';
import type { LayoutStore } from '../../src/lib/state/layout.svelte.ts';
import type { TerminalsStore } from '../../src/lib/state/terminals.svelte.ts';
import type { WriteAnswer, WritesStore } from '../../src/lib/state/writes.svelte.ts';

const ROOT = '/hub';

// The store says what a write answered in the page's own words, so the real catalog is installed
// here as a rendered page installs it.
const catalog = textCatalog(loadConfig(engineDir()).config);
setCatalog(catalog);

describe('where a worktree goes', () => {
    it('puts one under the repository own worktrees folder, whatever the root ends with', () => {
        expect(worktreesDir(ROOT)).toBe('/hub/.agents/worktrees');
        expect(worktreesDir('/hub/')).toBe('/hub/.agents/worktrees');
        expect(worktreePath(ROOT, 'package-one')).toBe('/hub/.agents/worktrees/package-one');
        expect(plannedPath(ROOT, '  package-one  ')).toBe('/hub/.agents/worktrees/package-one');
    });

    it('takes a name that is one folder and refuses one that is not', () => {
        expect(validName('package-one')).toBe(true);
        expect(validName('a/b')).toBe(false);
        expect(validName('..')).toBe(false);
        expect(validName('-force')).toBe(false);
        expect(validName('')).toBe(false);
    });

    it('takes a resolved path of one name under the folder and nothing else', () => {
        expect(isWorktreePath(ROOT, '/hub/.agents/worktrees/one')).toBe(true);
        expect(isWorktreePath(ROOT, '/hub/.agents/worktrees')).toBe(false);
        expect(isWorktreePath(ROOT, '/hub/code/one')).toBe(false);
        expect(isWorktreePath(ROOT, '/elsewhere/.agents/worktrees/one')).toBe(false);
        // A second name under the folder, and a path that climbs back out of it, are both refused;
        // the server resolves a path before it is read here, so `..` is gone by this point.
        expect(isWorktreePath(ROOT, '/hub/.agents/worktrees/one/inner')).toBe(false);
        expect(isWorktreePath(ROOT, '/hub/.agents/worktrees/..')).toBe(false);
    });

    it('shows a worktree under its own name, and a path elsewhere as it is', () => {
        expect(worktreeLabel(ROOT, '/hub/.agents/worktrees/one')).toBe('one');
        expect(worktreeLabel(ROOT, '/elsewhere/tree')).toBe('/elsewhere/tree');
    });

    it('reads the .gitignore rule, past a comment and a missing slash', () => {
        expect(ignoresWorktrees(`build/\n${IGNORE_RULE}\n`)).toBe(true);
        expect(ignoresWorktrees('/.agents/worktrees\n')).toBe(true);
        expect(ignoresWorktrees('.agents/worktrees/\n')).toBe(true);
        expect(ignoresWorktrees(`# ${IGNORE_RULE}\n`)).toBe(false);
        expect(ignoresWorktrees('/.agents/\n')).toBe(false);
        expect(ignoresWorktrees('')).toBe(false);
    });
});

// Which repository one view shows. Each case names the change to state/repositories.ts that turns it
// red.
describe('the repository a view shows', () => {
    // Revert: return `kept` from shownRoot whether or not the channel carries it.
    it('shows the repository it keeps while the channel carries it, and the first one otherwise', () => {
        expect(shownRoot(['/hub', '/other'], '/other')).toBe('/other');
        expect(shownRoot(['/hub', '/other'], '/gone')).toBe('/hub');
        expect(shownRoot(['/hub', '/other'], '')).toBe('/hub');
        expect(shownRoot([], '/hub')).toBe('');
    });

    // Revert: default `root` to the first entry of `collapsed`.
    it('reads what the instance keeps, and a default for anything it cannot read', () => {
        expect(repositoriesViewOf({ root: '/hub', collapsed: ['log', 4] })).toEqual({
            root: '/hub',
            collapsed: ['log']
        });
        expect(repositoriesViewOf(null)).toEqual({ root: '', collapsed: [] });
        expect(repositoriesViewOf({ root: 7, collapsed: 'log' })).toEqual({
            root: '',
            collapsed: []
        });
    });

    // Revert: filter by `stateOf(root)?.repository === true` in pickerRoots.
    it('offers every root the channel carries a state for, in the channel order', () => {
        const states: Record<string, GitState> = {
            '/hub': git({ branch: 'main' }),
            '/notes': git({ branch: '', repository: false, error: 'not a git repository' }),
            '/deleted': git({
                branch: '',
                present: false,
                repository: false,
                error: 'no such directory'
            })
        };
        // `/nostate` is a root the channel names with no state of its own, the one thing dropped.
        expect(
            pickerRoots(['/hub', '/notes', '/deleted', '/nostate'], (root) => states[root] ?? null)
        ).toEqual(['/hub', '/notes', '/deleted']);
    });

    // Revert: filter by `stateOf(root)?.repository === true` in pickerRoots.
    it('keeps showing a root the reader picked after its folder was deleted', () => {
        const states: Record<string, GitState> = {
            '/hub': git({ branch: 'main' }),
            '/deleted': git({
                branch: '',
                present: false,
                repository: false,
                error: 'no such directory'
            })
        };
        const offered = pickerRoots(['/hub', '/deleted'], (root) => states[root] ?? null);
        // The reader was on the folder that has just gone, and the view stays on it rather than
        // handing itself to the hub without saying why.
        expect(shownRoot(offered, '/deleted')).toBe('/deleted');
    });

    // Revert: keep the roots whose state has `error === null` in pickerRoots.
    it('offers a repository with no commit yet and one whose read failed, and keeps showing it', () => {
        const states: Record<string, GitState> = {
            '/hub': git({ branch: 'main' }),
            '/fresh': git({ branch: 'work', log: [] }),
            '/broken': git({ branch: 'main', error: 'index file smaller than expected' }),
            '/notes': git({ branch: '', repository: false, error: 'not a git repository' })
        };
        const offered = pickerRoots(
            ['/hub', '/fresh', '/broken', '/notes'],
            (root) => states[root] ?? null
        );
        expect(offered).toEqual(['/hub', '/fresh', '/broken', '/notes']);
        // The reader was on the repository whose read has just failed, and the view stays on it.
        expect(shownRoot(offered, '/broken')).toBe('/broken');
    });

    // Revert: keep the roots whose state has `error === null` in pickerRoots.
    it('offers a root whose repository check did not answer, and keeps showing it', () => {
        // The shape server/git.ts gives a root whose `rev-parse --git-dir` timed out.
        const states: Record<string, GitState> = {
            '/hub': git({ branch: 'main' }),
            '/slow': git({ branch: '', repository: true, error: 'git timed out' })
        };
        const offered = pickerRoots(['/hub', '/slow'], (root) => states[root] ?? null);
        expect(offered).toEqual(['/hub', '/slow']);
        expect(shownRoot(offered, '/slow')).toBe('/slow');
    });

    // Revert: label every root by its last folder alone in repositoryLabels.
    it('names a repository by its last folder, and by its last two where another shares it', () => {
        expect(repositoryLabels(['/a/work/hub', '/b/other/hub', '/c/engine'])).toEqual({
            '/a/work/hub': 'work/hub',
            '/b/other/hub': 'other/hub',
            '/c/engine': 'engine'
        });
        expect(repositoryLabels(['/a/x/hub', '/b/x/hub'])).toEqual({
            '/a/x/hub': '/a/x/hub',
            '/b/x/hub': '/b/x/hub'
        });
        expect(repositoryLabels(['/'])).toEqual({ '/': '/' });
    });
});

describe('the rows of one repository', () => {
    const entry = (path: string): GitEntry => ({ path, status: 'M', added: 1, deleted: 0 });

    // Revert: keep the staged group whatever it holds, in changeGroups.
    it('leaves out an empty staged group and keeps the changed and untracked groups', () => {
        expect(changeGroups(git({ unstaged: [entry('a')] })).map((group) => group.id)).toEqual([
            'changed',
            'untracked'
        ]);
        expect(changeGroups(git({ staged: [entry('b')] })).map((group) => group.id)).toEqual([
            'staged',
            'changed',
            'untracked'
        ]);
    });

    // Revert: push the rows under a closed head as well, in repositoryKeyRows.
    it('lists each head, and under an open one its groups and rows, for the keyboard', () => {
        const held = git({
            unstaged: [entry('a.md')],
            log: [{ hash: 'h1', short: 'h1', subject: 's', when: '' }],
            branches: [{ name: 'main', upstream: '', current: true }],
            worktrees: [
                { path: '/hub', branch: 'main', head: 'h1', main: true },
                { path: '/hub/.agents/worktrees/x', branch: 'x', head: 'h2', main: false }
            ]
        });
        expect(repositoryKeyRows(held, [])).toEqual([
            { id: 'changes', parent: null, open: true },
            { id: 'group:changed', parent: 'changes', open: true },
            { id: 'change:changed:a.md', parent: 'group:changed' },
            { id: 'group:untracked', parent: 'changes', open: true },
            { id: 'log', parent: null, open: true },
            { id: 'commit:h1', parent: 'log' },
            { id: 'branches', parent: null, open: true },
            { id: 'branch:main', parent: 'branches' },
            { id: 'worktrees', parent: null, open: true },
            { id: 'worktree:/hub/.agents/worktrees/x', parent: 'worktrees' }
        ]);
        expect(repositoryKeyRows(held, ['changes', 'log']).map((row) => row.id)).toEqual([
            'changes',
            'log',
            'branches',
            'branch:main',
            'worktrees',
            'worktree:/hub/.agents/worktrees/x'
        ]);
    });

    // Revert: answer one key for every letter in statusWordKey.
    it('names each status letter by its word, and any other letter as changed', () => {
        expect(statusWordKey('M')).toBe('repositories.status_modified');
        expect(statusWordKey('?')).toBe('repositories.status_untracked');
        expect(statusWordKey('U')).toBe('repositories.status_changed');
    });

    // Revert: colour every letter grey in statusStyle.
    it('colours a status letter in its hue, and an unknown one grey', () => {
        expect(statusStyle('M')).toBe('--tone-txt: var(--c-amber-txt)');
        expect(statusStyle('?')).toBe('--tone-txt: var(--c-slate-txt)');
        expect(statusStyle('X')).toBe('--tone-txt: var(--c-grey-txt)');
    });
});

describe('what one diff pane is over', () => {
    it('names the file and the side, so two sides of one path are two panes', () => {
        const changed = diffState(
            { root: ROOT, path: 'a.txt', staged: false, worktree: false },
            'a'
        );
        const staged = diffState({ root: ROOT, path: 'a.txt', staged: true, worktree: false }, 'a');
        expect(changed.id).not.toBe(staged.id);
        expect(changed.label).toBe('a');
        expect(
            diffState({ root: ROOT, path: 'a.txt', staged: false, worktree: false }, 'a').id
        ).toBe(changed.id);
    });

    it('reads a file from the diff address and a worktree from its own', () => {
        expect(fileDiffUrl(ROOT, 'a b.txt', true)).toBe(
            '/api/git?diff=%2Fhub&path=a+b.txt&staged=1'
        );
        expect(fileDiffUrl(ROOT, 'a.txt', false)).toBe('/api/git?diff=%2Fhub&path=a.txt&staged=0');
        // The repository is named beside the worktree: a worktree of the hub is a root of its own
        // on the channel, so the server never works the repository out from the path.
        expect(worktreeDiffUrl(ROOT, '/hub/.agents/worktrees/one')).toBe(
            '/api/git?worktree=%2Fhub%2F.agents%2Fworktrees%2Fone&root=%2Fhub'
        );
        expect(
            diffUrl({
                root: ROOT,
                path: '/hub/.agents/worktrees/one',
                staged: false,
                worktree: true
            })
        ).toBe(worktreeDiffUrl(ROOT, '/hub/.agents/worktrees/one'));
    });
});

describe('the writes store over the git endpoint', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    /** What the store posted, with a canned answer for each call. */
    function record(answer: unknown = { ok: true, output: 'done' }, status = 200) {
        const sent: { url: string; body: unknown; token: string }[] = [];
        vi.stubGlobal(
            'fetch',
            (url: string, init: { body: string; headers: Record<string, string> }) => {
                sent.push({
                    url,
                    body: JSON.parse(init.body),
                    token: init.headers['x-oculus-token'] ?? ''
                });
                return Promise.resolve(
                    new Response(JSON.stringify(answer), {
                        status,
                        headers: { 'content-type': 'application/json' }
                    })
                );
            }
        );
        return sent;
    }

    it('posts each worktree action to the git endpoint with the page token', async () => {
        const sent = record();
        const writes = createWrites();
        writes.setToken('a-token');

        await writes.writeGit('createWorktree', ROOT, { name: 'one', confirm: true });
        await writes.writeGit('removeWorktree', ROOT, {
            path: '/hub/.agents/worktrees/one',
            confirm: true
        });
        const answer = await writes.writeGit('merge', ROOT, { branch: 'one', confirm: true });

        expect(sent.map((one) => one.url)).toEqual(['/api/git', '/api/git', '/api/git']);
        expect(sent.map((one) => one.token)).toEqual(['a-token', 'a-token', 'a-token']);
        expect(sent[0].body).toEqual({
            action: 'createWorktree',
            root: ROOT,
            name: 'one',
            confirm: true
        });
        expect(sent[1].body).toEqual({
            action: 'removeWorktree',
            root: ROOT,
            path: '/hub/.agents/worktrees/one',
            confirm: true
        });
        expect(sent[2].body).toEqual({ action: 'merge', root: ROOT, branch: 'one', confirm: true });
        expect(answer.ok).toBe(true);
        expect(answer.output).toBe('done');
    });

    it("carries the endpoint's own refusal back to the view", async () => {
        record({ error: 'that worktree holds uncommitted changes' }, 400);
        const writes = createWrites();
        writes.setToken('a-token');
        const answer = await writes.writeGit('removeWorktree', ROOT, {
            path: '/hub/.agents/worktrees/one',
            confirm: true
        });
        expect(answer.ok).toBe(false);
        expect(answer.error).toBe('that worktree holds uncommitted changes');
        expect(writes.lastError()).toBe('that worktree holds uncommitted changes');
    });
});

describe('what a press leaves behind', () => {
    const OTHER = '/other';

    /** The three stores the view's own store works through, each a recorder the case reads. */
    function harness(
        answers: (action: string, root: string) => Promise<WriteAnswer> = () =>
            Promise.resolve({ ok: true, changed: [], refused: [], output: '' }),
        started: TerminalsStore['startTerminal'] = () =>
            Promise.resolve({ ok: true, id: 'terminal-one', error: '' })
    ) {
        const sent: { action: string; root: string; fields: Record<string, unknown> }[] = [];
        const opened: { view: string; state: unknown; beside: boolean }[] = [];
        const shells: { kind: string; cwd: string }[] = [];
        const writes = {
            writeGit: (action: string, root: string, fields: Record<string, unknown> = {}) => {
                sent.push({ action, root, fields });
                return answers(action, root);
            }
        } as unknown as WritesStore;
        const terminals = {
            startTerminal: (kind: string, cwd: string) => {
                shells.push({ kind, cwd });
                return started(kind as 'shell', cwd);
            }
        } as unknown as TerminalsStore;
        const layout = {
            openView: (view: string, state?: unknown) => {
                opened.push({ view, state, beside: false });
                return 'one';
            },
            openBeside: (view: string, state?: unknown) => {
                opened.push({ view, state, beside: true });
                return 'one';
            }
        } as unknown as LayoutStore;
        return { store: createRepositories(writes, terminals, layout), sent, opened, shells };
    }

    it('holds one root busy at a time and leaves every other root live', async () => {
        let release: () => void = () => undefined;
        const held = new Promise<WriteAnswer>((settle) => {
            release = (): void => settle({ ok: true, changed: [], refused: [], output: '' });
        });
        const { store, sent } = harness((_action, root) =>
            root === ROOT
                ? held
                : Promise.resolve({ ok: true, changed: [], refused: [], output: '' })
        );

        const first = store.stage(ROOT, 'a.txt');
        expect(store.busy(ROOT)).toBe(true);
        expect(store.busy(OTHER)).toBe(false);

        // A second write on the same root is refused while the first is in flight; one on another
        // root is not, since the two are different repositories.
        await store.stage(ROOT, 'b.txt');
        await store.stage(OTHER, 'c.txt');
        expect(sent.map((one) => one.root)).toEqual([ROOT, OTHER]);

        release();
        await first;
        expect(store.busy(ROOT)).toBe(false);
    });

    it('asks for a shell in the worktree it just made, and opens the terminal', async () => {
        const { store, shells, opened, sent } = harness();
        await store.createWorktree(ROOT, 'package-one');
        expect(sent[0]).toEqual({
            action: 'createWorktree',
            root: ROOT,
            fields: { name: 'package-one', confirm: true }
        });
        expect(shells).toEqual([{ kind: 'shell', cwd: plannedPath(ROOT, 'package-one') }]);
        expect(opened[0].view).toBe('terminal');
        expect(opened[0].state).toEqual({ session: 'terminal-one', label: 'package-one' });
    });

    it('asks for a shell in a worktree that is already there', async () => {
        const path = plannedPath(ROOT, 'package-one');
        const { store, shells, opened } = harness();
        await store.shellIn(ROOT, path, 'package-one');
        expect(shells).toEqual([{ kind: 'shell', cwd: path }]);
        expect(opened[0].view).toBe('terminal');
    });

    it('starts no shell when the worktree was not made', async () => {
        const { store, shells } = harness(() =>
            Promise.resolve({ ok: false, changed: [], refused: [], error: 'git said no' })
        );
        await store.createWorktree(ROOT, 'package-one');
        expect(shells).toEqual([]);
        expect(store.outcome(ROOT)).toBe('git said no');
    });

    it('keeps the write sentence and says the terminal failure after it', async () => {
        const { store } = harness(undefined, () =>
            Promise.resolve({ ok: false, id: '', error: 'this run has no tmux' })
        );
        await store.createWorktree(ROOT, 'package-one');
        // The worktree is there whatever the terminal did, so both facts are on the line.
        expect(store.outcome(ROOT)).toContain('this run has no tmux');
        expect(store.outcome(ROOT)).toBe(`${catalog['git.done']} this run has no tmux`);
    });

    it('opens a diff in a pane of its own, keyed by what it is over', () => {
        const { store, opened } = harness();
        store.openDiff({ root: ROOT, path: 'a.txt', staged: false, worktree: false }, 'a.txt');
        expect(opened).toHaveLength(1);
        expect(opened[0].beside).toBe(true);
        expect(opened[0].view).toBe('repositories-diff');
        expect(opened[0].state).toMatchObject({ root: ROOT, path: 'a.txt', label: 'a.txt' });
    });

    it('carries the confirm on every write that can lose work, and on none of the others', async () => {
        const { store, sent } = harness();
        await store.stage(ROOT, 'a.txt');
        await store.unstage(ROOT, 'a.txt');
        await store.discard(ROOT, 'a.txt');
        await store.createBranch(ROOT, 'one');
        await store.switchBranch(ROOT, 'one');
        await store.removeWorktree(ROOT, plannedPath(ROOT, 'one'));
        await store.merge(ROOT, 'one');
        expect(sent.map((one) => [one.action, one.fields.confirm === true])).toEqual([
            ['stage', false],
            ['unstage', false],
            ['discard', true],
            ['createBranch', true],
            ['switchBranch', true],
            ['removeWorktree', true],
            ['merge', true]
        ]);
    });
});
