// The config folder oculus ships, read the way the server reads it: which keys sit in which file,
// that no key is defined in two, that every file carries the one line the Config view and the
// manual show, and that the glyphs, the icons and the catalogue groups the files name resolve. The
// machine's own local.yml is left out of every list here, since a checkout has one or it has none
// and neither may change a result.

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { beforeEach, describe, expect, it } from 'vitest';
import {
    LOCAL_NAME,
    collectionKeys,
    engineDir,
    glyphCatalog,
    iconCatalog,
    iconFindings,
    iconSet,
    loadConfig,
    textCatalog
} from '../../../src/lib/data/sources/config.ts';
import { portfolioConfigFrom } from '../../../src/lib/data/index.ts';
import { readRoots, rootsFile } from '../../../src/lib/server/files/files.ts';
import { descriptionKey } from '../../../src/lib/views/system/config/files.ts';
import {
    arrange,
    isChorded,
    type DocEntry,
    type NavGroup
} from '../../../src/lib/state/workbench/navigation/catalogue.ts';
// Importing the route loader registers views; collection registrations use sources.yml keys.
import { registerAll, registerCollections } from '../../../src/routes/views.ts';
import { createClientState, type ClientState } from '../../fixtures/client.ts';
import { treeFiles } from '../walk.ts';

let client: ClientState;
let views: ClientState['registry']['views'];

beforeEach(() => {
    client = createClientState();
    ({ views } = client.registry);
});

