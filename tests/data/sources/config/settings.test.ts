// Layer 1, data tests. The typed readers of single settings out of the merged map (slurm, calendar,
// search, literature search, open, mail, the change log's length, the usage tiers, the Processes
// view's program names, the LaTeX formatter and its auto build, the usage refresh, the automatic
// fetch, the editor's paint limit, the Files view's delete prompt, the apps' limits and closed
// folders and the Repositories view's scan depth of sources.yml). Each reader is run over a map
// that carries its own options catalog, whose every default differs from the shipped one, so a
// default written in code instead of read from the entry fails a row. A wrong value answers the
// entry's default and a problem naming the key; a missing key answers the default and no problem; a
// catalog with no entry for a key throws.

import { describe, expect, it } from 'vitest';
import {
    autofetchMin,
    calendarSettings,
    changesKeep,
    confirmDelete,
    engineDir,
    latexFormatting,
    lintSettings,
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
} from '../../../../src/lib/data/sources/config.ts';
import { behaviorFindings } from '../../../../src/lib/data/sources/config/catalogs.ts';

/** Where the shipped config was read from: oculus's own files, no hub. */
const SHIPPED_AT = { engine: engineDir(), hub: null, from: loadConfig(engineDir()).from };
import { latexBuild } from '../../../../src/lib/data/sources/config/settings/latex.ts';
import { paintLimit, programApps } from '../../../../src/lib/data/sources/config/settings/files.ts';
import type { SettingProblem } from '../../../../src/lib/data/sources/config/settings/reader.ts';

type Entries = Record<string, Record<string, unknown>>;

/** The shipped entries of behavior.yml, which a synthetic catalog is made from. */
const SHIPPED: Entries = (loadConfig(engineDir()).config.options as Record<string, Entries>)[
    'behavior.yml'
];

/** The shipped entry of sources.yml that the scan depth is read by. */
const SCAN_DEPTH = (loadConfig(engineDir()).config.options as Record<string, Entries>)[
    'sources.yml'
].repository_scan_depth;

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
    'search.max_names': 7000,
    'literature.timeout_s': 40,
    'literature.per_source': 12,
    'literature.cache_min': 5,
    'mail.poll_min': 12,
    'mail.per_signal': 30,
    'changes.keep': 400,
    'processes.patterns': ['perl', 'ruby'],
    'latex.formatter': 'tex-fmt',
    'latex.latexindent_path': '/a/latexindent',
    'latex.tex_fmt_path': '/a/tex-fmt',
    'latex.badness_path': '/a/badness',
    'latex.auto_build': 'never',
    'latex.auto_build_interval_ms': 2500,
    'latex.recipe_default': 'last_used',
    'latex.out_dir': 'out',
    'latex.aux_dir': 'aux',
    'latex.clean_and_retry': false,
    'latex.auto_clean': 'on_built',
    'latex.synctex_path': '/a/synctex',
    'latex.reverse_synctex': 'double_click',
    'latex.texcount_autorun': 'on_save',
    'latex.context_menu': true,
    'latex.texlab_path': '/a/texlab',
    'latex.unimath_symbols': true,
    'latex.includegraphics_preview': false,
    'lint.chktex': false,
    'lint.ruff': false,
    'lint.eslint': false,
    'lint.shellcheck': false,
    'lint.writing': false,
    'lint.chktex_path': '/a/chktex',
    'lint.ruff_path': '/a/ruff',
    'lint.shellcheck_path': '/a/shellcheck',
    'lint.chktex_args': ['-q'],
    'lint.writing_skip': ['skip/**'],
    'lint.writing_glyphs': ['icons/**'],
    usage_refresh_min: 12,
    usage_refresh_model: 'm2',
    'git.autofetch_minutes': 7,
    'editor.paint_limit_kb': 100,
    'files.confirm_delete': false,
    'apps.connect_timeout_s': 11,
    'apps.state_max_kb': 70,
    'apps.store_max_kb': 300,
    'apps.writes_per_min': 40,
    'apps.opens_per_min': 41,
    'apps.keys_per_s': 25,
    'apps.messages_per_min': 700,
    'apps.max_files': 600,
    'apps.max_mb': 25,
    'apps.host_output_kb': 300,
    'apps.host_stop_seconds': 6,
    'apps.scan_entries': 12000
};

