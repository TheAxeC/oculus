// Layer 2, server. The command line the built server is started with, read as a pure function so
// every rule of it is tested without starting a process.
//
// There is one flag, `--engine <dir>`, naming the directory that holds `config/`; the whole of what
// the server needs is in that directory, so nothing else is a flag and nothing is read from the
// environment. A run that must not write the checkout's own configuration points this at a copy.

import { resolve } from 'node:path';
import { parseArgs } from 'node:util';

export type EngineArgs = { engine: string } | { error: string };

/** The one flag, in the two spellings a command line writes it in. */
const FLAG = '--engine';

export type ArgsReader = {
    /** The directory a relative path is resolved against, which is where the command was typed. */
    cwd: string;
    /**
     * The engine a command line naming no flag means: the directory the server's own files sit in.
     */
    fallback: string;
    /** Whether a directory holds `config/`; the start refuses one that does not. */
    hasConfig: (dir: string) => boolean;
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
 * request for an empty configuration.
 */
export function parseEngineArgs(argv: string[], reader: ArgsReader): EngineArgs {
    const missing = { error: `${FLAG} needs the directory that holds config/` };
    /** A value the flag cannot mean: nothing at all, or the next flag on the line. */
    const notADirectory = (value: string): boolean => value === '' || value.startsWith('--');
    const { tokens } = parseArgs({
        args: argv,
        options: { engine: { type: 'string' } },
        strict: false,
        allowPositionals: true,
        tokens: true
    });
    let named: string | null = null;
    for (const token of tokens) {
        if (token.kind === 'option' && token.rawName === FLAG) {
            const value = token.value ?? '';
            if (notADirectory(value)) return missing;
            named = value;
            continue;
        }
        return { error: `unknown argument: ${argv[token.index]}` };
    }
    const engine = named === null ? reader.fallback : resolve(reader.cwd, named);
    if (!reader.hasConfig(engine)) {
        return { error: `${engine} holds no config/ folder, so there is nothing to serve` };
    }
    return { engine };
}
