// Layer 4, client-state test. The terminals store starting a terminal at once: the bar's New
// Terminal, the kinds dropdown, the pane strip's New Terminal in its own pane, and Split, each a
// `start` post whose answer joins the Terminal tab and is shown; a refusal said on the tab; the
// presses made before the hub root is known; a start answered after its tab closed; and the
// composer's folder, which is the tab's.
//
// The client is built through the client's own wiring (state/client/context.ts) over a stubbed
// `fetch` that records each post and answers it as the case says.
//
// What this does NOT cover: that the controls call these store functions, and the row drawn with
// its sideways scroll, which are seen on screen; the rules over the row itself are
// tests/state/sessions/terminal/terminal-row.test.ts.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createClientState, type ClientState } from '../../../../src/lib/state/client/context.ts';
import { tabsOf } from '../../../../src/lib/state/workbench/layout/instance.ts';
import { readTab, withStarted } from '../../../../src/lib/state/sessions/terminal/terminal-tabs.ts';
import {
    composerOf,
    composerWorkspace,
    offeredPlaces
} from '../../../../src/lib/state/sessions/terminal/composer.ts';
import type { Terminal, TerminalKind } from '../../../../src/lib/data/model/index.ts';
import { fakeStorage } from '../../workbench/layout/layout-fixture.ts';
import { openOwning, tabOf, terminalTabsOf } from './terminal-tabs-fixture.ts';
import { engineDir, loadConfig, textCatalog } from '../../../../src/lib/data/sources/config.ts';
import { setCatalog, t } from '../../../../src/lib/state/shared/words/text.ts';

setCatalog(textCatalog(loadConfig(engineDir()).config));

const A = 'a1a1a1-shell';
const B = 'b2b2b2-shell';
const C = 'c3c3c3-claude';

let client: ClientState;
let version = 0;
let minted = 0;

/** One post the page made, and how the case answers it. */
type Answer = { status: number; body: Record<string, unknown> };
let posts: Record<string, unknown>[] = [];
let answers: (post: Record<string, unknown>) => Answer | Promise<Answer>;

function terminal(id: string, cwd = '/x', kind: TerminalKind = 'shell'): Terminal {
    return {
        id,
        name: id,
        title: '',
        icon: '',
        color: '',
        kind,
        cwd,
        command: kind === 'shell' ? 'zsh' : kind,
        pid: 321,
        created: '2026-09-11T08:00:00.000Z',
        attached: true,
        resumes: null
    };
}

/** A start answer: a fresh terminal of the kind and folder the post named. */
function started(post: Record<string, unknown>): Answer {
    minted += 1;
    const kind = post.kind as TerminalKind;
    const id = `${minted.toString(16).padStart(6, '0')}-${kind}`;
    return { status: 200, body: { ok: true, terminal: terminal(id, String(post.cwd), kind) } };
}

beforeEach(() => {
    client = createClientState();
    client.layout.loadLayout(fakeStorage());
    version = 0;
    minted = 0;
    posts = [];
    answers = started;
    vi.stubGlobal('fetch', (_url: string, init: { body: string }) => {
        const post = JSON.parse(init.body) as Record<string, unknown>;
        posts.push(post);
        return Promise.resolve(answers(post)).then((answer) => ({
            ok: answer.status < 400,
            status: answer.status,
            json: () => Promise.resolve(answer.body)
        }));
    });
});

afterEach(() => vi.unstubAllGlobals());

/** One `sessions` message listing these terminals. */
function listed(records: Terminal[]): void {
    version += 1;
    client.entities.receive({
        channel: 'sessions',
        version,
        payload: { records: [], workspaces: [], terminals: records }
    });
}

/** The portfolio message that tells the page where the hub is. */
function hubKnown(root = '/hub'): void {
    version += 1;
    client.entities.receive({
        channel: 'portfolio',
        version,
        payload: {
            entities: {
                projects: {
                    alpha: { folder: 'projects/alpha', file: `${root}/projects/alpha/project.yml` }
                }
            }
        }
    });
}

const terminalTabs = () => terminalTabsOf(client);

const tab = (id: string) => tabOf(client, id);

function owning(terminals: string[], shown: string | null = terminals[0] ?? null): string {
    return openOwning(client, client.layout.currentPage().id, terminals, shown);
}

/** The `start` posts made, without the geometry. */
function starts(): { kind: unknown; cwd: unknown }[] {
    return posts
        .filter((post) => post.action === 'start')
        .map((post) => ({ kind: post.kind, cwd: post.cwd }));
}

