// loadLocal and loadConfig against synthetic files in a temporary directory.

import {
    existsSync,
    mkdirSync,
    mkdtempSync,
    readFileSync,
    readdirSync,
    writeFileSync
} from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { parse } from 'yaml';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    DEFAULT_PORT,
    collectionKeys,
    engineDir,
    loadConfig,
    loadLocal
} from '../src/lib/data/sources/config.ts';
import { readRoots, rootsFile } from '../src/lib/server/files.ts';
import { views } from '../src/lib/views/registry.ts';
// Importing the barrel registers the application's views; the collections are registered from the
// keys of sources.yml, the way the page does it, so the rail's keys are checked against both.
import { registerCollections } from '../src/routes/views.ts';

function scratch(): string {
    const dir = mkdtempSync(join(tmpdir(), 'oculus-config-'));
    expect(resolve(dir).startsWith(resolve(tmpdir()) + sep)).toBe(true);
    return dir;
}

function writeLocal(dir: string, body: string): void {
    const file = join(dir, 'local.yml');
    expect(resolve(file).startsWith(resolve(dir) + sep)).toBe(true);
    writeFileSync(file, body);
}

const DEFAULT_ACCOUNTS = [
    { tool: 'claude', dir: join(homedir(), '.claude'), label: 'claude' },
    { tool: 'codex', dir: join(homedir(), '.codex'), label: 'codex' }
];

/** Write one file into <engine>/config, creating the directory the first time. */
function writeConfig(engine: string, name: string, body: string): string {
    const dir = join(engine, 'config');
    const file = join(dir, name);
    expect(resolve(file).startsWith(resolve(engine) + sep)).toBe(true);
    mkdirSync(dir, { recursive: true });
    writeFileSync(file, body);
    return file;
}

