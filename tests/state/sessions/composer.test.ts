// Layer 2, client-state tests. The composer's own record and words (state/sessions/composer.ts),
// the Terminal tab New shows its composer in (state/sessions/terminals.svelte.ts), the posts the
// composer, the steer box and the row menu's Fork make, and the terminal a session runs in.
//
// Nothing here opens a socket or reaches a server: `fetch` is a stub that records what it was
// asked and answers what the case says.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { scalar } from '../../../src/lib/data/helpers/guards.ts';
import {
    COMPOSER_EMPTY,
    accountFor,
    accountsOf,
    branchOf,
    composeStart,
    composerOf,
    composerPlaces,
    composerWorkspace,
    customizationScopeOf,
    insertMention,
    isImage,
    mention,
    offeredPlaces,
    picksFor,
    promptKey,
    relativeIn,
    splitRecord,
    splitState,
    withComposer,
    withCustomizationScope
} from '../../../src/lib/state/sessions/composer.ts';
import {
    composerState,
    composerTarget,
    followsSelection
} from '../../../src/lib/state/sessions/terminals.svelte.ts';
import type {
    AgentAccount,
    AgentChoices,
    Terminal,
    Workspace
} from '../../../src/lib/data/model/index.ts';
import { createClientState, type ClientState } from '../../fixtures/client.ts';

const CLAUDE: AgentChoices = {
    agent: 'claude',
    label: 'Claude',
    lists: [
        {
            key: 'model',
            label: 'Model',
            flag: '--model',
            default: 'cli',
            values: [
                { id: 'cli', label: 'CLI default', pass: null },
                { id: 'opus', label: 'Opus', pass: 'opus' }
            ]
        }
    ]
};

const ACCOUNTS: AgentAccount[] = [
    { tool: 'claude', label: 'Home', dir: '/h/.claude' },
    { tool: 'claude', label: 'Uni', dir: '/u' },
    { tool: 'codex', label: 'Work', dir: '/h/.codex' }
];

describe("a tab's composer record", () => {
    it('reads the agent, the workspace, the accounts and the picks, anything malformed as unset', () => {
        const held = {
            other: 1,
            composer: {
                workspace: '/hub',
                agent: 'shell',
                accounts: { claude: 'Uni', codex: 7 },
                picks: { claude: { model: 'opus', effort: '' }, codex: 'nope' }
            }
        };
        expect(composerOf(held)).toEqual({
            workspace: '/hub',
            agent: 'shell',
            accounts: { claude: 'Uni', codex: undefined },
            picks: { claude: { model: 'opus' }, codex: {} }
        });
        for (const state of [null, [], {}, { composer: 'x' }]) {
            expect(composerOf(state)).toBe(COMPOSER_EMPTY);
        }
        expect(composerOf({ composer: { agent: 'rm' } }).agent).toBe('claude');
    });

    it('writes the record beside the rest of the tab state', () => {
        const next = withComposer({ id: 'x', follow: true }, { ...COMPOSER_EMPTY, agent: 'codex' });
        expect(next).toEqual({
            id: 'x',
            follow: true,
            composer: { ...COMPOSER_EMPTY, agent: 'codex' }
        });
        expect(composerOf(next).agent).toBe('codex');
    });

    it('shows the tab choice where the catalog still offers it, and the default where it does not', () => {
        expect(picksFor(CLAUDE, { model: 'opus' })).toEqual({ model: 'opus' });
        expect(picksFor(CLAUDE, { model: 'gone' })).toEqual({ model: 'cli' });
        expect(picksFor(CLAUDE, undefined)).toEqual({ model: 'cli' });
        expect(picksFor(null, { model: 'opus' })).toEqual({});
    });

    it('names the chosen account while it is configured, else the agent first, and none for a shell', () => {
        expect(accountsOf(ACCOUNTS, 'claude').map((one) => one.label)).toEqual(['Home', 'Uni']);
        expect(accountsOf(ACCOUNTS, 'shell')).toEqual([]);
        expect(accountFor(ACCOUNTS, 'claude', 'Uni')).toBe('Uni');
        expect(accountFor(ACCOUNTS, 'claude', 'Gone')).toBe('Home');
        expect(accountFor(ACCOUNTS, 'claude', 'Work')).toBe('Home');
        expect(accountFor(ACCOUNTS, 'claude', undefined)).toBe('Home');
        expect(accountFor([], 'codex', 'Work')).toBe('');
    });

    it('offers the hub first, then every root and every session workspace once, in order', () => {
        const tree = [{ key: '/w/b' }, { key: '/hub' }, { key: '' }] as unknown as Workspace[];
        const saved = [{ roots: [{ dir: '/hub' }, { dir: '/w/a' }] }, { roots: [{ dir: '/w/a' }] }];
        expect(composerPlaces('/hub', saved, tree)).toEqual(['/hub', '/w/a', '/w/b']);
        expect(composerPlaces('', [], tree)).toEqual(['/hub', '/w/b']);
    });
});

