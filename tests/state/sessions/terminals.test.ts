// Layer 2, client-state tests. The page's end of a terminal: the posts to /api/terminal, the
// terminals a sessions payload carries and the rules over them (which ended, which no tab owns, the
// label), the base64 on the wire and the title stripper.
//
// `fetch` is the same stub shape the other state tests use. Nothing reads ~/.claude, ~/.codex or
// ~/.oculus, and nothing writes anywhere.
//
// What this does NOT cover: xterm.js, which needs a DOM the suite does not have; the pty channel on
// the socket, which is terminal/pty/pty-socket.test.ts; and the server's own handling of the two
// messages, which is tests/server/machine/pty/channel.test.ts.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    decodeBytes,
    encodeBytes,
    endedTerminals,
    terminalLabel,
    titleStripper,
    unownedTerminals
} from '../../../src/lib/state/sessions/terminals.svelte.ts';
import { isTerminalId } from '../../../src/lib/state/sessions/terminal/terminal-tabs.ts';
import type { Terminal } from '../../../src/lib/data/model/index.ts';
import { createClientState, type ClientState } from '../../fixtures/client.ts';
import { fakeStorage } from '../workbench/layout/layout-fixture.ts';
import { openOwning, tabOf, terminalTabsOf } from '../client/terminal/terminal-tabs-fixture.ts';
import { engineDir, loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';
import { setCatalog } from '../../../src/lib/state/shared/words/text.ts';
import { CHANNEL, ID, asked, lastBody, serving } from './terminal/pty/pty-fixture.ts';

// The layout names its default page from the catalog, so the real one is installed.
setCatalog(textCatalog(loadConfig(engineDir()).config));

let client: ClientState;
let receive: ClientState['entities']['receive'];
let setToken: ClientState['writes']['setToken'];
let recoverDataset: ClientState['terminals']['recoverDataset'];
let resizeTerminal: ClientState['terminals']['resizeTerminal'];
let startChat: ClientState['terminals']['startChat'];
let startTask: ClientState['terminals']['startTask'];
let startTerminal: ClientState['terminals']['startTerminal'];
let stopTerminal: ClientState['terminals']['stopTerminal'];
let terminalById: ClientState['terminals']['terminalById'];
let terminals: ClientState['terminals']['terminals'];

beforeEach(() => {
    client = createClientState();
    ({ receive } = client.entities);
    ({ setToken } = client.writes);
    ({
        recoverDataset,
        resizeTerminal,
        startChat,
        startTask,
        startTerminal,
        stopTerminal,
        terminalById,
        terminals
    } = client.terminals);
});

function terminal(over: Partial<Terminal> = {}): Terminal {
    return {
        id: ID,
        name: ID,
        title: '',
        icon: '',
        color: '',
        kind: 'shell',
        cwd: '/hub/tools/oculus',
        command: 'zsh',
        pid: 321,
        created: '2026-09-11T08:00:00.000Z',
        attached: true,
        resumes: null,
        task: false,
        exit: null,
        job: null,
        ...over
    };
}

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('a terminal id', () => {
    it('is six hex digits and a kind, and nothing a session id could be', () => {
        expect(isTerminalId(ID)).toBe(true);
        expect(isTerminalId('a1b2c3-claude')).toBe(true);
        expect(isTerminalId('0f5c62-codex')).toBe(true);
        // A Claude session id is a UUID and a Codex slug is a day path; neither is this shape.
        expect(isTerminalId('3f2504e0-4f89-11d3-9a0c-0305e82c3301')).toBe(false);
        expect(isTerminalId('2026/09/11/rollout-1')).toBe(false);
        expect(isTerminalId('A1B2C3-shell')).toBe(false);
        expect(isTerminalId(null)).toBe(false);
    });

    it('names its channel', () => {
        expect(CHANNEL).toBe('pty:a1b2c3-shell');
    });
});

describe('the terminals the payload carries', () => {
    it('reads them out of the sessions payload and finds one by id', () => {
        receive({
            channel: 'sessions',
            version: 1,
            payload: { records: [], workspaces: [], terminals: [terminal()] }
        });
        expect(terminals().map((one) => one.id)).toEqual([ID]);
        expect(terminalById(ID)?.cwd).toBe('/hub/tools/oculus');
        expect(terminalById('nothing-shell')).toBe(null);
    });
});

describe('base64 on the wire', () => {
    it('carries bytes a string could not', () => {
        expect(decodeBytes(encodeBytes('ls -l\r'))).toEqual(new TextEncoder().encode('ls -l\r'));
        // A lone byte above 0x7f is not valid UTF-8 and still survives, which is the reason the
        // wire carries base64 rather than a string.
        expect(decodeBytes('/w==')).toEqual(new Uint8Array([0xff]));
    });

    it('reads anything that is not base64 as no bytes', () => {
        expect(decodeBytes('not base64 at all!')).toEqual(new Uint8Array(0));
    });
});

describe('the four actions of /api/terminal', () => {
    it('starts one with its kind, its directory and a geometry', async () => {
        serving(200, { ok: true, terminal: terminal({ id: 'ffee00-claude' }) });
        setToken('the-token');
        const answer = await startTerminal('claude', '/hub', 120, 40);
        expect(answer).toMatchObject({
            ok: true,
            id: 'ffee00-claude',
            error: '',
            terminal: { id: 'ffee00-claude' }
        });
        expect(asked[0].url).toBe('/api/terminal');
        expect(asked[0].init.method).toBe('POST');
        expect((asked[0].init.headers as Record<string, string>)['x-oculus-token']).toBe(
            'the-token'
        );
        expect(lastBody()).toEqual({
            action: 'start',
            kind: 'claude',
            cwd: '/hub',
            cols: 120,
            rows: 40
        });
    });

    it('starts one at a default geometry when the pane has not been measured', async () => {
        serving(200, { ok: true, terminal: terminal() });
        await startTerminal('shell', '/hub');
        expect(lastBody()).toEqual({
            action: 'start',
            kind: 'shell',
            cwd: '/hub',
            cols: 80,
            rows: 24
        });
    });

    it('stops one and resizes one by id', async () => {
        serving(200, { ok: true, id: ID });
        await stopTerminal(ID);
        expect(lastBody()).toEqual({ action: 'stop', id: ID });
        await resizeTerminal(ID, 100, 30);
        expect(lastBody()).toEqual({ action: 'resize', id: ID, cols: 100, rows: 30 });
    });

    it('starts a dataset recovery with its key and geometry', async () => {
        serving(200, { ok: true, terminal: terminal({ id: 'ffee00-shell' }) });
        await recoverDataset('mimic-iv', 96, 28);
        expect(lastBody()).toEqual({
            action: 'recover',
            key: 'mimic-iv',
            cols: 96,
            rows: 28
        });
    });

    it('starts an update task without sending a command or directory from the page', async () => {
        serving(200, { ok: true, terminal: terminal({ id: 'ffee00-claude' }) });
        await startTask('litwatch', 96, 28);
        expect(lastBody()).toEqual({
            action: 'task',
            kind: 'litwatch',
            cols: 96,
            rows: 28
        });
    });

    it('starts a focused chat without sending a command or directory from the page', async () => {
        serving(200, { ok: true, terminal: terminal({ id: 'ffee00-claude' }) });
        await startChat('alpha', 96, 28);
        expect(lastBody()).toEqual({
            action: 'chat',
            id: 'alpha',
            cols: 96,
            rows: 28
        });
    });

    // Revert: leave `...targetFields(target)` out of the latex call in terminals.svelte.ts.
    it('starts a LaTeX step of a project by its id and of a folder by its root and path', async () => {
        serving(200, { ok: true, terminal: terminal({ id: 'ffee00-shell' }) });

        await client.terminals.latex({ id: 'alpha' }, 'main.tex', 'build', 96, 28);
        expect(lastBody()).toEqual({
            action: 'latex',
            id: 'alpha',
            main: 'main.tex',
            step: 'build',
            cols: 96,
            rows: 28
        });

        await client.terminals.latex({ root: 'docs', path: 'proposal' }, 'main.tex', 'clean');
        expect(lastBody()).toEqual({
            action: 'latex',
            root: 'docs',
            path: 'proposal',
            main: 'main.tex',
            step: 'clean',
            cols: 80,
            rows: 24
        });
    });
});

describe('the title stripper', () => {
    const text = (bytes: Uint8Array): string => new TextDecoder().decode(bytes);
    const bytes = (s: string): Uint8Array => new TextEncoder().encode(s);

    it('drops a window title a shell wrote and keeps everything round it', () => {
        const strip = titleStripper();
        expect(text(strip(bytes('\x1bkecho\x1b\\raw-check\r\n')))).toBe('raw-check\r\n');
        expect(text(strip(bytes('plain \x1b[36mcolour\x1b[0m')))).toBe(
            'plain \x1b[36mcolour\x1b[0m'
        );
    });

    it('carries a title cut across two chunks, and a lone escape at the end', () => {
        const strip = titleStripper();
        expect(text(strip(bytes('before\x1bkec')))).toBe('before');
        expect(text(strip(bytes('ho\x1b\\after')))).toBe('after');
        expect(text(strip(bytes('tail\x1b')))).toBe('tail');
        expect(text(strip(bytes('[0mrest')))).toBe('\x1b[0mrest');
    });
});

describe('the terminals that ended', () => {
    it('are the ones an earlier message listed and this one does not', () => {
        expect(endedTerminals(new Set(['a', 'b']), ['b'], false, [])).toEqual(['a']);
    });

    it('include a terminal a tab holds when the first message does not list it', () => {
        expect(endedTerminals(new Set(), [], true, ['c'])).toEqual(['c']);
    });

    it('leave out a terminal started here that no message has listed yet', () => {
        expect(endedTerminals(new Set(), [], false, ['d'])).toEqual([]);
    });

    it('are none when the message carries no terminal list', () => {
        expect(endedTerminals(new Set(['a']), null, false, ['a'])).toEqual([]);
        expect(endedTerminals(new Set(), null, true, ['a'])).toEqual([]);
    });

    it('name each terminal once, whether a tab holds it or an earlier message listed it', () => {
        expect(endedTerminals(new Set(['a']), [], true, ['a', 'a'])).toEqual(['a']);
    });
});

describe('the terminals the page hears in both shapes it is given them', () => {
    const lists = [
        ['a', 'b'],
        ['a', 'b'],
        ['a', 'b', 'c']
    ];

    /** The page's own loop: each list is judged against the ones heard before it. */
    function ended(held: string[], carried: Set<string>, first: boolean): string[][] {
        const seen = new Set(carried);
        return lists.map((now, at) => {
            const gone = endedTerminals(seen, now, first && at === 0, at === 0 ? held : []);
            for (const id of now) seen.add(id);
            return gone;
        });
    }

    it('end none of the terminals a list keeps, after a reload, where the tabs hold them and nothing is seen', () => {
        expect(ended(['a', 'b'], new Set(), true)).toEqual([[], [], []]);
    });

    it('end none of the terminals a list keeps, after a reconnect, where the lists heard before are carried', () => {
        expect(ended([], new Set(['a', 'b']), false)).toEqual([[], [], []]);
    });
});

describe('the terminals no Terminal tab owns', () => {
    const A = 'aaaaaa-shell';
    const B = 'bbbbbb-shell';
    const C = 'cccccc-claude';

    /** A listed terminal with only what the rule reads. */
    function entry(id: string, over: Partial<Terminal> = {}): Terminal {
        return {
            id,
            name: id,
            title: '',
            icon: '',
            color: '',
            kind: 'shell',
            cwd: '/hub',
            command: 'zsh',
            pid: 1,
            created: '2026-09-11T08:00:00.000Z',
            attached: false,
            resumes: null,
            task: false,
            exit: null,
            job: null,
            ...over
        };
    }

    /** A Terminal tab owning these terminals, in the shape a layout holds it. */
    const tab = (...owned: string[]) => ({
        state: { id: `tab-${owned.join('-')}`, terminals: owned }
    });

    it('are the listed ones no tab on any page owns, in list order', () => {
        const list = [entry(A), entry(B), entry(C)];
        expect(unownedTerminals(list, [tab(A), tab(C)]).map((one) => one.id)).toEqual([B]);
        expect(unownedTerminals(list, [tab(A, B, C)])).toEqual([]);
        expect(unownedTerminals(list, []).map((one) => one.id)).toEqual([A, B, C]);
    });

    it('are none while no list has been heard', () => {
        expect(unownedTerminals(null, [tab(A)])).toEqual([]);
        expect(unownedTerminals(null, [])).toEqual([]);
    });

    it('leave out a terminal a tab owns that the list does not name, and count none the list lacks', () => {
        expect(unownedTerminals([entry(A)], [tab(B)]).map((one) => one.id)).toEqual([A]);
    });

    it('leave out a foreign terminal, as Join Terminals does', () => {
        const list = [entry(A, { foreign: true }), entry(B)];
        expect(unownedTerminals(list, []).map((one) => one.id)).toEqual([B]);
    });
});

describe("a terminal's label", () => {
    it('is its title when it has been renamed, and its name when the title is empty', () => {
        expect(terminalLabel({ name: 'zsh', title: 'build' })).toBe('build');
        expect(terminalLabel({ name: 'zsh', title: '' })).toBe('zsh');
    });
});

describe('a message with no terminal list', () => {
    it('is not the first message, so the first list that lacks the terminal of a tab it owned alone closes the tab', () => {
        client.layout.loadLayout(fakeStorage());
        const page = client.layout.currentPage().id;
        const tab = client.layout.openView('terminal', { session: 'c3c3c3-shell' }, page);
        receive({ channel: 'sessions', version: 1, payload: { records: [], workspaces: [] } });
        receive({
            channel: 'sessions',
            version: 2,
            payload: { records: [], workspaces: [], terminals: [] }
        });
        const tabs = client.layout
            .pages()
            .some((one) => JSON.stringify(one.workbench.root).includes(`"${tab}"`));
        expect(tabs).toBe(false);
    });
});

describe('a sessions payload whose terminals are of the wrong shape', () => {
    const OWNED = ['a1a1a1-shell', 'b2b2b2-shell'];
    const OTHER = 'c3c3c3-claude';
    const T = (id: string) => terminal({ id });

    /** A Terminal tab owning both terminals, and a reader of what it owns after a message. */
    function owner(): { tab: string; owns: () => string[] | null } {
        client.layout.loadLayout(fakeStorage());
        const tab = openOwning(client, client.layout.currentPage().id, OWNED);
        const owns = () =>
            terminalTabsOf(client).some((one) => one.id === tab)
                ? tabOf(client, tab).terminals
                : null;
        return { tab, owns };
    }

    const list = (terminals: unknown, version: number) =>
        receive({
            channel: 'sessions',
            version,
            payload: { records: [], workspaces: [], terminals }
        });

    it.each(['x', {}, null, 3])(
        'does not hear a terminals value of %j, so the next list is the first',
        (value) => {
            const { owns } = owner();
            list(value, 1);
            expect(owns()).toStrictEqual(OWNED);
            expect(terminals()).toStrictEqual([]);
            expect(terminalById(OWNED[0])).toBe(null);
            list([], 2);
            expect(owns()).toBe(null);
        }
    );

    it('hears the ids that are strings of a list holding anything else, and takes out the terminals it lacks', () => {
        const { owns } = owner();
        const junk = [T(OWNED[0]), null, 3, { id: 3 }, 'x', [], T(OTHER)];
        list(junk, 1);
        expect(owns()).toStrictEqual([OWNED[0]]);
    });

    it('leaves out an item of the list that is no terminal', () => {
        list([terminal(), null, 3, 'x', [], T(OTHER)], 1);
        expect(terminals().map((one) => one.id)).toStrictEqual([ID, OTHER]);
        expect(client.terminals.attachable().map((one) => one.id)).toStrictEqual([ID, OTHER]);
    });
});
