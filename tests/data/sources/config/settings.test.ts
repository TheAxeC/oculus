// The typed readers of single settings out of the merged map (slurm, calendar, search, open, mail,
// the change log's length, the usage tiers, the Processes view's program names and the LaTeX
// formatter) over keys of every wrong shape. Each case names the value the reader answers or the
// sentence it throws, and the order in which two wrong keys are refused.

import { describe, expect, it } from 'vitest';
import {
    calendarSettings,
    changesKeep,
    engineDir,
    latexFormatting,
    loadConfig,
    mailSettings,
    openSettings,
    processesSettings,
    searchSettings,
    slurmSettings,
    usageTiers
} from '../../../../src/lib/data/sources/config.ts';

/** What a reader answers, or the sentence it throws. */
function outcome(read: () => unknown): { value: unknown } | { threw: string } {
    try {
        return { value: read() };
    } catch (error) {
        return { threw: error instanceof Error ? error.message : String(error) };
    }
}

const FILE = 'config/behavior.yml';
const threw = (sentence: string) => ({ threw: `${FILE}: ${sentence}` });

/** The numbers a reader of a finite number takes and refuses, in the order the cases try them. */
const NOT_FINITE = [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, '5', null];

/** What a cadence, a day window and a mail count are refused with. */
const CADENCE = 'a number from 1 to 35791';
const DAY_WINDOW = 'a whole number from 0 to 3650';
const PER_SIGNAL = 'a whole number from 1 to 500';
const PAST_CADENCE = [0, 0.5, -1, 35792];
const PAST_DAY_WINDOW = [-1, 1.5, 3651];
const PAST_PER_SIGNAL = [0, 2.5, -1, 501];

describe('slurmSettings', () => {
    const BLOCK = { resource: 'h', days: 7, poll_min: 5, quota_min: 30, prewarm: true };
    const read = (slurm: unknown) => outcome(() => slurmSettings({ slurm }));

    it.each([[[]], ['x'], [null], [3]])('refuses a slurm key of %j', (slurm) => {
        expect(read(slurm)).toStrictEqual(threw('slurm must be a map'));
    });

    it.each([
        ['days', DAY_WINDOW, PAST_DAY_WINDOW],
        ['poll_min', CADENCE, PAST_CADENCE],
        ['quota_min', CADENCE, PAST_CADENCE]
    ])('refuses a %s that is not a number or is past its bound', (key, words, past) => {
        for (const bad of [...NOT_FINITE, ...past]) {
            expect(read({ ...BLOCK, [key]: bad })).toStrictEqual(
                threw(`slurm.${key} must be ${words}`)
            );
        }
    });

    it('reads the days at both ends of the window and the cadences at both ends of theirs', () => {
        for (const days of [0, 1, 3650]) {
            expect(read({ ...BLOCK, days })).toStrictEqual({
                value: { resource: 'h', days, pollMin: 5, quotaMin: 30, prewarm: true }
            });
        }
        for (const minutes of [1, 1.5, 35791]) {
            expect(read({ ...BLOCK, poll_min: minutes, quota_min: minutes })).toStrictEqual({
                value: {
                    resource: 'h',
                    days: 7,
                    pollMin: minutes,
                    quotaMin: minutes,
                    prewarm: true
                }
            });
        }
    });

    it.each([[''], [3], [null], [[]]])('refuses a resource of %j', (resource) => {
        expect(read({ ...BLOCK, resource })).toStrictEqual(
            threw('slurm.resource must be a non-empty string')
        );
    });

    it('refuses a prewarm that is not a boolean', () => {
        for (const prewarm of ['true', 1, null]) {
            expect(read({ ...BLOCK, prewarm })).toStrictEqual(
                threw('slurm.prewarm must be true or false')
            );
        }
    });

    it('refuses a block with host: and no resource:, naming slurm.resource', () => {
        const withHost = { host: 'h', days: 7, poll_min: 5, quota_min: 30, prewarm: true };
        expect(read(withHost)).toStrictEqual(threw('slurm.resource must be a non-empty string'));
    });

    it('refuses the resource before the prewarm and the prewarm before the numbers', () => {
        expect(read({ ...BLOCK, resource: 3, prewarm: 'x', days: 'x' })).toStrictEqual(
            threw('slurm.resource must be a non-empty string')
        );
        expect(read({ ...BLOCK, prewarm: 'x', days: 'x' })).toStrictEqual(
            threw('slurm.prewarm must be true or false')
        );
        expect(read({ ...BLOCK, days: 'x', poll_min: 'x' })).toStrictEqual(
            threw(`slurm.days must be ${DAY_WINDOW}`)
        );
    });
});

