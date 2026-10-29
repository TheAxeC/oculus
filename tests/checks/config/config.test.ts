// Layer 4, tree check. The readers of the config folder (loadConfig, behaviorFindings,
// settingFindings, themeFindings, vocabCatalog, optionFindings) over synthetic files in a temporary
// directory, and the one real config they are run over for no finding. The sentences checkLocal
// answers, and readLocal's problems, are rows of tests/data/sources/config/local/local.test.ts, and
// the join of the hubs' local.yml files is tests/data/sources/config/local/machine.test.ts. The
// config folder oculus ships is read by tests/checks/config/config-folder.test.ts.

import { cpSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, resolve, sep } from 'node:path';
import { describe, expect, vi } from 'vitest';
import {
    checkLocal,
    engineDir,
    loadConfig,
    sourceFile,
    textCatalog,
    vocabCatalog,
    type ConfigWhere
} from '../../../src/lib/data/sources/config.ts';
import {
    behaviorFindings,
    settingFindings
} from '../../../src/lib/data/sources/config/catalogs.ts';
import { optionFindings } from '../../../src/lib/data/sources/config/catalog/option-findings.ts';
import { themeFindings } from '../../../src/lib/data/sources/config/sections/themes.ts';
import { HUB_FILE } from '../../../src/lib/data/helpers/hub-names.ts';
import { NO_OFFERS } from '../../../src/lib/data/helpers/files/apps/choices.ts';
import { setAppearance, themes } from '../../../src/lib/state/shared/words/appearance.ts';
import { vscodeRuleIds } from '../../../src/lib/data/places/code-rules.ts';
import { readEditorOptions } from '../../../src/lib/data/sources/config/editor-options.ts';
import { parse } from 'yaml';
import { noop } from '../../fixtures/doubles.ts';
import { it, scratchDir } from '../../fixtures/scratch.ts';
import { WRONG_EDITOR, WRONG_SETTINGS } from '../../data/sources/config/wrong-settings.ts';

function scratch(): string {
    const dir = scratchDir('oculus-config-');
    return dir;
}

/** The sentence file oculus ships, which loadConfig words its own findings from. */
const FINDINGS_FILE = join(engineDir(), 'config', 'text', 'findings.yml');

/** The flat catalog entries of that file, as a merged `text` map holds them. */
const SENTENCES = textCatalog(
    parse(readFileSync(FINDINGS_FILE, 'utf8')) as Record<string, unknown>
);

/** Give a synthetic engine the shipped sentence file, so its findings read in their own words. */
function withSentences(engine: string): void {
    writeConfig(engine, join('text', 'findings.yml'), readFileSync(FINDINGS_FILE, 'utf8'));
}

/** Write one file into <engine>/config, creating the directory the first time. */
function writeConfig(engine: string, name: string, body: string): string {
    const file = join(engine, 'config', name);
    expect(resolve(file).startsWith(resolve(engine) + sep)).toBe(true);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, body);
    return file;
}

// The check the source endpoint makes before it writes the machine's own file: it reads a body the
// way readMachine does and prints nothing for a key it does not know, which readMachine warns
// about.
describe('checkLocal', () => {
    it('says nothing, and prints nothing, about an unknown key', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(noop);
        try {
            expect(checkLocal('colour: teal\n')).toBeNull();
            expect(warn).not.toHaveBeenCalled();
        } finally {
            warn.mockRestore();
        }
    });
});

/** Write one defaults file into <engine>/config/defaults. */
function writeDefaults(engine: string, name: string, body: string): string {
    return writeConfig(engine, join('defaults', name), body);
}

/** Where a merged config of `engine` was read from, named as the shipped config's `from` does. */
const SHIPPED_FROM = loadConfig(engineDir()).from;

function shippedAt(engine: string): ConfigWhere {
    return { engine, hub: null, from: SHIPPED_FROM };
}

describe('the config folder of an engine', () => {
    it('is that engine own folder, so a run over a copy reads and writes the copy', () => {
        const engine = scratch();
        writeDefaults(engine, 'behavior.yml', 'stale_days: 30\n');
        const copy = scratch();
        writeDefaults(copy, 'behavior.yml', 'stale_days: 7\n');
        expect(loadConfig(engine).config.stale_days).toBe(30);
        expect(loadConfig(copy).config.stale_days).toBe(7);
    });

    it('is the folder a finding about one of its keys names', () => {
        // A run over a copy never reaches the checkout's own folder.
        const engine = scratch();
        writeDefaults(engine, 'sources.yml', 'scan: []\n');
        expect(sourceFile(engine, engine, loadConfig(engine).from, 'scan')).toBe(
            join(engine, 'config', 'defaults', 'sources.yml')
        );
    });

    it('reads a .yml file at the top of config/ as no defaults file', () => {
        const engine = scratch();
        writeConfig(engine, 'behavior.yml', 'stale_days: 30\n');
        expect(loadConfig(engine).config.stale_days).toBeUndefined();
    });
});

