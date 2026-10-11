// Layer 2, route tests. What /apps/ answers: an approved app's recorded file, the two shared
// files, and an empty 404 for everything else. The route is the lines of src/routes/apps/ that hand
// the request to serveApp (lib/server/machine/apps/serve/serve.ts), which is what this calls.
//
// Every folder is synthetic, under the system temporary directory. What this does NOT cover: the
// browser applying the policy the answer carries (the scratch-server runs of the step's report
// do), and the origin guard of src/hooks.server.ts, which does not judge this route.

import { chmodSync, utimesSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect } from 'vitest';
import { appPolicy } from '../../../src/lib/server/machine/apps/serve/address.ts';
import { appOf } from '../../../src/lib/server/machine/apps/read/held.ts';
import { serveApp } from '../../../src/lib/server/machine/apps/serve/serve.ts';
import { it } from '../../fixtures/scratch.ts';
import { approvedHeld, notesFiles, PAGE, plant, PORT, serveInput } from './apps-fixture.ts';

const ORIGIN = `http://localhost:${PORT}`;

/** The answer to a request for `path` over the held state. */
function ask(held: ReturnType<typeof approvedHeld>, path: string, init: RequestInit = {}) {
    return serveApp(serveInput(new Request(`${ORIGIN}${path}`, init), held));
}

/** The current key of the machine app `notes`. */
function keyOf(held: ReturnType<typeof approvedHeld>): string {
    return appOf(held, '', 'notes')?.row.key ?? '';
}

/** One row of the table: what is asked, the outcome observed, and the outcome expected. */
type Row = [string, () => unknown, unknown];

/** An answer as a row compares it: its status, its body and every header it carries. */
async function whole(answer: Response) {
    return { status: answer.status, body: await answer.text(), headers: [...answer.headers] };
}

const EMPTY_404 = { status: 404, body: '', headers: [] };

/** The row for a path of the machine app `notes` that answers an empty 404. */
const refused = (label: string, path: (key: string) => string): Row => [
    label,
    async () => {
        const fixture = plant({
            machine: { ...notesFiles(), '.env': 'x', 'notes-old/index.html': PAGE },
            roots: {}
        });
        const held = approvedHeld(fixture);
        return whole(ask(held, path(keyOf(held))));
    },
    EMPTY_404
];

const NOTES = `/apps/notes/`;

