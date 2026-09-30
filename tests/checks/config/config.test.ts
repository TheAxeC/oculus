// loadLocal, checkLocal and loadConfig against synthetic files in a temporary directory. The config
// folder oculus ships is read by tests/checks/config/config-folder.test.ts.

import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { basename, dirname, join, resolve, sep } from 'node:path';
import { afterEach, beforeEach, describe, expect, vi } from 'vitest';
import type { MockInstance } from 'vitest';
import {
    DEFAULT_PORT,
    LOCAL_NAME,
    behaviorFindings,
    checkLocal,
    configDir,
    engineDir,
    loadConfig,
    loadLocal,
    textCatalog,
    themeFindings,
    vocabCatalog
} from '../../../src/lib/data/sources/config.ts';
import { portfolioConfigFrom } from '../../../src/lib/data/index.ts';
import { ENGINE_ROOT, engineRoot, rootsFile } from '../../../src/lib/server/files/files.ts';
import { layoutFile } from '../../../src/lib/server/content/docs.ts';
import { parse } from 'yaml';
import { noop } from '../../fixtures/doubles.ts';
import { it, scratchDir } from '../../fixtures/scratch.ts';

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

    it('falls back to the defaults when there is no file', () => {
        const dir = scratch();
        expect(loadLocal(dir)).toEqual({
            hub: resolve(dir, '..', '..'),
            port: DEFAULT_PORT,
            claudeBin: 'claude',
            calendars: [],
            mail: [],
            accounts: DEFAULT_ACCOUNTS
        });
        expect(warn).not.toHaveBeenCalled();
    });

    it('takes both keys from the file', () => {
        const dir = scratch();
        writeLocal(dir, 'hub: /srv/research-hub\nport: 8791\n');
        expect(loadLocal(dir)).toEqual({
            hub: '/srv/research-hub',
            port: 8791,
            claudeBin: 'claude',
            calendars: [],
            mail: [],
            accounts: DEFAULT_ACCOUNTS
        });
    });

    it('reads the file inside the config folder and not one beside it', () => {
        const dir = scratch();
        writeLocal(dir, 'hub: /srv/in-the-config-folder\n');
        writeFileSync(join(dir, LOCAL_NAME), 'hub: /srv/beside-the-config-folder\n');
        expect(loadLocal(dir).hub).toBe('/srv/in-the-config-folder');
    });

    it('resolves a relative hub against the engine directory rather than the config folder', () => {
        const dir = scratch();
        writeLocal(dir, 'hub: demo\n');
        expect(loadLocal(dir).hub).toBe(join(dir, 'demo'));
    });

    it('reports an unknown key once and ignores it', () => {
        const dir = scratch();
        writeLocal(dir, 'hub: /srv/research-hub\ncolour: teal\n');
        expect(loadLocal(dir)).toEqual({
            hub: '/srv/research-hub',
            port: DEFAULT_PORT,
            claudeBin: 'claude',
            calendars: [],
            mail: [],
            accounts: DEFAULT_ACCOUNTS
        });
        expect(warn).toHaveBeenCalledTimes(1);
        expect(String(warn.mock.calls[0][0])).toContain('colour');
    });

    it('refuses a port that is not an integer', () => {
        const dir = scratch();
        writeLocal(dir, 'port: eight\n');
        expect(() => loadLocal(dir)).toThrow(/port must be an integer/);
    });

    it('takes the two session paths when the machine names them', () => {
        const dir = scratch();
        writeLocal(
            dir,
            'hub: /srv/research-hub\nsessions_cache: /srv/state/cache.json\nsessions_overrides: state/sessions.json\n'
        );
        expect(loadLocal(dir)).toEqual({
            hub: '/srv/research-hub',
            port: DEFAULT_PORT,
            claudeBin: 'claude',
            calendars: [],
            mail: [],
            accounts: DEFAULT_ACCOUNTS,
            sessionsCache: '/srv/state/cache.json',
            sessionsOverrides: join(dir, 'state', 'sessions.json')
        });
        expect(warn).not.toHaveBeenCalled();
    });

    it('takes the Claude binary used by update-task terminals', () => {
        const dir = scratch();
        writeLocal(dir, 'claude_bin: /opt/Claude CLI/claude\n');
        expect(loadLocal(dir)).toEqual({
            hub: resolve(dir, '..', '..'),
            port: DEFAULT_PORT,
            claudeBin: '/opt/Claude CLI/claude',
            calendars: [],
            mail: [],
            accounts: DEFAULT_ACCOUNTS
        });
        expect(warn).not.toHaveBeenCalled();
    });

    it('refuses a session path that is not a path', () => {
        const dir = scratch();
        writeLocal(dir, 'sessions_cache: 17\n');
        expect(() => loadLocal(dir)).toThrow(/sessions_cache must be a path/);
    });

    it('takes usage accounts and expands home-relative config folders', () => {
        const dir = scratch();
        writeLocal(
            dir,
            'accounts:\n  - { tool: claude, dir: ~/.claude-work, label: Work }\n  - { tool: codex, dir: state/codex, label: Codex }\n'
        );
        expect(loadLocal(dir).accounts).toEqual([
            { tool: 'claude', dir: join(homedir(), '.claude-work'), label: 'Work' },
            { tool: 'codex', dir: join(dir, 'state', 'codex'), label: 'Codex' }
        ]);
    });

    it('refuses an account with an unknown tool', () => {
        const dir = scratch();
        writeLocal(dir, 'accounts:\n  - { tool: api, dir: ~/.api, label: API }\n');
        expect(() => loadLocal(dir)).toThrow(/tool must be claude or codex/);
    });

    it.each([
        ['Work', 'Work'],
        ['University Lab', 'UNIVERSITY@Lab']
    ])('refuses colliding Claude labels %s and %s', (first, second) => {
        const dir = scratch();
        try {
            writeLocal(
                dir,
                JSON.stringify({
                    accounts: [
                        { tool: 'claude', dir: 'a/.claude', label: first },
                        { tool: 'claude', dir: 'b/.claude', label: second }
                    ]
                })
            );
            expect(() => loadLocal(dir)).toThrow(/duplicates a Claude label or reduced label/);
        } finally {
            rmSync(dir, { recursive: true, force: true });
        }
    });

    it('accepts distinct Claude labels on equal folder basenames and a matching Codex label', () => {
        const dir = scratch();
        try {
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
        } finally {
            rmSync(dir, { recursive: true, force: true });
        }
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
            calendars: [],
            mail: [],
            accounts: DEFAULT_ACCOUNTS
        });
        expect(loadLocal(other)).toEqual({
            hub: '/srv/from-the-other',
            port: 8792,
            claudeBin: 'claude',
            calendars: [],
            mail: [],
            accounts: DEFAULT_ACCOUNTS
        });
    });
});

