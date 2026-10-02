// Layer 2, server tests. The command line the built server is started with. The parser is a pure
// function over the argument list, so every rule of it is a case here and none of them starts a
// process; that a started server reads the directory it was given is the package's own
// verification, which stands one up over a temporary engine directory and reads the page back.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseEngineArgs } from '../../../../src/lib/server/root/process/args.ts';
import { engineDir } from '../../../../src/lib/data/sources/config.ts';

/** The engine a command line naming no flag means, for the cases that do not name one. */
const FALLBACK = '/opt/oculus';

/** A reader saying every directory holds config/, so the argument rules are read on their own. */
function reader(cwd = '/work', holds: (dir: string) => boolean = () => true) {
    return { cwd, fallback: FALLBACK, hasConfig: holds };
}

describe('the engine argument', () => {
    it('is the directory --engine names, in both spellings', () => {
        expect(parseEngineArgs(['--engine', '/srv/engine'], reader())).toEqual({
            engine: '/srv/engine'
        });
        expect(parseEngineArgs(['--engine=/srv/engine'], reader())).toEqual({
            engine: '/srv/engine'
        });
    });

    it('resolves a relative directory against the working directory', () => {
        expect(parseEngineArgs(['--engine', 'copy'], reader('/work'))).toEqual({
            engine: '/work/copy'
        });
        expect(parseEngineArgs(['--engine=../copy'], reader('/work/here'))).toEqual({
            engine: '/work/copy'
        });
    });

    it('is the fallback when the line names no flag', () => {
        expect(parseEngineArgs([], reader())).toEqual({ engine: FALLBACK });
    });

    it('is refused when the named directory holds no config folder', () => {
        expect(
            parseEngineArgs(
                ['--engine', '/srv/empty'],
                reader('/work', () => false)
            )
        ).toEqual({
            error: '/srv/empty holds no config/ folder, so there is nothing to serve'
        });
    });

    it('asks the same of the fallback, so a start over nothing is refused too', () => {
        expect(
            parseEngineArgs(
                [],
                reader('/work', () => false)
            )
        ).toEqual({
            error: `${FALLBACK} holds no config/ folder, so there is nothing to serve`
        });
    });

    it('is refused when --engine names nothing', () => {
        const sentence = '--engine needs the directory that holds config/';
        expect(parseEngineArgs(['--engine'], reader())).toEqual({ error: sentence });
        expect(parseEngineArgs(['--engine='], reader())).toEqual({ error: sentence });
    });

    it('is refused when the next word is another flag rather than a directory', () => {
        // Without this the refusal would name /work/--port, a folder nobody typed, instead of the
        // flag that was left without one.
        const sentence = '--engine needs the directory that holds config/';
        expect(parseEngineArgs(['--engine', '--port'], reader())).toEqual({ error: sentence });
        expect(parseEngineArgs(['--engine=--port'], reader())).toEqual({ error: sentence });
    });

    it('takes the last of two --engine flags', () => {
        expect(parseEngineArgs(['--engine', '/srv/one', '--engine', '/srv/two'], reader())).toEqual(
            {
                engine: '/srv/two'
            }
        );
        expect(parseEngineArgs(['--engine=/srv/one', '--engine=/srv/two'], reader())).toEqual({
            engine: '/srv/two'
        });
    });

    it('reads a relative directory, the last of two flags, and refuses a stray word', () => {
        expect(parseEngineArgs(['--engine', 'x'], reader('/work'))).toEqual({ engine: '/work/x' });
        expect(parseEngineArgs(['--engine=x'], reader('/work'))).toEqual({ engine: '/work/x' });
        expect(parseEngineArgs(['--engine', 'a', '--engine', 'b'], reader('/work'))).toEqual({
            engine: '/work/b'
        });
        expect(parseEngineArgs(['stray'], reader())).toEqual({
            error: 'unknown argument: stray'
        });
    });

    it('refuses any other argument, naming it', () => {
        expect(parseEngineArgs(['--port', '8791'], reader())).toEqual({
            error: 'unknown argument: --port'
        });
        expect(parseEngineArgs(['/srv/engine'], reader())).toEqual({
            error: 'unknown argument: /srv/engine'
        });
    });

    it('names the argument as it was typed, and reads a single-dash word as the directory', () => {
        for (const typed of ['-abc', '--port=3', '--', '-']) {
            expect(parseEngineArgs([typed], reader())).toEqual({
                error: `unknown argument: ${typed}`
            });
        }
        expect(parseEngineArgs(['--engine', '-x'], reader('/work'))).toEqual({
            engine: '/work/-x'
        });
    });
});

// A mistyped flag must cost nothing: no module loaded and no port opened. The start reads its
// arguments first, which is a fact about the file rather than about a run, so it is read as one.
describe('the start', () => {
    const source = readFileSync(join(engineDir(), 'src', 'server.ts'), 'utf8');

    it('reads the arguments before it imports the built handler', () => {
        const parsed = source.indexOf('parseEngineArgs(process.argv.slice(2)');
        const loaded = source.indexOf('await import(');
        expect(parsed).toBeGreaterThan(-1);
        expect(loaded).toBeGreaterThan(parsed);
    });

    // An audit: the entry is read as source. What a request, a move and a close do through the
    // wiring is held by serve.test.ts over a real server.
    it('builds its context over the directory the arguments named', () => {
        expect(source).toContain('createServerContext(parsed.engine, {}, portMove)');
    });
});
