// Layer 2, client state test. The nine methods the page exposes to one app's frame
// (lib/state/system/apps/frame/methods.ts), judged by the page's own checks before any request: an
// open target and a write refused by the manifest and the limits, with the word a refusal is.
//
// The context is plain functions, so no frame and no network is involved. What this does NOT
// cover: penpal carrying a rejection to the frame, the server's second judgment of each call
// (tests/routes/apps and tests/routes/edit/apps/app-gate.test.ts) and the notice drawn once per
// name, which the apps store (apps.svelte.ts) owns.

import { describe, expect, vi } from 'vitest';
import type { AppRow } from '../../../../src/lib/data/model/index.ts';
import { appsSettings, engineDir, loadConfig } from '../../../../src/lib/data/sources/config.ts';
import type { WriteAnswer } from '../../../../src/lib/state/shared/stores/shapes.ts';
import {
    createMethods,
    type CommandOutcome,
    type MethodsContext,
    type OpenResult,
    type ServerAnswer
} from '../../../../src/lib/state/system/apps/frame/methods.ts';
import { fixtureApp } from '../../../fixtures/entities-fixture.ts';
import { it } from '../../../fixtures/scratch.ts';
import { installRealText } from '../../../views/shared/real-text.ts';
import { t } from '../../../../src/lib/state/shared/words/text.ts';

installRealText();

const settings = appsSettings(loadConfig(engineDir()).config);

const ROW: AppRow = fixtureApp({
    title: 'Reading notes',
    reads: ['portfolio'],
    writes: ['radar-add', 'delete-entry'],
    files: 2,
    hash: 'h',
    key: 'k',
    storeFile: '/data/notes.json'
});

const OK: WriteAnswer = { ok: true, changed: ['x'], refused: [] };

/** A context of spies; `over` replaces any of its members. */
function context(over: Partial<MethodsContext> = {}) {
    let at = 0;
    const calls = {
        send: vi.fn((_kind: string, _body: unknown) => Promise.resolve(OK)),
        confirm: vi.fn((_question: { message: string; detail: string }) => Promise.resolve(true)),
        openView: vi.fn((_view: string) => undefined),
        openProject: vi.fn((_key: string) => undefined),
        openFile: vi.fn((_root: string, _path: string) => undefined),
        openUrl: vi.fn((_address: string) => undefined),
        check: vi.fn((_root: string, _path: string) => Promise.resolve<OpenResult | null>('ok')),
        refused: vi.fn((_kind: string, _name: string) => undefined),
        runCommand: vi.fn((_name: string) => Promise.resolve<CommandOutcome>('ok')),
        secrets: vi.fn((_action: string, _key: unknown, _value?: unknown) =>
            Promise.resolve<ServerAnswer | null>({ ok: true, value: null })
        ),
        host: vi.fn((_method: unknown, _params: unknown) =>
            Promise.resolve<ServerAnswer | null>({ ok: true, value: null })
        )
    };
    const ctx: MethodsContext = {
        alive: () => true,
        row: () => ROW,
        settings: () => settings,
        held: () => null,
        dir: () => null,
        shown: (root) => root === 'hub',
        rootKeys: () => ['hub'],
        getState: () => null,
        setState: () => undefined,
        getStore: () => Promise.resolve(null),
        send: calls.send,
        confirm: calls.confirm,
        listed: (view) =>
            view === 'focus' ? 'listed' : view === 'nonesuch' ? 'unknown' : 'unlisted',
        openView: calls.openView,
        hasProject: (key) => key === 'alpha',
        openProject: calls.openProject,
        check: calls.check,
        runCommand: calls.runCommand,
        secrets: calls.secrets,
        host: calls.host,
        openFile: calls.openFile,
        openUrl: calls.openUrl,
        theme: () => ({ name: 'dark', tokens: {}, wall: false }),
        forwardKey: () => undefined,
        refused: calls.refused,
        execute: () => Promise.resolve({ ok: true, value: null }),
        register: () => null,
        unregister: () => undefined,
        changed: () => undefined,
        pageExists: () => Promise.resolve(true),
        openPanel: () => 'panel-1',
        ask: () => ({ id: 'l1', answer: Promise.resolve(null) }),
        setting: () => Promise.resolve({ ok: true, value: null }),
        document: null,
        now: () => at,
        ...over
    };
    return { ctx, calls, advance: (ms: number) => (at += ms), methods: createMethods(ctx) };
}

