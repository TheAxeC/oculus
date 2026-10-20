// Layer 2, server. GET and POST /api/commands. A route module may export only its verbs, so
// everything the request does is here and src/routes/api/commands/+server.ts is the lines that join
// them.
//
// A GET lists a repository's commands and the findings of the sources that did not read. A POST
// approves the chain a run asked about, or writes the command form into the repository's
// `.oculus/commands.yml` (write.ts): `save` adds an entry at the end of its list, `edit` rewrites
// the plain entry named `was` in its place, `remove` takes one out. A save, and an edit that gives
// the entry a new name, is refused for a name another entry of the file or a command found in the
// repository already holds. A save or an edit approves, in the approvals file, the chain the entry
// will run as the written file lists it, so the reader's own command runs without a question and a
// later change of its text, by hand or by a pull, asks again; the approval is written first, so a
// file that holds the entry always holds an approved one. The GET and the POST both name a
// repository, and a `repo` that is relative, does not exist or lies under no root the file browser
// serves is refused with 400 before any file under it is read. The POST carries the write token
// and runs behind the process's write chain, and every write of the file is recorded in the change
// log. Nothing here starts a process: a run is the terminal route's `command` action.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { json } from '@sveltejs/kit';
import { z } from 'zod';
import { tokenedBody } from '../../../core/auth.ts';
import { logChanges, type ChangeLog } from '../../../core/changes.ts';
import { chained, type FsWrites } from '../../../core/json.ts';
import { textCatalog } from '../../../../data/sources/config.ts';
import { TEMPLATES_PAGE, fileText } from '../../../../data/sources/documents/templates.ts';
import { resolveChain } from '../../../../data/helpers/run/chain.ts';
import { words } from '../../../core/words.ts';
import { approveTexts, chainLines, chainText } from '../../approvals/approvals.ts';
import { checkEntry, commandsFile, entryShape, type Entry } from './files.ts';
import { listAll, listCommands, listWithText, type CommandTasks } from './list.ts';
import { repositoryOf } from './repo.ts';
import { commitCommands, planCommand, type CommandChange, type CommandRefusal } from './write.ts';

/** What the routes need of the process: the roots, the approvals file, the chain and the log. */
export type CommandsOptions = {
    /** The directories the file browser serves, from which a repository is taken. */
    rootsFor: () => string[];
    /** The approvals file. */
    approvalsFor: () => string;
    /** The merged config, whose text catalog words a refusal. */
    configFor: () => Record<string, unknown>;
    /** Oculus's own folder, whose docs/templates.md holds the template of a new commands file. */
    engineFor: () => string;
    /** The write chain the approvals and the commands files are written behind. */
    writes: FsWrites;
    /** The change log a write of a commands file is recorded in. */
    changes?: ChangeLog;
    /** The apps, whose tasks are listed with the commands. */
    tasks?: CommandTasks;
};

const NO_STORE = { 'cache-control': 'no-store' };

/** The change log's kind for a write of a commands file. */
const KIND = 'commands';

/** The body of a POST: one of the four actions. */
const bodyShape = z.discriminatedUnion('action', [
    z.object({
        action: z.literal('approve'),
        repo: z.unknown(),
        chain: z.array(z.object({ folder: z.string(), run: z.string() })).min(1)
    }),
    z.object({ action: z.literal('save'), repo: z.unknown(), command: entryShape }),
    z.object({
        action: z.literal('edit'),
        repo: z.unknown(),
        was: z.string().min(1),
        command: entryShape
    }),
    z.object({ action: z.literal('remove'), repo: z.unknown(), name: z.string().min(1) })
]);

function refuse(error: string, status = 400): Response {
    return json({ error }, { status, headers: NO_STORE });
}

/**
 * The sentence that refuses a name, or null: a name another entry of the repository's file or a
 * command found in it holds. `was` is the name of the entry an edit rewrites, which may keep it.
 */
function nameRefusal(
    repo: string,
    entry: Entry,
    was: string | null,
    catalog: Record<string, string>
): string | null {
    const held = listCommands(repo).commands.find(
        (one) => one.name === entry.name && !(one.source === 'file' && one.name === was)
    );
    if (held === undefined) return null;
    return held.source === 'file'
        ? words(catalog, 'server.commands.held_file', entry.name)
        : words(catalog, 'server.commands.held_found', entry.name);
}

/** The template of a new commands file, null when the templates page cannot be read. */
function templateOf(engine: string): string | null {
    try {
        return fileText(readFileSync(join(engine, TEMPLATES_PAGE), 'utf8'), 'commands.yml');
    } catch {
        return null;
    }
}

/** What a write of the file answered: the entry before and after, or the refusal and its status. */
type Written =
    { ok: true; before: unknown; after: unknown } | { ok: false; error: string; status: number };

