// Layer 4, test fixture. The synthetic sessions payload the session view tests render over: two
// workspaces, a known area and a scratch one, and six sessions (working, idle, ended, archived, an
// area pinned by an override, one in a second workspace), with the hub's git state beside them.
// The catalog, glyphs and vocabulary are the real config; nothing reads an agent's own store.

import { render } from 'svelte/server';
import type { Component } from 'svelte';
import {
    engineDir,
    glyphCatalog,
    loadConfig,
    textCatalog,
    vocabCatalog
} from '../../../src/lib/data/sources/config.ts';
import { setCatalog, setGlyphs } from '../../../src/lib/state/shared/words/text.ts';
import { setVocab } from '../../../src/lib/state/shared/words/tones.ts';
import type { Instance } from '../../../src/lib/state/workbench/layout/index.ts';
import type { ViewProps } from '../../../src/lib/state/workbench/navigation/registry.ts';
import { area, payload, record, sessionsGit, workspace } from '../../fixtures/sessions-fixture.ts';
import { clientContext, type ClientState } from '../../fixtures/client.ts';

export const { config } = loadConfig(engineDir());
export const catalog = textCatalog(config);
setCatalog(catalog);
setGlyphs(glyphCatalog(config));
setVocab(vocabCatalog(config));

export const HUB = '/hub';
export const ALPHA = `${HUB}/projects/manuscripts/alpha`;
export const UNKNOWN = `${HUB}/scratch`;

export const live = record('live-one', {
    title: 'The live one',
    tool: 'claude',
    live: true,
    liveStatus: 'busy',
    state: 'working',
    pid: 4242,
    model: 'claude-opus-5',
    effort: 'high',
    permissionMode: 'acceptEdits',
    version: '2.1.0',
    branch: 'main',
    prompts: 4,
    contextTokens: 800000,
    // The last turn read 400k of its 800k; the lifetime sum is larger than any window, which is the
    // whole reason the share is not taken from it.
    lastCacheRead: 400000,
    tokens: { input: 1200, output: 340, cacheRead: 9000000, cacheCreation: 0, thinking: 90 },
    cache: { ttl: '1h', lastCreation: null, lastRead: null, busts: 2 },
    workspace: HUB,
    area: ALPHA,
    cwd: ALPHA,
    secondaryAreas: [{ key: `${HUB}/tools/oculus`, short: 'tools/oculus' }],
    files: [
        { path: `${ALPHA}/manuscript/main.tex`, tool: 'Edit', count: 3, last: null },
        { path: `${ALPHA}/code/run.py`, tool: 'Edit', count: 1, last: null }
    ],
    agents: [
        {
            id: 'ag-1',
            description: 'Read the whole tree and report',
            subagentType: 'Explore',
            model: 'claude-sonnet-5',
            started: '2026-09-10T08:00:00.000Z',
            ended: '2026-09-10T08:00:45.000Z',
            status: 'done',
            resultChars: 5200
        },
        {
            id: 'ag-2',
            description: 'Still going',
            subagentType: '',
            model: null,
            started: '2026-09-10T08:01:00.000Z',
            ended: null,
            status: 'running',
            resultChars: 0
        }
    ],
    timeline: [
        { ts: '2026-09-10T08:00:00.000Z', kind: 'prompt', text: 'do the thing' },
        { ts: '2026-09-10T08:00:10.000Z', kind: 'edit', text: `${ALPHA}/manuscript/main.tex` },
        { ts: '2026-09-10T08:00:20.000Z', kind: 'turn', text: '42000' },
        { ts: '2026-09-10T08:00:30.000Z', kind: 'bust', text: '84000' },
        { ts: '2026-09-10T08:00:40.000Z', kind: 'compaction', text: 'compacted' }
    ]
});

export const sharer = record('live-two', {
    title: 'The other live one',
    tool: 'codex',
    live: true,
    liveStatus: 'idle',
    state: 'idle',
    workspace: HUB,
    area: ALPHA,
    cwd: ALPHA,
    files: [{ path: `${ALPHA}/manuscript/main.tex`, tool: 'Edit', count: 1, last: null }]
});

export const gone = record('ended-one', {
    title: 'The ended one',
    kind: 'observed',
    workspace: HUB,
    area: UNKNOWN,
    cwd: UNKNOWN
});

export const away = record('dismissed-one', {
    title: 'The dismissed one',
    hidden: true,
    workspace: HUB,
    area: UNKNOWN,
    cwd: UNKNOWN
});

export const bare = record('bare-one', {
    title: 'The bare one',
    workspace: '/other',
    area: '/other',
    cwd: '/other'
});

/** A session an override pinned to its area rather than the score choosing it. */
export const held = record('pinned-one', {
    title: 'The pinned one',
    // Live, so the counts the rail draws for the ended and the dismissed rows are the same five
    // rows those cases were written against.
    live: true,
    liveStatus: 'idle',
    state: 'idle',
    workspace: HUB,
    area: ALPHA,
    cwd: UNKNOWN,
    pinned: true
});

export const tree = [
    workspace(HUB, [
        area(ALPHA, [live, sharer, held]),
        area(UNKNOWN, [gone, away], { known: false, short: 'scratch', full: UNKNOWN })
    ]),
    workspace('/other', [area('/other', [bare])])
];

/** What every case starts from, installed into the case's own client. */
export function installFixture(client: ClientState): void {
    const { receive } = client.entities;
    receive({ channel: 'sessions', version: 1, payload: payload(tree) });
    receive({ channel: 'git', version: 1, payload: sessionsGit(HUB) });
    receive({ channel: 'config', version: 1, payload: { config, text: catalog, findings: [] } });
}

let counter = 0;

/** One view rendered as a fresh instance of a client, with the state that instance has saved. */
export function renderView(
    client: ClientState,
    view: Component<ViewProps>,
    state: unknown = {},
    id = `probe-${(counter += 1)}`
): string {
    client.ui.setInstanceState(id, state);
    const instance: Instance = { id, view: 'probe', state };
    client.layout.apply({ root: { kind: 'pane', tabs: [instance], active: id } });
    return render(view, { context: clientContext(client), props: { instance } }).body;
}

/** The words inside the first element carrying this attribute at or after `from`. */
export function textOf(body: string, attribute: string, from = 0): string {
    const at = body.indexOf(attribute, from);
    if (at < 0) return '';
    const open = body.indexOf('>', at);
    const close = body.indexOf('</', open);
    return body
        .slice(open + 1, close)
        .replace(/<!--[^>]*-->/g, '')
        .trim();
}
