// Layer 4, client state test. An Applications entry added from a position lead: the fields a lead
// fills, the prefill of the Applications tab's add form, the add write first and then the lead's
// status set to `applied` once the add answered with the entry written, and no write to the lead
// when the add was refused, never reached the server or the form was cancelled. The tab's drafts
// and state are held in plain maps standing in for the stores.

import { describe, expect, it } from 'vitest';
import {
    APPLICATIONS,
    LEADS_FEED,
    NOT_APPLIED,
    addFromLead,
    applicationFromLead,
    closeAddForm,
    holdsTyped,
    leadAddFor,
    prefillFromLead,
    type ApplicationTab,
    type LeadWrites
} from '../../../src/lib/state/feeds/lead-application.ts';
import type { FormField } from '../../../src/lib/state/boards/collection.ts';
import { formKey, type TypedField } from '../../../src/lib/state/forms/form-drafts.svelte.ts';
import type { WriteAnswer } from '../../../src/lib/state/shared/stores/shapes.ts';
import { parseCollectionState } from '../../../src/lib/state/boards/collection.ts';

/** The writes an add from a lead makes, each recorded in order, the add answering as given. */
function recording(added: WriteAnswer): { writes: LeadWrites; made: unknown[][] } {
    const made: unknown[][] = [];
    const written: WriteAnswer = { ok: true, changed: [], refused: [] };
    return {
        made,
        writes: {
            newEntry: (collection, fields) => {
                made.push(['new-entry', collection, fields]);
                return Promise.resolve(added);
            },
            writeFeedField: (feed, id, field, value) => {
                made.push(['feed-field', feed, id, field, value]);
                return Promise.resolve(written);
            }
        }
    };
}

const FIELDS = { title: 'Postdoc, ML', status: 'not applied' };

describe('an entry added from a lead', () => {
    it('writes the entry, then sets the lead applied, and answers with the add', async () => {
        const added: WriteAnswer = { ok: true, changed: ['applications'], refused: [] };
        const { writes, made } = recording(added);
        expect(await addFromLead(writes, 'applications', FIELDS, 'Postdoc, ML')).toBe(added);
        expect(made).toEqual([
            ['new-entry', 'applications', FIELDS],
            ['feed-field', LEADS_FEED, 'Postdoc, ML', 'status', 'applied']
        ]);
    });

    it('writes nothing to the lead when the add was refused or failed', async () => {
        for (const added of [
            { ok: false, changed: [], refused: [], error: 'unwritable' },
            { ok: true, changed: [], refused: [{ field: 'title', reason: 'taken' }] },
            { ok: false, changed: [], refused: [], network: true }
        ]) {
            const { writes, made } = recording(added);
            expect(await addFromLead(writes, 'applications', FIELDS, 'Postdoc, ML')).toBe(added);
            expect(made).toEqual([['new-entry', 'applications', FIELDS]]);
        }
    });
});

describe('the lead an Applications tab holds', () => {
    it('keeps the lead an add form was filled from, and none for a blank or a non-string', () => {
        expect(parseCollectionState({ lead: 'Postdoc, ML' }).lead).toBe('Postdoc, ML');
        expect(parseCollectionState({ lead: '  ' }).lead).toBe(undefined);
        expect(parseCollectionState({ lead: 7 }).lead).toBe(undefined);
    });
});

/** The Applications tab's drafts and state in maps, and every call made on them in order. */
function tabOf(): {
    tab: ApplicationTab;
    drafts: Map<string, Record<string, TypedField>>;
    states: Map<string, unknown>;
    calls: string[];
} {
    const drafts = new Map<string, Record<string, TypedField>>();
    const states = new Map<string, unknown>();
    const calls: string[] = [];
    const key = (id: string, form: string): string => `${id}|${form}`;
    return {
        drafts,
        states,
        calls,
        tab: {
            formEdits: (id, form) => drafts.get(key(id, form)) ?? {},
            clearFormDraft: (id, form) => {
                calls.push(`clear ${form}`);
                drafts.delete(key(id, form));
            },
            setFormField: (id, form, field, typed) => {
                calls.push(`set ${field}`);
                drafts.set(key(id, form), { ...(drafts.get(key(id, form)) ?? {}), [field]: typed });
            },
            instanceState: (id) => states.get(id),
            setInstanceState: (id, state) => states.set(id, state)
        }
    };
}

/** The Applications schema's form fields the prefill reads the kinds from. */
const SCHEMA: FormField[] = [
    { field: 'title', label: 'Title', kind: 'text', options: [], required: true },
    { field: 'sub', label: 'Sub', kind: 'text', options: [], required: false },
    { field: 'status', label: 'Status', kind: 'select', options: [NOT_APPLIED], required: true },
    { field: 'deadline', label: 'Deadline', kind: 'date', options: [], required: false },
    { field: 'done', label: 'Done', kind: 'checkbox', options: [], required: false }
];