/** What a promise rejects with, or the string `resolved`. */
async function outcome(promise: Promise<unknown>): Promise<unknown> {
    try {
        await promise;
        return 'resolved';
    } catch (word) {
        return word;
    }
}

type Row = [string, () => unknown, unknown];

/** The opens of the table: a target and the word the page answers. */
const OPENS: [string, unknown, string][] = [
    ['a view the catalogue lists', { view: 'focus' }, 'resolved'],
    ['a view the catalogue does not list', { view: 'terminal' }, 'closed'],
    ['the document view', { view: 'document' }, 'closed'],
    ['the file view', { view: 'file' }, 'closed'],
    ['the source view', { view: 'source' }, 'closed'],
    ['the project view', { view: 'project' }, 'closed'],
    ['a view the registry has not heard of', { view: 'nonesuch' }, 'missing'],
    ['a project that exists', { project: 'alpha' }, 'resolved'],
    ['a project that does not exist', { project: 'nonesuch' }, 'missing'],
    ['a target of an unknown key', { foo: 1 }, 'closed'],
    ['a target that is a string', 'focus', 'closed'],
    ['a target of two keys', { view: 'focus', project: 'alpha' }, 'closed'],
    ['a view that is not text', { view: 5 }, 'closed'],
    ['a file of a shown root', { file: { root: 'hub', path: 'README.md' } }, 'resolved'],
    ['a file with a dot-led path', { file: { root: 'hub', path: '.env' } }, 'closed'],
    ['a file of a closed folder', { file: { root: 'hub', path: 'secrets/a.txt' } }, 'closed'],
    ['a file of the engine root', { file: { root: 'engine', path: 'x' } }, 'closed'],
    ['a file of a root that is not shown', { file: { root: 'other', path: 'x' } }, 'missing'],
    ['a file target with an extra key', { file: { root: 'hub', path: 'a', more: 1 } }, 'closed'],
    ['a file target that is not an object', { file: 'hub/a' }, 'closed']
];

/** One row for the open of a target, answered by a word. */
const opens = ([label, target, word]: [string, unknown, string]): Row => [
    `an open of ${label}, answered ${word}`,
    async () => outcome(context().methods.open(target)),
    word
];

const NOT_JSON = ['a cycle', 'undefined', 'NaN', 'a Map', 'a Date'];
const notJson = (): unknown[] => {
    const cycle: Record<string, unknown> = {};
    cycle.self = cycle;
    return [cycle, undefined, NaN, new Map(), new Date(0)];
};

/** A machine app that may read `hub/projects`, whose address key is `k`. */
const READER = fixtureApp({ readFolders: ['hub/projects'] });

/** A root app of the root `one`. */
const ROOT_APP = fixtureApp({ name: 'todo', root: 'one' });

/** The address a read of the root `hub` at this path is fetched from, for the app `notes`. */
const FS = (marker: string, path: string): string => `/apps/notes/k/${marker}/hub/${path}`;

/** What `fsAddress` answers: an address or one refusal word. */
const addressed = async (
    row: AppRow,
    args: [unknown, unknown, unknown],
    over: Partial<MethodsContext> = {}
): Promise<unknown> => {
    const { methods } = context({ row: () => row, ...over });
    return methods.fsAddress(...args).then(
        (address) => address,
        (word: unknown) => `rejected:${String(word)}`
    );
};

