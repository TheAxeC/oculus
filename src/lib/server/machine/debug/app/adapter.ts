// Layer 2, server. One debug adapter as the client holds it, whatever carries its messages: the
// child process of the oculus adapter (`rite_dap`, its messages framed on the standard streams) or
// the stream an app's host opened for its debugger's adapter (its messages as objects). The client
// speaks the protocol to the `wire` and learns of the adapter's end, its error text and its
// failure through the listeners; what ends the adapter (a signal to the child, the close of the
// stream) is `kill`.

import type { Child } from '../../lsp/held/process.ts';
import { openCarrier, openWire, type Wire, type WireHandlers } from '../wire.ts';
import type { AppCarrier } from './port.ts';

/** One adapter. */
export type Adapter = {
    readonly kind: 'rite' | 'app';
    /** The process id of the oculus adapter, 0 for an app's. */
    readonly pid: number;
    readonly wire: Wire;
    /** Hear the text the adapter writes outside the protocol. */
    onStderr(listener: (text: string) => void): void;
    /** Hear the adapter end: its exit code and the signal that ended it. */
    onExit(listener: (code: number | null, signal: NodeJS.Signals | null) => void): void;
    /** Hear that the adapter could not be started or broke. */
    onError(listener: (error: unknown) => void): void;
    /** End the adapter: a signal to the child, or the close of the stream. */
    kill(signal: 'SIGTERM' | 'SIGKILL'): void;
};

/** The oculus adapter as a spawned child. */
export function childAdapter(child: Child, handlers: WireHandlers): Adapter {
    child.stdin.on('error', () => undefined);
    return {
        kind: 'rite',
        pid: child.pid ?? 0,
        wire: openWire(child.stdout, child.stdin, handlers),
        onStderr: (listener) =>
            child.stderr.on('data', (chunk: Buffer | string) => listener(String(chunk))),
        onExit: (listener) => child.on('exit', listener),
        onError: (listener) => child.on('error', listener),
        kill: (signal) => void child.kill(signal)
    };
}

/** An app's adapter as the stream its host opened. */
export function carrierAdapter(carrier: AppCarrier, handlers: WireHandlers): Adapter {
    return {
        kind: 'app',
        pid: 0,
        wire: openCarrier(
            {
                write: (message) => {
                    carrier.send(message);
                    return Promise.resolve();
                },
                listen: (listener) =>
                    carrier.onMessage((message) => listener(message as unknown as never)),
                onError: () => undefined,
                onPartial: () => undefined,
                dispose: () => undefined
            },
            handlers
        ),
        onStderr: (listener) => carrier.onStderr(listener),
        onExit: (listener) => carrier.onClose((code) => listener(code, null)),
        onError: () => undefined,
        kill: () => carrier.close()
    };
}
