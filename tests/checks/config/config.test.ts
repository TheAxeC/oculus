// Layer 4, tree check. The readers of the config folder (loadLocal, loadConfig, behaviorFindings,
// settingFindings, themeFindings, vocabCatalog, optionFindings) over synthetic files in a temporary
// directory, and the one real config they are run over for no finding. The sentences checkLocal
// answers, and readLocal's problems, are rows of tests/data/sources/config/local.test.ts. The
// config folder oculus ships is read by tests/checks/config/config-folder.test.ts.

import { cpSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { basename, dirname, join, resolve, sep } from 'node:path';
import { afterEach, beforeEach, describe, expect, vi } from 'vitest';
import type { MockInstance } from 'vitest';
import {
    DEFAULT_PORT,
    LOCAL_NAME,
    behaviorFindings,
    checkLocal,
    engineDir,
    loadConfig,
    loadLocal,
    optionFindings,
    settingFindings,
    textCatalog,
    themeFindings,
    vocabCatalog
} from '../../../src/lib/data/sources/config.ts';
import { ENGINE_ROOT, engineRoot, rootsFile } from '../../../src/lib/server/files/files.ts';
import { readEditorOptions } from '../../../src/lib/data/sources/config/editor-options.ts';
import { layoutFile } from '../../../src/lib/server/content/docs.ts';
import { parse } from 'yaml';
import { noop } from '../../fixtures/doubles.ts';
import { it, scratchDir } from '../../fixtures/scratch.ts';
import { WRONG_EDITOR, WRONG_SETTINGS } from '../../data/sources/config/wrong-settings.ts';

function scratch(): string {
    const dir = scratchDir('oculus-config-');
    return dir;
}

/**
 * The machine's own file where loadLocal reads it by default: inside the engine's config folder.
 */
function writeLocal(dir: string, body: string): void {
    const folder = join(dir, 'config');
    const file = join(folder, LOCAL_NAME);
    expect(resolve(file).startsWith(resolve(dir) + sep)).toBe(true);
    mkdirSync(folder, { recursive: true });
    writeFileSync(file, body);
}

const DEFAULT_ACCOUNTS = [
    { tool: 'claude', dir: join(homedir(), '.claude'), label: 'claude' },
    { tool: 'codex', dir: join(homedir(), '.codex'), label: 'codex' }
];

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

describe('loadLocal', () => {
    let warn: MockInstance<typeof console.warn>;

    beforeEach(() => {
        warn = vi.spyOn(console, 'warn').mockImplementation(noop);
    });

    afterEach(() => {
        warn.mockRestore();
    });

    it('reads the file inside the config folder and not one beside it', () => {
        const dir = scratch();
        writeLocal(dir, 'hub: /srv/in-the-config-folder\n');
        writeFileSync(join(dir, LOCAL_NAME), 'hub: /srv/beside-the-config-folder\n');
        expect(loadLocal(dir).hub).toBe('/srv/in-the-config-folder');
    });

    it('reports an unknown key once and ignores it', () => {
        const dir = scratch();
        writeLocal(dir, 'hub: /srv/research-hub\ncolour: teal\n');
        expect(loadLocal(dir)).toEqual({
            hub: '/srv/research-hub',
            port: DEFAULT_PORT,
            claudeBin: 'claude',
            riteDapBin: 'rite_dap',
            calendars: [],
            mail: [],
            accounts: DEFAULT_ACCOUNTS
        });
        expect(warn).toHaveBeenCalledTimes(1);
        expect(String(warn.mock.calls[0][0])).toContain('colour');
    });

    it('accepts distinct Claude labels on equal folder basenames and a matching Codex label', () => {
        const dir = scratch();
        writeLocal(
            dir,
            JSON.stringify({
                accounts: [
                    { tool: 'claude', dir: 'a/.claude', label: 'Work' },
                    { tool: 'claude', dir: 'b/.claude', label: 'Personal' },
                    { tool: 'codex', dir: 'codex', label: 'Work' }
                ]
            })
        );
        expect(loadLocal(dir).accounts.map((account) => account.label)).toEqual([
            'Work',
            'Personal',
            'Work'
        ]);
    });

    // The engine directory is the whole of what says which machine-local file is read: a server
    // started over another one reads that one's, which is how a run keeps off the checkout's.
    it('reads the file of the engine it is given and never another engine own', () => {
        const one = scratch();
        writeLocal(one, 'hub: /srv/from-one\nport: 8791\n');
        const other = scratch();
        writeLocal(other, 'hub: /srv/from-the-other\nport: 8792\n');
        expect(loadLocal(one)).toEqual({
            hub: '/srv/from-one',
            port: 8791,
            claudeBin: 'claude',
            riteDapBin: 'rite_dap',
            calendars: [],
            mail: [],
            accounts: DEFAULT_ACCOUNTS
        });
        expect(loadLocal(other)).toEqual({
            hub: '/srv/from-the-other',
            port: 8792,
            claudeBin: 'claude',
            riteDapBin: 'rite_dap',
            calendars: [],
            mail: [],
            accounts: DEFAULT_ACCOUNTS
        });
    });
});

// The check the source endpoint makes before it writes the machine's own file: it reads a body the
// way loadLocal does and prints nothing for a key it does not know, which loadLocal warns about.
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

describe('the config folder of an engine', () => {
    it('is that engine own folder, so a run over a copy reads and writes the copy', () => {
        const engine = scratch();
        writeConfig(engine, 'behavior.yml', 'stale_days: 30\n');
        const copy = scratch();
        writeConfig(copy, 'behavior.yml', 'stale_days: 7\n');
        expect(loadConfig(engine).config.stale_days).toBe(30);
        expect(loadConfig(copy).config.stale_days).toBe(7);
    });

    it('is the folder the engine root serves and the file a root finding names', () => {
        // The page lists and saves through that root, so a run over a copy never reaches the
        // checkout's own folder, and the machine's own local.yml it lists is the one loadLocal
        // read.
        const engine = scratch();
        expect(engineRoot(engine)).toEqual({ key: ENGINE_ROOT, dir: join(engine, 'config') });
        expect(rootsFile(engine)).toBe(join(engine, 'config', 'sources.yml'));
        expect(layoutFile(engine)).toBe(join(engine, 'config', 'layout.yml'));
    });
});

describe('loadConfig', () => {
    it('merges the top-level keys of every file in name order', () => {
        const engine = scratch();
        writeConfig(engine, 'behavior.yml', 'stale_days: 30\nread_limits: { lines: 400 }\n');
        writeConfig(engine, 'vocab.yml', 'palette: [teal, amber]\n');
        // Not a .yml file, so it is not merged.
        writeConfig(engine, 'notes.md', 'palette: ignored\n');

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
        writeConfig(engine, 'a-first.yml', 'palette: [teal]\nonly_here: 1\n');
        const later = writeConfig(engine, 'b-later.yml', 'palette: [amber]\n');

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
        writeConfig(engine, 'broken.yml', 'title: "unterminated\n  - [\n');
        writeConfig(engine, 'good.yml', 'text: { app: { title: oculus } }\n');

        const { config, findings } = loadConfig(engine);
        expect(config.text).toEqual({ ...SENTENCES, 'app.title': 'oculus' });
        expect(findings.length).toBe(1);
        expect(findings[0].file).toBe(join(engine, 'config', 'broken.yml'));
        expect(findings[0].message).toMatch(/^does not parse: /);
    });

    it('reports a file that is not a map and treats an empty file as no keys', () => {
        const engine = scratch();
        withSentences(engine);
        writeConfig(engine, 'listy.yml', '- one\n- two\n');
        writeConfig(engine, 'nothing.yml', '');

        const { config, findings } = loadConfig(engine);
        expect(config).toEqual({ text: SENTENCES });
        expect(findings).toEqual([
            {
                file: join(engine, 'config', 'listy.yml'),
                key: '',
                message: 'is not a map of keys'
            }
        ]);
    });

    it('leaves the machine own file out of the merge, clashing key and all', () => {
        const engine = scratch();
        writeConfig(engine, 'behavior.yml', 'stale_days: 30\n');
        writeConfig(engine, LOCAL_NAME, 'hub: /srv/research-hub\nstale_days: 7\n');

        const { config, findings } = loadConfig(engine);
        expect(Object.keys(config)).toEqual(['stale_days']);
        expect(config.stale_days).toBe(30);
        expect(findings).toEqual([]);
        // The same file is the one loadLocal reads, so nothing about it is unreadable, only
        // unmerged. It warns about the merged key it carries, which is this case's own doing and is
        // not printed.
        const warn = vi.spyOn(console, 'warn').mockImplementation(noop);
        try {
            expect(loadLocal(engine).hub).toBe('/srv/research-hub');
        } finally {
            warn.mockRestore();
        }
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
        cpSync(join(engineDir(), 'config'), join(engine, 'config'), {
            recursive: true,
            filter: (source) => !source.endsWith(LOCAL_NAME)
        });
        const broken = writeConfig(engine, join('text', 'findings.yml'), 'text: [\n');
        const listy = writeConfig(engine, 'listy.yml', '- one\n');

        const { config, findings } = loadConfig(engine);
        expect(findings.map((one) => one.file)).toEqual([listy, broken]);
        expect(findings[0].message).toBe('findings.file.not_a_map');
        expect(findings[1].message).toMatch(/^findings\.file\.does_not_parse \S/);
        // The broken file gives no words, so the key worded above is not in the merged catalog.
        expect(textCatalog(config)['findings.file.not_a_map']).toBe(undefined);
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
        'says a retired key is not read and names the Run unattended choice, against behavior.yml: %s',
        (key, retired) => {
            const engine = scratch();
            expect(behaviorFindings(engine, { ...WORDS, ...retired })).toEqual([
                {
                    file: join(engine, 'config', 'behavior.yml'),
                    key,
                    message: `${key} is not read; a schedule in the update tray runs unattended through its Run unattended choice`
                }
            ]);
        }
    );

    it('says nothing about a configuration whose keys are all under their own names', () => {
        const engine = scratch();
        expect(behaviorFindings(engine, { ...WORDS, chat: { model: 'opus' } })).toEqual([]);
        expect(behaviorFindings(engine, { ...WORDS, chat: 'opus' })).toEqual([]);
        expect(behaviorFindings(engine, loadConfig(engineDir()).config)).toEqual([]);
    });
});

describe('settingFindings', () => {
    const engine = engineDir();
    const shipped = loadConfig(engine).config;
    const WRONG: Record<string, unknown> = { ...WRONG_SETTINGS, editor: WRONG_EDITOR };
    const file = join(engine, 'config', 'behavior.yml');
    const said = (config: Record<string, unknown>) =>
        settingFindings(engine, config).map((one) => `${one.key}: ${one.message}`);

    it('words each wrong setting against behavior.yml from the catalog, and nothing for the shipped files', () => {
        const findings = settingFindings(engine, { ...shipped, ...WRONG });
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
                'latex.tools',
                'latex.tools[2].name',
                'latex.tools[3]',
                'latex.tools[4].command',
                'latex.tools[5].args',
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
            'slurm.resource: slurm.resource must not be empty; the default is used'
        );
        expect(settingFindings(engine, shipped)).toEqual([]);
    });

    it('says nothing for a merge that dropped behavior.yml, or for a map without the catalog', () => {
        const dropped = Object.fromEntries(
            Object.entries({ ...shipped, ...WRONG }).filter(([key]) => !(key in WRONG))
        );
        expect(settingFindings(engine, dropped)).toEqual([]);
        expect(settingFindings(engine, { text: shipped.text, ...WRONG })).toEqual([]);
    });
});

describe('themeFindings', () => {
    /** The merged catalog the findings are worded from, and a vocabulary of two glyph names. */
    const BASE = { text: loadConfig(engineDir()).config.text, glyphs: { sun: '(o)', box: '<>' } };

    /** The findings over these theme rows, each as its key and its sentence. */
    function said(themes: unknown): string[] {
        return themeFindings(scratch(), { ...BASE, themes }).map(
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

    /** The findings over this `code_theme` value, each as its file's name, key and sentence. */
    function codeSaid(config: Record<string, unknown>): string[] {
        return themeFindings(scratch(), { ...BASE, ...config }).map(
            (one) => `${basename(one.file)} ${one.key}: ${one.message}`
        );
    }

    const CODE = (shown: string): string =>
        `appearance.yml code_theme: code_theme is ${shown}, which is neither tokens nor the id of a Shiki theme; the editor colours code from the tokens instead`;

    it('names a code theme that is no listed id, one finding per value, case included', () => {
        expect(codeSaid({ code_theme: 'not-a-theme' })).toEqual([CODE('"not-a-theme"')]);
        expect(codeSaid({ code_theme: 5 })).toEqual([CODE('5')]);
        expect(codeSaid({ code_theme: '' })).toEqual([CODE('""')]);
        expect(codeSaid({ code_theme: null })).toEqual([CODE('null')]);
        expect(codeSaid({ code_theme: 'Dark-Plus' })).toEqual([CODE('"Dark-Plus"')]);
        expect(codeSaid({ code_theme: 'TOKENS' })).toEqual([CODE('"TOKENS"')]);
        expect(codeSaid({ code_theme: 'constructor' })).toEqual([CODE('"constructor"')]);
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
    });

    it('says nothing about the shipped list, a row with no name, or a config with no list', () => {
        expect(themeFindings(scratch(), loadConfig(engineDir()).config)).toEqual([]);
        expect(said([{ glyph: 'sun' }, 'light'])).toEqual([]);
        expect(themeFindings(scratch(), BASE)).toEqual([]);
        expect(themeFindings(scratch(), { ...BASE, themes: [{ name: 'a' }] })[0].file).toMatch(
            /config[/\\]appearance\.yml$/
        );
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
