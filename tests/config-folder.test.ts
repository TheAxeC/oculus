// The config folder oculus ships, read the way the server reads it: which keys sit in which file,
// that no key is defined in two, that every file carries the one line the Config view and the manual
// show, and that the glyphs, the icons and the rail groups the files name resolve. The machine's own
// local.yml is left out of every list here, since a checkout has one or it has none and neither may
// change a result.

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { beforeEach, describe, expect, it } from 'vitest';
import {
    LOCAL_NAME,
    asciiCatalog,
    collectionKeys,
    engineDir,
    glyphCatalog,
    iconCatalog,
    iconFindings,
    iconSet,
    loadConfig,
    textCatalog
} from '../src/lib/data/sources/config.ts';
import { portfolioConfigFrom } from '../src/lib/data/index.ts';
import { readRoots, rootsFile } from '../src/lib/server/files.ts';
import { descriptionKey } from '../src/lib/views/config/files.ts';
import { arrange, isFlyout, type DocEntry, type NavGroup } from '../src/lib/shell/rail.ts';
// Importing the route loader registers views; collection registrations use sources.yml keys.
import { registerAll, registerCollections } from '../src/routes/views.ts';
import { createClientState, type ClientState } from './client.ts';

let client: ClientState;
let views: ClientState['registry']['views'];

beforeEach(() => {
    client = createClientState();
    ({ views } = client.registry);
});

/** Every description key opens with this, which is what makes an orphan one findable. */
const DESC_PREFIX = 'config.desc_';

/**
 * The tracked YAML of the config folder, in name order. The machine's own local.yml is left out: it
 * is in the folder on a machine that has made one and absent on a fresh clone, so a check over the
 * tracked files must not read it either way.
 */
function tracked(dir: string): string[] {
    return readdirSync(dir)
        .filter((name) => name.endsWith('.yml') && name !== LOCAL_NAME)
        .sort();
}

