// The process oculus holds for one app's host. It is plain JavaScript that node runs directly,
// since it must start the same way from `vite dev`, from the built server and from the desktop app,
// and it needs no package of the app: the app's host file talks to oculus through the object this
// runner hands it.
//
// Arguments: the absolute path of the app's host file, and the absolute path of `vscode-jsonrpc`'s
// node entry in oculus's own `node_modules`. Standard input and standard output carry JSON-RPC 2.0
// messages with `Content-Length` headers, the framing `vscode-jsonrpc` writes on both ends.
// The process ends when its standard
// input closes, so a server that is killed leaves no host running.
//
// The first `oculus/activate` request carries the app's name, the resolved values of the settings
// it declares, the real paths of the app's recorded files and the sentences the runner writes to
// the host's output, worded from oculus's catalog. The runner then installs a module hook that
// refuses every `file:` import, dynamic `import()` and `require` of a file that is not one of them,
// loads the host file, and calls its exported `activate(oculus)` once with the connection object.
// Whatever the host writes to standard output goes to standard error, so the messages are the only
// thing on standard output; a write to file descriptor 1 that skips this redirection breaks the
// message stream, which oculus then reports and answers by stopping the host.

import { realpathSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { Socket } from 'node:net';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createShell } from './runner-shell.mjs';
import { createTools, joined } from './tools/index.mjs';

const [hostFile, jsonrpcEntry] = process.argv.slice(2);

const WIRE_FD = 1;
const wire = new Socket({ fd: WIRE_FD, readable: false, writable: true });
process.stdout.write = (...parts) => process.stderr.write(...parts);

const rpc = await import(pathToFileURL(jsonrpcEntry).href);
const {
    createMessageConnection,
    StreamMessageReader,
    StreamMessageWriter,
    ResponseError,
    ProgressType
} = rpc.default ?? rpc;
const connection = createMessageConnection(
    new StreamMessageReader(process.stdin),
    new StreamMessageWriter(wire)
);

/** The error code a host's own refusal answers with. */
const REFUSED = 1;

/** The text of a thrown value. */
function messageOf(error) {
    return error instanceof Error ? error.message : String(error);
}

/** Write a line to standard error, then end the process with a code. */
function endWith(code, text) {
    process.stderr.write(`${text}\n`, () => process.exit(code));
}

/** A sentence with `{0}`, `{1}` replaced by the arguments at those positions. */
function fill(template, args) {
    return template.replace(/\{(\d+)\}/g, (found, at) => args[Number(at)] ?? found);
}

/** The sentences of the first activate request. */
let texts = null;

/** Refuse every `file:` module the host loads that is not one of its recorded files. */
function guard(files) {
    const allowed = new Set(files);
    registerHooks({
        resolve(specifier, context, next) {
            const resolved = next(specifier, context);
            if (!resolved.url.startsWith('file:')) return resolved;
            const path = fileURLToPath(resolved.url);
            let real = path;
            try {
                real = realpathSync(path);
            } catch {
                // A file that cannot be resolved is refused below as one that is not recorded.
            }
            if (!allowed.has(real)) {
                throw new Error(fill(texts.refused, [real, specifier]));
            }
            return resolved;
        }
    });
}

/** The shell's namespaces of the object a host receives, and the answers to its two messages. */
const shell = createShell({
    connection,
    report: (error) =>
        process.stderr.write(`${fill(texts?.eventFailed ?? '{0}', [messageOf(error)])}\n`)
});

/** The tools' namespaces and value classes, which the host receives with the shell's. */
const tools = createTools({
    connection,
    report: (error) =>
        process.stderr.write(`${fill(texts?.eventFailed ?? '{0}', [messageOf(error)])}\n`),
    note: (line) => process.stderr.write(`${line}\n`),
    texts: () => texts ?? {},
    rpc: rpc.default ?? rpc,
    shell
});

shell.reviveWith(tools.revive);

let hostModule = null;
let api = null;
let activated = false;
let requestHandler = null;
const storeListeners = [];

