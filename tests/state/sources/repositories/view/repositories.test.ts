// What the Repositories view computes rather than draws, what the writes store puts on the wire for
// the worktree actions, and what the Source Control store sends and opens for each press.
//
// The rules are pure and are checked as such. The store is exercised with fetch replaced, so
// nothing here starts a server or reaches a repository: what the endpoint then does with the body
// is tests/routes/git/git.test.ts and tests/server/git/git-write.test.ts.

import { afterEach, describe, expect, it, vi } from 'vitest';
import { openShell } from '../../../../../src/lib/state/shared/stores/shell.ts';

// The one start-and-show path of a shell, watched so a case sees the store reach it.
vi.mock('../../../../../src/lib/state/shared/stores/shell.ts', { spy: true });
import type { GitEntry, GitState } from '../../../../../src/lib/data/model/index.ts';
import { git } from '../../../../fixtures/sessions-fixture.ts';
import {
    diffUrl,
    plannedPath,
    repositoriesViewOf,
    repositoryLabels,
    pickerRoots,
    shownRoot,
    statusStyle,
    statusWordKey,
    validName,
    worktreeLabel,
    worktreePath,
    worktreesDir,
    linkedWorktrees,
    workspaceCount
} from '../../../../../src/lib/state/sources/repositories/repositories.ts';
import {
    ignoresWorktrees,
    IGNORE_RULE,
    isWorktreePath
} from '../../../../../src/lib/data/helpers/worktrees.ts';
import {
    createRepositories,
    DIFF_VIEW,
    MERGE_VIEW
} from '../../../../../src/lib/state/sources/repositories/repositories.svelte.ts';
import { createWrites } from '../../../../../src/lib/state/client/writes.svelte.ts';
import { engineDir, loadConfig, textCatalog } from '../../../../../src/lib/data/sources/config.ts';
import { setCatalog } from '../../../../../src/lib/state/shared/words/text.ts';
import { layoutRecorder } from '../layout-recorder.ts';
import type { TerminalsStore } from '../../../../../src/lib/state/sessions/terminals.svelte.ts';
import type {
    WriteAnswer,
    WritesStore
} from '../../../../../src/lib/state/client/writes.svelte.ts';
import {
    changeGroups,
    repoListRows,
    repositoryKeyRows
} from '../../../../../src/lib/state/sources/repositories/change-tree.ts';
import {
    canPublish,
    changeCount,
    currentBranch,
    diffActs,
    diffViewOf,
    isConflict,
    repoShape,
    sameFiles,
    upstreamOf
} from '../../../../../src/lib/state/sources/repositories/repositories.ts';

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

