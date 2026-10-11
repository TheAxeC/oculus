// Layer 2, server. What oculus answers to the shell requests a host makes: `oculus/register` and
// `oculus/unregister` of a command handler, status item, tree view or panel, `oculus/subscribe` and
// `oculus/unsubscribe` to events, `oculus/ui` for a message, quick pick, input box or progress,
// `oculus/settings/get` for one of the app's declared settings, `oculus/commands/execute` for a
// command by id, and the notification `oculus/changed` that a registered thing changed.
//
// Each handler reads the app from the host that asked, never from the params, and refuses a host
// whose app is not approved and enabled (`closed`). A call of `oculus/ui` counts under
// `apps.messages_per_min` and one of `oculus/commands/execute` under `apps.opens_per_min`, each per
// host (`rate`). A progress request answers its id at once and stays open until the host's
// `oculus/changed` for it says it is done.

import { z } from 'zod';
import { appActive } from '../../../../data/helpers/files/apps/apps.ts';
import { text } from '../../../../data/helpers/guards.ts';
import type { Limiter } from '../../../../data/helpers/run/limiter.ts';
import type { AppRequestBody } from '../../../../data/model/index.ts';
import { Refused, type HostHandler, type HostNotice } from '../host/connection.ts';
import type { HeldApp } from '../read/held.ts';
import { executeCommand } from './commands.ts';
import type { AppShell } from './registry.ts';

/** What the handlers of one host are made over. */
export type ShellContext = {
    shell: AppShell;
    /** The app the host belongs to as the server holds it now. */
    app: () => HeldApp | undefined;
    messages: Limiter;
    opens: Limiter;
    /** The resolved values of the settings the app declares, by whole key. */
    values: (app: HeldApp) => Record<string, unknown>;
};

const KINDS = ['command', 'statusItem', 'tree', 'panel'] as const;

const registerShape = z.object({
    kind: z.enum(KINDS),
    id: z.string().min(1),
    options: z.record(z.string(), z.unknown()).default({})
});

const changedShape = z.object({
    kind: z.enum(['statusItem', 'tree', 'panel', 'progress']),
    id: z.string().min(1),
    options: z.record(z.string(), z.unknown()).default({})
});

const subscribeShape = z.object({
    kind: z.enum(['settings', 'visibility', 'selection', 'expand', 'collapse', 'dispose']),
    id: z.string().default('')
});

const pickShape = z.object({
    label: z.string(),
    description: z.string().default(''),
    detail: z.string().default(''),
    picked: z.boolean().default(false)
});

const uiShape = z.discriminatedUnion('kind', [
    z.object({
        kind: z.literal('message'),
        tone: z.enum(['info', 'warning', 'error']),
        message: z.string(),
        items: z.array(z.string()).default([]),
        modal: z.boolean().default(false)
    }),
    z.object({
        kind: z.literal('quickPick'),
        items: z.array(pickShape),
        title: z.string().default(''),
        placeHolder: z.string().default(''),
        canPickMany: z.boolean().default(false),
        matchOnDescription: z.boolean().default(false),
        matchOnDetail: z.boolean().default(false)
    }),
    z.object({
        kind: z.literal('inputBox'),
        title: z.string().default(''),
        prompt: z.string().default(''),
        value: z.string().default(''),
        placeHolder: z.string().default(''),
        password: z.boolean().default(false),
        validate: z.boolean().default(false)
    }),
    z.object({
        kind: z.literal('progress'),
        location: z.enum(['notification', 'window']),
        title: z.string().default(''),
        cancellable: z.boolean().default(false),
        message: z.string().default(''),
        percent: z.number().nullable().default(null)
    })
]);

/** The params parsed by a shape, or the refusal. */
function parsed<T>(shape: z.ZodType<T>, params: unknown): T {
    const read = shape.safeParse(params);
    if (!read.success) throw new Refused('refused:params');
    return read.data;
}

/** Whether the app declares a view of type tree with this id. */
function treeView(app: HeldApp, id: string): boolean {
    return Object.values(app.row.contributes.views)
        .flat()
        .some((one) => one.id === id && one.type === 'tree');
}

/** Whether a file is one of the app's recorded files and an `.html` page. */
function recordedPage(app: HeldApp, entry: string): boolean {
    return entry.endsWith('.html') && app.files.some((one) => one.path === entry);
}

/** The handlers of the shell requests one host makes, by method. */
export function shellHandlers(context: ShellContext): Record<string, HostHandler> {
    const { shell } = context;
    const app = (): HeldApp => {
        const held = context.app();
        if (held === undefined) throw new Refused('host_down');
        if (!appActive(held.row)) throw new Refused('closed');
        return held;
    };
    return {
        'oculus/register': (params) => {
            const one = app();
            const { kind, id, options } = parsed(registerShape, params);
            if (kind === 'command' && !id.startsWith(`${one.row.name}.`)) {
                throw new Refused('refused:id');
            }
            if (kind === 'tree' && !treeView(one, id)) throw new Refused('refused:view');
            if (kind === 'panel' && !recordedPage(one, text(options.entry))) {
                throw new Refused('missing');
            }
            shell.register(one, kind, id, options);
            return null;
        },
        'oculus/unregister': (params) => {
            const { kind, id } = parsed(registerShape, params);
            shell.unregister(app().id, kind, id);
            return null;
        },
        'oculus/subscribe': (params) => {
            const { kind, id } = parsed(subscribeShape, params);
            shell.subscribe(app().id, kind, id);
            return null;
        },
        'oculus/unsubscribe': (params) => {
            const { kind, id } = parsed(subscribeShape, params);
            shell.unsubscribe(app().id, kind, id);
            return null;
        },
        'oculus/ui': async (params) => {
            const one = app();
            const body: AppRequestBody = parsed(uiShape, params);
            if (!context.messages.take()) throw new Refused('rate');
            const asked = shell.ask(one, body);
            if (body.kind === 'progress') return { id: asked.id };
            return (await asked.answer) ?? null;
        },
        'oculus/settings/get': (params) => {
            const one = app();
            const key = parsed(z.object({ key: z.string().min(1) }), params).key;
            if (!key.startsWith(`${one.row.name}.`)) throw new Refused('not_declared');
            const values = context.values(one);
            return Object.hasOwn(values, key) ? values[key] : null;
        },
        'oculus/commands/execute': async (params) => {
            const one = app();
            const { id, args } = parsed(
                z.object({ id: z.string().min(1), args: z.array(z.unknown()).default([]) }),
                params
            );
            if (!context.opens.take()) throw new Refused('rate');
            const done = await executeCommand(shell, one, id, args);
            if (!done.ok) throw new Refused(done.word);
            return done.value;
        }
    };
}

/** The handlers of the shell notifications one host sends, by method. */
export function shellNotices(context: ShellContext): Record<string, HostNotice> {
    const { shell } = context;
    return {
        'oculus/changed': (params) => {
            const held = context.app();
            if (held === undefined || !appActive(held.row)) return;
            const { kind, id, options } = parsed(changedShape, params);
            if (kind !== 'progress') {
                shell.changed(held.id, kind, id, options);
                return;
            }
            if (shell.requestOf(id)?.app !== held.id) return;
            if (options.done === true) {
                shell.withdraw(id);
                return;
            }
            const percent = typeof options.percent === 'number' ? options.percent : undefined;
            const message = typeof options.message === 'string' ? options.message : undefined;
            shell.progress(id, { message, percent });
        }
    };
}
