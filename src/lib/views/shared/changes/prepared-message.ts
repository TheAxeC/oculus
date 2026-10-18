// Layer 3, view partial. What the commit box does with the message git prepared for a merge or a
// cherry pick in progress (`preparedMessage` of state/sources/repositories/repositories.ts): it
// puts the message in an empty field, and a new prepared message replaces the one offered before
// while the field still holds that one. When the operation ends and the field still holds the text
// that was offered, the field is emptied again. A message the reader typed or changed stays.

/** The text to put in the field, or null to leave it, and the message offered from then on. */
export type Followed = { put: string | null; offered: string };

/**
 * Follow git's prepared message: `prepared` is the message now (empty when no operation is in
 * progress), `offered` the one put in the field before (empty for none) and `held` the field's
 * text.
 */
export function followPrepared(prepared: string, offered: string, held: string): Followed {
    if (prepared === '')
        return { put: offered !== '' && held === offered ? '' : null, offered: '' };
    if (prepared === offered) return { put: null, offered };
    const replaces = held.trim() === '' || (offered !== '' && held === offered);
    return { put: replaces ? prepared : null, offered: prepared };
}
