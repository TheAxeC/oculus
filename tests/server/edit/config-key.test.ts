// Layer 4, server test. The config-key writer: one option of a tracked config file set in place,
// the refusals that leave the file as it was, and the bytes it keeps.
//
// Every case runs over a scratch engine, a copy of the checkout's config/ folder with the machine's
// own file left out (tests/routes/edit/write-fixture.ts), so the writer reads the catalog, the text
// and the other files from the copy and writes the copy. What this does NOT cover: the route that
// carries the writer (tests/routes/edit/config-key.test.ts) and the page's call of it.

import { chmodSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { describe, expect, vi } from 'vitest';
import { parse, parseDocument } from 'yaml';
import { findingText } from '../../../src/lib/data/helpers/finding-text.ts';
import { engineDir, loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';
import { words } from '../../../src/lib/server/core/words.ts';
import { writeConfigKey } from '../../../src/lib/server/edit/writes/config-key.ts';
import { it } from '../../fixtures/scratch.ts';
import { engineFile, scratchEngine } from '../../routes/edit/write-fixture.ts';

/**
 * Which calls of the docs finder throw: the writer calls it once on the merged configuration as it
 * stands and once on the one holding the edit, so call 1 is before and call 2 is after.
 */
const docsFinder = vi.hoisted(() => ({ calls: 0, throwOn: [] as number[] }));

// The docs finder as it is, except that the calls a case names throw, since no config value makes
// it throw on its own.
vi.mock('../../../src/lib/server/content/docs.ts', async (original) => {
    const actual = await original<typeof import('../../../src/lib/server/content/docs.ts')>();
    return {
        ...actual,
        docFindings: (...args: Parameters<typeof actual.docFindings>) => {
            docsFinder.calls += 1;
            if (docsFinder.throwOn.includes(docsFinder.calls)) throw new Error('docs unreadable');
            return actual.docFindings(...args);
        }
    };
});

/**
 * Which calls of the languages finder give a finding: the writer calls it once on the merged
 * configuration as it stands and once on the one holding the edit, so call 1 is before and call 2
 * is after.
 */
const languagesFinder = vi.hoisted(() => ({ calls: 0, findOn: [] as number[] }));

// The languages finder as it is, except that the calls a case names give the finding of an ending
// two languages claim. No single value of a tracked file can make it give one: the map is a family,
// which is edited as text, so the call is where the writer's use of the finder is held.
vi.mock('../../../src/lib/data/sources/config/languages.ts', async (original) => {
    const actual =
        await original<typeof import('../../../src/lib/data/sources/config/languages.ts')>();
    return {
        ...actual,
        languageFindings: (...args: Parameters<typeof actual.languageFindings>) => {
            languagesFinder.calls += 1;
            const found = actual.languageFindings(...args);
            if (!languagesFinder.findOn.includes(languagesFinder.calls)) return found;
            return [
                ...found,
                {
                    file: 'sources.yml',
                    key: 'languages.cpp',
                    message: 'ending .h is listed under c and under cpp; c keeps it'
                }
            ];
        }
    };
});

const CATALOG = textCatalog(loadConfig(engineDir()).config);

/** One of the writer's own reason sentences, out of config/text/server.yml. */
function why(key: string, ...args: string[]): string {
    return words(CATALOG, `server.config_key.${key}`, ...args);
}

const KEEP = 'behavior.yml:changes.keep';

/** The `changes:` block of config/behavior.yml as the checkout holds it. */
const KEEP_BLOCK = 'changes:\n  keep: 500\n';

/** The block a case starts from: a comment above `keep` and a comment after its value. */
const KEEP_HELD = 'changes:\n  # how long the log is\n  keep: 200  # how many\n';

/** A scratch engine whose file holds the text `change` made of the checkout's. */
function engineWith(file: string, change: (text: string) => string): string {
    const engine = scratchEngine();
    const path = engineFile(engine, file);
    const original = readFileSync(path, 'utf8');
    const changed = change(original);
    expect(changed).not.toBe(original);
    writeFileSync(path, changed);
    return engine;
}

/** The text with the `changes:` block of KEEP_HELD in it. */
function keepText(text: string): string {
    return text.replace(KEEP_BLOCK, KEEP_HELD);
}

/** A scratch engine whose `changes.keep` holds 200 with the comments of KEEP_HELD. */
function keepEngine(): string {
    return engineWith('behavior.yml', keepText);
}

/** One file of a scratch engine, as it is now. */
function held(engine: string, file = 'behavior.yml'): string {
    return readFileSync(engineFile(engine, file), 'utf8');
}

/** The refusal an answer carries, and the proof that it changed and recorded nothing. */
function refusedWith(
    outcome: ReturnType<typeof writeConfigKey>,
    field: string
): string | undefined {
    expect(outcome.changed).toEqual([]);
    expect(outcome.records).toBeUndefined();
    expect(outcome.refused.map((one) => one.field)).toEqual([field]);
    return outcome.refused[0]?.reason;
}

/** One more option for a case's own file, added to the scratch engine's catalog. */
function addOption(engine: string, file: string, key: string, entry: object): void {
    const path = engineFile(engine, 'catalogs/options.yml');
    const doc = parseDocument(readFileSync(path, 'utf8'));
    doc.setIn(['options', file, key], entry);
    writeFileSync(path, doc.toString());
}

describe('one value written over its own bytes', () => {
    it('replaces the value and keeps every other byte, the comment on its line included', () => {
        const engine = keepEngine();
        const before = held(engine);
        const outcome = writeConfigKey(engine, 'behavior.yml', 'changes.keep', 300);
        expect(outcome.changed).toEqual([KEEP]);
        expect(outcome.refused).toEqual([]);
        expect(held(engine)).toBe(before.replace('keep: 200  # how many', 'keep: 300  # how many'));
        expect(outcome.records).toEqual([
            {
                file: engineFile(engine, 'behavior.yml'),
                key: 'behavior.yml',
                field: 'changes.keep',
                before: 200,
                after: 300,
                undo: 'field'
            }
        ]);
    });

    it('writes nothing for the value the file already holds', () => {
        const engine = keepEngine();
        const before = held(engine);
        const outcome = writeConfigKey(engine, 'behavior.yml', 'changes.keep', 200);
        expect(outcome).toEqual({ changed: [], refused: [] });
        expect(held(engine)).toBe(before);
    });

    it('writes a key three segments deep, in the style its line used', () => {
        const engine = scratchEngine();
        const layout = held(engine, 'layout.yml');
        const deck = held(engine, 'present.yml');
        const one = writeConfigKey(engine, 'layout.yml', 'board.search.projects', 'Find');
        const two = writeConfigKey(engine, 'present.yml', 'deck.meta.kicker', 'A kicker');
        expect([one.changed, two.changed]).toEqual([
            ['layout.yml:board.search.projects'],
            ['present.yml:deck.meta.kicker']
        ]);
        expect(held(engine, 'layout.yml')).toBe(
            layout.replace(/projects: "Search title[^"]*"/, 'projects: "Find"')
        );
        expect(held(engine, 'present.yml')).toBe(
            deck.replace(/kicker: 'Research portfolio[^']*'/, "kicker: 'A kicker'")
        );
    });

    it('keeps the quote style of the line, the apostrophe of a single-quoted one doubled', () => {
        const engine = scratchEngine();
        const quoted = writeConfigKey(engine, 'behavior.yml', 'usage_refresh_model', 'sonnet');
        expect(quoted.changed).toEqual(['behavior.yml:usage_refresh_model']);
        expect(held(engine)).toContain('usage_refresh_model: "sonnet"\n');
        writeConfigKey(engine, 'present.yml', 'deck.meta.kicker', "it's");
        expect(held(engine, 'present.yml')).toContain("kicker: 'it''s'\n");
        const bare = engineWith('behavior.yml', (text) =>
            text.replace('usage_refresh_model: "haiku"', 'usage_refresh_model: haiku')
        );
        writeConfigKey(bare, 'behavior.yml', 'usage_refresh_model', 'sonnet');
        expect(held(bare)).toContain('usage_refresh_model: sonnet\n');
    });

    it('writes a choice that is one of its values and a toggle that is a boolean', () => {
        const engine = scratchEngine();
        const appearance = held(engine, 'appearance.yml');
        expect(
            writeConfigKey(engine, 'appearance.yml', 'wallpaper.pick', 'random').changed
        ).toEqual(['appearance.yml:wallpaper.pick']);
        expect(writeConfigKey(engine, 'appearance.yml', 'crt.default', true).changed).toEqual([
            'appearance.yml:crt.default'
        ]);
        expect(held(engine, 'appearance.yml')).toBe(
            appearance
                .replace('pick: first', 'pick: random')
                .replace('crt:\n  default: false', 'crt:\n  default: true')
        );
    });

    it('writes a text that holds a colon, a hash and both quotes so the file reads back as it', () => {
        const engine = scratchEngine();
        const before = held(engine, 'appearance.yml');
        const text = 'a: b # "c" \'d\'';
        const outcome = writeConfigKey(engine, 'appearance.yml', 'wallpaper.dir', text);
        expect(outcome.refused).toEqual([]);
        const after = held(engine, 'appearance.yml');
        expect((parse(after) as { wallpaper: { dir: string } }).wallpaper.dir).toBe(text);
        const kept = (lines: string): string[] =>
            lines.split('\n').filter((line) => !line.trimStart().startsWith('dir:'));
        expect(kept(after)).toEqual(kept(before));
    });

    it('writes a text that holds a newline double-quoted, even over a single-quoted line', () => {
        const engine = scratchEngine();
        writeConfigKey(engine, 'behavior.yml', 'usage_refresh_model', 'a\nb');
        expect(held(engine)).toContain('usage_refresh_model: "a\\nb"\n');
        writeConfigKey(engine, 'present.yml', 'deck.meta.kicker', 'c\nd');
        expect(held(engine, 'present.yml')).toContain('kicker: "c\\nd"\n');
    });

    it('writes a text as given when it holds an em dash or an accented letter', () => {
        const engine = scratchEngine();
        const text = 'Portfolio \u2014 caf\u00e9';
        const outcome = writeConfigKey(engine, 'present.yml', 'deck.meta.kicker', text);
        expect(outcome.refused).toEqual([]);
        expect(held(engine, 'present.yml')).toContain(`kicker: '${text}'\n`);
    });

    it('writes nothing for a text equal to the one held, in whatever quote style the file uses', () => {
        const styled = ["'haiku'", 'haiku'].map((line) =>
            engineWith('behavior.yml', (text) =>
                text.replace('usage_refresh_model: "haiku"', `usage_refresh_model: ${line}`)
            )
        );
        for (const engine of [scratchEngine(), ...styled]) {
            const before = held(engine);
            const outcome = writeConfigKey(engine, 'behavior.yml', 'usage_refresh_model', 'haiku');
            expect(outcome).toEqual({ changed: [], refused: [] });
            expect(held(engine)).toBe(before);
        }
    });

    it('writes a text with commas and braces inside a flow map double-quoted', () => {
        const engine = engineWith(
            'behavior.yml',
            (text) => `${text}\nflow_probe: { text: plain, n: 1 }\n`
        );
        addOption(engine, 'behavior.yml', 'flow_probe.text', { description: 'x', control: 'text' });
        const value = 'a, b {c} [d]';
        const outcome = writeConfigKey(engine, 'behavior.yml', 'flow_probe.text', value);
        expect(outcome.refused).toEqual([]);
        expect(held(engine)).toContain('flow_probe: { text: "a, b {c} [d]", n: 1 }\n');
        expect((parse(held(engine)) as { flow_probe: { text: string } }).flow_probe.text).toBe(
            value
        );
    });

    it('keeps every CRLF line end and the byte order mark', () => {
        for (const prefix of ['', '\ufeff']) {
            const engine = engineWith(
                'behavior.yml',
                (text) => `${prefix}${keepText(text).replaceAll('\n', '\r\n')}`
            );
            const before = held(engine);
            const outcome = writeConfigKey(engine, 'behavior.yml', 'changes.keep', 300);
            expect(outcome.refused).toEqual([]);
            expect(held(engine)).toBe(
                before.replace('keep: 200  # how many', 'keep: 300  # how many')
            );
        }
    });
});

describe('a value the option does not take', () => {
    it("refuses a whole number the reader refuses, with the reader's own sentence", () => {
        const sentence = 'config/behavior.yml: changes.keep must be a whole number above zero';
        for (const value of [0, 2.5]) {
            const engine = keepEngine();
            const before = held(engine);
            expect(
                refusedWith(writeConfigKey(engine, 'behavior.yml', 'changes.keep', value), KEEP)
            ).toBe(sentence);
            expect(held(engine)).toBe(before);
        }
    });

    it('refuses what is not a finite number for a number option', () => {
        for (const value of ['300', true, [], null, JSON.parse('1e309'), {}]) {
            const engine = keepEngine();
            const before = held(engine);
            expect(
                refusedWith(writeConfigKey(engine, 'behavior.yml', 'changes.keep', value), KEEP)
            ).toBe(why('not_number'));
            expect(held(engine)).toBe(before);
        }
    });

    it('writes minus zero as zero, over an option whose reader takes zero', () => {
        const engine = scratchEngine();
        const before = held(engine);
        const outcome = writeConfigKey(engine, 'behavior.yml', 'calendar.days_back', -0);
        expect(outcome.refused).toEqual([]);
        expect(outcome.records?.[0].after).toBe(0);
        expect(held(engine)).toBe(before.replace(/days_back: \d+/, 'days_back: 0'));
        expect(
            (parse(held(engine)) as { calendar: { days_back: number } }).calendar.days_back
        ).toBe(0);
    });

    it('refuses a choice outside its values and a toggle that is not a boolean', () => {
        const engine = scratchEngine();
        const before = held(engine, 'appearance.yml');
        const pick = writeConfigKey(engine, 'appearance.yml', 'wallpaper.pick', 'last');
        expect(refusedWith(pick, 'appearance.yml:wallpaper.pick')).toBe(
            why('not_choice', 'first, random')
        );
        const toggle = writeConfigKey(engine, 'appearance.yml', 'crt.default', 'true');
        expect(refusedWith(toggle, 'appearance.yml:crt.default')).toBe(why('not_boolean'));
        const text = writeConfigKey(engine, 'appearance.yml', 'wallpaper.dir', 5);
        expect(refusedWith(text, 'appearance.yml:wallpaper.dir')).toBe(why('not_text'));
        expect(held(engine, 'appearance.yml')).toBe(before);
    });

    it('refuses a family and a list, which are not set one key at a time', () => {
        const engine = scratchEngine();
        for (const [file, key] of [
            ['appearance.yml', 'themes'],
            ['behavior.yml', 'data_domains'],
            ['behavior.yml', 'audit_ignore'],
            ['behavior.yml', 'read_limits']
        ]) {
            const before = held(engine, file);
            expect(refusedWith(writeConfigKey(engine, file, key, 'x'), `${file}:${key}`)).toBe(
                why('not_single')
            );
            expect(held(engine, file)).toBe(before);
        }
    });
});

describe('an option the catalog does not hold', () => {
    it("refuses the machine's own file without reading it", () => {
        const engine = scratchEngine();
        const local = engineFile(engine, 'local.yml');
        writeFileSync(local, 'port: 8791\n');
        const stamp = statSync(local).mtimeMs;
        const outcome = writeConfigKey(engine, 'local.yml', 'port', 8792);
        expect(refusedWith(outcome, 'local.yml:port')).toBe(why('local'));
        expect(readFileSync(local, 'utf8')).toBe('port: 8791\n');
        expect(statSync(local).mtimeMs).toBe(stamp);
    });

    it('refuses a key or a file the catalog has no entry for, the reserved names among them', () => {
        const engine = scratchEngine();
        const behavior = held(engine);
        const layout = held(engine, 'layout.yml');
        for (const [file, key] of [
            ['behavior.yml', 'not.a.key'],
            ['behavior.yml', ''],
            ['behavior.yml', '__proto__'],
            ['behavior.yml', 'constructor'],
            ['behavior.yml', 'toString'],
            ['__proto__', 'changes.keep'],
            ['constructor', 'changes.keep'],
            ['toString', 'changes.keep'],
            ['', 'changes.keep'],
            ['config/behavior.yml', 'changes.keep'],
            ['../behavior.yml', 'changes.keep'],
            ['behavior.yml/../layout.yml', 'changes.keep'],
            ['catalogs/options.yml', 'options']
        ]) {
            const outcome = writeConfigKey(engine, file, key, 5);
            expect(refusedWith(outcome, `${file}:${key}`)).toBe(why('no_entry'));
        }
        expect(held(engine)).toBe(behavior);
        expect(held(engine, 'layout.yml')).toBe(layout);
    });
});

describe('a file that does not hold the key', () => {
    it('refuses a file that does not parse and a file that holds a key twice', () => {
        const unparsed = engineWith('behavior.yml', (text) => `${text}\nbroken: [unclosed\n`);
        const twice = engineWith('behavior.yml', (text) => `${text}\nsearch:\n  max_hits: 1\n`);
        for (const engine of [unparsed, twice]) {
            const before = held(engine);
            const outcome = writeConfigKey(engine, 'behavior.yml', 'changes.keep', 300);
            expect(refusedWith(outcome, KEEP)).toBe(why('not_parsed'));
            expect(held(engine)).toBe(before);
        }
    });

    it('refuses a key that is absent, empty, null, an alias, anchored, tagged or a block scalar', () => {
        const variants = [
            'changes:\n  other: 1\n',
            'changes:\n  keep:\n',
            'changes:\n  keep: ~\n',
            'changes:\n  keep: null\n',
            'changes:\n  base: &v 5\n  keep: *v\n',
            'changes:\n  keep: &v 5\n  other: *v\n',
            'changes:\n  keep: !!int 5\n',
            'changes:\n  keep: |\n    5\n'
        ];
        for (const block of variants) {
            const engine = engineWith('behavior.yml', (text) => text.replace(KEEP_BLOCK, block));
            const before = held(engine);
            const outcome = writeConfigKey(engine, 'behavior.yml', 'changes.keep', 300);
            expect(refusedWith(outcome, KEEP)).toBe(why('not_in_file'));
            expect(held(engine)).toBe(before);
        }
    });

    it('refuses an edit that would change a second key, which an alias of the map reads', () => {
        const engine = engineWith('behavior.yml', (text) =>
            text.replace(KEEP_BLOCK, 'changes: &log\n  keep: 500\nchanges_copy: *log\n')
        );
        const before = held(engine);
        const outcome = writeConfigKey(engine, 'behavior.yml', 'changes.keep', 300);
        expect(refusedWith(outcome, KEEP)).toBe(why('not_kept'));
        expect(held(engine)).toBe(before);
    });

    it('writes beside a file value that JSON cannot hold: infinity, not a number and minus zero', () => {
        for (const scalar of ['.inf', '-.inf', '.nan', '-0']) {
            const engine = engineWith(
                'behavior.yml',
                (text) => `${keepText(text)}\nprobe: { a: ${scalar}, b: [${scalar}] }\n`
            );
            const outcome = writeConfigKey(engine, 'behavior.yml', 'changes.keep', 300);
            expect(outcome.refused).toEqual([]);
            expect(held(engine)).toContain('keep: 300  # how many');
            expect(held(engine)).toContain(`probe: { a: ${scalar}, b: [${scalar}] }`);
        }
    });

    it('refuses a key segment that holds a dot and a key that is not a string', () => {
        const dotted = engineWith('behavior.yml', (text) =>
            text.replace(KEEP_BLOCK, 'changes:\n  a.b: 1\n  keep: 500\n')
        );
        addOption(dotted, 'behavior.yml', 'changes.a.b', { description: 'x', control: 'number' });
        const numbered = engineWith('behavior.yml', (text) =>
            text.replace(KEEP_BLOCK, 'changes:\n  1: x\n  keep: 500\n')
        );
        addOption(numbered, 'behavior.yml', 'changes.1', { description: 'x', control: 'text' });
        for (const [engine, key, value] of [
            [dotted, 'changes.a.b', 2],
            [numbered, 'changes.1', 'y']
        ] as const) {
            const before = held(engine);
            const outcome = writeConfigKey(engine, 'behavior.yml', key, value);
            expect(refusedWith(outcome, `behavior.yml:${key}`)).toBe(why('not_in_file'));
            expect(held(engine)).toBe(before);
        }
    });
});

describe('the readers of the merged configuration', () => {
    it("refuses a value the reader of its block refuses, with that reader's sentence", () => {
        const cases: [string, number | string, string][] = [
            [
                'editor.paint_limit_kb',
                0,
                'config/behavior.yml: editor.paint_limit_kb must be a number above zero'
            ],
            ['usage_refresh_min', 0, 'usage_refresh_min must be a positive number'],
            ['usage_refresh_model', '', 'usage_refresh_model must not be empty'],
            [
                'search.timeout_s',
                0,
                'config/behavior.yml: search.timeout_s must be a number above zero'
            ]
        ];
        for (const [key, value, sentence] of cases) {
            const engine = scratchEngine();
            const before = held(engine);
            const outcome = writeConfigKey(engine, 'behavior.yml', key, value);
            expect(refusedWith(outcome, `behavior.yml:${key}`)).toBe(sentence);
            expect(held(engine)).toBe(before);
        }
    });

    it('refuses a code theme that is none, in the words of the finding it would give', () => {
        const engine = scratchEngine();
        const before = held(engine, 'appearance.yml');
        const outcome = writeConfigKey(engine, 'appearance.yml', 'code_theme', 'nonesuch');
        expect(refusedWith(outcome, 'appearance.yml:code_theme')).toBe(
            findingText(CATALOG, 'findings.appearance.code_theme', '"nonesuch"')
        );
        expect(held(engine, 'appearance.yml')).toBe(before);
    });

    it('writes the repair of a value the reader refuses, and refuses a write that leaves it', () => {
        const zero = (): string =>
            engineWith('behavior.yml', (text) =>
                text.replace('  max_hits: 500\n', '  max_hits: 0\n')
            );
        const mended = zero();
        const original = held(mended).replace('  max_hits: 0\n', '  max_hits: 500\n');
        const repair = writeConfigKey(mended, 'behavior.yml', 'search.max_hits', 500);
        expect(repair.changed).toEqual(['behavior.yml:search.max_hits']);
        expect(held(mended)).toBe(original);

        const stuck = zero();
        const before = held(stuck);
        const outcome = writeConfigKey(stuck, 'behavior.yml', 'search.timeout_s', 0);
        expect(refusedWith(outcome, 'behavior.yml:search.timeout_s')).toBe(
            'config/behavior.yml: search.max_hits must be a number above zero'
        );
        expect(held(stuck)).toBe(before);
    });

    it('writes nothing for the refused value the file holds, and refuses to put it back', () => {
        const engine = engineWith('behavior.yml', (text) =>
            text.replace('  max_hits: 500\n', '  max_hits: 0\n')
        );
        const outcome = writeConfigKey(engine, 'behavior.yml', 'search.max_hits', 0);
        expect(outcome).toEqual({ changed: [], refused: [] });
        const other = writeConfigKey(engine, 'behavior.yml', 'search.max_hits', 7);
        expect(other.changed).toEqual(['behavior.yml:search.max_hits']);
        const back = writeConfigKey(engine, 'behavior.yml', 'search.max_hits', 0);
        expect(refusedWith(back, 'behavior.yml:search.max_hits')).toBe(
            'config/behavior.yml: search.max_hits must be a number above zero'
        );
    });
});

describe('the period of the automatic fetch', () => {
    const FETCH = 'behavior.yml:git.autofetch_minutes';
    const SENTENCE =
        'config/behavior.yml: git.autofetch_minutes must be a whole number of minutes, 0 or more';

    it("refuses -1 and 1.5 with the reader's sentence and writes nothing", () => {
        for (const value of [-1, 1.5]) {
            const engine = scratchEngine();
            const before = held(engine);
            const outcome = writeConfigKey(engine, 'behavior.yml', 'git.autofetch_minutes', value);
            expect(refusedWith(outcome, FETCH), String(value)).toBe(SENTENCE);
            expect(held(engine)).toBe(before);
        }
    });

    it('refuses a text with the words of a number option and writes nothing', () => {
        const engine = scratchEngine();
        const before = held(engine);
        const outcome = writeConfigKey(engine, 'behavior.yml', 'git.autofetch_minutes', '5');
        expect(refusedWith(outcome, FETCH)).toBe(why('not_number'));
        expect(held(engine)).toBe(before);
    });

    it('writes 3 over the shipped 0 and keeps every other byte', () => {
        const engine = scratchEngine();
        const before = held(engine);
        const outcome = writeConfigKey(engine, 'behavior.yml', 'git.autofetch_minutes', 3);
        expect(outcome.refused).toEqual([]);
        expect(outcome.changed).toEqual([FETCH]);
        expect(held(engine)).toBe(before.replace('autofetch_minutes: 0', 'autofetch_minutes: 3'));
    });
});

describe('a file the writer cannot write', () => {
    it('lets the exception of a read-only file reach the route and leaves the mode as it was', () => {
        const engine = keepEngine();
        const path = engineFile(engine, 'behavior.yml');
        chmodSync(path, 0o444);
        const before = held(engine);
        expect(() => writeConfigKey(engine, 'behavior.yml', 'changes.keep', 300)).toThrow();
        expect(held(engine)).toBe(before);
        expect(statSync(path).mode & 0o777).toBe(0o444);
    });
});

describe('the readers that give findings', () => {
    /** A scratch engine whose docs list names a missing file, so the finder gives a finding. */
    function engineWithMissingDoc(): string {
        const engine = keepEngine();
        const path = engineFile(engine, 'layout.yml');
        const layout = readFileSync(path, 'utf8');
        const marker = '\ndocs:\n';
        expect(layout).toContain(marker);
        const doc = '  - { label: "Gone", path: docs/NOT-THERE.md, group: help }\n';
        writeFileSync(path, layout.replace(marker, `${marker}${doc}`));
        return engine;
    }

    it('refuses a write when a finder throws on the configuration holding it, in its own words', () => {
        docsFinder.calls = 0;
        docsFinder.throwOn = [2];
        const engine = keepEngine();
        const before = held(engine);
        const outcome = writeConfigKey(engine, 'behavior.yml', 'changes.keep', 300);
        expect(refusedWith(outcome, KEEP)).toBe('docs unreadable');
        expect(held(engine)).toBe(before);
    });

    it('refuses a write when a finder throws before the edit and again after it', () => {
        docsFinder.calls = 0;
        docsFinder.throwOn = [1, 2];
        const engine = keepEngine();
        const outcome = writeConfigKey(engine, 'behavior.yml', 'changes.keep', 300);
        expect(refusedWith(outcome, KEEP)).toBe('docs unreadable');
    });

    it('compares nothing for a finder that threw before the edit and gives findings after it', () => {
        docsFinder.calls = 0;
        docsFinder.throwOn = [1];
        const engine = engineWithMissingDoc();
        const outcome = writeConfigKey(engine, 'behavior.yml', 'changes.keep', 300);
        expect(outcome.refused).toEqual([]);
        expect(outcome.changed).toEqual([KEEP]);
        expect(held(engine)).toContain('keep: 300  # how many');
    });

    it('refuses a write after which the languages finder gives a finding it did not give before', () => {
        languagesFinder.calls = 0;
        languagesFinder.findOn = [2];
        const engine = keepEngine();
        const before = held(engine);
        const outcome = writeConfigKey(engine, 'behavior.yml', 'changes.keep', 300);
        expect(refusedWith(outcome, KEEP)).toBe(
            'ending .h is listed under c and under cpp; c keeps it'
        );
        expect(held(engine)).toBe(before);
    });

    it('writes when the languages finder gives the same finding before and after the edit', () => {
        languagesFinder.calls = 0;
        languagesFinder.findOn = [1, 2];
        const engine = keepEngine();
        const outcome = writeConfigKey(engine, 'behavior.yml', 'changes.keep', 300);
        expect(outcome.refused).toEqual([]);
        expect(languagesFinder.calls).toBe(2);
    });

    it('refuses the languages map itself, which is a family and not a value', () => {
        languagesFinder.calls = 0;
        languagesFinder.findOn = [];
        const engine = scratchEngine();
        const before = held(engine, 'sources.yml');
        const outcome = writeConfigKey(engine, 'sources.yml', 'languages', '.h');
        expect(refusedWith(outcome, 'sources.yml:languages')).toBe(why('not_single'));
        expect(held(engine, 'sources.yml')).toBe(before);
    });

    it('writes when a finder gives the same finding before and after the edit', () => {
        docsFinder.calls = 0;
        docsFinder.throwOn = [];
        const engine = engineWithMissingDoc();
        const outcome = writeConfigKey(engine, 'behavior.yml', 'changes.keep', 300);
        expect(outcome.refused).toEqual([]);
        expect(docsFinder.calls).toBe(2);
    });
});
