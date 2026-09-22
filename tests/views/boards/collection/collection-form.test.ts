// A collection's entry form, rendered to HTML on the server: the fields it draws for each kind, a
// field whose value is a map, and what a reorder and a cleared control send. The state a press
// would write is written through setInstanceState, so nothing here needs a DOM.

import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import EntryForm from '../../../../src/lib/views/shared/forms/EntryForm.svelte';
import type { Entry } from '../../../../src/lib/data/model.ts';
import { formKey } from '../../../../src/lib/state/forms/form-drafts.svelte.ts';
import { INSTANCE_KEY } from '../../../../src/lib/state/client/instance-context.ts';
import { noop } from '../../../fixtures/doubles.ts';
import { clientContext } from '../../../fixtures/client.ts';
import {
    client,
    receive,
    catalog,
    INSTANCE,
    SCHEMA,
    entry,
    ENTRIES,
    FUNDING_SCHEMA,
    FUNDING_ENTRIES,
    snapshot,
    html,
    cards,
    freshClient
} from './collection-fixture.ts';

beforeEach(freshClient);

describe('the entry form', () => {
    /** The form as the card opens it: over one entry to edit, and over none to add. */
    function form(entry: Entry | null, props: Record<string, unknown> = {}): string {
        return render(EntryForm, {
            context: clientContext(client),
            props: {
                collection: 'funding',
                schema: FUNDING_SCHEMA,
                entry,
                onclose: noop,
                onsaid: noop,
                ...props
            }
        }).body;
    }

    /** The classes on the form's own box, which is what carries its surface. */
    function box(body: string): string[] {
        return (/<div class="([^"]*)" data-form=/.exec(body)?.[1] ?? '').split(' ');
    }

    it("draws one control per schema field, in the file's order", () => {
        const body = form(null);
        expect(body).toContain(catalog['collection.form_add_title']);
        expect(body).toContain('<select');
        expect(body).toContain('<textarea');
        expect(body.indexOf('status')).toBeLessThan(body.indexOf('statement'));
    });

    it('fills the controls with what the entry holds, and offers the delete', () => {
        const body = form(FUNDING_ENTRIES[1]);
        expect(body).toContain(catalog['collection.form_edit_title']);
        expect(body).toContain('A funded scheme');
        expect(body).toContain(catalog['collection.form_delete']);
        expect(body).toContain(catalog['collection.form_save']);
    });

    it('offers no delete on the add form', () => {
        // there is nothing to delete on the add form, which is the form of an entry that does not exist yet
        expect(form(null)).not.toContain(catalog['collection.form_delete']);
    });

    it('pre-fills metalist rows and offers the add-row control', () => {
        const body = render(EntryForm, {
            context: clientContext(client),
            props: {
                collection: 'events',
                schema: SCHEMA,
                entry: ENTRIES[0],
                onclose: noop,
                onsaid: noop
            }
        }).body;
        expect(body).toContain('data-metalist="meta"');
        expect(body).toContain('value="When"');
        expect(body).toContain('value="16 Feb 2027"');
        expect(body).toContain('value="Where"');
        expect(body).toContain(catalog['collection.meta_add']);
        expect(body).toContain(catalog['collection.meta_remove']);
    });

    it('paints a box of its own, and none for a caller that asks for no surface', () => {
        // The border and the padding are the same either way; only the fill goes, so a caller whose
        // own box already carries the surface does not draw a second one inside it.
        expect(box(form(null))).toContain('surface');
        // the caller says its own box carries the surface, so the form paints no fill inside it
        expect(box(form(null, { surface: false }))).not.toContain('surface');
        expect(form(null, { surface: false })).toContain('data-form="add"');
    });

    it('gives back what was typed into it, inside the instance it was typed in and no other', () => {
        const typed = formKey('events', ENTRIES[0].id);
        client.formDrafts.setFormField(INSTANCE, typed, 'sub', {
            value: 'A subtitle typed earlier',
            kind: 'text',
            base: ''
        });
        const within = (instance: string | null): string =>
            render(EntryForm, {
                context: new Map([
                    ...clientContext(client),
                    [INSTANCE_KEY, (): string | null => instance]
                ]),
                props: {
                    collection: 'events',
                    schema: SCHEMA,
                    entry: ENTRIES[0],
                    onclose: noop,
                    onsaid: noop
                }
            }).body;
        expect(within(INSTANCE)).toContain('value="A subtitle typed earlier"');
        // a draft belongs to the tab it was typed in, so a second tab of the view shows none of it
        expect(within('another-instance')).not.toContain('A subtitle typed earlier');
        // a form outside every instance holds no draft either
        expect(within(null)).not.toContain('A subtitle typed earlier');
        // The add form of the same collection in the same instance is another form.
        expect(form(null)).not.toContain('A subtitle typed earlier');
    });

    it('keeps a form outside any pane apart from every instance, the empty id included', () => {
        // Revert: EntryForm reading `within?.() ?? ''` puts a form with no instance into the
        // instance named '', and the draft below is drawn in both forms here.
        const typed = formKey('events', ENTRIES[0].id);
        client.formDrafts.setFormField('', typed, 'sub', {
            value: 'A subtitle kept under the empty id',
            kind: 'text',
            base: ''
        });
        const props = {
            collection: 'events',
            schema: SCHEMA,
            entry: ENTRIES[0],
            onclose: noop,
            onsaid: noop
        };
        const outside = render(EntryForm, { context: clientContext(client), props }).body;
        const unnamed = render(EntryForm, {
            context: new Map([...clientContext(client), [INSTANCE_KEY, (): string | null => null]]),
            props
        }).body;
        // a draft belongs to an instance, and neither of these forms is inside one
        expect(outside).not.toContain('A subtitle kept under the empty id');
        // the form whose instance id is empty holds none either
        expect(unnamed).not.toContain('A subtitle kept under the empty id');
    });

    it("pre-fills a raw textarea with the entry map's JSON", () => {
        const body = render(EntryForm, {
            context: clientContext(client),
            props: {
                collection: 'data',
                schema: [{ field: 'retrieval', type: 'raw' }],
                entry: entry(0, 'A dataset', {
                    retrieval: { method: 'wget', verified: true }
                }),
                onclose: noop,
                onsaid: noop
            }
        }).body;
        expect(body).toContain('<textarea');
        expect(body).toContain('{"method":"wget","verified":true}');
    });
});