describe('calendarSettings', () => {
    const BLOCK = { poll_min: 5, days_back: 7, days_ahead: 30 };
    const read = (calendar: unknown) => outcome(() => calendarSettings({ calendar }));

    it.each([[[]], ['x'], [null], [3]])('refuses a calendar key of %j', (calendar) => {
        expect(read(calendar)).toStrictEqual(threw('calendar must be a map'));
    });

    it('refuses each number that is not a number or is past its bound, naming the key', () => {
        const kinds: [string, string, number[]][] = [
            ['poll_min', CADENCE, PAST_CADENCE],
            ['days_back', DAY_WINDOW, PAST_DAY_WINDOW],
            ['days_ahead', DAY_WINDOW, PAST_DAY_WINDOW]
        ];
        for (const [key, words, past] of kinds) {
            for (const bad of [...NOT_FINITE, ...past]) {
                expect(read({ ...BLOCK, [key]: bad })).toStrictEqual(
                    threw(`calendar.${key} must be ${words}`)
                );
            }
        }
    });

    it('reads the window at both ends of its bound and the cadence at both ends of its own', () => {
        for (const days of [0, 1, 3650]) {
            expect(read({ ...BLOCK, days_back: days, days_ahead: days })).toStrictEqual({
                value: { pollMin: 5, daysBack: days, daysAhead: days }
            });
        }
        for (const pollMin of [1, 35791]) {
            expect(read({ ...BLOCK, poll_min: pollMin })).toStrictEqual({
                value: { pollMin, daysBack: 7, daysAhead: 30 }
            });
        }
    });
});

describe('searchSettings', () => {
    const BLOCK = { max_hits: 100, timeout_s: 20 };
    const read = (search: unknown) => outcome(() => searchSettings({ search }));

    it.each([[[]], ['x'], [null], [3]])('refuses a search key of %j', (search) => {
        expect(read(search)).toStrictEqual(threw('search must be a map'));
    });

    it('refuses each number that is not finite and above zero, naming the key', () => {
        for (const key of Object.keys(BLOCK)) {
            for (const bad of [...NOT_FINITE, -1, 0]) {
                expect(read({ ...BLOCK, [key]: bad })).toStrictEqual(
                    threw(`search.${key} must be a number above zero`)
                );
            }
        }
    });

    it('reads a fractional number as it is', () => {
        expect(read({ max_hits: 1.5, timeout_s: 0.5 })).toStrictEqual({
            value: { maxHits: 1.5, timeoutS: 0.5 }
        });
    });
});

describe('mailSettings', () => {
    const BLOCK = { poll_min: 5, per_signal: 10 };
    const read = (mail: unknown) => outcome(() => mailSettings({ mail }));

    it.each([[[]], ['x'], [null], [3]])('refuses a mail key of %j', (mail) => {
        expect(read(mail)).toStrictEqual(threw('mail must be a map'));
    });

    it('refuses each number that is not a number or is past its bound, naming the key', () => {
        const kinds: [string, string, number[]][] = [
            ['poll_min', CADENCE, PAST_CADENCE],
            ['per_signal', PER_SIGNAL, PAST_PER_SIGNAL]
        ];
        for (const [key, words, past] of kinds) {
            for (const bad of [...NOT_FINITE, ...past]) {
                expect(read({ ...BLOCK, [key]: bad })).toStrictEqual(
                    threw(`mail.${key} must be ${words}`)
                );
            }
        }
    });

    it('reads the count at both ends of its bound and the cadence at both ends of its own', () => {
        for (const per of [1, 25, 500]) {
            expect(read({ ...BLOCK, per_signal: per })).toStrictEqual({
                value: { pollMin: 5, perSignal: per }
            });
        }
        for (const pollMin of [1, 35791]) {
            expect(read({ ...BLOCK, poll_min: pollMin })).toStrictEqual({
                value: { pollMin, perSignal: 10 }
            });
        }
    });
});

