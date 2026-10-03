// Taking a manifest write that removed a field back: the removed lines return to the place they
// stood, whatever else the file gained or lost since, and a record that carries no usable removed
// text is undone by writing the value.
//
// Each case is a write through the route and the undo of the change it left, with the whole text of
// the manifest compared. The hub and the change log are the fixture in write-fixture.ts, under the
// system temporary directory.

import { expect, describe } from 'vitest';
import type { Change } from '../../../src/lib/server/core/changes.ts';
import type { WriteTarget } from '../../../src/lib/server/edit/writes.ts';
import {
    MANIFEST,
    changesOf,
    hold,
    manifestOf,
    recorded,
    target,
    undone,
    wrote
} from './write-fixture.ts';
import { present } from '../../fixtures/present.ts';
import { it } from '../../fixtures/scratch.ts';

/** The first lines of every held manifest: the ones the reader needs to find the project. */
const HEAD = 'id: alpha\ntype: manuscript\n';

/** A manifest with a quoted title and a comment after it, above the fixture's status map. */
const TITLED = `${HEAD}title: "A title"  # the name\nstatus:\n  line: "the line"\n`;

describe('taking a removed field back where it stood', () => {
    /** A target whose manifest holds `text`, written by `fields`; the changes are oldest first. */
    async function cleared(
        text: string,
        fields: Record<string, unknown>
    ): Promise<{ into: WriteTarget; changes: Change[] }> {
        const into = target();
        hold(into, text);
        await wrote(into, fields);
        const changes = changesOf(into).reverse();
        expect(manifestOf(into)).not.toBe(text);
        return { into, changes };
    }

    /** The undo of one change, which must have been made, and the manifest it left. */
    async function back(into: WriteTarget, change: Change): Promise<string> {
        expect((await undone(into, change)).status).toBe(200);
        return manifestOf(into);
    }

    it('gives a title back with its quotes and its comment', async () => {
        const { into, changes } = await cleared(TITLED, { title: '' });
        expect(await back(into, changes[0])).toBe(TITLED);
    });

    it('gives a status line back as the only child of its map', async () => {
        const { into, changes } = await cleared(MANIFEST, { 'status.line': '' });
        expect(await back(into, changes[0])).toBe(MANIFEST);
    });

    it('gives a block list back in the block style', async () => {
        const held = `${HEAD}title: "A title"\nrelated:\n  - a\n  - b\nnext: go\n`;
        const { into, changes } = await cleared(held, { related: [] });
        expect(await back(into, changes[0])).toBe(held);
    });

    it('gives a group cleared whole back', async () => {
        const held = `${HEAD}followup:\n  do: call\n  after: 2026-10-01\nnext: go\n`;
        const { into, changes } = await cleared(held, { followup: null });
        expect(changes[0]).toMatchObject({ field: 'followup', after: null });
        expect(await back(into, changes[0])).toBe(held);
    });

    it('gives a follow-up back whichever shape the file held it in, after the editor cleared it', async () => {
        for (const note of [
            'followup: "call"\n',
            'followup: { do: call, after: 2026-10-01 }\n',
            'followup:\n  - call\n'
        ]) {
            const held = `${HEAD}${note}next: go\n`;
            const { into, changes } = await cleared(held, { followup: null });
            // the history keeps the clear as one change of the group, and the file holds no note
            expect(changes).toHaveLength(1);
            expect(changes[0]).toMatchObject({ field: 'followup', after: null });
            expect(manifestOf(into)).not.toContain('followup');
            expect(await back(into, changes[0])).toBe(held);
        }
    });

    it('gives a bare or one-list follow-up back as the text the file held, after an edit of it', async () => {
        for (const note of ['followup: "call"\n', 'followup:\n  - call\n']) {
            const held = `${HEAD}${note}next: go\n`;
            const { into, changes } = await cleared(held, { 'followup.do': 'ring' });
            expect(changes[0]).toMatchObject({
                field: 'followup.do',
                before: 'call',
                after: 'ring'
            });
            expect(await back(into, changes[0])).toBe(held);
        }
    });

    it('gives a one-note list holding a map back as the list, comments included', async () => {
        const held = `${HEAD}followup:  # the call\n  - do: call  # who\n    after: 2026-10-01\nnext: go\n`;
        const { into, changes } = await cleared(held, { 'followup.do': 'ring' });
        expect(manifestOf(into)).toContain('do: ring  # who');
        expect(await back(into, changes[0])).toBe(held);
    });

    it('audits that the value is written, as a map, for the undo of one field of a two-field write on a bare note', async () => {
        const held = `${HEAD}followup: "call"\nnext: go\n`;
        const { into, changes } = await cleared(held, {
            'followup.do': 'ring',
            'followup.after': '2026-12-01'
        });
        const date = changes.find((one) => one.field === 'followup.after');
        if (date === undefined) throw new Error('the write left no record of followup.after');
        const after = await back(into, date);
        expect(after).toBe(`${HEAD}followup:\n  do: ring\nnext: go\n`);
    });

    it('gives the shape back when the note was written with its date, whichever shape the note had', async () => {
        for (const note of ['followup: "call"\n', 'followup:\n  - call\n']) {
            const held = `${HEAD}${note}next: go\n`;
            const { into, changes } = await cleared(held, { 'followup.after': '2026-12-01' });
            expect(changes[0]).toMatchObject({ field: 'followup.after', before: null });
            expect(await back(into, changes[0])).toBe(held);
        }
    });

    it('gives a bare note back as the text the file held after a later write above it', async () => {
        const held = `${HEAD}title: Alpha\nfollowup: "Register for FLTA 2026"  # ask\nnext: go\n`;
        const { into, changes } = await cleared(held, { 'followup.after': '2026-12-01' });
        await wrote(into, { title: 'Alpha, renamed' });
        expect(await back(into, changes[0])).toBe(held.replace('Alpha', 'Alpha, renamed'));
    });

    it('audits that the value is written instead when the file no longer holds what the expanding write left', async () => {
        const held = `${HEAD}followup: "call"\nnext: go\n`;
        const { into, changes } = await cleared(held, { 'followup.do': 'ring' });
        // A comment typed into the map since: the span the write left is no longer in the file.
        hold(into, manifestOf(into).replace('followup:\n', 'followup:\n  # kept\n'));
        const after = await back(into, changes[0]);
        expect(after).toContain('# kept');
        expect(after).toContain('do: call');
        expect(after).not.toContain('followup: "call"');
    });

    it('gives a key of a flow map back inside its line', async () => {
        const held = `${HEAD}status: { line: "x", chips: [a] }\n`;
        const { into, changes } = await cleared(held, { 'status.line': '' });
        expect(await back(into, changes[0])).toBe(held);
    });

    it('gives two fields of one write back in either order of the undos', async () => {
        const held = `${HEAD}title: T\nnext: go\nshort: s\n`;
        for (const oldestFirst of [false, true]) {
            const { into, changes } = await cleared(held, { title: '', short: '' });
            for (const change of oldestFirst ? changes : [...changes].reverse()) {
                expect((await undone(into, change)).status).toBe(200);
            }
            expect(manifestOf(into)).toBe(held);
        }
    });

    it('gives two neighbouring fields back exactly when the upper one is undone first', async () => {
        const held = `${HEAD}title: T\nshort: s\nnext: go\n`;
        const upper = await cleared(held, { title: '', short: '' });
        for (const change of upper.changes) await back(upper.into, change);
        expect(manifestOf(upper.into)).toBe(held);

        // The line the upper field's record names as following it is the lower field's own, which
        // the write removed too, so the upper field returns before the line that now follows both.
        const lower = await cleared(held, { title: '', short: '' });
        for (const change of [...lower.changes].reverse()) await back(lower.into, change);
        expect(manifestOf(lower.into)).toBe(`${HEAD}short: s\ntitle: T\nnext: go\n`);
    });

    it('finds the place again after a line above it was rewritten', async () => {
        const held = `${HEAD}short: s\ntitle: "A title"  # the name\nnext: go\n`;
        for (const value of ['a longer value', 'ss']) {
            const { into, changes } = await cleared(held, { title: '' });
            await wrote(into, { short: value });
            expect(await back(into, changes[0])).toBe(held.replace('short: s', `short: ${value}`));
        }
    });

    it('finds the place again after the same write changed a field above it', async () => {
        const held = `${HEAD}title: T\nshort: s\nnext: go\n`;
        const grown = held.replace('title: T', 'title: a much longer title');
        for (const fields of [
            { short: '', title: 'a much longer title' },
            { title: 'a much longer title', short: '' }
        ]) {
            const { into, changes } = await cleared(held, fields);
            const clear = present(
                changes.find((one) => one.field === 'short'),
                'change of the cleared field'
            );
            expect(await back(into, clear)).toBe(grown);
        }
    });

    it('writes the value into the map that has come back when no place keeps one status', async () => {
        const { into, changes } = await cleared(MANIFEST, { 'status.line': '' });
        hold(into, `${manifestOf(into)}status:\n  chips: [a]\n`);
        expect(await back(into, changes[0])).toBe(
            `${HEAD}title: "A title"\nstatus:\n  chips: [a]\n  line: the line\n`
        );
    });

    it('puts the lines at the nearest line start when the line that followed was edited', async () => {
        const { into, changes } = await cleared(TITLED, { title: '' });
        hold(into, manifestOf(into).replace('status:', 'status:   # edited by hand'));
        expect(await back(into, changes[0])).toBe(
            TITLED.replace('status:', 'status:   # edited by hand')
        );
    });

    it('puts the lines before the occurrence of the following line nearest where they stood', async () => {
        const held = `${HEAD}# --\ntitle: "A title"\n# --\nstatus:\n  line: "the line"\n`;
        const { into, changes } = await cleared(held, { title: '' });
        expect(await back(into, changes[0])).toBe(held);
    });

    it('keeps a key added at the end of the file since', async () => {
        const { into, changes } = await cleared(TITLED, { title: '' });
        hold(into, `${manifestOf(into)}pin: true\n`);
        expect(await back(into, changes[0])).toBe(`${TITLED}pin: true\n`);
    });

    it('finds the place again when the record stood past the end of the file', async () => {
        const into = target();
        const absent = TITLED.replace('title: "A title"  # the name\n', '');
        hold(into, absent);
        const removed = { offset: 99999, text: 'title: "A title"  # the name\n', next: 'status:' };
        const change = await recorded(into, 'title', 'A title', null, removed);
        expect(await back(into, change)).toBe(TITLED);
    });

    it('gives a file with CRLF line ends back byte for byte', async () => {
        const held = 'id: alpha\r\ntitle: T\r\nnext: go\r\n';
        const { into, changes } = await cleared(held, { title: '' });
        expect(changes[0].removed).toEqual({
            offset: 11,
            text: 'title: T\r\n',
            next: 'next: go\r'
        });
        expect(await back(into, changes[0])).toBe(held);
    });

    it('gives a last line without a line break back without one', async () => {
        const held = 'id: alpha\ntitle: T';
        const { into, changes } = await cleared(held, { title: '' });
        expect(changes[0].removed).toEqual({ offset: 10, text: 'title: T', next: '' });
        expect(await back(into, changes[0])).toBe(held);
    });

    it('gives a title with a letter outside ASCII back', async () => {
        const held = `${HEAD}title: "Link\u00f6ping"\nnext: go\n`;
        const { into, changes } = await cleared(held, { title: '' });
        expect(await back(into, changes[0])).toBe(held);
    });

    it('puts the removal back again when the undo itself is undone', async () => {
        const { into, changes } = await cleared(TITLED, { title: '' });
        expect(await back(into, changes[0])).toBe(TITLED);

        const [restore] = changesOf(into);
        expect(await back(into, restore)).not.toBe(TITLED);
        const [again] = changesOf(into);
        expect(again.removed).toEqual(changes[0].removed);

        expect(await back(into, again)).toBe(TITLED);
    });

    it('refuses to write over a field edited since, whatever the record keeps', async () => {
        const { into, changes } = await cleared(TITLED, { title: '' });
        const edited = `${manifestOf(into)}title: Z\n`;
        hold(into, edited);
        expect((await undone(into, changes[0])).status).toBe(409);
        expect(manifestOf(into)).toBe(edited);
    });
});

