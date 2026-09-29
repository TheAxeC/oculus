// The Repositories view rendered to HTML on the server: the Repositories section over the roots of
// the `git` channel, the one repository shown, its branch line, its commit box, and its Changes,
// Graph, Stashes, Tags, Branches and Worktrees sections with their counts and the controls of each
// row.
//
// The catalog and the glyphs are the real config; the git payload is the test's own, so the
// sections are drawn without a repository anywhere. What this does NOT cover: pressing a control,
// and the reads the graph, a diff pane and the merge editor make, none of which a server rendering
// runs. The two panes the views open are rendered here too: the diff pane with its bar (the two
// layouts, Previous Change and Next Change, Open File and the re-read) and the merge editor with
// its count of open conflicts and Complete Merge.

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'svelte/server';
import Repositories from '../../../../src/lib/views/sources/repositories/Repositories.svelte';
import Repo from '../../../../src/lib/views/sources/repositories/Repo.svelte';
import Diff from '../../../../src/lib/views/sources/repositories/diff/Diff.svelte';
import Merge from '../../../../src/lib/views/sources/repositories/merge/Merge.svelte';
import DiffSection from '../../../../src/lib/views/sources/repositories/diff/DiffSection.svelte';
import { fileKeys } from '../../../../src/lib/state/sources/repositories/repositories.ts';
import type { Component } from 'svelte';
import type { ViewProps } from '../../../../src/lib/state/workbench/navigation/registry.ts';
import { shapeBadgeTone } from '../../../../src/lib/views/shared/changes/repo-shape.ts';
import type { DiffSides, GitState } from '../../../../src/lib/data/model/index.ts';
import {
    engineDir,
    glyphCatalog,
    loadConfig,
    textCatalog
} from '../../../../src/lib/data/sources/config.ts';
import { setCatalog, setGlyphs } from '../../../../src/lib/state/shared/words/text.ts';
import type { Instance } from '../../../../src/lib/state/workbench/layout/index.ts';
import { OVERSCAN } from '../../../../src/lib/ui/tree/virtual.ts';
import { git } from '../../../fixtures/sessions-fixture.ts';
import { clientContext, createClientState, type ClientState } from '../../../fixtures/client.ts';

const { config } = loadConfig(engineDir());
const catalog = textCatalog(config);
setCatalog(catalog);
setGlyphs(glyphCatalog(config));

const HUB = '/hub';
const OTHER = '/other';

let client: ClientState;

beforeEach(() => {
    client = createClientState();
});

function instance(view = 'repositories', state: unknown = {}): Instance {
    return { id: `${view}-one`, view, state };
}

/**
 * The hub's state as these cases read it: one of each kind of change, a log, branches, a worktree.
 */
const HUB_GIT = git({
    branch: 'main',
    ahead: 2,
    staged: [{ path: 'code/one.py', status: 'M', added: 4, deleted: 1 }],
    unstaged: [{ path: 'README.md', status: 'M', added: 2, deleted: 0 }],
    untracked: [{ path: 'loose.txt', status: '?', added: 0, deleted: 0 }],
    log: [
        {
            hash: 'a'.repeat(40),
            short: 'aaaaaaa',
            subject: 'Add the thing',
            when: '2026-09-15T10:00:00+02:00'
        },
        {
            hash: 'b'.repeat(40),
            short: 'bbbbbbb',
            subject: 'Take the other thing back',
            when: '2026-09-14T10:00:00+02:00'
        }
    ],
    branches: [
        { name: 'main', upstream: 'origin/main', current: true },
        { name: 'package-one', upstream: '', current: false }
    ],
    worktrees: [
        { path: HUB, branch: 'main', head: 'a'.repeat(40), main: true },
        {
            path: `${HUB}/.agents/worktrees/package-one`,
            branch: 'package-one',
            head: 'c'.repeat(40),
            main: false
        }
    ],
    ignoresWorktrees: true
});

function hold(payload: Record<string, unknown>): void {
    client.entities.receive({ channel: 'git', version: 1, payload });
    client.entities.receive({
        channel: 'config',
        version: 1,
        payload: { config, text: catalog, findings: [] }
    });
}

function html(
    payload: Record<string, unknown>,
    view = 'repositories',
    state: unknown = {}
): string {
    hold(payload);
    // The view reads what it keeps from the ui store, which is where its own presses write it.
    client.ui.setInstanceState(`${view}-one`, state);
    return render(Repositories, {
        context: clientContext(client),
        props: { instance: instance(view, state) }
    }).body;
}

