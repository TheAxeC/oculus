// Layer 2, client-state tests. The folds the session views draw from, over a synthetic tree of
// two workspaces: the rows, the tree cut to the rows kept, the counts, the places a terminal may
// start and the agents newest first.

import { describe, expect, it } from 'vitest';

import {
    anyRunning,
    hiddenCounts,
    liveCount,
    newestFirst,
    pruneTree,
    sessionCount,
    sessionRows,
    terminalPlaces
} from '../../../src/lib/state/sessions/folds.ts';
import type { GroupedSession, SessionAgent, Workspace } from '../../../src/lib/data/model/index.ts';

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

    // revert: src/lib/state/sessions/folds.ts:10 => return tree.flatMap((workspace) => workspace.areas[0].sessions);
    it('list every row of the tree and count them per workspace', () => {
        expect(sessionRows(tree).map((one) => one.id)).toEqual(['a', 'b', 'c']);
        expect(sessionCount(tree[0])).toBe(2);
        expect(liveCount(sessionRows(tree))).toBe(1);
    });

    // revert: src/lib/state/sessions/folds.ts:20 => areas.push({ ...area, sessions });
    it('cut the tree to the rows kept, an area or a workspace left empty dropped', () => {
        const kept = pruneTree(tree, (one) => one.live);
        expect(kept.map((one) => one.key)).toEqual(['w1']);
        expect(kept[0].areas.map((area) => area.key)).toEqual(['w1/a']);
    });

    // revert: src/lib/state/sessions/folds.ts:44 => ended: rows.filter((row) => !row.live).length
    it('count the dismissed rows and the ended rows still shown', () => {
        expect(hiddenCounts(sessionRows(tree), (one) => one.hidden)).toEqual({
            dismissed: 1,
            ended: 1
        });
    });

    // revert: src/lib/state/sessions/folds.ts:50 => return [hub, ...tree.map((one) => one.key)];
    it('offer the hub and every workspace as a place to start a terminal, once each, by name', () => {
        expect(terminalPlaces('w2', tree)).toEqual(['w1', 'w2']);
        expect(terminalPlaces('', [])).toEqual([]);
    });

    // revert: src/lib/state/sessions/folds.ts:59 => return [...agents];
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
