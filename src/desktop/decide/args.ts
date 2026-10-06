// Layer 2, server (the desktop host). The command line the app is started with. The app takes
// `--engine <dir>` as the server does, with the server's rules (parseEngineArgs). Every other
// argument of the form `--name` or `--name=value` is a Chromium switch, which Electron consumes,
// so it is let through. A positional argument, `--engine` with a wrong value and the server's
// `--default-port` are refused; the first two with the sentence parseEngineArgs gives.

import { parseEngineArgs, type ArgsReader } from '../../lib/server/root/process/args.ts';

/** What the command line asks for. */
export type AppArgs = { engine: string };

/** The flags of oculus's own, which take the next argument as their value when no `=` gives it. */
const OWN_FLAGS: readonly string[] = ['--engine', '--default-port'];

/** Whether an argument is a switch of the form `--name` or `--name=value` that is not oculus's. */
function chromium(arg: string): boolean {
    const name = /^--([^=\s]+)/.exec(arg)?.[1];
    return name !== undefined && !OWN_FLAGS.includes(`--${name}`);
}

/**
 * The app's arguments, or the sentence a dialog quotes. `argv` is the command line after the
 * program (and, for an unpackaged start, after the app's folder).
 */
export function parseAppArgs(argv: string[], reader: ArgsReader): AppArgs | { error: string } {
    const engineArgs: string[] = [];
    for (let at = 0; at < argv.length; at++) {
        const arg = argv[at];
        if (chromium(arg)) continue;
        engineArgs.push(arg);
        // The value of a flag given as the next argument belongs to the flag before it.
        if (OWN_FLAGS.includes(arg) && at + 1 < argv.length) engineArgs.push(argv[++at]);
    }
    const engine = parseEngineArgs(engineArgs, reader);
    if ('error' in engine) return engine;
    if (engine.defaultPort !== undefined) return { error: 'unknown argument: --default-port' };
    return { engine: engine.engine };
}