// Which repository one view shows.
describe('the repository a view shows', () => {
    it('shows the repository it keeps while the channel carries it, and the first one otherwise', () => {
        expect(shownRoot(['/hub', '/other'], '/other')).toBe('/other');
        expect(shownRoot(['/hub', '/other'], '/gone')).toBe('/hub');
        expect(shownRoot(['/hub', '/other'], '')).toBe('/hub');
        expect(shownRoot([], '/hub')).toBe('');
    });

    it('reads what the instance keeps, and a default for anything it cannot read', () => {
        expect(
            repositoriesViewOf({ root: '/hub', collapsed: ['graph', 4], commit: 'abc' })
        ).toEqual({
            root: '/hub',
            collapsed: ['graph'],
            commit: 'abc',
            mode: 'list',
            reveal: '',
            closed: []
        });
        const none = { root: '', collapsed: [], commit: '', mode: 'list', reveal: '', closed: [] };
        expect(repositoriesViewOf(null)).toEqual(none);
        expect(repositoriesViewOf({ root: 7, collapsed: 'log', commit: 3 })).toEqual(none);
    });

    it('reads a diff pane layout and its view state per file, side by side by default', () => {
        const kept = { original: {}, modified: {}, modelState: { collapsedRegions: [] } };
        // The folds a pane opened before its diffs were Monaco's are dropped.
        const kept0 = { unchanged: 'folded', folded: [] };
        expect(diffViewOf({ mode: 'inline', opened: [4, 12] })).toEqual({
            mode: 'inline',
            views: {},
            ...kept0
        });
        expect(diffViewOf({ mode: 'odd' })).toEqual({ mode: 'side', views: {}, ...kept0 });
        expect(diffViewOf(null)).toEqual({ mode: 'side', views: {}, ...kept0 });
        // A stored view state comes back for its file, to be handed to the diff editor again.
        expect(diffViewOf({ views: { 'a.txt': kept } }, ['a.txt']).views['a.txt']).toEqual(kept);
        // One that is not an object is dropped, and so is one keyed to a file not in the diff.
        expect(diffViewOf({ views: 'scrolled' }, ['a.txt'])).toEqual({
            mode: 'side',
            views: {},
            ...kept0
        });
        expect(diffViewOf({ views: { 'a.txt': 7, 'b.txt': [] } }, ['a.txt', 'b.txt'])).toEqual({
            mode: 'side',
            views: {},
            ...kept0
        });
        expect(diffViewOf({ views: { 'a.txt': kept, 'gone.txt': kept } }, ['a.txt']).views).toEqual(
            { 'a.txt': kept }
        );
    });

    it('keeps the files of a re-read that changed nothing, so the view state stays', () => {
        const file = {
            oldPath: 'a.txt',
            newPath: 'a.txt',
            head: ['diff --git a/a.txt b/a.txt'],
            binary: false,
            encoded: true,
            original: 'a\n',
            modified: 'b\n'
        };
        expect(sameFiles([file], [{ ...file, head: [...file.head] }])).toBe(true);
        expect(sameFiles([file], [{ ...file, modified: 'c\n' }])).toBe(false);
        expect(sameFiles([file], [{ ...file, encoded: false }])).toBe(false);
        expect(sameFiles([file], [])).toBe(false);
    });

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

    it('offers a root whose repository check did not answer, and keeps showing it', () => {
        // The shape server/core/git/state.ts gives a root whose `rev-parse --git-dir` timed out.
        const states: Record<string, GitState> = {
            '/hub': git({ branch: 'main' }),
            '/slow': git({ branch: '', repository: true, error: 'git timed out' })
        };
        const offered = pickerRoots(['/hub', '/slow'], (root) => states[root] ?? null);
        expect(offered).toEqual(['/hub', '/slow']);
        expect(shownRoot(offered, '/slow')).toBe('/slow');
    });

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

    it('leaves out an empty staged group and an empty merge group, and draws Merge Changes first', () => {
        expect(changeGroups(git({ unstaged: [entry('a')] })).map((group) => group.id)).toEqual([
            'changed',
            'untracked'
        ]);
        expect(changeGroups(git({ staged: [entry('b')] })).map((group) => group.id)).toEqual([
            'staged',
            'changed',
            'untracked'
        ]);
        const merging = git({ conflicted: [{ ...entry('c'), status: 'UU' }] });
        expect(changeGroups(merging).map((group) => group.id)).toEqual([
            'merge',
            'changed',
            'untracked'
        ]);
    });

    it('lists each head, and under an open one its groups and rows, for the keyboard', () => {
        const held = git({
            unstaged: [entry('a.md')],
            log: [{ hash: 'h1', short: 'h1', subject: 's', when: '' }],
            branches: [{ name: 'main', upstream: '', current: true }],
            stashes: [
                { ref: 'stash@{0}', hash: 'd'.repeat(40), message: 'On main: wip', when: '' }
            ],
            tags: [{ name: 'v1', commit: 'h1', annotated: false, subject: '' }],
            worktrees: [
                { path: '/hub', branch: 'main', head: 'h1', main: true },
                { path: '/hub/.agents/worktrees/x', branch: 'x', head: 'h2', main: false }
            ]
        });
        const graph = [
            { id: 'commit:h1', parent: 'graph', open: true, fixed: true },
            { id: 'file:h1:a.md', parent: 'commit:h1' }
        ];
        expect(repositoryKeyRows(held, [], graph)).toEqual([
            { id: 'changes', parent: null, open: true },
            { id: 'group:changed', parent: 'changes', open: true },
            { id: 'change:changed:a.md', parent: 'group:changed' },
            { id: 'group:untracked', parent: 'changes', open: true },
            { id: 'graph', parent: null, open: true },
            { id: 'commit:h1', parent: 'graph', open: true, fixed: true },
            { id: 'file:h1:a.md', parent: 'commit:h1' },
            { id: 'stashes', parent: null, open: true },
            { id: 'stash:stash@{0}', parent: 'stashes' },
            { id: 'tags', parent: null, open: true },
            { id: 'tag:v1', parent: 'tags' },
            { id: 'branches', parent: null, open: true },
            { id: 'branch:main', parent: 'branches' },
            { id: 'worktrees', parent: null, open: true },
            { id: 'worktree:/hub/.agents/worktrees/x', parent: 'worktrees' }
        ]);
        expect(
            repositoryKeyRows(held, ['changes', 'graph', 'stashes', 'tags'], graph).map(
                (row) => row.id
            )
        ).toEqual([
            'changes',
            'graph',
            'stashes',
            'tags',
            'branches',
            'branch:main',
            'worktrees',
            'worktree:/hub/.agents/worktrees/x'
        ]);
    });

    it('lists the Repositories section head and a row per repository under it while it is open', () => {
        expect(repoListRows(['/a', '/b'], [])).toEqual([
            { id: 'repos', parent: null, open: true },
            { id: 'repo:/a', parent: 'repos' },
            { id: 'repo:/b', parent: 'repos' }
        ]);
        expect(repoListRows(['/a'], ['repos'])).toEqual([
            { id: 'repos', parent: null, open: false }
        ]);
    });

    it('names each status letter by its word, each unmerged pair by its conflict, and any other as changed', () => {
        expect(statusWordKey('M')).toBe('repositories.status_modified');
        expect(statusWordKey('?')).toBe('repositories.status_untracked');
        expect(statusWordKey('U')).toBe('repositories.status_changed');
        expect(statusWordKey('UU')).toBe('repositories.conflict_both_modified');
        expect(statusWordKey('DU')).toBe('repositories.conflict_deleted_by_us');
        expect(isConflict('AA')).toBe(true);
        expect(isConflict('A')).toBe(false);
    });

    it('colours a status letter in its Source Control hue, a conflict in its own, and an unknown one grey', () => {
        expect(statusStyle('M')).toBe('--tone-txt: var(--c-scm-modified-txt)');
        expect(statusStyle('A')).toBe('--tone-txt: var(--c-scm-added-txt)');
        expect(statusStyle('D')).toBe('--tone-txt: var(--c-scm-deleted-txt)');
        expect(statusStyle('UU')).toBe('--tone-txt: var(--c-scm-conflict-txt)');
        expect(statusStyle('?')).toBe('--tone-txt: var(--c-slate-txt)');
        expect(statusStyle('X')).toBe('--tone-txt: var(--c-grey-txt)');
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
        const shown: { id: string; label: string }[] = [];
        const revealed: { path: string; root: string | undefined }[] = [];
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
            },
            showTerminal: (id: string, label = '') => {
                shown.push({ id, label });
            }
        } as unknown as TerminalsStore;
        const kept = new Map<string, unknown>();
        const layout = layoutRecorder(opened, (path: string, at?: string) => {
            revealed.push({ path, root: at });
            return 'one';
        });
        // The hub is served under the key `hub`, so a file of it opens in a source tab; `/other`
        // is served by nothing.
        const access = {
            served: () => [{ key: 'hub', dir: ROOT }],
            instanceState: (id: string) => kept.get(id),
            setInstanceState: (id: string, state: unknown) => kept.set(id, state)
        };
        const store = createRepositories(writes, terminals, layout, access);
        return { store, sent, opened, shells, shown, kept, revealed };
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

    it('pushes the branch behind the confirm and answers whether git did, as a switch does', async () => {
        const { store, sent } = harness((action) =>
            Promise.resolve(
                action === 'switchBranch'
                    ? { ok: false, changed: [], refused: [], error: 'the working tree is dirty' }
                    : { ok: true, changed: [], refused: [], output: '' }
            )
        );
        await expect(store.push(ROOT)).resolves.toBe(true);
        expect(sent[0]).toEqual({ action: 'push', root: ROOT, fields: { confirm: true } });
        await expect(store.switchBranch(ROOT, 'draft')).resolves.toBe(false);
        expect(sent[1]).toEqual({
            action: 'switchBranch',
            root: ROOT,
            fields: { name: 'draft', confirm: true }
        });
        expect(store.outcome(ROOT)).toBe('the working tree is dirty');
    });

    it('asks for a shell in the worktree it just made, and shows the terminal', async () => {
        const { store, shells, opened, shown, sent } = harness();
        await store.createWorktree(ROOT, 'package-one');
        expect(sent[0]).toEqual({
            action: 'createWorktree',
            root: ROOT,
            fields: { name: 'package-one', confirm: true }
        });
        expect(shells).toEqual([{ kind: 'shell', cwd: plannedPath(ROOT, 'package-one') }]);
        // the terminal is shown by the terminals store, in the Terminal tab of the page on screen
        // or a new one, and nothing is opened here beside it
        expect(shown).toEqual([{ id: 'terminal-one', label: 'package-one' }]);
        expect(opened).toEqual([]);
    });

    it('asks for a shell in a worktree that is already there', async () => {
        const path = plannedPath(ROOT, 'package-one');
        const { store, shells, opened, shown } = harness();
        await store.shellIn(ROOT, path, 'package-one');
        expect(shells).toEqual([{ kind: 'shell', cwd: path }]);
        expect(shown).toEqual([{ id: 'terminal-one', label: 'package-one' }]);
        expect(opened).toEqual([]);
    });

    it('starts no shell when the worktree was not made', async () => {
        const { store, shells, shown } = harness(() =>
            Promise.resolve({ ok: false, changed: [], refused: [], error: 'git said no' })
        );
        await store.createWorktree(ROOT, 'package-one');
        expect(shells).toEqual([]);
        expect(shown).toEqual([]);
        expect(store.outcome(ROOT)).toBe('git said no');
    });

    // Revert: start and show the shell in shellIn with its own copy of openShell's body.
    it('starts the shell through the one start-and-show path', async () => {
        const path = plannedPath(ROOT, 'package-one');
        const { store } = harness();
        vi.mocked(openShell).mockClear();
        await store.shellIn(ROOT, path, 'package-one');
        expect(vi.mocked(openShell)).toHaveBeenCalledTimes(1);
        expect(vi.mocked(openShell).mock.calls[0].slice(1)).toEqual([path, 'package-one']);
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
        await store.stagePaths(ROOT, ['d/a.txt', 'd/b.txt']);
        await store.unstagePaths(ROOT, ['d/a.txt', 'd/b.txt']);
        await store.discardPaths(ROOT, ['d/a.txt', 'd/b.txt']);
        await store.createBranch(ROOT, 'one');
        await store.switchBranch(ROOT, 'one');
        await store.removeWorktree(ROOT, plannedPath(ROOT, 'one'));
        await store.merge(ROOT, 'one');
        expect(sent.map((one) => [one.action, one.fields.confirm === true])).toEqual([
            ['stage', false],
            ['unstage', false],
            ['discard', true],
            ['stage', false],
            ['unstage', false],
            ['discard', true],
            ['createBranch', true],
            ['switchBranch', true],
            ['removeWorktree', true],
            ['merge', true]
        ]);
        // one write per call, carrying every path of the folder
        expect(sent.slice(0, 6).map((one) => one.fields.paths)).toEqual([
            ['a.txt'],
            ['a.txt'],
            ['a.txt'],
            ['d/a.txt', 'd/b.txt'],
            ['d/a.txt', 'd/b.txt'],
            ['d/a.txt', 'd/b.txt']
        ]);
    });

    it('commits, amends, and commits then pushes or syncs, and clears the message after', async () => {
        const { store, sent } = harness();
        store.setMessage(ROOT, 'one');
        expect(store.message(ROOT)).toBe('one');
        await expect(store.commit(ROOT, 'commit', 'one')).resolves.toBe(true);
        expect(store.message(ROOT)).toBe('');
        await store.commit(ROOT, 'amend', 'two');
        await store.commit(ROOT, 'push', 'three');
        await store.commit(ROOT, 'sync', 'four');
        expect(sent.map((one) => [one.action, one.fields])).toEqual([
            ['commit', { message: 'one', confirm: true }],
            ['commit', { message: 'two', amend: true, confirm: true }],
            ['commit', { message: 'three', confirm: true }],
            ['push', { confirm: true }],
            ['commit', { message: 'four', confirm: true }],
            ['sync', { confirm: true }]
        ]);
    });

    it('keeps the message and pushes nothing when the commit is refused', async () => {
        const { store, sent } = harness((action) =>
            Promise.resolve(
                action === 'commit'
                    ? { ok: false, changed: [], refused: [], error: 'nothing staged' }
                    : { ok: true, changed: [], refused: [], output: '' }
            )
        );
        store.setMessage(ROOT, 'kept');
        await expect(store.commit(ROOT, 'push', 'kept')).resolves.toBe(false);
        expect(sent.map((one) => one.action)).toEqual(['commit']);
        expect(store.message(ROOT)).toBe('kept');
        expect(store.outcome(ROOT)).toBe('nothing staged');
    });

    it('fills the message from what the suggest action answers', async () => {
        const { store } = harness(() =>
            Promise.resolve({ ok: true, changed: [], refused: [], output: 'Add the thing' })
        );
        await store.suggest(ROOT);
        expect(store.message(ROOT)).toBe('Add the thing');
        expect(store.suggesting(ROOT)).toBe(false);
    });

    it('sends a hunk or a line as a patch to stage, unstage or revert, and confirms only a revert', async () => {
        const { store, sent } = harness();
        await store.applyPatch(ROOT, 'P1', 'stage');
        await store.applyPatch(ROOT, 'P2', 'unstage');
        await store.applyPatch(ROOT, 'P3', 'revert');
        expect(sent.map((one) => [one.action, one.fields])).toEqual([
            ['stagePatch', { patch: 'P1' }],
            ['unstagePatch', { patch: 'P2' }],
            ['revertPatch', { patch: 'P3', confirm: true }]
        ]);
    });

    it('acts on a whole group from its head, and confirms only Discard All Changes', async () => {
        const { store, sent } = harness();
        await store.stageAll(ROOT, 'changed');
        await store.stageAll(ROOT, 'untracked');
        await store.unstageAll(ROOT);
        await store.discardAll(ROOT);
        expect(sent.map((one) => [one.action, one.fields])).toEqual([
            ['stageAll', { group: 'changed' }],
            ['stageAll', { group: 'untracked' }],
            ['unstageAll', {}],
            ['discardAll', { confirm: true }]
        ]);
    });

    it('confirms the remote, merge, stash and tag writes that can lose work, and none of the rest', async () => {
        const { store, sent } = harness();
        await store.pull(ROOT);
        await store.fetch(ROOT);
        await store.sync(ROOT);
        await store.publish(ROOT, 'origin');
        await store.abortMerge(ROOT);
        await store.continueRebase(ROOT);
        await store.resolve(ROOT, 'a.txt', 'merged\n');
        await store.stash(ROOT, 'untracked', 'wip');
        await store.stashAct(ROOT, 'apply', 'stash@{0}');
        await store.stashAct(ROOT, 'pop', 'stash@{0}');
        await store.stashAct(ROOT, 'drop', 'stash@{1}');
        await store.createTag(ROOT, 'v1', 'first');
        await store.deleteTag(ROOT, 'v1');
        await store.pushTags(ROOT);
        expect(sent.map((one) => [one.action, one.fields])).toEqual([
            ['pull', { confirm: true }],
            ['fetch', {}],
            ['sync', { confirm: true }],
            ['publish', { remote: 'origin', confirm: true }],
            ['abortMerge', { confirm: true }],
            ['continueRebase', { confirm: true }],
            ['resolve', { path: 'a.txt', content: 'merged\n' }],
            ['stash', { mode: 'untracked', message: 'wip' }],
            ['stashApply', { ref: 'stash@{0}' }],
            ['stashPop', { ref: 'stash@{0}' }],
            ['stashDrop', { ref: 'stash@{1}', confirm: true }],
            ['createTag', { name: 'v1', message: 'first' }],
            ['deleteTag', { name: 'v1', confirm: true }],
            ['pushTags', { confirm: true }]
        ]);
    });

    it('opens a conflict in the merge editor, an untracked file in a source tab, and the rest as a diff', () => {
        const { store, opened } = harness();
        store.openChange(ROOT, 'merge', 'c.txt');
        store.openChange(ROOT, 'untracked', 'new/u.txt');
        store.openChange(ROOT, 'staged', 's.txt');
        store.openChange(ROOT, 'changed', 'm.txt');
        expect(opened.map((one) => [one.view, one.beside])).toEqual([
            [MERGE_VIEW, true],
            ['source', false],
            [DIFF_VIEW, true],
            [DIFF_VIEW, true]
        ]);
        expect(opened[0].state).toEqual({
            id: `merge:${ROOT}:c.txt`,
            root: ROOT,
            path: 'c.txt',
            label: 'c.txt'
        });
        expect(opened[1].state).toEqual({ root: 'hub', path: 'new/u.txt', label: 'u.txt' });
        expect(opened[2].state).toMatchObject({ path: 's.txt', staged: true });
        expect(opened[3].state).toMatchObject({ path: 'm.txt', staged: false });
    });

    it('opens a file at the line asked for, and says so when no served root holds it', () => {
        const { store, opened } = harness();
        expect(store.openFile(ROOT, 'a.txt', 12)).toBe(true);
        expect(opened[0].state).toEqual({ root: 'hub', path: 'a.txt', label: 'a.txt', line: 12 });
        expect(store.openFile('/other', 'b.txt')).toBe(false);
        expect(opened).toHaveLength(1);
        expect(store.outcome('/other')).toBe(
            catalog['repositories.open_unserved'].replace('{0}', 'b.txt')
        );
    });

    it('shows an untracked folder in the Files view and opens no source tab for it', () => {
        const { store, opened, revealed } = harness();
        expect(store.openFile(ROOT, 'newdir/')).toBe(true);
        expect(opened).toEqual([]);
        expect(revealed).toEqual([{ path: 'newdir', root: 'hub' }]);
        expect(store.openFile(ROOT, 'a.txt')).toBe(true);
        expect(opened).toHaveLength(1);
        expect(revealed).toHaveLength(1);
    });

    it('opens a blamed commit in the graph of the Repositories view, the graph opened', () => {
        const { store, opened, kept } = harness();
        kept.set('one', {
            root: '/elsewhere',
            collapsed: [
                'graph',
                'tags',
                `dir:${ROOT}:commit-log-def456:src`,
                `dir:${ROOT}:commit-log-abc123:lib`
            ],
            commit: ''
        });
        store.openCommit(ROOT, 'abc123');
        expect(opened[0].view).toBe('repositories');
        expect(kept.get('one')).toEqual({
            root: ROOT,
            collapsed: ['tags', `dir:${ROOT}:commit-log-abc123:lib`],
            commit: 'abc123',
            mode: 'list',
            reveal: '',
            closed: []
        });
    });
});