describe('what a change record keeps of a removed field', () => {
    it('keeps the removed lines, their place and the line after them', async () => {
        const into = target();
        hold(into, TITLED);
        const cleared = await wrote(into, { title: '' });
        expect(cleared.removed).toEqual({
            offset: HEAD.length,
            text: 'title: "A title"  # the name\n',
            next: 'status:'
        });

        const again = await wrote(into, { 'status.line': '' });
        expect(again.removed).toEqual({
            offset: HEAD.length,
            text: 'status:\n  line: "the line"\n',
            next: ''
        });
    });

    it('keeps nothing for a write that changed a value or added a line', async () => {
        const into = target();
        const changed = await wrote(into, { title: 'Another title' });
        expect(changed).not.toHaveProperty('removed');
        const added = await wrote(into, { year: '2025' });
        expect(added).not.toHaveProperty('removed');
    });

    it('keeps nothing for the undo of a removal', async () => {
        const into = target();
        const cleared = await wrote(into, { title: '' });
        expect((await undone(into, cleared)).status).toBe(200);
        expect(changesOf(into)[0]).not.toHaveProperty('removed');
    });
});

describe('a record without usable removed lines', () => {
    /** The manifest without its title, which is what a record of a removed title finds. */
    const WITHOUT = MANIFEST.replace('title: "A title"\n', '');

    it('appends the value when the record has no removed lines', async () => {
        const into = target();
        hold(into, WITHOUT);
        const change = await recorded(into, 'title', 'A title', null);
        expect((await undone(into, change)).status).toBe(200);
        expect(manifestOf(into)).toBe(`${WITHOUT}title: A title\n`);
    });

    /**
     * The lines the title had, which fit the end of the manifest: a record whose other keys were
     * well formed would put them back there, quoted, instead of writing the value.
     */
    const FITS = 'title: "A title"\n';

    const malformed: [string, unknown][] = [
        ['a negative offset', { offset: -1, text: FITS, next: '' }],
        ['empty text', { offset: 3, text: '', next: '' }],
        ['a string', 'yes'],
        ['null', null],
        ['a list', []],
        ['a fractional offset', { offset: 3.5, text: FITS, next: '' }],
        ['an offset written as text', { offset: '10', text: FITS, next: '' }],
        ['text that is a number', { offset: 3, text: 7, next: '' }],
        ['no next', { offset: 3, text: FITS }],
        ['a next that is a number', { offset: 3, text: FITS, next: 7 }]
    ];

    for (const [name, removed] of malformed) {
        it(`writes the value, not the lines, when removed is ${name}`, async () => {
            const into = target();
            hold(into, WITHOUT);
            const change = await recorded(into, 'title', 'A title', null, removed);
            expect((await undone(into, change)).status).toBe(200);
            expect(manifestOf(into)).toBe(`${WITHOUT}title: A title\n`);
        });
    }

    it('refuses a group with no removed lines, or lines that fit nowhere', async () => {
        const into = target();
        const reason = 'the field is a group; set its children, or clear it whole';
        const before = { do: 'call' };
        for (const removed of [undefined, { offset: 0, text: 'followup: x', next: 'nowhere' }]) {
            const change = await recorded(into, 'followup', before, null, removed);
            const response = await undone(into, change);
            expect(response.status).toBe(400);
            expect(await response.json()).toEqual({
                error: 'refused',
                refused: [{ field: 'followup', reason }]
            });
            expect(manifestOf(into)).toBe(MANIFEST);
        }
    });

    it('refuses a record of a field no write may set, whatever removed says', async () => {
        const into = target();
        // Each record keeps text that fits the manifest at the top, before the text named as its
        // next, so an insertion made before the checks would write it.
        const cases: [string, unknown, unknown, string, string, string][] = [
            [
                'tier',
                'archive',
                'manuscripts',
                'tier: archive\n',
                'id: alpha',
                'the field is read-only'
            ],
            ['id', 'beta', 'alpha', 'id: beta\n# ', 'id: alpha', 'the field is read-only'],
            [
                'paths',
                { doc: 'a.md' },
                null,
                'paths:\n  doc: a.md\n',
                'id: alpha',
                'a map field is not written by the form'
            ],
            [
                'nosuch',
                'x',
                null,
                'nosuch: x\n',
                'id: alpha',
                'the manifest schema does not name the field'
            ],
            [
                'type',
                'idea',
                'manuscript',
                'type: idea\n# ',
                'type: manuscript',
                'type is set by the folder, never by a write'
            ]
        ];
        for (const [field, before, after, text, next, reason] of cases) {
            const removed = { offset: 0, text, next };
            const change = await recorded(into, field, before, after, removed);
            const response = await undone(into, change);
            expect(response.status).toBe(400);
            expect(await response.json()).toEqual({
                error: 'refused',
                refused: [{ field, reason }]
            });
            expect(manifestOf(into)).toBe(MANIFEST);
        }
    });
});

