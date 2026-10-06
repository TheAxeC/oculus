// Layer 2, server. The command line the built server is started with, read as a pure function so
// every rule of it is tested without starting a process.
//
// The main flag is `--engine <dir>`, naming the directory that holds `config/`; the whole of what
// the server needs is in that directory, so nothing is read from the environment. A run that must
// not write the checkout's own configuration points this at a copy. `--default-port <n>` is the
// port a missing local.yml means; the desktop host passes it, so the port it expects the server on
// is the port the server takes. `--handler <file>` is the built handler the server loads, which the
// desktop host points at the app's own build (`build-app/handler.js`); without it the server loads
// the handler of `npm run build`.

import { resolve } from 'node:path';
import { parseArgs } from 'node:util';

export type EngineArgs =
    { engine: string; defaultPort?: number; handler?: string } | { error: string };

/** The flag that names the engine, in the two spellings a command line writes it in. */
const FLAG = '--engine';

/** The flag that names the port a missing local.yml means. */
const PORT_FLAG = '--default-port';

/** The flag that names the built handler the server loads. */
const HANDLER_FLAG = '--handler';

export type ArgsReader = {
    /** The directory a relative path is resolved against, which is where the command was typed. */
    cwd: string;
    /**
     * The engine a command line naming no flag means: the directory the server's own files sit in.
     */
    fallback: string;
    /** Whether a directory holds `config/`; the start refuses one that does not. */
    hasConfig: (dir: string) => boolean;
    /** Whether a path is a file; the start refuses a handler that is not one. */
    isFile: (path: string) => boolean;
};

/**
 * The engine directory one command line names, or the sentence the start prints before it exits.
 *
 * `--engine <dir>` and `--engine=<dir>` are the same thing; a relative directory is resolved
 * against the directory the command was typed in, so the path means what it looks like. Anything
 * else on the line is an error naming it, since a flag the server ignores is a setting the reader
 * thinks holds. A value beginning with `--` is another flag rather than a directory, so it is the
 * same error as an empty one: without that, `--engine --port` would read `--port` as the path and
 * the refusal would name a folder nobody typed. The line naming `--engine` twice takes the last of
 * them, as a shell takes the last redirection. A directory without `config/` is an error too: a
 * server over nothing is not a server, and a flag pointing at nothing is a typo rather than a
 * request for an empty configuration. `--default-port <n>` is a whole port number from 1 to 65535;
 * anything else is an error, and the line naming it twice takes the last. `--handler <file>` and
 * `--handler=<file>` name the built handler, resolved against the directory the command was typed
 * in like the engine; an empty value or one beginning with `--` is an error as for `--engine`, the
 * line naming it twice takes the last, and a last value that names no file, a missing path or a
 * directory, is an error naming the resolved path.
 */
export function parseEngineArgs(argv: string[], reader: ArgsReader): EngineArgs {
    const missing = { error: `${FLAG} needs the directory that holds config/` };
    /** A value a flag cannot mean: nothing at all, or the next flag on the line. */
    const notAValue = (value: string): boolean => value === '' || value.startsWith('--');
    const { tokens } = parseArgs({
        args: argv,
        options: {
            engine: { type: 'string' },
            'default-port': { type: 'string' },
            handler: { type: 'string' }
        },
        strict: false,
        allowPositionals: true,
        tokens: true
    });
    let named: string | null = null;
    let defaultPort: number | undefined;
    let handler: string | null = null;
    for (const token of tokens) {
        if (token.kind === 'option' && token.rawName === FLAG) {
            const value = token.value ?? '';
            if (notAValue(value)) return missing;
            named = value;
            continue;
        }
        if (token.kind === 'option' && token.rawName === PORT_FLAG) {
            defaultPort = Number(token.value);
            if (!Number.isInteger(defaultPort) || defaultPort < 1 || defaultPort > 65535) {
                return { error: `${PORT_FLAG} needs a port number` };
            }
            continue;
        }
        if (token.kind === 'option' && token.rawName === HANDLER_FLAG) {
            const value = token.value ?? '';
            if (notAValue(value))
                return { error: `${HANDLER_FLAG} needs the file that holds the handler` };
            handler = value;
            continue;
        }
        return { error: `unknown argument: ${argv[token.index]}` };
    }
    const engine = named === null ? reader.fallback : resolve(reader.cwd, named);
    if (!reader.hasConfig(engine)) {
        return { error: `${engine} holds no config/ folder, so there is nothing to serve` };
    }
    const handlerFile = handler === null ? undefined : resolve(reader.cwd, handler);
    if (handlerFile !== undefined && !reader.isFile(handlerFile)) {
        return { error: `${handlerFile} is no file, so there is no handler to load` };
    }
    return {
        engine,
        ...(defaultPort === undefined ? {} : { defaultPort }),
        ...(handlerFile === undefined ? {} : { handler: handlerFile })
    };
}
