// Layer 1, data tests. The typed readers of single settings out of the merged map (slurm, calendar,
// search, open, mail, the change log's length, the usage tiers, the Processes view's program names,
// the LaTeX formatter and its auto build, the usage refresh, the automatic fetch, the editor's
// paint limit and the Files view's delete prompt). Each reader is run over a map that carries its
// own options catalog, whose every default differs from the shipped one, so a default written in
// code instead of read from the entry fails a row. A wrong value answers the entry's default and a
// problem naming the key; a missing key answers the default and no problem; a catalog with no entry
// for a key throws.

import { describe, expect, it } from 'vitest';
import {
    autofetchMin,
    calendarSettings,
    changesKeep,
    confirmDelete,
    engineDir,
    latexFormatting,
    loadConfig,
    mailSettings,
    openSettings,
    processesSettings,
    refreshSettings,
    searchSettings,
    slurmSettings,
    usageTiers
} from '../../../../src/lib/data/sources/config.ts';
import {
    latexAutoBuild,
    paintLimit,
    programApps,
    settingProblems,
    type SettingProblem
} from '../../../../src/lib/data/sources/config/settings.ts';
import { WRONG_EDITOR, WRONG_SETTINGS } from './wrong-settings.ts';

type Entries = Record<string, Record<string, unknown>>;

/** The shipped entries of behavior.yml, which a synthetic catalog is made from. */
const SHIPPED: Entries = (loadConfig(engineDir()).config.options as Record<string, Entries>)[
    'behavior.yml'
];

/** The default each synthetic entry answers, every one different from the shipped default. */
const DEFAULTS: Record<string, unknown> = {
    'slurm.resource': 'alpha',
    'slurm.days': 7,
    'slurm.poll_min': 25,
    'slurm.quota_min': 70,
    'slurm.prewarm': false,
    'calendar.poll_min': 20,
    'calendar.days_back': 10,
    'calendar.days_ahead': 20,
    'search.max_hits': 300,
    'search.timeout_s': 15,
    'mail.poll_min': 12,
    'mail.per_signal': 30,
    'changes.keep': 400,
    'processes.patterns': ['perl', 'ruby'],
    'latex.formatter': 'tex-fmt',
    'latex.latexindent_path': '/a/latexindent',
    'latex.tex_fmt_path': '/a/tex-fmt',
    'latex.badness_path': '/a/badness',
    'latex.auto_build': 'never',
    usage_refresh_min: 12,
    usage_refresh_model: 'm2',
    'git.autofetch_minutes': 7,
    'editor.paint_limit_kb': 100,
    'files.confirm_delete': false
};

/** A merged map whose catalog gives each setting a synthetic default, with the given keys set. */
function mapWith(held: Record<string, unknown> = {}, drop: string[] = []): Record<string, unknown> {
    const all: Entries = structuredClone(SHIPPED);
    for (const [key, value] of Object.entries(DEFAULTS)) all[key] = { ...all[key], default: value };
    const entries: Entries = Object.fromEntries(
        Object.entries(all).filter(([key]) => !drop.includes(key))
    );
    return {
        options: { 'behavior.yml': entries },
        agents: {
            claude: {
                lists: {
                    model: {
                        values: [
                            { pass: 'a', id: 'm1' },
                            { pass: 'b', id: 'm2' }
                        ]
                    }
                }
            }
        },
        ...held
    };
}

/** What a reader answers and the problems it found, as key and kind, or the sentence it throws. */
function outcome(
    read: (problems: SettingProblem[]) => unknown
): { value: unknown; problems: string[] } | { threw: string } {
    const problems: SettingProblem[] = [];
    try {
        const value = read(problems);
        return {
            value,
            problems: problems.map((one) =>
                'problem' in one ? `${one.key}: ${one.problem.kind}` : `${one.key}: ${one.where}`
            )
        };
    } catch (error) {
        return { threw: error instanceof Error ? error.message : String(error) };
    }
}

const NOT_FINITE = [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, '5', null];

describe('the synthetic catalog', () => {
    it('gives every setting a default other than the shipped one', () => {
        for (const [key, value] of Object.entries(DEFAULTS)) {
            expect(SHIPPED[key].default, key).not.toStrictEqual(value);
        }
    });
});

