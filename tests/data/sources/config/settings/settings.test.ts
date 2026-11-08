// Layer 1, data tests. The typed readers of single settings out of the merged map (slurm, calendar,
// search, literature search, open, mail, the change log's length, the usage tiers, the Processes
// view's program names, the usage refresh, the automatic fetch, the editor's paint limit, the
// Files view's delete prompt, the apps' limits and closed folders, the Repositories view's scan
// depth and the chat's collection keys of sources.yml). The writing tools' readers are tested in
// writing.test.ts. Each reader is run over the map of synthetic.ts, whose every default differs
// from the shipped one, so a default written in code instead of read from the entry fails a row. A
// wrong value answers the entry's default and a problem naming the key; a missing key answers the
// default and no problem; a catalog with no entry for a key throws.

import { describe, expect } from 'vitest';
import { it, plantScratch } from '../../../../fixtures/scratch.ts';
import {
    autofetchMin,
    calendarSettings,
    changesKeep,
    chatContext,
    confirmDelete,
    engineDir,
    literatureSettings,
    loadConfig,
    mailSettings,
    openSettings,
    processesSettings,
    refreshSettings,
    repositoryScanDepth,
    searchSettings,
    slurmSettings,
    usageTiers,
    appsSettings
} from '../../../../../src/lib/data/sources/config.ts';
import { behaviorFindings } from '../../../../../src/lib/data/sources/config/catalogs.ts';
import {
    paintLimit,
    programApps
} from '../../../../../src/lib/data/sources/config/settings/files.ts';
import { settingProblems } from '../../../../../src/lib/data/sources/config/settings/problems.ts';
import { SOURCES, mapWith, outcome } from './synthetic.ts';

/** Where the shipped config was read from: oculus's own files, no hub. */
const SHIPPED_AT = { engine: engineDir(), hub: null, from: loadConfig(engineDir()).from };

const NOT_FINITE = [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, '5', null];

describe('slurmSettings', () => {
    const BLOCK = { resource: ['h'], days: 3, poll_min: 5, quota_min: 30, prewarm: true };
    const DEFAULT = { resources: ['alpha'], days: 7, pollMin: 25, quotaMin: 70, prewarm: false };
    const read = (slurm: unknown) => outcome((p) => slurmSettings(mapWith({ slurm }), p));

    it.each([
        ['days', 'range', [-1, 3651]],
        ['days', 'whole', [1.5]],
        ['poll_min', 'range', [0, 0.5, -1, 35792]],
        ['quota_min', 'range', [0, 0.5, -1, 35792]]
    ])('answers the default for a %s with a %s problem', (key, kind, bad) => {
        const field = (
            { days: 'days', poll_min: 'pollMin', quota_min: 'quotaMin' } as Record<string, string>
        )[key];
        for (const value of [...bad]) {
            expect(read({ ...BLOCK, [key]: value })).toStrictEqual({
                value: {
                    resources: ['h'],
                    days: 3,
                    pollMin: 5,
                    quotaMin: 30,
                    prewarm: true,
                    [field]: DEFAULT[field as keyof typeof DEFAULT]
                },
                problems: [`slurm.${key}: ${kind}`]
            });
        }
    });

    it('answers an empty resource as no cluster, with no problem', () => {
        expect(read({ ...BLOCK, resource: [] })).toMatchObject({
            value: { resources: [] },
            problems: []
        });
    });

    it.each([
        ['one text', 'utwente', [], ['slurm.resource: words']],
        ['a number', 3, [], ['slurm.resource: words']],
        ['a key named twice', ['a', 'a'], ['a'], ['slurm.resource: repeat']],
        ['the key of this Mac', ['mac', 'a'], ['a'], ['slurm.resource: this-mac']],
        ['two keys', ['a', 'b'], ['a', 'b'], []]
    ])('reads a resource of %s to its clusters and its findings', (_row, resource, keys, named) => {
        expect(read({ ...BLOCK, resource })).toMatchObject({
            value: { resources: keys },
            problems: named
        });
    });
});

describe('calendarSettings', () => {
    const BLOCK = { poll_min: 5, days_back: 8, days_ahead: 30 };
    const read = (calendar: unknown) => outcome((p) => calendarSettings(mapWith({ calendar }), p));

    it.each([
        ['poll_min', 'range', 'pollMin', 20, [0, 35792]],
        ['days_back', 'range', 'daysBack', 10, [-1, 3651]],
        ['days_back', 'whole', 'daysBack', 10, [2.5]],
        ['days_ahead', 'range', 'daysAhead', 20, [-1, 3651]]
    ])('answers the default for a %s with a %s problem', (key, kind, field, fallback, bad) => {
        for (const value of bad) {
            expect(read({ ...BLOCK, [key]: value })).toMatchObject({
                value: { [field]: fallback },
                problems: [`calendar.${key}: ${kind}`]
            });
        }
    });
});

