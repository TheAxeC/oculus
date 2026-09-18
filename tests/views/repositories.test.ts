// The Repositories view rendered to HTML on the server: the picker over the roots of the `git`
// channel, the one repository shown, its branch line, and its Changes, Commits, Branches and
// Worktrees sections with their counts and the controls of each row. Each case written for the
// source control shape names the change that turns it red.
//
// The catalog and the glyphs are the real config; the git payload is the test's own, so the sections
// are drawn without a repository anywhere. What this does NOT cover: pressing a control and the
// fetch the Diff pane makes, neither of which a server rendering runs; both are exercised by
// tests/browser/repositories.spec.ts.

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'svelte/server';
import Repositories from '../../src/lib/views/Repositories.svelte';
import Diff from '../../src/lib/views/repositories/Diff.svelte';
import {
    engineDir,
    glyphCatalog,
    loadConfig,
    textCatalog
} from '../../src/lib/data/sources/config.ts';
import { setCatalog, setGlyphs } from '../../src/lib/state/text.ts';
import type { Instance } from '../../src/lib/state/layout/index.ts';
import { git } from '../sessions-fixture.ts';
import { clientContext, createClientState, type ClientState } from '../client.ts';

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

/** The hub's state as these cases read it: one of each kind of change, a log, branches, a worktree. */
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
    if (view === 'repositories') client.ui.setInstanceState(`${view}-one`, state);
    const component = view === 'repositories' ? Repositories : Diff;
    return render(component, {
        context: clientContext(client),
        props: { instance: instance(view, state) }
    }).body;
}

function count(body: string, needle: string): number {
    return body.split(needle).length - 1;
}

/** The markup of one section of a rendering, from its group attribute to the next group. */
function group(body: string, id: string): string {
    const at = body.indexOf(`data-group="${id}"`);
    if (at < 0) return '';
    const next = body.indexOf('data-group=', at + 1);
    return body.slice(at, next < 0 ? undefined : next);
}