// The check the source endpoint makes before it writes the machine's own file. Every rule loadLocal
// has is one case here, since a body this accepts is a body the next read must accept.
describe('checkLocal', () => {
    let warn: MockInstance<typeof console.warn>;

    beforeEach(() => {
        warn = vi.spyOn(console, 'warn').mockImplementation(noop);
    });

    afterEach(() => {
        warn.mockRestore();
    });

    it('accepts a body the reader would read, and says nothing about an unknown key', () => {
        expect(checkLocal('')).toBeNull();
        expect(checkLocal('# only a comment\n')).toBeNull();
        expect(
            checkLocal(
                [
                    'hub: /srv/research-hub',
                    'port: 8791',
                    'hpc_host: cluster',
                    'claude_bin: /opt/claude',
                    'sessions_cache: /tmp/cache.json',
                    'sessions_overrides: overrides.json',
                    'workspaces: /tmp/workspaces.json',
                    'bookmarks: /tmp/bookmarks.yml',
                    'notes: /tmp/notes',
                    'changes: /tmp/changes.jsonl',
                    'accounts:',
                    '  - { tool: claude, dir: ~/.claude, label: Work }',
                    '  - { tool: codex, dir: /tmp/codex, label: Codex }',
                    ''
                ].join('\n')
            )
        ).toBeNull();
        expect(checkLocal('colour: teal\n')).toBeNull();
        expect(warn).not.toHaveBeenCalled();
    });

    it('names the file and the rule for every value the reader would throw over', () => {
        const cases: [string, RegExp][] = [
            ['- one\n- two\n', /expected a map of keys/],
            ['hub: 4\n', /hub must be a path/],
            ["hub: ''\n", /hub must be a path/],
            ['port: eight\n', /port must be an integer/],
            ['port: 8790.5\n', /port must be an integer/],
            ['hpc_host: 0\n', /hpc_host must be a non-empty string/],
            ['claude_bin: 0\n', /claude_bin must be a non-empty string/],
            ['sessions_cache: 1\n', /sessions_cache must be a path/],
            ['sessions_overrides: 1\n', /sessions_overrides must be a path/],
            ['workspaces: 1\n', /workspaces must be a path/],
            ['bookmarks: 1\n', /bookmarks must be a path/],
            ['notes: 1\n', /notes must be a path/],
            ['changes: 1\n', /changes must be a path/],
            ['accounts: 1\n', /accounts must be a list/],
            ['accounts: [one]\n', /accounts\[0\] must be a map/],
            ['accounts: [{ tool: gemini, dir: a, label: b }]\n', /tool must be claude or codex/],
            ['accounts: [{ tool: claude, label: b }]\n', /dir must be a path/],
            ['accounts: [{ tool: claude, dir: a }]\n', /label must be words/],
            [
                'accounts: [{ tool: claude, dir: a, label: Work }, { tool: claude, dir: b, label: work }]\n',
                /duplicates a Claude label/
            ]
        ];
        for (const [body, rule] of cases) {
            // A body the check accepts answers null, which is the empty string here and matches
            // neither, so an accepted body fails the case rather than skipping it.
            const sentence = checkLocal(body) ?? '';
            expect(sentence, body).toMatch(rule);
            expect(sentence, body).toContain(`${LOCAL_NAME}: `);
        }
        expect(warn).not.toHaveBeenCalled();
    });

    it('gives a body that is not YAML by one line, and takes the name it is asked for', () => {
        const sentence = checkLocal('hub: "unterminated\n  - [\n') ?? '';
        expect(sentence).not.toBe('');
        expect(sentence.includes('\n')).toBe(false);
        expect(checkLocal('port: eight\n', 'config/local.yml')).toMatch(
            /^config\/local\.yml: port must be an integer/
        );
    });

    it('is the rule loadLocal reads by, so an accepted body is read and a refused one throws', () => {
        const dir = scratch();
        writeLocal(dir, 'port: 8791\n');
        expect(checkLocal('port: 8791\n')).toBeNull();
        expect(loadLocal(dir).port).toBe(8791);

        writeLocal(dir, 'port: eight\n');
        expect(checkLocal('port: eight\n')).not.toBeNull();
        expect(() => loadLocal(dir)).toThrow(/port must be an integer/);
    });
});