describe('changesKeep', () => {
    const read = (changes: unknown) => outcome(() => changesKeep({ changes }));

    it.each([[[]], ['x'], [null], [3]])('refuses a changes key of %j', (changes) => {
        expect(read(changes)).toStrictEqual(threw('changes must be a map'));
    });

    it('refuses a keep that is not a whole number above zero', () => {
        for (const keep of [...NOT_FINITE, -1, 0, 1.5, undefined]) {
            expect(read({ keep })).toStrictEqual(
                threw('changes.keep must be a whole number above zero')
            );
        }
    });

    it('reads a whole number above zero', () => {
        expect(read({ keep: 500 })).toStrictEqual({ value: 500 });
    });
});

describe('openSettings', () => {
    const MESSAGE = 'open.program_ext must map extensions, each with its dot, to bundle ids';
    const read = (open: unknown) => outcome(() => openSettings({ open }));

    it.each([
        [[]],
        ['x'],
        [{}],
        [{ program_ext: [] }],
        [{ program_ext: { pdf: 'com.apple.Preview' } }],
        [{ program_ext: { '.pdf': 3 } }],
        [{ program_ext: { '.pdf': 'Preview' } }]
    ])('refuses an open key of %j', (open) => {
        expect(read(open)).toStrictEqual(threw(MESSAGE));
    });

    it('reads the extensions lowercased', () => {
        expect(read({ program_ext: { '.PDF': 'com.apple.Preview' } })).toStrictEqual({
            value: { programApps: { '.pdf': 'com.apple.Preview' } }
        });
    });
});

describe('latexFormatting', () => {
    const PATHS = { latexindent_path: '', tex_fmt_path: '', badness_path: '' };
    const read = (latex: unknown) => outcome(() => latexFormatting({ latex }));

    it('reads the shipped keys from config/behavior.yml: no formatter, every program on PATH', () => {
        const { config } = loadConfig(engineDir());
        expect(latexFormatting(config)).toStrictEqual({
            formatter: 'none',
            paths: { latexindent: '', 'tex-fmt': '', badness: '' }
        });
    });

    it.each(['none', 'latexindent', 'tex-fmt', 'badness'])(
        'reads the formatter %s',
        (formatter) => {
            expect(read({ formatter, ...PATHS, tex_fmt_path: '/opt/tex-fmt' })).toStrictEqual({
                value: {
                    formatter,
                    paths: { latexindent: '', 'tex-fmt': '/opt/tex-fmt', badness: '' }
                }
            });
        }
    );

    it.each([['prettier'], [''], [null], [undefined]])('refuses a formatter of %j', (formatter) => {
        expect(read({ formatter, ...PATHS })).toStrictEqual(
            threw('latex.formatter must be one of none, latexindent, tex-fmt, badness')
        );
    });

    it.each(['latexindent_path', 'tex_fmt_path', 'badness_path'])(
        'refuses a %s that is not text',
        (key) => {
            expect(read({ formatter: 'none', ...PATHS, [key]: 3 })).toStrictEqual(
                threw(`latex.${key} must be text, empty for the program on PATH`)
            );
        }
    );

    it('refuses a latex key that is not a map', () => {
        expect(read('tex-fmt')).toStrictEqual(threw('latex must be a map'));
    });
});

describe('usageTiers', () => {
    const read = (usage_tiers: unknown) => outcome(() => usageTiers({ usage_tiers }));

    it.each([[[]], ['x'], [null], [3]])('refuses a usage_tiers key of %j', (tiers) => {
        expect(read(tiers)).toStrictEqual(threw('usage_tiers must be a map'));
    });

    it('refuses the first value that is not text, naming its key', () => {
        expect(read({ a: 'A', b: 5, c: null })).toStrictEqual(
            threw('usage_tiers.b must be a string')
        );
    });

    it('answers the map it was given', () => {
        const tiers = { max5: 'Max 5x', pro: 'Pro' };
        expect(usageTiers({ usage_tiers: tiers })).toBe(tiers);
    });
});

