// Layer 2, server. `oculus.debug` of the host's object: debug adapter descriptor factories, debug
// configuration providers, `startDebugging`, the active session with `customRequest`, the session
// and breakpoint events, as VS Code's `debug` names them.
//
// oculus decides when a session runs. It asks the runner to start the adapter of a type
// (`oculus/debug/start`): the runner asks the factory of the type for a descriptor (an executable
// the runner starts as a child of the host, a port it connects to, or an adapter object inside the
// host), opens a `debugAdapter` stream and bridges the adapter's messages to it. A type with no
// factory runs the executable oculus read from the app's manifest, which the request carries.
// `oculus/debug/configurations` and `oculus/debug/resolve` ask the configuration providers of a
// type; `oculus/debug/event` tells the session, termination, custom-event and breakpoint events.

import net from 'node:net';
import { Disposable, EventEmitter } from '../values/events.mjs';
import {
    DebugAdapterExecutable,
    DebugAdapterInlineImplementation,
    DebugAdapterServer
} from '../values/run.mjs';
import { Uri } from '../values/uri.mjs';
import { NO_CANCEL } from '../values/events.mjs';
import { executableInstance, instanceEvents } from './languages/servers.mjs';

/** An instance over an adapter that listens on a port. */
function socketInstance(descriptor, where) {
    const { StreamMessageReader, StreamMessageWriter } = where.rpc;
    const socket = net.connect({ port: descriptor.port, host: descriptor.host });
    const { events, finish } = instanceEvents();
    socket.on('error', () => finish(-1));
    socket.on('close', () => finish(0));
    const reader = new StreamMessageReader(socket);
    reader.onError(() => undefined);
    reader.listen((message) => {
        for (const listener of events.message) listener(message);
    });
    const writer = new StreamMessageWriter(socket);
    return {
        send: (message) => void writer.write(message).catch(() => undefined),
        onMessage: (listener) => events.message.push(listener),
        onClose: (listener) => events.close.push(listener),
        onStderr: (listener) => events.stderr.push(listener),
        pause: () => socket.pause(),
        resume: () => socket.resume(),
        kill() {
            socket.destroy();
        }
    };
}

/** An instance over an adapter object that lives in the host. */
function inlineInstance(descriptor) {
    const adapter = descriptor.implementation;
    const events = { message: [], close: [], stderr: [] };
    let gone = false;
    const listening = adapter.onDidSendMessage?.((message) => {
        for (const listener of events.message) listener(message);
    });
    return {
        send: (message) => adapter.handleMessage(message),
        onMessage: (listener) => events.message.push(listener),
        onClose: (listener) => events.close.push(listener),
        onStderr: (listener) => events.stderr.push(listener),
        pause: () => undefined,
        resume: () => undefined,
        kill() {
            if (gone) return;
            gone = true;
            listening?.dispose?.();
            adapter.dispose?.();
            for (const listener of events.close) listener(0);
        }
    };
}

/** Connect an adapter instance to its stream, both ways. */
function connect(stream, instance, report) {
    stream.backpressure(
        () => instance.pause(),
        () => instance.resume()
    );
    instance.onMessage((message) => stream.sendMessage(message));
    instance.onStderr((text) => stream.sendStderr(text));
    instance.onClose((code) => {
        if (stream.closed) return;
        stream.sendControl({ end: true, code });
        stream.close();
    });
    stream.onMessage((message) => {
        try {
            instance.send(message);
        } catch (error) {
            report(error);
        }
    });
    stream.onClose(() => instance.kill());
}

/** A plain copy of a configuration, which crosses to oculus as data. */
function plain(value) {
    return JSON.parse(JSON.stringify(value ?? {}));
}

/**
 * The debug part.
 * @param {{
 *   connection: import('vscode-jsonrpc').MessageConnection,
 *   report: (error: unknown) => void,
 *   streams: ReturnType<typeof import('../streams.mjs').createStreams>,
 *   rpc: any,
 *   children: { track: (child: any) => void },
 * }} link
 */
