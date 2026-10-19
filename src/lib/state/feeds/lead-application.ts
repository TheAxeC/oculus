// Layer 2, client state. What a position lead puts into a new Applications entry, from the press on
// the lead's `applied` control: its title, its institution as the subtitle, its posting, its
// deadline when that is a date, and the status of a position not yet applied to, the word of
// `statuses` (config/catalogs/vocab.yml) carrying `default_application`. The press opens
// Applications beside the leads, places the entry in that file's unsaved text, and then sets the
// lead applied through the same feed write the lead's own status controls make, so both writes
// are in the change log with their undo. The Leads view calls this; nothing here draws.

import { ISO_DATE } from '../../data/helpers/dates.ts';
import { readAs, textOrNumberShape } from '../../data/shapes/shapes.ts';
import { wordsWith } from '../../data/shapes/vocab-keys.ts';
import type { LeadEntry } from './leads.ts';

/** The feed a lead is written through, the key the feed writes name it by. */
export const LEADS_FEED = 'leads';

/** The collection the lead is turned into an entry of, config/sources.yml's key. */
export const APPLICATIONS = 'applications';

/** One field of a lead as text, or the empty string for a field the lead does not hold. */
function text(entry: LeadEntry, field: string): string {
    return (readAs(textOrNumberShape, entry[field]) ?? '').trim();
}

/**
 * The Applications fields a lead fills, by field name. A field the lead lacks, a deadline that is
 * not a date, and a status no word of the config carries the flag for, is left out, so the entry
 * places that field as it would for any new entry.
 */
export function applicationFromLead(
    entry: LeadEntry,
    config: Record<string, unknown>
): Record<string, string> {
    const fields: Record<string, string> = {
        title: text(entry, 'title'),
        sub: text(entry, 'inst'),
        url: text(entry, 'url'),
        deadline: text(entry, 'deadline'),
        status: wordsWith(config, 'statuses', 'default_application').at(0) ?? ''
    };
    return Object.fromEntries(
        Object.entries(fields).filter(
            ([field, value]) => value !== '' && (field !== 'deadline' || ISO_DATE.test(value))
        )
    );
}
