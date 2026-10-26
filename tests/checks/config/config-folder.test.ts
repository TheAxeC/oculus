// Layer 4, tree check. The config folder oculus ships, read the way the server reads it: which keys
// sit in which file, that no key is defined in two, that every file carries a description line, the
// one the Settings view shows, and that the glyphs, the icons and the catalogue groups the files
// name resolve. The files are oculus's defaults (config/defaults/), the options files that
// describe them (config/options/), the catalogs, the schemas and the texts; options/local.yml is
// the description of a hub's local.yml keys and holds no machine's values.

import {
    existsSync,
    mkdirSync,
    mkdtempSync,
    readdirSync,
    readFileSync,
    rmSync,
    writeFileSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { parse } from 'yaml';
import { beforeEach, describe, expect, it } from 'vitest';
import {
    LOCAL_NAME,
    engineDir,
    glyphCatalog,
    iconCatalog,
    iconSet,
    loadConfig,
    textCatalog,
    unplacedGroup
} from '../../../src/lib/data/sources/config.ts';
import { collectionViews } from '../../../src/lib/data/snapshot/normalise.ts';
import { iconFindings } from '../../../src/lib/data/sources/config/catalogs.ts';
import { portfolioConfigFrom } from '../../../src/lib/data/index.ts';
import { buildOneHub } from '../../fixtures/hubs/hub-build.ts';
import { createChecker, checkDocument } from '../../../src/lib/data/snapshot/schema/check.ts';
import { schemaFor } from '../../../src/lib/data/snapshot/schema/set.ts';
import { HUB_FILE } from '../../../src/lib/data/helpers/hub-names.ts';
import {
    TEMPLATES_PAGE,
    collectionTemplates,
    hubConfigText
} from '../../../src/lib/data/sources/documents/templates.ts';
import { ensureBookmarksFile } from '../../../src/lib/server/files/fs/bookmarks.ts';
import { withOwnSchemas } from '../../../src/lib/server/root/watch/build.ts';
import { descriptionKey } from '../../../src/lib/state/system/config/config-files.ts';
import {
    arrange,
    isChorded,
    readGroups,
    type DocEntry,
    type NavGroup
} from '../../../src/lib/state/workbench/navigation/catalogue.ts';
import { boardsSource } from '../../../src/lib/state/boards/board/presets.ts';
// Importing the route loader registers views; collection registrations use sources.yml keys, and
// the board registrations the keys of layout.yml's boards.
import {
    pageBoards,
    registerAll,
    registerBoards,
    registerCollections
} from '../../../src/routes/views.ts';
import { createClientState, type ClientState } from '../../fixtures/client.ts';
import { DEMO_HUB, hubOf, realHub, realHubName, skipLine } from '../../fixtures/hubs/real-hub.ts';
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
        if (!file.endsWith('.yml')) return;
        if (file.endsWith('glyphs.yml') || file.endsWith('icons.yml')) return;
        values(parse(readFileSync(file, 'utf8')));
    });
    return found;
}

/** Every description key opens with this, which is what makes an orphan one findable. */
const DESC_PREFIX = 'settings.desc_';

/** The folders of the config folder whose files merge into one map, the texts aside. */
const MERGED = ['defaults', 'options', 'catalogs', 'schemas'];

/** The YAML of the merged folders of the config folder, named relative to it, in name order. */
function tracked(dir: string): string[] {
    return MERGED.flatMap((at) =>
        readdirSync(join(dir, at))
            .filter((name) => name.endsWith('.yml'))
            .map((name) => `${at}/${name}`)
    ).sort();
}

