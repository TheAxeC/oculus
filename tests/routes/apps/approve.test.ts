// Layer 2, route tests. POST /api/approve (lib/server/machine/apps/routes.ts `handleApprovePost`,
// which src/routes/api/(apps)/approve/+server.ts calls): an approval of the hash the reader was
// shown, a revoke by folder, and the write token that guards both.
//
// The approvals file and every app folder are synthetic, under the system temporary directory; a
// case never reads or writes `~/.oculus`. What this does NOT cover: the origin guard of
// src/hooks.server.ts, which answers a request from another page before this runs.

import { readFileSync, statSync, writeFileSync } from 'node:fs';
import { describe, expect } from 'vitest';
import { TOKEN_HEADER } from '../../../src/lib/server/core/auth.ts';
import { approvedApps } from '../../../src/lib/server/machine/approvals/approvals.ts';
import { appById, type AppsHeld } from '../../../src/lib/server/machine/apps/held.ts';
import { handleApprovePost } from '../../../src/lib/server/machine/apps/routes.ts';
import { it } from '../../fixtures/scratch.ts';
import { MANIFEST, notesFiles, PAGE, plant, routeSetup, type RouteSetup } from './apps-fixture.ts';

const TOKEN = 'token';

let setup: RouteSetup;

/** The apps of `planted` read from the disk the way the watcher reads them. */
function start(planted: Parameters<typeof plant>[0]): void {
    setup = routeSetup(planted);
}

const held = (): AppsHeld => setup.held();

/** POST the body with the token, or without it. */
function post(body: unknown, token: string | null = TOKEN): Promise<Response> {
    const headers: Record<string, string> = { 'content-type': 'application/json' };
    if (token !== null) headers[TOKEN_HEADER] = token;
    return handleApprovePost(
        new Request('http://localhost:8787/api/approve', {
            method: 'POST',
            headers,
            body: typeof body === 'string' ? body : JSON.stringify(body)
        }),
        TOKEN,
        setup.options
    );
}

const notes = (): ReturnType<typeof appById> => appById(held(), 'app:notes');

const TWO_ROOTS = {
    roots: {
        one: { '.oculus/apps/notes/app.yml': MANIFEST, '.oculus/apps/notes/index.html': PAGE },
        two: { '.oculus/apps/notes/app.yml': MANIFEST, '.oculus/apps/notes/index.html': PAGE }
    }
};

/** One row of a table: what is posted, the outcome observed, and the outcome expected. */
type Row = [string, () => unknown, unknown];

/** The answer's status and body, and whether the approvals file exists. */
async function answered(answer: Response) {
    return { status: answer.status, body: (await answer.json()) as unknown, written: written() };
}

function written(): boolean {
    try {
        statSync(setup.approvals);
        return true;
    } catch {
        return false;
    }
}

const NOTES_ONLY = { machine: notesFiles() };
const hashOf = (): string => notes()?.row.hash ?? '';

