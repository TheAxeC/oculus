// Layer 2, route tests. Taking back a config-value write by putting the file's own text back: the
// record of a write carries the lines it replaced and the lines it put in their place with the
// offset where they start, and an undo that finds exactly those lines there writes the earlier text
// back, so a file whose columns are aligned comes back byte for byte. A record without the text
// goes through the value write, and a value edited since is refused.
//
// The engine is a scratch copy of the checkout's config/ folder (write-fixture.ts), so no case here
// writes the checkout's config or reads the machine's own file. What this does NOT cover: the
// editors that send the write, which the Settings tests and the look cover.
// @module-tag slow: every case takes 410 ms or more to write and take back a value.

import { readFileSync, writeFileSync } from 'node:fs';
import { describe, expect } from 'vitest';
import { parse } from 'yaml';
import { handleWrite } from '../../../../src/lib/server/edit/writes.ts';
import type { WriteTarget } from '../../../../src/lib/server/edit/writes.ts';
import { it } from '../../../fixtures/scratch.ts';
import {
    TOKEN,
    changesOf,
    configTarget,
    engineFile,
    request,
    scratchEngine,
    undone,
    undoneBack,
    undoneMoved
} from '../write-fixture.ts';

/** A scratch engine, its target and the sources file the cases write. */
function sources(): { into: WriteTarget; file: string } {
    const engine = scratchEngine();
    return { into: configTarget(engine), file: engineFile(engine, 'sources.yml') };
}

/** The `languages:` value of a sources file as it is now. */
function languagesOf(file: string): unknown {
    return (parse(readFileSync(file, 'utf8')) as { languages: unknown }).languages;
}

/** One config-value write of the languages, as the page sends it. */
function send(into: WriteTarget, file: string, value: unknown): Promise<Response> {
    const body = { kind: 'config-value', file: 'sources.yml', key: 'languages', value };
    return handleWrite(request({ ...body, base: languagesOf(file) }), TOKEN, into);
}

/** Change every line of the log with `edit`, the way an older or a damaged line would read. */
function reshape(into: WriteTarget, edit: (record: Record<string, unknown>) => void): void {
    const log = into.changes?.file;
    if (log === undefined) throw new Error('the target keeps no change log');
    const lines = readFileSync(log, 'utf8').trim().split('\n');
    const rewritten = lines.map((line) => {
        const record = JSON.parse(line) as Record<string, unknown>;
        edit(record);
        return JSON.stringify(record);
    });
    writeFileSync(log, `${rewritten.join('\n')}\n`);
}

describe('a config-value write of an aligned family, undone', () => {
    // Red when the undo rebuilds the key's lines from its value, which writes each entry again
    // with a single space after the colon where the file aligned them, or loses a CRLF line end.
    it.each([
        ['as written', (text: string) => text],
        ['with CRLF line ends', (text: string) => text.replace(/\r?\n/g, '\r\n')]
    ])('gives the file back byte for byte, %s', async (_name, lineEnds) => {
        const { into, file } = sources();
        writeFileSync(file, lineEnds(readFileSync(file, 'utf8')));
        const before = readFileSync(file, 'utf8');
        expect((await send(into, file, {})).status).toBe(200);
        expect(readFileSync(file, 'utf8')).not.toBe(before);
        const [change] = changesOf(into);

        await undoneBack(into, change, file, before);
    });

    it('gives the undo of the undo back byte for byte as well', async () => {
        const { into, file } = sources();
        const before = readFileSync(file, 'utf8');
        await send(into, file, {});
        const written = readFileSync(file, 'utf8');
        const [change] = changesOf(into);
        const back = await undoneBack(into, change, file, before);

        await undoneBack(into, back, file, written);
    });
});

describe('an undo with no text to put back', () => {
    /** The value the write took the languages from, to compare what an undo leaves. */
    const keepsValue = async (into: WriteTarget, file: string, value: unknown) => {
        const [change] = changesOf(into);
        const response = await undone(into, change);
        expect(response.status).toBe(200);
        expect(languagesOf(file)).toEqual(value);
    };

    it('goes through the value write for a record without the text', async () => {
        const { into, file } = sources();
        const value = languagesOf(file);
        await send(into, file, {});
        reshape(into, (record) => delete record.replaced);

        await keepsValue(into, file, value);
    });

    it('refuses an undo when the value at the key changed since', async () => {
        const { into, file } = sources();
        await send(into, file, {});
        const [change] = changesOf(into);
        await send(into, file, { lua: ['.lua'] });
        const held = readFileSync(file, 'utf8');

        await undoneMoved(into, change, file, held);
    });
});
