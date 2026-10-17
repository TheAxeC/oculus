// Layer 2, server tests. The built handler behind `withMissingFiles`: a file of the built page that
// a later build removed is answered 404 and never reaches the adapter's static server, which would
// end the process on it; a file on disk and every other path reach the handler as they came.

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { withMissingFiles } from '../../../../src/lib/server/root/process/serve.ts';

const folders: string[] = [];
afterEach(() => {
    for (const folder of folders.splice(0)) rmSync(folder, { recursive: true, force: true });
});

/** A client folder holding `_app/immutable/entry/start.kept.js`. */
function client(): string {
    const root = mkdtempSync(join(tmpdir(), 'oculus-missing-'));
    folders.push(root);
    mkdirSync(join(root, '_app', 'immutable', 'entry'), { recursive: true });
    writeFileSync(join(root, '_app', 'immutable', 'entry', 'start.kept.js'), 'export {};\n');
    return root;
}

/** Run one request through the wrapped handler: the status it ended with and whether it passed. */
function ask(folder: string, url: string): { status: number; passed: boolean } {
    let passed = false;
    const res = { statusCode: 200, end: () => undefined } as unknown as ServerResponse;
    withMissingFiles(folder, () => {
        passed = true;
    })({ url } as IncomingMessage, res);
    return { status: res.statusCode, passed };
}

describe('withMissingFiles', () => {
    it('answers 404 for a file of the built page that is not on disk', () => {
        expect(ask(client(), '/_app/immutable/entry/start.gone.js')).toEqual({
            status: 404,
            passed: false
        });
    });

    it('hands a file of the built page that is on disk to the handler', () => {
        expect(ask(client(), '/_app/immutable/entry/start.kept.js?v=1')).toEqual({
            status: 200,
            passed: true
        });
    });

    it('answers 404 for a path that leaves the client folder', () => {
        expect(ask(client(), '/_app/..%2f..%2f..%2fetc%2fpasswd')).toEqual({
            status: 404,
            passed: false
        });
    });

    it('hands every other path to the handler', () => {
        expect(ask(client(), '/api/fs?root=hub')).toEqual({ status: 200, passed: true });
        expect(ask(client(), '/')).toEqual({ status: 200, passed: true });
    });
});
