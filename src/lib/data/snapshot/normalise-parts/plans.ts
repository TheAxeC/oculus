// Layer 1, data. The two lists of dated work a manifest or a collection entry holds: its
// `followup:` notes and its `subtasks:` checklist. They are read here, in one place, because a
// project's manifest and a collection entry (normalise.ts) write them in the same shapes, so one
// reading serves both and two readers cannot disagree about what a note or a line is.

import { z } from 'zod';
import { compact } from '../compact.ts';
import type { Followup, Subtask } from '../../model/index.ts';
import {
    itemsShape,
    keyedRowsShape,
    optionalTextShape,
    readAs,
    readOr
} from '../../shapes/shapes.ts';

/** One note of a `followup:` list: a map with its `do` and its `after`. */
const noteShape = z.object({ do: optionalTextShape, after: optionalTextShape });

/**
 * The `followup:` notes of a manifest or of a collection entry: a list of `{ do, after }` maps, as
 * the follow-up writes leave it. The key a note is addressed by is its position in the list, so a
 * write knows which note it means. A value that is not a list holds no notes (validate.ts and
 * hub.ts report it), and an item that is not such a map or has no `do` is dropped in silence, the
 * way str() drops a value of the wrong type.
 */
export function followups(value: unknown): Followup[] {
    const out: Followup[] = [];
    readOr(itemsShape, value, []).forEach((item, at) => {
        const note = readAs(noteShape, item);
        if (note?.do === undefined || note.do.trim() === '') return;
        out.push(compact({ key: String(at), do: note.do, after: note.after }));
    });
    return out;
}

/** One line of a `subtasks:` checklist: a string, or a map of its `do`, `deadline` and so on. */
const lineShape = z.union([
    z.string().transform((text) => ({
        do: text,
        deadline: undefined as string | undefined,
        done: false,
        snooze: undefined as string | undefined
    })),
    z.object({
        do: optionalTextShape,
        deadline: optionalTextShape,
        done: z.boolean().catch(false),
        snooze: optionalTextShape
    })
]);

/**
 * The `subtasks:` checklist of a manifest or of a collection entry. The key holds a map of key to
 * line or a list of lines, and a line is a string or a `{ do, deadline, done, snooze }` map. The
 * key a line is addressed by is the map's own key, or the position for a list, so a write knows
 * which line it means whatever shape the file is written in.
 */
export function subtasks(value: unknown): Subtask[] {
    const out: Subtask[] = [];
    for (const [key, item] of readOr(keyedRowsShape, value, [])) {
        const line = readAs(lineShape, item);
        if (line?.do === undefined || line.do.trim() === '') continue;
        out.push(
            compact({
                key,
                do: line.do,
                deadline: line.deadline,
                done: line.done,
                snooze: line.snooze
            })
        );
    }
    return out;
}