const ROWS: Row[] = [
    [
        'an approved app file, with its type, the open headers and the policy',
        async () => {
            const held = approvedHeld(plant({ machine: notesFiles() }));
            const key = keyOf(held);
            const answer = ask(held, `${NOTES}${key}/index.html`);
            const base = `localhost:${PORT}${NOTES}${key}/`;
            return {
                status: answer.status,
                body: await answer.text(),
                type: answer.headers.get('content-type'),
                nosniff: answer.headers.get('x-content-type-options'),
                cache: answer.headers.get('cache-control'),
                cors: answer.headers.get('access-control-allow-origin'),
                policy:
                    answer.headers.get('content-security-policy') ===
                    appPolicy({
                        host: `localhost:${PORT}`,
                        base,
                        shared: `localhost:${PORT}/apps/-/`,
                        connects: []
                    }),
                scripts: answer.headers
                    .get('content-security-policy')
                    ?.includes(`script-src ${base} `)
            };
        },
        {
            status: 200,
            body: PAGE,
            type: 'text/html; charset=utf-8',
            nosniff: 'nosniff',
            cache: 'no-cache',
            cors: '*',
            policy: true,
            scripts: true
        }
    ],
    [
        'the policy, which lets an app compile its own wasm in script-src alone',
        () => {
            const held = approvedHeld(plant({ machine: notesFiles() }));
            const key = keyOf(held);
            const header = ask(held, `${NOTES}${key}/index.html`).headers.get(
                'content-security-policy'
            );
            const directives = Object.fromEntries(
                (header ?? '')
                    .split('; ')
                    .map((one) => [one.split(' ')[0], one.split(' ').slice(1)])
            );
            return {
                script: directives['script-src'].map((one) => one.replace(key, '<key>')),
                others: Object.entries(directives)
                    .filter(([name]) => name !== 'script-src')
                    .some(([, values]) => values.includes("'wasm-unsafe-eval'")),
                eval: header?.includes("'unsafe-eval'"),
                default: directives['default-src']
            };
        },
        {
            script: [
                `localhost:${PORT}${NOTES}<key>/`,
                `localhost:${PORT}/apps/-/`,
                "'wasm-unsafe-eval'"
            ],
            others: false,
            eval: false,
            default: ["'none'"]
        }
    ],
    [
        'a HEAD request, with the status and headers of the GET and no body',
        async () => {
            const held = approvedHeld(plant({ machine: notesFiles() }));
            const key = keyOf(held);
            const get = ask(held, `${NOTES}${key}/index.html`);
            const head = ask(held, `${NOTES}${key}/index.html`, { method: 'HEAD' });
            const shared = ask(held, '/apps/-/penpal.js', { method: 'HEAD' });
            return {
                head: [head.status, await head.text()],
                sameHeaders: JSON.stringify([...head.headers]) === JSON.stringify([...get.headers]),
                shared: [shared.status, await shared.text()]
            };
        },
        { head: [200, ''], sameHeaders: true, shared: [200, ''] }
    ],
    refused('a wrong key', (key) => `${NOTES}${'0'.repeat(key.length)}/index.html`),
    refused('another path of no record', (key) => `${NOTES}${key}/other.html`),
    refused(
        'an encoded climb to the folder of a sibling',
        (key) => `${NOTES}${key}/..%2Fnotes-old%2Findex.html`
    ),
    refused('an escaped climb', (key) => `${NOTES}${key}/%2e%2e/x`),
    refused('an empty segment', (key) => `${NOTES}${key}/a//b`),
    refused('a dot-led file', (key) => `${NOTES}${key}/.env`),
    refused('an escaped backslash', (key) => `${NOTES}${key}/a%5Cb`),
    refused('an escaped NUL', (key) => `${NOTES}${key}/a%00b`),
    refused('a malformed escape', (key) => `${NOTES}${key}/%E0%A4%A`),
    [
        'the key of another app',
        () => {
            const held = approvedHeld(
                plant({
                    machine: {
                        ...notesFiles(),
                        'todo/app.yml': 'name: todo\ntitle: Todo\nbridge: 1\n',
                        'todo/index.html': PAGE
                    }
                })
            );
            const other = appOf(held, '', 'todo')?.row.key ?? '';
            return [other === '', ask(held, `${NOTES}${other}/index.html`).status];
        },
        [false, 404]
    ],
    [
        'a shared file by POST, and from another host',
        () => {
            const held = approvedHeld(plant({ machine: notesFiles() }));
            const evil = serveApp(
                serveInput(new Request(`http://evil.example:${PORT}/apps/-/oculus.js`), held)
            );
            return [
                ask(held, '/apps/-/oculus.js', { method: 'POST', body: 'x' }).status,
                evil.status
            ];
        },
        [404, 404]
    ],
    [
        'an app that is not approved',
        () => {
            const held = plant({ machine: notesFiles() }).scan(new Set());
            return [
                ask(held, `${NOTES}anything/index.html`).status,
                ask(held, `${NOTES}/index.html`).status
            ];
        },
        [404, 404]
    ],
    [
        'a method other than GET and HEAD, and another host',
        () => {
            const held = approvedHeld(plant({ machine: notesFiles() }));
            const path = `${NOTES}${keyOf(held)}/index.html`;
            const evil = serveApp(
                serveInput(new Request(`http://evil.example:${PORT}${path}`), held)
            );
            return [ask(held, path, { method: 'POST', body: 'x' }).status, evil.status];
        },
        [404, 404]
    ],
    [
        'a file whose bytes changed, then the app approved again',
        () => {
            const fixture = plant({ machine: notesFiles() });
            const held = approvedHeld(fixture);
            const old = keyOf(held);
            writeFileSync(join(fixture.machine, 'notes', 'index.html'), `${PAGE}<p>edited</p>\n`);
            const again = approvedHeld(fixture);
            return [
                ask(held, `${NOTES}${old}/index.html`).status,
                keyOf(again) !== old,
                ask(again, `${NOTES}${old}/index.html`).status,
                ask(again, `${NOTES}${keyOf(again)}/index.html`).status
            ];
        },
        [404, true, 404, 200]
    ],
    [
        'a file rewritten to the same size with its mtime put back',
        () => {
            const fixture = plant({ machine: notesFiles() });
            const held = approvedHeld(fixture);
            const file = join(fixture.machine, 'notes', 'app.js');
            const before = appOf(held, '', 'notes')?.files.find((one) => one.path === 'app.js');
            writeFileSync(file, 'let a = 2;\n');
            const when = new Date(before?.mtimeMs ?? 0);
            utimesSync(file, when, when);
            return ask(held, `${NOTES}${keyOf(held)}/app.js`).status;
        },
        404
    ],
    [
        'a file that was only touched, since the hash is the approved one',
        () => {
            const fixture = plant({ machine: notesFiles() });
            const held = approvedHeld(fixture);
            const later = new Date(Date.now() + 5000);
            utimesSync(join(fixture.machine, 'notes', 'app.js'), later, later);
            return ask(held, `${NOTES}${keyOf(held)}/app.js`).status;
        },
        200
    ],
    [
        'a recorded file that cannot be read',
        () => {
            const fixture = plant({ machine: notesFiles() });
            const held = approvedHeld(fixture);
            const file = join(fixture.machine, 'notes', 'app.js');
            chmodSync(file, 0o000);
            const answer = ask(held, `${NOTES}${keyOf(held)}/app.js`);
            chmodSync(file, 0o644);
            return answer.status;
        },
        404
    ],
    [
        'a root app at its root address, and a root key holding a slash encoded',
        () => {
            const todo = {
                '.oculus/apps/todo/app.yml': 'name: todo\ntitle: Todo\nbridge: 1\n',
                '.oculus/apps/todo/index.html': PAGE
            };
            const held = approvedHeld(plant({ roots: { 'my repo': todo, 'a/b': todo } }));
            const spaced = appOf(held, 'my repo', 'todo')?.row.key ?? '';
            const slashed = appOf(held, 'a/b', 'todo')?.row.key ?? '';
            return [
                ask(held, `/apps/@my%20repo/todo/${spaced}/index.html`).status,
                ask(held, `/apps/@a%2Fb/todo/${slashed}/index.html`).status,
                ask(held, `/apps/@a/b/todo/${slashed}/index.html`).status
            ];
        },
        [200, 200, 404]
    ],
    [
        'the root `engine` and a root that is not shown',
        () => {
            const held = approvedHeld(plant({ machine: notesFiles() }));
            const key = keyOf(held);
            return [
                ask(held, `/apps/@engine/x/${key}/index.html`).status,
                ask(held, `/apps/@nonesuch/x/${key}/index.html`).status
            ];
        },
        [404, 404]
    ],
    ...[
        ['wasm', 'application/wasm'],
        ['xyz', 'application/octet-stream']
    ].map(([extension, type]): Row => [
        `a .${extension} file, served as ${type}`,
        () => {
            const fixture = plant({
                machine: { ...notesFiles(), [`notes/data.${extension}`]: 'x' }
            });
            const held = approvedHeld(fixture);
            const answer = ask(held, `${NOTES}${keyOf(held)}/data.${extension}`);
            return [answer.status, answer.headers.get('content-type')];
        },
        [200, type]
    ]),
    ...[
        ['penpal.js', 200],
        ['oculus.js', 200],
        ['other.js', 404]
    ].map(([name, status]): Row => [
        `the shared file ${name}, answered ${status} and with no policy`,
        () => {
            const answer = ask(approvedHeld(plant({ machine: notesFiles() })), `/apps/-/${name}`);
            return {
                status: answer.status,
                javascript: answer.headers.get('content-type')?.includes('javascript'),
                nosniff: answer.headers.get('x-content-type-options'),
                cache: answer.headers.get('cache-control'),
                cors: answer.headers.get('access-control-allow-origin'),
                policy: answer.headers.get('content-security-policy')
            };
        },
        status === 200
            ? {
                  status,
                  javascript: true,
                  nosniff: 'nosniff',
                  cache: 'no-cache',
                  cors: '*',
                  policy: null
              }
            : {
                  status,
                  javascript: undefined,
                  nosniff: null,
                  cache: null,
                  cors: null,
                  policy: null
              }
    ])
];

describe('answers an app file only while every condition holds, and an empty 404 otherwise', () => {
    it.each(ROWS)('%s', async (_row, observe, expected) => {
        expect(await observe()).toEqual(expected);
    });
});