describe('a composer opened by Split', () => {
    const places = ['/hub', '/hub/tools'];

    it("records the terminal's own folder as the folder it was split from and starts there", () => {
        expect(splitRecord('/hub/projects/foo/code', 'shell')).toEqual({
            ...COMPOSER_EMPTY,
            workspace: '/hub/projects/foo/code',
            agent: 'shell',
            split: '/hub/projects/foo/code'
        });
    });

    it('reads the split folder as a string, and drops an empty or malformed one', () => {
        expect(composerOf({ composer: { split: '/w/x' } }).split).toBe('/w/x');
        expect('split' in composerOf({ composer: { split: '' } })).toBe(false);
        expect('split' in composerOf({ composer: { split: 7 } })).toBe(false);
    });

    it('opens a split tab whose composer offers and starts in a folder outside every place', () => {
        const record = composerOf(splitState('/tmp/elsewhere', 'shell'));
        expect(record.agent).toBe('shell');
        expect(offeredPlaces(['/hub', '/hub/tools'], record)).toEqual([
            '/tmp/elsewhere',
            '/hub',
            '/hub/tools'
        ]);
        expect(
            composerWorkspace(record, offeredPlaces(['/hub', '/hub/tools'], record), '/hub')
        ).toBe('/tmp/elsewhere');
    });

    it('offers a split folder no place holds first, by its path, and starts in it', () => {
        const record = composerOf({ composer: splitRecord('/hub/projects/foo/code', 'claude') });
        const offered = offeredPlaces(places, record);
        expect(offered).toEqual(['/hub/projects/foo/code', '/hub', '/hub/tools']);
        expect(composerWorkspace(record, offered, '/hub')).toBe('/hub/projects/foo/code');
    });

    it('offers the places as they are when the split folder is one of them, with it chosen', () => {
        const record = composerOf({ composer: splitRecord('/hub/tools', 'shell') });
        const offered = offeredPlaces(places, record);
        expect(offered).toEqual(places);
        expect(composerWorkspace(record, offered, '/hub')).toBe('/hub/tools');
    });

    it('offers the places as they are to a composer no Split opened', () => {
        const record = composerOf({ composer: { workspace: '/elsewhere', agent: 'claude' } });
        const offered = offeredPlaces(places, record);
        expect(offered).toEqual(places);
        expect(composerWorkspace(record, offered, '/hub')).toBe('/hub');
        expect(offeredPlaces(places, COMPOSER_EMPTY)).toEqual(places);
    });
});

