// Layer 2, server. `oculus.window.createTerminal` and the terminal members of the host's object:
// `terminals`, `activeTerminal` and the three events, as VS Code's `window` names them.
//
// A terminal made with `{ name, shellPath, shellArgs, cwd, env, message }` is a tmux terminal of
// oculus (`oculus/terminals/create`); oculus holds it, and it outlives the host. One made with
// `{ name, pty }` is a `terminal` stream the host opens: what the `Pseudoterminal` writes
// (`onDidWrite`) goes out as the stream's bytes, what the pages type reaches `handleInput`, the
// pages' size reaches `setDimensions`, and a close of its tab calls `close()`. The tmux terminals
// an earlier host of the app created are told again at activation (`oculus/terminals/list`), so
// `window.terminals` holds them once the answer is in.
//
// A `Terminal` answers its calls once oculus has made the terminal: the calls wait for it.

import { EventEmitter } from '../values/events.mjs';

/** How a stream terminal is closed from the host: the exit it reports. */
function exitStatus(code, reason) {
    return { code: typeof code === 'number' ? code : undefined, reason };
}

/**
 * The terminals part.
 * @param {{
 *   connection: import('vscode-jsonrpc').MessageConnection,
 *   report: (error: unknown) => void,
 *   streams: ReturnType<typeof import('../streams.mjs').createStreams>,
 * }} link
 */
