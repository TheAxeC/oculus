// Layer 2, server. The language servers an app registers with
// `oculus.languages.registerLanguageServer` and the client the app holds for each. The options
// follow the two arguments of `vscode-languageclient`'s `LanguageClient`: a `documentSelector`, the
// `serverOptions`, the `initializationOptions`, `synchronize.configurationSection` and the
// `outputChannelName`.
//
// oculus decides when a server runs: the first document of a selected language under a folder of
// the app's scope starts one server for that folder, through the request `oculus/languages/start`.
// The runner then makes the server (a child process of `serverOptions` as an executable, or what a
// function answers), opens a `languageServer` stream and bridges the two. The bridge sits between
// the child and the stream, so the runner answers what the app handles itself: a request the app
// sent with `sendRequest`, a request or notification of the server the app listens for with
// `onRequest` and `onNotification`. Everything else crosses as it is.
//
// A server is one `Instance`: `send` (to the server), `onMessage` (from it), `onClose`, `onStderr`
// and `kill`. The three ways to make one are the executable, the function that answers streams or
// `{ listen, send }`, and the in-host server of the app's providers (providers.mjs).

import { spawn } from 'node:child_process';
import { Disposable, EventEmitter } from '../../values/events.mjs';
import { Uri } from '../../values/uri.mjs';

/** `vscode-languageclient`'s states. */
export const State = Object.freeze({ Stopped: 1, Running: 2, Starting: 3 });

/** The milliseconds after SIGTERM at which a server that stays is killed. */
const KILL_MS = 2000;

/**
 * The milliseconds `client.stop()` waits for oculus to end the server (it asks `shutdown` and
 * `exit`, SIGTERM two seconds after and SIGKILL five seconds after `exit`) before it closes the
 * streams itself.
 */
const STOP_MS = 7000;

/** The ids of the requests the app sends with `client.sendRequest`, apart from oculus's. */
const APP_ID = 'app-';

/**
 * The listeners of one instance and the one end it has: `finish` tells every close listener the
 * code once, and `ended` says whether it did.
 */
export function instanceEvents() {
    const events = { message: [], close: [], stderr: [] };
    let gone = false;
    return {
        events,
        ended: () => gone,
        finish(code) {
            if (gone) return;
            gone = true;
            for (const listener of events.close) listener(code);
        }
    };
}

/**
 * An instance over a child process that speaks the protocol on its streams.
 * @param {{ command: string, args?: string[], options?: { cwd?: string, env?: object } }}
 * executable
 * @param {{ cwd: string, rpc: any, children: { track: (child: any) => void } }} where
 */
export function executableInstance(executable, where) {
    const { StreamMessageReader, StreamMessageWriter } = where.rpc;
    const child = spawn(executable.command, executable.args ?? [], {
        cwd: executable.options?.cwd ?? where.cwd,
        env: executable.options?.env ?? process.env,
        stdio: ['pipe', 'pipe', 'pipe']
    });
    where.children.track(child);
    const { events, finish, ended } = instanceEvents();
    child.on('error', (error) => finish(error.code === 'ENOENT' ? -2 : -1));
    child.on('exit', (code) => finish(code ?? -1));
    child.stdin.on('error', () => undefined);
    child.stderr.setEncoding('utf8');
    child.stderr.on('data', (text) => {
        for (const listener of events.stderr) listener(text);
    });
    const reader = new StreamMessageReader(child.stdout);
    reader.onError(() => undefined);
    reader.listen((message) => {
        for (const listener of events.message) listener(message);
    });
    const writer = new StreamMessageWriter(child.stdin);
    return {
        send: (message) => void writer.write(message).catch(() => undefined),
        onMessage: (listener) => events.message.push(listener),
        onClose: (listener) => events.close.push(listener),
        onStderr: (listener) => events.stderr.push(listener),
        pause: () => child.stdout.pause(),
        resume: () => child.stdout.resume(),
        kill() {
            if (ended()) return;
            child.kill('SIGTERM');
            setTimeout(() => child.kill('SIGKILL'), KILL_MS).unref();
        }
    };
}