describe('slurmSettings', () => {
    const BLOCK = { resource: 'h', days: 3, poll_min: 5, quota_min: 30, prewarm: true };
    const DEFAULT = { resource: 'alpha', days: 7, pollMin: 25, quotaMin: 70, prewarm: false };
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
                    resource: 'h',
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

    it.each(['days', 'poll_min', 'quota_min'])(
        'answers the default for a %s that is no number',
        (key) => {
            for (const value of [...NOT_FINITE, 'x']) {
                const got = read({ ...BLOCK, [key]: value });
                expect(got).toMatchObject({ problems: [`slurm.${key}: number`] });
            }
        }
    );

    it('answers the default for an empty resource, a text that is not a program and a flag', () => {
        expect(read({ ...BLOCK, resource: '' })).toMatchObject({
            value: { resource: 'alpha' },
            problems: ['slurm.resource: empty']
        });
        expect(read({ ...BLOCK, prewarm: 'yes' })).toMatchObject({
            value: { prewarm: false },
            problems: ['slurm.prewarm: boolean']
        });
    });

    it('reads the corrected value with no problem', () => {
        expect(read({ ...BLOCK, poll_min: 5 })).toStrictEqual({
            value: { resource: 'h', days: 3, pollMin: 5, quotaMin: 30, prewarm: true },
            problems: []
        });
    });

    it('answers every default and one problem for a block that is not a map', () => {
        for (const block of [5, [1], 'x']) {
            expect(read(block)).toStrictEqual({ value: DEFAULT, problems: ['slurm: block'] });
        }
    });

    it('answers the defaults and no problem for a missing, null or empty block, a missing key and a misspelt key', () => {
        for (const block of [undefined, null, {}]) {
            expect(read(block)).toStrictEqual({ value: DEFAULT, problems: [] });
        }
        expect(read({ resource: 'h', days: 3, poll_min: 5, quota_min: 30 })).toStrictEqual({
            value: { resource: 'h', days: 3, pollMin: 5, quotaMin: 30, prewarm: false },
            problems: []
        });
        expect(read({ pol_min: 5, days: 3 })).toStrictEqual({
            value: { ...DEFAULT, days: 3 },
            problems: []
        });
    });

    it('names two wrong keys of one block and reads the other three', () => {
        expect(read({ ...BLOCK, days: -1, poll_min: 0 })).toStrictEqual({
            value: { resource: 'h', days: 7, pollMin: 25, quotaMin: 30, prewarm: true },
            problems: ['slurm.days: range', 'slurm.poll_min: range']
        });
    });

    it('throws the sentence naming the key and options.yml for a catalog with no entry', () => {
        const sentence =
            'config/catalogs/options.yml holds no entry, or no default that reads, for slurm.poll_min, so slurm.poll_min cannot be read';
        for (const poll_min of [0, 20]) {
            expect(
                outcome((p) =>
                    slurmSettings(mapWith({ slurm: { poll_min } }, ['slurm.poll_min']), p)
                )
            ).toStrictEqual({ threw: sentence });
        }
    });

    it('throws when an entry default is refused by its own bounds', () => {
        const map = mapWith({ slurm: { poll_min: 25 } });
        const entries = (map.options as Record<string, Entries>)['behavior.yml'];
        entries['slurm.poll_min'] = { ...entries['slurm.poll_min'], default: 0 };
        const sentence =
            'config/catalogs/options.yml holds no entry, or no default that reads, for slurm.poll_min, so slurm.poll_min cannot be read';
        expect(outcome((p) => slurmSettings(map, p))).toMatchObject({
            value: expect.anything() as unknown,
            problems: []
        });
        for (const poll_min of [0, undefined]) {
            map.slurm = poll_min === undefined ? {} : { poll_min };
            expect(outcome((p) => slurmSettings(map, p))).toStrictEqual({ threw: sentence });
        }
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

    it('answers the defaults for a block that is no map, and the written value for a good one', () => {
        expect(read(5)).toStrictEqual({
            value: { pollMin: 20, daysBack: 10, daysAhead: 20 },
            problems: ['calendar: block']
        });
        expect(read(BLOCK)).toStrictEqual({
            value: { pollMin: 5, daysBack: 8, daysAhead: 30 },
            problems: []
        });
    });
});

describe('searchSettings', () => {
    const read = (search: unknown) => outcome((p) => searchSettings(mapWith({ search }), p));

    it('answers the default for each value that is not above zero, and for a fraction of hits', () => {
        for (const bad of [...NOT_FINITE, -1, 0]) {
            expect(read({ max_hits: bad, timeout_s: 4 })).toMatchObject({
                value: { maxHits: 300, timeoutS: 4 },
                problems: [expect.stringMatching(/^search\.max_hits: /)]
            });
            expect(read({ max_hits: 9, timeout_s: bad })).toMatchObject({
                value: { maxHits: 9, timeoutS: 15 },
                problems: [expect.stringMatching(/^search\.timeout_s: /)]
            });
        }
        expect(read({ max_hits: 10.5, timeout_s: 4 })).toStrictEqual({
            value: { maxHits: 300, timeoutS: 4 },
            problems: ['search.max_hits: whole']
        });
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

    it('answers an empty map and one problem for a map that is none', () => {
        expect(read(5)).toStrictEqual({
            value: { programApps: {} },
            problems: ['open.program_ext: family']
        });
    });

    it('answers an empty map for a configuration that holds no catalog yet', () => {
        expect(programApps({})).toStrictEqual({});
    });
});

describe('latexFormatting and latexAutoBuild', () => {
    const PATHS = { latexindent_path: '', tex_fmt_path: '', badness_path: '' };
    const read = (latex: unknown) => outcome((p) => latexFormatting(mapWith({ latex }), p));

    it('answers the default for a formatter outside the entry words', () => {
        expect(read({ formatter: 'prettier', ...PATHS })).toMatchObject({
            value: { formatter: 'tex-fmt' },
            problems: ['latex.formatter: choice']
        });
    });

    it('answers the default for a program path that is not a path', () => {
        expect(read({ formatter: 'none', ...PATHS, latexindent_path: 'foo' })).toMatchObject({
            value: { paths: { latexindent: '/a/latexindent' } },
            problems: ['latex.latexindent_path: path']
        });
    });

    it('reads the auto build by its entry', () => {
        expect(latexAutoBuild(mapWith({ latex: { auto_build: 'on_save' } }))).toBe('on_save');
        expect(latexAutoBuild(mapWith({ latex: {} }))).toBe('never');
        expect(
            outcome((p) => latexAutoBuild(mapWith({ latex: { auto_build: 'x' } }), p))
        ).toStrictEqual({
            value: 'never',
            problems: ['latex.auto_build: choice']
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

    it('answers an empty map for a map that is none, and for none', () => {
        expect(read(5)).toStrictEqual({ value: {}, problems: ['usage_tiers: family'] });
        expect(read(undefined)).toStrictEqual({ value: {}, problems: [] });
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

    it('reads a good list and an empty one', () => {
        expect(read({ patterns: ['a', 'b'] })).toStrictEqual({
            value: { patterns: ['a', 'b'] },
            problems: []
        });
        expect(read({ patterns: [] })).toStrictEqual({ value: { patterns: [] }, problems: [] });
    });
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

describe('the shipped files', () => {
    const WRONG: Record<string, unknown> = {
        ...WRONG_SETTINGS,
        editor: { paint_limit_kb: WRONG_EDITOR.paint_limit_kb }
    };

    it('answers the shipped default for each setting the shipped file gets wrong, and reads every shipped default', () => {
        const shipped = loadConfig(engineDir()).config;
        expect(settingProblems(shipped)).toStrictEqual([]);
        const wrong = { ...shipped, ...WRONG };
        const problems = settingProblems(wrong).map((one) => one.key);
        expect(problems.sort()).toStrictEqual(
            [
                'slurm.resource',
                'slurm.days',
                'slurm.poll_min',
                'slurm.quota_min',
                'slurm.prewarm',
                'calendar.poll_min',
                'calendar.days_back',
                'calendar.days_ahead',
                'search.max_hits',
                'search.timeout_s',
                'mail.poll_min',
                'mail.per_signal',
                'changes.keep',
                'latex.formatter',
                'latex.latexindent_path',
                'latex.tex_fmt_path',
                'latex.badness_path',
                'latex.auto_build',
                'git.autofetch_minutes',
                'editor.paint_limit_kb',
                'files.confirm_delete',
                'processes.patterns',
                'usage_refresh_min',
                'usage_refresh_model',
                'usage_tiers.b',
                'open.program_ext.pdf',
                'open.program_ext..txt',
                'open.program_ext..x'
            ].sort()
        );
        expect(slurmSettings(wrong)).toStrictEqual(slurmSettings(shipped));
        expect(refreshSettings(wrong)).toStrictEqual(refreshSettings(shipped));
        expect(paintLimit(wrong)).toBe(paintLimit(shipped));
    });
});