describe('searchSettings', () => {
    const read = (search: unknown) => outcome((p) => searchSettings(mapWith({ search }), p));

    it('answers the default for each value that is not above zero, and for a fraction of a count', () => {
        for (const bad of [...NOT_FINITE, -1, 0]) {
            expect(read({ max_hits: bad, timeout_s: 4, max_names: 8 })).toMatchObject({
                value: { maxHits: 300, timeoutS: 4, maxNames: 8 },
                problems: [expect.stringMatching(/^search\.max_hits: /)]
            });
            expect(read({ max_hits: 9, timeout_s: bad, max_names: 8 })).toMatchObject({
                value: { maxHits: 9, timeoutS: 15, maxNames: 8 },
                problems: [expect.stringMatching(/^search\.timeout_s: /)]
            });
            expect(read({ max_hits: 9, timeout_s: 4, max_names: bad })).toMatchObject({
                value: { maxHits: 9, timeoutS: 4, maxNames: 7000 },
                problems: [expect.stringMatching(/^search\.max_names: /)]
            });
        }
        expect(read({ max_hits: 10.5, timeout_s: 4, max_names: 8 })).toStrictEqual({
            value: { maxHits: 300, timeoutS: 4, maxNames: 8 },
            problems: ['search.max_hits: whole']
        });
        expect(read({ max_hits: 9, timeout_s: 4, max_names: 10.5 })).toStrictEqual({
            value: { maxHits: 9, timeoutS: 4, maxNames: 7000 },
            problems: ['search.max_names: whole']
        });
    });
});

describe('literatureSettings', () => {
    const BLOCK = { timeout_s: 9, per_source: 8, cache_min: 0 };
    const DEFAULT = { timeoutS: 40, perSource: 12, cacheMin: 5 };
    const FIELD: Record<string, string> = {
        timeout_s: 'timeoutS',
        per_source: 'perSource',
        cache_min: 'cacheMin'
    };
    const read = (literature: unknown) =>
        outcome((p) => literatureSettings(mapWith({ literature }), p));

    it('answers the written values, and the default with the key named for each wrong value or a block that is no map', () => {
        expect(read(BLOCK)).toStrictEqual({
            value: { timeoutS: 9, perSource: 8, cacheMin: 0 },
            problems: []
        });
        expect(read(undefined)).toStrictEqual({ value: DEFAULT, problems: [] });
        const wrong: [string, string, number[]][] = [
            ['timeout_s', 'range', [0, 121, -1]],
            ['timeout_s', 'whole', [1.5]],
            ['per_source', 'range', [0, 500, 101]],
            ['per_source', 'whole', [2.5]],
            ['cache_min', 'range', [-1, 1441]],
            ['cache_min', 'whole', [0.5]]
        ];
        for (const [key, kind, bad] of wrong) {
            for (const value of [...bad, ...NOT_FINITE]) {
                const answered = read({ ...BLOCK, [key]: value }) as {
                    value: Record<string, number>;
                    problems: string[];
                };
                expect(answered.value[FIELD[key]], `${key} ${String(value)}`).toBe(
                    DEFAULT[FIELD[key] as keyof typeof DEFAULT]
                );
                expect(answered.problems, `${key} ${String(value)}`).toHaveLength(1);
                expect(answered.problems[0]).toMatch(new RegExp(`^literature\\.${key}: `));
                if (bad.includes(value as number))
                    expect(answered.problems[0]).toBe(`literature.${key}: ${kind}`);
            }
        }
        expect(read(5)).toStrictEqual({ value: DEFAULT, problems: ['literature: block'] });
    });
});

describe('mailSettings', () => {
    const read = (mail: unknown) => outcome((p) => mailSettings(mapWith({ mail }), p));

    it('answers the default for a wrong value and names the key', () => {
        expect(read({ poll_min: 0, per_signal: 10 })).toStrictEqual({
            value: { pollMin: 12, perSignal: 10 },
            problems: ['mail.poll_min: range']
        });
        expect(read({ poll_min: 5, per_signal: 501 })).toStrictEqual({
            value: { pollMin: 5, perSignal: 30 },
            problems: ['mail.per_signal: range']
        });
        expect(read({ poll_min: 5, per_signal: 25.5 })).toStrictEqual({
            value: { pollMin: 5, perSignal: 30 },
            problems: ['mail.per_signal: whole']
        });
    });
});

