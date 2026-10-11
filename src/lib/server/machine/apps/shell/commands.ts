// Layer 2, server. Running a command by its id, for a host's `executeCommand` and for the page that
// chose an app's command in Cmd-K.
//
// An id is one of four things. `setContext` sets a context key of the asking host, which must start
// with the host's app name and a dot. An id of the `oculus.` namespace is one of oculus's own
// palette commands: those that change only what a page shows are run by the page that has the
// focus, the others answer `closed`, and any other id answers `missing`. Every other id belongs to
// an approved, enabled app whose name and a dot start it: the app's host runs it through
// `oculus/provide` when it registered a handler, starting the host first when the app declares the
// command, and a command only an open tab of the app registered is run by the page that has the
// focus through that tab. An id no such app owns answers `missing`, and so does the command of an
// app that is unapproved, disabled, removed or changed.

import { oculusCommandKind } from '../../../../data/helpers/files/apps/commands.ts';
import type { ContextValue } from '../../../../data/model/index.ts';
import { Refused } from '../host/connection.ts';
import type { HeldApp } from '../read/held.ts';
import type { AppShell } from './registry.ts';

/** What a command came to: its value, or the word it is refused with. */
export type CommandResult = { ok: true; value: unknown } | { ok: false; word: string };

/** Whether a value is one a context key holds. */
function contextValue(value: unknown): value is ContextValue {
    return value === null || ['string', 'number', 'boolean'].includes(typeof value);
}

/** The result a page's answer to a command request stands for. */
function answered(answer: unknown): CommandResult {
    if (answer === undefined) return { ok: false, word: 'host_down' };
    if (typeof answer !== 'object' || answer === null) return { ok: false, word: 'refused:answer' };
    const reply = answer as { ok?: unknown; value?: unknown; word?: unknown };
    if (reply.ok === true) return { ok: true, value: reply.value ?? null };
    return { ok: false, word: typeof reply.word === 'string' ? reply.word : 'missing' };
}

/** Run a command through the host of the app that registered it. */
async function viaHost(
    shell: AppShell,
    app: HeldApp,
    id: string,
    args: unknown[]
): Promise<CommandResult> {
    try {
        const value = await shell.hosts.request(app.id, 'oculus/provide', {
            kind: 'command',
            id,
            args
        });
        return { ok: true, value };
    } catch (error) {
        return { ok: false, word: error instanceof Refused ? error.word : 'host_down' };
    }
}

/** Whether the app declares the command. */
function declares(app: HeldApp, id: string): boolean {
    return app.row.contributes.commands.some((one) => one.command === id);
}

/**
 * Run a command of an app through its host: the handler it registered, else the host started for
 * the command when the app declares it. `missing` when the host registers no handler, which a page
 * answers by trying the open tabs of the app.
 */
async function runInHost(
    shell: AppShell,
    app: HeldApp,
    id: string,
    args: unknown[]
): Promise<CommandResult> {
    if (app.row.host === '') return { ok: false, word: 'missing' };
    if (!shell.registered(app.id, id)) {
        if (!declares(app, id)) return { ok: false, word: 'missing' };
        if (!(await shell.hosts.ensure(app.id, { kind: 'onCommand', id }))) {
            return { ok: false, word: 'host_down' };
        }
        if (!shell.registered(app.id, id)) return { ok: false, word: 'missing' };
    }
    return viaHost(shell, app, id, args);
}

/**
 * The command a page chose in Cmd-K: a command the app `appId` declares, run through its host.
 * `missing` for an app that is not approved and enabled or that does not declare it.
 */
export function runDeclared(
    shell: AppShell,
    appId: string,
    id: string,
    args: unknown[]
): Promise<CommandResult> {
    const owner = shell.active(appId);
    if (owner === undefined || !declares(owner, id)) {
        return Promise.resolve({ ok: false, word: 'missing' });
    }
    return runInHost(shell, owner, id, args);
}

/** Run the command `id` for the host of `caller`, as its `executeCommand` asks. */
export async function executeCommand(
    shell: AppShell,
    caller: HeldApp,
    id: string,
    args: unknown[]
): Promise<CommandResult> {
    if (id === 'setContext') {
        const [key, value = null] = args;
        if (typeof key !== 'string' || !key.startsWith(`${caller.row.name}.`)) {
            return { ok: false, word: 'refused:context_key' };
        }
        if (!contextValue(value)) return { ok: false, word: 'refused:value' };
        shell.setContext(caller.id, key, value);
        return { ok: true, value: null };
    }
    if (id.startsWith('oculus.')) {
        const kind = oculusCommandKind(id);
        if (kind === null) return { ok: false, word: 'missing' };
        if (kind === 'closed') return { ok: false, word: 'closed' };
        const asked = shell.ask(caller, { kind: 'command', command: id, args, target: '' });
        return answered(await asked.answer);
    }
    const owners = shell.actives().filter((app) => id.startsWith(`${app.row.name}.`));
    if (owners.length === 0) return { ok: false, word: 'missing' };
    const owner = owners.find((app) => declares(app, id) || shell.registered(app.id, id));
    if (owner !== undefined) {
        const done = await runInHost(shell, owner, id, args);
        if (done.ok || done.word !== 'missing') return done;
    }
    const target = (owner ?? owners[0]).id;
    const asked = shell.ask(caller, { kind: 'command', command: id, args, target });
    return answered(await asked.answer);
}
