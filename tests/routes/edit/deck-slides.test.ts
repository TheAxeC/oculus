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
    undone,
    warmConfig
} from './write-fixture.ts';

test.beforeAll(warmConfig);

type Lists = { group: string; base: string[]; slides: string[] }[];

/** The body of a write of the lists given, and the order when one is. */
function body(
    groups: Lists,
    over: Partial<{
        path: string;
        root: string;
        order: { base: string[]; entries: string[] };
        keys: { path: string[]; base: unknown; value: unknown }[];
    }> = {}
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

/**
 * The deck file as the write leaves it with only the records given applied, each replacement the
 * first test makes kept only when its record is among them.
 */
function textWith(before: string, records: { key: string; field: string }[]): string {
    const has = (key: string, field: string): boolean =>
        records.some((one) => one.key === key && one.field === field);
    let text = before;
    if (has('deck', 'title'))
        text = text.replace('    title: A deck\n', '    title: The new title\n');
    if (has('groups.pillars', 'sort')) {
        text = text.replace('            - alpha\n', '            - alpha\n        sort: title\n');
    }
    if (has('groups.more', 'discover')) {
        text = text.replace('        slides: []\n', '        slides: []\n        discover: true\n');
    }
    if (has('groups.ideas', 'find'))
        text = text.replace('tiers: [personal] }', 'tiers: [personal, research] }');
    if (has('defaults', 'tag_tones')) {
        // A key the file does not hold is added after its last key.
        text = text.replace(
            '    - { slides: more }\n',
            '    - { slides: more }\ndefaults:\n    tag_tones:\n        measured: teal\n'
        );
    }
    return text;
}

/** The body of a write of the keys given, each `[path, base, value]`, and no list. */
function keysBody(keys: [string[], unknown, unknown][]): unknown {
    return body([], { keys: keys.map(([path, base, value]) => ({ path, base, value })) });
}

describe("writing a deck's keys", () => {
    it("sets the title, the tag tones and a group's sort, discover and find, changing only their lines, a record each, each undone", async () => {
        const into = deckTarget();
        const before = deckOf(into);
        const written = await answered(
            into,
            keysBody([
                [['deck', 'title'], 'A deck', 'The new title'],
                [['defaults', 'tag_tones'], null, { measured: 'teal' }],
                [['groups', 'pillars', 'sort'], null, 'title'],
                [['groups', 'more', 'discover'], null, true],
                [
                    ['groups', 'ideas', 'find'],
                    { folders: 'projects/*/*/present', tiers: ['personal'] },
                    { folders: 'projects/*/*/present', tiers: ['personal', 'research'] }
                ]
            ])
        );
        const after = deckOf(into);
        expect([written.status, written.answer.changed]).toEqual([
            200,
            [
                'deck.title',
                'defaults.tag_tones',
                'groups.pillars.sort',
                'groups.more.discover',
                'groups.ideas.find'
            ]
        ]);
        expect(after).toBe(textWith(before, changesOf(into)));
        const records = changesOf(into);
        expect(records.map((one) => [one.key, one.field, one.before, one.after])).toEqual([
            [
                'groups.ideas',
                'find',
                { folders: 'projects/*/*/present', tiers: ['personal'] },
                { folders: 'projects/*/*/present', tiers: ['personal', 'research'] }
            ],
            ['groups.more', 'discover', null, true],
            ['groups.pillars', 'sort', null, 'title'],
            ['defaults', 'tag_tones', null, { measured: 'teal' }],
            ['deck', 'title', 'A deck', 'The new title']
        ]);
        // Each record is undone newest first, each undo leaving only the older records' lines and
        // logged at the head, and the last undo leaves the file as it was.
        for (const [at, record] of records.entries()) {
            expect((await undone(into, record)).status).toBe(200);
            expect(deckOf(into)).toBe(textWith(before, records.slice(at + 1)));
            expect(changesOf(into)[0]).toMatchObject({ kind: 'deck-slides', undoes: record.at });
        }
        expect(deckOf(into)).toBe(before);
    });

    it('refuses a key the view does not set, a value the key does not take, a base the file does not hold, and a group it does not have', async () => {
        const into = deckTarget();
        const rows: { row: string; key: [string[], unknown, unknown]; reason: string }[] = [
            {
                row: 'a key the view does not set',
                key: [['deck', 'author'], null, 'me'],
                reason: 'deck.author is not a key the Slides view sets'
            },
            {
                row: 'an empty title',
                key: [['deck', 'title'], 'A deck', ' '],
                reason: 'deck.title cannot hold that value: it takes a text that is not empty'
            },
            {
                row: 'a sort of another word',
                key: [['groups', 'pillars', 'sort'], null, 'date'],
                reason: 'groups.pillars.sort cannot hold that value: it takes folder or title'
            },
            {
                row: 'a find with no folders',
                key: [['groups', 'pillars', 'find'], null, { tiers: ['research'] }],
                reason: 'groups.pillars.find cannot hold that value: it takes a map whose folders is a glob or a list of globs, with the lists tiers, stages, forms and status beside it'
            },
            {
                row: 'a base the file does not hold',
                key: [['deck', 'title'], 'Another deck', 'X'],
                reason: 'deck.title changed on disk while you were working. Read the deck again and make the change again.'
            },
            {
                row: 'a group the deck does not have',
                key: [['groups', 'nothing', 'sort'], null, 'title'],
                reason: 'The deck has no group named nothing'
            }
        ];
        for (const { row, key, reason } of rows) {
            expect(await refusedWith(into, keysBody([key])), row).toEqual([reason]);
        }
    });
});
