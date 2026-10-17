// Layer 4, test helper. The kinds the change log files records under, read out of the source: the
// body kinds of the write endpoint from its parsers, and the kind of every other `logChanges`
// caller under src/lib/server from the call itself.
//
// Two gates are made over it: every kind has a word in the catalog for the History view to draw,
// and the view draws that word rather than the wire's own. Reading the kinds from the source is
// what makes a kind added to writes/bodies.ts fail those gates instead of quietly drawing its wire
// word.

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { FILES_KIND } from '../../src/lib/data/file-ops.ts';
import { engineDir } from '../../src/lib/data/sources/config.ts';
import { APP_STORE } from '../../src/lib/server/edit/writes/apps/store.ts';

/**
 * The kind of the records of the `deck` write, which the log can hold: the History view draws their
 * rows, and an undo of one is answered `deck-gone`.
 */
const RETIRED_KINDS = ['deck'];

/**
 * The arguments of the `logChanges` calls whose kind is not a constant of the calling file: the
 * write endpoint's, which is a body kind (read from bodies.ts), and the file operations' own.
 */
const NOT_CONSTANT = new Set(['change.kind', 'kind', 'FILES_KIND']);

/**
 * The kind of every `logChanges` call under src/lib/server: a string written in the call, or a
 * constant of the calling file the call names. A call whose kind is neither, and not one of
 * NOT_CONSTANT, throws, so a new caller cannot leave the History view without its word unseen.
 */
function callerKinds(): string[] {
    const server = join(engineDir(), 'src', 'lib', 'server');
    const kinds: string[] = [];
    for (const file of readdirSync(server, { recursive: true, encoding: 'utf8' })) {
        if (!file.endsWith('.ts')) continue;
        const source = readFileSync(join(server, file), 'utf8');
        for (const call of source.matchAll(/logChanges\(\s*[\w.]+,\s*([\w.]+|'[a-z-]+')/g)) {
            const kind = call[1];
            if (kind.startsWith("'")) {
                kinds.push(kind.slice(1, -1));
                continue;
            }
            const constant = new RegExp(`const ${kind} = '([a-z-]+)'`).exec(source);
            if (constant !== null) kinds.push(constant[1]);
            else if (!NOT_CONSTANT.has(kind)) {
                throw new Error(`${file}: the kind ${kind} of a logChanges call is not read`);
            }
        }
    }
    return kinds;
}

/**
 * Every kind the change log files a record under: the write endpoint's body kinds, except `undo`,
 * which records as the kind it took back, the file operations' own and the app store's, which the
 * endpoint takes as a `store` body of an app and no `kind`, the `deck` kind of RETIRED_KINDS, and
 * the kinds of the other `logChanges` callers (`callerKinds`).
 */
export function recordedKinds(): string[] {
    const source = readFileSync(
        join(engineDir(), 'src', 'lib', 'server', 'edit', 'writes', 'bodies.ts'),
        'utf8'
    );
    const found = [...source.matchAll(/kind: z\.literal\('([a-z-]+)'\)/g)].map((one) => one[1]);
    return [
        ...new Set([...found, ...RETIRED_KINDS, FILES_KIND, APP_STORE, ...callerKinds()])
    ].filter((kind) => kind !== 'undo');
}
