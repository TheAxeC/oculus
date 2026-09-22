// The Changes view rendered to HTML on the server: the files the session touched, the repository
// section in each of its six drawings, and the controls the readable one carries. The branch-state
// sentence both git views draw is checked here as the rule it is, over each of its cases.
//
// The catalog, glyphs and vocabulary are the real config. The sessions and git state are the test's
// own: nothing reads ~/.claude, ~/.codex or ~/.oculus, and nothing writes anywhere.
//
// What this does NOT cover: anything that needs a DOM. There is no browser in this suite, so the
// branch listing the panel fetches in an effect is never sent; tests/browser/views/changes.spec.ts
// is where the fetch and the states a real repository puts on the channel are checked.

import { beforeEach, describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import Changes from '../../../src/lib/views/sessions/changes/Changes.svelte';
import { branchState } from '../../../src/lib/views/shared/changes/branch-state.ts';
import { repoShape } from '../../../src/lib/views/shared/changes/repo-shape.ts';
import {
    engineDir,
    glyphCatalog,
    loadConfig,
    textCatalog,
    vocabCatalog
} from '../../../src/lib/data/sources/config.ts';
import { setCatalog, setGlyphs } from '../../../src/lib/state/words/text.ts';
import { setVocab } from '../../../src/lib/state/words/tones.ts';
import { area, git, payload, record, workspace } from '../../fixtures/sessions-fixture.ts';
import type { GitState } from '../../../src/lib/data/model/model-sessions.ts';
import type { Component } from 'svelte';
import type { Instance } from '../../../src/lib/state/workbench/layout/index.ts';
import type { ViewProps } from '../../../src/lib/views/registry.ts';
import { clientContext, createClientState, type ClientState } from '../../fixtures/client.ts';

let client: ClientState;
let receive: ClientState['entities']['receive'];
let apply: ClientState['layout']['apply'];
let select: ClientState['selection']['select'];
let setInstanceState: ClientState['ui']['setInstanceState'];

beforeEach(() => {
    client = createClientState();
    ({ receive } = client.entities);
    ({ apply } = client.layout);
    ({ select } = client.selection);
    ({ setInstanceState } = client.ui);
    installFixture();
});

const { config } = loadConfig(engineDir());
const catalog = textCatalog(config);
setCatalog(catalog);
setGlyphs(glyphCatalog(config));
setVocab(vocabCatalog(config));

const HUB = '/hub';
const ALPHA = `${HUB}/projects/manuscripts/alpha`;
const UNKNOWN = `${HUB}/scratch`;

const live = record('live-one', {
    title: 'The live one',
    live: true,
    liveStatus: 'busy',
    workspace: HUB,
    area: ALPHA,
    cwd: ALPHA,
    files: [
        { path: `${ALPHA}/manuscript/main.tex`, tool: 'Edit', count: 3, last: null },
        { path: `${ALPHA}/code/run.py`, tool: 'Edit', count: 1, last: null }
    ]
});

const sharer = record('live-two', {
    title: 'The other live one',
    live: true,
    liveStatus: 'idle',
    workspace: HUB,
    area: ALPHA,
    cwd: ALPHA,
    files: [{ path: `${ALPHA}/manuscript/main.tex`, tool: 'Edit', count: 1, last: null }]
});

const gone = record('ended-one', { title: 'The ended one', workspace: HUB, area: UNKNOWN });

/** A session in a workspace that is a folder and no repository. */
const bare = record('bare-one', { title: 'The bare one', workspace: '/other', area: '/other' });

/** A session whose cwd named no folder, so it is under the unknown workspace with an empty key. */
const adrift = record('adrift-one', { title: 'The adrift one', workspace: '', area: '' });

const tree = [
    workspace(HUB, [area(ALPHA, [live, sharer]), area(UNKNOWN, [gone])]),
    workspace('/other', [area('/other', [bare])]),
    workspace('', [area('', [adrift], { known: false, short: 'nowhere', full: '' })])
];

/** The hub's git state as the tests read it: one staged, two changed, one untracked file. */
const HUB_GIT = git({
    branch: 'main',
    ahead: 1,
    staged: [{ path: 'a/one.ts', status: 'M', added: 4, deleted: 2 }],
    unstaged: [
        { path: 'a/two.png', status: 'M', added: null, deleted: null },
        // The same file the other live session is holding open, as git sees it: relative to
        // the workspace root, which is what the "also open" mark has to match across.
        {
            path: 'projects/manuscripts/alpha/manuscript/main.tex',
            status: 'M',
            added: 1,
            deleted: 0
        }
    ],
    untracked: [{ path: 'a/three.ts', status: '?', added: 0, deleted: 0 }]
});

/** What every case here starts from, installed into the case's own client. */
function installFixture(): void {
    receive({ channel: 'sessions', version: 1, payload: payload(tree) });
    receive({
        channel: 'git',
        version: 1,
        payload: {
            [HUB]: HUB_GIT,
            '/other': git({ branch: '', repository: false, error: 'not a git repository' })
        }
    });
    receive({ channel: 'config', version: 1, payload: { config, text: catalog, findings: [] } });
}

let counter = 0;

/** One view rendered as a fresh instance, with the state that instance has saved. */
function html(view: Component<ViewProps>, state: unknown = {}, id = `probe-${(counter += 1)}`) {
    setInstanceState(id, state);
    const instance: Instance = { id, view: 'probe', state };
    apply({ root: { kind: 'pane', tabs: [instance], active: id } });
    return render(view, { context: clientContext(client), props: { instance } }).body;
}

/** How many controls carry exactly these words, which is how many rows drew that control. */
function count(body: string, label: string): number {
    return [...body.matchAll(new RegExp(`>${label}<`, 'g'))].length;
}

/** The `/other` workspace's git state replaced for one case, or dropped with `null`. */
function otherGit(state: GitState | null): void {
    const held = state === null ? { [HUB]: HUB_GIT } : { [HUB]: HUB_GIT, '/other': state };
    receive({ channel: 'git', version: 2, payload: held });
}

/** Which drawings of the repository section a body holds, by their `data-repo`. */
function said(body: string): string[] {
    return [...body.matchAll(/data-repo="(\w+)"/g)].map((one) => one[1]);
}

describe('the changes view', () => {
    it('offers pin and unpin in place', () => {
        select('live-one');
        expect(html(Changes)).toContain(catalog['sessions.pin_pane']);
        expect(html(Changes, { session: 'ended-one', label: 'The ended one' })).toContain(
            catalog['sessions.unpin_pane']
        );
    });

    it('lists the files the session touched, relative to its workspace', () => {
        select('live-one');
        const body = html(Changes);
        expect(body).toContain(catalog['sessions.ch_touched']);
        expect(body).toContain('projects/manuscripts/alpha/code/run.py');
        expect(body).toContain(catalog['sessions.ch_times'].replace('{0}', '3'));
    });

    it('marks a file another live session is holding open, and names it', () => {
        select('live-one');
        const body = html(Changes);
        expect(body).toContain(catalog['sessions.ch_shared']);
        expect(body).toContain(
            catalog['sessions.ch_shared_tip'].replace('{0}', 'The other live one')
        );
    });

    it('draws the branch line and the three git groups with their letters', () => {
        select('live-one');
        const body = html(Changes);
        expect(body).toContain(catalog['sessions.ch_ahead'].replace('{0}', '1'));
        expect(body).toContain(catalog['sessions.ch_staged']);
        expect(body).toContain(catalog['sessions.ch_untracked']);
        expect(body).toContain('>M</span>');
        expect(body).toContain('>?</span>');
        expect(body).toContain(catalog['sessions.ch_added'].replace('{0}', '4'));
        expect(body).toContain(catalog['sessions.ch_binary']);
    });

    // Revert: return 'none' for a root that is not there in views/shared/changes/repo-shape.ts. The
    // state here is the fixture's, so what the server writes into `present` is the server test's.
    it('says a workspace folder that is not there is not there, and not that it is no repository', () => {
        otherGit(
            git({ branch: '', present: false, repository: false, error: 'no such directory' })
        );
        select('bare-one');
        const body = html(Changes);
        expect(said(body)).toEqual(['missing']);
        expect(body).toContain(catalog['sessions.ch_nofolder']);
        // A folder that has gone is told apart from one that is there and holds no repository.
        expect(body).not.toContain(catalog['sessions.ch_norepo']);
        expect(body).toContain('title="no such directory"');
    });

    // Revert: return 'unplaced' for a folder that is no repository in
    // views/shared/changes/repo-shape.ts.
    it('says a workspace is not a repository, with git own reason in the tooltip', () => {
        select('bare-one');
        const body = html(Changes);
        expect(said(body)).toEqual(['none']);
        expect(body).toContain(catalog['sessions.ch_norepo']);
        expect(body).toContain('title="not a git repository"');
    });

    // Revert: draw the `none` section for `shape === 'none' || shape === 'failed'` in Changes.svelte.
    it('says a repository whose read failed could not be read, with git own reason in the text', () => {
        const reason = 'fatal: .git/index: index file smaller than expected';
        otherGit(git({ error: reason }));
        select('bare-one');
        const body = html(Changes);
        expect(said(body)).toEqual(['failed']);
        expect(body).toContain(catalog['sessions.ch_failed'].replace('{0}', reason));
    });

    // Revert: return 'none' for a null state in views/shared/changes/repo-shape.ts.
    it('says git has not read a workspace the channel carries no state for yet', () => {
        otherGit(null);
        select('bare-one');
        const body = html(Changes);
        expect(said(body)).toEqual(['reading']);
        expect(body).toContain(catalog['sessions.ch_reading']);
    });

    // Revert: return 'none' for an empty workspace in views/shared/changes/repo-shape.ts.
    it('says a session with no workspace names no folder', () => {
        select('adrift-one');
        const body = html(Changes);
        expect(said(body)).toEqual(['unplaced']);
        expect(body).toContain(catalog['sessions.ch_noworkspace']);
        // the session names no folder at all, which is a different thing from a folder that is no repository
        expect(body).not.toContain(catalog['sessions.ch_norepo']);
        expect(repoShape('', null)).toBe('unplaced');
    });

    // Revert: return 'failed' from views/shared/changes/repo-shape.ts when `state.log` is empty.
    it('draws a repository with no commit with its branch and its untracked file', () => {
        const loose = { path: 'loose.txt', status: '?', added: null, deleted: null };
        otherGit(git({ branch: 'start', log: [], upstream: false, untracked: [loose] }));
        select('bare-one');
        const body = html(Changes);
        expect(said(body)).toEqual(['readable']);
        expect(body).toContain('>start<');
        expect(body).toContain('loose.txt');
        expect(body).toContain(catalog['git.push_none']);
    });

    // Revert: push `sessions.ch_insync` whenever `bits` is empty in
    // views/shared/changes/branch-state.ts.
    it('says a branch is in step only when it has an upstream', () => {
        select('bare-one');
        for (const upstream of [true, false, null]) {
            otherGit(git({ upstream }));
            expect(html(Changes).includes(catalog['sessions.ch_insync'])).toBe(upstream === true);
        }
    });

    it('draws a control on every row: unstage on a staged one, stage and discard on a changed one', () => {
        select('live-one');
        const body = html(Changes);
        expect(body).toContain(catalog['git.unstage']);
        expect(body).toContain(catalog['git.stage']);
        expect(body).toContain(catalog['git.discard']);
        // The reason a control gives is drawn as a Tooltip bubble rather than a title attribute.
        expect(body).toContain(catalog['git.discard_title']);
        // Three rows carry a stage (two changed, one untracked) and one carries the unstage.
        expect(count(body, catalog['git.stage'])).toBe(3);
        expect(count(body, catalog['git.unstage'])).toBe(1);
        // An untracked row offers no discard, so only the two changed rows carry one.
        expect(count(body, catalog['git.discard'])).toBe(2);
    });

    it('marks a git row another live session is holding open', () => {
        select('live-one');
        const body = html(Changes);
        expect(body).toContain('projects/manuscripts/alpha/manuscript/main.tex');
        const marks = [...body.matchAll(new RegExp(catalog['sessions.ch_shared'], 'g'))];
        expect(marks.length).toBeGreaterThan(1);
    });

    it('disables the push button with its reason while the branch has no upstream', () => {
        select('live-one');
        const body = html(Changes);
        expect(body).toContain(catalog['git.push']);
        expect(body).toContain(catalog['git.push_none']);
        // the branch has no upstream, which is said in its own words rather than as a lookup still running
        expect(body).not.toContain(catalog['git.push_pending']);
        expect(body).toContain('disabled');
    });

    it('says the upstream is being looked up, not that there is none, before git has answered', () => {
        const other = git({ branch: '', repository: false, error: 'not a git repository' });
        receive({
            channel: 'git',
            version: 3,
            payload: { [HUB]: { ...HUB_GIT, upstream: null }, '/other': other }
        });
        select('live-one');
        const body = html(Changes);
        expect(body).toContain(catalog['git.push_pending']);
        // git has not answered yet, so the lookup is what is said rather than that there is no upstream
        expect(body).not.toContain(catalog['git.push_none']);
        expect(body).toContain('disabled');
        receive({ channel: 'git', version: 4, payload: { [HUB]: HUB_GIT, '/other': other } });
    });

    it('draws the commit box with its suggest and commit controls', () => {
        select('live-one');
        const body = html(Changes);
        expect(body).toContain(`aria-label="${catalog['git.commit_label']}"`);
        expect(body).toContain(catalog['git.suggest']);
        expect(body).toContain(catalog['git.commit']);
        expect(body).toContain(catalog['git.branch_new']);
    });

    it('shows its empty state with nothing selected', () => {
        select(null);
        expect(html(Changes)).toContain(catalog['sessions.detail_empty']);
    });
});

describe('the branch-state sentence both git views draw', () => {
    const sep = ` ${catalog['sessions.meta_sep']} `;
    const insync = catalog['sessions.ch_insync'];
    const detached = catalog['sessions.ch_detached'];
    const ahead = (count: number): string =>
        catalog['sessions.ch_ahead'].replace('{0}', String(count));
    const behind = (count: number): string =>
        catalog['sessions.ch_behind'].replace('{0}', String(count));

    // Revert: drop `state.detached` from views/shared/changes/branch-state.ts, or read `ahead` and
    // `behind` the other way round.
    it('names detached, the distance ahead, the distance behind, and both distances in order', () => {
        expect(branchState(git({ detached: true, upstream: false }))).toBe(detached);
        expect(branchState(git({ ahead: 3, upstream: true }))).toBe(ahead(3));
        expect(branchState(git({ behind: 2, upstream: true }))).toBe(behind(2));
        expect(branchState(git({ ahead: 3, behind: 2, upstream: true }))).toBe(
            `${ahead(3)}${sep}${behind(2)}`
        );
        expect(branchState(git({ detached: true, ahead: 1, upstream: false }))).toBe(
            `${detached}${sep}${ahead(1)}`
        );
    });

    // Revert: push `sessions.ch_insync` whenever `bits` is empty in
    // views/shared/changes/branch-state.ts.
    it('says in step only for a branch the state gives an upstream', () => {
        expect(branchState(git({ upstream: true }))).toBe(insync);
        expect(branchState(git({ upstream: false }))).toBe('');
        expect(branchState(git({ upstream: null }))).toBe('');
        // A distance is stated whatever the upstream says, and never with the in-step sentence.
        expect(branchState(git({ ahead: 1, upstream: false }))).toBe(ahead(1));
    });
});
