// Layer 1, data. The two lists of dated work a manifest or a collection entry holds: its
// `followup:` notes and its `subtasks:` checklist. They are read here, in one place, because a
// research project's manifest, a side project's manifest (normalise-personal.ts) and a collection
// entry (normalise.ts) all write them in the same shapes, so one reading serves all three and two
// readers cannot disagree about what a note or a line is.

import { z } from 'zod';
import { compact } from './compact.ts';
import type { Followup, Subtask } from '../model/index.ts';
import {
    keyedRowsShape,
    listOrOneShape,
    optionalTextShape,
    readAs,
    readOr
} from '../shapes/shapes.ts';

/** One note of a `followup:`: a string, or a map with its `do` and `after`. */
const noteShape = z.union([
    z.string().transform((text) => ({ do: text, after: undefined as string | undefined })),
    z.object({ do: optionalTextShape, after: optionalTextShape })
]);

/**
 * The `followup:` notes of a manifest or of a collection entry. The key holds one note as a string,
 * one as a `{ do, after }` map, or a list of either; all three arrive here as a list. A note with
 * no `do` is dropped in silence, the way str() drops a value of the wrong type.
 */
export function followups(value: unknown): Followup[] {
    const out: Followup[] = [];
    for (const item of readOr(listOrOneShape, value, [])) {
        const note = readAs(noteShape, item);
        if (note?.do === undefined || note.do.trim() === '') continue;
        out.push(compact({ do: note.do, after: note.after }));
    }
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
