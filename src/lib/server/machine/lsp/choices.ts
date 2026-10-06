// Layer 2, server. The choices file of the language servers, `<lsp folder>/choices.json`: for each
// repository, keyed by its real path, the interpreter and the compile database its reader chose.
// It is this machine's own state, as the approvals file is, and it lives under the `lsp` key of
// local.yml beside the folders clangd's index is written into.
//
// The file is `{ "version": 1, "repositories": { "<real path>": { "interpreter"?, "database"? } }
// }`. It is written whole by a rename. A file that is not JSON, or not that shape, reads as holding
// no choices, and a write over it is refused with the reason and leaves it as it was, so the
// bytes the reader put there are never replaced. Every write that changed a choice is recorded in
// the change log as the other machine-local writes are. The flows of the page's `choices`, `choose`
// and `approve` messages are here too, over the registry's adapters (servers.ts).

import { homedir } from 'node:os';
import { join } from 'node:path';
import { z } from 'zod';
import type { LspRefusal, LspToPage, LspToServer } from '../../../data/model/index.ts';
import { logChanges, type ChangeLog } from '../../core/changes.ts';
import { readJsonChecked, writeTextAtomic } from '../../core/json.ts';
import type { Held } from './held.ts';
import type { Adapter, Choice, RootEnv } from './servers.ts';

const choiceShape = z.object({
    interpreter: z.string().optional(),
    database: z.string().optional()
});

const fileShape = z.object({
    version: z.literal(1),
    repositories: z.record(z.string(), choiceShape)
});

type ChoicesFile = z.infer<typeof fileShape>;

/** The change log's kind for a choice. */
const KIND = 'lsp';

/** The mode of the file: it names this machine's own folders and programs. */
const MODE = 0o600;

/** ~/.oculus/lsp, the folder the `lsp` key names when it is not set, resolved at the call. */
export function defaultLspPath(): string {
    return join(homedir(), '.oculus', 'lsp');
}

/** The choices file in the lsp folder. */
function choicesPath(lspFolder: string): string {
    return join(lspFolder, 'choices.json');
}

type Loaded = { ok: true; file: ChoicesFile } | { ok: false };

/** The file as it stands: empty when it is not there, not ok when it does not read. */
function load(path: string): Loaded {
    const read = readJsonChecked(path);
    if (!read.ok) return { ok: false };
    if (read.value === undefined) return { ok: true, file: { version: 1, repositories: {} } };
    const parsed = fileShape.safeParse(read.value);
    return parsed.success ? { ok: true, file: parsed.data } : { ok: false };
}

/** What the reader chose for a repository: nothing for a file that is absent or does not read. */
export function chosenFor(lspFolder: string, repo: string): Choice {
    const loaded = load(choicesPath(lspFolder));
    return loaded.ok ? (loaded.file.repositories[repo] ?? {}) : {};
}

/** What a write answers: done, or the refusal's code with the file left as it was. */
type ChoiceWrite = { ok: true } | { ok: false; code: LspRefusal };

/**
 * Record a choice for a repository. A file that does not read is refused with `choices_unread`
 * and left as it is; a file or folder that cannot be written is refused with `choices_write`.
 * The write is one entry in the change log.
 */
async function choose(
    lspFolder: string,
    repo: string,
    choice: Choice,
    log?: ChangeLog
): Promise<ChoiceWrite> {
    const path = choicesPath(lspFolder);
    const loaded = load(path);
    if (!loaded.ok) return { ok: false, code: 'choices_unread' };
    const before = loaded.file.repositories[repo] ?? {};
    const after = { ...before, ...choice };
    const next: ChoicesFile = {
        version: 1,
        repositories: { ...loaded.file.repositories, [repo]: after }
    };
    try {
        writeTextAtomic(path, `${JSON.stringify(next, null, 2)}\n`, MODE);
    } catch {
        return { ok: false, code: 'choices_write' };
    }
    await logChanges(log, KIND, [
        { file: path, key: repo, field: Object.keys(choice).join(','), before, after, undo: 'none' }
    ]);
    return { ok: true };
}

/** Where the choice flows send what they answer: the one channel the message came on. */
export type Send = (payload: LspToPage) => void;

/** The interpreters or the compile databases of a root, as the picker lists them. */
export async function sendChoices(
    adapter: Adapter,
    env: RootEnv,
    root: string,
    send: Send
): Promise<void> {
    send({ oculus: 'choices', root, ...(await adapter.choices(env)) });
}

/** What a running server is given changed: it is told its settings changed and asks again. */
async function reconfigure(adapter: Adapter, env: RootEnv, held: Held | undefined): Promise<void> {
    const setup = held?.setup;
    if (held === undefined || !setup) return;
    held.update(await adapter.settings(env, setup));
    held.notify({
        jsonrpc: '2.0',
        method: 'workspace/didChangeConfiguration',
        params: { settings: null }
    });
}

/** The reader chose an interpreter or a database: written, then put to work. */
export async function applyChoose(
    adapter: Adapter,
    env: RootEnv,
    message: Extract<LspToServer, { oculus: 'choose' }>,
    held: Held | undefined,
    log: ChangeLog | undefined,
    send: Send
): Promise<void> {
    const picked = await adapter.choose(env, message);
    if (picked.note !== undefined) held?.note(picked.note);
    if (Object.keys(picked.choice).length > 0) {
        const written = await choose(env.lsp, env.root, picked.choice, log);
        if (!written.ok) {
            send({ oculus: 'refused', root: message.root, code: written.code });
            return;
        }
        if (picked.apply === 'restart') await held?.restart();
        else await reconfigure(adapter, env, held);
    }
    await sendChoices(adapter, env, message.root, send);
}

/** The reader approved the repository's interpreter. */
export async function applyApprove(
    adapter: Adapter,
    env: RootEnv,
    message: Extract<LspToServer, { oculus: 'approve' }>,
    held: Held | undefined,
    send: Send
): Promise<void> {
    const done = await adapter.approve(env, message);
    if (!done.ok) {
        send({ oculus: 'refused', root: message.root, code: 'choices_write' });
        return;
    }
    if (done.changed) await reconfigure(adapter, env, held);
    await sendChoices(adapter, env, message.root, send);
}