export function createTerminals(link) {
    const { connection, report, streams } = link;
    const all = new Map();
    const opened = new EventEmitter(report);
    const closed = new EventEmitter(report);
    const activeChanged = new EventEmitter(report);
    let active;

    /** The `Terminal` object of the API over a ready promise and the calls that reach oculus. */
    function make(options, ready, calls) {
        const state = { isInteractedWith: false };
        const terminal = {
            name: options.name,
            creationOptions: Object.freeze({ ...options }),
            exitStatus: undefined,
            state,
            processId: ready.then((id) => (id === undefined ? undefined : calls.processId(id))),
            shellIntegration: undefined,
            sendText(text, shouldExecute = true) {
                void ready.then((id) => calls.sendText(id, String(text), shouldExecute !== false));
            },
            show(preserveFocus) {
                void ready.then((id) => calls.show(id, preserveFocus === true));
            },
            hide() {
                void ready.then((id) => calls.hide(id));
            },
            dispose() {
                void ready.then((id) => calls.dispose(id));
            }
        };
        return terminal;
    }

    /** Hold a terminal under its oculus id and tell the open event. */
    function hold(id, terminal) {
        all.set(id, terminal);
        opened.fire(terminal);
    }

    /** The terminal ended: the exit is recorded and the close event fires once. */
    function end(id, status) {
        const terminal = all.get(id);
        if (terminal === undefined) return;
        all.delete(id);
        terminal.exitStatus = status;
        if (active === terminal) {
            active = undefined;
            activeChanged.fire(undefined);
        }
        closed.fire(terminal);
    }

    /** A tmux terminal. */
    function tmuxTerminal(options) {
        const ready = connection
            .sendRequest('oculus/terminals/create', {
                kind: 'tmux',
                name: options.name ?? '',
                shellPath: options.shellPath ?? '',
                shellArgs: Array.isArray(options.shellArgs) ? options.shellArgs : [],
                cwd: options.cwd === undefined ? '' : String(options.cwd.fsPath ?? options.cwd),
                env: options.env ?? {},
                message: options.message ?? ''
            })
            .then(
                (answer) => answer.id,
                (error) => {
                    report(error);
                    return undefined;
                }
            );
        const terminal = make(options, ready, oculusCalls());
        void ready.then((id) => {
            if (id !== undefined) hold(id, terminal);
            else terminal.exitStatus = exitStatus(undefined, 0);
        });
        return terminal;
    }

    /** The calls a tmux terminal and a stream terminal share: they reach oculus by id. */
    function oculusCalls() {
        const call = (method, params) => connection.sendRequest(method, params).catch(report);
        return {
            processId: async (id) =>
                (await connection.sendRequest('oculus/terminals/pid', { id }).catch(() => null)) ??
                undefined,
            sendText: (id, text, execute) =>
                call('oculus/terminals/sendText', { id, text, execute }),
            show: (id, preserveFocus) => call('oculus/terminals/show', { id, preserveFocus }),
            hide: (id) => call('oculus/terminals/hide', { id }),
            dispose: (id) => call('oculus/terminals/dispose', { id })
        };
    }

    /** A terminal whose bytes are a stream to the host's `Pseudoterminal`. */
    function streamTerminal(options) {
        const pty = options.pty;
        const writes = [];
        let stream = null;
        let id;
        let finished = false;
        const finish = (code, reason) => {
            if (finished) return;
            finished = true;
            if (id !== undefined) end(id, exitStatus(code, reason));
        };
        const ready = streams
            .make('terminal', { name: options.name ?? '', ...(options.purpose ?? {}) })
            .then(
                (made) => {
                    stream = made;
                    id = made.id;
                    made.onBytes((bytes) => pty.handleInput?.(bytes.toString('utf8')));
                    made.onControl((body) => {
                        if (typeof body.columns === 'number' && typeof body.rows === 'number') {
                            pty.setDimensions?.({ columns: body.columns, rows: body.rows });
                        }
                    });
                    made.onClose(() => {
                        try {
                            pty.close?.();
                        } catch (error) {
                            report(error);
                        }
                        finish(undefined, 3);
                    });
                    for (const queued of writes.splice(0)) made.sendBytes(queued);
                    return made.id;
                },
                (error) => {
                    report(error);
                    return undefined;
                }
            );
        const wrote = pty.onDidWrite?.((data) => {
            const bytes = Buffer.from(String(data), 'utf8');
            if (stream === null) writes.push(bytes);
            else stream.sendBytes(bytes);
        });
        const renamed = pty.onDidChangeName?.((name) => {
            terminal.name = String(name);
            void ready.then((made) => {
                if (made !== undefined) {
                    connection
                        .sendRequest('oculus/terminals/name', { id: made, name: terminal.name })
                        .catch(report);
                }
            });
        });
        const ending = pty.onDidClose?.((code) => {
            wrote?.dispose();
            renamed?.dispose();
            ending?.dispose();
            stream?.sendControl({ end: true, code: typeof code === 'number' ? code : null });
            finish(code, 2);
            stream?.close();
        });
        const terminal = make(options, ready, {
            ...oculusCalls(),
            processId: async () => undefined,
            sendText: (made, text, execute) =>
                pty.handleInput?.(execute ? `${text}\r` : text) ?? made,
            dispose: () => {
                wrote?.dispose();
                renamed?.dispose();
                pty.close?.();
                stream?.close();
                finish(undefined, 4);
            }
        });
        void ready.then((made) => {
            if (made === undefined) return;
            hold(made, terminal);
            try {
                pty.open?.(undefined);
            } catch (error) {
                report(error);
            }
        });
        return terminal;
    }

    connection.onNotification('oculus/terminals/event', (params) => {
        if (params.kind === 'closed') {
            end(params.id, exitStatus(params.code, params.reason ?? 2));
        } else if (params.kind === 'active') {
            const next = all.get(params.id);
            if (next === active) return;
            active = next;
            activeChanged.fire(next);
        } else if (params.kind === 'interacted') {
            const found = all.get(params.id);
            if (found !== undefined) found.state.isInteractedWith = true;
        }
    });

    const api = {
        createTerminal(nameOrOptions, shellPath, shellArgs) {
            const options =
                typeof nameOrOptions === 'object' && nameOrOptions !== null
                    ? nameOrOptions
                    : { name: nameOrOptions, shellPath, shellArgs };
            if (options.pty !== undefined) return streamTerminal(options);
            return tmuxTerminal(options);
        },
        get terminals() {
            return [...all.values()];
        },
        get activeTerminal() {
            return active;
        },
        onDidOpenTerminal: opened.event,
        onDidCloseTerminal: closed.event,
        onDidChangeActiveTerminal: activeChanged.event
    };

    return {
        api,
        /** The terminal a `{ $terminal: id }` argument names; undefined for another value. */
        revive(value) {
            if (typeof value.$terminal !== 'string') return undefined;
            const terminal = all.get(value.$terminal);
            if (terminal === undefined) throw new Error('missing');
            return terminal;
        },
        /** Hold the tmux terminals an earlier host of the app created. */
        async start() {
            let found;
            try {
                found = await connection.sendRequest('oculus/terminals/list', {});
            } catch (error) {
                report(error);
                return;
            }
            for (const one of found) {
                if (all.has(one.id)) continue;
                const ready = Promise.resolve(one.id);
                const terminal = make({ name: one.name }, ready, oculusCalls());
                hold(one.id, terminal);
            }
        },
        /** The host stopped: the terminals it held are gone from it. */
        stop() {
            for (const id of [...all.keys()]) all.delete(id);
        }
    };
}
