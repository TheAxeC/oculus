// Layer 2, route tests. A deck write to the second hub (G8, G9): a write that names the hub `lab`
// changes that hub's deck file and no byte of the primary hub, the change log names the file of
// `lab`, the undo puts it back, and a base the file does not hold is refused with nothing written.
//
// Both hubs are made by `deckTarget()` under the system temporary directory, each with the
// portfolio deck and the decks of its three projects.
// @module-tag slow: each case builds two deck hubs, so npm test leaves it out.

import { describe, expect } from 'vitest';
import { handleWrite, type PrimaryTarget } from '../../../src/lib/server/edit/writes.ts';
import { it, test } from '../../fixtures/scratch.ts';
import {
    DECK_ORDER,
    DECK_PATH,
    TOKEN,
    changesOf,
    deckOf,
    deckTarget,
    request,
    undone,
    warmConfig
} from '../edit/write-fixture.ts';
import { differing, filesOf, heldBy } from './hub-files-fixture.ts';

test.beforeAll(warmConfig);

/** Two deck hubs: each holds the portfolio deck and the decks of its three projects. */
function twoDeckHubs(): { into: PrimaryTarget; first: string; lab: string } {
    const first = deckTarget();
    const second = deckTarget();
    const labProjects = second.projects().map((project) => ({
        ...project,
        id: `lab:${project.id}`,
        root: 'lab'
    }));
    const into: PrimaryTarget = {
        ...first,
        projects: () => [...first.projects(), ...labProjects],
        files: {
            roots: () => [
                { key: 'hub', dir: first.hub },
                { key: 'lab', dir: second.hub }
            ]
        },
        hubs: [{ key: 'lab', hub: second.hub, config: second.config }]
    };
    return { into, first: first.hub, lab: second.hub };
}

describe('a deck write to the second hub', () => {
    const MOVE = [
        { group: 'pillars', base: ['alpha'], slides: ['beta'] },
        { group: 'more', base: [], slides: ['alpha'] }
    ];
    const send = (groups: unknown, over: Record<string, unknown> = {}): unknown => ({
        kind: 'deck-slides',
        root: 'lab',
        path: DECK_PATH,
        groups,
        ...over
    });

    it('writes the deck file of the second hub, logs its path and undoes it', async () => {
        const { into, first, lab } = twoDeckHubs();
        const before = { first: filesOf(first), lab: filesOf(lab) };
        const response = await handleWrite(request(send(MOVE)), TOKEN, into);
        expect(response.status).toBe(200);
        expect(differing(before.first, filesOf(first))).toEqual([]);
        expect(differing(before.lab, filesOf(lab))).toEqual([DECK_PATH]);
        const records = changesOf(into);
        expect(records).toHaveLength(2);
        for (const record of records) {
            expect(heldBy(lab, record.file)).toBe(true);
            expect(record.file.endsWith(DECK_PATH)).toBe(true);
            expect((await undone(into, record)).status).toBe(200);
        }
        expect(differing(before.lab, filesOf(lab))).toEqual([]);
        expect(deckOf({ ...into, hub: lab })).toBe(before.lab.get(DECK_PATH));
    });

    it('refuses a base the file of the second hub does not hold, and writes nothing', async () => {
        const { into, first, lab } = twoDeckHubs();
        const before = { first: filesOf(first), lab: filesOf(lab) };
        const response = await handleWrite(
            request(send([{ group: 'pillars', base: ['beta'], slides: ['alpha'] }])),
            TOKEN,
            into
        );
        expect(response.status).toBe(200);
        const answer = (await response.json()) as {
            changed: string[];
            refused: { reason: string }[];
        };
        expect(answer.changed).toEqual([]);
        expect(answer.refused.map((one) => one.reason)).toEqual([
            "The group's slides list changed on disk while you were working. Read the deck again and make the change again."
        ]);
        expect(differing(before.first, filesOf(first))).toEqual([]);
        expect(differing(before.lab, filesOf(lab))).toEqual([]);
        expect(changesOf(into)).toEqual([]);
    });

    it('writes the order list of the second hub', async () => {
        const { into, first, lab } = twoDeckHubs();
        const before = { first: filesOf(first), lab: filesOf(lab) };
        const order = { base: DECK_ORDER, entries: ['slides:more', 'intro.md', 'slides:pillars'] };
        const response = await handleWrite(request(send([], { order })), TOKEN, into);
        expect(response.status).toBe(200);
        expect(differing(before.first, filesOf(first))).toEqual([]);
        expect(differing(before.lab, filesOf(lab))).toEqual([DECK_PATH]);
    });
});