const APPROVALS: Row[] = [
    [
        'the hash the reader was shown, which sets the key before it answers',
        async () => {
            start(NOTES_ONLY);
            const hash = hashOf();
            const keyBefore = notes()?.row.key;
            const answer = await post({ action: 'approve', view: 'app:notes', hash });
            const file = JSON.parse(readFileSync(setup.approvals, 'utf8')) as {
                approved: Record<string, { folder: string }>;
            };
            return {
                keyBefore,
                status: answer.status,
                body: (await answer.json()) as unknown,
                folderRecorded: file.approved[`app:${hash}`].folder === notes()?.row.folder,
                mode: statSync(setup.approvals).mode & 0o777,
                approved: notes()?.row.approved,
                keyShape: /^[0-9a-f]{32}$/.test(notes()?.row.key ?? '')
            };
        },
        {
            keyBefore: '',
            status: 200,
            body: { ok: true },
            folderRecorded: true,
            mode: 0o600,
            approved: true,
            keyShape: true
        }
    ],
    [
        'a hash that is not the current one, with 409 changed and nothing written',
        async () => {
            start(NOTES_ONLY);
            const answer = await post({ action: 'approve', view: 'app:notes', hash: 'stale' });
            return { ...(await answered(answer)), approved: notes()?.row.approved };
        },
        { status: 409, body: { error: 'changed' }, written: false, approved: false }
    ],
    ...(
        [
            ['a body that is not JSON', 'not json', 400],
            [
                'an action that is neither approve nor revoke',
                { action: 'keep', view: 'app:notes' },
                400
            ],
            ['a view no row names', { action: 'approve', view: 'app:nonesuch', hash: 'x' }, 404]
        ] as [string, unknown, number][]
    ).map(([label, body, status]): Row => [
        `${label}, with ${status} and nothing written`,
        async () => {
            start(NOTES_ONLY);
            const answer = await post(body);
            return [answer.status, written()];
        },
        [status, false]
    ]),
    [
        'a machine app kept on request, and a root app refused the keep',
        async () => {
            start(NOTES_ONLY);
            const kept = await post({
                action: 'approve',
                view: 'app:notes',
                hash: hashOf(),
                keep: true
            });
            const keptList = [...setup.kept];
            start(TWO_ROOTS);
            const root = appById(held(), 'app:one/notes');
            const refused = await post({
                action: 'approve',
                view: 'app:one/notes',
                hash: root?.row.hash,
                keep: true
            });
            return {
                kept: [kept.status, keptList],
                refused: [refused.status, await refused.json(), written()]
            };
        },
        { kept: [200, ['app:notes']], refused: [400, { error: 'keep' }, false] }
    ],
    [
        'a revoke, which empties the key before it answers',
        async () => {
            start(NOTES_ONLY);
            await post({ action: 'approve', view: 'app:notes', hash: hashOf() });
            const keyBefore = notes()?.row.key !== '';
            const answer = await post({ action: 'revoke', view: 'app:notes' });
            return {
                keyBefore,
                status: answer.status,
                approved: notes()?.row.approved,
                key: notes()?.row.key,
                left: approvedApps(setup.approvals).size
            };
        },
        { keyBefore: true, status: 200, approved: false, key: '', left: 0 }
    ],
    [
        'an approvals file that is not JSON, which approve and revoke leave as it was',
        async () => {
            start(NOTES_ONLY);
            writeFileSync(setup.approvals, 'not json {');
            const approve = await post({ action: 'approve', view: 'app:notes', hash: hashOf() });
            const approveError = ((await approve.json()) as { error: string }).error;
            const revoke = await post({ action: 'revoke', view: 'app:notes' });
            const revokeError = ((await revoke.json()) as { error: string }).error;
            return {
                statuses: [approve.status, revoke.status],
                named: [approveError.includes('not JSON'), revokeError.includes('not JSON')],
                file: readFileSync(setup.approvals, 'utf8')
            };
        },
        { statuses: [409, 409], named: [true, true], file: 'not json {' }
    ],
    [
        'the same files in two roots, one entry per folder, an approval replacing its own folder',
        async () => {
            start(TWO_ROOTS);
            const one = appById(held(), 'app:one/notes');
            const two = appById(held(), 'app:two/notes');
            await post({ action: 'approve', view: 'app:one/notes', hash: one?.row.hash });
            await post({ action: 'approve', view: 'app:two/notes', hash: two?.row.hash });
            const both = [...approvedApps(setup.approvals)].sort();
            await post({ action: 'approve', view: 'app:one/notes', hash: one?.row.hash });
            const again = [...approvedApps(setup.approvals)].sort();
            const answer = await post({ action: 'revoke', view: 'app:one/notes' });
            const hashes = [one?.row.hash, two?.row.hash].sort();
            return {
                hashesDiffer: one?.row.hash !== two?.row.hash,
                both: both.join() === hashes.join(),
                again: again.join() === hashes.join(),
                status: answer.status,
                keys: [
                    appById(held(), 'app:one/notes')?.row.key,
                    appById(held(), 'app:two/notes')?.row.key !== ''
                ],
                left: [...approvedApps(setup.approvals)].join() === String(two?.row.hash)
            };
        },
        { hashesDiffer: true, both: true, again: true, status: 200, keys: ['', true], left: true }
    ]
];

describe('approves only the hash the reader was shown, and revokes by folder', () => {
    it.each(APPROVALS)('%s', async (_row, observe, expected) => {
        expect(await observe()).toEqual(expected);
    });
});

describe('refuses a request without the write token', () => {
    it.each([['no token', null]] as [string, string | null][])(
        '%s, with 403 and nothing written',
        async (_row, token) => {
            start(NOTES_ONLY);
            const answer = await post(
                { action: 'approve', view: 'app:notes', hash: hashOf() },
                token
            );
            expect([answer.status, written()]).toEqual([403, false]);
        }
    );
});