describe('changesKeep', () => {
    const read = (changes: unknown) => outcome((p) => changesKeep(mapWith({ changes }), p));

    it('answers the default for a keep that is not a whole number above zero', () => {
        for (const [keep, kind] of [
            [-1, 'range'],
            [0, 'range'],
            [2.5, 'whole'],
            ['3', 'number'],
            [null, 'number']
        ] as const) {
            expect(read({ keep })).toStrictEqual({
                value: 400,
                problems: [`changes.keep: ${kind}`]
            });
        }
        expect(read({})).toStrictEqual({ value: 400, problems: [] });
        expect(read({ keep: 9 })).toStrictEqual({ value: 9, problems: [] });
    });
});

describe('openSettings and programApps', () => {
    const MEMBERS = {
        '.pdf': 'com.adobe.Reader',
        '.x': 3,
        pdf: 'com.apple.Preview',
        '.txt': 'com.apple TextEdit'
    };
    const read = (program_ext: unknown) =>
        outcome((p) => openSettings(mapWith({ open: { program_ext } }), p));

    it('leaves out each member the entry refuses and names it', () => {
        expect(read(MEMBERS)).toStrictEqual({
            value: { programApps: { '.pdf': 'com.adobe.Reader' } },
            problems: [
                'open.program_ext..x: text',
                'open.program_ext.pdf: form',
                'open.program_ext..txt: form'
            ]
        });
        expect(programApps(mapWith({ open: { program_ext: MEMBERS } }))).toStrictEqual({
            '.pdf': 'com.adobe.Reader'
        });
    });
});

describe('usageTiers', () => {
    const read = (usage_tiers: unknown) => outcome((p) => usageTiers(mapWith({ usage_tiers }), p));

    it('leaves out each entry that is no text and names it', () => {
        expect(read({ a: 'A', b: 5, c: null })).toStrictEqual({
            value: { a: 'A' },
            problems: ['usage_tiers.b: text', 'usage_tiers.c: text']
        });
    });
});

describe('processesSettings', () => {
    const read = (processes: unknown) =>
        outcome((p) => processesSettings(mapWith({ processes }), p));

    it.each([[['python3', 'a/b']], [['python3', 'my tool']]])(
        'answers the default list for %j and names the key',
        (patterns) => {
            expect(read({ patterns })).toStrictEqual({
                value: { patterns: ['perl', 'ruby'] },
                problems: ['processes.patterns: form']
            });
        }
    );
});

describe('refreshSettings, autofetchMin and paintLimit', () => {
    it('answers the default for a wrong cadence and a model outside the models', () => {
        expect(
            outcome((p) =>
                refreshSettings(mapWith({ usage_refresh_min: 'x', usage_refresh_model: 'gpt' }), p)
            )
        ).toStrictEqual({
            value: { refreshMin: 12, model: 'm2' },
            problems: ['usage_refresh_min: number', 'usage_refresh_model: source']
        });
        for (const model of ['  ', '']) {
            expect(
                outcome((p) => refreshSettings(mapWith({ usage_refresh_model: model }), p))
            ).toMatchObject({
                value: { model: 'm2' },
                problems: [expect.stringContaining('usage_refresh_model')]
            });
        }
        expect(
            refreshSettings(mapWith({ usage_refresh_min: 3, usage_refresh_model: 'm1' }))
        ).toStrictEqual({
            refreshMin: 3,
            model: 'm1'
        });
    });

    it('answers the default for a fetch period that is negative or a fraction', () => {
        for (const [minutes, kind] of [
            [-1, 'range'],
            [1.5, 'whole'],
            ['x', 'number']
        ] as const) {
            expect(
                outcome((p) => autofetchMin(mapWith({ git: { autofetch_minutes: minutes } }), p))
            ).toStrictEqual({ value: 7, problems: [`git.autofetch_minutes: ${kind}`] });
        }
        expect(autofetchMin(mapWith({ git: { autofetch_minutes: 0 } }))).toBe(0);
    });

    it('answers the default bytes for a paint limit that is wrong, and null with no catalog', () => {
        expect(paintLimit(mapWith({ editor: { paint_limit_kb: 0 } }))).toBe(100 * 1024);
        expect(paintLimit(mapWith({ editor: { paint_limit_kb: 8 } }))).toBe(8 * 1024);
        expect(paintLimit({})).toBeNull();
    });
});

