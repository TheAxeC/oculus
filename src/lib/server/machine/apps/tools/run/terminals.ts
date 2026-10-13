// Layer 2, server. The terminals an app's host makes with `window.createTerminal`. One made with
// `{ name, shellPath, shellArgs, cwd, env, message }` is a tmux terminal of the kind `app`
// (`oculus/terminals/create`): oculus starts the program in the page's Terminal tab's own tmux and
// records the app's view id in the session's `@oculus_app` option, so after a server restart the
// terminal is still the app's and the host is told of it again (`oculus/terminals/list`). One made
// with `{ name, pty }` is a `terminal` stream the host opens (stream-terminals.ts).
//
// A host reaches only the terminals its own app made. Its `cwd` must lie in the app's scope, the
// environment names it sets are plain names, and a terminal that is not the app's is refused
// `missing`. When the terminals oculus lists change, the host is told which of its terminals
// closed (`oculus/terminals/event`). The pages' side is the Terminal tab: `show` and `hide` are
// requests to a page (`showTerminal`, `hideTerminal`), and the page reports the terminal it shows
// (`active`) for `window.activeTerminal`.
//
// A terminal of an app ends the moment the app stops acting (`endApp`): its tmux session is killed
// and its streams are closed. A stop of the host alone ends its stream terminals and leaves its
// tmux terminals running.

import { statSync } from 'node:fs';
import { z } from 'zod';
import type { Terminal, TerminalJob } from '../../../../../data/model/index.ts';
import { Refused, parsed, type HostHandler } from '../../host/connection.ts';
import type { HostTools } from '../registry.ts';
import { ToolsScope } from '../scope.ts';
import type { StreamTerminalSet } from './stream-terminals.ts';
import { words } from '../../../../core/words.ts';

/** The most terminals one app holds at once. */
const TERMINALS_MAX = 32;

/** What the terminals of the hosts ask of the process. */
export type TerminalsEnv = {
    streams: StreamTerminalSet;
    /** Start a tmux terminal of the kind `app`. */
    start(request: {
        app: string;
        name: string;
        cwd: string;
        argv: string[];
        job?: TerminalJob;
        /** The grid asked for; the default grid when absent. */
        size?: { cols: unknown; rows: unknown };
    }): Promise<Terminal>;
    /** Every terminal now listed, tmux's and the streams'. */
    list(): Terminal[];
    /** Hear the list change; the answer takes the listener off. */
    onChange(listener: () => void): () => void;
    /** Type bytes into a tmux terminal. */
    send(id: string, bytes: Buffer): Promise<void>;
    /** End a tmux terminal. */
    stop(id: string): Promise<void>;
    /** Interrupt the program a tmux terminal runs. */
    interrupt(id: string): Promise<void>;
    /** Run a task terminal's line again, with the line given when there is one. */
    respawn(id: string, command?: string, job?: TerminalJob): Promise<void>;
    /** All the text a terminal's pane holds. */
    output(id: string): Promise<string>;
    /** The shell a terminal runs when its host names none. */
    shell(): string;
};

const createShape = z.object({
    kind: z.literal('tmux'),
    name: z.string().max(80),
    shellPath: z.string().max(4096),
    shellArgs: z.array(z.string().max(4096)).max(256),
    cwd: z.string().max(4096),
    env: z.record(z.string(), z.union([z.string(), z.null()])).default({}),
    message: z.string().max(10_000)
});

const idShape = z.object({ id: z.string().min(1).max(100) });

const textShape = idShape.extend({ text: z.string().max(1_000_000), execute: z.boolean() });

const NAME = /^[A-Za-z_][A-Za-z0-9_]*$/;

/** What a host's terminals answer to the registry. */
export type TerminalHost = {
    handlers: Record<string, HostHandler>;
    /** The terminals of the app now listed. */
    terminals(): Terminal[];
    /** A page shows this terminal. */
    active(id: string): void;
    /** End every terminal of the app. */
    endAll(): Promise<void>;
    /** The host stopped: stream terminals end, tmux terminals stay. */
    stopped(): void;
    stop(): void;
};