describe('a file put into the prompt', () => {
    it('is a mention of its path inside the workspace, and nothing for a file outside it', () => {
        expect(relativeIn('/hub', '/hub/a/b.ts')).toBe('a/b.ts');
        expect(relativeIn('/hub/', '/hub/a.ts')).toBe('a.ts');
        expect(relativeIn('/hub', '/hubby/a.ts')).toBe(null);
        expect(relativeIn('/hub', '/hub')).toBe(null);
        expect(relativeIn('', '/a.ts')).toBe(null);
        expect(mention('a/b.ts')).toBe('@a/b.ts');
    });

    it('goes in at the caret with a space on each side the text beside it lacks', () => {
        expect(insertMention('fix this', 3, '@a.ts')).toEqual({ text: 'fix @a.ts this', caret: 9 });
        expect(insertMention('', 0, '@a.ts')).toEqual({ text: '@a.ts ', caret: 6 });
        expect(insertMention('see ', 4, '@a.ts')).toEqual({ text: 'see @a.ts ', caret: 10 });
        expect(insertMention('x', 99, '@a.ts')).toEqual({ text: 'x @a.ts ', caret: 8 });
        expect(insertMention('x', -5, '@a.ts')).toEqual({ text: '@a.ts x', caret: 6 });
    });

    it('is an image by its extension, in any case', () => {
        expect(['a.png', 'b.JPG', 'c.jpeg', 'd.gif', 'e.webp'].every(isImage)).toBe(true);
        expect(['a.ts', 'png', 'a.png.txt'].some(isImage)).toBe(false);
    });
});

describe('the start the composer sends', () => {
    it('attaches images for Codex only, once each, and nothing but the prompt for a shell', () => {
        const attached = ['/w/a.png', '/w/a.png', '/w/b.ts'];
        expect(composeStart('codex', '/w', 'Work', { model: 'cli' }, 'look', attached)).toEqual({
            agent: 'codex',
            cwd: '/w',
            account: 'Work',
            picks: { model: 'cli' },
            prompt: 'look',
            images: ['/w/a.png']
        });
        expect(composeStart('claude', '/w', 'Uni', {}, 'p', attached).images).toEqual([]);
        expect(composeStart('shell', '/w', 'Uni', { model: 'opus' }, 'ls', attached)).toEqual({
            agent: 'shell',
            cwd: '/w',
            account: '',
            picks: {},
            prompt: 'ls',
            images: []
        });
    });

    it('starts on Enter, and types a new line on Shift+Enter or while a character is composed', () => {
        expect(promptKey({ key: 'Enter', shiftKey: false })).toBe('send');
        expect(promptKey({ key: 'Enter', shiftKey: true })).toBe('type');
        expect(promptKey({ key: 'Enter', shiftKey: false, isComposing: true })).toBe('type');
        expect(promptKey({ key: 'a', shiftKey: false })).toBe('type');
    });
});

describe("the Customizations section's scope", () => {
    it('reads open by default, the agent, the account, the workspace and the rows opened', () => {
        expect(customizationScopeOf({})).toEqual({
            open: true,
            agent: 'claude',
            account: '',
            workspace: '',
            expanded: []
        });
        const held = withCustomizationScope(
            { filter: 1 },
            { open: false, agent: 'codex', account: 'W', workspace: '/w', expanded: ['mcp'] }
        );
        expect(held.filter).toBe(1);
        expect(customizationScopeOf(held)).toEqual({
            open: false,
            agent: 'codex',
            account: 'W',
            workspace: '/w',
            expanded: ['mcp']
        });
        expect(
            customizationScopeOf({ custom: { agent: 'shell', account: 3, expanded: ['a', 4] } })
        ).toEqual({ open: true, agent: 'claude', account: '', workspace: '', expanded: ['a'] });
    });
});

describe('the Terminal tab New shows its composer in', () => {
    it('is the first that follows the selection, a tab pinned to a terminal left alone', () => {
        const tabs = [
            { id: 'files', view: 'files', state: {} },
            { id: 'pinned', view: 'terminal', state: { session: 'a1b2c3-shell' } },
            { id: 'fresh', view: 'terminal', state: composerState('n1') },
            { id: 'plain', view: 'terminal', state: {} }
        ];
        expect(composerTarget(tabs)).toBe('fresh');
        expect(composerTarget(tabs.slice(0, 2))).toBe(null);
        expect(composerTarget([])).toBe(null);
        expect(followsSelection(null)).toBe(true);
        expect(followsSelection({ id: '' })).toBe(true);
        expect(followsSelection({ id: 'x' })).toBe(false);
        expect(composerState('n2')).toEqual({ id: 'n2', follow: true });
    });
});