describe('loadConfig', () => {
    it('merges the top-level keys of every file in name order', () => {
        const engine = scratch();
        writeDefaults(engine, 'behavior.yml', 'stale_days: 30\nread_limits: { lines: 400 }\n');
        writeDefaults(engine, 'vocab.yml', 'palette: [teal, amber]\n');
        // Not a .yml file, so it is not merged.
        writeDefaults(engine, 'notes.md', 'palette: ignored\n');

        const { config, findings } = loadConfig(engine);
        expect(Object.keys(config).sort()).toEqual(['palette', 'read_limits', 'stale_days']);
        expect(config.stale_days).toBe(30);
        expect(config.read_limits).toEqual({ lines: 400 });
        expect(config.palette).toEqual(['teal', 'amber']);
        expect(findings).toEqual([]);
    });

    it('reports a top-level key two files define and takes the value from the later one', () => {
        const engine = scratch();
        withSentences(engine);
        writeDefaults(engine, 'a-first.yml', 'palette: [teal]\nonly_here: 1\n');
        const later = writeDefaults(engine, 'b-later.yml', 'palette: [amber]\n');

        const { config, findings } = loadConfig(engine);
        expect(config.palette).toEqual(['amber']);
        expect(config.only_here).toBe(1);
        expect(findings).toEqual([
            {
                file: later,
                key: 'palette',
                message: 'key palette is already defined in a-first.yml; b-later.yml wins'
            }
        ]);
    });

    it('reports a catalog key two owner files define and takes the later value', () => {
        const engine = scratch();
        withSentences(engine);
        const dir = join(engine, 'config', 'text');
        mkdirSync(dir, { recursive: true });
        writeFileSync(join(dir, 'app.yml'), 'text: { app: { title: first } }\n');
        const later = join(dir, 'ui.yml');
        writeFileSync(later, 'text: { app: { title: second } }\n');

        const { config, findings } = loadConfig(engine);
        expect(config.text).toEqual({ ...SENTENCES, 'app.title': 'second' });
        expect(findings).toEqual([
            {
                file: later,
                key: 'text.app.title',
                message: 'key text.app.title is already defined in text/app.yml; text/ui.yml wins'
            }
        ]);
    });

    it('reports a file that does not parse and merges the rest', () => {
        const engine = scratch();
        withSentences(engine);
        writeDefaults(engine, 'broken.yml', 'title: "unterminated\n  - [\n');
        writeDefaults(engine, 'good.yml', 'text: { app: { title: oculus } }\n');

        const { config, findings } = loadConfig(engine);
        expect(config.text).toEqual({ ...SENTENCES, 'app.title': 'oculus' });
        expect(findings.length).toBe(1);
        expect(findings[0].file).toBe(join(engine, 'config', 'defaults', 'broken.yml'));
        expect(findings[0].message).toMatch(/^does not parse: /);
    });

    it('reports a file that is not a map and treats an empty file as no keys', () => {
        const engine = scratch();
        withSentences(engine);
        writeDefaults(engine, 'listy.yml', '- one\n- two\n');
        writeDefaults(engine, 'nothing.yml', '');

        const { config, findings } = loadConfig(engine);
        expect(config).toEqual({ text: SENTENCES });
        expect(findings).toEqual([
            {
                file: join(engine, 'config', 'defaults', 'listy.yml'),
                key: '',
                message: 'is not a map of keys'
            }
        ]);
    });

    // With no config directory there is no catalog to word the finding from, so it is written as
    // its catalog key, which is what the Findings view shows for this one case.
    it('reports a missing config directory and returns an empty map', () => {
        const engine = scratch();
        const { config, findings } = loadConfig(engine);

        expect(config).toEqual({});
        expect(findings).toEqual([
            {
                file: join(engine, 'config'),
                key: '',
                message: 'findings.config.directory_missing'
            }
        ]);
    });

    it('words a catalog block that is not a map from the catalog, naming where it stops', () => {
        const engine = scratch();
        withSentences(engine);
        const root = writeConfig(engine, join('text', 'root.yml'), 'text: 5\n');
        const inner = writeConfig(
            engine,
            join('text', 'inner.yml'),
            'text: { app: { title: ~ } }\n'
        );

        const { findings } = loadConfig(engine);
        expect(findings).toEqual([
            { file: inner, key: 'text', message: 'text catalog: app.title is not a map' },
            { file: root, key: 'text', message: 'text catalog: root is not a map' }
        ]);
        // Without the sentence file the same finding is its key and the path, so the words above
        // are the catalog's and not the thrown error's.
        const bare = scratch();
        const alone = writeConfig(bare, join('text', 'root.yml'), 'text: 5\n');
        expect(loadConfig(bare).findings).toEqual([
            { file: alone, key: 'text', message: 'findings.config.text_not_a_map root' }
        ]);
    });

    it('reports a catalog block whose aliases loop as a finding rather than throwing', () => {
        const engine = scratch();
        withSentences(engine);
        const looped = writeConfig(engine, join('text', 'loop.yml'), 'text: &x\n  a: *x\n');
        const { findings } = loadConfig(engine);
        expect(findings).toHaveLength(1);
        expect(findings[0].file).toBe(looped);
        expect(findings[0].key).toBe('text');
        expect(findings[0].message).not.toBe('');
    });

    // The sentence file is one of the files loadConfig reads, so when it is the one that breaks,
    // its own finding and every other is worded by key and arguments rather than thrown on.
    it('names a sentence file that does not parse by its key and arguments, without throwing', () => {
        const engine = scratch();
        cpSync(join(engineDir(), 'config'), join(engine, 'config'), { recursive: true });
        const broken = writeConfig(engine, join('text', 'findings.yml'), 'text: [\n');
        const listy = writeDefaults(engine, 'listy.yml', '- one\n');

        const { config, findings } = loadConfig(engine);
        expect(findings.map((one) => one.file)).toEqual([listy, broken]);
        expect(findings[0].message).toBe('findings.file.not_a_map');
        expect(findings[1].message).toMatch(/^findings\.file\.does_not_parse \S/);
        // The broken file gives no words, so the key worded above is not in the merged catalog.
        expect(textCatalog(config)['findings.file.not_a_map']).toBe(undefined);
    });
});

