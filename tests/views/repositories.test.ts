// The Repositories view rendered to HTML on the server: one section per root of the `git` channel,
// the branch line, the change groups with their diff control, the log, the branches and the
// worktrees with their four controls.
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
    const component = view === 'repositories' ? Repositories : Diff;
    return render(component, {
        context: clientContext(client),
        props: { instance: instance(view, state) }
    }).body;
}

function count(body: string, needle: string): number {
    return body.split(needle).length - 1;
}

describe('the Repositories view', () => {
    it('says nothing is on the channel before the first payload', () => {
        const body = render(Repositories, {
            context: clientContext(client),
            props: { instance: instance() }
        }).body;
        expect(body).toContain(catalog['repositories.empty']);
    });

    it('draws one section per root, in the order the channel carries them', () => {
        const body = html({ [HUB]: HUB_GIT, [OTHER]: git({ branch: 'work' }) });
        expect(body.indexOf(`data-root="${HUB}"`)).toBeGreaterThan(-1);
        expect(body.indexOf(`data-root="${OTHER}"`)).toBeGreaterThan(
            body.indexOf(`data-root="${HUB}"`)
        );
    });

    it('draws the branch line with the distance from the upstream', () => {
        const body = html({ [HUB]: HUB_GIT });
        expect(body).toContain('main');
        expect(body).toContain(catalog['sessions.ch_ahead'].replace('{0}', '2'));
    });

    it('draws the three change groups with a diff control on every row', () => {
        const body = html({ [HUB]: HUB_GIT });
        expect(body).toContain(catalog['sessions.ch_staged']);
        expect(body).toContain(catalog['sessions.ch_changed']);
        expect(body).toContain(catalog['sessions.ch_untracked']);
        expect(body).toContain('code/one.py');
        // One diff control per row, and the staged row says which side it shows.
        expect(count(body, catalog['repositories.diff_title'])).toBe(2);
        expect(count(body, catalog['repositories.diff_staged_title'])).toBe(1);
        expect(body).toContain(catalog['git.stage']);
        expect(body).toContain(catalog['git.unstage']);
        expect(body).toContain(catalog['git.discard']);
    });

    it('draws one row per commit of the log, and says when there is none', () => {
        const body = html({ [HUB]: HUB_GIT });
        expect(body).toContain(catalog['repositories.log']);
        expect(body).toContain('aaaaaaa');
        expect(body).toContain('Add the thing');
        expect(body).toContain('Take the other thing back');
        const bare = html({ [HUB]: git({}) });
        expect(bare).toContain(catalog['repositories.log_empty']);
    });

    it('lists the branches with the switch control on the ones not checked out', () => {
        const body = html({ [HUB]: HUB_GIT });
        expect(body).toContain('origin/main');
        expect(body).toContain('package-one');
        expect(count(body, catalog['repositories.switch'])).toBe(1);
        expect(body).toContain(catalog['git.branch_new_create']);
    });

    it('lists every worktree but the checkout, each with its four controls', () => {
        const body = html({ [HUB]: HUB_GIT });
        expect(body).toContain(`data-entry="${HUB}/.agents/worktrees/package-one"`);
        // The checkout itself is not a row: the three change rows and this one carry the attribute.
        expect(count(body, 'data-entry=')).toBe(4);
        expect(body).toContain(catalog['repositories.diff_worktree_title']);
        expect(body).toContain(catalog['repositories.terminal']);
        expect(body).toContain(catalog['repositories.merge']);
        expect(body).toContain(catalog['repositories.remove']);
    });

    it('offers no merge back while the repository has no branch checked out', () => {
        const body = html({ [HUB]: HUB_GIT });
        expect(body).toContain(catalog['repositories.merge_title']);
        expect(body).not.toContain(catalog['repositories.merge_detached']);

        // A detached HEAD has nothing to merge into, so the control says so and is not pressable.
        const loose = html({ [HUB]: { ...HUB_GIT, detached: true } });
        expect(loose).toContain(catalog['repositories.merge_detached']);
        expect(loose).not.toContain(catalog['repositories.merge_title']);
        const row = loose.slice(loose.indexOf('data-group="worktrees"'));
        expect(row).toContain('disabled');
    });

    it('warns about a repository whose .gitignore does not keep the folder out', () => {
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

        const body = html({ [HUB]: HUB_GIT, [OTHER]: git({ branch: 'work' }) });
        expect(count(body, catalog['git.busy'])).toBe(1);
        const sections = body.split('data-root=');
        expect(sections[1]).toContain(catalog['git.busy']);
        expect(sections[2]).not.toContain(catalog['git.busy']);

        release();
        await first;
        vi.unstubAllGlobals();
    });

    it('draws the error of a root git could not read, and nothing else of it', () => {
        const body = html({ [HUB]: git({ error: 'not a git repository' }) });
        expect(body).toContain(catalog['repositories.error']);
        expect(body).toContain('title="not a git repository"');
        expect(body).not.toContain(catalog['repositories.worktrees']);
        expect(body).not.toContain(catalog['repositories.log']);
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