function count(body: string, needle: string): number {
    return body.split(needle).length - 1;
}

/**
 * One repository partial rendered on its own, for a state the view around it would have to be put
 * into a particular shape to hand it. The cases that go through the whole view are above.
 */
function repo(state: GitState, root = OTHER): string {
    hold({ [root]: state });
    const noop = (): void => undefined;
    return render(Repo, {
        context: clientContext(client),
        props: {
            root,
            git: state,
            collapsed: [],
            commit: '',
            ontoggle: noop,
            oncommit: noop,
            ask: noop,
            onswitch: noop,
            onbranch: noop,
            onworktree: noop,
            onremove: noop,
            onmerge: noop,
            onterminal: noop
        }
    }).body;
}

/** The markup of one section of a rendering, from its group attribute to the next group. */
function group(body: string, id: string): string {
    const at = body.indexOf(`data-group="${id}"`);
    if (at < 0) return '';
    const next = body.indexOf('data-group=', at + 1);
    return body.slice(at, next < 0 ? undefined : next);
}

describe('the Repositories view', () => {
    it('audits that maps each repository picker status to its own tone and a readable repository to none', () => {
        expect([
            shapeBadgeTone('missing'),
            shapeBadgeTone('failed'),
            shapeBadgeTone('none'),
            shapeBadgeTone('readable')
        ]).toEqual(['red', 'amber', 'blue', undefined]);
    });

    it('says nothing is on the channel before the first payload', () => {
        const body = render(Repositories, {
            context: clientContext(client),
            props: { instance: instance() }
        }).body;
        expect(body).toContain(catalog['repositories.empty']);
    });

    it('draws one repository, the first root the channel carries while the instance keeps none', () => {
        const body = html({ [HUB]: HUB_GIT, [OTHER]: git({ branch: 'work' }) });
        expect(body).toContain(`data-root="${HUB}"`);
        // one repository is drawn at a time, and the instance keeps none, so it is the first root
        expect(body).not.toContain(`data-root="${OTHER}"`);
        expect(count(body, 'data-root=')).toBe(1);
    });

    it('draws the repository the instance keeps, and the first one when that one has gone', () => {
        const kept = html({ [HUB]: HUB_GIT, [OTHER]: git({ branch: 'work' }) }, 'repositories', {
            root: OTHER
        });
        expect(kept).toContain(`data-root="${OTHER}"`);
        // one repository is drawn at a time, and the instance keeps the other one
        expect(kept).not.toContain(`data-root="${HUB}"`);

        const gone = html({ [HUB]: HUB_GIT }, 'repositories', { root: OTHER });
        expect(gone).toContain(`data-root="${HUB}"`);
    });

    it('lists every root in the Repositories section, each by its name, the one shown as current', () => {
        const body = html({ [HUB]: HUB_GIT, [OTHER]: git({ branch: 'work' }) }, 'repositories', {
            root: OTHER
        });
        const list = group(body, 'repos');
        expect(list).toContain(`aria-label="${catalog['repositories.list']}"`);
        expect(count(list, 'data-repo-row=')).toBe(2);
        const other = list.slice(list.indexOf(`data-repo-row="${OTHER}"`));
        const row = other.slice(0, other.indexOf('</li>'));
        expect(row).toContain('aria-label="other"');
        expect(row).toContain('aria-current="true"');
        const hub = list.slice(list.indexOf(`data-repo-row="${HUB}"`));
        // The view shows one repository at a time, so only the kept one is drawn in force.
        expect(hub.slice(0, hub.indexOf('</li>'))).not.toContain('aria-current="true"');
    });

    it('says on each row its branch, its distance from the upstream and how many paths it changed', () => {
        const body = html({ [HUB]: { ...HUB_GIT, upstream: true } });
        const row = group(body, 'repos');
        expect(row).toContain(
            catalog['repositories.list_sync'].replace('{0}', '0').replace('{1}', '2')
        );
        expect(row).toContain(
            `title="${catalog['repositories.list_changes'].replace('{0}', '3')}"`
        );
    });

    it('draws the branch line with the distance from the upstream', () => {
        const body = html({ [HUB]: HUB_GIT });
        expect(body).toContain('main');
        expect(body).toContain(catalog['sessions.ch_ahead'].replace('{0}', '2'));
    });

    it('says in step on the branch line only for a branch with an upstream', () => {
        // A repository with no commit yet has no upstream, and reads the line saying so instead.
        const fresh = html({ [HUB]: git({ branch: 'start', log: [], branches: [] }) });
        expect(fresh).toContain('>start<');
        // Nothing to be in step with, so the line about tracking must not be drawn at all.
        expect(fresh).not.toContain(catalog['sessions.ch_insync']);

        const tracked = html({ [HUB]: git({ upstream: true }) });
        expect(tracked).toContain(catalog['sessions.ch_insync']);
    });

    it('says a folder that is not there is not there, and one that is no repository is neither', () => {
        const reason = 'no such directory';
        const away = repo(git({ branch: '', present: false, repository: false, error: reason }));
        expect(away).toContain('data-repo="missing"');
        expect(away).toContain(catalog['sessions.ch_nofolder']);
        // One drawing per root: a folder that is gone says so and never also says a read failed.
        expect(away).not.toContain(catalog['sessions.ch_failed'].replace('{0}', reason));

        const norepo = 'not a git repository';
        const folder = repo(git({ branch: '', repository: false, error: norepo }));
        expect(folder).toContain('data-repo="none"');
        expect(folder).toContain(catalog['sessions.ch_norepo']);
        // The folder is there, so nothing may tell the reader it has gone.
        expect(folder).not.toContain(catalog['sessions.ch_nofolder']);
        // Being no repository is not a read that failed, and the two sentences never both appear.
        expect(folder).not.toContain(catalog['sessions.ch_failed'].replace('{0}', norepo));
    });

    it('draws the Changes section with its count and the three groups with theirs', () => {
        const changes = group(html({ [HUB]: HUB_GIT }), 'changes');
        expect(changes).toContain(`aria-label="${catalog['repositories.changes']}"`);
        expect(changes).toContain('>3</span>');
        expect(changes).toContain(catalog['sessions.ch_staged']);
        expect(changes).toContain(catalog['sessions.ch_changed']);
        expect(changes).toContain(catalog['sessions.ch_untracked']);
        expect(count(changes, '>1</span>')).toBe(3);
    });

    it('draws each change row with its diff, Open File, its staging and, for a changed path, its discard', () => {
        const changes = group(html({ [HUB]: HUB_GIT }), 'changes');
        expect(changes).toContain('data-entry="code/one.py"');
        expect(changes).toContain('one.py');
        // An untracked path has no diff: its row opens the file itself.
        expect(count(changes, `aria-label="${catalog['repositories.diff']}"`)).toBe(2);
        expect(count(changes, `aria-label="${catalog['repositories.open_file']}"`)).toBe(3);
        expect(changes).toContain(catalog['repositories.open_file_title']);
        // The row itself and its diff control each say which side they show.
        expect(count(changes, catalog['repositories.diff_staged_title'])).toBe(2);
        // A row is named by its whole path, so two README.md files do not sound the same.
        expect(changes).toContain(
            `aria-label="code/one.py, ${catalog['repositories.status_modified']}"`
        );
        expect(count(changes, `aria-label="${catalog['git.unstage']}"`)).toBe(1);
        expect(count(changes, `aria-label="${catalog['git.stage']}"`)).toBe(2);
        expect(count(changes, `aria-label="${catalog['git.discard']}"`)).toBe(1);
    });

    it('draws no row of a group or a section the instance keeps closed', () => {
        const body = html({ [HUB]: HUB_GIT }, 'repositories', { collapsed: ['staged', 'graph'] });
        // the staged group is closed, so its rows are not drawn
        expect(body).not.toContain('data-entry="code/one.py"');
        expect(body).toContain('data-entry="README.md"');
        expect(group(body, 'graph')).toContain('aria-expanded="false"');
    });

    it('draws the commit box above the sections, with the Commit button and its list', () => {
        const body = html({ [HUB]: HUB_GIT });
        const box = body.indexOf('data-commit-box');
        expect(box).toBeGreaterThan(0);
        expect(box).toBeLessThan(body.indexOf('data-group="changes"'));
        expect(body).toContain(`aria-label="${catalog['git.commit_more']}"`);
    });

    it('draws the Graph section, whose commits the page reads when it opens', () => {
        const graph = group(html({ [HUB]: HUB_GIT }), 'graph');
        expect(graph).toContain(`aria-label="${catalog['repositories.graph']}"`);
        // A server rendering reads nothing, so the section says it holds no commit yet.
        expect(graph).toContain(catalog['repositories.log_empty']);
    });

    // Revert: draw `{#each group.entries}` in Changes.svelte, or `{#each commits}` in
    // graph/Graph.svelte, straight into the section rather than through
    // ui/tree/VirtualRows.svelte, or set `shown` to `count` in ui/tree/virtual.ts's firstWindow.
    // An audit of the markup: a server rendering has no scroll box, so each list draws its first
    // window and holds the rest after it; which rows a browser draws once scrolled it says nothing
    // of, and the Graph, which reads its commits only in a browser, draws an empty list.
    it('audits that draws the first changed files of a long group and holds the rest in a spacer after them', () => {
        const loose = Array.from({ length: 30 }, (_, at) => ({
            path: `loose/f${String(at).padStart(2, '0')}.txt`,
            status: '?',
            added: 0,
            deleted: 0
        }));
        const body = html({ [HUB]: { ...HUB_GIT, untracked: loose } });
        const changes = group(body, 'changes');
        const graph = group(body, 'graph');
        const shown = OVERSCAN * 2;

        expect(count(changes, 'data-virtual="before"')).toBe(3);
        expect(count(changes, 'data-virtual="after"')).toBe(3);
        expect(count(changes, 'data-entry="loose/')).toBe(shown);
        expect(changes).toContain(`data-entry="loose/f${String(shown - 1).padStart(2, '0')}.txt"`);
        // The group draws its files from the first, so the window ends on the tenth: the eleventh
        // is past the rows a list draws before it has found its scroll box.
        expect(changes).not.toContain(`data-entry="loose/f${String(shown).padStart(2, '0')}.txt"`);
        const last = changes.lastIndexOf('data-virtual="after"');
        expect(last).toBeGreaterThan(changes.lastIndexOf('data-entry="loose/'));
        expect(changes.slice(last, changes.indexOf('>', last))).toContain(
            `calc(${String(30 - shown)} * var(--tree-row)`
        );
        const staged = changes.indexOf('data-entry="code/one.py"');
        expect(staged).toBeGreaterThan(changes.indexOf('data-virtual="before"'));
        expect(staged).toBeLessThan(changes.indexOf('data-virtual="after"'));
        expect(count(graph, 'data-virtual="before"')).toBe(1);
        expect(count(graph, 'data-virtual="after"')).toBe(1);
    });

    it('lists the stashes, each with Apply, Pop and Drop, and says when there is none', () => {
        const held = {
            ...HUB_GIT,
            stashes: [{ ref: 'stash@{0}', hash: 'd'.repeat(40), message: 'On main: wip', when: '' }]
        };
        const stashes = group(html({ [HUB]: held }), 'stashes');
        expect(stashes).toContain('data-stash="stash@{0}"');
        expect(stashes).toContain('On main: wip');
        expect(stashes).toContain(`aria-label="${catalog['repositories.stash_apply']}"`);
        expect(stashes).toContain(`aria-label="${catalog['repositories.stash_pop']}"`);
        expect(stashes).toContain(`aria-label="${catalog['repositories.stash_drop']}"`);
        expect(group(html({ [HUB]: HUB_GIT }), 'stashes')).toContain(
            catalog['repositories.stashes_empty']
        );
    });

    it('lists the tags, each with Delete Tag, and says when there is none', () => {
        const held = {
            ...HUB_GIT,
            tags: [{ name: 'v1.0', commit: 'a'.repeat(40), annotated: true, subject: 'first' }]
        };
        const tags = group(html({ [HUB]: held }), 'tags');
        expect(tags).toContain('data-tag="v1.0"');
        expect(tags).toContain(`aria-label="${catalog['repositories.tag_delete']}"`);
        expect(group(html({ [HUB]: HUB_GIT }), 'tags')).toContain(
            catalog['repositories.tags_empty']
        );
    });

    it('says a merge is in progress with Abort, draws Merge Changes first, and opens a conflict in the merge editor', () => {
        const held = git({
            sequence: 'merging',
            conflicted: [{ path: 'both.txt', status: 'UU', added: 0, deleted: 0 }]
        });
        const body = html({ [HUB]: held });
        expect(body).toContain('data-sequence="merging"');
        expect(body).toContain(catalog['repositories.merging'].replace('{0}', '1'));
        expect(body).toContain(`>${catalog['repositories.abort']}</span>`);
        const changes = group(body, 'changes');
        expect(changes.indexOf('data-changes="merge"')).toBeLessThan(
            changes.indexOf('data-changes="changed"')
        );
        expect(changes).toContain(`aria-label="${catalog['repositories.merge_open']}"`);
        expect(changes).toContain(catalog['repositories.conflict_both_modified']);
    });

    it('lists the branches with the switch control on the ones not checked out', () => {
        const branches = group(html({ [HUB]: HUB_GIT }), 'branches');
        expect(branches).toContain('origin/main');
        expect(branches).toContain('package-one');
        expect(count(branches, `aria-label="${catalog['repositories.switch']}"`)).toBe(1);
        expect(branches).toContain(catalog['git.branch_new_create']);
        // The checked-out branch is the current row.
        const main = branches.slice(branches.indexOf('data-branch="main"'));
        expect(main.slice(0, main.indexOf('</li>'))).toContain('aria-current="true"');
    });

    it('lists every worktree but the checkout, each with its four controls', () => {
        const body = html({ [HUB]: HUB_GIT });
        const worktrees = group(body, 'worktrees');
        expect(worktrees).toContain(`data-entry="${HUB}/.agents/worktrees/package-one"`);
        // The checkout itself is not a row: the three change rows and this one carry the attribute.
        expect(count(body, 'data-entry=')).toBe(4);
        expect(worktrees).toContain('>1</span>');
        expect(worktrees).toContain(catalog['repositories.diff_worktree_title']);
        expect(worktrees).toContain(catalog['repositories.terminal']);
        expect(worktrees).toContain(catalog['repositories.merge']);
        expect(worktrees).toContain(catalog['repositories.remove']);
    });

    it('offers no merge back while the repository has no branch checked out', () => {
        const body = html({ [HUB]: HUB_GIT });
        expect(body).toContain(catalog['repositories.merge_title']);
        // a branch is checked out, so the merge control is offered by its plain title
        expect(body).not.toContain(catalog['repositories.merge_detached']);

        // A detached HEAD has nothing to merge into, so the control says so and is not pressable.
        const loose = html({ [HUB]: { ...HUB_GIT, detached: true } });
        expect(loose).toContain(catalog['repositories.merge_detached']);
        // a detached HEAD has nothing to merge into, so the plain title is not drawn
        expect(loose).not.toContain(catalog['repositories.merge_title']);
        expect(group(loose, 'worktrees')).toContain('disabled');
    });

    it('warns about a repository whose .gitignore does not keep the folder out', () => {
        // this repository's .gitignore keeps the worktree folder out, so there is nothing to warn
        // about
        expect(html({ [HUB]: HUB_GIT })).not.toContain(catalog['repositories.worktrees_unignored']);
        const loose = html({ [HUB]: { ...HUB_GIT, ignoresWorktrees: false } });
        expect(loose).toContain(catalog['repositories.worktrees_unignored']);
    });

    it('draws the busy line on the root with a write in flight and on no other', async () => {
        // The write is held open, so the store is still busy on that root while the page renders.
        let release: () => void = () => undefined;
        const held = new Promise<Response>((settle) => {
            release = (): void => settle(new Response('{}', { status: 200 }));
        });
        vi.stubGlobal('fetch', () => held);
        const first = client.repositories.stage(HUB, 'code/one.py');
        expect(client.repositories.busy(HUB)).toBe(true);

        const payload = { [HUB]: HUB_GIT, [OTHER]: git({ branch: 'work' }) };
        // The busy line; the Commit button also says it as the reason it is held back.
        expect(count(html(payload), `>${catalog['git.busy']}</p>`)).toBe(1);
        // the write is on the other repository, and the busy mark belongs to the one it is running
        // on
        expect(html(payload, 'repositories', { root: OTHER })).not.toContain(
            `>${catalog['git.busy']}</p>`
        );

        release();
        await first;
        vi.unstubAllGlobals();
    });

    it('draws a root that is no repository, and says nothing is on the channel only when nothing is', () => {
        const folder = git({ branch: '', repository: false, error: 'not a git repository' });
        const body = html({ [HUB]: folder, [OTHER]: git({ branch: 'work' }) });
        // The hub is the first root the channel carries, so it is the one drawn, folder or not.
        expect(body).toContain(`data-root="${HUB}"`);
        // Exactly one root is drawn at a time, so the other must not be in the body beside it.
        expect(body).not.toContain(`data-root="${OTHER}"`);
        expect(body).toContain('data-repo="none"');
        expect(body).toContain(catalog['sessions.ch_norepo']);
        // A channel carrying roots is never empty, whatever those roots turn out to be.
        expect(body).not.toContain(catalog['repositories.empty']);
    });

    it('keeps the view on a root the reader picked after its folder was deleted', () => {
        const away = git({
            branch: '',
            present: false,
            repository: false,
            error: 'no such directory'
        });
        const body = html({ [HUB]: HUB_GIT, '/gone': away }, 'repositories', { root: '/gone' });
        expect(body).toContain('data-root="/gone"');
        // The reader's pick is kept, so the view must not have moved itself to another root.
        expect(body).not.toContain(`data-root="${HUB}"`);
        expect(body).toContain('data-repo="missing"');
        expect(body).toContain(catalog['sessions.ch_nofolder']);
        // Every root deleted is still every root: the list is drawn and the first one says so,
        // rather than the view falling back to the line for a channel carrying nothing.
        const all = html({ '/gone': away, '/also-gone': away });
        expect(count(all, 'data-repo-row=')).toBe(2);
        expect(all).toContain(catalog['sessions.ch_nofolder']);
        // Every root deleted is still every root, so the line for a channel with none stays away.
        expect(all).not.toContain(catalog['repositories.empty']);
        // The row carries git's own reason as its hover words, as the Changes panel does.
        expect(body).toContain('title="no such directory"');
    });

    it('draws a repository whose read failed as its error row and no section', () => {
        const reason = 'index file smaller than expected';
        const body = html(
            { [HUB]: HUB_GIT, [OTHER]: git({ branch: 'work', error: reason }) },
            'repositories',
            { root: OTHER }
        );
        expect(body).toContain(`data-root="${OTHER}"`);
        // one repository is drawn at a time, and the instance keeps the one whose read failed
        expect(body).not.toContain(`data-root="${HUB}"`);
        // The Changes panel's own key: one sentence for the fact, read by both git views.
        const row = catalog['sessions.ch_failed'].replace('{0}', reason);
        const failed = body.slice(body.indexOf('data-repo="failed"'));
        // One row, in the explorer's row style and the error hue.
        expect(count(body, row)).toBe(1);
        expect(failed).toContain(`>${row}</span>`);
        expect(failed).toMatch(/class="item[^"]*\berror\b/);
        for (const id of ['changes', 'graph', 'stashes', 'tags', 'branches', 'worktrees']) {
            // the read failed, so there is no listing to draw a section from
            expect(body).not.toContain(`data-group="${id}"`);
        }
        // and with no section the only tree is the Repositories section's
        expect(count(body, 'role="tree"')).toBe(1);
        // The Repositories section still names the repository it is on as current.
        const other = body.slice(body.indexOf(`data-repo-row="${OTHER}"`));
        expect(other.slice(0, other.indexOf('</li>'))).toContain('aria-current="true"');
    });

    it('keeps the branch line and the path above the error row while the state names a branch', () => {
        const reason = 'index file smaller than expected';
        const named = html({ [OTHER]: git({ branch: 'work', error: reason }) });
        const row = named.indexOf('data-repo="failed"');
        expect(row).toBeGreaterThan(0);
        const above = named.slice(named.indexOf(`data-root="${OTHER}"`), row);
        expect(above).toContain(catalog['sessions.ch_branch']);
        expect(above).toContain('>work</span>');
        expect(above).toContain('class="path');

        // A root whose check timed out names no branch, so the row has the path alone above it.
        const unnamed = html({ [OTHER]: git({ branch: '', error: 'git timed out' }) });
        expect(unnamed).toContain('data-repo="failed"');
        // No branch was ever read, so the row must not print a heading for one. The heading is
        // looked for as the words drawn, since the tree's rows carry the word in an attribute.
        expect(unnamed).not.toContain(`>${catalog['sessions.ch_branch']}<`);
        expect(named).toContain(`>${catalog['sessions.ch_branch']}<`);
        expect(unnamed).toContain('class="path');
    });

    it('says a repository with no commit has no branch to list, and keeps New branch live', () => {
        const fresh = git({ branch: 'start', branches: [], log: [] });
        const branches = group(html({ [HUB]: fresh }), 'branches');
        expect(branches).toContain(catalog['repositories.branches_unborn'].replace('{0}', 'start'));
        // the repository has no commit yet, which is said in its own words rather than as an empty
        // list
        expect(branches).not.toContain(catalog['repositories.branches_empty']);
        const form = branches.slice(branches.indexOf('data-form="branch"'));
        const create = form.slice(
            form.lastIndexOf(
                '<button',
                form.indexOf(`aria-label="${catalog['git.branch_new_create']}"`)
            )
        );
        // git switch -c, which the control runs, works on a branch with no commit.
        // git switch -c works on a branch with no commit, so the control stays pressable
        expect(create.slice(0, create.indexOf('>'))).not.toContain('disabled');

        // A repository with commits whose branch listing came back empty keeps the plain line.
        const unread = group(
            html({ [HUB]: git({ branch: 'main', branches: [], log: HUB_GIT.log }) }),
            'branches'
        );
        // this repository has commits, so the unborn line is not the one it draws
        expect(unread).not.toContain(
            catalog['repositories.branches_unborn'].replace('{0}', 'main')
        );

        // A repository with commits keeps the control live and draws no such title.
        const live = group(html({ [HUB]: HUB_GIT }), 'branches');
        const liveForm = live.slice(live.indexOf('data-form="branch"'));
        const liveCreate = liveForm.slice(
            liveForm.lastIndexOf(
                '<button',
                liveForm.indexOf(`aria-label="${catalog['git.branch_new_create']}"`)
            )
        );
        // the repository has commits, so nothing holds the control back
        expect(liveCreate.slice(0, liveCreate.indexOf('>'))).not.toContain('disabled');
    });

    it('tells two repositories with the same last folder apart by the folder above it', () => {
        const body = html(
            { '/a/work/hub': HUB_GIT, '/b/other/hub': git({ branch: 'work' }) },
            'repositories',
            { root: '/b/other/hub' }
        );
        const row = body.slice(body.indexOf('data-repo-row="/b/other/hub"'));
        expect(row.slice(0, row.indexOf('</li>'))).toContain('aria-label="other/hub"');
    });

    it('draws no staged group while nothing is staged, and one muted row under an empty group', () => {
        const changes = group(
            html({
                [HUB]: git({ unstaged: [{ path: 'a.md', status: 'M', added: 1, deleted: 0 }] })
            }),
            'changes'
        );
        // nothing is staged, so the staged group is not drawn at all
        expect(changes).not.toContain('data-changes="staged"');
        expect(changes).toContain('data-changes="changed"');
        expect(changes).toContain('data-changes="untracked"');
        expect(changes).toContain(catalog['sessions.ch_group_empty']);
    });

    it('draws the Repositories section and the sections of the repository as a tree each, a treeitem per row at its level, one stop each', () => {
        const body = html({ [HUB]: HUB_GIT });
        expect(count(body, 'role="tree"')).toBe(2);
        const changes = group(body, 'changes');
        expect(changes).toContain('aria-level="1"');
        expect(changes).toContain('aria-level="2"');
        expect(changes).toContain('aria-level="3"');
        expect(count(body, 'tabindex="0"')).toBe(2);
    });

    it('draws the checked-out branch as in force and not as the selection', () => {
        const branches = group(html({ [HUB]: HUB_GIT }), 'branches');
        const main = branches.slice(branches.indexOf('data-branch="main"'));
        const row = main.slice(0, main.indexOf('</li>'));
        expect(row).toContain('aria-current="true"');
        expect(row).toContain('aria-selected="false"');
        expect(row).toContain('class="mark');
    });

    it('names the new-branch and new-worktree fields by the words their rows show', () => {
        const body = html({ [HUB]: HUB_GIT });
        const branch = group(body, 'branches');
        const worktree = group(body, 'worktrees');
        expect(branch).toContain(`<span class="name`);
        expect(branch).toContain(`>${catalog['git.branch_new']}</span>`);
        expect(branch).toContain(`aria-label="${catalog['git.branch_new']}"`);
        expect(worktree).toContain(`>${catalog['repositories.worktree_new']}</span>`);
        expect(worktree).toContain(`aria-label="${catalog['repositories.worktree_new']}"`);
    });
});