describe("loadConfig with the hub's settings file", () => {
    /** A copy of the checkout's config folder as an engine. */
    function engineCopy(): string {
        const engine = scratch();
        cpSync(join(engineDir(), 'config'), join(engine, 'config'), { recursive: true });
        return engine;
    }

    /** Write a hub's `.oculus/config.yml`, creating the folder, and answer its path. */
    function settings(hub: string, body: string): string {
        const file = join(hub, HUB_FILE);
        expect(resolve(file).startsWith(resolve(hub) + sep)).toBe(true);
        mkdirSync(dirname(file), { recursive: true });
        writeFileSync(file, body);
        return file;
    }

    /** The finding sentence of the catalog for a key, with its values filled in. */
    function sentence(config: Record<string, unknown>, key: string, ...values: string[]): string {
        return values.reduce(
            (text, value, at) => text.replace(`{${at}}`, value),
            textCatalog(config)[`findings.config.${key}`]
        );
    }

    it('applies every listed key of one file whole and names the file in `from`', () => {
        const engine = engineCopy();
        const hub = scratch();
        settings(
            hub,
            [
                'slurm:',
                '  resource: [other]',
                'memories_dir: .oculus/photos',
                'scan:',
                '  - { dir: work }',
                'career_file: other/career.yml',
                'app_settings:',
                '  notes.width: 100',
                ''
            ].join('\n')
        );
        const { config, findings, from } = loadConfig(engine, { hub });
        expect(findings).toEqual([]);
        const slurm = config.slurm as Record<string, unknown>;
        expect(slurm.resource).toEqual(['other']);
        expect(slurm.poll_min).toBe(
            (loadConfig(engine).config.slurm as Record<string, unknown>).poll_min
        );
        expect(config.memories_dir).toBe('.oculus/photos');
        expect(config.scan).toEqual([{ dir: 'work' }]);
        expect(config.career_file).toBe('other/career.yml');
        expect(config.app_settings).toEqual({ 'notes.width': 100 });
        expect(from['slurm.resource']).toBe(HUB_FILE);
        expect(from.memories_dir).toBe(HUB_FILE);
        expect(from.slurm).toBe('behavior.yml');
    });

    it('names a key the list does not hold, with the file, and applies none of them', () => {
        const engine = engineCopy();
        const hub = scratch();
        const file = settings(
            hub,
            'theme: dark\nslurm: { resource: [x], poll_min: 3 }\nvenues_file: other/venues.yml\ncareer_file: other/career.yml\n'
        );
        const engineOnly = loadConfig(engine).config;
        const { config, findings } = loadConfig(engine, { hub });
        expect(findings.map((one) => [one.file, one.key])).toEqual([
            [file, 'theme'],
            [file, 'slurm.poll_min'],
            [file, 'venues_file']
        ]);
        const messages = findings.map((one) => one.message);
        expect(messages).toContain(sentence(config, 'hub_key_unknown', 'theme'));
        expect(messages).toContain(sentence(config, 'hub_key_unknown', 'slurm.poll_min'));
        expect(messages).toContain(sentence(config, 'hub_key_unknown', 'venues_file'));
        expect(config.theme).toEqual(engineOnly.theme);
        expect(config.venues_file).toBeUndefined();
        expect(config.career_file).toBe('other/career.yml');
        const slurm = config.slurm as Record<string, unknown>;
        expect(slurm.poll_min).toBe((engineOnly.slurm as Record<string, unknown>).poll_min);
        expect(slurm.resource).toEqual(['x']);
    });

    it('names a key the primary hub alone is read for, set in another hub, and applies none of it', () => {
        const engine = engineCopy();
        const hub = scratch();
        const file = settings(
            hub,
            'career_file: other/career.yml\nslurm: { resource: x }\nmemories_dir: .oculus/photos\n'
        );
        const engineOnly = loadConfig(engine).config;
        const { config, findings } = loadConfig(engine, { hub, other: 'lab' });
        expect(findings.map((one) => [one.file, one.key])).toEqual([
            [file, 'career_file'],
            [file, 'slurm.resource']
        ]);
        expect(findings.map((one) => one.message)).toEqual([
            sentence(config, 'hub_key_primary', 'career_file', 'lab'),
            sentence(config, 'hub_key_primary', 'slurm.resource', 'lab')
        ]);
        expect(config.career_file).toBe(engineOnly.career_file);
        expect((config.slurm as Record<string, unknown>).resource).toEqual(
            (engineOnly.slurm as Record<string, unknown>).resource
        );
        expect(config.memories_dir).toBe('.oculus/photos');
    });

    it.each([
        ['is empty', ''],
        ['is a list', '- a\n- b\n'],
        ['does not parse', 'slurm: [unclosed\n'],
        ['holds a key twice', 'career_file: other/a.yml\ncareer_file: other/b.yml\n']
    ])('keeps the engine values and names the file when the file %s', (_row, body) => {
        const engine = engineCopy();
        const hub = scratch();
        const file = settings(hub, body);
        const { config, findings } = loadConfig(engine, { hub });
        expect(findings.map((one) => [one.file, one.key])).toEqual([[file, '']]);
        expect((config.slurm as Record<string, unknown>).resource).toEqual([]);
        const engineCareer = loadConfig(engine).config.career_file;
        expect(engineCareer).toBe('.oculus/data/academic/career.yml');
        expect(config.career_file).toBe(engineCareer);
    });

    it('reads the engine alone for a hub without the file, for a call that passes no hub and for a .oculus/config/ folder', () => {
        const engine = engineCopy();
        const hub = scratch();
        expect(loadConfig(engine, { hub }).findings).toEqual([]);
        expect(loadConfig(engine, { hub }).config.memories_dir).toBe('.oculus/memories');
        mkdirSync(join(hub, '.oculus', 'config'), { recursive: true });
        writeFileSync(
            join(hub, '.oculus', 'config', 'sources.yml'),
            'memories_dir: .oculus/photos\n'
        );
        expect(loadConfig(engine, { hub }).config.memories_dir).toBe('.oculus/memories');
        settings(hub, 'memories_dir: .oculus/photos\n');
        expect(loadConfig(engine).config.memories_dir).toBe('.oculus/memories');
        expect(loadConfig(engine, { hub }).config.memories_dir).toBe('.oculus/photos');
    });
});