describe('the Repositories view', () => {
    it('says nothing is on the channel before the first payload', () => {
        const body = render(Repositories, {
            context: clientContext(client),
            props: { instance: instance() }
        }).body;
        expect(body).toContain(catalog['repositories.empty']);
    });

    // Revert: show the last root the channel carries instead of shownRoot's answer.
    it('draws one repository, the first root the channel carries while the instance keeps none', () => {
        const body = html({ [HUB]: HUB_GIT, [OTHER]: git({ branch: 'work' }) });
        expect(body).toContain(`data-root="${HUB}"`);
        // one repository is drawn at a time, and the instance keeps none, so it is the first root
        expect(body).not.toContain(`data-root="${OTHER}"`);
        expect(count(body, 'data-root=')).toBe(1);
    });

    // Revert: show `roots[0]` whatever the instance keeps, in Repositories.svelte.
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

    // Revert: label the picker with a fixed word instead of the shown repository's label.
    it('names the repository shown on the picker', () => {
        const body = html({ [HUB]: HUB_GIT, [OTHER]: git({ branch: 'work' }) }, 'repositories', {
            root: OTHER
        });
        const picker = body.slice(body.indexOf('data-repo-picker'));
        expect(picker.slice(0, picker.indexOf('</button>'))).toContain('aria-label="other"');
        expect(picker).toContain('aria-haspopup="menu"');
    });

    it('draws the branch line with the distance from the upstream', () => {
        const body = html({ [HUB]: HUB_GIT });
        expect(body).toContain('main');
        expect(body).toContain(catalog['sessions.ch_ahead'].replace('{0}', '2'));
    });

    // Revert: drop `count={total}` from the Changes section head in Changes.svelte.
    it('draws the Changes section with its count and the three groups with theirs', () => {
        const changes = group(html({ [HUB]: HUB_GIT }), 'changes');
        expect(changes).toContain(`aria-label="${catalog['repositories.changes']}"`);
        expect(changes).toContain('>3</span>');
        expect(changes).toContain(catalog['sessions.ch_staged']);
        expect(changes).toContain(catalog['sessions.ch_changed']);
        expect(changes).toContain(catalog['sessions.ch_untracked']);
        expect(count(changes, '>1</span>')).toBe(3);
    });

    // Revert: label a change row's diff control with another word, in Changes.svelte.
    it('draws each change row with its diff, its staging and, for a changed path, its discard', () => {
        const changes = group(html({ [HUB]: HUB_GIT }), 'changes');
        expect(changes).toContain('data-entry="code/one.py"');
        expect(changes).toContain('one.py');
        expect(count(changes, `aria-label="${catalog['repositories.diff']}"`)).toBe(3);
        // The row itself and its diff control each say which side they show.
        expect(count(changes, catalog['repositories.diff_staged_title'])).toBe(2);
        // Revert: name a change row by its file name alone; two README.md files then sound the same.
        expect(changes).toContain(
            `aria-label="code/one.py, ${catalog['repositories.status_modified']}"`
        );
        expect(count(changes, `aria-label="${catalog['git.unstage']}"`)).toBe(1);
        expect(count(changes, `aria-label="${catalog['git.stage']}"`)).toBe(2);
        expect(count(changes, `aria-label="${catalog['git.discard']}"`)).toBe(1);
    });

    // Revert: render a group's rows whether or not its id is in `collapsed`.
    it('draws no row of a group or a section the instance keeps closed', () => {
        const body = html({ [HUB]: HUB_GIT }, 'repositories', { collapsed: ['staged', 'log'] });
        // the staged group is closed, so its rows are not drawn
        expect(body).not.toContain('data-entry="code/one.py"');
        expect(body).toContain('data-entry="README.md"');
        // the log is closed too, so no commit subject is drawn
        expect(body).not.toContain('Add the thing');
        expect(group(body, 'log')).toContain('aria-expanded="false"');
    });

    // Revert: draw the first commit of the log alone, in Repo.svelte.
    it('draws one row per commit with its short hash, and says when there is none', () => {
        const log = group(html({ [HUB]: HUB_GIT }), 'log');
        expect(log).toContain(catalog['repositories.log']);
        expect(log).toContain('>2</span>');
        expect(log).toContain('aaaaaaa');
        expect(log).toContain('Add the thing');
        expect(log).toContain('Take the other thing back');
        const bare = html({ [HUB]: git({}) });
        expect(bare).toContain(catalog['repositories.log_empty']);
    });

    // Revert: draw the switch control on the checked-out branch too, in Branches.svelte.
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

    // Revert: list the checkout among the worktrees, in Worktrees.svelte.
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

    // Revert: drop `git.detached` from the merge control's `disabled` in Worktrees.svelte.
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
        // this repository's .gitignore keeps the worktree folder out, so there is nothing to warn about
        expect(html({ [HUB]: HUB_GIT })).not.toContain(catalog['repositories.worktrees_unignored']);
        const loose = html({ [HUB]: { ...HUB_GIT, ignoresWorktrees: false } });
        expect(loose).toContain(catalog['repositories.worktrees_unignored']);
    });

    // Revert: draw the busy line whatever `busy` says, in Repo.svelte.
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
        expect(count(html(payload), catalog['git.busy'])).toBe(1);
        // the write is on the other repository, and the busy mark belongs to the one it is running on
        expect(html(payload, 'repositories', { root: OTHER })).not.toContain(catalog['git.busy']);

        release();
        await first;
        vi.unstubAllGlobals();
    });

    // Revert: pass `gitRoots()` to the picker unfiltered, in Repositories.svelte.
    it('offers only the roots git reads as repositories', () => {
        const folder = git({ branch: '', repository: false, error: 'not a git repository' });
        const body = html({ [HUB]: folder, [OTHER]: git({ branch: 'work' }) });
        expect(body).toContain(`data-root="${OTHER}"`);
        // git says this root is no repository, so the picker does not offer it
        expect(body).not.toContain(`data-root="${HUB}"`);
        // and the reason git gave is the picker's to swallow, not to draw
        expect(body).not.toContain('not a git repository');
        const none = html({ [HUB]: folder });
        expect(none).toContain(catalog['repositories.empty']);
    });

    // Revert: draw Repo.svelte whenever `held` is not null, in Repositories.svelte.
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
        const row = catalog['repositories.error'].replace('{0}', reason);
        const failed = body.slice(body.indexOf('data-repo-failed'));
        // One row, in the explorer's row style and the error hue.
        expect(count(body, row)).toBe(1);
        expect(failed).toContain(`>${row}</span>`);
        expect(failed).toMatch(/class="item[^"]*\berror\b/);
        for (const id of ['changes', 'log', 'branches', 'worktrees']) {
            // the read failed, so there is no listing to draw a section from
            expect(body).not.toContain(`data-group="${id}"`);
        }
        // and with no section there is no tree either
        expect(body).not.toContain('role="tree"');
        // The picker still names the repository it is on.
        const picker = body.slice(body.indexOf('data-repo-picker'));
        expect(picker.slice(0, picker.indexOf('</button>'))).toContain('aria-label="other"');
    });

    // Revert: wrap the branch line and the path in `{#if git.error === null}` in
    // repositories/Repo.svelte.
    it('keeps the branch line and the path above the error row while the state names a branch', () => {
        const reason = 'index file smaller than expected';
        const named = html({ [OTHER]: git({ branch: 'work', error: reason }) });
        const row = named.indexOf('data-repo-failed');
        expect(row).toBeGreaterThan(0);
        const above = named.slice(named.indexOf(`data-root="${OTHER}"`), row);
        expect(above).toContain(catalog['sessions.ch_branch']);
        expect(above).toContain('>work</span>');
        expect(above).toContain('class="path');

        // A root whose check timed out names no branch, so the row has the path alone above it.
        const unnamed = html({ [OTHER]: git({ branch: '', error: 'git timed out' }) });
        expect(unnamed).toContain('data-repo-failed');
        // the check timed out before it read a branch, so there is no branch to name
        expect(unnamed).not.toContain(catalog['sessions.ch_branch']);
        expect(unnamed).toContain('class="path');
    });

    // Reverts: draw the empty line `repositories.branches_empty` alone in repositories/Branches.svelte;
    // or leave the log out of noCommitYet, which a failed listing then misreads.
    it('says a repository with no commit has no branch to list, and keeps New branch live', () => {
        const fresh = git({ branch: 'start', branches: [], log: [] });
        const branches = group(html({ [HUB]: fresh }), 'branches');
        expect(branches).toContain(catalog['repositories.branches_unborn'].replace('{0}', 'start'));
        // the repository has no commit yet, which is said in its own words rather than as an empty list
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

    // Revert: label the picker with each root's last folder alone.
    it('tells two repositories with the same last folder apart by the folder above it', () => {
        const body = html(
            { '/a/work/hub': HUB_GIT, '/b/other/hub': git({ branch: 'work' }) },
            'repositories',
            { root: '/b/other/hub' }
        );
        const picker = body.slice(body.indexOf('data-repo-picker'));
        expect(picker.slice(0, picker.indexOf('</button>'))).toContain('aria-label="other/hub"');
    });

    // Revert: keep the staged group whatever it holds, in state/repositories.ts's changeGroups.
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

    // Revert: drop `role="tree"` from ui/TreeView.svelte.
    it('draws its sections as one tree, a treeitem per row at its level, with one stop', () => {
        const body = html({ [HUB]: HUB_GIT });
        expect(count(body, 'role="tree"')).toBe(1);
        const changes = group(body, 'changes');
        expect(changes).toContain('aria-level="1"');
        expect(changes).toContain('aria-level="2"');
        expect(changes).toContain('aria-level="3"');
        expect(count(body, 'tabindex="0"')).toBe(1);
    });

    // Revert: pass `selected={branch.current}` rather than `current` in Branches.svelte.
    it('draws the checked-out branch as in force and not as the selection', () => {
        const branches = group(html({ [HUB]: HUB_GIT }), 'branches');
        const main = branches.slice(branches.indexOf('data-branch="main"'));
        const row = main.slice(0, main.indexOf('</li>'));
        expect(row).toContain('aria-current="true"');
        expect(row).toContain('aria-selected="false"');
        expect(row).toContain('class="mark');
    });

    // Revert: give the branch field `label={t('git.branch_new_label')}` in Branches.svelte.
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

describe('the diff pane', () => {
    it('says what it is over in its title, and asks for nothing when it is over nothing', () => {
        const body = html({ [HUB]: HUB_GIT }, 'repositories-diff', {});
        expect(body).toContain(catalog['views.repositories_diff']);
        expect(body).toContain(catalog['repositories.diff_empty']);
    });

    it('names the file it was opened for', () => {
        const body = html({ [HUB]: HUB_GIT }, 'repositories-diff', {
            id: 'changed:/hub:README.md',
            label: 'README.md',
            root: HUB,
            path: 'README.md',
            staged: false,
            worktree: false
        });
        expect(body).toContain('README.md');
        // A server rendering runs no effect, so the text is not read here: the pane says it is.
        expect(body).toContain(catalog['repositories.diff_empty']);
    });
});