/** An instance over what a `serverOptions` function answered. */
export function functionInstance(result, where) {
    const { StreamMessageReader, StreamMessageWriter } = where.rpc;
    const events = { message: [], close: [], stderr: [] };
    let send;
    let kill = () => undefined;
    if (typeof result.listen === 'function' && typeof result.send === 'function') {
        send = (message) => result.send(message);
        result.listen((message) => {
            for (const listener of events.message) listener(message);
        });
        kill = () => result.dispose?.();
    } else {
        const reader =
            typeof result.reader?.listen === 'function'
                ? result.reader
                : new StreamMessageReader(result.reader);
        const writer =
            typeof result.writer?.write === 'function' && typeof result.writer?.end !== 'function'
                ? result.writer
                : new StreamMessageWriter(result.writer);
        reader.onError?.(() => undefined);
        reader.onClose?.(() => {
            for (const listener of events.close) listener(0);
        });
        reader.listen((message) => {
            for (const listener of events.message) listener(message);
        });
        send = (message) => void writer.write(message).catch(() => undefined);
        kill = () => {
            reader.dispose?.();
            writer.dispose?.();
            result.reader?.destroy?.();
            result.writer?.end?.();
        };
    }
    return {
        send,
        onMessage: (listener) => events.message.push(listener),
        onClose: (listener) => events.close.push(listener),
        onStderr: (listener) => events.stderr.push(listener),
        pause: () => undefined,
        resume: () => undefined,
        kill
    };
}

/**
 * Connect an instance to its stream: messages cross both ways, the answers to the app's own
 * requests and the requests and notifications the app listens for are taken out on the way.
 * @param {any} stream
 * @param {any} instance
 * @param {{
 *   pending: Map<string, any>, requestHandlers: Map<string, any>,
 *   noticeHandlers: Map<string, any[]>,
 *   report: (e: unknown) => void, gone: () => void,
 * }} hooks
 */
export function bridge(stream, instance, hooks) {
    const { pending, requestHandlers, noticeHandlers, report } = hooks;
    const entry = { stream, instance, pending, folder: '' };
    stream.backpressure(
        () => instance.pause(),
        () => instance.resume()
    );
    instance.onMessage((message) => {
        if (message.id !== undefined && message.method === undefined) {
            const key = String(message.id);
            if (key.startsWith(APP_ID) && pending.has(key)) {
                const wait = pending.get(key);
                pending.delete(key);
                if (message.error !== undefined) wait.reject(new Error(message.error.message));
                else wait.resolve(message.result);
                return;
            }
        }
        if (message.method !== undefined) {
            const handler = requestHandlers.get(message.method);
            if (handler !== undefined && message.id !== undefined) {
                Promise.resolve()
                    .then(() => handler(message.params))
                    .then(
                        (result) =>
                            instance.send({
                                jsonrpc: '2.0',
                                id: message.id,
                                result: result ?? null
                            }),
                        (error) =>
                            instance.send({
                                jsonrpc: '2.0',
                                id: message.id,
                                error: {
                                    code: -32603,
                                    message: error instanceof Error ? error.message : String(error)
                                }
                            })
                    );
                return;
            }
            const notices = noticeHandlers.get(message.method);
            if (notices !== undefined && message.id === undefined) {
                for (const notice of notices) {
                    try {
                        notice(message.params);
                    } catch (error) {
                        report(error);
                    }
                }
            }
        }
        stream.sendMessage(message);
    });
    instance.onStderr((text) => stream.sendStderr(text));
    instance.onClose((code) => {
        for (const wait of pending.values()) wait.reject(new Error('the server ended'));
        pending.clear();
        hooks.gone();
        if (!stream.closed) {
            stream.sendControl({ end: true, code });
            stream.close();
        }
    });
    stream.onMessage((message) => instance.send(message));
    stream.onClose(() => {
        instance.kill();
        hooks.gone();
    });
    return entry;
}

/**
 * One app server's client and the instances it runs.
 * @param {{
 *   id: string, options: any, connection: any, streams: any, rpc: any,
 *   children: { track: (child: any) => void },
 *   report: (e: unknown) => void,
 *   note: (line: string) => void, appName: string, cwd: string,
 * }} link
 */
