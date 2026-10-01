// The session joins: what the six views read instead of touching the payload themselves.
//
// The payload is synthetic and is handed to the entities store the way the socket would hand it
// over. Nothing here reads ~/.claude, ~/.codex or ~/.oculus, and nothing writes anywhere.

import { beforeEach, describe, expect, it } from 'vitest';
import type { Instance } from '../../../src/lib/state/workbench/layout/index.ts';
import { engineDir, loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';
import { area, git, payload, record, workspace } from '../../fixtures/sessions-fixture.ts';
import { createClientState, type ClientState } from '../../fixtures/client.ts';
import { STALE_LAG } from '../../../src/lib/state/boards/board/index.ts';

let client: ClientState;
let receive: ClientState['entities']['receive'];
let apply: ClientState['layout']['apply'];
let select: ClientState['selection']['select'];
let contextWindow: ClientState['selectors']['contextWindow'];
let gitFor: ClientState['selectors']['gitFor'];
let sessionById: ClientState['selectors']['sessionById'];
let sessionFor: ClientState['selectors']['sessionFor'];
let sessionsByWorkspace: ClientState['selectors']['sessionsByWorkspace'];
let sessionsForProject: ClientState['selectors']['sessionsForProject'];
let touchers: ClientState['selectors']['touchers'];

beforeEach(() => {
    client = createClientState();
    ({ receive } = client.entities);
    ({ apply } = client.layout);
    ({ select } = client.selection);
    ({
        contextWindow,
        gitFor,
        sessionById,
        sessionFor,
        sessionsByWorkspace,
        sessionsForProject,
        touchers
    } = client.selectors);
    installFixture();
});

const { config } = loadConfig(engineDir());

const HUB = '/hub';
const ALPHA = `${HUB}/projects/manuscripts/alpha`;
const BRAVO = `${HUB}/projects/manuscripts/bravo`;

const live = record('live-one', {
    title: 'The live one',
    live: true,
    state: 'working',
    workspace: HUB,
    area: ALPHA,
    cwd: ALPHA,
    files: [{ path: `${ALPHA}/main.tex`, tool: 'Edit', count: 3, last: null }]
});

const second = record('live-two', {
    title: 'The other live one',
    live: true,
    state: 'idle',
    workspace: HUB,
    area: ALPHA,
    cwd: `${HUB}/tools/oculus`,
    files: [{ path: `${ALPHA}/main.tex`, tool: 'Edit', count: 1, last: null }]
});

const gone = record('ended-one', {
    title: 'The ended one',
    workspace: HUB,
    area: BRAVO,
    cwd: BRAVO,
    files: [{ path: `${ALPHA}/main.tex`, tool: 'Edit', count: 9, last: null }]
});

const away = record('dismissed-one', {
    title: 'The dismissed one',
    hidden: true,
    workspace: HUB,
    area: BRAVO,
    cwd: BRAVO
});

const tree = [
    workspace(HUB, [area(ALPHA, [live, second]), area(BRAVO, [gone, away])]),
    workspace('', [area('/(general)', [record('nowhere', { workspace: '', cwd: null })])])
];

/** What every case here starts from, installed into the case's own client. */
function installFixture(): void {
    receive({ channel: 'sessions', version: 1, payload: payload(tree) });
    receive({
        channel: 'git',
        version: 1,
        payload: { [HUB]: git({ branch: 'main', ahead: 2 }) }
    });
    receive({
        channel: 'config',
        version: 1,
        payload: { config, text: textCatalog(config), findings: [] }
    });
}

describe('sessionById', () => {
    it('answers with the grouped session, which carries where it was filed', () => {
        expect(sessionById('live-one')?.area).toBe(ALPHA);
        expect(sessionById('live-one')?.workspace).toBe(HUB);
    });

    it('answers with nothing for an id the payload does not hold, and for no id', () => {
        expect(sessionById('nobody')).toBe(null);
        expect(sessionById(null)).toBe(null);
        expect(sessionById('')).toBe(null);
    });
});

describe('sessionsByWorkspace', () => {
    it('takes the dismissed rows out, and any heading left empty by that', () => {
        const kept = sessionsByWorkspace();
        const bravo = kept[0].areas.find((one) => one.key === BRAVO);
        expect(bravo?.sessions.map((one) => one.id)).toEqual(['ended-one']);
        expect(kept.flatMap((one) => one.areas).flatMap((one) => one.sessions)).toHaveLength(4);
    });

    it('drops an area and a workspace whose every row is dismissed', () => {
        receive({
            channel: 'sessions',
            version: 2,
            payload: payload([workspace(HUB, [area(BRAVO, [away])])])
        });
        expect(sessionsByWorkspace()).toEqual([]);
        expect(sessionsByWorkspace(true)).toHaveLength(1);
        receive({ channel: 'sessions', version: 3, payload: payload(tree) });
    });

    it('gives the tree as it stands when the dismissed ones are asked for', () => {
        const all = sessionsByWorkspace(true);
        const bravo = all[0].areas.find((one) => one.key === BRAVO);
        expect(bravo?.sessions.map((one) => one.id)).toEqual(['ended-one', 'dismissed-one']);
    });
});

describe('gitFor', () => {
    it('answers with the state of the workspace it is asked about', () => {
        expect(gitFor(HUB)?.ahead).toBe(2);
    });

    it('answers with nothing for a workspace the payload carries none for', () => {
        expect(gitFor('/elsewhere')).toBe(null);
        expect(gitFor('')).toBe(null);
    });
});

describe('touchers', () => {
    it('names the other live sessions holding one path open', () => {
        expect(touchers(`${ALPHA}/main.tex`, 'live-one').map((one) => one.id)).toEqual([
            'live-two'
        ]);
    });

    it('leaves out a session that is not live, however often it touched the path', () => {
        expect(touchers(`${ALPHA}/main.tex`).map((one) => one.id)).toEqual([
            'live-one',
            'live-two'
        ]);
    });

    it('answers with nothing for a path nobody holds, and for no path', () => {
        expect(touchers(`${ALPHA}/other.tex`, 'live-one')).toEqual([]);
        expect(touchers('')).toEqual([]);
    });
});

describe('sessionsForProject', () => {
    it('finds the sessions filed in a project folder', () => {
        expect(sessionsForProject(ALPHA).map((one) => one.id)).toEqual(['live-one', 'live-two']);
    });

    it('finds a session sitting in the folder even when it was filed elsewhere', () => {
        const visitor = record('visitor', {
            workspace: HUB,
            area: `${HUB}/tools/oculus`,
            cwd: `${ALPHA}/code`
        });
        receive({
            channel: 'sessions',
            version: 4,
            payload: payload([workspace(HUB, [area(`${HUB}/tools/oculus`, [visitor])])])
        });
        expect(sessionsForProject(ALPHA).map((one) => one.id)).toEqual(['visitor']);
        receive({ channel: 'sessions', version: 5, payload: payload(tree) });
    });

    it('does not take a folder whose name only starts the same way', () => {
        expect(sessionsForProject(`${HUB}/projects/manuscripts/alph`)).toEqual([]);
        expect(sessionsForProject('')).toEqual([]);
    });

    it('leaves out a session the reader dismissed, so the card row counts what the list shows', () => {
        const gone = record('dismissed-one', {
            workspace: HUB,
            area: ALPHA,
            cwd: ALPHA,
            hidden: true
        });
        receive({
            channel: 'sessions',
            version: 6,
            payload: payload([workspace(HUB, [area(ALPHA, [live, gone])])])
        });
        expect(sessionsForProject(ALPHA).map((one) => one.id)).toEqual(['live-one']);
        receive({ channel: 'sessions', version: 7, payload: payload(tree) });
    });
});

describe('sessionFor and the context window', () => {
    /** Put one view instance with this state in the layout that sessionFor reads. */
    function holdInstance(id: string, state: unknown): void {
        const instance: Instance = { id, view: 'session-detail', state };
        apply({ root: { kind: 'pane', tabs: [instance], active: id } });
    }

    it('follows the selection when the instance pins nothing', () => {
        holdInstance('one', {});
        select('live-two');
        expect(sessionFor('one')?.id).toBe('live-two');
    });

    it('shows the pinned session instead, whatever is selected', () => {
        holdInstance('two', { session: 'ended-one' });
        select('live-two');
        expect(sessionFor('two')?.id).toBe('ended-one');
    });

    it('shows nothing when the pinned session is no longer in the payload', () => {
        holdInstance('three', { session: 'gone-away' });
        expect(sessionFor('three')).toBe(null);
    });

    it('reads the window out of the config', () => {
        expect(contextWindow()).toBe(1000000);
    });
});

describe('the config values the selectors read', () => {
    /** Put a config with these keys over the real one into the client, as the socket would. */
    function configured(over: Record<string, unknown>): void {
        receive({
            channel: 'config',
            version: 2,
            payload: { config: { ...config, ...over }, text: textCatalog(config), findings: [] }
        });
    }

    it.each([
        [5, 5],
        [0, 0],
        [-1, -1],
        [0.5, 0.5],
        ['5', STALE_LAG],
        [Number.NaN, STALE_LAG],
        [Number.POSITIVE_INFINITY, STALE_LAG],
        [Number.NEGATIVE_INFINITY, STALE_LAG],
        [null, STALE_LAG],
        [true, STALE_LAG],
        [[5], STALE_LAG],
        [{}, STALE_LAG]
    ])('reads a stale_lag_days of %j as %j', (value, expected) => {
        configured({ stale_lag_days: value });
        expect(client.selectors.staleLag()).toBe(expected);
    });

    it('reads a config without stale_lag_days, and no config yet, as the default lag', () => {
        const { stale_lag_days: _gone, ...rest } = config;
        receive({
            channel: 'config',
            version: 2,
            payload: { config: rest, text: textCatalog(config), findings: [] }
        });
        expect(client.selectors.staleLag()).toBe(STALE_LAG);
        expect(createClientState().selectors.staleLag()).toBe(STALE_LAG);
    });

    it.each([
        [200000, 200000],
        [0.5, 0.5],
        [0, 0],
        [-1, 0],
        ['5', 0],
        [Number.NaN, 0],
        [Number.POSITIVE_INFINITY, 0],
        [Number.NEGATIVE_INFINITY, 0],
        [null, 0],
        [true, 0],
        [[5], 0],
        [{}, 0]
    ])('reads a context_window of %j as %j', (value, expected) => {
        configured({ context_window: value });
        expect(client.selectors.contextWindow()).toBe(expected);
    });

    it('reads no config yet as a window of 0', () => {
        expect(createClientState().selectors.contextWindow()).toBe(0);
    });

    it.each([
        [
            ['dead', 'withdrawn'],
            ['dead', 'withdrawn']
        ],
        [
            ['a', 1, null, 'b', {}, ['c'], true, ''],
            ['a', 'b', '']
        ],
        [[], []],
        ['dead', []],
        [{ 0: 'dead' }, []],
        [3, []],
        [null, []],
        [undefined, []]
    ])('reads an archive_dead of %j as %j', (value, expected) => {
        configured({ archive_dead: value });
        expect(client.selectors.archiveDead()).toStrictEqual(expected);
    });

    it('reads no config yet as no dead outcomes', () => {
        expect(createClientState().selectors.archiveDead()).toStrictEqual([]);
    });

    it('answers the merged map of the last config message, and an empty map before any', () => {
        configured({ stale_lag_days: 7 });
        expect(client.selectors.configMap().stale_lag_days).toBe(7);
        expect(createClientState().selectors.configMap()).toStrictEqual({});
    });
});

describe('a name that is a property of every object', () => {
    beforeEach(() => {
        receive({
            channel: 'portfolio',
            version: 3,
            payload: {
                version: 3,
                entities: { projects: {}, collections: {}, venues: {}, datasets: {} },
                relations: {},
                findings: []
            }
        });
    });

    it.each([['constructor'], ['toString'], ['hasOwnProperty'], ['__proto__']])(
        'is no project, no collection and no workspace git state when it is %s',
        (name) => {
            expect(client.selectors.projectOf(name)).toBeNull();
            expect(client.selectors.collectionOf(name)).toBeNull();
            expect(gitFor(name)).toBeNull();
        }
    );
});
