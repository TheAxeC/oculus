// Layer 2, route tests. What the /api/write route answers. The route itself is a single line
// handing the request to lib/server/edit/writes.ts with the token ServerContext minted, which is
// what this calls: handleWrite takes a Request, the token and the hub to write in, so every case
// here is one Request object.
//
// The hub is synthetic, under the system temporary directory, and every path written is asserted to
// be inside it first. What this does NOT cover: the token actually reaching the page, and Kit
// putting it on the event.
//
// A hook loads the configuration once, since the first load costs more than a later one, so no case
// pays for it.

import { readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { describe, expect } from 'vitest';
import { APP_HEADER, KIND_HEADER } from '../../../src/lib/data/helpers/files/apps.ts';
import { handleWrite } from '../../../src/lib/server/edit/writes.ts';
import {
    GOOD,
    MANIFEST,
    REPOSITORY_ID,
    REPOSITORY_MANIFEST,
    SIDE_MANIFEST,
    TOKEN,
    manifestOf,
    repositoryTarget,
    request,
    secondHubSide,
    target,
    warmConfig
} from './write-fixture.ts';
import { it, test } from '../../fixtures/scratch.ts';
import { MANIFEST as APP_MANIFEST, notesFiles, routeSetup } from '../apps/apps-fixture.ts';

test.beforeAll(warmConfig);

describe('the write endpoint', () => {
    it('refuses a request with no token', async () => {
        const into = target();
        const response = await handleWrite(request(GOOD, { 'x-oculus-token': '' }), TOKEN, into);
        expect(response.status).toBe(403);
        expect(await response.json()).toEqual({ error: 'The write token is missing or stale' });
        expect(manifestOf(into)).toBe(MANIFEST);
    });

    it('answers a session write over an overrides file it cannot read with the refusal', async () => {
        const into = target();
        const path = into.overrides ?? '';
        writeFileSync(path, '{"sessions": ');
        const response = await handleWrite(
            request({ kind: 'session', id: 'sess-1', hidden: true }),
            TOKEN,
            into
        );
        const body = (await response.json()) as { changed: string[]; refused: unknown[] };
        expect(body.changed).toEqual([]);
        expect(body.refused).toEqual([
            { field: 'hidden', reason: `${basename(path)} is not JSON: ${path}` }
        ]);
        expect(readFileSync(path, 'utf8')).toBe('{"sessions": ');
    });

    it("writes a second hub's side project in that hub's file and no other", async () => {
        const planted = secondHubSide();
        const body = { kind: 'manifest', id: 'two:side:idea', fields: { snooze: '2026-12-01' } };
        const response = await handleWrite(request(body), TOKEN, planted.into);
        expect(response.status).toBe(200);
        expect(readFileSync(planted.second, 'utf8')).toBe(
            SIDE_MANIFEST.replace('2026-11-01', '2026-12-01')
        );
        expect(readFileSync(planted.files['side:idea'], 'utf8')).toBe(SIDE_MANIFEST);
        expect(readFileSync(planted.files['root:r'], 'utf8')).toBe(SIDE_MANIFEST);
    });

    it("writes a repository's research project in its .oculus/project.yml and no other, and answers an app not found", async () => {
        const planted = repositoryTarget();
        const { into, dir, file } = planted;
        const hubManifest = manifestOf(into);
        const body = { kind: 'manifest', id: REPOSITORY_ID, fields: { next: 'write it up' } };

        const page = await handleWrite(request(body), TOKEN, into);
        expect(page.status).toBe(200);
        const written = readFileSync(file, 'utf8');
        expect(written).toBe(`${REPOSITORY_MANIFEST}next: write it up\n`);
        expect(readFileSync(join(dir, 'README.md'), 'utf8')).toBe('# A repository\n');
        expect(manifestOf(into)).toBe(hubManifest);

        const apps = routeSetup({ machine: notesFiles(`${APP_MANIFEST}writes: [manifest]\n`) });
        const held = { ...into, apps: { held: apps.held, data: join(dir, 'data'), maxKb: 256 } };
        const headers = { [APP_HEADER]: 'app:notes', [KIND_HEADER]: 'manifest' };
        const app = await handleWrite(
            request({ ...body, fields: { next: 'x' } }, headers),
            TOKEN,
            held
        );
        expect(app.status).toBe(404);
        expect(readFileSync(file, 'utf8')).toBe(written);

        const removed = repositoryTarget(target(), null);
        const before = readFileSync(removed.file, 'utf8');
        const without = await handleWrite(request(body), TOKEN, removed.into);
        expect(without.status).toBe(404);
        expect(readFileSync(removed.file, 'utf8')).toBe(before);
    });
});