describe('New Terminal on the bar', () => {
    // Revert: show the composer in startInTab instead of posting a shell start.
    it('posts one shell start in the folder of the terminal the tab shows, and shows the new one', async () => {
        hubKnown();
        const id = owning([A]);
        listed([terminal(A, '/x')]);
        const answer = await client.terminals.startInTab(id, 'shell');
        expect(answer.ok).toBe(true);
        expect(starts()).toEqual([{ kind: 'shell', cwd: '/x' }]);
        const held = tab(id);
        expect(held.terminals).toHaveLength(2);
        expect(held.shown).toBe(answer.id);
        expect(held.composing).toBe(false);
    });

    // Revert: fall back to the empty folder, not the hub root, for a tab with no known folder in
    // startInTab.
    it('starts in the hub root for a tab with no terminal', async () => {
        hubKnown('/hub');
        const id = owning([]);
        await client.terminals.startInTab(id, 'shell');
        expect(starts()).toEqual([{ kind: 'shell', cwd: '/hub' }]);
    });

    // Revert: post at once in startInTab with the hub root as it stands.
    it('posts nothing before the hub root is known, and never an empty folder', async () => {
        const id = owning([]);
        const pending = client.terminals.startInTab(id, 'shell');
        await Promise.resolve();
        expect(posts).toEqual([]);
        hubKnown('/hub');
        await pending;
        expect(starts()).toEqual([{ kind: 'shell', cwd: '/hub' }]);
    });

    // Revert: drop the wait for the hub root, or post one start for all the held presses.
    it('posts one start for each of three presses made before the hub root, once it is known', async () => {
        const id = owning([]);
        const pending = [1, 2, 3].map(() => client.terminals.startInTab(id, 'shell'));
        await Promise.resolve();
        expect(posts).toEqual([]);
        hubKnown('/hub');
        await Promise.all(pending);
        expect(starts()).toEqual([
            { kind: 'shell', cwd: '/hub' },
            { kind: 'shell', cwd: '/hub' },
            { kind: 'shell', cwd: '/hub' }
        ]);
        expect(tab(id).terminals).toHaveLength(3);
    });

    // Revert: serialise startInTab behind the earlier press so the second waits for the first.
    it('starts two terminals for two quick presses, the second not waiting for the first answer', async () => {
        hubKnown();
        const id = owning([A]);
        listed([terminal(A, '/x')]);
        let release: () => void = () => undefined;
        const gate = new Promise<void>((resolve) => {
            release = resolve;
        });
        let held = false;
        answers = (post) => {
            if (held) return started(post);
            held = true;
            return gate.then(() => started(post));
        };
        const first = client.terminals.startInTab(id, 'shell');
        const second = client.terminals.startInTab(id, 'shell');
        await new Promise((resolve) => setTimeout(resolve, 0));
        expect(posts).toHaveLength(2);
        release();
        const [one, two] = await Promise.all([first, second]);
        expect(starts()).toHaveLength(2);
        expect(one.id).not.toBe(two.id);
        expect(tab(id).terminals).toEqual(expect.arrayContaining([A, one.id, two.id]));
    });

    // Revert: leave the tab changed, or the refusal unsaid, when the start is refused.
    it('says the refusal on the tab and leaves the tab as it was, with no composer', async () => {
        hubKnown();
        const id = owning([A]);
        listed([terminal(A, '/gone')]);
        answers = () => ({ status: 400, body: { error: 'cwd does not exist: /gone' } });
        const before = JSON.stringify(tab(id));
        const answer = await client.terminals.startInTab(id, 'shell');
        expect(answer.ok).toBe(false);
        expect(JSON.stringify(tab(id))).toBe(before);
        expect(tab(id).composing).toBe(false);
        expect(client.terminals.refusal(id)).toContain('cwd does not exist');
    });

    // Revert: leave the terminal running in startInTab when its tab is gone at the answer.
    it('ends the terminal a start answers after its tab was closed', async () => {
        hubKnown();
        const id = owning([A]);
        listed([terminal(A, '/x')]);
        let answer: (value: Answer) => void = () => undefined;
        answers = (post) =>
            post.action === 'start'
                ? new Promise<Answer>((resolve) => (answer = resolve))
                : { status: 200, body: { ok: true, id: post.id } };
        const pending = client.terminals.startInTab(id, 'shell');
        await Promise.resolve();
        client.layout.closeInstance(id);
        answer(started({ kind: 'shell', cwd: '/x' }));
        await pending;
        const stops = posts.filter((post) => post.action === 'stop');
        expect(stops).toEqual([
            { action: 'stop', id: A },
            { action: 'stop', id: '000001-shell' }
        ]);
    });
});