describe('loadLocal', () => {
    let warn: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
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
            accounts: DEFAULT_ACCOUNTS
        });
    });

    it('reports an unknown key once and ignores it', () => {
        const dir = scratch();
        writeLocal(dir, 'hub: /srv/research-hub\ncolour: teal\n');
        expect(loadLocal(dir)).toEqual({
            hub: '/srv/research-hub',
            port: DEFAULT_PORT,
            claudeBin: 'claude',
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

    describe('OCULUS_LOCAL', () => {
        afterEach(() => {
            delete process.env.OCULUS_LOCAL;
        });

        it('is read instead of the engine local.yml', () => {
            const dir = scratch();
            writeLocal(dir, 'hub: /srv/from-the-engine\nport: 8791\n');
            const elsewhere = scratch();
            const named = join(elsewhere, 'named.yml');
            expect(resolve(named).startsWith(resolve(elsewhere) + sep)).toBe(true);
            writeFileSync(named, 'hub: /srv/from-the-override\nport: 8792\n');
            process.env.OCULUS_LOCAL = named;
            expect(loadLocal(dir)).toEqual({
                hub: '/srv/from-the-override',
                port: 8792,
                claudeBin: 'claude',
                accounts: DEFAULT_ACCOUNTS
            });
        });

        it('resolves a relative hub against the named file own folder', () => {
            const dir = scratch();
            const elsewhere = scratch();
            const named = join(elsewhere, 'named.yml');
            expect(resolve(named).startsWith(resolve(elsewhere) + sep)).toBe(true);
            writeFileSync(named, 'hub: demo\n');
            process.env.OCULUS_LOCAL = named;
            expect(loadLocal(dir).hub).toBe(join(elsewhere, 'demo'));
        });

        it('throws when the named file is not there', () => {
            const dir = scratch();
            process.env.OCULUS_LOCAL = join(dir, 'absent.yml');
            expect(() => loadLocal(dir)).toThrow(/does not exist/);
        });
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

    it('reports a file that does not parse and merges the rest', () => {
        const engine = scratch();
        writeConfig(engine, 'broken.yml', 'title: "unterminated\n  - [\n');
        writeConfig(engine, 'good.yml', 'text: { app: { title: oculus } }\n');

        const { config, findings } = loadConfig(engine);
        expect(config.text).toEqual({ app: { title: 'oculus' } });
        expect(findings.length).toBe(1);
        expect(findings[0].file).toBe(join(engine, 'config', 'broken.yml'));
        expect(findings[0].message).toMatch(/^does not parse: /);
    });

    it('reports a file that is not a map and treats an empty file as no keys', () => {
        const engine = scratch();
        writeConfig(engine, 'listy.yml', '- one\n- two\n');
        writeConfig(engine, 'nothing.yml', '');

        const { config, findings } = loadConfig(engine);
        expect(config).toEqual({});
        expect(findings).toEqual([
            {
                file: join(engine, 'config', 'listy.yml'),
                key: '',
                message: 'is not a map of keys'
            }
        ]);
    });

    it('reports a missing config directory and returns an empty map', () => {
        const engine = scratch();
        const { config, findings } = loadConfig(engine);

        expect(config).toEqual({});
        expect(findings).toEqual([
            {
                file: join(engine, 'config'),
                key: '',
                message: 'config directory does not exist'
            }
        ]);
    });
});

// The nine files that ship with the tool, read the way the server reads them. EXPECTED is the whole
// top-level key set after the regrouping of O10c, so a key that is dropped, renamed or added shows
// up here as well as wherever it is read.
describe("oculus's own config directory", () => {
    /** Every top-level key the ten files hold, by the file it now sits in. */
    const EXPECTED: Record<string, string[]> = {
        'appearance.yml': ['themes', 'wallpaper', 'crt', 'terminal'],
        'behavior.yml': [
            'read_limits',
            'stale_days',
            'context_window',
            'usage_tiers',
            'data_domains',
            'stale_lag_days',
            'refresh_stale_days',
            'deadline_horizon_days',
            'leads_horizon_days',
            'conf_horizon_months',
            'leads_badge_days',
            'venue_conc_warn',
            'linkedin_cadence_days',
            'file_index',
            'slurm',
            'chat',
            'notify',
            'git'
        ],
        'glyphs.yml': ['glyphs', 'ascii'],
        'layout.yml': [
            'nav_groups',
            'arrangements',
            'board',
            'tab_split',
            'tab_rollup',
            'nav_live',
            'bookmarks',
            'focus_label_mode',
            'project_label_mode',
            'archive_label_mode',
            'map_label_mode'
        ],
        'manifest-schema.yml': ['manifest_schema'],
        'meta.yml': ['meta'],
        'sources.yml': [
            'editable_extensions',
            'viewable_extensions',
            'scan',
            'venues_file',
            'datasets_file',
            'programs_file',
            'domains_file',
            'collections',
            'docs',
            'indexes',
            'leads_file',
            'radar_file',
            'publications_file',
            'linkedin_dir',
            'career_file',
            'roots'
        ],
        'text.yml': ['text'],
        // The one key two files share: the catalog's groups are spread over the two so that each
        // file stays under 1000 lines, and loadConfig folds them into one map of groups.
        'text-oculus.yml': ['text'],
        'vocab.yml': [
            'palette',
            'domains',
            'type_color',
            'type_order',
            'status_legend',
            'status_palette',
            'focus_lanes',
            'holding_color',
            'priority_levels',
            'fund_stages',
            'focus_lane_tones',
            'career_host_status',
            'career_score_dims',
            'archive_categories',
            'archive_dead',
            'leads_fit',
            'lifecycle',
            'arch_color',
            'data_access',
            'venue_categories',
            'venue_tiers',
            'radar_buckets'
        ]
    };

    it('merges without a finding, so no key is defined in two files', () => {
        expect(loadConfig(engineDir()).findings).toEqual([]);
    });

    it('holds the cross-link exclusions and independent collection lane tones', () => {
        const { config } = loadConfig(engineDir());
        expect(config.archive_dead).toEqual([
            'nogo',
            'dropped',
            'disproved',
            'abandoned',
            'parked'
        ]);
        expect(config.focus_lane_tones).toEqual({
            funding: 'gold',
            jobs: 'violet',
            teaching: 'teal'
        });
        expect(typeof config.stale_lag_days).toBe('number');
        expect(config.usage_tiers).toEqual({
            default_claude_max_20x: 'Max 20x',
            default_claude_max_5x: 'Max 5x',
            default_claude_pro: 'Pro',
            prolite: 'Plus'
        });
    });

    it('configures the editable source extensions and their viewable superset', () => {
        const { config } = loadConfig(engineDir());
        expect(config.editable_extensions).toEqual([
            '.md',
            '.yml',
            '.yaml',
            '.tex',
            '.bib',
            '.txt'
        ]);
        expect(config.viewable_extensions).toEqual([
            '.md',
            '.yml',
            '.yaml',
            '.tex',
            '.bib',
            '.txt',
            '.py',
            '.sh',
            '.slurm',
            '.json',
            '.csv',
            '.r',
            '.m',
            '.cpp',
            '.h',
            '.c',
            '.hpp',
            '.js',
            '.css',
            '.html',
            '.toml',
            '.cfg',
            '.ini',
            '.log'
        ]);
    });

    it('holds exactly the expected top-level keys, and no more', () => {
        const { config } = loadConfig(engineDir());
        const expected = [...new Set(Object.values(EXPECTED).flat())].sort();
        expect(Object.keys(config).sort()).toEqual(expected);
    });

    it('spreads the catalog over its two files with no group in both', () => {
        const dir = join(engineDir(), 'config');
        const groupsOf = (name: string): string[] => {
            const parsed = parse(readFileSync(join(dir, name), 'utf8')) as {
                text: Record<string, unknown>;
            };
            return Object.keys(parsed.text);
        };
        const ported = groupsOf('text.yml');
        const own = groupsOf('text-oculus.yml');
        expect(ported.filter((group) => own.includes(group))).toEqual([]);
        expect(own).toContain('ui');
        expect(ported).toContain('js');
        expect(own).not.toContain('js.leads');
        const { config } = loadConfig(engineDir());
        const text = config.text as {
            js: { leads: Record<string, string> };
            app: Record<string, string>;
        };
        expect(text.js.leads.chat_instruction).toContain('The hub root is `{0}`');
        expect(text.js.leads.chat_focus_note).toContain('`{2}` (absolute)');
        expect(text.js.leads.chat_index_note).toBe(
            'The portfolio index is the file {0}; read it first.'
        );
        expect(text.app.chat).toBe('Chat');
        const merged = Object.keys(config.text as Record<string, unknown>);
        expect(merged.sort()).toEqual([...ported, ...own].sort());
    });

    // The two roots of sources.yml sit under the home directory of whoever runs this, and a
    // checkout on a machine without those two repositories has neither. The check is skipped there
    // with the directories named, rather than failing over a fact about the machine.
    const ROOTS = readRoots(loadConfig(engineDir()).config, rootsFile()).roots;
    const MISSING = ROOTS.filter((root) => !existsSync(root.dir));
    if (MISSING.length > 0) {
        console.log(
            `config.test.ts: skipping the roots check; no directory at ${MISSING.map((root) => root.dir).join(', ')}`
        );
    }

    it.skipIf(MISSING.length > 0)('names roots that are on this machine', () => {
        expect(ROOTS.map((root) => root.key)).toEqual(['cathedra', 'game-engine']);
        expect(readRoots(loadConfig(engineDir()).config, rootsFile()).findings).toEqual([]);
    });

    it('names a root of its own for every bookmark, and a path under it', () => {
        const { config } = loadConfig(engineDir());
        const keys = ROOTS.map((root) => root.key);
        const bookmarks = config.bookmarks as { label: string; root: string; path: string }[];
        expect(bookmarks.map((mark) => mark.root)).toEqual(['cathedra', 'game-engine']);
        for (const mark of bookmarks) {
            expect(keys).toContain(mark.root);
            expect(mark.path.startsWith('/')).toBe(false);
            expect(mark.path.includes('..')).toBe(false);
            expect(mark.label.length).toBeGreaterThan(0);
        }
    });

    // Every key under nav_groups either names a view that is registered now or one of the ids a
    // later package of the migration will register. A key that is neither is a typo: the rail draws
    // nothing for it and says nothing about it, which is the failure this catches.
    const RESERVED = ['approach', 'agent-approach', 'memories', 'help', 'audit', 'config'];

    it('keeps boards separate from the configured Pillars group', () => {
        const { config } = loadConfig(engineDir());
        const groups = config.nav_groups as Record<
            string,
            { label: string; glyph?: string; keys: string[] }[]
        >;
        expect(groups.boards).toEqual([
            { label: 'Boards', keys: ['focus', 'projects', 'coauthor', 'archive'] }
        ]);
        expect(groups.structure).toEqual([
            { label: 'Pillars', glyph: 'program', keys: ['programs', 'domains', 'map'] }
        ]);
        expect(Object.keys(groups).indexOf('structure')).toBe(
            Object.keys(groups).indexOf('boards') + 1
        );
    });

    it('configures one lowercase chord on each flyout with a keyboard prefix', () => {
        const { config } = loadConfig(engineDir());
        const groups = Object.values(
            config.nav_groups as Record<
                string,
                { label: string; glyph?: string; chord?: string; keys: string[] }[]
            >
        ).flat();
        expect(
            groups
                .filter((group) => group.chord !== undefined)
                .map((group) => [group.label, group.chord])
        ).toEqual([
            ['Sessions', 'm'],
            ['Academic life', 'c']
        ]);
        for (const group of groups) {
            if (group.chord !== undefined) expect(group.chord).toMatch(/^[a-z]$/);
        }
    });

    it('names a registered view or a reserved id in every key of every rail group', () => {
        const { config } = loadConfig(engineDir());
        registerCollections(collectionKeys(config));
        const registered = new Set(views().map((view) => view.id));
        const groups = Object.values(config.nav_groups as Record<string, { keys: string[] }[]>)
            .flat()
            .flatMap((group) => group.keys);
        expect(groups.length).toBeGreaterThan(0);
        expect(groups.filter((key) => !registered.has(key) && !RESERVED.includes(key))).toEqual([]);
    });

    it('reserves no id that is already registered, so the list stays the list of what is missing', () => {
        const { config } = loadConfig(engineDir());
        registerCollections(collectionKeys(config));
        const registered = new Set(views().map((view) => view.id));
        expect(RESERVED.filter((key) => registered.has(key))).toEqual([]);
    });

    it('reads each file on its own and finds its own keys there and nowhere else', () => {
        const dir = join(engineDir(), 'config');
        const seen: Record<string, string> = {};
        for (const [name, keys] of Object.entries(EXPECTED)) {
            const parsed = parse(readFileSync(join(dir, name), 'utf8')) as Record<string, unknown>;
            expect(Object.keys(parsed).sort()).toEqual([...keys].sort());
            for (const key of keys) {
                // The catalog is the one key two files carry, by groups; every other key sits in
                // exactly one file.
                if (key !== 'text') expect(seen[key]).toBe(undefined);
                seen[key] = name;
            }
        }
        expect(
            readdirSync(dir)
                .filter((name) => name.endsWith('.yml'))
                .sort()
        ).toEqual(Object.keys(EXPECTED).sort());
    });
});