const FS_ROWS: Row[] = (
    [
        [
            'a read of a file inside a declared folder',
            READER,
            ['read', 'hub', 'projects/a/README.md'],
            FS('.fs', 'projects/a/README.md')
        ],
        [
            'a listing of a declared folder',
            READER,
            ['dir', 'hub', 'projects'],
            FS('.dir', 'projects')
        ],
        [
            'a stat of a declared folder',
            READER,
            ['stat', 'hub', 'projects/a'],
            FS('.stat', 'projects/a')
        ],
        [
            'a file outside the declared folders',
            READER,
            ['read', 'hub', 'feeds/x.yml'],
            'rejected:not_declared'
        ],
        [
            'a path that climbs out of the declared folder',
            READER,
            ['read', 'hub', 'projects/../secrets/k'],
            'rejected:closed'
        ],
        [
            'a path under a dot-led folder',
            READER,
            ['read', 'hub', 'projects/.git/config'],
            'rejected:closed'
        ],
        [
            'a path of a closed folder',
            fixtureApp({ readFolders: ['hub'] }),
            ['read', 'hub', 'secrets/k'],
            'rejected:closed'
        ],
        [
            'the engine root',
            fixtureApp({ readFolders: ['engine'] }),
            ['read', 'engine', 'x'],
            'rejected:closed'
        ],
        [
            'a root that is not shown',
            fixtureApp({ readFolders: ['other/x'] }),
            ['read', 'other', 'x/a'],
            'rejected:missing'
        ],
        [
            'an operation that is none of the three',
            READER,
            ['write', 'hub', 'projects/a'],
            'rejected:closed'
        ],
        ['a path that is not text', READER, ['read', 'hub', 5], 'rejected:closed'],
        [
            'a root app reading its own root',
            ROOT_APP,
            ['read', 'one', 'src/x.ts'],
            '/apps/@one/todo/k/.fs/one/src/x.ts'
        ],
        [
            'a root app reading another root',
            ROOT_APP,
            ['read', 'hub', 'src/x.ts'],
            'rejected:closed'
        ],
        [
            'an app that is disabled',
            fixtureApp({ readFolders: ['hub/projects'], disabled: true }),
            ['read', 'hub', 'projects/a'],
            'rejected:closed'
        ],
        [
            'an app with no address key',
            fixtureApp({ readFolders: ['hub/projects'], key: '' }),
            ['read', 'hub', 'projects/a'],
            'rejected:closed'
        ]
    ] as [string, AppRow, [unknown, unknown, unknown], string][]
).map(([label, row, args, expected]): Row => [
    `an address for ${label}, answered ${expected.startsWith('rejected') ? expected.slice(9) : 'the address'}`,
    () =>
        addressed(row, args, {
            shown: (root) => ['hub', 'one'].includes(root),
            rootKeys: () => ['hub', 'one']
        }),
    expected
]);

const COMMAND_ROWS: Row[] = (
    [
        ['ok', 'resolved'],
        ['declined', 'declined'],
        ['missing', 'missing'],
        ['failed', 'failed:0']
    ] as [CommandOutcome, string][]
).map(([result, word]): Row => [
    `a command the page ran with the outcome ${result}, answered ${word}`,
    async () => {
        const { methods, calls } = context({ runCommand: () => Promise.resolve(result) });
        return [await outcome(methods.commandsRun('build')), calls.refused.mock.calls];
    },
    [word, []]
]);

const SECRETS_APP = fixtureApp({ secrets: true });

const SECRET_ROWS: Row[] = [
    [
        'a secret of an app that did not declare secrets, answered not_declared before any request',
        async () => {
            const { methods, calls } = context();
            return [await outcome(methods.secretsGet('token')), calls.secrets.mock.calls];
        },
        ['not_declared', []]
    ],
    [
        'a store, a get and a delete of an app that declared them, each sent to the server with its key',
        async () => {
            const sent: unknown[][] = [];
            const { methods } = context({
                row: () => SECRETS_APP,
                secrets: (action, key, value) => {
                    sent.push(value === undefined ? [action, key] : [action, key, value]);
                    return Promise.resolve({
                        ok: true as const,
                        value: action === 'get' ? 'x' : null
                    });
                }
            });
            await methods.secretsStore('token', 'x');
            const got = await methods.secretsGet('token');
            await methods.secretsDelete('token');
            return [got, sent];
        },
        [
            'x',
            [
                ['store', 'token', 'x'],
                ['get', 'token'],
                ['delete', 'token']
            ]
        ]
    ],
    [
        'a word the server refuses with, which the app is rejected with',
        async () => {
            const { methods } = context({
                row: () => SECRETS_APP,
                secrets: () => Promise.resolve({ ok: false as const, word: 'refused:key' })
            });
            return outcome(methods.secretsGet('a b'));
        },
        'refused:key'
    ],
    [
        'a request that got no answer, rejected failed:0',
        async () => {
            const { methods } = context({
                row: () => SECRETS_APP,
                secrets: () => Promise.resolve(null)
            });
            return outcome(methods.secretsStore('token', 'x'));
        },
        'failed:0'
    ],
    [
        'the 31st store of a minute, rejected rate and the reader told once',
        async () => {
            const { methods, calls } = context({
                row: () => SECRETS_APP,
                secrets: () => Promise.resolve({ ok: true as const, value: null })
            });
            const outcomes: unknown[] = [];
            for (let call = 0; call < 31; call += 1)
                outcomes.push(await outcome(methods.secretsStore('token', 'x')));
            return [
                outcomes.slice(0, 30).every((one) => one === 'resolved'),
                outcomes[30],
                calls.refused.mock.calls
            ];
        },
        [true, 'rate', [['rate', 'rate']]]
    ]
];