describe('behaviorFindings', () => {
    /**
     * The merged catalog these findings are worded from, as the server's merged config holds it,
     * and the `apps.closed_paths` key behavior.yml carries, which a configuration without it is
     * given a finding for.
     */
    const WORDS = {
        text: loadConfig(engineDir()).config.text,
        apps: { closed_paths: ['secrets'] }
    };

    it.each([
        ['chat.skip_permissions', { chat: { skip_permissions: true } }],
        ['tasks.skip_permissions', { tasks: { skip_permissions: true } }]
    ])(
        'says a retired key is not read and names the Run unattended choice, against the file it was read from: %s',
        (key, retired) => {
            const engine = scratch();
            const where = {
                ...shippedAt(engine),
                from: { ...SHIPPED_FROM, tasks: 'behavior.yml' }
            };
            expect(behaviorFindings(where, { ...WORDS, ...retired })).toEqual([
                {
                    file: join(engine, 'config', 'defaults', 'behavior.yml'),
                    key,
                    message: `${key} is not read; a schedule in the update tray runs unattended through its Run unattended choice`
                }
            ]);
        }
    );

    // A `focus:` block in a malformed form, over the shipped configuration, gives one finding for
    // each value, row or field the page does not read, against behavior.yml.
    it.each([
        [3, [['focus', 'focus must be a map; none of its keys is read']]],
        [
            { venue_conc_warn: 'x' },
            [['focus.venue_conc_warn', 'focus.venue_conc_warn must be a number; it is not read']]
        ]
    ])('words a focus block of the form %j', (focus, expected) => {
        const engine = scratch();
        const shipped = loadConfig(engineDir()).config;
        const found = behaviorFindings(shippedAt(engine), { ...shipped, focus }).filter((one) =>
            one.key.startsWith('focus')
        );
        expect(found.map((one) => one.key)).toEqual(expected.map(([key]) => key));
        found.forEach((one, at) => {
            expect(one.file).toBe(join(engine, 'config', 'defaults', 'behavior.yml'));
            expect(one.message).toContain(expected[at][1]);
        });
    });

    it('says nothing about a configuration whose keys are all under their own names', () => {
        const engine = scratch();
        expect(behaviorFindings(shippedAt(engine), { ...WORDS, chat: { model: 'opus' } })).toEqual(
            []
        );
        expect(behaviorFindings(shippedAt(engine), { ...WORDS, chat: 'opus' })).toEqual([]);
        expect(behaviorFindings(shippedAt(engine), loadConfig(engineDir()).config)).toEqual([]);
    });
});