describe('confirmDelete', () => {
    it('answers the default for a wrong flag, and true with no catalog', () => {
        const wrong = mapWith({ files: { confirm_delete: 'no' } });
        expect(confirmDelete(wrong)).toBe(false);
        expect(confirmDelete({})).toBe(true);
    });
});

describe('appsSettings', () => {
    const read = (apps: unknown) => outcome((p) => appsSettings(mapWith({ apps }), p));
    const limits = (apps: unknown) => {
        const got = read(apps);
        return 'threw' in got
            ? got
            : {
                  value: { ...(got.value as object), closedPaths: undefined },
                  problems: got.problems
              };
    };
    const DEFAULT_LIMITS = {
        connectTimeoutS: 11,
        stateMaxKb: 70,
        storeMaxKb: 300,
        writesPerMin: 40,
        opensPerMin: 41,
        keysPerS: 25,
        messagesPerMin: 700,
        maxFiles: 600,
        maxMb: 25,
        hostOutputKb: 300,
        hostStopSeconds: 6,
        scanEntries: 12000,
        closedPaths: undefined
    };
    const closed = (held: unknown) => {
        const apps = held === undefined ? {} : { closed_paths: held };
        const found = behaviorFindings(SHIPPED_AT, mapWith({ apps }));
        return [
            appsSettings(mapWith({ apps })).closedPaths,
            found.filter((one) => one.key === 'apps.closed_paths').length
        ];
    };

    it.each([
        [
            'a limit that is missing, which answers the entry default and no problem',
            () => limits({ closed_paths: ['secrets'] }),
            { value: DEFAULT_LIMITS, problems: [] }
        ],
        [
            'a limit below its minimum',
            () => limits({ writes_per_min: -1, closed_paths: [] }),
            { value: DEFAULT_LIMITS, problems: ['apps.writes_per_min: range'] }
        ],
        [
            'a limit that is not a number',
            () => limits({ keys_per_s: 'x', closed_paths: [] }),
            { value: DEFAULT_LIMITS, problems: ['apps.keys_per_s: number'] }
        ],
        [
            'a limit that is not whole',
            () => limits({ max_files: 2.5, closed_paths: [] }),
            { value: DEFAULT_LIMITS, problems: ['apps.max_files: whole'] }
        ],
        [
            'limits that are set',
            () => {
                const got = limits({ writes_per_min: 5, keys_per_s: 3, closed_paths: [] });
                const value = 'value' in got ? (got.value as Record<string, unknown>) : {};
                return [value.writesPerMin, value.keysPerS];
            },
            [5, 3]
        ],
        [
            'closed_paths of a missing key',
            () => closed(undefined),
            [{ folders: null, shaped: false }, 1]
        ],
        [
            'closed_paths holding a number',
            () => closed(['a', 5]),
            [{ folders: null, shaped: false }, 1]
        ],
        [
            'closed_paths with an empty entry',
            () => closed(['', 'secrets']),
            [{ folders: ['secrets'], shaped: false }, 1]
        ],
        [
            'closed_paths with a dot-led entry',
            () => closed(['.x', 'secrets']),
            [{ folders: ['secrets'], shaped: false }, 1]
        ],
        [
            'closed_paths with an entry named twice',
            () => closed(['secrets', 'secrets']),
            [{ folders: ['secrets'], shaped: true }, 0]
        ],
        [
            'closed_paths of two folders',
            () => closed(['secrets', 'a/b']),
            [{ folders: ['secrets', 'a/b'], shaped: true }, 0]
        ],
        [
            'the closed_paths finding, worded with the key and the file',
            () => {
                const [found] = behaviorFindings(
                    SHIPPED_AT,
                    mapWith({ apps: { closed_paths: 5 } })
                );
                return [
                    found.key,
                    /config[\\/]defaults[\\/]behavior\.yml$/.test(found.file),
                    found.message.includes('apps.closed_paths'),
                    found.message.includes('config/defaults/behavior.yml')
                ];
            },
            ['apps.closed_paths', true, true, true]
        ],
        [
            'a catalog with no entry for an apps limit, which throws',
            () =>
                Object.keys(
                    outcome((p) =>
                        appsSettings(
                            mapWith({ apps: { closed_paths: [] } }, ['apps.keys_per_s']),
                            p
                        )
                    )
                ),
            ['threw']
        ]
    ] as [string, () => unknown, unknown][])('reads %s', (_row, observe, expected) => {
        expect(observe()).toStrictEqual(expected);
    });
});

