// Layer 2, server. The built Node entry composes one ServerContext, carries it on every request,
// and attaches the process's WebSocket to the same Hub, token and terminal manager. Started by the
// desktop host as a utility process it has a parent: it tells the parent each port it listens on,
// a first listen that failed and the colour themes of apps the theme options name, and asks the
// parent to show the folder panel. Started from a terminal it has none and prints.
//
// It begins with the first-run checks (lib/server/root/process/start/first-run.ts): the Node
// version and the installed packages before any package is loaded, then the programs oculus runs by
// name. A required lack ends the start with a sentence and exit 1, and a missing program is a line
// while the start goes on.

import { existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { engineDir } from './lib/data/places/engine-dir.ts';
import { LISTEN_HOST } from './lib/server/root/mover.ts';
import { askParentToPick, parentOf, type ParentPort } from './lib/server/root/process/parent.ts';
import { onShutdown } from './lib/server/root/process/shutdown.ts';
import { parseEngineArgs } from './lib/server/root/process/start/args.ts';
import {
    installLacks,
    machineFacts,
    machineLacks,
    reportLacks
} from './lib/server/root/process/start/first-run.ts';
import type { Handler } from './lib/server/root/process/serve.ts';

// The command line before anything else, so a mistyped flag, a directory holding no config/ or a
// handler that is no file is said and the process ends without loading the build or opening the
// port. Without `--engine` the engine is this file's own directory, which is what development and
// a plain start over the checkout both mean. Without `--handler` the handler is the one the last
// build of `npm run build` wrote.
const parsed = parseEngineArgs(process.argv.slice(2), {
    cwd: process.cwd(),
    fallback: engineDir(),
    hasConfig: (dir) => existsSync(join(dir, 'config')),
    isFile: (path) => statSync(path, { throwIfNoEntry: false })?.isFile() === true
});
if ('error' in parsed) {
    console.error(`oculus: ${parsed.error}`);
    process.exit(1);
}

// The first part of the first-run check, before any package is loaded: every module below that
// imports a package is loaded with `import()` after it, since a static import of one would end in
// Node's own "Cannot find package" before any line here ran. It asks about the checkout the code
// runs from, never the engine, which may be a copy holding only config/.
const writeLack = (line: string): void => {
    console.error(line);
};
if (reportLacks(installLacks(engineDir(), process.versions.node), writeLack)) process.exit(1);

const { BODY_LIMIT_BYTES } = await import('./lib/server/content/memories.ts');
const { createServerContext } = await import('./lib/server/root/context.ts');
const { firstAppThemes } = await import('./lib/server/machine/apps/routes/theme.ts');
const { readMachineWithDefault } = await import('./lib/server/root/process/start/port.ts');
const { serveContext, withMissingFiles } = await import('./lib/server/root/process/serve.ts');
const { wordsOf } = await import('./lib/server/root/process/words.ts');

const t = wordsOf(parsed.engine);

// The second part, now that the catalog can be read: a missing program is said in a line while the
// start goes on.
const facts = await machineFacts(parsed.defaultPort, process.env);
if (reportLacks(machineLacks(facts, t), writeLack)) process.exit(1);

// How large a request body the built handler's parser accepts. It is a knob of the adapter this
// process loads, read once when that module is evaluated and only from the environment, so this
// process sets it before the import below; it is not a setting the reader has, which is why it is
// not in config/. Left alone the parser refuses a body over 512K, which is any photograph the
// Memories wall's own control sends, and the page would meet a refused request rather than a
// sentence. server/content/memories.ts holds the size and enforces the picture's own half of it.
process.env.BODY_SIZE_LIMIT = String(BODY_LIMIT_BYTES);

// The parent port exists in a utility process alone; it is read here once and passed down.
const parent = parentOf((process as { parentPort?: ParentPort }).parentPort);

// The handler the command line names, or the built app of `npm run build`. A default handler that
// was never built is said with the command that makes it. A handler that does not load is said
// through the catalog with its file and the error's message, and ends the process.
const built = new URL('../build/handler.js', import.meta.url).href;
if (parsed.handler === undefined && !existsSync(fileURLToPath(built))) {
    console.error(t('server.start.handler_not_built', fileURLToPath(built), engineDir()));
    process.exit(1);
}
const handlerUrl = parsed.handler === undefined ? built : pathToFileURL(parsed.handler).href;
let loaded: { handler: Handler };
try {
    loaded = (await import(handlerUrl)) as { handler: Handler };
} catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    console.error(t('server.start.handler_failed', fileURLToPath(handlerUrl), reason));
    process.exit(1);
}
const handler = withMissingFiles(
    join(dirname(fileURLToPath(handlerUrl)), 'client'),
    loaded.handler
);
const server = createServer();
const { context, socket } = serveContext(server, handler, (portMove) =>
    createServerContext(
        parsed.engine,
        { readMachine: readMachineWithDefault(parsed.defaultPort) },
        portMove
    )
);
if (parent !== null) {
    context.folderPicker.ask = askParentToPick(parent);
    // The colour themes of apps the theme options name, read as a page's first load reads them,
    // told before the first listen and again after each read of the apps that changes them, so the
    // host fills a new window with the theme its page starts on, an app's theme included. A read
    // follows every `config` push, so a change of either option is told too.
    let told = '';
    const tellThemes = (): void => {
        const files = firstAppThemes(context.apps.held(), context.configCache.quiet().config);
        const text = JSON.stringify(files);
        if (text === told) return;
        told = text;
        parent.send({ kind: 'app-themes', files });
    };
    tellThemes();
    context.apps.onRead(tellThemes);
}

// A stop signal closes the same things the `close` event closes, then the http server, and exits
// when it has let go of its handles.
onShutdown(
    {
        on: (signal, handler) => void process.on(signal, handler),
        exit: (code) => process.exit(code)
    },
    (done) => {
        socket.close();
        context.close();
        server.close(() => done());
    }
);

// Every listen is told to the parent: the first and each move of the port.
server.on('listening', () => {
    parent?.send({ kind: 'listening', port: (server.address() as AddressInfo).port });
});

// A first listen that fails ends the process. A port that is in use is said in a line and not as
// the stack the unhandled event would print; the parent is told first, with the port it asked for.
// Any other failure is thrown, as an unhandled event would.
const refused = (error: NodeJS.ErrnoException): void => {
    parent?.send({
        kind: 'failed',
        reason: error.code ?? error.message,
        port: context.local.port
    });
    if (error.code !== 'EADDRINUSE') throw error;
    console.error(t('server.start.port_in_use', context.local.port));
    process.exit(1);
};
server.once('error', refused);

server.listen(context.local.port, LISTEN_HOST, () => {
    server.off('error', refused);
    const open = context.workspace.open();
    const workspace = open.file ?? t('server.start.workspace_unsaved');
    console.log(t('server.start.listening', LISTEN_HOST, context.local.port, workspace));
});
