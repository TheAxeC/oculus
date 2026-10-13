// Layer 2, client-state tests. What a save of an entry form posts and where: the changed fields of
// a page entry as the one `entry` write of a collection entry, one `feed-field` write per field of
// a feed entry, or the one `career` write; and the delete of an entry. The writes are stubs that
// record their calls.

import { describe, expect, it } from 'vitest';
import {
    deletePage,
    pagePayload,
    savePage,
    type SaveWrites
} from '../../../src/lib/state/forms/entry-save.ts';
import type { PageEntry } from '../../../src/lib/state/forms/page-entry.ts';
import type { FormField } from '../../../src/lib/state/forms/schema.ts';
import type { WriteAnswer, WritesStore } from '../../../src/lib/state/shared/stores/shapes.ts';
import { engineDir, loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';
import { setCatalog, t } from '../../../src/lib/state/shared/words/text.ts';

setCatalog(textCatalog(loadConfig(engineDir()).config));

/** A schema field as a schema file declares it, with a label and section nothing here reads. */
function form(field: Pick<FormField, 'field' | 'type'> & Partial<FormField>): FormField {
    return { label: field.field, section: 'main', ...field };
}

const FIELDS: FormField[] = [
    form({ field: 'key', type: 'text' }),
    form({ field: 'title', type: 'text' }),
    form({ field: 'short', type: 'text' }),
    form({ field: 'tier', type: 'text' })
];

function page(kind: PageEntry['kind'], over: Partial<PageEntry> = {}): PageEntry {
    return {
        kind,
        collection: 'venues',
        key: 'jbhi',
        name: 'venues:jbhi',
        writeId: 'jbhi',
        root: '',
        title: 'JBHI',
        schema: [],
        values: { key: 'jbhi', title: 'JBHI', short: 'J', tier: 'a' },
        fixed: ['key'],
        peers: [],
        ...over
    };
}

function ok(changed: string[], refused: WriteAnswer['refused'] = []): WriteAnswer {
    return { ok: true, changed, refused };
}

type Call = [string, ...unknown[]];

type Stub = SaveWrites & Pick<WritesStore, 'deleteEntry' | 'deleteFeedEntry'>;

function writes(calls: Call[], answer: (field: string) => WriteAnswer): Stub {
    return {
        writeEntry: (collection, id, fields) => {
            calls.push(['entry', collection, id, fields]);
            return Promise.resolve(ok(Object.keys(fields)));
        },
        writeFeedField: (feed, id, field, value, root) => {
            calls.push(['feed-field', feed, id, field, value, root]);
            return Promise.resolve(answer(field));
        },
        writeCareer: (fields) => {
            calls.push(['career', fields]);
            return Promise.resolve(ok(Object.keys(fields)));
        },
        deleteEntry: (collection, id) => {
            calls.push(['delete-entry', collection, id]);
            return Promise.resolve(ok([id]));
        },
        deleteFeedEntry: (feed, id, root) => {
            calls.push(['feed-delete', feed, id, root]);
            return Promise.resolve(ok([id]));
        }
    };
}

describe('pagePayload', () => {
    it('posts the fields whose payload differs, in the schema order', () => {
        const edits = { tier: 'b', short: 'J-BHI', title: ' JBHI ' };
        const made = pagePayload(page('collection'), FIELDS, edits);
        expect(Object.keys(made.body)).toEqual(['short', 'tier']);
        expect(made.body).toEqual({ short: 'J-BHI', tier: 'b' });
        expect(made.taken).toEqual({ short: 'J-BHI', tier: 'b' });
    });

    it('never posts a fixed field, and posts a cleared field as null', () => {
        const made = pagePayload(page('collection'), FIELDS, { key: 'other', short: '  ' });
        expect(made.body).toEqual({ short: null });
    });

    it('posts a venue name and never its id', () => {
        const venue = page('collection', {
            values: { name: 'JBHI', id: 'jbhi' },
            fixed: ['id']
        });
        const fields = [form({ field: 'name', type: 'text' }), form({ field: 'id', type: 'text' })];
        const made = pagePayload(venue, fields, { name: 'IEEE JBHI', id: 'other' });
        expect(made.body).toEqual({ name: 'IEEE JBHI' });
    });

    it('posts nothing for an edit that says what the file says', () => {
        expect(pagePayload(page('collection'), FIELDS, { short: 'J' }).body).toEqual({});
    });
});

describe('savePage', () => {
    it('posts a collection entry as the one entry write', async () => {
        const calls: Call[] = [];
        await savePage(
            page('collection'),
            { short: 'x', tier: 'b' },
            writes(calls, () => ok([]))
        );
        expect(calls).toEqual([['entry', 'venues', 'jbhi', { short: 'x', tier: 'b' }]]);
    });

    it('posts the career file as the one career write', async () => {
        const calls: Call[] = [];
        await savePage(
            page('career'),
            { milestone: 'Veni' },
            writes(calls, () => ok([]))
        );
        expect(calls).toEqual([['career', { milestone: 'Veni' }]]);
    });

    it('posts a feed entry one field at a time in its hub and refuses a field that is no single value', async () => {
        const calls: Call[] = [];
        const feed = page('feed', { collection: 'leads', writeId: 'Postdoc A', root: 'second' });
        const answer = await savePage(
            feed,
            { fit: 'good', country: 'NL', odd: { a: 1 } },
            writes(calls, (field) =>
                field === 'country'
                    ? ok([], [{ field, reason: 'country takes text' }])
                    : ok([field])
            )
        );
        expect(calls).toEqual([
            ['feed-field', 'leads', 'Postdoc A', 'fit', 'good', 'second'],
            ['feed-field', 'leads', 'Postdoc A', 'country', 'NL', 'second']
        ]);
        expect(answer.changed).toEqual(['fit']);
        expect(answer.refused.map((one) => one.field)).toEqual(['country', 'odd']);
        expect(answer.refused[1].reason).toBe(t('entry_form.feed_scalar', 'odd'));
        expect(answer.ok).toBe(true);
    });

    it('is not ok when a write of a feed field is refused as a whole', async () => {
        const feed = page('feed', { collection: 'leads', writeId: 'Postdoc A' });
        const answer = await savePage(
            feed,
            { fit: 'good' },
            writes([], () => ({ ok: false, changed: [], refused: [], error: 'not found' }))
        );
        expect(answer).toMatchObject({ ok: false, error: 'not found' });
    });

    it('answers with the fields written before a write refused as a whole and sends no later one', async () => {
        const calls: Call[] = [];
        const feed = page('feed', { collection: 'leads', writeId: 'Postdoc A' });
        const answer = await savePage(
            feed,
            { fit: 'good', country: 'NL', region: 'EU' },
            writes(calls, (field) =>
                field === 'country'
                    ? { ok: false, changed: [], refused: [], error: 'the file changed' }
                    : ok([field])
            )
        );
        expect(calls.map((call) => call[3])).toEqual(['fit', 'country']);
        expect(answer).toEqual({
            ok: false,
            changed: ['fit'],
            refused: [],
            error: 'the file changed'
        });
    });
});

describe('deletePage', () => {
    it('deletes a collection entry with delete-entry', async () => {
        const calls: Call[] = [];
        await deletePage(
            page('collection'),
            writes(calls, () => ok([]))
        );
        expect(calls).toEqual([['delete-entry', 'venues', 'jbhi']]);
    });

    it('deletes a feed entry with feed-delete in the hub that holds it', async () => {
        const calls: Call[] = [];
        const feed = page('feed', { collection: 'radar', writeId: 'A paper', root: 'second' });
        await deletePage(
            feed,
            writes(calls, () => ok([]))
        );
        expect(calls).toEqual([['feed-delete', 'radar', 'A paper', 'second']]);
    });
});