/** The shapes the source names a glyph in: a prop or field, a `<Glyph>`, a `glyph()` call. */
const NAMED = [
    /\b[\w$]*(?:glyph|icon)[\w$]*\s*[:=]\s*\{?\s*['"`]([\w-]+)['"`]/gi,
    /\bglyph\s*\(\s*['"`]([\w-]+)['"`]/g,
    /<Glyph\b[^>]*\bname=["']([\w-]+)["']/g
];

/**
 * Every word a glyph name is read as. A glyph is named by a prop or a field whose own name carries
 * `glyph` or `icon` (`glyph="edit"`, `const OVERDUE_GLYPH = 'bang'`), by the `name` of a `<Glyph>`,
 * by a `glyph('edit')` call, by a string value of any config file but the two that define the
 * glyphs, at any depth, or inside a label as a `{G.name}` placeholder (`appearance.yml`'s
 * `{G.theme_rice} mocha`). A name found in none of those is read by nothing. A config value is not
 * always a glyph name, so the check can pass a name some other value happens to spell; it cannot
 * fail a name that is read.
 */
function glyphReaders(engine: string): Set<string> {
    const found = new Set<string>();
    const walk = (dir: string, take: (file: string) => void): void => {
        for (const rel of treeFiles(dir)) take(join(dir, rel));
    };
    const placeholders = (text: string): void => {
        for (const match of text.matchAll(/\bG\.(\w+)/g)) found.add(match[1]);
    };
    walk(join(engine, 'src'), (file) => {
        const text = readFileSync(file, 'utf8');
        for (const shape of NAMED) for (const match of text.matchAll(shape)) found.add(match[1]);
        placeholders(text);
    });
    const values = (value: unknown): void => {
        if (typeof value === 'string') {
            found.add(value);
            placeholders(value);
        } else if (Array.isArray(value)) value.forEach(values);
        else if (typeof value === 'object' && value !== null) Object.values(value).forEach(values);
    };
    walk(join(engine, 'config'), (file) => {
        if (!file.endsWith('.yml') || file.endsWith(LOCAL_NAME)) return;
        if (file.endsWith('glyphs.yml') || file.endsWith('icons.yml')) return;
        values(parse(readFileSync(file, 'utf8')));
    });
    return found;
}

/** Every description key opens with this, which is what makes an orphan one findable. */
const DESC_PREFIX = 'config.desc_';

/**
 * The tracked YAML of the config folder, in name order. The machine's own local.yml is left out: it
 * is in the folder on a machine that has made one and absent on a fresh clone, so a check over the
 * tracked files must not read it either way.
 */
function tracked(dir: string): string[] {
    const own = (at: string, prefix: string): string[] =>
        readdirSync(join(dir, at))
            .filter((name) => name.endsWith('.yml') && name !== LOCAL_NAME)
            .map((name) => `${prefix}${name}`);
    return [...own('', ''), ...own('catalogs', 'catalogs/')].sort();
}

describe("oculus's own config directory", () => {
    // Revert: delete `code_theme:` from config/appearance.yml; the file then lacks a listed key.
    /** Every non-text top-level key, by its root config file. */
    const EXPECTED: Record<string, string[]> = {
        'appearance.yml': ['themes', 'wallpaper', 'memories', 'crt', 'code_theme', 'terminal'],
        'present.yml': ['deck'],
        'behavior.yml': [
            'read_limits',
            'context_window',
            'usage_tiers',
            'usage_refresh_min',
            'usage_refresh_model',
            'data_domains',
            'waiting_status',
            'audit_ignore',
            'calendar',
            'mail',
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
            'tasks',
            'editor',
            'writes',
            'notify',
            'notes',
            'changes',
            'git',
            'search',
            'open'
        ],
        'catalogs/agents.yml': ['agents'],
        'catalogs/glyphs.yml': ['glyphs'],
        'catalogs/icons.yml': ['icons'],
        'layout.yml': [
            'rail',
            'nav_groups',
            'direct_chord',
            'arrangements',
            'board',
            'tab_split',
            'tab_rollup',
            'nav_live',
            'docs',
            'focus_label_mode',
            'project_label_mode',
            'archive_label_mode',
            'map_label_mode'
        ],
        'catalogs/manifest-schema.yml': ['manifest_schema'],
        'catalogs/meta.yml': ['meta'],
        'catalogs/options.yml': ['options'],
        'sources.yml': [
            'scan',
            'venues_file',
            'datasets_file',
            'pillars_file',
            'domains_file',
            'people_file',
            'organisations_file',
            'collections',
            'leads_file',
            'radar_file',
            'publications_file',
            'linkedin_dir',
            'career_file',
            'roots',
            'languages'
        ],
        'catalogs/vocab.yml': [
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
            'venue_themes',
            'data_themes',
            'radar_buckets'
        ]
    };

    const CATALOG_FILES = [
        'app.yml',
        'findings.yml',
        'server.yml',
        'statusbar.yml',
        'ui.yml',
        'views/academic/present.yml',
        'views/academic/slides.yml',
        'views/boards/collection.yml',
        'views/boards/deposit.yml',
        'views/boards/editor.yml',
        'views/boards/focus.yml',
        'views/boards/person.yml',
        'views/boards/project.yml',
        'views/boards/projects.yml',
        'views/feeds/inbox.yml',
        'views/feeds/leads.yml',
        'views/feeds/linkedin.yml',
        'views/feeds/radar.yml',
        'views/personal/account-setup.yml',
        'views/personal/calendar.yml',
        'views/personal/memories.yml',
        'views/sessions/agents.yml',
        'views/sessions/changes.yml',
        'views/sessions/composer.yml',
        'views/sessions/customizations.yml',
        'views/sessions/session-detail.yml',
        'views/sessions/session-list.yml',
        'views/sessions/terminal.yml',
        'views/sessions/timeline.yml',
        'views/sessions/transcript.yml',
        'views/sources/data.yml',
        'views/sources/doc.yml',
        'views/sources/document.yml',
        'views/sources/file.yml',
        'views/sources/files.yml',
        'views/sources/note.yml',
        'views/sources/repositories.yml',
        'views/sources/search.yml',
        'views/sources/source.yml',
        'views/sources/venues.yml',
        'views/structure/domains.yml',
        'views/structure/map.yml',
        'views/structure/pillars.yml',
        'views/system/audit.yml',
        'views/system/config.yml',
        'views/system/findings.yml',
        'views/system/gallery.yml',
        'views/system/help.yml',
        'views/system/history.yml',
        'views/system/hpc.yml',
        'views/system/status.yml',
        'views/system/usage.yml',
        'views/system/workbench.yml'
    ];

    it('merges without a finding, so no key is defined in two files', () => {
        expect(loadConfig(engineDir()).findings).toEqual([]);
    });

    it('reads the venue and dataset theme words into the vocabulary validate checks', () => {
        const { vocab } = portfolioConfigFrom(loadConfig(engineDir()).config, engineDir());
        expect(vocab.venueThemes).toEqual([
            'core-ml',
            'clinical',
            'high-end',
            'signal',
            'theory',
            'informatics',
            'federated',
            'neuro',
            'imaging',
            'bio',
            'cs',
            'systems',
            'method'
        ]);
        expect(vocab.dataThemes).toEqual([
            'single-cell',
            'eeg',
            'mri-imaging',
            'bci-ecog',
            'ecg',
            'survival-tabular',
            'clinical-ehr',
            'pde-operator',
            'ct-imaging',
            'mammography',
            'simulated-copula'
        ]);
    });

    it('leaves the theme lists absent when the config holds none, or none with a key', () => {
        const merged = loadConfig(engineDir()).config;
        const without = Object.fromEntries(
            Object.entries(merged).filter(
                ([key]) => key !== 'venue_themes' && key !== 'data_themes'
            )
        );
        const bare = portfolioConfigFrom(without, engineDir()).vocab;
        expect(bare).not.toHaveProperty('venueThemes');
        expect(bare).not.toHaveProperty('dataThemes');
        const empty = portfolioConfigFrom(
            { ...without, venue_themes: [], data_themes: [{ label: 'No key' }] },
            engineDir()
        ).vocab;
        expect(empty).not.toHaveProperty('venueThemes');
        expect(empty).not.toHaveProperty('dataThemes');
    });

    it('names the six scan tiers, the software one flat, typed and optional', () => {
        const { scan } = portfolioConfigFrom(loadConfig(engineDir()).config, engineDir());
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
            jobs: 'grey-d',
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
            ...readdirSync(join(dir, 'views')).flatMap((group) =>
                readdirSync(join(dir, 'views', group))
                    .filter((name) => name.endsWith('.yml'))
                    .map((name) => `views/${group}/${name}`)
            )
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
    const ROOTS = readRoots(loadConfig(engineDir()).config, rootsFile(engineDir())).roots;
    const MISSING = ROOTS.filter((root) => !existsSync(root.dir));
    if (MISSING.length > 0) {
        console.log(
            `config.test.ts: skipping the roots check; no directory at ${MISSING.map((root) => root.dir).join(', ')}`
        );
    }

    it.skipIf(MISSING.length > 0)('names roots that are on this machine', () => {
        expect(ROOTS.map((root) => root.key)).toEqual(['cathedra', 'game-engine']);
        expect(readRoots(loadConfig(engineDir()).config, rootsFile(engineDir())).findings).toEqual(
            []
        );
    });

    it('names a group of its own and a path under the hub for every document', () => {
        const { config } = loadConfig(engineDir());
        const groups = Object.keys(config.nav_groups as Record<string, unknown>);
        const docs = config.docs as { label: string; path: string; group: string }[];
        expect(docs.map((entry) => entry.path)).toEqual([
            'docs/RESEARCH-APPROACH.md',
            'docs/AGENT-APPROACH.md',
            'docs/HPC-UTwente-howto.md'
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
        // The machine's own file is described too, and this checkout holds one or it does not, so
        // it is named here rather than read off the disk.
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

    it('keys every catalogue group by the rail page it holds, in rail order, Help after System', () => {
        const { config } = loadConfig(engineDir());
        const groups = config.nav_groups as Record<string, { label: string }>;
        const rail = config.rail as { label: string; page: string }[];
        const pages = Object.keys(groups);
        expect(pages).toEqual(rail.map((entry) => entry.page));
        expect(pages.map((key) => groups[key].label)).toEqual(rail.map((entry) => entry.label));
        expect(pages.indexOf('help')).toBe(pages.indexOf('info') + 1);
        expect(groups.help.label).toBe('Help');
        expect(config.arrangements).toHaveProperty('help');
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

    it('uses glyph names for every configured icon', () => {
        const { config } = loadConfig(engineDir());
        const glyphs = glyphCatalog(config);
        const hosts = config.career_host_status as Record<string, { icon: string }>;
        const statuses = config.status_legend as { key: string; icon: string }[];
        const icons = [
            ...Object.values(hosts).map((entry) => entry.icon),
            ...statuses.map((entry) => entry.icon)
        ];
        expect(
            Object.entries(hosts)
                .filter(([, entry]) => !(entry.icon in glyphs))
                .map(([key]) => key)
        ).toEqual([]);
        expect(icons.filter((name) => !(name in glyphs))).toEqual([]);
    });

    it('names one icon for every glyph and for nothing but a glyph', () => {
        const { config } = loadConfig(engineDir());
        expect(Object.keys(iconCatalog(config))).toEqual(Object.keys(glyphCatalog(config)));
        expect(iconFindings(engineDir(), config)).toEqual([]);
    });

    it('names a glyph only where the source or another config file reads it', () => {
        const { config } = loadConfig(engineDir());
        const read = glyphReaders(engineDir());
        expect(Object.keys(glyphCatalog(config)).filter((name) => !read.has(name))).toEqual([]);
    });

    it('gives every glyph name a stand-in of printable ASCII, and holds no other map', () => {
        const { config } = loadConfig(engineDir());
        const raw = config.glyphs as Record<string, unknown>;
        const loose = Object.entries(raw).filter(
            ([, standIn]) => typeof standIn !== 'string' || !/^[\x20-\x7E]+$/.test(standIn)
        );
        expect(loose.map(([name]) => name)).toEqual([]);
        expect(config.ascii).toBe(undefined);
    });

    it('holds every stand-in to three characters, the box a terminal theme draws it in', () => {
        const { config } = loadConfig(engineDir());
        const wide = Object.entries(glyphCatalog(config)).filter(
            ([, standIn]) => standIn.length > 3
        );
        expect(wide.map(([name, standIn]) => `${name}: ${standIn}`)).toEqual([]);
    });

    it('reports a glyph whose stand-in is empty, not text, wider than three, or not ASCII', () => {
        const drifted = {
            glyphs: { pin: 'P', blank: '', count: 3, mark: '\u25C6', wide: '[><]' },
            icons: { pin: 'pin', blank: 'pin', count: 'pin', mark: 'pin', wide: 'pin' },
            text: loadConfig(engineDir()).config.text
        };
        const found = iconFindings(engineDir(), drifted);
        expect(
            found.filter((one) => one.file.endsWith('glyphs.yml')).map((one) => one.key)
        ).toEqual(['blank', 'count', 'mark', 'wide']);
        expect(found.map((one) => one.message)).toContain(
            'glyph wide has no stand-in of one to three printable ASCII characters'
        );
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
            join(engineDir(), 'src', 'lib', 'data', 'sources', 'config', 'catalogs.ts'),
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
            icons: { pin: 'nonesuch-icon', nothing: 'circle' },
            text: loadConfig(engineDir()).config.text
        };
        expect(iconFindings(engineDir(), drifted).map((one) => one.message)).toEqual([
            'glyph flag has no icon',
            'the icon package ships no nonesuch-icon.svg',
            'nothing is not a name in config/catalogs/glyphs.yml'
        ]);
        expect(iconSet(drifted)).toEqual({});
    });

    it('reads glyph and icon names as own keys, so a name like constructor is no name', () => {
        const inherited = {
            glyphs: { pin: 'P', toString: 'T' },
            icons: { pin: 'pin', constructor: 'circle' },
            text: loadConfig(engineDir()).config.text
        };
        expect(iconFindings(engineDir(), inherited).map((one) => one.message)).toEqual([
            'glyph toString has no icon',
            'constructor is not a name in config/catalogs/glyphs.yml'
        ]);
        expect(Object.keys(iconSet(inherited))).toEqual(['pin']);
    });

    it('gives every group a chord and a glyph, and no letter a key the workbench binds', async () => {
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
        // Every group names a letter, so each is reached by a chord of its own whatever its size,
        // and its catalogue heading carries a mark of its own.
        expect(sections.filter((section) => !isChorded(section))).toEqual([]);
        expect(sections.filter((section) => section.glyph === undefined)).toEqual([]);
        expect(sections.map((section) => section.chord)).toEqual([
            'f',
            'm',
            'p',
            'e',
            's',
            'c',
            'l',
            'r',
            't',
            'y',
            'h',
            'w'
        ]);
        // One letter reaches one thing: the direct chord and every group's are all distinct.
        const letters = [
            config.direct_chord as string,
            ...groups.map((group) => group.chord).filter((chord) => chord !== undefined)
        ];
        expect(new Set(letters).size).toBe(letters.length);
        // A chord letter is a letter the workbench binds to nothing else: with no chord configured,
        // the key answers with no action and leaves the key state as it was, which a cursor key,
        // `n` and the first `g` of `g g` do not.
        const quiet = {
            cursorActive: true,
            typing: false,
            paletteOpen: false,
            trayOpen: false,
            confirmOpen: false
        };
        const { initialKeyState, resolveKey } = await import('../../../src/lib/shell/keys/keys.ts');
        const bound = letters.filter((letter) => {
            const answer = resolveKey(
                { key: letter },
                { direct: [], chords: {} },
                quiet,
                initialKeyState(),
                1000
            );
            return answer.action !== null || answer.state.lastG !== initialKeyState().lastG;
        });
        expect(bound).toEqual([]);
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