describe('the posts the composer, the steer box and Fork make', () => {
    let client: ClientState;
    let asked: { url: string; body: Record<string, unknown> }[] = [];

    beforeEach(() => {
        client = createClientState();
        asked = [];
        vi.stubGlobal('fetch', (url: string, init: RequestInit) => {
            asked.push({ url, body: JSON.parse(scalar(init.body)) as Record<string, unknown> });
            return Promise.resolve(
                new Response(JSON.stringify({ ok: true, terminal: { id: 'ffee00-claude' } }), {
                    status: 200
                })
            );
        });
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('send the start, the message, the interrupt and the fork as their actions', async () => {
        const { composeTerminal, forkTerminal, interruptTerminal, steerTerminal } =
            client.terminals;
        const start = composeStart('claude', '/w', 'Uni', { model: 'opus' }, 'go', []);
        expect(await composeTerminal(start, 100, 30)).toEqual({
            ok: true,
            id: 'ffee00-claude',
            error: ''
        });
        await steerTerminal('a1b2c3-claude', 'more');
        await interruptTerminal('a1b2c3-claude');
        await forkTerminal('codex', 'sid');
        expect(asked.map((one) => one.body)).toEqual([
            { action: 'compose', ...start, cols: 100, rows: 30 },
            { action: 'steer', id: 'a1b2c3-claude', text: 'more' },
            { action: 'interrupt', id: 'a1b2c3-claude' },
            { action: 'fork', tool: 'codex', id: 'sid', cols: 80, rows: 24 }
        ]);
    });
});

describe('the terminal a session runs in', () => {
    function terminal(id: string, over: Partial<Terminal> = {}): Terminal {
        return {
            id,
            name: id,
            kind: 'claude',
            cwd: '/w',
            command: 'claude',
            pid: 0,
            created: '2026-09-11T08:00:00.000Z',
            attached: false,
            resumes: null,
            ...over
        };
    }

    it('is the one that resumed it, else the one whose process it is, and none for a foreign one', () => {
        const client = createClientState();
        client.entities.receive({
            channel: 'sessions',
            version: 1,
            payload: {
                records: [],
                workspaces: [],
                terminals: [
                    terminal('aaaaaa-claude', { resumes: { tool: 'claude', id: 's1' } }),
                    terminal('bbbbbb-claude', { pid: 4242 }),
                    terminal('cccccc-claude', { pid: 5151, foreign: true })
                ]
            }
        });
        const { terminalOfSession } = client.terminals;
        expect(terminalOfSession({ id: 's1', pid: null })?.id).toBe('aaaaaa-claude');
        expect(terminalOfSession({ id: 's2', pid: 4242 })?.id).toBe('bbbbbb-claude');
        expect(terminalOfSession({ id: 's3', pid: 5151 })).toBe(null);
        expect(terminalOfSession({ id: 's4', pid: null })).toBe(null);
        expect(terminalOfSession(null)).toBe(null);
    });
});

describe('the branch the composer shows', () => {
    // the deeper checkout is listed first, so the deepest wins by its length and not by its order
    const git = {
        '/hub/projects/deep': { branch: 'feature' },
        '/hub': { branch: 'main' },
        '/hubs': { branch: 'other' }
    };

    it('is the branch of the deepest checkout holding the workspace', () => {
        expect(branchOf('/hub/projects/deep/src', git)).toBe('feature');
        expect(branchOf('/hub/projects', git)).toBe('main');
        expect(branchOf('/hub', git)).toBe('main');
    });

    it('is none for a folder no checkout holds, a sibling whose name starts the same included', () => {
        expect(branchOf('/hubx', git)).toBe('');
        expect(branchOf('/elsewhere', git)).toBe('');
        expect(branchOf('', git)).toBe('');
        expect(branchOf('/hub', null)).toBe('');
    });
});
