// Layer 4, tree check. The test that reads a whole hub, read only. It opens hub files for reading
// and writes none, which is the exception the standing spec grants. Its last `describe`, the count
// of written equations, reads no hub data: it plants a deck in a temporary directory.
//
// It is the gate: the model validates against a hub with zero findings. Its cases
// run over two hubs. The demo hub of tests/fixtures/hubs/demo/ is always there, so the cases that
// check oculus's own code never skip. The real hub is the folder OCULUS_TEST_HUB names
// (tests/fixtures/hubs/real-hub.ts): unset, its cases skip and the file prints one line naming the
// variable; set to a folder that is no hub, they fail naming the variable and the folder. A
// finding a case reports is reported, never repaired here: the fix belongs in the hub's YAML or in
// the check, and this file is neither.
//
// The counts are derived here rather than pinned. A pinned 91 fails the day a project is added,
// which says nothing about the model; what matters is that the snapshot holds what the tree holds.
// So the tree is counted a second way, without the code under test: a plain recursive walk for the
// manifests, yaml.parse for each registry's entry list, and the collections config for the rest.

import { globSync, readFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { parse } from 'yaml';
import { describe, expect } from 'vitest';
import { hubDomainsOf, portfolioConfigFrom } from '../../../src/lib/data/index.ts';
import { buildOneHub } from '../../fixtures/hubs/hub-build.ts';
import { tex } from '../../../src/lib/views/academic/present/markup.ts';
import { ENTITY_KINDS } from '../../../src/lib/data/snapshot/normalise.ts';
import { engineDir, loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';
import { isMap } from '../../../src/lib/data/helpers/guards.ts';
import { DEMO_HUB, hubOf, realHub, realHubName, skipLine } from '../../fixtures/hubs/real-hub.ts';
import { it, plantScratch } from '../../fixtures/scratch.ts';
import { createReader } from '../../../src/lib/data/sources/deck/read.ts';
import type { DeckProject } from '../../../src/lib/data/sources/deck/kinds.ts';
import type {
    Deck,
    PortfolioConfig,
    Project,
    Snapshot
} from '../../../src/lib/data/model/index.ts';

/**
 * How many projects of the real hub carry a deck of their own, and how many of its slides write
 * an `equation:`. Each is a floor rather than a count: a deck or a slide written for one more
 * project is not a reason for this file to fail, and the reader losing the ones there are is.
 */
const REAL_FLOORS: Floors = { decks: 14, equations: 13 };

/** The same floors for the demo hub: one project deck, whose one slide writes an equation. */
const DEMO_FLOORS: Floors = { decks: 1, equations: 1 };

/** The floors a hub's decks are held to. */
type Floors = { decks: number; equations: number };

const engine = engineDir();
const REAL = realHub();
if (!REAL.asked) console.warn(skipLine('integrity'));

/** A hub as the cases read it: its folder, its merged config and its portfolio config. */
type HubRead = { hub: string; merged: Record<string, unknown>; config: PortfolioConfig };

/** The configuration of a hub, read with the hub's own settings file over the engine's. */
function readHub(hub: string): HubRead {
    const merged = loadConfig(engine, { hub }).config;
    return { hub, merged, config: portfolioConfigFrom(merged) };
}

/**
 * How many equations one slide file writes, counted from its parsed front matter without the
 * reader under test: the file is cut at every line holding only `---` and each piece that parses
 * as a map with an `equation:` that is text and not blank after trimming counts once.
 */
function writtenEquations(text: string): number {
    return text.split(/^---[ \t]*$/m).filter((piece) => {
        let front: unknown;
        try {
            front = parse(piece);
        } catch {
            return false;
        }
        return isMap(front) && typeof front.equation === 'string' && front.equation.trim() !== '';
    }).length;
}

/** What the deck reader needs of a project of the snapshot. */
function deckProjects(projects: Project[]): DeckProject[] {
    return projects.map((project) => ({
        id: project.id,
        file: project.file,
        folder: project.folder,
        tier: project.tier,
        type: project.type,
        chips: project.chips,
        short: project.short ?? '',
        title: project.title
    }));
}

/**
 * A deck of the hub, a project's `present/` folder or the portfolio deck, read as the route does.
 */
function readDeck(read: HubRead, projects: Project[], folder: string): Deck {
    const root = { key: 'hub', dir: read.hub };
    return createReader({
        hub: root,
        projects: deckProjects(projects),
        domains: Object.keys(hubDomainsOf(read.hub, read.config)),
        tagTones: read.config.tagTones,
        catalog: textCatalog(read.merged)
    }).read(root, folder);
}

/** The equations a deck draws: those of its project slides and of its equation slides. */
function drawnEquations(deck: Deck): string[] {
    return deck.slides.flatMap((slide) => {
        if (slide.kind === 'project')
            return slide.slide.equation === undefined ? [] : [slide.slide.equation];
        return slide.kind === 'equation' ? [slide.equation] : [];
    });
}

/** Folders a project.yml never sits under: a project's own code deposit and its attic. */
const NEVER_DESCEND = ['code', 'attic'];

/** The registries, and the key each file's entry list is under. */
const REGISTRY_LISTS: Record<string, string> = {
    venues: 'entries',
    datasets: 'datasets',
    pillars: 'entries',
    domains: 'entries',
    funding: 'entries',
    people: 'entries',
    organisations: 'entries',
    resources: 'entries'
};

/**
 * Every folder under `dir` that holds a `project.yml` or a `.oculus/project.yml`, at any depth,
 * found by walking the tree and nothing else, relative to `dir`.
 */
function manifestFolders(dir: string): string[] {
    const files = globSync(['**/project.yml', '**/.oculus/project.yml'], {
        cwd: dir,
        exclude: NEVER_DESCEND.map((name) => `**/${name}`)
    });
    const folders = files.map((file) => dirname(file).replace(/(?:^|\/)\.oculus$/, ''));
    return [...new Set(folders)];
}

/** The length of one registry file's entry list, read straight out of the YAML. */
function countEntries(hub: string, relative: string, listKey: string): number {
    const parsed: unknown = parse(readFileSync(join(hub, relative), 'utf8'));
    const list = (parsed as Record<string, unknown>)[listKey];
    return Array.isArray(list) ? list.length : -1;
}

/** The scan folder whose projects carry the tier `personal`. */
const PERSONAL_DIR = 'side-projects';

/** The name of every project folder under the personal folder, at any depth, sorted. */
function countedPersonal(hub: string): string[] {
    return manifestFolders(join(hub, PERSONAL_DIR))
        .map((folder) => basename(folder))
        .sort();
}

function derivedCounts(read: HubRead): Record<string, number> {
    const { hub, config } = read;
    const counts: Record<string, number> = { projects: 0 };
    for (const rule of config.scan) counts.projects += manifestFolders(join(hub, rule.dir)).length;
    for (const [name, listKey] of Object.entries(REGISTRY_LISTS)) {
        counts[name] = countEntries(
            hub,
            config.registries[name as keyof typeof config.registries],
            listKey
        );
    }
    // The three editable registry files are collections beside their entity maps; every configured
    // collection therefore reaches the snapshot, including funding and those three registries.
    counts.collections = config.collections.length;
    return counts;
}

/** A hub read and built once, on the first case that asks for it. */
type Built = { read: HubRead; snapshot: Snapshot; projects: Project[] };

/** The read and build of a hub, made on the first call and kept for the cases after it. */
function builder(readOf: () => HubRead): () => Built {
    let built: Built | null = null;
    return () => {
        if (built !== null) return built;
        const read = readOf();
        const snapshot = buildOneHub(read.hub, read.config).snapshot;
        built = { read, snapshot, projects: Object.values(snapshot.entities.projects) };
        return built;
    };
}

/** The cases every hub passes, over the hub `readOf` gives, its decks held to `floors`. */
function hubCases(readOf: () => HubRead, floors: Floors): void {
    const built = builder(readOf);

    it('validates with no findings', () => {
        expect(built().snapshot.findings).toEqual([]);
    });

    it('holds exactly what a second count of the tree finds', () => {
        const { read, snapshot } = built();
        const held: Record<string, number> = {};
        for (const [kind, entities] of Object.entries(snapshot.entities)) {
            if (!ENTITY_KINDS.includes(kind)) continue;
            held[kind] = Object.keys(entities as object).length;
        }
        const counts = derivedCounts(read);
        console.log(`integrity: derived counts ${JSON.stringify(counts)}`);
        expect(held).toEqual(counts);
    });

    it('survives JSON.stringify and JSON.parse unchanged', () => {
        const { snapshot } = built();
        expect(JSON.parse(JSON.stringify(snapshot))).toStrictEqual(snapshot);
    });

    it('reads a deck out of every project that has a present/ folder, with no finding', () => {
        const { read, projects } = built();
        const withDecks = projects.filter((project) => project.deck !== undefined);
        expect(withDecks.length).toBeGreaterThanOrEqual(floors.decks);
        for (const project of withDecks) {
            const deck = readDeck(read, projects, `${project.folder}/present`);
            expect(deck.state, project.id).toBe('ok');
            expect(deck.findings, project.id).toEqual([]);
            expect(deck.slides.length, project.id).toBeGreaterThan(0);
        }
    });

    it('reads an equation out of every slide that writes one, as LaTeX that typesets', () => {
        const { read, projects } = built();
        const withDecks = projects.filter((project) => project.deck !== undefined);
        const equations = withDecks.flatMap((project) =>
            drawnEquations(readDeck(read, projects, `${project.folder}/present`)).map(
                (equation) => ({ id: project.id, equation })
            )
        );
        // The second count: the equations the front matter of each slide file writes, parsed
        // without the reader under test.
        const written = withDecks.flatMap((project) => {
            const folder = join(read.hub, project.folder, 'present');
            return globSync('*.md', { cwd: folder }).map((file) =>
                writtenEquations(readFileSync(join(folder, file), 'utf8'))
            );
        });
        expect(equations.length).toBeGreaterThanOrEqual(floors.equations);
        expect(equations.length).toBe(written.reduce((sum, one) => sum + one, 0));
        for (const { id, equation } of equations) {
            expect(equation, id).not.toMatch(/\.(?:png|jpe?g|svg|webp)\s*$/i);
            expect(tex(equation, true), id).not.toContain('katex-error');
        }
    });

    it('reads the portfolio deck with every named deck found', () => {
        const { read, projects } = built();
        const deck = readDeck(read, projects, read.config.portfolioDeck ?? '');
        expect(deck.state).toBe('ok');
        expect(deck.findings).toEqual([]);
        expect(deck.groups.length).toBeGreaterThan(0);
        for (const group of deck.groups) expect(group.missing, group.name).toEqual([]);
    });
}

describe('the demo hub', () => {
    hubCases(() => readHub(DEMO_HUB), DEMO_FLOORS);
});

describe.skipIf(!REAL.asked)(realHubName('the real hub', REAL), () => {
    const readOf = () => readHub(hubOf(REAL));
    hubCases(readOf, REAL_FLOORS);

    it('reads every project of the personal folder with no finding, each with the tier personal', () => {
        const read = readOf();
        const snapshot = buildOneHub(read.hub, read.config).snapshot;
        const folders = countedPersonal(read.hub);
        expect(folders.length).toBeGreaterThanOrEqual(3);
        const projects = Object.values(snapshot.entities.projects);
        const personal = projects.filter((project) => project.tier === 'personal');
        expect(personal.map((project) => project.id).sort()).toEqual(folders);
        for (const one of personal) {
            expect(one.title).not.toBe('');
            expect(['idea', 'active', 'finished']).toContain(one.type);
        }
        expect(snapshot.findings.filter((finding) => finding.file.includes(PERSONAL_DIR))).toEqual(
            []
        );
    });
});

// The count above is only as good as its agreement with the reader on the shapes a file can take,
// which neither hub holds: several slides in one file, a blank `equation:`, and a value that is
// not text. This runs both on a planted deck in a temporary directory.
describe('the count of written equations', () => {
    it('agrees with the reader on several slides, a blank equation and a value that is not text', () => {
        const text = [
            '---',
            'kind: project',
            "equation: '\\min_{x} f(x)'",
            '---',
            '---',
            'kind: project',
            "equation: '\\frac{a}{b}'",
            '---',
            '---',
            'kind: project',
            "equation: '   '",
            '---',
            '---',
            'kind: project',
            'equation: 3',
            '---',
            '---',
            'kind: project',
            "equation: ''",
            '---',
            ''
        ].join('\n');
        const hub = plantScratch('oculus-integrity-', {
            'projects/active/alpha/present/present.yml': 'order: [main.md]\n',
            'projects/active/alpha/present/main.md': text
        });
        const root = { key: 'hub', dir: hub };
        const deck = createReader({
            hub: root,
            projects: [],
            domains: [],
            tagTones: {},
            catalog: textCatalog(loadConfig(engine).config)
        }).read(root, 'projects/active/alpha/present');
        const drawn = drawnEquations(deck).length;
        expect(drawn).toBe(2);
        expect(writtenEquations(text)).toBe(2);
    });
});
