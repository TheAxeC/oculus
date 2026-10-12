// Layer 2, route tests. What the /api/write route does with a deck's lists: the `slides:` of any
// number of groups and the `order:` of a `present.yml`, written in one request over the file's
// bytes with every other line kept, every refusal answered with its sentence and nothing written.
//
// The hub is a temporary directory (deckTarget) whose portfolio deck holds three groups: `pillars`
// finds the active projects and names `alpha`, `more` finds every project and names none, and
// `ideas` finds the archived ones and names `gamma`; `beta` is active and waits as a candidate. The
// order lists `intro.md`, then the slides of `pillars` and of `more`. No case here writes the
// engine's own configuration or the checkout.

import { describe, expect } from 'vitest';
import { parse } from 'yaml';
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
    warmConfig
} from './write-fixture.ts';

test.beforeAll(warmConfig);

type Lists = { group: string; base: string[]; slides: string[] }[];

/** The body of a write of the lists given, and the order when one is. */
function body(
    groups: Lists,
    over: Partial<{ path: string; root: string; order: { base: string[]; entries: string[] } }> = {}
): unknown {
    return { kind: 'deck-slides', root: 'hub', path: DECK_PATH, groups, ...over };
}

const MOVE: Lists = [
    { group: 'pillars', base: ['alpha'], slides: ['beta'] },
    { group: 'more', base: [], slides: ['alpha'] }
];

/** What the write answers, and the status it answers with. */
async function answered(
    into: PrimaryTarget,
    sent: unknown
): Promise<{ status: number; answer: { changed?: string[]; refused?: { reason: string }[] } }> {
    const response = await handleWrite(request(sent), TOKEN, into);
    return { status: response.status, answer: (await response.json()) as never };
}

/** The reasons a write was refused with, with the file as it was and no record in the log. */
async function refusedWith(into: PrimaryTarget, sent: unknown): Promise<string[]> {
    const before = deckOf(into);
    const { status, answer } = await answered(into, sent);
    expect(status).toBe(200);
    expect(answer.changed).toEqual([]);
    expect(deckOf(into)).toBe(before);
    expect(changesOf(into)).toEqual([]);
    return (answer.refused ?? []).map((one) => one.reason);
}

/** A group's list of a deck file, read back through the parser. */
function listOf(text: string, group: string): string[] {
    const groups = (parse(text) as { groups: Record<string, { slides: string[] }> }).groups;
    return groups[group].slides;
}

describe('writing a deck lists', () => {
    it('refuses what the file or the roots do not allow, and writes nothing', async () => {
        const into = deckTarget();
        const outside = 'That deck is outside the folders oculus serves';
        const changed =
            "The group's slides list changed on disk while you were working. Read the deck again and make the change again.";
        const stale = { base: ['intro.md', 'slides:more', 'slides:pillars'], entries: DECK_ORDER };
        const refusals: { row: string; sent: unknown; reasons: string[] }[] = [
            {
                row: 'a name no deck of the group answers to',
                sent: body([{ group: 'pillars', base: ['alpha'], slides: ['alpha', 'nothing'] }]),
                reasons: ['No deck named nothing belongs to the group']
            },
            {
                row: 'a name the group finds nothing of, taken from the list that holds it',
                sent: body([
                    { group: 'pillars', base: ['alpha'], slides: [] },
                    { group: 'ideas', base: ['gamma'], slides: ['gamma', 'alpha'] }
                ]),
                reasons: [
                    'The deck alpha is not one that the group ideas finds, so it cannot join it'
                ]
            },
            {
                row: 'a name listed twice',
                sent: body([{ group: 'pillars', base: ['alpha'], slides: ['alpha', 'alpha'] }]),
                reasons: ['A deck is listed twice in the group']
            },
            {
                row: 'a base the file does not hold',
                sent: body([{ group: 'pillars', base: ['beta'], slides: ['alpha'] }]),
                reasons: [changed]
            },
            {
                row: 'an order base the file does not hold, with a valid list in the same request',
                sent: body(MOVE, { order: stale }),
                reasons: [
                    'The order of the deck changed on disk while you were working. Read the deck again and make the change again.'
                ]
            },
            {
                row: 'order entries that are not a permutation of the base',
                sent: body([], {
                    order: { base: DECK_ORDER, entries: ['intro.md', 'slides:more'] }
                }),
                reasons: ['The new order must hold the same entries as the order the file holds']
            },
            {
                row: 'a group the deck does not define',
                sent: body([{ group: 'nothing', base: [], slides: [] }]),
                reasons: ['The deck has no group named nothing']
            },
            {
                row: 'a path that is not a present.yml',
                sent: body(MOVE, { path: 'deck/intro.md' }),
                reasons: ['That path is not a present.yml']
            },
            {
                row: 'a path that leaves the served root',
                sent: body(MOVE, { path: '../present.yml' }),
                reasons: [outside]
            },
            {
                row: 'a root nothing serves',
                sent: body(MOVE, { root: 'nowhere' }),
                reasons: [outside]
            }
        ];
        for (const { row, sent, reasons } of refusals) {
            expect(await refusedWith(into, sent), row).toEqual(reasons);
        }
        const old = {
            kind: 'deck-slides',
            root: 'hub',
            path: DECK_PATH,
            group: 'pillars',
            base: ['alpha'],
            slides: ['beta']
        };
        const before = deckOf(into);
        expect((await answered(into, old)).status).toBe(400);
        expect(deckOf(into)).toBe(before);
        expect(changesOf(into)).toEqual([]);
    });

    it('moves a name across two lists and an entry of the order, each in one write that keeps every other line', async () => {
        const into = deckTarget();
        const before = deckOf(into);
        const moved = await answered(into, body(MOVE));
        expect(moved.status).toBe(200);
        expect(moved.answer.changed).toEqual(['pillars', 'more']);
        const after = deckOf(into);
        expect(listOf(after, 'pillars')).toEqual(['beta']);
        expect(listOf(after, 'more')).toEqual(['alpha']);
        const lists = /\n {8}slides:(?: \[\]\n|\n(?: {12}- .*\n)+)/g;
        expect(after.replace(lists, '\n')).toBe(before.replace(lists, '\n'));
        expect(after).toContain('    # the pillars\n');
        const [more, pillars] = changesOf(into);
        expect([pillars, more]).toMatchObject([
            {
                kind: 'deck-slides',
                key: 'slides:pillars',
                field: 'slides',
                before: ['alpha'],
                after: ['beta'],
                undo: 'field'
            },
            {
                kind: 'deck-slides',
                key: 'slides:more',
                field: 'slides',
                before: [],
                after: ['alpha'],
                undo: 'field'
            }
        ]);

        const entries = ['slides:pillars', 'intro.md', 'slides:more'];
        const reordered = await answered(into, body([], { order: { base: DECK_ORDER, entries } }));
        expect(reordered.answer.changed).toEqual(['order']);
        const last = deckOf(into);
        const order = /\norder:\n[\s\S]*$/;
        expect(last.replace(order, '')).toBe(after.replace(order, ''));
        expect(last).toContain(
            'order:\n    - { slides: pillars }\n    - intro.md\n    # the rest follows\n    - { slides: more }\n'
        );
        expect(changesOf(into)[0]).toMatchObject({
            key: 'order',
            field: 'order',
            before: DECK_ORDER,
            after: entries,
            undo: 'field'
        });
    });
});
