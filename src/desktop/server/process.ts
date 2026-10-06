// Layer 2, server (the desktop host). The oculus server as a utility process of the app. It is
// `src/server.ts` forked with the engine, the default port and the handler, never run in the main
// process, so a long read of the config never stops the window's menus or its move. The process
// tells the app each port it listens on and a first listen that failed
// (lib/server/root/process/parent.ts), and asks it for the folder panel. Its output is printed on
// the app's own, under a prefix.

import { utilityProcess, type UtilityProcess } from 'electron';
import {
    readServerMessage,
    type MainMessage,
    type ServerMessage
} from '../../lib/server/root/process/parent.ts';
import { errorReason } from './error-line.ts';

/** How the first listen came out. */
type ServerStart =
    | { kind: 'listening'; port: number }
    | { kind: 'failed'; reason: string; port: number }
    | { kind: 'exited'; code: number; reason: string };

/** What a fork needs. */
export type ForkOptions = {
    /** The server's entry, `src/server.ts` of the checkout. */
    entry: string;
    engine: string;
    /** The built handler the server loads, `build-app/handler.js` of the checkout. */
    handler: string;
    /** The port a missing local.yml means. */
    defaultPort: number;
    env: NodeJS.ProcessEnv;
    /** The name the process appears under in Activity Monitor. */
    name: string;
    /** Called with each output line of the process. */
    say: (line: string, error: boolean) => void;
    /** Called when the process asks for the folder panel. */
    onPick: (id: number) => void;
};

/** A server process. */
export type ServerProcess = {
    /** The first thing that happens to it: it listens, its listen fails, or it exits. */
    started: Promise<ServerStart>;
    /** The port it last reported listening on, or null before the first. */
    port: () => number | null;
    /** Called with each port it reports listening on, the first and each move. */
    onListening: (listener: (port: number) => void) => () => void;
    /** Called when it exits without being stopped, after its first listen. */
    onLost: (listener: (code: number, reason: string) => void) => void;
    /** Send it a message. */
    send: (message: MainMessage) => void;
    /** End it with SIGTERM and wait for its exit, at most `limitMs`. */
    stop: (limitMs: number) => Promise<void>;
};

/** Print each line a stream holds under the caller's `say`, and hand each error line to `note`. */
function relay(
    stream: NodeJS.ReadableStream | null | undefined,
    error: boolean,
    say: ForkOptions['say'],
    note: (line: string) => void
): void {
    let rest = '';
    stream?.on('data', (chunk: Buffer) => {
        const parts = (rest + chunk.toString()).split('\n');
        rest = parts.pop() ?? '';
        for (const line of parts) {
            if (line.trim() === '') continue;
            if (error) note(line);
            say(line, error);
        }
    });
}

/** Fork the server. */
export function forkServer(options: ForkOptions): ServerProcess {
    const child: UtilityProcess = utilityProcess.fork(
        options.entry,
        [
            '--engine',
            options.engine,
            '--default-port',
            String(options.defaultPort),
            '--handler',
            options.handler
        ],
        { env: options.env, stdio: 'pipe', serviceName: options.name }
    );
    let port: number | null = null;
    const reason = errorReason();
    let stopping = false;
    let first = false;
    let exited = false;
    const listeners = new Set<(port: number) => void>();
    const lost: ((code: number, reason: string) => void)[] = [];
    let settle: (start: ServerStart) => void = () => undefined;
    const started = new Promise<ServerStart>((resolve) => {
        settle = (start) => {
            if (first) return;
            first = true;
            resolve(start);
        };
    });
    relay(child.stdout, false, options.say, () => undefined);
    relay(child.stderr, true, options.say, reason.note);
    child.on('message', (raw: unknown) => {
        const message: ServerMessage | null = readServerMessage(raw);
        if (message === null) {
            options.say(`ignored a message of no known kind: ${JSON.stringify(raw)}`, true);
            return;
        }
        if (message.kind === 'listening') {
            port = message.port;
            settle({ kind: 'listening', port: message.port });
            for (const listener of listeners) listener(message.port);
        } else if (message.kind === 'failed') {
            settle({ kind: 'failed', reason: message.reason, port: message.port });
        } else {
            options.onPick(message.id);
        }
    });
    const gone = new Promise<void>((resolve) => {
        child.once('exit', (code) => {
            exited = true;
            if (!first) settle({ kind: 'exited', code, reason: reason.text() });
            else if (!stopping && port !== null)
                for (const listener of lost) listener(code, reason.text());
            resolve();
        });
    });
    return {
        started,
        port: () => port,
        onListening: (listener) => {
            listeners.add(listener);
            return () => void listeners.delete(listener);
        },
        onLost: (listener) => void lost.push(listener),
        send: (message) => {
            if (!exited) child.postMessage(message);
        },
        stop: async (limitMs) => {
            stopping = true;
            if (exited) return;
            child.kill();
            await Promise.race([
                gone,
                new Promise<void>((resolve) => setTimeout(resolve, limitMs))
            ]);
        }
    };
}
