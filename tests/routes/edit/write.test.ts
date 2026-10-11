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
import { APP_HEADER, KIND_HEADER } from '../../../src/lib/data/helpers/files/apps/apps.ts';
import { handleWrite } from '../../../src/lib/server/edit/writes.ts';
import {
    GOOD,
    MANIFEST,
    PERSONAL_MANIFEST,
    REPOSITORY_ID,
    TOKEN,
    manifestOf,
    personalTarget,
    repositoryTarget,
    request,
    secondHubPersonal,
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

    it("writes a second hub's personal project in that hub's file and no other", async () => {
        const planted = secondHubPersonal();
        const body = { kind: 'manifest', id: 'two:idea', fields: { snooze: '2026-12-01' } };
        const response = await handleWrite(request(body), TOKEN, planted.into);
        expect(response.status).toBe(200);
        expect(readFileSync(planted.second, 'utf8')).toBe(
            PERSONAL_MANIFEST.replace('2026-11-01', '2026-12-01')
        );
        expect(readFileSync(planted.files.idea, 'utf8')).toBe(PERSONAL_MANIFEST);
        expect(readFileSync(planted.files.r, 'utf8')).toBe(PERSONAL_MANIFEST);
    });

    it('writes a project of any tier in its own file and no other, and answers an app not found for a repository', async () => {
        const hubSide = personalTarget();
        const planted = repositoryTarget(hubSide.into);
        const { into, dir, file } = planted;
        const projects = [
            {
                id: 'alpha',
                file: join(into.hub, 'projects', 'manuscripts', 'alpha', 'project.yml')
            },
            { id: 'idea', file: hubSide.files.idea },
            { id: 'r', file: hubSide.files.r },
            { id: REPOSITORY_ID, file }
        ];
        const edits = [
            {
                field: 'next',
                value: 'write it up',
                line: (text: string) => `${text}next: write it up\n`
            },
            {
                field: 'tier',
                value: 'coauthor',
                line: (text: string) => text.replace(/^tier: .*$/m, 'tier: coauthor')
            },
            {
                field: 'type',
                value: 'paused-stage',
                line: (text: string) => text.replace(/^type: .*$/m, 'type: paused-stage')
            }
        ];
        for (const one of projects) {
            for (const edit of edits) {
                const held = projects.map((other) => readFileSync(other.file, 'utf8'));
                const body = { kind: 'manifest', id: one.id, fields: { [edit.field]: edit.value } };
                const row = `${one.id}: ${edit.field}`;
                const response = await handleWrite(request(body), TOKEN, into);
                expect(response.status, row).toBe(200);
                expect(await response.json(), row).toMatchObject({ refused: [] });
                projects.forEach((other, at) => {
                    const now = readFileSync(other.file, 'utf8');
                    expect(now, `${row} in ${other.id}`).toBe(
                        other.id === one.id ? edit.line(held[at]) : held[at]
                    );
                });
                for (const other of projects)
                    writeFileSync(other.file, held[projects.indexOf(other)]);
            }
            const before = readFileSync(one.file, 'utf8');
            const id = await handleWrite(
                request({ kind: 'manifest', id: one.id, fields: { id: 'renamed' } }),
                TOKEN,
                into
            );
            const outcome = (await id.json()) as {
                changed: string[];
                refused: { field: string }[];
            };
            expect(outcome.changed, one.id).toEqual([]);
            expect(
                outcome.refused.map((item) => item.field),
                one.id
            ).toEqual(['id']);
            expect(readFileSync(one.file, 'utf8'), one.id).toBe(before);
        }

        const body = { kind: 'manifest', id: REPOSITORY_ID, fields: { next: 'x' } };
        const apps = routeSetup({ machine: notesFiles(`${APP_MANIFEST}writes: [manifest]\n`) });
        const held = { ...into, apps: { held: apps.held, data: join(dir, 'data'), maxKb: 256 } };
        const headers = { [APP_HEADER]: 'app:notes', [KIND_HEADER]: 'manifest' };
        const before = readFileSync(file, 'utf8');
        const app = await handleWrite(request(body, headers), TOKEN, held);
        expect(app.status).toBe(404);
        expect(readFileSync(file, 'utf8')).toBe(before);

        const removed = repositoryTarget(target(), false);
        const without = await handleWrite(request(body), TOKEN, removed.into);
        expect(without.status).toBe(404);
    });
});