/** A merged map whose catalog gives each setting a synthetic default, with the given keys set. */
function mapWith(held: Record<string, unknown> = {}, drop: string[] = []): Record<string, unknown> {
    const all: Entries = structuredClone(SHIPPED);
    for (const [key, value] of Object.entries(DEFAULTS)) all[key] = { ...all[key], default: value };
    const entries: Entries = Object.fromEntries(
        Object.entries(all).filter(([key]) => !drop.includes(key))
    );
    return {
        options: {
            'behavior.yml': entries,
            'sources.yml': { repository_scan_depth: { ...SCAN_DEPTH, default: 2 } }
        },
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

    it('answers an empty resource as no cluster, with no problem', () => {
        expect(read({ ...BLOCK, resource: '' })).toMatchObject({
            value: { resource: '' },
            problems: []
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

/** What latexBuild answers for a block that holds nothing: the `latex.*` defaults of DEFAULTS. */
const BUILD_DEFAULTS = {
    recipes: [],
    tools: [],
    recipeDefault: 'last_used',
    outDir: 'out',
    auxDir: 'aux',
    autoBuild: 'never',
    autoBuildIntervalMs: 2500,
    cleanAndRetry: false,
    autoClean: 'on_built',
    synctexPath: '/a/synctex',
    reverseSynctex: 'double_click',
    texcountAutorun: 'on_save',
    contextMenu: true,
    texlabPath: '/a/texlab',
    unimathSymbols: true,
    includegraphicsPreview: false
};

describe('latexFormatting and the auto build', () => {
    const PATHS = { latexindent_path: '', tex_fmt_path: '', badness_path: '' };
    const read = (latex: unknown) => outcome((p) => latexFormatting(mapWith({ latex }), p));

    it('answers the default for a formatter outside the entry words', () => {
        expect(read({ formatter: 'prettier', ...PATHS })).toMatchObject({
            value: { formatter: 'tex-fmt' },
            problems: ['latex.formatter: choice']
        });
    });

    it('reads the auto build by its entry', () => {
        const auto = (latex: unknown) => latexBuild(mapWith({ latex })).autoBuild;
        expect(auto({ auto_build: 'on_save' })).toBe('on_save');
        expect(auto({ auto_build: 'on_file_change' })).toBe('on_file_change');
        expect(auto({})).toBe('never');
        expect(
            outcome((p) => latexBuild(mapWith({ latex: { auto_build: 'x' } }), p))
        ).toStrictEqual({ value: BUILD_DEFAULTS, problems: ['latex.auto_build: choice'] });
    });
});

describe('lintSettings', () => {
    const DEFAULT = {
        on: { chktex: false, ruff: false, eslint: false, shellcheck: false, writing: false },
        paths: { chktex: '/a/chktex', ruff: '/a/ruff', shellcheck: '/a/shellcheck' },
        chktexArgs: ['-q'],
        writingSkip: ['skip/**'],
        writingGlyphs: ['icons/**']
    };
    const read = (lint: unknown) => outcome((p) => lintSettings(mapWith({ lint }), p));

    it('answers the entry defaults for a block that holds nothing', () => {
        expect(read({})).toStrictEqual({ value: DEFAULT, problems: [] });
    });

    it('reads the switches, the paths and the arguments the block holds', () => {
        expect(
            read({
                chktex: true,
                ruff: true,
                eslint: true,
                shellcheck: true,
                writing: true,
                chktex_path: '~/bin/chktex',
                ruff_path: '/b/ruff',
                shellcheck_path: '/b/shellcheck',
                chktex_args: ['-wall', '-e9'],
                writing_skip: [' a/** ', '', 'b/*.md'],
                writing_glyphs: ['c/**']
            })
        ).toStrictEqual({
            value: {
                on: { chktex: true, ruff: true, eslint: true, shellcheck: true, writing: true },
                paths: { chktex: '~/bin/chktex', ruff: '/b/ruff', shellcheck: '/b/shellcheck' },
                chktexArgs: ['-wall', '-e9'],
                writingSkip: ['a/**', 'b/*.md'],
                writingGlyphs: ['c/**']
            },
            problems: []
        });
    });

    it.each([
        ['chktex', 'maybe', 'boolean'],
        ['ruff', 'maybe', 'boolean'],
        ['eslint', 'maybe', 'boolean'],
        ['shellcheck', 'maybe', 'boolean'],
        ['writing', 'maybe', 'boolean'],
        ['chktex_path', 'chktex', 'path'],
        ['ruff_path', 'ruff', 'path'],
        ['shellcheck_path', '../shellcheck', 'path'],
        ['chktex_args', 'no', 'strings'],
        ['writing_skip', 'no', 'strings'],
        ['writing_glyphs', 'no', 'strings']
    ])('answers the default for a wrong lint.%s and names the key', (key, bad, kind) => {
        expect(read({ [key]: bad })).toStrictEqual({
            value: DEFAULT,
            problems: [`lint.${key}: ${kind}`]
        });
    });
});

describe('latexBuild', () => {
    const TOOLS = [
        { name: 'one', command: 'latexmk', args: ['-pdf', '%DOC%'] },
        { name: 'two', command: 'bibtex', args: ['%DOCFILE%'] }
    ];
    const RECIPES = [
        { name: 'plain', tools: ['one'] },
        { name: 'chain', tools: ['one', 'two', 'one'] }
    ];
    const read = (latex: unknown) => outcome((p) => latexBuild(mapWith({ latex }), p));

    it('answers the entry defaults and no recipe for a block that holds nothing', () => {
        expect(read({})).toStrictEqual({ value: BUILD_DEFAULTS, problems: [] });
    });

    it('reads the recipes and the tools they name, in the order the file holds them', () => {
        expect(read({ tools: TOOLS, recipes: RECIPES })).toMatchObject({
            value: { tools: TOOLS, recipes: RECIPES },
            problems: []
        });
    });

    it.each([
        ['auto_build_interval_ms', 0, 'range', { autoBuildIntervalMs: 2500 }],
        ['auto_build_interval_ms', 1.5, 'whole', { autoBuildIntervalMs: 2500 }],
        ['recipe_default', 'x', 'choice', { recipeDefault: 'last_used' }],
        ['out_dir', 5, 'text', { outDir: 'out' }],
        ['aux_dir', 5, 'text', { auxDir: 'aux' }],
        ['clean_and_retry', 'yes', 'boolean', { cleanAndRetry: false }],
        ['auto_clean', 'x', 'choice', { autoClean: 'on_built' }],
        ['synctex_path', 'synctex', 'path', { synctexPath: '/a/synctex' }],
        ['reverse_synctex', 'x', 'choice', { reverseSynctex: 'double_click' }],
        ['texcount_autorun', 'x', 'choice', { texcountAutorun: 'on_save' }],
        ['context_menu', 'yes', 'boolean', { contextMenu: true }],
        ['texlab_path', 3, 'text', { texlabPath: '/a/texlab' }],
        ['unimath_symbols', 'yes', 'boolean', { unimathSymbols: true }],
        ['includegraphics_preview', 'yes', 'boolean', { includegraphicsPreview: false }]
    ])('answers the default for a wrong %s and names the key', (key, bad, kind, value) => {
        expect(read({ [key]: bad })).toMatchObject({
            value,
            problems: [`latex.${key}: ${kind}`]
        });
    });

    it('drops each row the entry refuses and names it, and keeps the others', () => {
        const tools = [
            TOOLS[0],
            { ...TOOLS[0], command: 'other' },
            { command: 'x', args: [] },
            5,
            { name: 'bare', command: '', args: [] },
            { name: 'bad', command: 'x', args: 'no' },
            TOOLS[1]
        ];
        const recipes = [
            RECIPES[0],
            { name: 'plain', tools: ['two'] },
            { name: '', tools: ['one'] },
            { name: 'lost', tools: ['nope'] },
            { name: 'empty', tools: [] },
            RECIPES[1]
        ];
        expect(read({ tools, recipes })).toMatchObject({
            value: { tools: TOOLS, recipes: RECIPES },
            problems: [
                'latex.tools: repeat',
                'latex.tools[2].name: text',
                'latex.tools[3]: records',
                'latex.tools[4].command: empty',
                'latex.tools[5].args: strings',
                'latex.recipes: repeat',
                'latex.recipes[2]: unnamed',
                'latex.recipes[3].tools: choice',
                'latex.recipes[4].tools: choice'
            ]
        });
    });

    it('names a list that is no list as a family problem', () => {
        expect(read({ tools: 'x', recipes: { a: 1 } })).toMatchObject({
            value: { tools: [], recipes: [] },
            problems: ['latex.tools: family', 'latex.recipes: family']
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
