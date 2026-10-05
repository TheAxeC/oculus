// Layer 2, client state. The requests the terminals store and the LaTeX store make of /api/terminal
// that carry no state of their own: an action posted with the write token, answered as ok or as a
// sentence of the catalog, the busy read that says which terminals run a program other than their
// shell, and the list read that says which terminals the server holds now. All go through `fetch`,
// which a test replaces.

import { z } from 'zod';
import type { ChainLine, Terminal } from '../../../../data/model/index.ts';
import {
    mapShape,
    optionalTextShape,
    readAs,
    readJson,
    rowsShape,
    unchangedAs
} from '../../../../data/shapes/shapes.ts';
import { refusedAnswer, unreadableAnswer } from '../../../shared/answers/answers.ts';

/** The geometry a terminal is started at when the pane has not been measured yet. */
export const COLS = 80;
export const ROWS = 24;

/** What an action answered: the terminal it names, or what the server refused it with. */
export type TerminalAnswer = {
    ok: boolean;
    /** The terminal the action was about, empty when the server refused before naming one. */
    id: string;
    /** What went wrong in the catalog's words, or the empty string. */
    error: string;
    /** The word the server refused with, when it refused with one. */
    refused?: string;
    /** The terminal a start answered, when it did. */
    terminal?: Terminal;
    /** The lines of the chain a project command run asked to have approved before it starts. */
    approve?: ChainLine[];
    /** The seed, folder and agent a composer start with a task asked to have approved first. */
    seedApproval?: SeedApproval;
    /** The seed, folder and terminal name the server built for a task. */
    seeded?: SeededTask;
    /** All the text of the pane a capture read. */
    output?: string;
    /** The process a Restart asked to have confirmed before it stops it. */
    confirm?: string;
};

/** What a start with a task asks the reader to approve: the seed, the folder and the agent. */
export type SeedApproval = { seed: string; cwd: string; agent: string };

/** What the server built for a task: the seed to show, the folder to start in, the name. */
type SeededTask = { seed: string; cwd: string; name: string };

/** A terminal running a program other than its shell, and the program; empty when unread. */
export type BusyTerminal = { id: string; name: string; command: string };

/**
 * The terminal a start answered, handed on as it came. Only its id is read here: the store lists
 * the terminal from the `sessions` payload once that names it.
 */
const startedShape = unchangedAs<Terminal>(z.looseObject({ id: z.string() }));

/** One line of a chain to approve: its folder, relative to the repository, and the line. */
const chainLineShape = z.object({ folder: z.string(), run: z.string() });

/** The approval a composer start with a task asks for, as the server answers it under `approve`. */
const seedApprovalShape = z.object({ seed: z.string(), cwd: z.string(), agent: z.string() });

/** What an action answers: the terminal a start made, its id, and a refusal's word and names. */
const actionAnswerShape = z.object({
    id: optionalTextShape,
    terminal: startedShape.optional().catch(undefined),
    error: optionalTextShape,
    names: z.array(z.string()).optional().catch(undefined),
    approve: z
        .union([z.array(chainLineShape), seedApprovalShape])
        .optional()
        .catch(undefined),
    seed: z.string().optional().catch(undefined),
    cwd: z.string().optional().catch(undefined),
    name: z.string().optional().catch(undefined),
    output: z.string().optional().catch(undefined),
    confirm: z.string().optional().catch(undefined)
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

/** A terminal of a list read: its id, and the exit status of a task line that ended, else null. */
export type ListedTerminal = { id: string; exit: number | null };

/** The body of a list read: each row that names a terminal by its id, a malformed row none. */
const listAnswerShape = z.object({
    terminals: rowsShape(z.object({ id: z.string(), exit: z.number().nullable().catch(null) }))
});

/** The action field of a request body, which is how `postTerminal` knows a start from the rest. */
const actionShape = z.object({ action: z.string() });

/**
 * Post one action with the write token. A page rendered on the server has no fetch and posts
 * nothing. A refusal is told in the catalog's sentence for its word, with the names the answer
 * carried (state/shared/answers/answers.ts), never in the server's own text. An answer at 200 is ok
 * whatever it names, except for a start: a terminal started with no id is one the page cannot
 * attach to, so a start whose answer names no terminal with an id is a failed start.
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
        const action = readAs(actionShape, body)?.action ?? '';
        if (!response.ok) {
            return {
                ok: false,
                id: '',
                error: refusedAnswer(response.status, answer?.error, answer?.names),
                ...(answer?.error === undefined ? {} : { refused: answer.error })
            };
        }
        const starting = action === 'start';
        if (starting && (answer?.terminal?.id ?? '') === '') {
            return { ok: false, id: '', error: unreadableAnswer(response.status) };
        }
        const approve = answer?.approve;
        const seeded =
            answer?.seed === undefined || answer.cwd === undefined || answer.name === undefined
                ? undefined
                : { seed: answer.seed, cwd: answer.cwd, name: answer.name };
        return {
            ok: true,
            id: answer?.terminal?.id ?? answer?.id ?? '',
            error: '',
            terminal: answer?.terminal,
            ...(approve === undefined || !Array.isArray(approve) ? {} : { approve }),
            ...(approve === undefined || Array.isArray(approve) ? {} : { seedApproval: approve }),
            ...(seeded === undefined ? {} : { seeded }),
            ...(answer?.confirm === undefined ? {} : { confirm: answer.confirm }),
            ...(answer?.output === undefined ? {} : { output: answer.output })
        };
    } catch (error) {
        return { ok: false, id: '', error: error instanceof Error ? error.message : String(error) };
    }
}

/**
 * Every terminal oculus owns with the exit status of its task line, from a fresh read of the
 * server, or null when there is no fetch, the read failed or its answer could not be read.
 */
export async function readListed(): Promise<ListedTerminal[] | null> {
    if (typeof fetch !== 'function') return null;
    try {
        const response = await fetch('/api/terminal');
        if (!response.ok) return null;
        const answer = readAs(listAnswerShape, await readJson(response));
        return answer === null ? null : answer.terminals;
    } catch {
        return null;
    }
}

/** The most ids one busy read names; the server refuses more. */
const BUSY_READ = 64;

/**
 * Which of these terminals run a program other than their shell, from a fresh read of the server,
 * in groups of at most BUSY_READ ids. A terminal `always` names is listed whatever the server says
 * of its program, with the program the server read. A group whose read fails names every terminal
 * of it with no program, so a close asks.
 */
export async function readBusy(
    ids: string[],
    labelOf: (id: string) => string,
    always: (id: string) => boolean = () => false
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
                if (!one.busy && !always(one.id)) continue;
                found.push({ id: one.id, name: labelOf(one.id), command: one.command });
            }
        } catch {
            for (const id of group) found.push({ id, name: labelOf(id), command: '' });
        }
    }
    return found;
}