/** One pane rendered for an instance of its view with the state given. */
function pane(component: Component<ViewProps>, view: string, state: unknown): string {
    const id = `${view}-one`;
    client.ui.setInstanceState(id, state);
    return render(component, {
        context: clientContext(client),
        props: { instance: { id, view, state } }
    }).body;
}

const FILE = {
    id: 'changed:/hub:README.md',
    label: 'README.md',
    root: '/hub',
    path: 'README.md',
    staged: false,
    worktree: false
};

describe('the diff pane', () => {
    it('says what it is over in its title, and asks for nothing when it is over nothing', () => {
        const empty = pane(Diff, 'repositories-diff', {});
        expect(empty).toContain(catalog['views.repositories_diff']);
        expect(empty).toContain(catalog['repositories.diff_empty']);
        expect(pane(Diff, 'repositories-diff', FILE)).toContain('README.md');
    });

    it('draws the two layouts, side by side pressed unless the pane keeps inline', () => {
        const side = pane(Diff, 'repositories-diff', FILE);
        const pressed = (body: string, key: string): boolean => {
            const at = body.indexOf(`aria-label="${catalog[key]}"`);
            const open = body.lastIndexOf('<button', at);
            return body.slice(open, body.indexOf('>', at)).includes('aria-pressed="true"');
        };
        expect(pressed(side, 'repositories.diff_side')).toBe(true);
        expect(pressed(side, 'repositories.diff_inline')).toBe(false);
        const inline = pane(Diff, 'repositories-diff', { ...FILE, mode: 'inline' });
        expect(pressed(inline, 'repositories.diff_inline')).toBe(true);
    });

    it('offers Previous Change, Next Change and Open File for a file, and no Open File for a commit', () => {
        const file = pane(Diff, 'repositories-diff', FILE);
        expect(file).toContain(`aria-label="${catalog['repositories.change_prev']}"`);
        expect(file).toContain(`aria-label="${catalog['repositories.change_next']}"`);
        expect(file).toContain(`aria-label="${catalog['repositories.open_file']}"`);
        const commit = pane(Diff, 'repositories-diff', { ...FILE, commit: 'abc' });
        // A commit's version of a file is not the file on disk, so there is no file to open.
        expect(commit).not.toContain(`aria-label="${catalog['repositories.open_file']}"`);
    });
});