export function createDebug(link) {
    const { connection, report, streams } = link;
    const factories = new Map();
    const configurers = new Map();
    const sessions = new Map();
    const started = new EventEmitter(report);
    const terminated = new EventEmitter(report);
    const custom = new EventEmitter(report);
    const activeChanged = new EventEmitter(report);
    const breakpointsChanged = new EventEmitter(report);
    let active;
    let breakpoints = [];

    /** The `DebugSession` object of the API for a session oculus told. */
    function sessionOf(info) {
        let held = sessions.get(info.id);
        if (held !== undefined) return held;
        held = {
            id: info.id,
            type: info.type,
            name: info.name,
            workspaceFolder: info.folder === '' ? undefined : folderOf(info.folder),
            configuration: info.configuration ?? {},
            customRequest: (command, args) =>
                connection.sendRequest('oculus/debug/customRequest', {
                    session: info.id,
                    command,
                    args: args ?? {}
                }),
            getDebugProtocolBreakpoint: async () => undefined
        };
        sessions.set(info.id, held);
        return held;
    }

    function folderOf(uri) {
        const parsed = Uri.parse(uri);
        return { uri: parsed, name: parsed.path.split('/').filter(Boolean).at(-1) ?? '', index: 0 };
    }

    const folderArg = (folder) => (folder === undefined ? '' : folder.uri.toString());

    /** The descriptor the factory of a type answers, or the manifest's executable. */
    async function descriptorFor(params) {
        const session = sessionOf(params.session);
        const executable =
            params.executable === null
                ? undefined
                : new DebugAdapterExecutable(
                      params.executable.command,
                      params.executable.args,
                      params.executable.options
                  );
        const factory = factories.get(params.type);
        if (factory !== undefined) {
            const given = await factory.createDebugAdapterDescriptor(session, executable);
            if (given !== undefined && given !== null) return given;
        }
        if (executable === undefined) throw new Error('refused:no_adapter');
        return executable;
    }

    connection.onRequest('oculus/debug/start', async (params) => {
        const descriptor = await descriptorFor(params);
        const where = {
            cwd: params.cwd,
            rpc: link.rpc,
            children: link.children
        };
        let instance;
        if (descriptor instanceof DebugAdapterServer) instance = socketInstance(descriptor, where);
        else if (descriptor instanceof DebugAdapterInlineImplementation) {
            instance = inlineInstance(descriptor);
        } else if (descriptor instanceof DebugAdapterExecutable) {
            instance = executableInstance(descriptor, where);
        } else throw new Error('refused:descriptor');
        const stream = await streams.make('debugAdapter', {
            token: params.token,
            type: params.type,
            session: params.session.id
        });
        connect(stream, instance, report);
        return { stream: stream.id };
    });

    connection.onRequest('oculus/debug/configurations', async (params) => {
        const provider = configurers.get(params.type);
        if (typeof provider?.provideDebugConfigurations !== 'function') return [];
        const given = await provider.provideDebugConfigurations(
            params.folder === '' ? undefined : folderOf(params.folder),
            NO_CANCEL
        );
        return Array.isArray(given) ? given.map(plain) : [];
    });

    connection.onRequest('oculus/debug/resolve', async (params) => {
        const provider = configurers.get(params.type);
        const method =
            params.stage === 'substituted'
                ? 'resolveDebugConfigurationWithSubstitutedVariables'
                : 'resolveDebugConfiguration';
        if (typeof provider?.[method] !== 'function')
            return { configuration: params.configuration };
        const folder = params.folder === '' ? undefined : folderOf(params.folder);
        const resolved = await provider[method](folder, plain(params.configuration), NO_CANCEL);
        if (resolved === undefined || resolved === null) return { abort: true };
        return { configuration: plain(resolved) };
    });

    connection.onNotification('oculus/debug/event', (params) => {
        if (params.kind === 'started') {
            const session = sessionOf(params.session);
            active = session;
            started.fire(session);
            activeChanged.fire(session);
        } else if (params.kind === 'terminated') {
            const session = sessions.get(params.session.id) ?? sessionOf(params.session);
            sessions.delete(params.session.id);
            if (active === session) {
                active = undefined;
                activeChanged.fire(undefined);
            }
            terminated.fire(session);
        } else if (params.kind === 'custom') {
            const session = sessions.get(params.session);
            if (session !== undefined) {
                custom.fire({ session, event: params.event, body: params.body });
            }
        } else if (params.kind === 'breakpoints') {
            const before = breakpoints;
            breakpoints = params.breakpoints.map((one) =>
                one.functionName === undefined
                    ? Object.freeze({
                          ...one,
                          location: {
                              uri: Uri.file(one.path),
                              range: { start: { line: one.line - 1, character: 0 } }
                          }
                      })
                    : Object.freeze(one)
            );
            const added = breakpoints.filter((one) => !before.some((old) => old.id === one.id));
            const removed = before.filter((old) => !breakpoints.some((one) => one.id === old.id));
            if (added.length > 0 || removed.length > 0) {
                breakpointsChanged.fire({ added, removed, changed: [] });
            }
        }
    });

    const api = {
        registerDebugAdapterDescriptorFactory(type, factory) {
            if (factories.has(type)) throw new Error('refused:registered');
            if (typeof factory?.createDebugAdapterDescriptor !== 'function') {
                throw new TypeError('a factory has createDebugAdapterDescriptor');
            }
            factories.set(type, factory);
            void connection
                .sendRequest('oculus/debug/register', { kind: 'factory', type })
                .catch((error) => {
                    if (factories.get(type) === factory) factories.delete(type);
                    report(error);
                });
            return new Disposable(() => {
                if (factories.get(type) !== factory) return;
                factories.delete(type);
                void connection
                    .sendRequest('oculus/debug/unregister', { kind: 'factory', type })
                    .catch(report);
            });
        },
        registerDebugConfigurationProvider(type, provider) {
            if (configurers.has(type)) throw new Error('refused:registered');
            configurers.set(type, provider);
            void connection
                .sendRequest('oculus/debug/register', {
                    kind: 'configurations',
                    type,
                    provides: typeof provider.provideDebugConfigurations === 'function'
                })
                .catch((error) => {
                    if (configurers.get(type) === provider) configurers.delete(type);
                    report(error);
                });
            return new Disposable(() => {
                if (configurers.get(type) !== provider) return;
                configurers.delete(type);
                void connection
                    .sendRequest('oculus/debug/unregister', { kind: 'configurations', type })
                    .catch(report);
            });
        },
        async startDebugging(folder, nameOrConfiguration) {
            const answer = await connection.sendRequest('oculus/debug/startDebugging', {
                folder: folderArg(folder),
                name: typeof nameOrConfiguration === 'string' ? nameOrConfiguration : '',
                configuration:
                    typeof nameOrConfiguration === 'string' ? null : plain(nameOrConfiguration)
            });
            return answer === true;
        },
        stopDebugging(session) {
            return connection.sendRequest('oculus/debug/stopDebugging', {
                session: session?.id ?? ''
            });
        },
        get activeDebugSession() {
            return active;
        },
        get breakpoints() {
            return breakpoints;
        },
        onDidStartDebugSession: started.event,
        onDidTerminateDebugSession: terminated.event,
        onDidReceiveDebugSessionCustomEvent: custom.event,
        onDidChangeActiveDebugSession: activeChanged.event,
        onDidChangeBreakpoints: breakpointsChanged.event
    };

    return {
        api,
        /** The session a `{ $debugSession: id }` argument names; undefined for another value. */
        revive(value) {
            if (typeof value.$debugSession !== 'string') return undefined;
            // A session of oculus's own adapter is no session of the host; its argument is null.
            return sessions.get(value.$debugSession) ?? null;
        },
        stop() {
            factories.clear();
            configurers.clear();
            sessions.clear();
        }
    };
}