describe('the offset and the text of a removed record', () => {
    const WITHOUT = MANIFEST.replace('title: "A title"\n', '');
    const FITS = 'title: "A title"\n';

    /** The manifest an undo of a removed title leaves, for one record of the removed lines. */
    async function undoneWith(removed: unknown): Promise<string> {
        const into = target();
        hold(into, WITHOUT);
        const change = await recorded(into, 'title', 'A title', null, removed);
        expect((await undone(into, change)).status).toBe(200);
        return manifestOf(into);
    }

    it('writes the value for an offset that is fractional or negative, or text that is empty', async () => {
        const written = `${WITHOUT}title: A title\n`;
        expect(await undoneWith({ offset: 1.5, text: FITS, next: '' })).toBe(written);
        expect(await undoneWith({ offset: -1, text: FITS, next: '' })).toBe(written);
        expect(await undoneWith({ offset: 0, text: '', next: '' })).toBe(written);
        expect(await undoneWith({ offset: 0, text: FITS })).toBe(written);
    });

    it('puts the lines back for a whole non-negative offset, however large', async () => {
        const back = `${WITHOUT}${FITS}`;
        expect(await undoneWith({ offset: 0, text: FITS, next: '' })).toBe(back);
        expect(await undoneWith({ offset: 2 ** 60, text: FITS, next: '' })).toBe(back);
    });
});