describe('repositoryScanDepth', () => {
    const read = (held: Record<string, unknown>) =>
        outcome((p) => repositoryScanDepth(mapWith(held), p));

    it.each([
        ['0', { repository_scan_depth: 0 }, 0, []],
        ['3', { repository_scan_depth: 3 }, 3, []],
        ['the key missing', {}, 2, []],
        ['4', { repository_scan_depth: 4 }, 2, ['repository_scan_depth: range']],
        ['-1', { repository_scan_depth: -1 }, 2, ['repository_scan_depth: range']],
        ['1.5', { repository_scan_depth: 1.5 }, 2, ['repository_scan_depth: whole']],
        ['"one"', { repository_scan_depth: 'one' }, 2, ['repository_scan_depth: number']]
    ])(
        'answers for %s the depth the entry allows, or its default and a problem',
        (_row, held, value, problems) => {
            expect(read(held)).toStrictEqual({ value, problems });
        }
    );
});

describe('chatContext', () => {
    const DEFAULT = ['tasks', 'leads', 'funding'];
    /** A collections list of three collections and the feed leads. */
    const LIST = ['funding', 'events', 'tasks', 'leads'].map((key) => ({
        key,
        file: `${key}.yml`
    }));
    /**
     * A map over a catalog whose chat_context default is DEFAULT and LIST, with `held` laid
     * over.
     */
    const synthetic = (held: Record<string, unknown>) => (): Record<string, unknown> => ({
        options: {
            'sources.yml': { chat_context: { ...SOURCES.chat_context, default: DEFAULT } }
        },
        collections: LIST,
        ...held
    });
    /** Oculus's default chat_context keys but tasks, which a hub's own collections list holds. */
    const KEPT = ['funding', 'events', 'education', 'applications'];
    const KEPT_LIST = `collections:\n${KEPT.map((key) => `  - { key: ${key}, file: ${key}.yml }\n`).join('')}`;
    /** The merged map `loadConfig` reads for a planted hub whose settings file holds `text`. */
    const planted = (text: string) => (): Record<string, unknown> =>
        loadConfig(engineDir(), {
            hub: plantScratch('oculus-chat-context-', { '.oculus/config.yml': text })
        }).config;
    const WORDS = ['chat_context: words'];

    // Each row: the input, the map read, the keys answered, the problems pushed, and whether
    // settingProblems of the map holds chat_context, so a finding of the build names it.
    it.each([
        ['the key missing', synthetic({}), DEFAULT, [], false],
        [
            '[funding, nosuch]',
            synthetic({ chat_context: ['funding', 'nosuch'] }),
            ['funding'],
            [],
            false
        ],
        [
            '[funding, funding]',
            synthetic({ chat_context: ['funding', 'funding'] }),
            ['funding'],
            [],
            false
        ],
        ['[]', synthetic({ chat_context: [] }), [], [], false],
        ['one word', synthetic({ chat_context: 'events' }), ['events'], [], false],
        ['3', synthetic({ chat_context: 3 }), DEFAULT, WORDS, true],
        ['null', synthetic({ chat_context: null }), DEFAULT, WORDS, true],
        ['a map', synthetic({ chat_context: { funding: true } }), DEFAULT, WORDS, true],
        [
            'a list holding a number',
            synthetic({ chat_context: ['funding', 3] }),
            DEFAULT,
            WORDS,
            true
        ],
        [
            'a list without tasks',
            synthetic({ collections: LIST.filter((one) => one.key !== 'tasks') }),
            ['leads', 'funding'],
            [],
            false
        ],
        ['a list that is no list', synthetic({ collections: 'funding' }), [], [], false],
        ['a hub whose list leaves out tasks', planted(KEPT_LIST), KEPT, [], false],
        [
            'a hub whose list leaves out tasks, writing 3',
            planted(`${KEPT_LIST}chat_context: 3\n`),
            KEPT,
            WORDS,
            true
        ]
    ] as const)(
        'answers for %s the keys of the collections list it names, or its default and a problem',
        (_row, mapOf, value, problems, flagged) => {
            const map = mapOf();
            expect(outcome((p) => chatContext(map, p))).toStrictEqual({ value, problems });
            expect(settingProblems(map).some((one) => one.key === 'chat_context')).toBe(flagged);
        }
    );
});
