// loadLocal and loadConfig against synthetic files in a temporary directory.

import {
    existsSync,
    mkdirSync,
    mkdtempSync,
    readFileSync,
    readdirSync,
    rmSync,
    writeFileSync
} from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { parse } from 'yaml';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MockInstance } from 'vitest';
import {
    DEFAULT_PORT,
    asciiCatalog,
    collectionKeys,
    engineDir,
    glyphCatalog,
    loadConfig,
    loadLocal
} from '../src/lib/data/sources/config.ts';
import { readRoots, rootsFile } from '../src/lib/server/files.ts';
import { GROUP_MAX, arrange, type NavGroup } from '../src/lib/shell/rail.ts';
// Importing the route loader registers views; collection registrations use sources.yml keys.
import { registerAll, registerCollections } from '../src/routes/views.ts';
import { noop } from './doubles.ts';
import { createClientState, type ClientState } from './client.ts';

let client: ClientState;
let views: ClientState['registry']['views'];

beforeEach(() => {
    client = createClientState();
    ({ views } = client.registry);
});

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

    it('reports a catalog key two owner files define and takes the later value', () => {
        const engine = scratch();
        const dir = join(engine, 'config', 'text');
        mkdirSync(dir, { recursive: true });
        writeFileSync(join(dir, 'app.yml'), 'text: { app: { title: first } }\n');
        const later = join(dir, 'ui.yml');
        writeFileSync(later, 'text: { app: { title: second } }\n');

        const { config, findings } = loadConfig(engine);
        expect(config.text).toEqual({ 'app.title': 'second' });
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
        writeConfig(engine, 'broken.yml', 'title: "unterminated\n  - [\n');
        writeConfig(engine, 'good.yml', 'text: { app: { title: oculus } }\n');

        const { config, findings } = loadConfig(engine);
        expect(config.text).toEqual({ 'app.title': 'oculus' });
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

// The root files and owner catalog fragments that ship with the tool, read as the server reads them.
describe("oculus's own config directory", () => {
    /** Every non-text top-level key, by its root config file. */
    const EXPECTED: Record<string, string[]> = {
        'appearance.yml': ['themes', 'wallpaper', 'crt', 'terminal'],
        'present.yml': ['deck'],
        'behavior.yml': [
            'read_limits',
            'stale_days',
            'context_window',
            'usage_tiers',
            'usage_refresh_min',
            'usage_refresh_model',
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
            'direct_chord',
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

    const CATALOG_FILES = [
        'app.yml',
        'server.yml',
        'ui.yml',
        'views/agents.yml',
        'views/changes.yml',
        'views/collection.yml',
        'views/data.yml',
        'views/deposit.yml',
        'views/document.yml',
        'views/domains.yml',
        'views/editor.yml',
        'views/file.yml',
        'views/files.yml',
        'views/findings.yml',
        'views/focus.yml',
        'views/gallery.yml',
        'views/hpc.yml',
        'views/inbox.yml',
        'views/leads.yml',
        'views/linkedin.yml',
        'views/map.yml',
        'views/present.yml',
        'views/programs.yml',
        'views/project.yml',
        'views/projects.yml',
        'views/radar.yml',
        'views/session-detail.yml',
        'views/session-list.yml',
        'views/source.yml',
        'views/status.yml',
        'views/terminal.yml',
        'views/timeline.yml',
        'views/transcript.yml',
        'views/usage.yml',
        'views/venues.yml'
    ];

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
        expect(config.usage_refresh_min).toBe(10);
        expect(config.usage_refresh_model).toBe('haiku');
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
        const expected = [...new Set([...Object.values(EXPECTED).flat(), 'text'])].sort();
        expect(Object.keys(config).sort()).toEqual(expected);
    });

    it('reads one catalog file per owner and no legacy catalog file', () => {
        const { config } = loadConfig(engineDir());
        const dir = join(engineDir(), 'config', 'text');
        const names = [
            ...readdirSync(dir).filter((name) => name.endsWith('.yml')),
            ...readdirSync(join(dir, 'views'))
                .filter((name) => name.endsWith('.yml'))
                .map((name) => `views/${name}`)
        ].sort();
        expect(names).toEqual(CATALOG_FILES);
        expect(existsSync(join(engineDir(), 'config', 'text.yml'))).toBe(false);
        expect(existsSync(join(engineDir(), 'config', 'text-oculus.yml'))).toBe(false);
        for (const name of names) {
            const file = join(dir, name);
            const source = readFileSync(file, 'utf8');
            expect(source.startsWith('# Oculus text owned by ')).toBe(true);
            expect(Object.keys(parse(source) as Record<string, unknown>)).toEqual(['text']);
        }
        const text = config.text as Record<string, string>;
        expect(text['server.chat.chat_instruction']).toContain('The hub root is `{0}`');
        expect(text['server.chat.chat_focus_note']).toContain('`{2}` (absolute)');
        expect(text['server.chat.chat_index_note']).toBe(
            'The portfolio index is the file {0}; read it first.'
        );
        expect(text['app.chat']).toBe('Chat');
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

    it('keeps boards separate from the configured Pillars group', () => {
        const { config } = loadConfig(engineDir());
        const groups = config.nav_groups as Record<string, { label: string; glyph?: string }>;
        expect(groups.boards).toEqual({ label: 'Boards' });
        expect(groups.structure).toEqual({ label: 'Pillars', glyph: 'program' });
        expect(Object.keys(groups).indexOf('structure')).toBe(
            Object.keys(groups).indexOf('boards') + 1
        );
    });

    it('keeps view lists out of every navigation group', () => {
        const { config } = loadConfig(engineDir());
        const groups = Object.values(config.nav_groups as Record<string, Record<string, unknown>>);
        for (const group of groups) expect(group).not.toHaveProperty('keys');
    });

    it('names the wallpaper directory owned by oculus', () => {
        const { config } = loadConfig(engineDir());
        expect(config.wallpaper).toMatchObject({ dir: 'tools/oculus/assets/wallpaper' });
    });

    it('uses glyph names with ASCII stand-ins for every configured icon', () => {
        const { config } = loadConfig(engineDir());
        const glyphs = glyphCatalog(config);
        const ascii = asciiCatalog(config);
        const collections = config.collections as { key: string; icon?: string }[];
        const hosts = config.career_host_status as Record<string, { icon: string }>;
        const statuses = config.status_legend as { key: string; icon: string }[];
        const icons = [
            ...collections.flatMap((entry) => (entry.icon === undefined ? [] : [entry.icon])),
            ...Object.values(hosts).map((entry) => entry.icon),
            ...statuses.map((entry) => entry.icon)
        ];
        expect(
            collections
                .filter((entry) => entry.icon !== undefined && !(entry.icon in glyphs))
                .map((entry) => entry.key)
        ).toEqual([]);
        expect(
            Object.entries(hosts)
                .filter(([, entry]) => !(entry.icon in glyphs))
                .map(([key]) => key)
        ).toEqual([]);
        expect(icons.filter((name) => !(glyphs[name] in ascii))).toEqual([]);
    });

    it('configures one lowercase chord and a glyph on every group the rail flies out', () => {
        const { config } = loadConfig(engineDir());
        registerAll(client.registry);
        registerCollections(client.registry, collectionKeys(config));
        const raw = config.nav_groups as Record<string, Omit<NavGroup, 'id'>>;
        const groups = Object.entries(raw).map(([id, group]) => ({ id, ...group }));
        const sections = arrange(
            views().filter((view) => view.listed !== false),
            groups
        );
        // A group of more than GROUP_MAX views is one button with a list beside it, so it needs a
        // mark of its own and a letter to reach it by; this holds for whichever groups those are.
        const flyouts = sections.filter(
            (section) => section.label !== null && section.items.length > GROUP_MAX
        );
        expect(flyouts.map((section) => section.label)).toEqual([
            'Sessions',
            'Academic life',
            'Sources',
            'System'
        ]);
        expect(flyouts.filter((section) => section.glyph === undefined)).toEqual([]);
        expect(flyouts.map((section) => section.chord)).toEqual(['m', 'c', 's', 'y']);
        for (const group of groups) {
            if (group.chord !== undefined) expect(group.chord).toMatch(/^[a-z]$/);
        }
        // One letter reaches one thing: the direct chord and every group's are all distinct.
        const letters = [
            config.direct_chord as string,
            ...groups.map((group) => group.chord).filter((chord) => chord !== undefined)
        ];
        expect(new Set(letters).size).toBe(letters.length);
    });

    it('names a configured group and a nonnegative order in every listed registration', () => {
        const { config } = loadConfig(engineDir());
        registerAll(client.registry);
        registerCollections(client.registry, collectionKeys(config));
        const groups = new Set(Object.keys(config.nav_groups as Record<string, unknown>));
        const invalid = views()
            .filter((view) => view.listed !== false)
            .filter((view) => !groups.has(view.group) || view.order < 0);
        expect(invalid.map((view) => view.id)).toEqual([]);
    });

    it('reads each file on its own and finds its own keys there and nowhere else', () => {
        const dir = join(engineDir(), 'config');
        const seen: Record<string, string> = {};
        for (const [name, keys] of Object.entries(EXPECTED)) {
            const parsed = parse(readFileSync(join(dir, name), 'utf8')) as Record<string, unknown>;
            expect(Object.keys(parsed).sort()).toEqual([...keys].sort());
            for (const key of keys) {
                expect(seen[key]).toBe(undefined);
                seen[key] = name;
            }
        }
        expect(
            readdirSync(dir)
                .filter((name) => name.endsWith('.yml'))
                .sort()
        ).toEqual(Object.keys(EXPECTED).sort());
        for (const name of CATALOG_FILES) {
            const parsed = parse(readFileSync(join(dir, 'text', name), 'utf8')) as Record<
                string,
                unknown
            >;
            expect(Object.keys(parsed)).toEqual(['text']);
        }
    });
});