describe('what a branch and a diff pane offer', () => {
    it('offers Publish Branch only on a branch that tracks nothing and has a remote to go to', () => {
        expect(canPublish(git({ upstream: false, remotes: ['origin'] }))).toBe(true);
        expect(canPublish(git({ upstream: true, remotes: ['origin'] }))).toBe(false);
        expect(canPublish(git({ upstream: false, remotes: [] }))).toBe(false);
        expect(canPublish(git({ upstream: false, remotes: ['origin'], detached: true }))).toBe(
            false
        );
    });

    it('names the upstream of the branch that is checked out', () => {
        const branches = [
            { name: 'main', upstream: 'origin/main', current: false },
            { name: 'work', upstream: 'origin/work', current: true }
        ];
        expect(upstreamOf(git({ branches }))).toBe('origin/work');
        expect(upstreamOf(git())).toBe('');
    });

    it('lets a file diff act on its hunks, and not a commit, a stash or a worktree', () => {
        const file = { root: ROOT, path: 'a.txt', staged: false, worktree: false };
        expect(diffActs(file)).toBe(true);
        expect(diffActs({ ...file, staged: true })).toBe(true);
        expect(diffActs({ ...file, commit: 'abc' })).toBe(false);
        expect(diffActs({ ...file, stash: 'stash@{0}' })).toBe(false);
        expect(diffActs({ ...file, worktree: true })).toBe(false);
    });

    it('reads a commit diff and a stash diff from their own addresses', () => {
        expect(
            diffUrl({ root: ROOT, path: 'a.txt', staged: false, worktree: false, commit: 'abc' })
        ).toBe('/api/git?commit=abc&root=%2Fhub&path=a.txt');
        expect(
            diffUrl({ root: ROOT, path: '', staged: false, worktree: false, stash: 'stash@{0}' })
        ).toBe('/api/git?stash=stash%40%7B0%7D&root=%2Fhub');
    });
});