describe("oculus's own config directory", () => {
    /** Every non-text top-level key, by the file of the config folder that defines it. */
    const EXPECTED: Record<string, string[]> = {
        'defaults/appearance.yml': [
            'themes',
            'theme',
            'app_theme',
            'text_size',
            'rice',
            'wallpaper',
            'crt',
            'code_theme',
            'code_themes',
            'file_icons',
            'show_tabs',
            'editor_actions',
            'wrap_tabs',
            'terminal',
            'locale'
        ],
        'defaults/present.yml': ['defaults'],
        'defaults/behavior.yml': [
            'read_limits',
            'context_window',
            'usage_tiers',
            'usage_refresh_min',
            'usage_refresh_model',
            'audit_ignore',
            'audit',
            'calendar',
            'mail',
            'processes',
            'focus',
            'file_index',
            'slurm',
            'chat',
            'editor',
            'latex',
            'writes',
            'notes',
            'changes',
            'files',
            'git',
            'search',
            'lint',
            'literature',
            'open',
            'apps',
            'status_bar'
        ],
        'catalogs/agents.yml': ['agents'],
        'catalogs/file-nesting.yml': ['patterns'],
        'catalogs/glyphs.yml': ['glyphs'],
        'catalogs/icons.yml': ['icons'],
        'catalogs/latex.yml': ['latex_editing'],
        'catalogs/unimath.yml': ['latex_unimath'],
        'defaults/layout.yml': [
            'rail',
            'nav_groups',
            'direct_chord',
            'arrangements',
            'workbench',
            'floats',
            'boards',
            'counts',
            'docs',
            'focus_label_mode',
            'map_label_mode'
        ],
        'schemas/cpp-schema.yml': ['cpp_schema'],
        'schemas/deck-schema.yml': ['deck_schema'],
        'schemas/manifest-schema.yml': ['manifest_schema', 'groups', 'manifest_fields'],
        'defaults/sources.yml': [
            'scan',
            'new_project_dir',
            'collections',
            'chat_context',
            'career_file',
            'linkedin_dir',
            'portfolio_deck',
            'memories_dir',
            'wallpaper_dir',
            'bookmarks',
            'schedules',
            'apps_dir',
            'repository_scan_depth',
            'self',
            'languages'
        ],
        'catalogs/vocab.yml': [
            'palette',
            'stages',
            'forms',
            'chips',
            'statuses',
            'lead_statuses',
            'focus_clusters',
            'focus_lanes',
            'fund_stages',
            'focus_lane_tones',
            'ticker_categories',
            'facet_tones',
            'tiers',
            'research_audit',
            'roles',
            'categories',
            'rail_color',
            'data_access',
            'venue_categories',
            'venue_tiers',
            'radar_buckets'
        ]
    };

    /**
     * The options files at the top of the options folder, one per defaults file, one for a hub's
     * local.yml and one for the workspace's words, each holding `options:` and `groups:`, which the
     * merge reads into its own two keys. Those of the catalog and schema files are in its
     * subfolders (OPTION_SUBFILES), which `tracked` does not list.
     */
    const OPTION_FILES = [
        'options/appearance.yml',
        'options/behavior.yml',
        'options/layout.yml',
        'options/local.yml',
        'options/present.yml',
        'options/sources.yml',
        'options/text.yml'
    ];

    /** The options files of the subfolders: one per catalog or schema file the user sets. */
    const OPTION_SUBFILES = [
        'options/catalogs/agents.yml',
        'options/catalogs/file-nesting.yml',
        'options/catalogs/glyphs.yml',
        'options/catalogs/icons.yml',
        'options/catalogs/latex.yml',
        'options/catalogs/unimath.yml',
        'options/catalogs/vocab.yml',
        'options/schemas/manifest-schema.yml'
    ];

    /** The keys of the merged map the options folder fills. */
    const OPTION_KEYS = ['options', 'option_groups'];

    const CATALOG_FILES = [
        'app.yml',
        'desktop.yml',
        'findings.yml',
        'palette-page.yml',
        'server.yml',
        'statusbar.yml',
        'ui.yml',
        'views/academic/latex.yml',
        'views/academic/math-preview.yml',
        'views/academic/present.yml',
        'views/academic/slides.yml',
        'views/apps/apps.yml',
        'views/boards/collection.yml',
        'views/boards/deposit.yml',
        'views/boards/editor.yml',
        'views/boards/entry.yml',
        'views/boards/focus.yml',
        'views/boards/person.yml',
        'views/boards/project.yml',
        'views/boards/projects.yml',
        'views/feeds/inbox.yml',
        'views/feeds/leads.yml',
        'views/feeds/linkedin.yml',
        'views/feeds/literature.yml',
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
        'views/shared/commands.yml',
        'views/shared/diagram.yml',
        'views/shared/entry-form.yml',
        'views/shared/folder-files.yml',
        'views/shared/hubs.yml',
        'views/shared/roles.yml',
        'views/sources/data.yml',
        'views/sources/doc.yml',
        'views/sources/document.yml',
        'views/sources/file.yml',
        'views/sources/files.yml',
        'views/sources/notes.yml',
        'views/sources/repositories.yml',
        'views/sources/search.yml',
        'views/sources/source.yml',
        'views/sources/venues.yml',
        'views/structure/domains.yml',
        'views/structure/map.yml',
        'views/structure/pillars.yml',
        'views/system/audit.yml',
        'views/system/findings.yml',
        'views/system/gallery.yml',
        'views/system/help.yml',
        'views/system/history.yml',
        'views/system/machine/debug.yml',
        'views/system/machine/hpc.yml',
        'views/system/machine/output.yml',
        'views/system/machine/processes.yml',
        'views/system/machine/usage.yml',
        'views/system/status.yml',
        'views/system/workbench.yml'
    ];

    it('merges without a finding, so no key is defined in two files', () => {
        expect(loadConfig(engineDir()).findings).toEqual([]);
    });

    // A catalog or text file with a part its whole-file shape refuses gives one finding for that
    // part, worded from the catalog, that names the file and the key; the rest of the file is kept.
    it.each([
        ['catalogs/icons.yml', 'icons: [1]\n', 'icons', 'icons must be a map'],
        [
            'catalogs/vocab.yml',
            'palette:\n    "#fff": c-a\nstatuses: 3\n',
            'statuses',
            'statuses must be a map'
        ],
        ['catalogs/vocab.yml', 'stages: [exploring]\n', 'stages', 'stages must be a map'],
        ['catalogs/vocab.yml', 'tiers: 3\n', 'tiers', 'tiers must be a map'],
        [
            'text/views/system/status.yml',
            'text: {}\nstray: x\n',
            'stray',
            'key stray is not a key this file takes'
        ]
    ])('words a part of %s its shape refuses', (name, text, key, message) => {
        const { config, findings } = loadConfig(engineDir(), {
            instead: { name, text, layer: 'engine' }
        });
        const mine = findings.filter((one) => one.file.endsWith(name));
        expect(
            mine.map((one) => [one.file.endsWith(`/config/${name}`), one.key, one.message])
        ).toEqual([[true, key, message]]);
        expect(config.text).toBeDefined();
    });

    it('holds exactly the expected top-level keys, and no more', () => {
        const { config } = loadConfig(engineDir());
        const expected = [
            ...new Set([...Object.values(EXPECTED).flat(), ...OPTION_KEYS, 'text'])
        ].sort();
        expect(Object.keys(config).sort()).toEqual(expected);
    });

    it('reads one catalog file per owner and no legacy catalog file', () => {
        const dir = join(engineDir(), 'config', 'text');
        const names = readdirSync(dir, { recursive: true, encoding: 'utf8' })
            .filter((name) => name.endsWith('.yml'))
            .sort();
        expect(names).toEqual(CATALOG_FILES);
        expect(existsSync(join(engineDir(), 'config', 'text.yml'))).toBe(false);
        expect(existsSync(join(engineDir(), 'config', 'text-oculus.yml'))).toBe(false);
        for (const name of names) {
            const file = join(dir, name);
            const source = readFileSync(file, 'utf8');
            expect(source.startsWith('# Oculus text owned by ')).toBe(true);
            expect(Object.keys(parse(source) as Record<string, unknown>)).toEqual(['text']);
        }
    });

    it('writes one description for every config file and none for a file that is not there', () => {
        const { config } = loadConfig(engineDir());
        const catalog = textCatalog(config);
        const dir = join(engineDir(), 'config');
        // A defaults file and its options file share a name, and so one description; the hub's
        // settings file is described too and lies outside the folder.
        const files = tracked(dir);
        const missing = files.filter((name) => !(descriptionKey(name) in catalog));
        expect(missing).toEqual([]);
        expect(descriptionKey(LOCAL_NAME) in catalog).toBe(true);
        expect(descriptionKey(HUB_FILE) in catalog).toBe(true);
        const described = Object.keys(catalog)
            .filter((key) => key.startsWith(DESC_PREFIX))
            .sort();
        expect(described).toEqual(
            [...new Set([...files, HUB_FILE].map((name) => descriptionKey(name)))].sort()
        );
    });

    it("keys every catalogue group but the float's by the rail page it holds, in rail order, System after Help", () => {
        const { config } = loadConfig(engineDir());
        const groups = readGroups(config);
        const rail = config.rail as { label: string; page: string }[];
        expect(Object.keys(config.nav_groups as Record<string, unknown>)).toEqual(['float']);
        const pages = groups.map((group) => group.id).filter((key) => key !== 'float');
        expect(pages).toEqual(rail.map((entry) => entry.page));
        expect(groups.filter((group) => group.id !== 'float').map((group) => group.label)).toEqual(
            rail.map((entry) => entry.label)
        );
        expect(pages.indexOf('views')).toBe(pages.indexOf('help') + 1);
        expect(pages).not.toContain('info');
        expect(config.arrangements).not.toHaveProperty('info');
        expect(config.arrangements).toHaveProperty('help');
    });

    it('keeps view lists out of every navigation group', () => {
        const { config } = loadConfig(engineDir());
        const groups = Object.values(config.nav_groups as Record<string, Record<string, unknown>>);
        for (const group of groups) expect(group).not.toHaveProperty('keys');
    });

    it('uses glyph names for every configured icon', () => {
        const { config } = loadConfig(engineDir(), { hub: DEMO_HUB });
        const glyphs = glyphCatalog(config);
        const icons = ['stages', 'forms', 'chips', 'statuses'].flatMap((list) =>
            Object.values((config[list] ?? {}) as Record<string, { icon?: string }>).flatMap(
                (entry) => (entry.icon === undefined ? [] : [entry.icon])
            )
        );
        expect(icons.length).toBeGreaterThan(0);
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

    /** Every view oculus's config registers: the modules', the collections' and the boards'. */
    function registerOculus(config: Record<string, unknown>): void {
        registerAll(client.registry);
        const collections = collectionViews(config, unplacedGroup(config));
        registerCollections(client.registry, collections);
        const source = boardsSource(config, () => 'layout.yml');
        registerBoards(client.registry, pageBoards(source, textCatalog(config), collections));
    }

    it('gives every group a chord and a glyph, and no letter a key the workbench binds', async () => {
        const { config } = loadConfig(engineDir());
        registerOculus(config);
        const groups: NavGroup[] = readGroups(config);
        const sections = arrange(
            views().filter((view) => view.listed !== false),
            groups,
            config.docs as DocEntry[]
        );
        // Every group names a letter, so each is reached by a chord of its own whatever its size,
        // and its catalogue heading carries a mark of its own.
        expect(sections.filter((section) => !isChorded(section))).toEqual([]);
        expect(sections.filter((section) => section.glyph === undefined)).toEqual([]);
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
        const { initialKeyState, resolveKey } =
            await import('../../../src/lib/data/helpers/keys/oculus/resolve.ts');
        const bound = letters.filter((letter) => {
            const answer = resolveKey(
                { key: letter },
                { chords: {} },
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
        registerOculus(config);
        const groups = new Set(readGroups(config).map((group) => group.id));
        const invalid = views()
            .filter((view) => view.listed !== false)
            .filter((view) => !groups.has(view.group) || view.order < 0);
        expect(invalid.map((view) => view.id)).toEqual([]);
    });

    // The document entries are read with a hub's own settings file, `<hub>/.oculus/config.yml`,
    // over the engine's: the demo hub's always, and the real hub's when OCULUS_TEST_HUB names one
    // (tests/fixtures/hubs/real-hub.ts), the cases over it failing when the variable names no hub.
    const REAL = realHub();
    if (!REAL.asked) console.warn(skipLine('config-folder'));

    /** The checks of the document entries of a hub's merged config. */
    function checkDocs(hub: string): void {
        const { config } = loadConfig(engineDir(), { hub });
        const groups = readGroups(config).map((group) => group.id);
        const docs = config.docs as { label: string; path: string; group: string }[];
        expect(docs.length).toBeGreaterThan(0);
        for (const entry of docs) {
            expect(groups).toContain(entry.group);
            expect(entry.path.startsWith('/')).toBe(false);
            expect(entry.path.includes('..')).toBe(false);
            expect(entry.path.endsWith('.md')).toBe(true);
            expect(entry.label.length).toBeGreaterThan(0);
        }
    }

    it('names a group of its own and a path under the hub for every document of the demo hub', () => {
        checkDocs(DEMO_HUB);
    });

    it.skipIf(!REAL.asked)(
        realHubName(
            'names a group of its own and a path under the hub for every document of the real hub',
            REAL
        ),
        () => {
            checkDocs(hubOf(REAL));
        }
    );

    // Every YAML file of the folder is matched to a schema generated from the catalogs, and the
    // files oculus ships pass it, both under a workspace folder that is oculus's config folder and
    // under one that is oculus's own repository holding it as config/. The schemas list the
    // registries' keys, so the portfolio is the demo hub's.
    it('passes every config file through the schema it is matched to', () => {
        const { config } = loadConfig(engineDir(), { hub: DEMO_HUB });
        const portfolio = portfolioConfigFrom(config);
        const checker = createChecker();
        const dir = join(engineDir(), 'config');
        const held = [
            { root: 'config', path: '' },
            { root: 'oculus', path: 'config' }
        ];
        const { schemas } = buildOneHub(DEMO_HUB, portfolio, 1, [], checker, { dir, held }, 'hub');
        const unmatched: string[] = [];
        const problems: string[] = [];
        for (const rel of tracked(dir)) {
            const engine = schemaFor(schemas, 'config', rel);
            const repository = schemaFor(schemas, 'oculus', `config/${rel}`);
            if (engine === undefined || engine !== repository) {
                unmatched.push(rel);
                continue;
            }
            const text = readFileSync(join(dir, rel), 'utf8');
            const found = checkDocument(
                { name: engine, file: rel, text },
                schemas.texts,
                checker,
                portfolio.text
            );
            problems.push(...found.map((one) => `${rel}:${one.line ?? 0} ${one.message}`));
        }
        expect(unmatched).toEqual([]);
        expect(problems).toEqual([]);
    });

    it('describes every flag of stages, forms, chips, statuses, lead_statuses and tiers and every key of a roles and categories row in the schema of vocab.yml', () => {
        const { config } = loadConfig(engineDir(), { hub: DEMO_HUB });
        const portfolio = portfolioConfigFrom(config);
        const dir = join(engineDir(), 'config');
        const { schemas } = buildOneHub(
            DEMO_HUB,
            portfolio,
            1,
            [],
            createChecker(),
            { dir, held: [{ root: 'config', path: '' }] },
            'hub'
        );
        const name = schemaFor(schemas, 'config', 'catalogs/vocab.yml');
        const schema = JSON.parse(name === undefined ? '{}' : schemas.texts[name]) as {
            properties?: Partial<Record<string, { additionalProperties?: Row; items?: Row }>>;
        };
        type Row = { properties?: Record<string, { description?: string }> };
        const vocab = schema.properties ?? {};
        const rows: [string, Row | undefined][] = [
            ['stages', vocab.stages?.additionalProperties],
            ['forms', vocab.forms?.additionalProperties],
            ['chips', vocab.chips?.additionalProperties],
            ['statuses', vocab.statuses?.additionalProperties],
            ['lead_statuses', vocab.lead_statuses?.additionalProperties],
            ['tiers', vocab.tiers?.additionalProperties],
            ['roles', vocab.roles?.items],
            ['categories', vocab.categories?.items]
        ];
        /** The words a row is drawn with, which are no flags. */
        const drawn = new Set(['label', 'icon', 'color']);
        const keys = rows.flatMap(([key, row]) =>
            Object.entries(row?.properties ?? {})
                .filter(([field]) => !drawn.has(field))
                .map(([field, one]) => ({ key: `${key}.${field}`, help: one.description ?? '' }))
        );
        // 12 stage flags, no form flag, 1 chip flag, 8 status flags, 4 lead status flags, 2 tier
        // flags (`unmarked`, `default`), the 3 keys of a roles row and the 6 keys of a categories
        // row.
        expect(keys).toHaveLength(36);
        expect(keys.filter((one) => one.help.trim() === '').map((one) => one.key)).toEqual([]);
    });

    /**
     * What is wrong with a hub's own files `.oculus/config.yml`, `.oculus/bookmarks.yml` and
     * `.oculus/workspaces/*.yml`: each one no schema matches, and each finding of the schema that
     * does, as `<path>:<line> <message>`.
     */
    function hubFileProblems(hub: string, files: Record<string, string> = {}): string[] {
        const { config } = loadConfig(engineDir(), { hub });
        const portfolio = portfolioConfigFrom(config);
        const checker = createChecker();
        // The set the server serves: the build's, with the schemas of the files its readers own.
        const schemas = withOwnSchemas(
            buildOneHub(hub, portfolio, 1, [], checker, null, 'hub').schemas
        );
        const held = join(hub, '.oculus', 'workspaces');
        const rels = [
            HUB_FILE,
            '.oculus/bookmarks.yml',
            ...(existsSync(held)
                ? readdirSync(held).map((name) => `.oculus/workspaces/${name}`)
                : [])
        ].filter((rel) => existsSync(join(hub, rel)));
        expect(rels).toContain(HUB_FILE);
        const problems: string[] = [];
        for (const rel of rels) {
            const name = schemaFor(schemas, 'hub', rel);
            if (name === undefined) {
                problems.push(`${rel} has no schema`);
                continue;
            }
            const text = files[rel] ?? readFileSync(join(hub, rel), 'utf8');
            const found = checkDocument(
                { name, file: rel, text },
                schemas.texts,
                checker,
                portfolio.text
            );
            problems.push(...found.map((one) => `${rel}:${one.line ?? 0} ${one.message}`));
        }
        return problems;
    }

    /**
     * A hub as Make Folder a Hub... writes it, with every collection the templates page offers, the
     * bookmarks file the Files view writes on its first bookmark and a workspace file of the shape
     * the workspace reader takes.
     */
    function scratchHub(): string {
        const hub = mkdtempSync(join(tmpdir(), 'oculus-hub-files-'));
        const page = readFileSync(join(engineDir(), TEMPLATES_PAGE), 'utf8');
        const chosen = collectionTemplates(page);
        const written: [string, string][] = [
            [HUB_FILE, hubConfigText(page, chosen)],
            ...chosen.map((one): [string, string] => [one.file, one.body]),
            [
                '.oculus/workspaces/scratch.yml',
                'folders:\n  - { name: scratch, path: ~/scratch }\nprimary: scratch\n'
            ]
        ];
        for (const [rel, text] of written) {
            mkdirSync(dirname(join(hub, rel)), { recursive: true });
            writeFileSync(join(hub, rel), text);
        }
        ensureBookmarksFile(join(hub, '.oculus', 'bookmarks.yml'));
        return hub;
    }

    it("matches the hub's own files of a scratch hub to a schema each, read with no finding", () => {
        const hub = scratchHub();
        try {
            expect(hubFileProblems(hub)).toEqual([]);
        } finally {
            rmSync(hub, { recursive: true, force: true });
        }
    });

    it('reads a key of .oculus/config.yml outside the hub list as not declared', () => {
        const hub = scratchHub();
        try {
            const text = `${readFileSync(join(hub, HUB_FILE), 'utf8')}\nwallpaperz: x\n`;
            const found = hubFileProblems(hub, { [HUB_FILE]: text });
            expect(found).toHaveLength(1);
            expect(found[0]).toContain('wallpaperz');
        } finally {
            rmSync(hub, { recursive: true, force: true });
        }
    });

    it.skipIf(!REAL.asked)(
        realHubName(
            "matches the real hub's own files to a schema each, read with no finding",
            REAL
        ),
        () => {
            expect(hubFileProblems(hubOf(REAL))).toEqual([]);
        }
    );

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
        for (const name of [...OPTION_FILES, ...OPTION_SUBFILES]) {
            const parsed = parse(readFileSync(join(dir, name), 'utf8')) as Record<string, unknown>;
            expect(Object.keys(parsed).sort(), name).toEqual(['groups', 'options']);
        }
        for (const key of OPTION_KEYS) expect(seen[key]).toBe(undefined);
        expect(tracked(dir)).toEqual([...Object.keys(EXPECTED), ...OPTION_FILES].sort());
    });
});
