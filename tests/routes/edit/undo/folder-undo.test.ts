// Layer 2, route tests. Taking back a write to the project of a folder of the workspace: a folder
// outside every hub, and a folder inside the primary hub or a second hub and outside every scan
// folder. Each write lands in the folder's own `.oculus/project.yml` alone, and its undo puts that
// file back as it was.
//
// The hubs, the folders and the change log are the fixture beside undo.test.ts
// (tests/routes/edit/write-fixture.ts), all under the system temporary directory, so no case here
// reaches ~/.oculus or the checkout. A hook loads the configuration once, since the first load
// costs more than a later one, so no case pays for it.
// @module-tag slow: its cases time out under the load of a full npm test, so npm test leaves it
// out.

import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect } from 'vitest';
import {
    changesOf,
    insideHubTarget,
    made,
    REPOSITORY_ID,
    repositoryTarget,
    undone,
    warmConfig
} from '../write-fixture.ts';
import { it, test } from '../../../fixtures/scratch.ts';

test.beforeAll(warmConfig);

describe('taking back a write to the project of a folder of the workspace', () => {
    /** The writes to the project of a folder of the workspace that the undo takes back. */
    const FOLDER_ROWS = [
        {
            name: 'a snooze set',
            body: { kind: 'manifest', id: `hub:${REPOSITORY_ID}`, fields: { snooze: '2026-12-01' } }
        },
        {
            name: 'a tick',
            body: {
                kind: 'subtask',
                target: { id: `hub:${REPOSITORY_ID}` },
                key: '0',
                action: 'done'
            }
        }
    ];

    it.each(FOLDER_ROWS)(
        'writes the project of a folder of the workspace in its own file only, and takes it back: $name',
        async (row) => {
            const { into, file } = repositoryTarget();
            const hubFile = join(into.hub, 'projects', 'manuscripts', 'alpha', 'project.yml');
            const original = readFileSync(file, 'utf8');
            const hubOriginal = readFileSync(hubFile, 'utf8');
            const change = await made(into, row.body, row.name);
            expect(readFileSync(file, 'utf8'), row.name).not.toBe(original);
            expect(readFileSync(hubFile, 'utf8'), row.name).toBe(hubOriginal);

            const response = await undone(into, change);
            expect(response.status, row.name).toBe(200);
            expect(readFileSync(file, 'utf8'), row.name).toBe(original);
            expect(readFileSync(hubFile, 'utf8'), row.name).toBe(hubOriginal);
        }
    );

    /**
     * The writes to the project of a folder of the workspace that lies inside a hub and outside
     * every scan folder: a field of the manifest editor, a snooze, a follow-up done, Pin, a tick,
     * an added line, an added follow-up, the people of the done note set, that note deleted, and
     * the first note deleted, which the undo puts back before the other, each made with the folder
     * inside the primary hub and inside a second hub.
     */
    const INSIDE_ROWS = [
        {
            name: 'a field of the manifest editor',
            body: {
                kind: 'manifest',
                id: `hub:${REPOSITORY_ID}`,
                fields: { 'status.line': 'a new line' }
            }
        },
        {
            name: 'a snooze set',
            body: { kind: 'manifest', id: `hub:${REPOSITORY_ID}`, fields: { snooze: '2026-12-01' } }
        },
        {
            name: 'a follow-up done',
            body: {
                kind: 'followup',
                target: { id: `hub:${REPOSITORY_ID}` },
                key: '0',
                action: 'done'
            }
        },
        {
            name: 'Pin',
            body: { kind: 'manifest', id: `hub:${REPOSITORY_ID}`, fields: { pin: true } }
        },
        {
            name: 'a tick',
            body: {
                kind: 'subtask',
                target: { id: `hub:${REPOSITORY_ID}` },
                key: '0',
                action: 'done'
            }
        },
        {
            name: 'an added line',
            body: {
                kind: 'subtask-add',
                target: { id: `hub:${REPOSITORY_ID}` },
                fields: { do: 'test it' }
            }
        },
        {
            name: 'an added follow-up',
            body: {
                kind: 'followup-add',
                target: { id: `hub:${REPOSITORY_ID}` },
                fields: { do: 'call Ann' }
            }
        },
        {
            name: 'a people write on a follow-up note',
            body: {
                kind: 'followup',
                target: { id: `hub:${REPOSITORY_ID}` },
                key: '1',
                action: 'supervisors',
                value: ['ann', 'bob']
            }
        },
        {
            name: 'a follow-up deleted',
            body: {
                kind: 'followup',
                target: { id: `hub:${REPOSITORY_ID}` },
                key: '1',
                action: 'delete'
            }
        },
        {
            name: 'a follow-up deleted before another',
            body: {
                kind: 'followup',
                target: { id: `hub:${REPOSITORY_ID}` },
                key: '0',
                action: 'delete'
            }
        }
    ];

    const PLACED_ROWS = INSIDE_ROWS.flatMap((row) => [
        { ...row, hub: 'the primary hub', second: false },
        { ...row, hub: 'a second hub', second: true }
    ]);

    it.each(PLACED_ROWS)(
        'writes the project of a folder of the workspace inside $hub and outside every scan folder in its own file, and takes it back: $name',
        { tags: ['slow'] },
        async (row) => {
            const { into, file } = insideHubTarget(undefined, row.second);
            const original = readFileSync(file, 'utf8');
            const change = await made(into, row.body, row.name);
            expect(resolve(change.file), row.name).toBe(resolve(file));
            expect(readFileSync(file, 'utf8'), row.name).not.toBe(original);

            const response = await undone(into, change);
            expect(response.status, row.name).toBe(200);
            expect(readFileSync(file, 'utf8'), row.name).toBe(original);
            expect(changesOf(into)[0], row.name).toMatchObject({ undoes: change.at });
        }
    );
});
