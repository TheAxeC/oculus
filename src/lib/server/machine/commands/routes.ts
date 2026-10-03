// Layer 2, server. GET and POST /api/commands. A route module may export only its verbs, so
// everything the request does is here and src/routes/api/commands/+server.ts is the lines that join
// them.
//
// A GET lists a repository's commands and the findings of the sources that did not read. A POST
// approves the chain a run asked about, or saves or removes one command through the form. A save is
// refused for a name the repository's file or the commands found in it already hold. The GET and
// the POST both name a repository, and a `repo` that is relative, does not exist or lies under no
// root the file browser serves is refused with 400 before any file under it is read. The POST
// carries the write token and runs behind the process's write chain; a save or a remove is also
// recorded in the change log. Nothing here starts a process: a run is the terminal route's
// `command` action.

import { json } from '@sveltejs/kit';
import { z } from 'zod';
import { tokenedBody } from '../../core/auth.ts';
import { logChanges, type ChangeLog } from '../../core/changes.ts';
import { chained, type FsWrites } from '../../core/json.ts';
import { textCatalog } from '../../../data/sources/config.ts';
import { words } from '../../core/words.ts';
import { approveTexts, chainText } from '../approvals/approvals.ts';
import { checkEntry, entryShape, type Entry } from './files.ts';
import { listCommands } from './list.ts';
import { repositoryOf } from './repo.ts';
import { removeCommand, saveCommand, savedPath } from './saved.ts';

/** What the routes need of the process: the roots, the approvals file, the chain and the log. */
export type CommandsOptions = {
    /** The directories the file browser serves, from which a repository is taken. */
    rootsFor: () => string[];
    /** The approvals file. */
    approvalsFor: () => string;
    /** The merged config, whose text catalog words a refusal. */
    configFor: () => Record<string, unknown>;
    /** The write chain the approvals and the saved commands are written behind. */
    writes: FsWrites;
    /** The change log a save or a remove is recorded in. */
    changes?: ChangeLog;
};

const NO_STORE = { 'cache-control': 'no-store' };

/** The change log's kind for a save or a remove of a command. */
const KIND = 'commands';

/** The body of a POST: one of the three actions. */
const bodyShape = z.discriminatedUnion('action', [
    z.object({
        action: z.literal('approve'),
        repo: z.unknown(),
        chain: z.array(z.object({ folder: z.string(), run: z.string() })).min(1)
    }),
    z.object({ action: z.literal('save'), repo: z.unknown(), command: entryShape }),
    z.object({ action: z.literal('remove'), repo: z.unknown(), name: z.string().min(1) })
]);

function refuse(error: string, status = 400): Response {
    return json({ error }, { status, headers: NO_STORE });
}

/**
 * The sentence that refuses a save, or null: a name the repository's file or the commands found in
 * it hold, which a saved command of that name would sit beside under the same name.
 */
function saveRefusal(repo: string, entry: Entry, catalog: Record<string, string>): string | null {
    const held = listCommands(repo).commands.find(
        (one) => one.name === entry.name && one.source !== 'saved'
    );
    if (held === undefined) return null;
    return held.source === 'file'
        ? words(catalog, 'server.commands.held_file', entry.name)
        : words(catalog, 'server.commands.held_found', entry.name);
}

/** GET /api/commands?repo=<absolute path>: the commands and the findings. */
export function handleCommandsGet(request: Request, options: CommandsOptions): Response {
    const asked = new URL(request.url).searchParams.getAll('repo');
    if (asked.length !== 1) return refuse('repo must be given once');
    const found = repositoryOf(asked[0], options.rootsFor());
    if ('error' in found) return refuse(found.error);
    return json(listCommands(found.repo), { headers: NO_STORE });
}

/** POST /api/commands: approve, save or remove. */
export async function handleCommandsPost(
    request: Request,
    token: string,
    options: CommandsOptions
): Promise<Response> {
    const read = await tokenedBody(request, token, { headers: NO_STORE });
    if (read instanceof Response) return read;
    const body = bodyShape.safeParse(read.body);
    if (!body.success) {
        return refuse('action must be approve, save or remove, with the fields that action takes');
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
    if (action.action === 'save') {
        const checked = checkEntry(repo, action.command);
        if ('problems' in checked) {
            const said = checked.problems.map((one) => `${one.field} ${one.message}`).join('; ');
            return refuse(said);
        }
        const refusal = saveRefusal(repo, checked.entry, textCatalog(options.configFor()));
        if (refusal !== null) return refuse(refusal);
        const done = await chained(options.writes, () =>
            saveCommand(savedPath(), repo, checked.entry)
        );
        if (!done.ok) return refuse(done.error, 409);
        await logChanges(options.changes, KIND, [
            {
                file: savedPath(),
                key: repo,
                field: checked.entry.name,
                before: done.change.before,
                after: done.change.after,
                undo: 'none'
            }
        ]);
        return json({ ok: true }, { headers: NO_STORE });
    }
    const done = await chained(options.writes, () => removeCommand(savedPath(), repo, action.name));
    if (!done.ok) return refuse(done.error, done.missing === true ? 404 : 409);
    await logChanges(options.changes, KIND, [
        {
            file: savedPath(),
            key: repo,
            field: action.name,
            before: done.change.before,
            after: null,
            undo: 'none'
        }
    ]);
    return json({ ok: true }, { headers: NO_STORE });
}