describe('the worktrees and workspaces a repository payload names', () => {
    it('are the worktrees other than the main checkout, and the workspaces counted', () => {
        const git = {
            worktrees: [
                { path: '/r', branch: 'main', main: true },
                { path: '/r/.worktrees/x', branch: 'x', main: false }
            ]
        } as unknown as Parameters<typeof linkedWorktrees>[0];
        expect(linkedWorktrees(git).map((one) => one.path)).toEqual(['/r/.worktrees/x']);
        expect(workspaceCount({ a: git, b: git })).toBe(2);
        expect(workspaceCount(null)).toBe(0);
    });
});

describe('what a repository state comes to', () => {
    const state = (over: Record<string, unknown>) =>
        ({
            present: true,
            repository: true,
            error: null,
            conflicted: [],
            staged: [],
            unstaged: [],
            untracked: [],
            ...over
        }) as unknown as Parameters<typeof repoShape>[1] & object;

    it('is one of the six shapes, told apart by the facts the channel carries', () => {
        expect(repoShape('', null)).toBe('unplaced');
        expect(repoShape('/r', null)).toBe('reading');
        expect(repoShape('/r', state({ present: false, repository: false }))).toBe('missing');
        expect(repoShape('/r', state({ repository: false }))).toBe('none');
        expect(repoShape('/r', state({ error: 'timeout' }))).toBe('failed');
        expect(repoShape('/r', state({}))).toBe('readable');
    });

    it('counts the conflicted, staged, changed and untracked files together', () => {
        const held = state({ conflicted: [{}], staged: [{}], unstaged: [{}, {}], untracked: [{}] });
        expect(changeCount(held)).toBe(5);
    });

    it('names the branch the listing marks as checked out, and none without one', () => {
        const branches = [
            { name: 'main', current: false },
            { name: 'work', current: true }
        ];
        expect(currentBranch(branches)?.name).toBe('work');
        expect(currentBranch([{ name: 'main', current: false }])).toBeNull();
    });
});