describe('the kinds dropdown', () => {
    // Revert: start the dropdown's kind in the hub root instead of the tab's folder.
    it("starts Claude at once in the tab's folder", async () => {
        hubKnown();
        const id = owning([A]);
        listed([terminal(A, '/x')]);
        await client.terminals.startInTab(id, 'claude');
        expect(starts()).toEqual([{ kind: 'claude', cwd: '/x' }]);
    });

    // Revert: show no composer for With a Prompt, or open it in another kind than the shown one's.
    it("shows the composer for With a Prompt, in the shown terminal's kind", () => {
        hubKnown();
        const id = owning([C]);
        listed([terminal(C, '/x', 'claude')]);
        client.terminals.composeInTab(id, 'codex');
        expect(tab(id).composing).toBe(true);
        expect(composerOf(client.ui.instanceState(id)).agent).toBe('codex');
        expect(posts).toEqual([]);
    });
});

describe('the pane strip New Terminal', () => {
    // Revert: start in the page's active Terminal tab whichever pane the menu was opened on.
    it('starts in a Terminal tab of the pane picked, a new one when that pane holds none', async () => {
        hubKnown();
        const page = client.layout.currentPage().id;
        const first = owning([A]);
        listed([terminal(A, '/x')]);
        const side = client.layout.openView('projects', undefined, page);
        client.layout.splitInstance(side, [], 'right', page);
        const panes = tabsOf(client.layout.currentPage().workbench.root).map((one) => one.id);
        expect(panes).toContain(first);
        const answer = await client.terminals.newTerminalIn(page, [1]);
        expect(answer.ok).toBe(true);
        expect(tab(first).terminals).toEqual([A]);
        const made = terminalTabs().filter((one) => one.id !== first);
        expect(made).toHaveLength(1);
        expect(readTab(made[0].state).terminals).toEqual([answer.id]);
        expect(starts()).toEqual([{ kind: 'shell', cwd: '/hub' }]);
    });
});

describe('Split', () => {
    // Revert: show the composer in splitTerminal instead of posting the split terminal's start.
    it('posts one start of the split terminal kind and folder, the new one right of it', async () => {
        hubKnown();
        const id = owning([A]);
        listed([terminal(A, '/x')]);
        const answer = await client.terminals.splitTerminal(id, A);
        expect(starts()).toEqual([{ kind: 'shell', cwd: '/x' }]);
        expect(tab(id).row).toEqual([A, answer.id]);
        expect(tab(id).composing).toBe(false);
    });

    // Revert: split as a shell whatever the kind of the terminal split.
    it('starts a Claude terminal for a Claude split, in the same folder', async () => {
        hubKnown();
        const id = owning([C]);
        listed([terminal(C, '/proj', 'claude')]);
        await client.terminals.splitTerminal(id, C);
        expect(starts()).toEqual([{ kind: 'claude', cwd: '/proj' }]);
    });

    // Revert: read the kind and folder of a split from the sessions payload alone.
    it("splits a terminal started a moment ago from the start's answer", async () => {
        hubKnown();
        const id = owning([A]);
        listed([terminal(A, '/x')]);
        const fresh = await client.terminals.startInTab(id, 'claude');
        expect(client.terminals.terminalById(fresh.id)).toBe(null);
        await client.terminals.splitTerminal(id, fresh.id);
        expect(starts()).toEqual([
            { kind: 'claude', cwd: '/x' },
            { kind: 'claude', cwd: '/x' }
        ]);
        expect(tab(id).row).toEqual([fresh.id, '000002-claude']);
    });

    // Revert: return silently from splitTerminal for an id the store has no record of.
    it('says a refusal on the tab for an id the store knows nothing of, and posts nothing', async () => {
        hubKnown();
        const id = owning([A]);
        const answer = await client.terminals.splitTerminal(id, B);
        expect(answer.ok).toBe(false);
        expect(posts).toEqual([]);
        expect(client.terminals.refusal(id)).not.toBe('');
    });

    // Revert: put the new terminal after the shown one whichever terminal is split.
    it('puts the new terminal right of a split terminal that is not the shown one, in its folder', async () => {
        hubKnown();
        const id = owning([A, B], A);
        listed([terminal(A, '/x'), terminal(B, '/y')]);
        const second = await client.terminals.splitTerminal(id, B);
        expect(starts()).toEqual([{ kind: 'shell', cwd: '/y' }]);
        expect(tab(id).row).toEqual([B, second.id]);
        expect(tab(id).terminals).toEqual([A, B, second.id]);
    });
});