describe("oculus's own config directory", () => {
    /** Every non-text top-level key, by its root config file. */
    const EXPECTED: Record<string, string[]> = {
        'appearance.yml': ['themes', 'wallpaper', 'memories', 'crt', 'terminal'],
        'present.yml': ['deck'],
        'behavior.yml': [
            'read_limits',
            'stale_days',
            'context_window',
            'usage_tiers',
            'usage_refresh_min',
            'usage_refresh_model',
            'data_domains',
            'waiting_status',
            'audit_ignore',
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
            'notes',
            'changes',
            'git'
        ],
        'glyphs.yml': ['glyphs', 'ascii'],
        'icons.yml': ['icons'],
        'layout.yml': [
            'nav_groups',
            'direct_chord',
            'arrangements',
            'board',
            'tab_split',
            'tab_rollup',
            'nav_live',
            'bookmarks',
            'docs',
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
            'inbox_file',
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
        'views/audit.yml',
        'views/changes.yml',
        'views/collection.yml',
        'views/config.yml',
        'views/data.yml',
        'views/deposit.yml',
        'views/doc.yml',
        'views/document.yml',
        'views/domains.yml',
        'views/editor.yml',
        'views/file.yml',
        'views/files.yml',
        'views/findings.yml',
        'views/focus.yml',
        'views/gallery.yml',
        'views/help.yml',
        'views/history.yml',
        'views/hpc.yml',
        'views/inbox.yml',
        'views/leads.yml',
        'views/linkedin.yml',
        'views/map.yml',
        'views/memories.yml',
        'views/note.yml',
        'views/present.yml',
        'views/programs.yml',
        'views/project.yml',
        'views/projects.yml',
        'views/radar.yml',
        'views/repositories.yml',
        'views/session-detail.yml',
        'views/session-list.yml',
        'views/slides.yml',
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

    it('names the six scan tiers, the software one flat, typed and optional', () => {
        const { scan } = portfolioConfigFrom(loadConfig(engineDir()).config);
        expect(scan.map((rule) => rule.dir)).toEqual([
            'projects/ideas',
            'projects/active',
            'projects/manuscripts',
            'projects/software',
            'projects/coauthor',
            'projects/archive'
        ]);
        expect(scan[3]).toEqual({ dir: 'projects/software', type: 'software', optional: true });
        expect(scan.filter((rule) => rule.optional === true)).toHaveLength(1);
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
        // The wait between the last keystroke in a note and the save that follows it.
        expect(config.notes).toEqual({ autosave_ms: 800 });
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

    it('names a group of its own and a path under the hub for every document', () => {
        const { config } = loadConfig(engineDir());
        const groups = Object.keys(config.nav_groups as Record<string, unknown>);
        const docs = config.docs as { label: string; path: string; group: string }[];
        expect(docs.map((entry) => entry.path)).toEqual([
            'RESEARCH-APPROACH.md',
            'AGENT-APPROACH.md',
            'HPC-UTwente-howto.md'
        ]);
        for (const entry of docs) {
            expect(groups).toContain(entry.group);
            expect(entry.path.startsWith('/')).toBe(false);
            expect(entry.path.includes('..')).toBe(false);
            expect(entry.path.endsWith('.md')).toBe(true);
            expect(entry.label.length).toBeGreaterThan(0);
        }
    });

    it('writes one description for every config file and none for a file that is not there', () => {
        const { config } = loadConfig(engineDir());
        const catalog = textCatalog(config);
        const dir = join(engineDir(), 'config');
        // The machine's own file is described too, and this checkout holds one or it does not, so it
        // is named here rather than read off the disk.
        const files = tracked(dir);
        const missing = files.filter((name) => !(descriptionKey(name) in catalog));
        expect(missing).toEqual([]);
        expect(descriptionKey(LOCAL_NAME) in catalog).toBe(true);
        const described = Object.keys(catalog)
            .filter((key) => key.startsWith(DESC_PREFIX))
            .sort();
        expect(described).toEqual(
            [...files, LOCAL_NAME].map((name) => descriptionKey(name)).sort()
        );
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

    it('names one icon for every glyph and for nothing but a glyph', () => {
        const { config } = loadConfig(engineDir());
        expect(Object.keys(iconCatalog(config))).toEqual(Object.keys(glyphCatalog(config)));
        expect(iconFindings(engineDir(), config)).toEqual([]);
    });

    it('ships a drawing for every one of them', () => {
        const { config } = loadConfig(engineDir());
        const icons = iconSet(config);
        expect(Object.keys(icons)).toEqual(Object.keys(glyphCatalog(config)));
        for (const [name, svg] of Object.entries(icons)) {
            expect(svg, name).toContain('<svg');
            expect(svg, name).toContain('stroke="currentColor"');
        }
    });

    it('resolves a drawing through the package rather than through a path into node_modules', () => {
        const source = readFileSync(
            join(engineDir(), 'src', 'lib', 'data', 'sources', 'config.ts'),
            'utf8'
        );
        // The package name is all the source says; the only mention of the folder is the comment
        // above the resolver explaining why it does not name one.
        expect(source.match(/node_modules/g)).toHaveLength(1);
        expect(source).toContain('resolver.resolve(`lucide-static/icons/${icon}.svg`)');
        expect(iconSet({ glyphs: { pin: 'P' }, icons: { pin: 'pin' } }).pin).toContain('<svg');
    });

    it('reports a glyph with no icon, a row that is no glyph, and an icon the package has not', () => {
        const drifted = {
            glyphs: { pin: 'P', flag: 'F' },
            icons: { pin: 'nonesuch-icon', nothing: 'circle' }
        };
        expect(iconFindings(engineDir(), drifted).map((one) => one.message)).toEqual([
            'glyph flag has no icon',
            'the icon package ships no nonesuch-icon.svg',
            'nothing is not a name in config/glyphs.yml'
        ]);
        expect(iconSet(drifted)).toEqual({});
    });

    it('configures one lowercase chord and a glyph on every group the rail flies out', () => {
        const { config } = loadConfig(engineDir());
        registerAll(client.registry);
        registerCollections(client.registry, collectionKeys(config));
        const raw = config.nav_groups as Record<string, Omit<NavGroup, 'id'>>;
        const groups = Object.entries(raw).map(([id, group]) => ({ id, ...group }));
        const sections = arrange(
            views().filter((view) => view.listed !== false),
            groups,
            config.docs as DocEntry[]
        );
        // A group of more entries than the group maximum, its documents counted, is one button with a list
        // beside it, so it needs a mark of its own and a letter to reach it by: a group drawn as
        // buttons is reached through the direct chord, and one drawn as a list is reached only
        // through its own. This holds for whichever groups those are.
        const flyouts = sections.filter(isFlyout);
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
        expect(tracked(dir)).toEqual(Object.keys(EXPECTED).sort());
        for (const name of CATALOG_FILES) {
            const parsed = parse(readFileSync(join(dir, 'text', name), 'utf8')) as Record<
                string,
                unknown
            >;
            expect(Object.keys(parsed)).toEqual(['text']);
        }
    });
});