const HOST_ROWS: Row[] = [
    [
        'a host request of an app with no host, answered not_declared before any request',
        async () => {
            const { methods, calls } = context();
            return [await outcome(methods.hostRequest('ping', {})), calls.host.mock.calls];
        },
        ['not_declared', []]
    ],
    [
        'a host request with params that are not JSON, refused before any request',
        async () => {
            const { methods, calls } = context({ row: () => fixtureApp({ host: 'host.mjs' }) });
            const result = await outcome(methods.hostRequest('ping', () => 1));
            return [result === 'resolved', calls.host.mock.calls];
        },
        [false, []]
    ],
    [
        'a host request, sent with its method and params and answered with the value',
        async () => {
            const sent: unknown[][] = [];
            const { methods } = context({
                row: () => fixtureApp({ host: 'host.mjs' }),
                host: (method, params) => {
                    sent.push([method, params]);
                    return Promise.resolve({ ok: true as const, value: { pong: 1 } });
                }
            });
            return [await methods.hostRequest('ping', { n: 1 }), sent];
        },
        [{ pong: 1 }, [['ping', { n: 1 }]]]
    ],
    [
        'a host that cannot start, rejected host_down',
        async () => {
            const { methods } = context({
                row: () => fixtureApp({ host: 'host.mjs' }),
                host: () => Promise.resolve({ ok: false as const, word: 'host_down' })
            });
            return outcome(methods.hostRequest('ping', null));
        },
        'host_down'
    ]
];

