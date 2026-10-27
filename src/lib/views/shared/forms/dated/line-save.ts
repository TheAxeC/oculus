// Layer 3, view helper under views/shared/. What the two dated blocks of a card (Subtasks.svelte
// and Followups.svelte) share about a line's edit: the people fields an edit changed, read in the
// order of the data layer's one list of them (data/shapes/shapes.ts `LINE_PEOPLE`), and the edit
// form's save, which writes the text, the date and each people field that changed, in that order,
// through the block's own writer of the write path (state/client/writes.svelte.ts).

import { LINE_PEOPLE } from '$lib/data/shapes/shapes';
import type { SubtaskTarget, WriteAnswer } from '$lib/state/client/writes.svelte';
import type { LinePeopleFields, LineWriter, PeopleAction } from '$lib/state/shared/stores/shapes';

/**
 * The people fields an edit changed, each with the keys it now holds: a field whose keys differ
 * from the line's, in order or in number, and the empty list for a field cleared.
 */
function changedPeople(
    line: LinePeopleFields,
    picked: LinePeopleFields
): [PeopleAction, string[]][] {
    return LINE_PEOPLE.flatMap((field): [PeopleAction, string[]][] => {
        const had = line[field] ?? [];
        const has = picked[field] ?? [];
        const same = had.length === has.length && had.every((key, at) => key === has[at]);
        return same ? [] : [[field, has]];
    });
}

/** One line as the edit form holds it: its text, its date ('' for none) and its people. */
type HeldLine = { text: string; date: string; people: LinePeopleFields };

/** Which line an edit writes: its host, its key, and the action that sets its date. */
type EditedLine<Text extends string> = { target: SubtaskTarget; key: string; date: Text };

/**
 * The edit form's save: the text, then the date, then each people field, each written only when it
 * changed, every answer handed to `said`, and the writes stopped at the first one refused. True
 * when every write it made was taken. An emptied date clears it, and a people field with no one
 * picked is dropped.
 */
export async function saveLine<Text extends string>(
    write: LineWriter<Text | 'do'>,
    line: EditedLine<Text>,
    held: HeldLine,
    next: HeldLine,
    said: (answer: WriteAnswer) => void
): Promise<boolean> {
    const { target, key } = line;
    const writes: (() => Promise<WriteAnswer>)[] = [];
    if (next.text !== held.text) writes.push(() => write(target, key, 'do', next.text));
    if (next.date !== held.date) writes.push(() => write(target, key, line.date, next.date));
    for (const [field, keys] of changedPeople(held.people, next.people)) {
        writes.push(() => write(target, key, field, keys));
    }
    for (const send of writes) {
        const answer = await send();
        said(answer);
        if (!answer.ok) return false;
    }
    return true;
}
