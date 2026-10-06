// Layer 2, client state test. The nine methods the page exposes to one app's frame
// (lib/state/system/apps/methods.ts), judged by the page's own checks before any request: an open
// target and a write refused by the manifest and the limits, with the word a refusal is.
//
// The context is plain functions, so no frame and no network is involved. What this does NOT
// cover: penpal carrying a rejection to the frame, the server's second judgment of each call
// (tests/routes/apps and tests/routes/edit/app-gate.test.ts) and the notice drawn once per name,
// which the apps store (apps.svelte.ts) owns.

import { describe, expect, vi } from 'vitest';
import type { AppRow } from '../../../../src/lib/data/model/index.ts';
import { appsSettings, engineDir, loadConfig } from '../../../../src/lib/data/sources/config.ts';
import type { WriteAnswer } from '../../../../src/lib/state/shared/stores/shapes.ts';
import {
    createMethods,
    type MethodsContext,
    type OpenResult
} from '../../../../src/lib/state/system/apps/methods.ts';
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
        refused: vi.fn((_kind: string, _name: string) => undefined)
    };
    const ctx: MethodsContext = {
        alive: () => true,
        row: () => ROW,
        settings: () => settings,
        held: () => null,
        dir: () => null,
        shown: (root) => root === 'hub',
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
        openFile: calls.openFile,
        openUrl: calls.openUrl,
        theme: () => ({ name: 'dark', tokens: {}, wall: false }),
        forwardKey: () => undefined,
        refused: calls.refused,
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
    ]
];

describe("refuses an open target or a write by the page's own checks before any request", () => {
    it.each(ROWS)('%s', async (_row, observe, expected) => {
        expect(await observe()).toEqual(expected);
    });
});