const ROWS: Row[] = [
    ...OPENS.map(opens),
    [
        'the view, the project and the file of an accepted target are opened, and no other',
        async () => {
            const { methods, calls } = context();
            await methods.open({ view: 'focus' });
            await methods.open({ project: 'alpha' });
            await methods.open({ file: { root: 'hub', path: 'README.md' } });
            await outcome(methods.open({ view: 'terminal' }));
            await outcome(methods.open({ project: 'nonesuch' }));
            return [
                calls.openView.mock.calls,
                calls.openProject.mock.calls,
                calls.openFile.mock.calls
            ];
        },
        [[['focus']], [['alpha']], [['hub', 'README.md']]]
    ],
    ...(
        [
            ['closed', 'closed'],
            ['missing', 'missing'],
            [null, 'failed:0']
        ] as [OpenResult | null, string][]
    ).map(([answer, word]): Row => [
        `a file the server says is ${String(answer)}, answered ${word} with nothing opened`,
        async () => {
            const { methods, calls } = context({ check: () => Promise.resolve(answer) });
            const result = await outcome(methods.open({ file: { root: 'hub', path: 'a.md' } }));
            return [result, calls.openFile.mock.calls];
        },
        [word, []]
    ]),
    [
        'an https address the reader accepts, opened once with the app and the whole address shown',
        async () => {
            const { methods, calls } = context();
            const address = 'https://example.org/a?b=c#d';
            const result = await outcome(methods.open({ url: address }));
            return [result, calls.confirm.mock.calls, calls.openUrl.mock.calls];
        },
        [
            'resolved',
            [
                [
                    {
                        message: t('apps.confirm_open_url', 'Reading notes'),
                        detail: 'https://example.org/a?b=c#d'
                    }
                ]
            ],
            [['https://example.org/a?b=c#d']]
        ]
    ],
    [
        'an address the reader declines, rejected declined with nothing opened',
        async () => {
            const { methods, calls } = context({ confirm: () => Promise.resolve(false) });
            const result = await outcome(methods.open({ url: 'http://example.org/' }));
            return [result, calls.openUrl.mock.calls];
        },
        ['declined', []]
    ],
    [
        'an address of a scheme other than http: and https:, rejected closed with nothing asked',
        async () => {
            const { methods, calls } = context();
            return [
                await outcome(methods.open({ url: 'javascript:alert(1)' })),
                await outcome(methods.open({ url: 'file:///etc/hosts' })),
                calls.confirm.mock.calls,
                calls.openUrl.mock.calls
            ];
        },
        ['closed', 'closed', [], []]
    ],
    [
        'an address with a user name or a password, rejected closed with nothing asked',
        async () => {
            const { methods, calls } = context();
            return [
                await outcome(methods.open({ url: 'https://user@example.org/' })),
                await outcome(methods.open({ url: 'https://:secret@example.org/' })),
                calls.confirm.mock.calls,
                calls.openUrl.mock.calls
            ];
        },
        ['closed', 'closed', [], []]
    ],
    [
        'an address of more than 2048 characters, rejected closed with nothing asked',
        async () => {
            const { methods, calls } = context();
            const address = `https://example.org/${'a'.repeat(2048)}`;
            return [
                await outcome(methods.open({ url: address })),
                calls.confirm.mock.calls,
                calls.openUrl.mock.calls
            ];
        },
        ['closed', [], []]
    ],
    [
        'a path the page refuses, with nothing asked of the server',
        async () => {
            const { methods, calls } = context();
            await outcome(methods.open({ file: { root: 'hub', path: '.env' } }));
            await outcome(methods.open({ file: { root: 'engine', path: 'x' } }));
            return calls.check.mock.calls;
        },
        []
    ],
    [
        'every file target, answered closed while closed_paths is absent',
        async () => {
            const { methods } = context({
                settings: () => ({ ...settings, closedPaths: { folders: null, shaped: false } })
            });
            return outcome(methods.open({ file: { root: 'hub', path: 'README.md' } }));
        },
        'closed'
    ],
    [
        'the 31st open in a minute, answered rate, and the first again after the window',
        async () => {
            const { methods, advance } = context();
            const words: unknown[] = [];
            for (let index = 0; index < settings.opensPerMin; index += 1) {
                words.push(await outcome(methods.open({ view: 'focus' })));
            }
            const over = await outcome(methods.open({ view: 'focus' }));
            advance(60_001);
            return {
                allowed: words.every((word) => word === 'resolved'),
                over,
                after: await outcome(methods.open({ view: 'focus' }))
            };
        },
        { allowed: true, over: 'rate', after: 'resolved' }
    ],
    [
        'a write the manifest does not declare, refused without a request',
        async () => {
            const { methods, calls } = context();
            return {
                words: [
                    await outcome(methods.write('lead-add', {})),
                    await outcome(methods.write('undo', {}))
                ],
                sent: calls.send.mock.calls,
                refused: calls.refused.mock.calls
            };
        },
        {
            words: ['not_declared', 'not_declared'],
            sent: [],
            refused: [
                ['write', 'lead-add'],
                ['write', 'undo']
            ]
        }
    ],
    [
        'a declared write, sent, with the reader asked first for a kind that deletes',
        async () => {
            const { methods, calls } = context();
            const first = await outcome(methods.write('radar-add', { kind: 'radar-add' }));
            const askedAfterFirst = calls.confirm.mock.calls.length;
            const second = await outcome(methods.write('delete-entry', { id: 'x' }));
            return {
                words: [first, second],
                askedAfterFirst,
                asked: calls.confirm.mock.calls.length,
                names: calls.confirm.mock.calls[0][0].message.includes('Reading notes'),
                sent: calls.send.mock.calls[0]
            };
        },
        {
            words: ['resolved', 'resolved'],
            askedAfterFirst: 0,
            asked: 1,
            names: true,
            sent: ['radar-add', { kind: 'radar-add' }]
        }
    ],
    [
        'a write the reader declines, rejected declined with nothing sent',
        async () => {
            const { methods, calls } = context({ confirm: () => Promise.resolve(false) });
            return [
                await outcome(methods.write('delete-entry', { id: 'x' })),
                calls.send.mock.calls
            ];
        },
        ['declined', []]
    ],
    ...(
        [
            [
                'a refusal of a field',
                { ok: true, changed: [], refused: [{ field: 'f', reason: 'why' }] },
                'refused:why'
            ],
            [
                'a refusal of the request',
                { ok: false, changed: [], refused: [], error: 'x', status: 403 },
                'refused:x'
            ],
            [
                'a server error with a word',
                { ok: false, changed: [], refused: [], error: 'boom', status: 500 },
                'failed:500'
            ]
        ] as [string, WriteAnswer, string][]
    ).map(([label, answer, word]): Row => [
        `an answer of ${label}, rejected ${word}`,
        async () =>
            outcome(
                context({ send: () => Promise.resolve(answer) }).methods.write('radar-add', {})
            ),
        word
    ]),
    [
        'the 31st write in a minute, answered rate with setStore counting among them',
        async () => {
            const { methods, calls, advance } = context();
            const words: unknown[] = [];
            for (let index = 0; index < settings.writesPerMin - 1; index += 1) {
                words.push(await outcome(methods.write('radar-add', {})));
            }
            const store = await outcome(methods.setStore({ n: 1 }));
            const over = [
                await outcome(methods.write('radar-add', {})),
                await outcome(methods.setStore({ n: 2 }))
            ];
            const sent = calls.send.mock.calls.length;
            advance(60_001);
            return {
                allowed: words.every((word) => word === 'resolved'),
                store,
                over,
                sent: sent === settings.writesPerMin,
                after: await outcome(methods.write('radar-add', {})),
                notices: calls.refused.mock.calls.filter(([kind]) => kind === 'rate').length
            };
        },
        {
            allowed: true,
            store: 'resolved',
            over: ['rate', 'rate'],
            sent: true,
            after: 'resolved',
            notices: 2
        }
    ],
    ...NOT_JSON.map((label, index): Row => [
        `setState and setStore of ${label}, rejected as not JSON with nothing sent`,
        async () => {
            const { methods, calls } = context();
            const value = (): unknown => notJson()[index];
            return [
                await outcome(methods.setStore(value())),
                await outcome(methods.setState(value())),
                calls.send.mock.calls
            ];
        },
        [t('apps.refused_not_json'), t('apps.refused_not_json'), []]
    ]),
    [
        'a state over the limit and a store over the limit, rejected too_large',
        async () => {
            const { methods, calls } = context();
            return [
                await outcome(methods.setState('x'.repeat((settings.stateMaxKb + 1) * 1024))),
                await outcome(methods.setStore('x'.repeat((settings.storeMaxKb + 1) * 1024))),
                calls.send.mock.calls
            ];
        },
        ['too_large', 'too_large', []]
    ],
    [
        'a read of a channel the manifest does not declare, refused not_declared',
        async () => {
            const { methods, calls } = context();
            return [
                await outcome(methods.read('inbox')),
                await outcome(methods.read('portfolio')),
                calls.refused.mock.calls
            ];
        },
        ['not_declared', 'resolved', [['read', 'inbox']]]
    ],
    [
        'a call whose frame was destroyed while it waited, which settles nothing',
        async () => {
            vi.useFakeTimers();
            try {
                let alive = true;
                const { methods, calls } = context({
                    alive: () => alive,
                    send: () => {
                        alive = false;
                        return Promise.resolve(OK);
                    }
                });
                let settled = false;
                void methods.write('radar-add', {}).then(
                    () => (settled = true),
                    () => (settled = true)
                );
                await vi.advanceTimersByTimeAsync(1000);
                return [calls.refused.mock.calls, settled];
            } finally {
                vi.useRealTimers();
            }
        },
        [[], false]
    ],
    ...FS_ROWS,
    ...COMMAND_ROWS,
    ...SECRET_ROWS,
    ...HOST_ROWS
];

describe("refuses an open target or a write by the page's own checks before any request", () => {
    it.each(ROWS)('%s', async (_row, observe, expected) => {
        expect(await observe()).toEqual(expected);
    });
});