describe('settingFindings', () => {
    const engine = engineDir();
    const shipped = loadConfig(engine).config;
    const WRONG: Record<string, unknown> = { ...WRONG_SETTINGS, editor: WRONG_EDITOR };
    const file = join(engine, 'config', 'defaults', 'behavior.yml');
    const said = (config: Record<string, unknown>) =>
        settingFindings(shippedAt(engine), config).map((one) => `${one.key}: ${one.message}`);

    it('words each wrong setting against behavior.yml from the catalog, and nothing for the shipped files', () => {
        const findings = settingFindings(shippedAt(engine), { ...shipped, ...WRONG });
        expect(new Set(findings.map((one) => one.file))).toEqual(new Set([file]));
        const keys = findings.map((one) => one.key);
        expect(new Set(keys).size).toBe(keys.length);
        expect([...keys].sort()).toEqual(
            [
                'calendar.days_ahead',
                'calendar.days_back',
                'calendar.poll_min',
                'changes.keep',
                'editor.autosave',
                'editor.autosave_delay_ms',
                'editor.final_newline',
                'editor.languages.cobolx',
                'editor.languages.cpp.format_on_save',
                'editor.languages.cpp.trim_trailing_whitespace',
                'editor.languages.markdown',
                'editor.languages.python.final_newline',
                'editor.languages.python.tab_size',
                'editor.paint_limit_kb',
                'editor.tab_size',
                'editor.trim_trailing_whitespace',
                'editor.word_wrap',
                'files.confirm_delete',
                'git.autofetch_minutes',
                'latex.aux_dir',
                'latex.auto_build',
                'latex.auto_build_interval_ms',
                'latex.auto_clean',
                'latex.badness_path',
                'latex.clean_and_retry',
                'latex.context_menu',
                'latex.formatter',
                'latex.includegraphics_preview',
                'latex.latexindent_path',
                'latex.out_dir',
                'latex.recipe_default',
                'latex.recipes',
                'latex.recipes[2]',
                'latex.recipes[3].tools',
                'latex.reverse_synctex',
                'latex.synctex_path',
                'latex.texcount_autorun',
                'latex.tex_fmt_path',
                'latex.texlab_path',
                'latex.tools',
                'latex.tools[2].name',
                'latex.tools[3]',
                'latex.tools[4].command',
                'latex.tools[5].args',
                'latex.unimath_symbols',
                'lint.chktex',
                'lint.chktex_args',
                'lint.chktex_path',
                'lint.eslint',
                'lint.ruff',
                'lint.ruff_path',
                'lint.shellcheck',
                'lint.shellcheck_path',
                'lint.writing',
                'lint.writing_glyphs',
                'lint.writing_skip',
                'literature.cache_min',
                'literature.per_source',
                'literature.timeout_s',
                'mail.per_signal',
                'mail.poll_min',
                'open.program_ext..txt',
                'open.program_ext..x',
                'open.program_ext.pdf',
                'processes.patterns',
                'search.max_hits',
                'search.max_names',
                'search.timeout_s',
                'slurm.days',
                'slurm.poll_min',
                'slurm.prewarm',
                'slurm.quota_min',
                'slurm.resource',
                'usage_refresh_min',
                'usage_refresh_model',
                'usage_tiers.b'
            ].sort()
        );
        const lines = said({ ...shipped, ...WRONG });
        expect(lines).toContain(
            'slurm.days: slurm.days must be a whole number from 0 to 3650; the default is used'
        );
        expect(lines).toContain(
            'editor.tab_size: editor.tab_size must be a whole number from 1 to 8; the default is used'
        );
        expect(lines).toContain(
            'editor.languages.cobolx: editor.languages.cobolx is not a language the editor colours; its record is not read'
        );
        expect(lines).toContain(
            'editor.languages.cpp.format_on_save: editor.languages.cpp.format_on_save must be true or false; the field is not read'
        );
        expect(lines).toContain(
            'editor.languages.cpp.trim_trailing_whitespace: editor.languages.cpp.trim_trailing_whitespace must be true or false; the field is not read'
        );
        expect(lines).toContain(
            'editor.autosave: editor.autosave must be one of off, after_delay, on_focus_change; the default is used'
        );
        expect(lines).toContain(
            'editor.autosave_delay_ms: editor.autosave_delay_ms must be a whole number of at least 0; the default is used'
        );
        expect(lines).toContain(
            'editor.trim_trailing_whitespace: editor.trim_trailing_whitespace must be true or false; the default is used'
        );
        expect(lines).toContain(
            'editor.final_newline: editor.final_newline must be true or false; the default is used'
        );
        expect(lines).toContain(
            'editor.languages.python.final_newline: editor.languages.python.final_newline must be true or false; the field is not read'
        );
        const read = readEditorOptions({ ...shipped, ...WRONG }).options;
        expect(read).toMatchObject({
            autosave: 'off',
            autosaveDelay: 1000,
            trimTrailingWhitespace: false,
            finalNewline: false
        });
        expect(read.languages.cpp).toBeUndefined();
        expect(read.languages.python).toBeUndefined();
        const fraction = { ...shipped, editor: { autosave_delay_ms: 1.5 } };
        expect(readEditorOptions(fraction).options.autosaveDelay).toBe(1000);
        expect(said(fraction)).toEqual([
            'editor.autosave_delay_ms: editor.autosave_delay_ms must be a whole number of at least 0; the default is used'
        ]);
        expect(lines).toContain(
            'open.program_ext.pdf: open.program_ext.pdf must be an extension with its dot; the entry is not read'
        );
        expect(lines).toContain(
            'slurm.resource: slurm.resource must be a list of words; the default is used'
        );
        expect(settingFindings(shippedAt(engine), shipped)).toEqual([]);
    });

    it('reads an empty slurm.resource as no cluster, with no finding', () => {
        expect(said({ ...shipped, slurm: { resource: [] } })).toEqual([]);
    });

    it('says nothing for a merge that dropped behavior.yml, or for a map without the catalog', () => {
        const dropped = Object.fromEntries(
            Object.entries({ ...shipped, ...WRONG }).filter(([key]) => !(key in WRONG))
        );
        expect(settingFindings(shippedAt(engine), dropped)).toEqual([]);
        expect(settingFindings(shippedAt(engine), { text: shipped.text, ...WRONG })).toEqual([]);
    });
});

