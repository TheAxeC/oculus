// Layer 2, client state. The channels whose messages may hold what changed in place of the payload,
// and how the page makes the payload of one: the `sessions` channel, whose payload is large. A
// payload of such a channel that names a `base` is a difference from the message of that version,
// and one that names none is whole. A difference is applied to the payload the page holds, and what
// comes out is the payload the server has, with every record that did not change the object the
// page holds already.

import { z } from 'zod';
import {
    joinSessions,
    placedOf,
    type Message,
    type SessionRecord,
    type SessionsDifference,
    type SessionsPayload
} from '../../../data/model/index.ts';
import { byKey } from '../../../data/helpers/guards.ts';
import { anyNumberShape, readAs, unchangedAs } from '../../../data/shapes/shapes.ts';
import { listShape } from './payloads.ts';

const sessionsDifferenceShape = unchangedAs<SessionsDifference>(
    z.object({
        base: anyNumberShape,
        order: z.array(z.string()),
        records: z.array(z.object({ path: z.string() })),
        placed: listShape.optional(),
        terminals: listShape.optional()
    })
);

/** The payload the difference gives over the held one, or null when a record of it is not held. */
function sessionsOver(
    held: SessionsPayload,
    { order, records: changed, placed, terminals }: SessionsDifference
): SessionsPayload | null {
    const known = new Map(held.records.map((record) => [record.path, record]));
    for (const record of changed) known.set(record.path, record);
    const records: SessionRecord[] = [];
    for (const path of order) {
        const record = known.get(path);
        if (record === undefined) return null;
        records.push(record);
    }
    const workspaces = joinSessions(records, placed ?? placedOf(held.workspaces));
    const listed = terminals ?? held.terminals;
    return listed === undefined
        ? { records, workspaces }
        : { records, workspaces, terminals: listed };
}

/**
 * What a difference comes to: the payload, `malformed` for one that is none of the channel's, or
 * `unheld` for one the page does not hold what it is over.
 */
type Applied = { payload: unknown } | 'malformed' | 'unheld';

/** How the difference of each channel that sends them is applied, by channel. */
const differences: Record<string, (held: Message | null, difference: unknown) => Applied> = {
    sessions: (held, difference) => {
        const read = readAs(sessionsDifferenceShape, difference);
        if (read === null) return 'malformed';
        if (held?.version !== read.base) return 'unheld';
        const payload = sessionsOver(held.payload as SessionsPayload, read);
        return payload === null ? 'unheld' : { payload };
    }
};

/** What a message comes to over the one the page holds, or null for one that is whole. */
export function applied(held: Message | null, message: Message): Applied | null {
    const apply = byKey(differences, message.channel);
    const payload = message.payload as { base?: unknown };
    return apply === undefined || payload.base === undefined ? null : apply(held, payload);
}