const oculus = {
    ...tools.values,
    ...shell.api,
    ...tools.api,
    window: joined(shell.api.window, tools.api.window),
    workspace: joined(shell.api.workspace, tools.api.workspace),
    onRequest(handler) {
        requestHandler = handler;
    },
    store: {
        get: async (key) => {
            const held = await connection.sendRequest('oculus/store/get', { key });
            return held.has ? held.value : undefined;
        },
        update: (key, value) => connection.sendRequest('oculus/store/update', { key, value }),
        keys: () => connection.sendRequest('oculus/store/keys'),
        onDidChange(handler) {
            storeListeners.push(handler);
        }
    },
    secrets: {
        get: async (key) =>
            (await connection.sendRequest('oculus/secrets/get', { key })) ?? undefined,
        store: (key, value) => connection.sendRequest('oculus/secrets/store', { key, value }),
        delete: (key) => connection.sendRequest('oculus/secrets/delete', { key })
    },
    sendToPage: (method, params, tab) =>
        connection.sendRequest('oculus/sendToPage', { method, params, tab }),
    apps: {
        async get(name) {
            const names = await connection.sendRequest('oculus/apps/get', { name });
            const dependency = {};
            for (const fn of names) {
                dependency[fn] = (...args) =>
                    connection.sendRequest('oculus/apps/call', { name, fn, args });
            }
            return dependency;
        }
    }
};

/** Load the host file under the guard and call its `activate` once. */
async function activate(files) {
    guard(files);
    if (hostFile === '') return;
    hostModule = await import(pathToFileURL(hostFile).href);
    if (typeof hostModule.activate !== 'function') {
        throw new Error(fill(texts.noActivate, [hostFile]));
    }
    api = (await hostModule.activate(oculus)) ?? null;
}

connection.onRequest('oculus/activate', async (params) => {
    if (activated) return null;
    activated = true;
    texts = params.texts;
    shell.start(params.name, params.settings);
    tools.start(params.folders);
    try {
        await activate(params.files);
    } catch (error) {
        const text = error instanceof Error ? (error.stack ?? error.message) : String(error);
        setTimeout(() => endWith(1, fill(texts.failed, [text])), 0);
        throw new ResponseError(REFUSED, messageOf(error));
    }
    return null;
});

connection.onRequest('oculus/request', async (params, token) => {
    if (requestHandler === null) throw new ResponseError(REFUSED, texts.noHandler);
    const kind = new ProgressType();
    const progress = (value) => {
        if (typeof params.progress === 'string')
            connection.sendProgress(kind, params.progress, value);
    };
    try {
        return (
            (await requestHandler(params.method, params.params, params.tab, token, progress)) ??
            null
        );
    } catch (error) {
        throw new ResponseError(REFUSED, messageOf(error));
    }
});

connection.onRequest('oculus/apiCall', async (params) => {
    if (api === null || typeof api !== 'object') {
        if (params.fn === undefined) return [];
        throw new ResponseError(REFUSED, texts.noApi);
    }
    if (params.fn === undefined) {
        return Object.keys(api).filter((name) => typeof api[name] === 'function');
    }
    if (!Object.hasOwn(api, params.fn) || typeof api[params.fn] !== 'function') {
        throw new ResponseError(REFUSED, fill(texts.noFunction, [params.fn]));
    }
    try {
        return (await api[params.fn](...params.args)) ?? null;
    } catch (error) {
        throw new ResponseError(REFUSED, messageOf(error));
    }
});

connection.onRequest('oculus/provide', async (params) => {
    try {
        return (await shell.provide(params)) ?? null;
    } catch (error) {
        throw new ResponseError(REFUSED, messageOf(error));
    }
});

connection.onNotification('oculus/event', (params) => shell.event(params));

connection.onNotification('oculus/storeChanged', (params) => {
    for (const listener of storeListeners) {
        try {
            listener(params.keys);
        } catch (error) {
            process.stderr.write(`${fill(texts.listenerFailed, [messageOf(error)])}\n`);
        }
    }
});

connection.onRequest('oculus/deactivate', async () => {
    try {
        await hostModule?.deactivate?.();
    } catch (error) {
        process.stderr.write(`${fill(texts.deactivateFailed, [messageOf(error)])}\n`);
    }
    tools.stop();
    setTimeout(() => wire.end(() => process.exit(0)), 0);
    return null;
});

connection.onClose(() => process.exit(0));
connection.onError(([error]) =>
    process.stderr.write(`${fill(texts?.stream ?? '{0}', [messageOf(error)])}\n`)
);
connection.listen();