describe('a field whose value is a map', () => {
    it('draws one chip per key, the key and its line joined, rather than nothing', () => {
        const snap = snapshot();
        snap.version = 9;
        snap.entities.collections.events.entries = [
            entry(0, 'A nested talk', {
                retrieval: { method: 'wget', notes: 'from the source', empty: {} }
            })
        ];
        receive({ channel: 'portfolio', version: 9, payload: snap });
        const card = cards(html())[0];
        expect(card).toContain('>retrieval</span>');
        expect(card).toContain('method: wget');
        expect(card).toContain('notes: from the source');
        // a nested value with nothing in it draws no line of its own
        expect(card).not.toContain('empty:');
        receive({ channel: 'portfolio', version: 10, payload: snapshot() });
    });
});

describe('what a reorder and a cleared control send', () => {
    // The drop and the save are DOM events no server render fires, so the two rules are read off
    // the source: the order the drag writes, and the value an emptied control saves as. The pure
    // halves, movedOrder and clearedValue, are tested in tests/state/boards/collection.test.ts.
    it('writes the file own order, never the pinned-first order the cards are drawn in', () => {
        const source = readFileSync('src/lib/views/boards/collection/Collection.svelte', 'utf8');
        const order = source.slice(source.indexOf('function fileOrder()'));
        const body = order.slice(0, order.indexOf('\n    }'));
        expect(body).toContain('(collection?.entries ?? [])');
        // the order written is the file's own, so the reader that draws the pinned card first is not in it
        expect(body).not.toContain('pinnedFirst');
        // nor a map over any other list of entries
        expect(body).not.toContain('entries.map');
        // nor the shown list, which the filter and the pinned-first order have already changed
        expect(body).not.toContain('shown');
        // Both callers take their order from that one reader and from nothing else.
        expect(source).toContain('const order = fileOrder();');
        expect(source.match(/fileOrder\(\)/g)).toHaveLength(3);
    });

    it('sends the empty string for a control the reader cleared on an entry that exists', () => {
        const source = readFileSync('src/lib/views/shared/forms/EntryForm.svelte', 'utf8');
        expect(source).toContain('return clearedValue(field in edits, entry !== null);');
        expect(source).toContain("if (saved !== '') return saved;");
    });
});