/** One file of a diff drawn by its section, read-only, as a stash's or a commit's is. */
function section(file: DiffSides, key: string): string {
    const noop = (): void => undefined;
    return render(DiffSection, {
        props: {
            file,
            index: 0,
            key,
            model: `diff-one:${key}`,
            mode: 'side',
            look: 'dark 1',
            several: false,
            headed: true,
            scroller: undefined,
            view: null,
            actions: 'read',
            staged: false,
            busy: false,
            current: -1,
            onchanges: noop,
            onview: noop,
            onactions: noop,
            onact: noop
        }
    }).body;
}

/** One entry of a diff at `x`. */
function sidesAt(original: string, modified: string, head: string[] = []): DiffSides {
    return {
        oldPath: 'x',
        newPath: 'x',
        head: ['diff --git a/x b/x', ...head],
        binary: false,
        encoded: true,
        original,
        modified
    };
}

describe('a file of the diff pane', () => {
    it('draws both entries of a type change, each under a key of its own', () => {
        const entries = [
            sidesAt('text\n', '', ['deleted file mode 100644']),
            sidesAt('', 'target', ['new file mode 120000'])
        ];
        const keys = fileKeys(entries);
        const drawn = entries.map((file, at) => section(file, keys[at]));
        expect(drawn[0]).toContain('data-diff-key="x"');
        expect(drawn[1]).toContain('data-diff-key="x\u00002"');
        expect(drawn[1]).toContain('target');
    });

    it('says a file whose line endings alone changed differs only there', () => {
        const body = section(sidesAt('a\r\nb\r\n', 'a\nb\n'), 'x');
        expect(body).toContain('Only the line endings differ');
        // A change of the lines themselves is drawn by Monaco, so the head has nothing to add.
        expect(section(sidesAt('a\n', 'b\n'), 'x')).not.toContain('Only the line endings differ');
    });
});

describe('the merge editor', () => {
    it('says it was opened for nothing, and waits for the three versions of a path it was opened for', () => {
        expect(pane(Merge, 'repositories-merge', {})).toContain(
            catalog['repositories.merge_empty']
        );
        const body = pane(Merge, 'repositories-merge', { root: '/hub', path: 'both.txt' });
        expect(body).toContain(
            catalog['repositories.merge_editor_title'].replace('{0}', 'both.txt')
        );
        expect(body).toContain(catalog['repositories.merge_pending']);
        expect(body).toContain('data-conflicts-left="0"');
    });

    it('holds Complete Merge back until the three versions are read', () => {
        const body = pane(Merge, 'repositories-merge', { root: '/hub', path: 'both.txt' });
        const at = body.indexOf(`>${catalog['repositories.merge_complete']}</span>`);
        const open = body.lastIndexOf('<button', at);
        expect(body.slice(open, body.indexOf('>', open))).toContain('disabled');
    });
});