/** The terminals of one host. */
export function terminalHost(host: HostTools, env: TerminalsEnv): TerminalHost {
    const own = (): Terminal[] => env.list().filter((one) => one.app === host.id);
    const owned = (id: string): Terminal => {
        const found = own().find((one) => one.id === id);
        if (found === undefined) throw new Refused('missing');
        return found;
    };

    /**
     * The folder a terminal starts in: the host's `cwd` when it is in the scope, else the first
     * folder.
     */
    const folderOf = (cwd: string): string => {
        const app = host.app();
        const scope = host.scope;
        if (cwd === '') {
            const first = scope.folders(app).at(0);
            if (first === undefined) throw new Refused('outside');
            return first.real;
        }
        const found = scope.resolve(app, ToolsScope.uriOf(cwd), true);
        if (!found.ok) throw new Refused(found.word);
        if (!statSync(found.file.real).isDirectory()) throw new Refused('not_a_folder');
        return found.file.real;
    };

    // A stream terminal the host opens is a row of the Terminal tab; one a task run promised under
    // its token is the run's terminal, and takes over the row of a run again.
    host.streams.onTerminal((stream) => {
        const token = typeof stream.purpose.token === 'string' ? stream.purpose.token : '';
        const claim = token === '' ? undefined : env.streams.claim(token, host.id);
        if (claim?.rebind !== undefined && env.streams.rebind(claim.rebind, stream, claim.job)) {
            claim.taken(claim.rebind);
            return;
        }
        if (own().length >= TERMINALS_MAX) {
            host.note(words(host.catalog(), 'server.apps.terminals_full', String(TERMINALS_MAX)));
            stream.close();
            claim?.taken('');
            return;
        }
        const given = typeof stream.purpose.name === 'string' ? stream.purpose.name : '';
        const name = claim?.job.name ?? given;
        const first = host.scope.folders(host.app()).at(0);
        const row = env.streams.add({
            app: host.id,
            name,
            cwd: first?.real ?? '',
            stream,
            job: claim?.job,
            ended: (code) => words(host.catalog(), 'server.apps.terminal_ended', String(code))
        });
        claim?.taken(row.id);
    });

    let known = new Set<string>();
    const off = env.onChange(() => {
        const now = new Set(own().map((one) => one.id));
        for (const id of known) if (!now.has(id)) closed(id);
        known = now;
    });
    const closed = (id: string): void => {
        host.notify('oculus/terminals/event', { kind: 'closed', id, code: null });
    };

    const handlers: Record<string, HostHandler> = {
        'oculus/terminals/create': async (params) => {
            const app = host.app();
            const body = parsed(createShape, params);
            if (own().length >= TERMINALS_MAX) throw new Refused('refused:full');
            const cwd = folderOf(body.cwd);
            const program = body.shellPath === '' ? env.shell() : body.shellPath;
            const variables = Object.entries(body.env).flatMap(([name, value]) => {
                if (!NAME.test(name)) throw new Refused('refused:env');
                return value === null ? [] : [`${name}=${value}`];
            });
            const line = [program, ...body.shellArgs];
            const argv =
                body.message === ''
                    ? ['env', ...variables, ...line]
                    : [
                          'env',
                          ...variables,
                          'sh',
                          '-c',
                          'printf "%s\\r\\n" "$1"; shift; exec "$@"',
                          'sh',
                          body.message,
                          ...line
                      ];
            const terminal = await env.start({
                app: app.id,
                name: body.name === '' ? app.row.title : body.name,
                cwd,
                argv
            });
            return { id: terminal.id };
        },
        'oculus/terminals/list': () => {
            host.app();
            return own()
                .filter((one) => !env.streams.has(one.id))
                .map((one) => ({ id: one.id, name: one.name }));
        },
        'oculus/terminals/pid': (params) => {
            host.app();
            const found = owned(parsed(idShape, params).id);
            return found.pid === 0 ? null : found.pid;
        },
        'oculus/terminals/sendText': async (params) => {
            host.app();
            const body = parsed(textShape, params);
            owned(body.id);
            const text = body.execute ? `${body.text}\r` : body.text;
            if (env.streams.has(body.id)) env.streams.input(body.id, Buffer.from(text, 'utf8'));
            else await env.send(body.id, Buffer.from(text, 'utf8'));
            return null;
        },
        'oculus/terminals/show': (params) => {
            host.app();
            const body = parsed(idShape.extend({ preserveFocus: z.boolean() }), params);
            owned(body.id);
            host.ask({
                kind: 'showTerminal',
                terminal: body.id,
                preserveFocus: body.preserveFocus
            }).answer.catch(() => undefined);
            return null;
        },
        'oculus/terminals/hide': (params) => {
            host.app();
            const body = parsed(idShape, params);
            owned(body.id);
            host.ask({ kind: 'hideTerminal', terminal: body.id }).answer.catch(() => undefined);
            return null;
        },
        'oculus/terminals/name': (params) => {
            host.app();
            const body = parsed(idShape.extend({ name: z.string().max(80) }), params);
            owned(body.id);
            env.streams.rename(body.id, body.name);
            return null;
        },
        'oculus/terminals/dispose': async (params) => {
            host.app();
            const body = parsed(idShape, params);
            owned(body.id);
            if (!env.streams.close(body.id)) await env.stop(body.id);
            return null;
        }
    };

    return {
        handlers,
        terminals: own,
        active(id) {
            if (own().some((one) => one.id === id)) {
                host.notify('oculus/terminals/event', { kind: 'active', id });
            }
        },
        async endAll() {
            for (const one of own()) {
                if (!env.streams.close(one.id)) await env.stop(one.id).catch(() => undefined);
            }
        },
        stopped() {
            env.streams.endApp(host.id, 1);
        },
        stop() {
            off();
        }
    };
}
