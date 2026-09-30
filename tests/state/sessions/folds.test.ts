// Layer 2, client-state tests. The folds the session views draw from, over a synthetic tree of
// two workspaces: the rows, the tree cut to the rows kept, the counts, the places a terminal may
// start and the agents newest first; then the sessions list's filter, search, groups and order,
// the relative time a row says, the timeline cut into turns and an agent's tokens.

import { describe, expect, it } from 'vitest';

import { engineDir, loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';
import { setCatalog } from '../../../src/lib/state/shared/words/text.ts';

import {
    agentTokens,
    anyRunning,
    hiddenCounts,
    isTop,
    keptByFilter,
    listFilterOf,
    listGroups,
    liveCount,
    matchesSearch,
    newestFirst,
    pruneTree,
    rowState,
    sessionCount,
    sessionRows,
    terminalChoices,
    terminalPlaces,
    timelineTurns,
    toggled
} from '../../../src/lib/state/sessions/folds.ts';
import type {
    GroupedSession,
    SessionAgent,
    SessionEvent,
    Workspace
} from '../../../src/lib/data/model/index.ts';

const catalog = textCatalog(loadConfig(engineDir()).config);
setCatalog(catalog);

/** One session row: its id, whether it is live, and whether the reader dismissed it. */
function row(id: string, live: boolean, hidden = false): GroupedSession {
    return { id, live, hidden } as unknown as GroupedSession;
}

/** One workspace of two areas over the given rows. */
function workspace(key: string, rows: GroupedSession[]): Workspace {
    return {
        key,
        areas: [
            { key: `${key}/a`, sessions: rows.slice(0, 1) },
            { key: `${key}/b`, sessions: rows.slice(1) }
        ]
    } as unknown as Workspace;
}

describe('the session folds', () => {
    const tree = [
        workspace('w1', [row('a', true), row('b', false, true)]),
        workspace('w2', [row('c', false)])
    ];

    it('list every row of the tree and count them per workspace', () => {
        expect(sessionRows(tree).map((one) => one.id)).toEqual(['a', 'b', 'c']);
        expect(sessionCount(tree[0])).toBe(2);
        expect(liveCount(sessionRows(tree))).toBe(1);
    });

    it('cut the tree to the rows kept, an area or a workspace left empty dropped', () => {
        const kept = pruneTree(tree, (one) => one.live);
        expect(kept.map((one) => one.key)).toEqual(['w1']);
        expect(kept[0].areas.map((area) => area.key)).toEqual(['w1/a']);
    });

    it('count the dismissed rows and the ended rows still shown', () => {
        expect(hiddenCounts(sessionRows(tree), (one) => one.hidden)).toEqual({
            dismissed: 1,
            ended: 1
        });
    });

    it('offer the hub and every workspace as a place to start a terminal, once each, by name', () => {
        expect(terminalPlaces('w2', tree)).toEqual(['w1', 'w2']);
        expect(terminalPlaces('', [])).toEqual([]);
    });

    it('put the agents newest first, one with no stamp last, and say whether any runs', () => {
        const agents = [
            { id: 'old', started: '2026-09-01T00:00:00Z', status: 'done' },
            { id: 'none', started: null, status: 'done' },
            { id: 'new', started: '2026-09-02T00:00:00Z', status: 'running' }
        ] as unknown as SessionAgent[];
        expect(newestFirst(agents).map((one) => one.id)).toEqual(['new', 'old', 'none']);
        expect(anyRunning(agents)).toBe(true);
        expect(anyRunning(agents.slice(0, 2))).toBe(false);
    });
});

/** One list row: live or not, its tool, its latest hook, its title and when it last moved. */
function listed(id: string, over: Record<string, unknown> = {}): GroupedSession {
    return {
        id,
        live: true,
        state: 'idle',
        liveStatus: 'idle',
        tool: 'claude',
        hook: null,
        title: id,
        lastPrompt: '',
        timeline: [],
        workspace: '/ws',
        branch: null,
        lastActivity: '2026-09-10T08:00:00.000Z',
        started: null,
        ...over
    } as unknown as GroupedSession;
}

const ASK = { session: 'x', event: 'notification', at: null };

describe("the sessions list's rows", () => {
    it('say a live session waits on the reader only when its latest hook is a notification', () => {
        expect(rowState(listed('a', { hook: ASK }), false)).toBe('input');
        expect(rowState(listed('a', { hook: { ...ASK, event: 'stop' } }), false)).toBe('idle');
        expect(rowState(listed('a', { hook: ASK, live: false }), false)).toBe('ended');
        expect(rowState(listed('a', { hook: ASK }), true)).toBe('archived');
        expect(rowState(listed('a', { state: 'working' }), false)).toBe('working');
        expect(rowState(listed('a', { liveStatus: 'busy' }), false)).toBe('working');
    });

    it('read the filter out of the instance state, anything malformed as unset', () => {
        expect(
            listFilterOf({ states: ['ended', 'bogus'], agents: ['codex', 3], query: 'x' })
        ).toEqual({ states: ['ended'], agents: ['codex'], query: 'x' });
        expect(listFilterOf(null)).toEqual({ states: [], agents: [], query: '' });
        expect(listFilterOf([])).toEqual({ states: [], agents: [], query: '' });
        expect(listFilterOf({ states: 'ended', query: 7 })).toEqual({
            states: [],
            agents: [],
            query: ''
        });
        expect(toggled(['a'], 'b')).toEqual(['a', 'b']);
        expect(toggled(['a', 'b'], 'a')).toEqual(['b']);
    });

    it('find the search text in the title, the prompts, the workspace or the branch, in any case', () => {
        const row = listed('a', {
            title: 'Refactor',
            lastPrompt: 'fix the LOADER',
            timeline: [{ ts: null, kind: 'prompt', text: 'earlier Prompt' }],
            workspace: '/hub/tools',
            branch: 'feature/x'
        });
        for (const query of ['refactor', 'loader', 'EARLIER', 'hub/tools', 'feature', '  ']) {
            expect(matchesSearch(row, query)).toBe(true);
        }
        expect(matchesSearch(row, 'nothing')).toBe(false);
    });

    it('keep every state but archived with none picked, and only the agents picked', () => {
        const none = listFilterOf({});
        expect(keptByFilter(listed('a'), false, none)).toBe(true);
        expect(keptByFilter(listed('a'), true, none)).toBe(false);
        expect(keptByFilter(listed('a'), true, listFilterOf({ states: ['archived'] }))).toBe(true);
        expect(keptByFilter(listed('a'), false, listFilterOf({ states: ['archived'] }))).toBe(
            false
        );
        expect(keptByFilter(listed('a'), false, listFilterOf({ agents: ['codex'] }))).toBe(false);
        expect(
            keptByFilter(listed('a', { tool: 'codex' }), false, listFilterOf({ agents: ['codex'] }))
        ).toBe(true);
    });

    it('group the rows by workspace, pinned first, then waiting on the reader, then newest', () => {
        const old = listed('old', { lastActivity: '2026-09-01T00:00:00.000Z' });
        const fresh = listed('fresh', { lastActivity: '2026-09-12T00:00:00.000Z' });
        const asking = listed('asking', { hook: ASK, lastActivity: '2026-09-02T00:00:00.000Z' });
        const pinned = listed('pinned', { top: true, lastActivity: '2026-08-01T00:00:00.000Z' });
        const gone = listed('gone', { hidden: true });
        const tree = [
            {
                key: '/one',
                name: 'one',
                areas: [{ sessions: [old, fresh] }, { sessions: [asking] }]
            },
            { key: '/two', name: 'two', areas: [{ sessions: [pinned, gone] }] },
            { key: '/three', name: 'three', areas: [{ sessions: [gone] }] }
        ] as unknown as Workspace[];
        const groups = listGroups(tree, listFilterOf({}), (row) => row.id === 'gone', isTop);
        expect(groups.map((group) => [group.key, group.rows.map((row) => row.id)])).toEqual([
            ['/one', ['asking', 'fresh', 'old']],
            ['/two', ['pinned']]
        ]);
        const both = listGroups(
            tree,
            listFilterOf({}),
            () => false,
            (row) => row.id === 'old'
        );
        expect(both[0].rows.map((row) => row.id)).toEqual(['old', 'asking', 'fresh']);
        expect(isTop(listed('a', { top: 'yes' }))).toBe(false);
    });
});

describe('a timeline cut into turns', () => {
    const event = (kind: string, ts: string, text = kind): SessionEvent => ({ kind, ts, text });

    it('opens a turn at each prompt, timed by it, and puts a resumed tail in a turn of its own', () => {
        const turns = timelineTurns([
            event('edit', 't0'),
            event('prompt', 't1', 'first'),
            event('tool', 't2'),
            event('turn', 't3'),
            event('prompt', 't4', 'second')
        ]);
        expect(
            turns.map((turn) => [
                turn.at,
                turn.prompt?.text ?? null,
                turn.events.map((one) => one.ts)
            ])
        ).toEqual([
            ['t0', null, ['t0']],
            ['t1', 'first', ['t2', 't3']],
            ['t4', 'second', []]
        ]);
        expect(timelineTurns([])).toEqual([]);
    });
});

describe("an agent's tokens", () => {
    it('are the count its result reports, and nothing for a count that is not one', () => {
        const agent = (tokens: unknown) => ({ id: 'a', tokens }) as unknown as SessionAgent;
        expect(agentTokens(agent(48200))).toBe(48200);
        expect(agentTokens(agent(0))).toBe(0);
        expect(agentTokens(agent(-1))).toBe(null);
        expect(agentTokens(agent(Number.NaN))).toBe(null);
        expect(agentTokens(agent('9'))).toBe(null);
        expect(agentTokens(agent(undefined))).toBe(null);
    });
});

describe("the Terminal view's list of terminals", () => {
    const at = '2026-09-11T08:00:00.000Z';
    const shell = {
        id: 'a1b2c3-shell',
        name: 'zsh',
        title: '',
        icon: '',
        color: '',
        kind: 'shell' as const,
        command: 'vim',
        cwd: '/Users/x/work/oculus',
        created: at,
        pid: 11,
        foreign: false,
        resumes: null
    };
    const resumed = {
        id: 'd4e5f6-claude',
        name: 'claude',
        title: '',
        icon: '',
        color: '',
        kind: 'claude' as const,
        command: 'node',
        cwd: '/Users/x/work',
        created: at,
        pid: 12,
        foreign: false,
        resumes: { tool: 'claude' as const, id: 'ended-one' }
    };
    const started = {
        id: '0a0b0c-codex',
        name: '',
        title: '',
        icon: '',
        color: '',
        kind: 'codex' as const,
        command: 'codex',
        cwd: '/Users/x/work',
        created: at,
        pid: 13,
        foreign: false,
        resumes: null
    };
    const idle = {
        id: '0d0e0f-shell',
        name: '0d0e0f-shell',
        title: '',
        icon: '',
        color: '',
        kind: 'shell' as const,
        command: '',
        cwd: '/',
        created: at,
        pid: 14,
        foreign: false,
        resumes: null
    };
    const outside = { ...shell, id: 'outside', name: 'work', pid: 15, foreign: true };
    const sessions = [
        { id: 'ended-one', title: 'Fix the parser', pid: null },
        { id: 'live-one', title: '', pid: 13 }
    ];

    it('titles an agent terminal by its agent and describes it by the session running in it', () => {
        const [claude, codex] = terminalChoices([resumed, started], sessions);
        expect(claude).toMatchObject({
            terminal: 'd4e5f6-claude',
            kind: 'claude',
            title: catalog['sessions.kind_claude'],
            description: 'Fix the parser'
        });
        expect(claude.title).toBe('Claude');
        // a session found by its process with no title of its own is described by its id
        expect(codex).toMatchObject({
            terminal: '0a0b0c-codex',
            kind: 'codex',
            title: 'Codex',
            description: 'live-one'
        });
    });

    it('describes an agent terminal no session is found in by its own name, else its id', () => {
        const [lone, nameless] = terminalChoices(
            [
                { ...resumed, resumes: null, pid: 0 },
                { ...started, pid: 0 }
            ],
            sessions
        );
        expect(lone).toMatchObject({ terminal: 'd4e5f6-claude', description: 'claude' });
        expect(nameless).toMatchObject({ terminal: '0a0b0c-codex', description: '0a0b0c-codex' });
    });

    it('titles a shell by its running command and describes it by its folder', () => {
        expect(terminalChoices([shell], sessions)).toEqual([
            {
                terminal: 'a1b2c3-shell',
                kind: 'shell',
                icon: '',
                color: '',
                title: 'vim',
                description: 'oculus'
            }
        ]);
    });

    it('titles a shell tmux reports no command for "shell"', () => {
        const [row] = terminalChoices([idle], sessions);
        expect(row.title).toBe(catalog['sessions.terminal_title_shell']);
        expect(row.title).toBe('shell');
        expect(row.description).toBe('/');
    });

    it('offers no terminal oculus did not start, since the tab cannot attach to one', () => {
        expect(terminalChoices([outside, shell], sessions).map((one) => one.terminal)).toEqual([
            'a1b2c3-shell'
        ]);
    });
});