describe('New from the key and the Sessions view', () => {
    // Revert: leave the composer's folder at the hub in showComposer.
    it("shows the composer in the page's Terminal tab with the tab's folder as its folder", () => {
        hubKnown('/hub');
        const page = client.layout.currentPage().id;
        const id = owning([A]);
        listed([terminal(A, '/x')]);
        client.terminals.composeIn(page);
        expect(tab(id).composing).toBe(true);
        const record = composerOf(client.ui.instanceState(id));
        const places = ['/hub'];
        expect(composerWorkspace(record, offeredPlaces(places, record), '/hub')).toBe('/x');
        expect(posts).toEqual([]);
    });
});

describe('the pane strip New Terminal over a pane whose active tab is not a Terminal tab', () => {
    // Revert: fall back to the first Terminal tab of the pane in paneTab (state/client/context.ts).
    it('opens a new Terminal tab in that pane and leaves the Terminal tab behind unchanged', async () => {
        hubKnown();
        const page = client.layout.currentPage().id;
        const behind = owning([A]);
        listed([terminal(A, '/x')]);
        client.layout.openView('projects', undefined, page);
        const answer = await client.terminals.newTerminalIn(page, []);
        expect(answer.ok).toBe(true);
        expect(tab(behind).terminals).toEqual([A]);
        const made = terminalTabs().filter((one) => one.id !== behind);
        expect(made).toHaveLength(1);
        expect(readTab(made[0].state).terminals).toEqual([answer.id]);
    });
});

describe('a start from the composer', () => {
    const FRESH = 'f0f0f0-shell';

    // Revert: leave composeTerminal from recording the terminal it answers in `started`.
    it('is ended when its tab closes before any sessions message lists it', async () => {
        hubKnown();
        const id = owning([A]);
        listed([terminal(A, '/x')]);
        answers = (post) =>
            post.action === 'compose'
                ? { status: 200, body: { ok: true, id: FRESH, terminal: terminal(FRESH) } }
                : { status: 200, body: { ok: true, id: post.id } };
        const answer = await client.terminals.composeTerminal({ agent: 'shell' } as never, id);
        client.layout.restateInstance(id, withStarted(tab(id), answer.id, 'Shell'));
        client.layout.closeInstance(id);
        await new Promise((resolve) => setTimeout(resolve, 0));
        const stops = posts.filter((post) => post.action === 'stop').map((post) => post.id);
        expect(stops.sort()).toEqual([A, FRESH].sort());
    });

    // Revert: answer the start as it came in composeTerminal, whether or not its tab is left.
    it('is ended and refused when its tab closed before the answer came', async () => {
        hubKnown();
        const id = owning([]);
        answers = (post) =>
            post.action === 'compose'
                ? { status: 200, body: { ok: true, id: FRESH, terminal: terminal(FRESH) } }
                : { status: 200, body: { ok: true, id: post.id } };
        const asked = client.terminals.composeTerminal({ agent: 'shell' } as never, id);
        client.layout.closeInstance(id);
        const answer = await asked;
        await new Promise((resolve) => setTimeout(resolve, 0));
        expect(answer).toEqual({ ok: false, id: '', error: '' });
        expect(posts.filter((post) => post.action === 'stop').map((post) => post.id)).toEqual([
            FRESH
        ]);
    });
});

describe('New Terminal where the hub has no folder', () => {
    /** The portfolio message of a hub that names no project folder. */
    function emptyHub(): void {
        version += 1;
        client.entities.receive({
            channel: 'portfolio',
            version,
            payload: { entities: { projects: {} } }
        });
    }

    // Revert: keep waiting for the hub root once the portfolio has arrived and names no folder.
    it('says a refusal on the bar and posts nothing, for a press made before and after', async () => {
        const id = owning([]);
        const waiting = client.terminals.startInTab(id, 'shell');
        emptyHub();
        const first = await waiting;
        expect(first.ok).toBe(false);
        expect(client.terminals.refusal(id)).toBe(t('sessions.terminal_no_folder'));
        const again = await client.terminals.startInTab(id, 'shell');
        expect(again.ok).toBe(false);
        expect(posts).toEqual([]);
    });
});
