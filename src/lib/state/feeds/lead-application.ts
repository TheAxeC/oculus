// Layer 2, client state. An Applications entry added from a position lead, from the press on the
// lead's `applied` control to the lead set `applied`:
//
// - what the lead puts into the Applications add form (its title, its institution as the
//   subtitle, its posting, its deadline, and the status of a position not yet applied to);
// - the prefill of that form in the Applications tab: its drafts cleared, each field set as its
//   control holds it by the schema's kind, the form opened, and the tab's state naming the lead;
// - the save: the entry's add write, and then, once that write answered with the entry written,
//   the lead's status set to `applied` through the same feed write the lead's own status controls
//   make, so both writes are in the change log with their undo, and the lead let go of;
// - the cancel, which closes the form and lets the lead go with nothing written to it.
//
// A refused add writes nothing to the lead, so a lead leaves the radar only for an application
// the file holds. The Leads view and the collection view call these; nothing here draws.

import { APPLIED } from '../../data/accounts/leads.ts';
import { readAs, textOrNumberShape } from '../../data/shapes/shapes.ts';
import type { WriteAnswer } from '../shared/stores/shapes.ts';
import { parseCollectionState, type FormField } from '../boards/collection.ts';
import { formKey, type TypedField } from '../forms/form-drafts.svelte.ts';
import { controlValue } from '../forms/form-values.ts';
import type { LeadEntry } from './leads.ts';

/** The feed a lead is written through, the key the feed writes name it by. */
export const LEADS_FEED = 'leads';

/** The collection the lead is turned into an entry of, config/sources.yml's key. */
export const APPLICATIONS = 'applications';

/** The status of a position the reader has not applied to yet, the Applications schema's word. */
export const NOT_APPLIED = 'not applied';

/** The two writes an add from a lead makes, as the writes store offers them. */
export type LeadWrites = {
    newEntry: (collection: string, fields: Record<string, unknown>) => Promise<WriteAnswer>;
    writeFeedField: (
        feed: string,
        id: string,
        field: string,
        value: string | number | boolean | null
    ) => Promise<WriteAnswer>;
};

/** What the prefill and the save read and write of the Applications tab. */
export type ApplicationTab = {
    formEdits: (instance: string, form: string) => Record<string, unknown>;
    clearFormDraft: (instance: string, form: string) => void;
    setFormField: (instance: string, form: string, field: string, typed: TypedField) => void;
    instanceState: (id: string) => unknown;
    setInstanceState: (id: string, state: unknown) => void;
};

/** The add form's key in the Applications tab's drafts. */
const ADD_FORM = formKey(APPLICATIONS, null);

/** One field of a lead as text, or the empty string for a field the lead does not hold. */
function text(entry: LeadEntry, field: string): string {
    return (readAs(textOrNumberShape, entry[field]) ?? '').trim();
}

/**
 * The Applications fields a lead fills, by field name. A field the lead lacks is left out, so the
 * form's control for it opens empty as it would for any new entry.
 */
export function applicationFromLead(entry: LeadEntry): Record<string, string> {
    const fields: Record<string, string> = {
        title: text(entry, 'title'),
        sub: text(entry, 'inst'),
        url: text(entry, 'url'),
        deadline: text(entry, 'deadline'),
        status: NOT_APPLIED
    };
    return Object.fromEntries(Object.entries(fields).filter(([, value]) => value !== ''));
}

/** Whether the Applications tab's add form holds typed text, which a prefill would replace. */
export function holdsTyped(tab: ApplicationTab, id: string): boolean {
    return Object.keys(tab.formEdits(id, ADD_FORM)).length > 0;
}

/**
 * Fill the Applications tab's add form from a lead: its drafts cleared, each field the lead fills
 * and the schema names set as its control holds it, the form opened, and the tab's state naming
 * the lead by its title, which the save marks applied. `fields` are the Applications schema's form
 * fields; a field it does not name is left out.
 */
export function prefillFromLead(
    tab: ApplicationTab,
    id: string,
    entry: LeadEntry,
    fields: readonly FormField[]
): void {
    const kinds = new Map(fields.map((one) => [one.field, one.kind]));
    tab.clearFormDraft(id, ADD_FORM);
    for (const [field, value] of Object.entries(applicationFromLead(entry))) {
        const kind = kinds.get(field);
        if (kind === undefined) continue;
        tab.setFormField(id, ADD_FORM, field, {
            value: controlValue(value, kind),
            kind,
            base: controlValue(undefined, kind)
        });
    }
    // The lead is named as the feed write names it, the title as the file holds it, untrimmed.
    const lead = readAs(textOrNumberShape, entry.title) ?? '';
    tab.setInstanceState(id, {
        ...parseCollectionState(tab.instanceState(id)),
        adding: true,
        lead: lead.trim() === '' ? undefined : lead
    });
}

/**
 * Add the entry, then mark the lead named by its title applied when the entry was written. The
 * answer handed back is the add's, which is what the form says; a refused status write is said by
 * the notification every refused write posts.
 */
export async function addFromLead(
    writes: LeadWrites,
    collection: string,
    fields: Record<string, unknown>,
    lead: string
): Promise<WriteAnswer> {
    const answer = await writes.newEntry(collection, fields);
    if (!answer.ok || answer.refused.length > 0) return answer;
    await writes.writeFeedField(LEADS_FEED, lead, 'status', APPLIED);
    return answer;
}

/**
 * The add write of a collection tab's add form: none while its state names no lead, so the form
 * writes through its own add, and otherwise addFromLead over that lead, which lets the lead go
 * from the tab's state once the entry is written, so a second save marks nothing twice.
 */
export function leadAddFor(
    tab: ApplicationTab,
    writes: LeadWrites,
    id: string,
    collection: string
): ((fields: Record<string, unknown>) => Promise<WriteAnswer>) | undefined {
    const lead = parseCollectionState(tab.instanceState(id)).lead;
    if (lead === undefined) return undefined;
    return async (fields) => {
        const answer = await addFromLead(writes, collection, fields, lead);
        if (answer.ok && answer.refused.length === 0) {
            tab.setInstanceState(id, {
                ...parseCollectionState(tab.instanceState(id)),
                lead: undefined
            });
        }
        return answer;
    };
}

/** Close a collection tab's add form, letting its lead go with nothing written to it. */
export function closeAddForm(tab: ApplicationTab, id: string): void {
    tab.setInstanceState(id, {
        ...parseCollectionState(tab.instanceState(id)),
        adding: false,
        lead: undefined
    });
}