describe('configDir', () => {
    it('is the config folder of the engine it is given', () => {
        const engine = scratch();
        expect(configDir(engine)).toBe(join(engine, 'config'));
    });

    it('is that engine own folder, so a run over a copy reads and writes the copy', () => {
        const engine = scratch();
        writeConfig(engine, 'behavior.yml', 'stale_days: 30\n');
        const copy = scratch();
        writeConfig(copy, 'behavior.yml', 'stale_days: 7\n');
        expect(loadConfig(engine).config.stale_days).toBe(30);
        expect(loadConfig(copy).config.stale_days).toBe(7);
        expect(portfolioConfigFrom(loadConfig(copy).config, copy).deckFile).toBe(
            join(copy, 'config', 'present.yml')
        );
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

    // Revert: none; loadConfig treats every key alike, so this holds a fact of the merge for the
    // new key and would only go red if the merge started to special-case keys (audit).
    it('audit: reports code_theme defined in two files like any other key', () => {
        const engine = scratch();
        withSentences(engine);
        writeConfig(engine, 'a-first.yml', 'code_theme: tokens\n');
        const later = writeConfig(engine, 'b-later.yml', 'code_theme: nord\n');

        const { config, findings } = loadConfig(engine);
        expect(config.code_theme).toBe('nord');
        expect(findings).toEqual([
            {
                file: later,
                key: 'code_theme',
                message: 'key code_theme is already defined in a-first.yml; b-later.yml wins'
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

    // Revert: rethrow in mergeText every error flattenText raises that is not the not-a-map one.
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
        // The rest of the copy still merges, the words of every other owner file among it.
        expect(textCatalog(config)['app.chat']).toBe('Chat');
        expect(textCatalog(config)['findings.file.not_a_map']).toBe(undefined);
    });
});

describe('behaviorFindings', () => {
    /**
     * The merged catalog these findings are worded from, as the server's merged config holds it.
     */
    const WORDS = { text: loadConfig(engineDir()).config.text };

    /**
     * The keys a configuration needs to draw no finding of its own, beside whatever a case adds.
     */
    const SOUND = { ...WORDS, editor: { paint_limit_kb: 64 } };

    it('names the key that replaced a retired one, against behavior.yml', () => {
        const engine = scratch();
        expect(behaviorFindings(engine, { ...SOUND, chat: { skip_permissions: true } })).toEqual([
            {
                file: join(engine, 'config', 'behavior.yml'),
                key: 'chat.skip_permissions',
                message: 'chat.skip_permissions is not read; the key is tasks.skip_permissions'
            }
        ]);
    });

    // A throw at start is what a bad key gets, but the watcher republishes a saved edit into a
    // running server, and the editor then paints without colour; the finding is what says why.
    it('names a paint limit that is missing or is not a size, and says what it costs', () => {
        const engine = scratch();
        const said = (config: Record<string, unknown>): string[] =>
            behaviorFindings(engine, config).map((one) => `${one.key}: ${one.message}`);
        const named = [
            'editor.paint_limit_kb: editor.paint_limit_kb must be a number above zero; the editor paints without colour until it is'
        ];
        expect(said({ ...WORDS })).toEqual(named);
        expect(said({ ...WORDS, editor: {} })).toEqual(named);
        expect(said({ ...WORDS, editor: { paint_limit_kb: '64' } })).toEqual(named);
        expect(said({ ...WORDS, editor: { paint_limit_kb: 0 } })).toEqual(named);
        expect(behaviorFindings(engine, {})[0].file).toBe(join(engine, 'config', 'behavior.yml'));
    });

    it('says nothing about a configuration whose keys are all under their own names', () => {
        const engine = scratch();
        expect(behaviorFindings(engine, { ...SOUND, tasks: { skip_permissions: true } })).toEqual(
            []
        );
        expect(behaviorFindings(engine, { ...SOUND, chat: { model: 'opus' } })).toEqual([]);
        expect(behaviorFindings(engine, { ...SOUND, chat: 'opus' })).toEqual([]);
        expect(behaviorFindings(engine, loadConfig(engineDir()).config)).toEqual([]);
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

    // Revert: drop the code_theme check from themeFindings; no finding is raised for any value.
    it('names a code theme that is no listed id, one finding per value, case included', () => {
        expect(codeSaid({ code_theme: 'not-a-theme' })).toEqual([CODE('"not-a-theme"')]);
        expect(codeSaid({ code_theme: 5 })).toEqual([CODE('5')]);
        expect(codeSaid({ code_theme: '' })).toEqual([CODE('""')]);
        expect(codeSaid({ code_theme: null })).toEqual([CODE('null')]);
        expect(codeSaid({ code_theme: 'Dark-Plus' })).toEqual([CODE('"Dark-Plus"')]);
        expect(codeSaid({ code_theme: 'TOKENS' })).toEqual([CODE('"TOKENS"')]);
        expect(codeSaid({ code_theme: 'constructor' })).toEqual([CODE('"constructor"')]);
    });

    // Revert: move the check after the early return for a config with no `themes:` list.
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

    // Revert: raise a finding for the absent key or a listed value.
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
    // Revert: leave code_theme out of VOCAB_KEYS; the first frame then carries no code theme.
    it('carries code_theme with the other appearance keys, and only when the config holds it', () => {
        const config = loadConfig(engineDir()).config;
        expect(vocabCatalog({ ...config, code_theme: 'nord' }).code_theme).toBe('nord');
        expect(vocabCatalog(config).code_theme).toBe(config.code_theme);
        const bare = { ...config };
        delete bare.code_theme;
        expect('code_theme' in vocabCatalog(bare)).toBe(false);
    });
});
