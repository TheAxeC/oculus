// Layer 2, client-state tests. The composer's own record and words
// (state/sessions/terminal/composer.ts), the record a Split writes into the tab it splits, the
// posts the composer, the steer box and the row menu's Fork make, and the terminal a session runs
// in.
//
// Nothing here opens a socket or reaches a server: `fetch` is a stub that records what it was
// asked and answers what the case says.

import { openOwning } from '../../client/terminal/terminal-tabs-fixture.ts';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { scalar } from '../../../../src/lib/data/helpers/guards.ts';
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
    freshComposer,
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
} from '../../../../src/lib/state/sessions/terminal/composer.ts';
import type {
    AgentAccount,
    AgentChoices,
    Terminal,
    Workspace
} from '../../../../src/lib/data/model/index.ts';
import { createClientState, type ClientState } from '../../../fixtures/client.ts';

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

/** A state read from JSON text, which can hold an own `__proto__` key that a literal cannot. */
const json = (text: string): unknown => JSON.parse(text);

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

    it("keeps the tab's other choices when a Split writes into a tab that holds a record", () => {
        const held = withComposer(
            { other: 1 },
            {
                ...COMPOSER_EMPTY,
                workspace: '/hub',
                agent: 'codex',
                accounts: { codex: 'Work' },
                picks: { claude: { model: 'opus' } }
            }
        );
        const state = splitState('/hub/tools', 'claude', held);
        expect(state.other).toBe(1);
        expect(composerOf(state)).toEqual({
            workspace: '/hub/tools',
            agent: 'claude',
            accounts: { claude: undefined, codex: 'Work' },
            picks: { claude: { model: 'opus' }, codex: {} },
            split: '/hub/tools'
        });
    });

    it('reads the split folder as a string, and drops an empty one', () => {
        expect(composerOf({ composer: { split: '/w/x' } }).split).toBe('/w/x');
        expect('split' in composerOf({ composer: { split: '' } })).toBe(false);
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
        const owner = openOwning(client, client.layout.currentPage().id, [], null);
        expect(await composeTerminal(start, owner, 100, 30)).toMatchObject({
            ok: true,
            id: 'ffee00-claude',
            error: '',
            terminal: { id: 'ffee00-claude' }
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
            title: '',
            icon: '',
            color: '',
            kind: 'claude',
            cwd: '/w',
            command: 'claude',
            pid: 0,
            created: '2026-09-11T08:00:00.000Z',
            attached: false,
            resumes: null,
            task: false,
            exit: null,
            job: null,
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

describe('a composer record out of a state of the wrong shape', () => {
    const UNSET = {
        workspace: '',
        agent: 'claude',
        accounts: { claude: undefined, codex: undefined },
        picks: { claude: {}, codex: {} }
    };

    it('keeps the picks that are non-empty words', () => {
        const record = composerOf({ composer: { picks: { claude: { a: 'b', c: 1, '': 'x' } } } });
        expect(record).toStrictEqual({
            ...UNSET,
            picks: { claude: { a: 'b', '': 'x' }, codex: {} }
        });
    });

    it('answers the empty record itself for a state with no map under composer', () => {
        for (const state of [
            'x',
            3,
            undefined,
            null,
            [],
            {},
            { composer: 'x' },
            { composer: [] },
            { composer: null }
        ]) {
            expect(composerOf(state)).toBe(COMPOSER_EMPTY);
        }
    });

    it.each([
        ['an empty record', { composer: {} }, UNSET],
        [
            'a workspace and a split that are numbers, an agent in the wrong case',
            { composer: { workspace: 3, agent: 'Codex', split: 3 } },
            UNSET
        ],
        ['a codex agent', { composer: { agent: 'codex' } }, { ...UNSET, agent: 'codex' }],
        [
            'accounts with an empty word and a word',
            { composer: { accounts: { claude: '', codex: 'c' } } },
            { ...UNSET, accounts: { claude: undefined, codex: 'c' } }
        ],
        ['accounts and picks that are lists', { composer: { accounts: [], picks: [] } }, UNSET],
        [
            'picks that are a list and a string',
            { composer: { picks: { claude: [], codex: 'x' } } },
            UNSET
        ]
    ])('reads %s', (_name, state, expected) => {
        expect(composerOf(state)).toStrictEqual(expected);
    });

    it('skips an own __proto__ key of a pick map or an account map, as it skips any value that is no word', () => {
        const picks = composerOf({
            composer: {
                picks: {
                    claude: json('{"__proto__":"x","a":"b"}'),
                    codex: json('{"__proto__":{"z":"y"},"a":"b"}')
                }
            }
        }).picks;
        expect(Object.keys(picks.claude ?? {})).toStrictEqual(['a']);
        expect(Object.keys(picks.codex ?? {})).toStrictEqual(['a']);
        expect(picks).toStrictEqual({ claude: { a: 'b' }, codex: { a: 'b' } });
        const accounts = composerOf({
            composer: { accounts: json('{"__proto__":"x","claude":"a"}') }
        }).accounts;
        expect(accounts).toStrictEqual({ claude: 'a', codex: undefined });
    });

    it('does not read an own __proto__ key as the record it holds', () => {
        const state = json('{"composer":{"__proto__":{"agent":"codex"},"workspace":"w"}}');
        expect(composerOf(state)).toStrictEqual({ ...UNSET, workspace: 'w' });
        expect(composerOf(json('{"__proto__":{"composer":{"agent":"codex"}}}'))).toBe(
            COMPOSER_EMPTY
        );
    });

    it('writes a record beside the keys of the state it was handed, an own __proto__ key among them', () => {
        const held = json('{"__proto__":{"x":1},"k":1}');
        expect(Object.keys(withComposer(held, COMPOSER_EMPTY))).toStrictEqual([
            '__proto__',
            'k',
            'composer'
        ]);
        for (const state of [[], null, 'x']) {
            expect(withComposer(state, COMPOSER_EMPTY)).toStrictEqual({
                composer: COMPOSER_EMPTY
            });
        }
    });

    it('opens a split and a fresh composer on a state that is no map as on an empty one', () => {
        expect(splitState('/f', 'codex', [])).toStrictEqual({
            composer: { workspace: '/f', agent: 'codex', accounts: {}, picks: {}, split: '/f' }
        });
        expect(freshComposer('x')).toStrictEqual({
            composer: { workspace: '', agent: 'claude', accounts: {}, picks: {} }
        });
    });
});

describe("the Customizations section's scope out of a state of the wrong shape", () => {
    const UNSET = { open: true, agent: 'claude', account: '', workspace: '', expanded: [] };

    it.each([
        ['a list', []],
        ['null', null],
        ['a list under custom', { custom: [] }],
        ['a string under custom', { custom: 'x' }],
        [
            'every field of the wrong type',
            { custom: { open: 'no', agent: 3, account: null, workspace: 4, expanded: 'x' } }
        ],
        ['an open flag that is 0', { custom: { open: 0 } }]
    ])('reads %s as the scope nothing was kept for', (_name, state) => {
        expect(customizationScopeOf(state)).toStrictEqual(UNSET);
    });

    it('reads a closed section, a codex agent and the rows opened with their repeats', () => {
        expect(customizationScopeOf({ custom: { open: false } })).toStrictEqual({
            ...UNSET,
            open: false
        });
        expect(
            customizationScopeOf({ custom: { agent: 'codex', expanded: ['a', 1, null, 'a'] } })
        ).toStrictEqual({ ...UNSET, agent: 'codex', expanded: ['a', 'a'] });
    });

    it('does not read an own __proto__ key as the scope it holds, and writes the scope beside it', () => {
        const state = json('{"custom":{"__proto__":{"agent":"codex"},"account":"a"}}');
        expect(customizationScopeOf(state)).toStrictEqual({ ...UNSET, account: 'a' });
        const held = json('{"__proto__":{"x":1},"k":1}');
        expect(Object.keys(withCustomizationScope(held, { ...UNSET, agent: 'claude' }))).toEqual([
            '__proto__',
            'k',
            'custom'
        ]);
        expect(withCustomizationScope([], { ...UNSET, agent: 'claude' })).toStrictEqual({
            custom: UNSET
        });
    });
});