const ADD = formKey(APPLICATIONS, null);

describe('the fields a lead fills', () => {
    it('takes the title, the institution as subtitle, the posting and the deadline', () => {
        const lead = {
            title: 'Assistant Professor, ML',
            inst: 'Northwood University',
            url: 'https://example.org/jobs/northwood-ml',
            deadline: '2026-11-30',
            fit: 'strong'
        };
        expect(applicationFromLead(lead)).toEqual({
            title: 'Assistant Professor, ML',
            sub: 'Northwood University',
            url: 'https://example.org/jobs/northwood-ml',
            deadline: '2026-11-30',
            status: NOT_APPLIED
        });
    });

    it('leaves out a field the lead lacks, so its control opens empty', () => {
        expect(applicationFromLead({ title: '  Postdoc  ', deadline: '' })).toEqual({
            title: 'Postdoc',
            status: 'not applied'
        });
    });
});

describe('the prefill of the Applications add form', () => {
    it('clears the drafts, sets each field by its kind, opens the form and names the lead', () => {
        const { tab, drafts, states, calls } = tabOf();
        drafts.set(`app-1|${ADD}`, {
            note: { value: 'typed before', kind: 'text', base: '' }
        });
        states.set('app-1', { search: 'kept' });
        expect(holdsTyped(tab, 'app-1')).toBe(true);
        prefillFromLead(
            tab,
            'app-1',
            {
                title: ' Postdoc, ML ',
                inst: 'Northwood',
                url: 'example.org/x',
                deadline: '2026-11-30'
            },
            SCHEMA
        );
        // The drafts go first; the url is no field of this schema, so it is left out.
        expect(calls).toEqual([
            'clear ' + ADD,
            'set title',
            'set sub',
            'set deadline',
            'set status'
        ]);
        expect(drafts.get(`app-1|${ADD}`)).toEqual({
            title: { value: 'Postdoc, ML', kind: 'text', base: '' },
            sub: { value: 'Northwood', kind: 'text', base: '' },
            deadline: { value: '2026-11-30', kind: 'date', base: '' },
            status: { value: NOT_APPLIED, kind: 'select', base: '' }
        });
        // The lead is named by its title as the file holds it, which the feed write names it by.
        expect(states.get('app-1')).toMatchObject({
            search: 'kept',
            adding: true,
            lead: ' Postdoc, ML '
        });
    });

    it('names no lead for a lead with no title', () => {
        const { tab, states } = tabOf();
        prefillFromLead(tab, 'app-1', { title: '  ' }, SCHEMA);
        expect(states.get('app-1')).toMatchObject({ adding: true });
        expect(states.get('app-1')).not.toHaveProperty('lead', expect.anything());
    });
});

describe('the save of a form opened from a lead', () => {
    it('writes the lead applied once the entry is written, and lets the lead go', async () => {
        const { tab, states } = tabOf();
        states.set('app-1', { adding: true, lead: 'Postdoc, ML' });
        const { writes, made } = recording({ ok: true, changed: ['applications'], refused: [] });
        const add = leadAddFor(tab, writes, 'app-1', APPLICATIONS);
        await add?.(FIELDS);
        expect(made).toEqual([
            ['new-entry', 'applications', FIELDS],
            ['feed-field', LEADS_FEED, 'Postdoc, ML', 'status', 'applied']
        ]);
        expect(states.get('app-1')).toMatchObject({ adding: true });
        expect(leadAddFor(tab, writes, 'app-1', APPLICATIONS)).toBe(undefined);
    });

    it('writes nothing to the lead on a refused add, and keeps the lead for the next save', async () => {
        const { tab, states } = tabOf();
        states.set('app-1', { adding: true, lead: 'Postdoc, ML' });
        const refused = { ok: true, changed: [], refused: [{ field: 'title', reason: 'taken' }] };
        const { writes, made } = recording(refused);
        await leadAddFor(tab, writes, 'app-1', APPLICATIONS)?.(FIELDS);
        expect(made).toEqual([['new-entry', 'applications', FIELDS]]);
        expect(states.get('app-1')).toMatchObject({ lead: 'Postdoc, ML' });
    });

    it('writes nothing to the lead on a cancel, which closes the form and lets the lead go', () => {
        const { tab, states } = tabOf();
        states.set('app-1', { adding: true, lead: 'Postdoc, ML' });
        const { writes, made } = recording({ ok: true, changed: [], refused: [] });
        closeAddForm(tab, 'app-1');
        expect(made).toEqual([]);
        expect(states.get('app-1')).toMatchObject({ adding: false });
        expect(leadAddFor(tab, writes, 'app-1', APPLICATIONS)).toBe(undefined);
    });

    it('offers no add of its own for a form no lead opened', () => {
        const { tab } = tabOf();
        const { writes } = recording({ ok: true, changed: [], refused: [] });
        expect(leadAddFor(tab, writes, 'app-1', APPLICATIONS)).toBe(undefined);
    });
});
