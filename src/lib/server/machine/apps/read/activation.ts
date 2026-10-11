// Layer 2, server. The activation events an app's manifest may name for its host, and the grammar
// they are written in. The manifest reader refuses an event this does not parse; the host manager
// compares the events of an app with the event a trigger raised.
//
// An event is one of `onTab`, `onStartupFinished`, `onCommand:<id>`, `onLanguage:<id>`,
// `onView:<id>` or `workspaceContains:<glob>`. An id is text with no white space. A glob is
// relative to a root: it holds no `..` segment and does not start with `/`, so it can name nothing
// outside the root it is matched in.

/** One activation event, parsed. */
export type ActivationEvent =
    | { kind: 'onTab' }
    | { kind: 'onStartupFinished' }
    | { kind: 'onCommand' | 'onLanguage' | 'onView'; id: string }
    | { kind: 'workspaceContains'; glob: string };

/** The event an app has when its manifest names none. */
export const DEFAULT_ACTIVATION = 'onTab';

/** The kinds that carry a value after a colon, and what the value is. */
const VALUED = ['onCommand', 'onLanguage', 'onView', 'workspaceContains'] as const;

/** Why an event was refused. */
export type EventFlaw = 'unknown' | 'empty' | 'glob';

/** Whether a glob names only a path below the root it is matched in. */
function globInside(glob: string): boolean {
    return !glob.startsWith('/') && !glob.split('/').some((segment) => segment === '..');
}

/** The event a text spells, or the flaw that refuses it. */
export function parseEvent(text: string): ActivationEvent | EventFlaw {
    if (text === 'onTab') return { kind: 'onTab' };
    if (text === 'onStartupFinished') return { kind: 'onStartupFinished' };
    const colon = text.indexOf(':');
    const kind = VALUED.find((one) => one === text.slice(0, Math.max(colon, 0)));
    if (kind === undefined || colon < 0) return 'unknown';
    const value = text.slice(colon + 1);
    if (value === '' || (kind !== 'workspaceContains' && /\s/.test(value))) return 'empty';
    if (kind === 'workspaceContains') return globInside(value) ? { kind, glob: value } : 'glob';
    return { kind, id: value };
}

/** Whether an event raised by a trigger is one of the events an app names. */
export function names(events: readonly string[], raised: ActivationEvent): boolean {
    return events.some((text) => {
        const own = parseEvent(text);
        if (typeof own === 'string' || own.kind !== raised.kind) return false;
        if ('id' in own && 'id' in raised) return own.id === raised.id;
        if ('glob' in own && 'glob' in raised) return own.glob === raised.glob;
        return true;
    });
}