export function createServerClient(link) {
    const { id, options, connection, report } = link;
    const stateEvents = new EventEmitter(report);
    const instances = new Map();
    const requestHandlers = new Map();
    const noticeHandlers = new Map();
    const stopped = [];
    let state = State.Stopped;
    let counter = 0;
    let registered = null;

    const setState = (next) => {
        if (state === next) return;
        const old = state;
        state = next;
        stateEvents.fire({ oldState: old, newState: next });
    };

    const selector = (options.documentSelector ?? []).map((one) =>
        typeof one === 'string'
            ? { language: one, pattern: '' }
            : {
                  language: one.language ?? '',
                  pattern: one.pattern ?? ''
              }
    );

    /** Make the instance of the server for one folder. */
    async function instanceFor(folder) {
        const serverOptions = options.serverOptions;
        const where = { cwd: Uri.parse(folder).fsPath, rpc: link.rpc, children: link.children };
        if (typeof serverOptions === 'function') {
            return functionInstance(await serverOptions({ folder: Uri.parse(folder) }), where);
        }
        const executable = serverOptions?.run ?? serverOptions;
        return executableInstance(executable, where);
    }

    /** Connect an instance to its stream, answering what the app handles itself. */
    function connect(folder, stream, instance) {
        const entry = bridge(stream, instance, {
            pending: new Map(),
            requestHandlers,
            noticeHandlers,
            report,
            gone: () => {
                instances.delete(stream.id);
                if (instances.size > 0) return;
                if (state === State.Running) setState(State.Stopped);
                for (const resolve of stopped.splice(0)) resolve();
            }
        });
        entry.folder = folder;
        instances.set(stream.id, entry);
        setState(State.Running);
    }

    /** The request of oculus to start the server for a folder. */
    async function start(params) {
        if (registered === null) throw new Error('missing');
        setState(State.Starting);
        let instance;
        try {
            instance = await instanceFor(params.root);
        } catch (error) {
            link.note(error instanceof Error ? error.message : String(error));
            if (instances.size === 0) setState(State.Stopped);
            throw error;
        }
        const stream = await link.streams.make('languageServer', {
            token: params.token,
            server: id,
            root: params.root
        });
        connect(params.root, stream, instance);
        return { stream: stream.id };
    }

    /** The instance a request about a document or a folder is for: its folder's, else the first. */
    const pick = (uri) => {
        const all = [...instances.values()];
        if (typeof uri === 'string') {
            const path = Uri.parse(uri).path;
            const found = all.find((one) => {
                const base = Uri.parse(one.folder).path.replace(/\/$/, '');
                return path === base || path.startsWith(`${base}/`);
            });
            if (found !== undefined) return found;
        }
        return all[0];
    };

    const client = {
        get state() {
            return state;
        },
        get initializeResult() {
            return undefined;
        },
        onDidChangeState: stateEvents.event,
        outputChannelName: options.outputChannelName ?? id,
        /** Register the server with oculus; the server itself starts with the first document. */
        async start() {
            if (registered !== null) return registered;
            registered = connection.sendRequest('oculus/languages/register', {
                kind: 'server',
                id,
                options: {
                    selector,
                    output: options.outputChannelName ?? id,
                    sections: [options.synchronize?.configurationSection ?? []].flat(),
                    initializationOptions: options.initializationOptions ?? null
                }
            });
            await registered;
            return undefined;
        },
        /**
         * Withdraw the registration. Oculus then asks each running server `shutdown` and `exit` and
         * ends it, as it does a server it stops itself; the streams still open `STOP_MS` later are
         * closed here.
         */
        async stop() {
            const was = registered;
            registered = null;
            if (was !== null) {
                await connection
                    .sendRequest('oculus/languages/unregister', { kind: 'server', id })
                    .catch(report);
            }
            if (instances.size > 0) {
                const timer = setTimeout(() => {
                    for (const one of [...instances.values()]) one.stream.close();
                }, STOP_MS);
                timer.unref();
                await new Promise((resolve) => stopped.push(resolve));
                clearTimeout(timer);
            }
            setState(State.Stopped);
        },
        sendRequest(method, params) {
            const target = pick(params?.textDocument?.uri ?? params?.uri);
            if (target === undefined) return Promise.reject(new Error('the server is not running'));
            counter += 1;
            const key = `${APP_ID}${counter}`;
            return new Promise((resolve, reject) => {
                target.pending.set(key, { resolve, reject });
                target.instance.send({ jsonrpc: '2.0', id: key, method, params });
            });
        },
        sendNotification(method, params) {
            for (const one of instances.values()) {
                one.instance.send({ jsonrpc: '2.0', method, params });
            }
            return Promise.resolve();
        },
        onRequest(method, handler) {
            requestHandlers.set(method, handler);
            return new Disposable(() => requestHandlers.delete(method));
        },
        onNotification(method, handler) {
            const list = noticeHandlers.get(method) ?? [];
            list.push(handler);
            noticeHandlers.set(method, list);
            return new Disposable(() => {
                const at = list.indexOf(handler);
                if (at >= 0) list.splice(at, 1);
            });
        },
        dispose() {
            void client.stop();
        }
    };
    return { client, start, selector };
}
