// Layer 2, route tests. What the /api/write route does with a deck group's list: `slides:` of one
// group of a `present.yml` rewritten over its bytes with every other line kept, every refusal
// answered with its sentence and nothing written.
//
// The hub is a temporary directory (deckTarget): the portfolio deck names `alpha` in the group
// `pillars`, `beta` is found by the group and waits as a candidate, and `gamma` is archived, so the
// group's `tiers:` does not find it. No case here writes the engine's own configuration or the
// checkout.

import { describe, expect } from 'vitest';
import { parse } from 'yaml';
import { handleWrite, type WriteTarget } from '../../../src/lib/server/edit/writes.ts';
import { it, test } from '../../fixtures/scratch.ts';
import {
    DECK_PATH,
    TOKEN,
    changesOf,
    deckOf,
    deckTarget,
    request,
    warmConfig
} from './write-fixture.ts';

test.beforeAll(warmConfig);

/** The body of a write of one group's list of the portfolio deck. */
function body(
    over: Partial<{ path: string; group: string; base: string[]; slides: string[] }> = {}
): unknown {
    return {
        kind: 'deck-slides',
        root: 'hub',
        path: DECK_PATH,
        group: 'pillars',
        base: ['alpha'],
        slides: ['beta', 'alpha'],
        ...over
    };
}

/** What the write answers, and the status it answers with. */
async function answered(
    into: WriteTarget,
    sent: unknown
): Promise<{ status: number; answer: { changed?: string[]; refused?: { reason: string }[] } }> {
    const response = await handleWrite(request(sent), TOKEN, into);
    return { status: response.status, answer: (await response.json()) as never };
}

/** The reasons a write was refused with, and that the file stayed as it was. */
async function refusedWith(into: WriteTarget, sent: unknown): Promise<string[]> {
    const before = deckOf(into);
    const { status, answer } = await answered(into, sent);
    expect(status).toBe(200);
    expect(answer.changed).toEqual([]);
    expect(deckOf(into)).toBe(before);
    expect(changesOf(into)).toEqual([]);
    return (answer.refused ?? []).map((one) => one.reason);
}

describe('writing a deck group list', () => {
    it('refuses what the file or the roots do not allow, and writes the list of a group keeping every other line', async () => {
        const into = deckTarget();
        const outside = 'That deck is outside the folders oculus serves';
        const refusals: { row: string; sent: unknown; reasons: string[] }[] = [
            {
                row: 'a name no deck of the group answers to',
                sent: body({ slides: ['alpha', 'gamma'] }),
                reasons: ['No deck named gamma belongs to the group']
            },
            {
                row: 'a name listed twice',
                sent: body({ slides: ['alpha', 'alpha'] }),
                reasons: ['A deck is listed twice in the group']
            },
            {
                row: 'a base the file does not hold',
                sent: body({ base: ['beta'] }),
                reasons: [
                    "The group's slides list changed on disk while you were working. Read the deck again and make the change again."
                ]
            },
            {
                row: 'a group the deck does not define',
                sent: body({ group: 'nothing', base: [] }),
                reasons: ['The deck has no group named nothing']
            },
            {
                row: 'a path that is not a present.yml',
                sent: body({ path: 'deck/title.md' }),
                reasons: ['That path is not a present.yml']
            },
            {
                row: 'a path that leaves the served root',
                sent: body({ path: '../present.yml' }),
                reasons: [outside]
            },
            {
                row: 'a root nothing serves',
                sent: { ...(body() as object), root: 'nowhere' },
                reasons: [outside]
            }
        ];
        for (const { row, sent, reasons } of refusals) {
            expect(await refusedWith(into, sent), row).toEqual(reasons);
        }

        const before = deckOf(into);
        const { status, answer } = await answered(into, body());
        expect(status).toBe(200);
        expect(answer.changed).toEqual(['pillars']);
        const after = deckOf(into);
        const list = /\n {8}slides:\n(?: {12}- .*\n)+/;
        expect(after.replace(list, '\n')).toBe(before.replace(list, '\n'));
        const groups = (parse(after) as { groups: Record<string, { slides: string[] }> }).groups;
        expect(groups.pillars.slides).toEqual(['beta', 'alpha']);
        expect(after).toContain('    # the pillars\n');
        const [change] = changesOf(into);
        expect(change).toMatchObject({
            kind: 'deck-slides',
            key: 'pillars',
            field: 'slides',
            before: ['alpha'],
            after: ['beta', 'alpha'],
            undo: 'field'
        });
    });
});
