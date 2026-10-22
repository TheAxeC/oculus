// Layer 3, shared view helper. The one control the tasks collection's cards carry besides the
// shared ones: Start Agent, which opens the composer seeded with the task. The collection view
// (views/boards/collection/Collection.svelte) and the entry page (views/boards/entry/Entry.svelte)
// both draw a card with it, which is why the file is under views/shared/. It is offered on an entry
// the focus board's ticker would list, so a task whose status carries `closes_deadline` or whose
// deadline is met has none, and on no other collection's card.

import type { TaskRef } from '$lib/state/sessions/terminals.svelte';
import { entryStatus, type Entry } from '$lib/state/boards/collection';
import { closesDeadline, deadlineMet } from '$lib/state/boards/focus';
import { t } from '$lib/state/shared/words/text';
import type { CardAction } from '../../card/CardActions.svelte';

/** The collection whose entries are tasks. */
const TASKS = 'tasks';

/**
 * The extra controls of one entry's card: Start Agent for a task the ticker lists, calling `start`
 * with the task's reference, and none for any other entry or collection.
 */
export function taskCardActions(
    collection: string,
    entry: Entry,
    config: Record<string, unknown>,
    start: (task: TaskRef) => void
): CardAction[] {
    if (collection !== TASKS) return [];
    const status = entryStatus(entry) ?? '';
    if (closesDeadline(config, status) || deadlineMet(config, status)) return [];
    return [
        {
            id: 'agent',
            label: t('collection.start_agent'),
            title: t('collection.start_agent_tip'),
            glyph: 'terminal_claude',
            onclick: () => {
                start({ id: entry.id, collection: TASKS });
            }
        }
    ];
}