describe('themeFindings', () => {
    /**
     * The merged catalog the findings are worded from, the shipped code theme lists, which hold the
     * VS Code code themes, and a vocabulary of two glyph names.
     */
    const SHIPPED = loadConfig(engineDir()).config;
    const BASE = {
        text: SHIPPED.text,
        code_themes: SHIPPED.code_themes,
        glyphs: { sun: '(o)', box: '<>' }
    };

    /** The findings over these theme rows, each as its key and its sentence. */
    function said(themes: unknown): string[] {
        return themeFindings(shippedAt(scratch()), { ...BASE, themes }).map(
            (one) => `${one.key}: ${one.message}`
        );
    }

    it('names a theme row whose glyph is empty or missing, and draws it with its words alone', () => {
        expect(said([{ name: 'a', glyph: '' }, { name: 'b' }, { name: 'c', glyph: 3 }])).toEqual([
            'themes[0]: the theme a names no glyph; it is offered with its words alone',
            'themes[1]: the theme b names no glyph; it is offered with its words alone',
            'themes[2]: the theme c names no glyph; it is offered with its words alone'
        ]);
    });

    it('names a glyph the vocabulary does not hold, a prototype key among them', () => {
        expect(
            said([
                { name: 'a', glyph: 'nonesuch' },
                { name: 'b', glyph: 'constructor' }
            ])
        ).toEqual([
            'themes[0]: the theme a names a glyph glyphs.yml does not hold; it is offered with its words alone',
            'themes[1]: the theme b names a glyph glyphs.yml does not hold; it is offered with its words alone'
        ]);
    });

    it('names a second row repeating a theme, and nothing for two rows sharing a glyph', () => {
        expect(
            said([
                { name: 'a', glyph: 'sun' },
                { name: 'b', glyph: 'sun' },
                { name: 'a', glyph: 'box' }
            ])
        ).toEqual(['themes[2]: a second theme row names a; only the first is offered']);
    });

    it('names a theme row whose group is a number or empty, and draws it before the groups', () => {
        expect(
            said([
                { name: 'a', glyph: 'sun', group: 5 },
                { name: 'b', glyph: 'sun', group: '' },
                { name: 'c', glyph: 'sun', group: 'VS Code, dark' },
                { name: 'd', glyph: 'sun' }
            ])
        ).toEqual([
            'themes[0]: the theme a names a group that is not words; it is drawn before the groups',
            'themes[1]: the theme b names a group that is not words; it is drawn before the groups'
        ]);
        setAppearance(
            {
                ...SHIPPED,
                themes: [
                    { name: 'a', glyph: 'sun', group: 5 },
                    { name: 'b', glyph: 'sun', group: '' }
                ]
            },
            vscodeRuleIds()
        );
        expect(themes(NO_OFFERS).map((one) => [one.name, one.group])).toEqual([
            ['a', ''],
            ['b', '']
        ]);
        setAppearance(SHIPPED, vscodeRuleIds());
    });

    it('names a code_themes.shiki that is no list, and each row with no id, a repeated id or an id Shiki does not bundle', () => {
        const lists = SHIPPED.code_themes as Record<string, unknown>;
        const SHIKI = (key: string, message: string): string =>
            `appearance.yml code_themes.shiki${key}: ${message}`;
        expect(codeSaid({ code_themes: { ...lists, shiki: 'nord' } })).toEqual([
            SHIKI('', 'code_themes.shiki is not a list of rows; no Shiki code theme is offered')
        ]);
        expect(
            codeSaid({
                code_themes: {
                    ...lists,
                    shiki: [
                        { id: 'nord', label: 'Nord' },
                        { label: 'No id' },
                        { id: 'nord', label: 'Again' },
                        { id: 'nope' },
                        { id: 'tokens' }
                    ]
                }
            })
        ).toEqual([
            SHIKI('[1]', 'the row 1 of code_themes.shiki has no id; it makes no code theme'),
            SHIKI(
                '[2]',
                'a second row of code_themes.shiki names nord; only the first makes a code theme'
            ),
            SHIKI(
                '[3]',
                'code_themes.shiki names nope, which is no theme Shiki bundles; it makes no code theme'
            ),
            SHIKI(
                '[4]',
                'code_themes.shiki names tokens, which is no theme Shiki bundles; it makes no code theme'
            )
        ]);
        expect(codeSaid({ code_themes: { ...lists, shiki: [] } })).toEqual([]);
        expect(
            codeSaid({ code_theme: 'github-light', code_themes: { ...lists, shiki: [] } })
        ).toEqual([CODE('"github-light"')]);
    });

    it('names a code_themes.vscode that is no list, and each row with no class, a repeated class, tokens or a class with no rules', () => {
        const lists = SHIPPED.code_themes as Record<string, unknown>;
        const VSCODE = (key: string, message: string): string =>
            `appearance.yml code_themes.vscode${key}: ${message}`;
        expect(codeSaid({ code_themes: { ...lists, vscode: 'vscode-dark-plus' } })).toEqual([
            VSCODE('', 'code_themes.vscode is not a list of rows; no VS Code code theme is offered')
        ]);
        expect(
            codeSaid({
                code_themes: {
                    ...lists,
                    vscode: [
                        { class: 'vscode-dark-plus', label: 'Dark+' },
                        { label: 'No class' },
                        { class: 'vscode-dark-plus', label: 'Again' },
                        { class: 'tokens' },
                        { class: 'vscode-nowhere' }
                    ]
                }
            })
        ).toEqual([
            VSCODE('[1]', 'the row 1 of code_themes.vscode has no class; it makes no code theme'),
            VSCODE(
                '[2]',
                'a second row of code_themes.vscode names vscode-dark-plus; only the first makes a code theme'
            ),
            VSCODE(
                '[3]',
                "a row of code_themes.vscode names tokens, which takes the UI theme's own code tokens; it makes no code theme"
            ),
            VSCODE(
                '[4]',
                'code_themes.vscode names vscode-nowhere, which has no TextMate rules in src/lib/themes/vscode-rules.json; it makes no code theme'
            )
        ]);
        expect(codeSaid({ code_theme: 'vscode-nowhere', code_themes: lists })).toEqual([
            CODE('"vscode-nowhere"')
        ]);
    });

    it("names an app_theme that is not words or names no theme, and nothing for a row's or an app's theme", () => {
        const APP = (shown: string): string =>
            `appearance.yml app_theme: app_theme is ${shown}, which names neither a theme of themes nor an app's theme; a window of the desktop app whose theme names no theme it can draw starts on the first theme of themes`;
        const rows = [
            { name: 'a', glyph: 'sun' },
            { name: 'a', glyph: 'box' }
        ];
        const repeated =
            'appearance.yml themes[1]: a second theme row names a; only the first is offered';
        expect(codeSaid({ themes: rows, app_theme: 'a' })).toEqual([repeated]);
        expect(codeSaid({ themes: rows, app_theme: 'app:rice-pack/paper' })).toEqual([repeated]);
        expect(codeSaid({ themes: rows, app_theme: 'gone' })).toEqual([repeated, APP('"gone"')]);
        expect(codeSaid({ themes: rows, app_theme: 'A' })).toEqual([repeated, APP('"A"')]);
        expect(codeSaid({ themes: rows, app_theme: '' })).toEqual([repeated, APP('""')]);
        expect(codeSaid({ themes: rows, app_theme: 5 })).toEqual([repeated, APP('5')]);
        expect(codeSaid({ themes: undefined, app_theme: 'a' })).toEqual([APP('"a"')]);
    });

    /** The findings over this `code_theme` value, each as its file's name, key and sentence. */
    function codeSaid(config: Record<string, unknown>): string[] {
        return themeFindings(shippedAt(scratch()), { ...BASE, ...config }).map(
            (one) => `${basename(one.file)} ${one.key}: ${one.message}`
        );
    }

    const CODE = (shown: string): string =>
        `appearance.yml code_theme: code_theme is ${shown}, which is neither tokens, a VS Code theme nor the id of a Shiki theme the choice offers; the editor colours code from the tokens instead`;

    it('names a code theme that is no listed id, one finding per value, case included', () => {
        expect(codeSaid({ code_theme: 'not-a-theme' })).toEqual([CODE('"not-a-theme"')]);
        expect(codeSaid({ code_theme: 5 })).toEqual([CODE('5')]);
        expect(codeSaid({ code_theme: '' })).toEqual([CODE('""')]);
        expect(codeSaid({ code_theme: null })).toEqual([CODE('null')]);
        expect(codeSaid({ code_theme: 'Dark-Plus' })).toEqual([CODE('"Dark-Plus"')]);
        expect(codeSaid({ code_theme: 'TOKENS' })).toEqual([CODE('"TOKENS"')]);
        expect(codeSaid({ code_theme: 'constructor' })).toEqual([CODE('"constructor"')]);
        expect(codeSaid({ code_theme: 'vscode-nope' })).toEqual([CODE('"vscode-nope"')]);
    });

    it('names a bad code theme in a config that has no themes list', () => {
        expect(codeSaid({ themes: undefined, code_theme: 'nope' })).toEqual([CODE('"nope"')]);
        expect(
            codeSaid({
                themes: [
                    { name: 'a', glyph: 'sun' },
                    { name: 'a', glyph: 'box' }
                ],
                code_theme: 'nope'
            })
        ).toHaveLength(2);
    });

    it('says nothing for an absent code_theme, tokens or a listed id', () => {
        expect(codeSaid({})).toEqual([]);
        expect(codeSaid({ code_theme: 'tokens' })).toEqual([]);
        expect(codeSaid({ code_theme: 'dark-plus' })).toEqual([]);
        expect(codeSaid({ code_theme: 'github-light' })).toEqual([]);
        expect(codeSaid({ code_theme: 'vscode-dark-2026' })).toEqual([]);
        expect(codeSaid({ code_theme: 'vscode-light-high-contrast' })).toEqual([]);
    });

    it('says nothing about the shipped list, a row with no name, or a config with no list', () => {
        expect(themeFindings(shippedAt(scratch()), loadConfig(engineDir()).config)).toEqual([]);
        expect(said([{ glyph: 'sun' }, 'light'])).toEqual([]);
        expect(themeFindings(shippedAt(scratch()), BASE)).toEqual([]);
        expect(
            themeFindings(shippedAt(scratch()), { ...BASE, themes: [{ name: 'a' }] })[0].file
        ).toMatch(/config[/\\]defaults[/\\]appearance\.yml$/);
    });
});

// The root files and owner catalog fragments that ship with the tool, read as the server reads
// them.

describe('vocabCatalog', () => {
    it('carries code_theme with the other appearance keys, and only when the config holds it', () => {
        const config = loadConfig(engineDir()).config;
        expect(vocabCatalog({ ...config, code_theme: 'nord' }).code_theme).toBe('nord');
        expect(vocabCatalog(config).code_theme).toBe(config.code_theme);
        const bare = { ...config };
        delete bare.code_theme;
        expect('code_theme' in vocabCatalog(bare)).toBe(false);
    });
});

describe('optionFindings', () => {
    it('reads the shipped options catalog with no finding', () => {
        expect(optionFindings(engineDir(), loadConfig(engineDir()).config)).toEqual([]);
    });
});