/** A refused write in the catalog's words, with the status it answers: each refusal by its key. */
function refusedWrite(
    catalog: Record<string, string>,
    refusal: CommandRefusal,
    names: string[]
): Written {
    switch (refusal) {
        case 'unread':
            return {
                ok: false,
                error: words(catalog, 'server.commands.unread', ...names),
                status: 409
            };
        case 'unwritable':
            return {
                ok: false,
                error: words(catalog, 'server.commands.unwritable', ...names),
                status: 409
            };
        case 'not-held':
            return {
                ok: false,
                error: words(catalog, 'server.commands.not-held', ...names),
                status: 404
            };
        case 'no-template':
            return {
                ok: false,
                error: words(catalog, 'server.commands.no-template', ...names),
                status: 500
            };
    }
}

/**
 * Plan the change, approve the chain of an added or edited entry as the planned text lists it,
 * then write the text. A chain that does not resolve (a dependency no command holds) approves
 * nothing, since a press of it is refused before it would ask.
 */
function writeChange(
    repo: string,
    change: CommandChange,
    options: CommandsOptions,
    catalog: Record<string, string>
): Written {
    const plan = planCommand(repo, change, templateOf(options.engineFor()));
    if (!plan.ok) return refusedWrite(catalog, plan.refusal, plan.names);
    if (change.action !== 'delete') {
        const listed = listWithText(repo, plan.text).commands;
        const chain = resolveChain(listed, change.entry.name, 'file');
        if ('chain' in chain) {
            const text = chainText(repo, chainLines(repo, chain.chain));
            const approved = approveTexts(options.approvalsFor(), [text]);
            if (!approved.ok) return { ok: false, error: approved.error, status: 409 };
        }
    }
    const written = commitCommands(repo, plan.text);
    if (!written.ok) {
        return {
            ok: false,
            error: words(
                catalog,
                'server.commands.write_failed',
                commandsFile(repo),
                written.reason
            ),
            status: 409
        };
    }
    return { ok: true, before: plan.before, after: plan.after };
}

/** GET /api/commands?repo=<absolute path>: the commands and the findings. */
export async function handleCommandsGet(
    request: Request,
    options: CommandsOptions
): Promise<Response> {
    const asked = new URL(request.url).searchParams.getAll('repo');
    if (asked.length !== 1) return refuse('repo must be given once');
    const found = repositoryOf(asked[0], options.rootsFor());
    if ('error' in found) return refuse(found.error);
    return json(await listAll(found.repo, options.tasks), { headers: NO_STORE });
}

/** The change a write action asks for, or the sentence that refuses its entry. */
function changeOf(
    repo: string,
    action: Exclude<z.infer<typeof bodyShape>, { action: 'approve' }>,
    catalog: Record<string, string>
): CommandChange | string {
    if (action.action === 'remove') return { action: 'delete', name: action.name };
    const checked = checkEntry(repo, action.command);
    if ('problems' in checked) {
        return checked.problems.map((one) => `${one.field} ${one.message}`).join('; ');
    }
    const was = action.action === 'edit' ? action.was : null;
    const named = nameRefusal(repo, checked.entry, was, catalog);
    if (named !== null) return named;
    return was === null
        ? { action: 'add', entry: checked.entry }
        : { action: 'edit', was, entry: checked.entry };
}

/** POST /api/commands: approve, save, edit or remove. */
export async function handleCommandsPost(
    request: Request,
    token: string,
    options: CommandsOptions
): Promise<Response> {
    const catalog = textCatalog(options.configFor());
    const read = await tokenedBody(request, token, { headers: NO_STORE, text: () => catalog });
    if (read instanceof Response) return read;
    const body = bodyShape.safeParse(read.body);
    if (!body.success) {
        return refuse(
            'action must be approve, save, edit or remove, with the fields that action takes'
        );
    }
    const found = repositoryOf(body.data.repo, options.rootsFor());
    if ('error' in found) return refuse(found.error);
    const repo = found.repo;
    const action = body.data;
    if (action.action === 'approve') {
        const text = chainText(repo, action.chain);
        const done = await chained(options.writes, () =>
            approveTexts(options.approvalsFor(), [text])
        );
        return done.ok ? json({ ok: true }, { headers: NO_STORE }) : refuse(done.error, 409);
    }
    const done = await chained(options.writes, () => {
        const change = changeOf(repo, action, catalog);
        if (typeof change === 'string') return { ok: false as const, error: change, status: 400 };
        return { ...writeChange(repo, change, options, catalog), change };
    });
    if (!done.ok) return refuse(done.error, done.status);
    const name = done.change.action === 'delete' ? done.change.name : done.change.entry.name;
    await logChanges(options.changes, KIND, [
        {
            file: commandsFile(repo),
            key: repo,
            field: name,
            before: done.before,
            after: done.after,
            undo: 'none'
        }
    ]);
    return json({ ok: true }, { headers: NO_STORE });
}
