// Layer 2, client state. Which entry forms a view instance has open: the form that adds an entry,
// and the one entry whose edit form is open.
//
// It is instance state, read out of the record of each collection view that uses this parser, so a
// form open when the tab was switched away from, or when the page was reloaded, is open again with
// what was typed into it.

/** The open forms of one instance: whether the add form is open, and the entry edited or ''. */
export type OpenForms = { adding: boolean; editing: string };

/**
 * The open forms a saved record names, and none for a record that names none or names them wrongly.
 */
export function parseOpenForms(raw: unknown): OpenForms {
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
        return { adding: false, editing: '' };
    }
    const held = raw as Record<string, unknown>;
    return {
        adding: held.adding === true,
        editing: typeof held.editing === 'string' ? held.editing : ''
    };
}