describe('processesSettings', () => {
    const WORDS = 'a list of program names, each without a slash or a space';
    const read = (processes: unknown) => outcome(() => processesSettings({ processes }, []));
    const catalog = (list: unknown) => ({
        options: { 'behavior.yml': { 'processes.patterns': { default: list } } }
    });

    it.each([[[]], ['x'], [null], [3]])('refuses a processes key of %j', (processes) => {
        expect(read(processes)).toStrictEqual(threw('processes must be a map'));
    });

    it.each([
        [{}],
        [{ patterns: 'node' }],
        [{ patterns: null }],
        [{ patterns: {} }],
        [{ patterns: [''] }],
        [{ patterns: ['a/b'] }],
        [{ patterns: ['a b'] }],
        [{ patterns: ['a\tb'] }],
        [{ patterns: [3] }],
        [{ patterns: ['node', null] }],
        [{ patterns: ['node', ''] }]
    ])('refuses a processes block of %j', (processes) => {
        expect(read(processes)).toStrictEqual(threw(`processes.patterns must be ${WORDS}`));
    });

    it('reads a list of names', () => {
        expect(read({ patterns: ['python3', 'node'] })).toStrictEqual({
            value: { patterns: ['python3', 'node'] }
        });
    });

    it('reads a name twice listed once, in the order it first stands', () => {
        expect(read({ patterns: ['node', 'claude', 'node'] })).toStrictEqual({
            value: { patterns: ['node', 'claude'] }
        });
    });

    it('accepts an empty list, which lists oculus own processes only', () => {
        expect(read({ patterns: [] })).toStrictEqual({ value: { patterns: [] } });
    });

    it('reads the default list the options catalog holds when processes: is missing', () => {
        expect(outcome(() => processesSettings(catalog(['python3', 'codex']), []))).toStrictEqual({
            value: { patterns: ['python3', 'codex'] }
        });
    });

    it('refuses a default the catalog holds that is not names', () => {
        expect(outcome(() => processesSettings(catalog(['a/b']), []))).toStrictEqual(
            threw(`processes.patterns must be ${WORDS}`)
        );
    });

    it('refuses a missing processes: that the catalog holds no default for', () => {
        expect(outcome(() => processesSettings({}, []))).toStrictEqual(
            threw('processes must be a map')
        );
    });

    describe('when the merge dropped config/behavior.yml', () => {
        const dropped = { file: '/hub/config/behavior.yml', key: '' };

        it('refuses the missing processes: instead of reading the catalog default', () => {
            const outcomeOf = outcome(() =>
                processesSettings(catalog(['python3', 'codex']), [dropped])
            );
            expect(outcomeOf).toStrictEqual(threw('processes must be a map'));
        });

        it('reads a processes: block the merge holds', () => {
            expect(
                outcome(() => processesSettings({ processes: { patterns: ['node'] } }, [dropped]))
            ).toStrictEqual({ value: { patterns: ['node'] } });
        });

        it.each([
            [{ file: '/hub/config/other.yml', key: '' }],
            [{ file: '/hub/config/behavior.yml', key: 'processes.patterns' }],
            [{ file: '/hub/config/not-behavior.yml', key: '' }]
        ])('reads the catalog default for a finding of %j', (finding) => {
            expect(
                outcome(() => processesSettings(catalog(['python3', 'codex']), [finding]))
            ).toStrictEqual({ value: { patterns: ['python3', 'codex'] } });
        });
    });

    it('refuses the shipped configuration whose behavior.yml was saved unparseable, as the merge reports it', () => {
        const saved = { name: 'behavior.yml', text: 'slurm: [unterminated' };
        const { config, findings } = loadConfig(engineDir(), saved);
        expect(config.processes).toBeUndefined();
        expect(outcome(() => processesSettings(config, findings))).toStrictEqual(
            threw('processes must be a map')
        );
        const { config: whole, findings: none } = loadConfig(engineDir());
        const { processes: _removed, ...without } = whole;
        expect(outcome(() => processesSettings(without, none))).toStrictEqual({
            value: { patterns: ['python3', 'codex', 'claude', 'node', 'latexmk'] }
        });
    });

    it('reads the shipped list from config/behavior.yml, which is the default its catalog entry holds', () => {
        const { config } = loadConfig(engineDir());
        const shipped = ['python3', 'codex', 'claude', 'node', 'latexmk'];
        expect(processesSettings(config, [])).toStrictEqual({ patterns: shipped });
        const { processes: _removed, ...without } = config;
        expect(processesSettings(without, [])).toStrictEqual({ patterns: shipped });
    });
});
