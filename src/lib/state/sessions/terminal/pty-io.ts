// Layer 2, client state. The two requests the terminals store makes of /api/terminal that carry no
// state of their own: an action posted with the write token, answered as ok or as a sentence of the
// catalog, and the busy read that says which terminals run a program other than their shell. Both
// go through `fetch`, which a test replaces.

import { z } from 'zod';
import type { Terminal } from '../../../data/model/index.ts';
import {
    mapShape,
    optionalTextShape,
    readAs,
    readJson,
    rowsShape,
    unchangedAs
} from '../../../data/shapes/shapes.ts';
import { refusedAnswer, unreadableAnswer } from '../../shared/answers/answers.ts';

/** What an action answered: the terminal it names, or what the server refused it with. */
export type TerminalAnswer = {
    ok: boolean;
    /** The terminal the action was about, empty when the server refused before naming one. */
    id: string;
    /** What went wrong in the catalog's words, or the empty string. */
    error: string;
    /** The terminal a start answered, when it did. */
    terminal?: Terminal;
};

/** A terminal running a program other than its shell, and the program; empty when unread. */
export type BusyTerminal = { id: string; name: string; command: string };

/**
 * The terminal a start answered, handed on as it came. Only its id is read here: the store lists
 * the terminal from the `sessions` payload once that names it.
 */
const startedShape = unchangedAs<Terminal>(z.looseObject({ id: z.string() }));

/** What an action answers: the terminal a start made, its id, and a refusal's sentence. */
const actionAnswerShape = z.object({
    id: optionalTextShape,
    terminal: startedShape.optional().catch(undefined),
    error: optionalTextShape
});

/** One terminal of a busy read: the busy ones are named, with the program they run. */
const busyShape = z.object({
    id: z.string(),
    busy: z.boolean().catch(false),
    command: z.string().catch('')
});

const busyItemsShape = rowsShape(busyShape);

/**
 * The `busy` field of a busy read: a list is read item by item, and an absent, null or text value
 * names no terminal. Any other value is no answer.
 */
const busyListShape = z
    .union([
        busyItemsShape,
        z.null().transform((): z.output<typeof busyItemsShape> => []),
        z.string().transform((): z.output<typeof busyItemsShape> => [])
    ])
    .optional();

/** The body of a busy read. */
const busyAnswerShape = z.object({ busy: busyListShape });

/** The action field of a request body, which is how `postTerminal` knows a start from the rest. */
const actionShape = z.object({ action: z.string() });

/**
 * Post one action with the write token. A page rendered on the server has no fetch and posts
 * nothing. A refusal is told in the catalog's sentence for it (state/shared/answers/answers.ts),
 * never in the server's own text. An answer at 200 is ok whatever it names, except for a start: a
 * terminal started with no id is one the page cannot attach to, so a start whose answer names no
 * terminal with an id is a failed start.
 */
export async function postTerminal(body: unknown, token: string): Promise<TerminalAnswer> {
    if (typeof fetch !== 'function') return { ok: false, id: '', error: '' };
    try {
        const response = await fetch('/api/terminal', {
            method: 'POST',
            headers: { 'content-type': 'application/json', 'x-oculus-token': token },
            body: JSON.stringify(body)
        });
        const raw = await readJson(response);
        if (raw === undefined)
            return { ok: false, id: '', error: unreadableAnswer(response.status) };
        const answer = readAs(actionAnswerShape, raw);
        if (!response.ok) {
            return { ok: false, id: '', error: refusedAnswer(response.status, answer?.error) };
        }
        const starting = readAs(actionShape, body)?.action === 'start';
        if (starting && (answer?.terminal?.id ?? '') === '') {
            return { ok: false, id: '', error: unreadableAnswer(response.status) };
        }
        return {
            ok: true,
            id: answer?.terminal?.id ?? answer?.id ?? '',
            error: '',
            terminal: answer?.terminal
        };
    } catch (error) {
        return { ok: false, id: '', error: error instanceof Error ? error.message : String(error) };
    }
}

/** The most ids one busy read names; the server refuses more. */
const BUSY_READ = 64;

/**
 * Which of these terminals run a program other than their shell, from a fresh read of the server,
 * in groups of at most BUSY_READ ids. A group whose read fails names every terminal of it with no
 * program, so a close asks.
 */
export async function readBusy(
    ids: string[],
    labelOf: (id: string) => string
): Promise<BusyTerminal[]> {
    const found: BusyTerminal[] = [];
    for (let at = 0; at < ids.length; at += BUSY_READ) {
        const group = ids.slice(at, at + BUSY_READ);
        try {
            const response = await fetch(`/api/terminal?busy=${group.join(',')}`);
            if (!response.ok) throw new Error(refusedAnswer(response.status));
            const raw = await readJson(response);
            if (raw === undefined) throw new Error(unreadableAnswer(response.status));
            // A body that is no map names no terminal; a map whose `busy` is no list is no answer.
            const body = readAs(mapShape, raw);
            if (body === null) continue;
            const answer = readAs(busyAnswerShape, body);
            if (answer === null) throw new Error(unreadableAnswer(response.status));
            for (const one of answer.busy ?? []) {
                if (!one.busy) continue;
                found.push({ id: one.id, name: labelOf(one.id), command: one.command });
            }
        } catch {
            for (const id of group) found.push({ id, name: labelOf(id), command: '' });
        }
    }
    return found;
}
