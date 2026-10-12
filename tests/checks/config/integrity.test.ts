// Layer 4, tree check. The one test that reads the real hub, read only. It opens hub files for
// reading and writes none, which is the exception the standing spec grants. Its last `describe`,
// the count of written equations, reads no hub data: it plants a deck in a temporary directory.
//
// It is the gate DESIGN.md names: the model validates against the real hub with zero findings. A
// finding it reports is reported, never repaired here: the fix belongs in the hub's YAML or in the
// check, and this file is neither. When the hub path does not exist the whole file skips and says
// why on stderr, so a machine without the hub gets a stated skip rather than a silent pass.
//
// The counts are derived here rather than pinned. A pinned 91 fails the day a project is added,
// which says nothing about the model; what matters is that the snapshot holds what the tree holds.
// So the tree is counted a second way, without the code under test: a plain recursive walk for the
// manifests, yaml.parse for each registry's entry list, and the collections config for the rest.

import { globSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { describe, expect } from 'vitest';
import { buildPortfolioWithSchemas, portfolioConfigFrom } from '../../../src/lib/data/index.ts';
import { tex } from '../../../src/lib/views/academic/present/markup.ts';
import { ENTITY_KINDS } from '../../../src/lib/data/snapshot/normalise.ts';
import { engineDir, loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';
import { isMap } from '../../../src/lib/data/helpers/guards.ts';
import { realHub } from '../../fixtures/hubs/real-hub.ts';
import { it, plantScratch } from '../../fixtures/scratch.ts';
import { createReader } from '../../../src/lib/data/sources/deck/read.ts';
import type { DeckProject } from '../../../src/lib/data/sources/deck/kinds.ts';
import type { Deck, Project } from '../../../src/lib/data/model/index.ts';

/**
 * How many projects of the hub carry a deck of their own. It is a floor rather than a count: a deck
 * written for one more project is not a reason for this file to fail, and the reader losing the
 * ones there are is.
 */
const PROJECT_DECKS = 14;

/**
 * How many slides of the hub write an `equation:`. Like the floor above, a slide written for one
 * more project is no reason for this file to fail; the slide losing its equation is.
 */
const SLIDES_WITH_EQUATION = 13;

const engine = engineDir();
const { hub, present } = realHub(engine);
if (!present) {
    console.warn(
        `integrity: skipped, ${hub} carries no hub data (not on this machine, or a sparse checkout)`
    );
}

const merged = loadConfig(engine, { hub }).config;
const config = portfolioConfigFrom(merged);

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

/** The deck of a project folder, read as the deck route reads it. */
function readProjectDeck(projects: Project[], folder: string): Deck {
    const root = { key: 'hub', dir: hub };
    return createReader({
        hub: root,
        projects: deckProjects(projects),
        domains: config.domains,
        tagTones: config.tagTones,
        catalog: textCatalog(merged)
    }).read(root, `${folder}/present`);
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

/** Every project.yml under `dir`, at any depth, counted by walking the tree and nothing else. */
function countManifests(dir: string): number {
    return globSync('**/project.yml', {
        cwd: dir,
        exclude: NEVER_DESCEND.map((name) => `**/${name}`)
    }).length;
}

/** The length of one registry file's entry list, read straight out of the YAML. */
function countEntries(relative: string, listKey: string): number {
    const parsed: unknown = parse(readFileSync(join(hub, relative), 'utf8'));
    const list = (parsed as Record<string, unknown>)[listKey];
    return Array.isArray(list) ? list.length : -1;
}

/** The scan folder whose projects carry the tier `personal`. */
const PERSONAL_DIR = 'side-projects';

/** The folder name of every project.yml under the personal folder, at any depth, sorted. */
function countedPersonal(): string[] {
    return globSync('**/project.yml', {
        cwd: join(hub, PERSONAL_DIR),
        exclude: NEVER_DESCEND.map((name) => `**/${name}`)
    })
        .map((file) => file.split('/').at(-2) ?? '')
        .sort();
}

function derivedCounts(): Record<string, number> {
    const counts: Record<string, number> = { projects: 0 };
    for (const rule of config.scan) counts.projects += countManifests(join(hub, rule.dir));
    for (const [name, listKey] of Object.entries(REGISTRY_LISTS)) {
        counts[name] = countEntries(
            config.registries[name as keyof typeof config.registries],
            listKey
        );
    }
    // The three editable registry files are collections beside their entity maps; every configured
    // collection therefore reaches the snapshot, including funding and those three registries.
    counts.collections = config.collections.length;
    return counts;
}

describe.skipIf(!present)('the real hub', () => {
    const snapshot = present ? buildPortfolioWithSchemas(hub, config).snapshot : null;
    const counts = present ? derivedCounts() : {};

    it('validates with no findings', () => {
        expect(snapshot?.findings).toEqual([]);
    });

    it('holds exactly what a second count of the tree finds', () => {
        const held: Record<string, number> = {};
        for (const [kind, entities] of Object.entries(snapshot?.entities ?? {})) {
            if (!ENTITY_KINDS.includes(kind)) continue;
            held[kind] = Object.keys(entities as object).length;
        }
        console.log(`integrity: derived counts ${JSON.stringify(counts)}`);
        expect(held).toEqual(counts);
    });

    it('reads every project of the personal folder with no finding, each with the tier personal', () => {
        const folders = countedPersonal();
        expect(folders.length).toBeGreaterThanOrEqual(3);
        const projects = Object.values(snapshot?.entities.projects ?? {});
        const personal = projects.filter((project) => project.tier === 'personal');
        expect(personal.map((project) => project.id).sort()).toEqual(folders);
        for (const one of personal) {
            expect(one.title).not.toBe('');
            expect(['idea', 'active']).toContain(one.type);
        }
        expect(snapshot?.findings.filter((finding) => finding.file.includes(PERSONAL_DIR))).toEqual(
            []
        );
    });

    it('survives JSON.stringify and JSON.parse unchanged', () => {
        expect(JSON.parse(JSON.stringify(snapshot))).toStrictEqual(snapshot);
    });

    it('reads a deck out of every project that has a present/ folder, with no finding', () => {
        const projects = Object.values(snapshot?.entities.projects ?? {});
        const withDecks = projects.filter((project) => project.deck !== undefined);
        expect(withDecks.length).toBeGreaterThanOrEqual(PROJECT_DECKS);
        for (const project of withDecks) {
            const deck = readProjectDeck(projects, project.folder);
            expect(deck.state, project.id).toBe('ok');
            expect(deck.findings, project.id).toEqual([]);
            expect(deck.slides.length, project.id).toBeGreaterThan(0);
        }
    });

    it('reads an equation out of every slide that writes one, as LaTeX that typesets', () => {
        const projects = Object.values(snapshot?.entities.projects ?? {});
        const withDecks = projects.filter((project) => project.deck !== undefined);
        const equations = withDecks.flatMap((project) =>
            drawnEquations(readProjectDeck(projects, project.folder)).map((equation) => ({
                id: project.id,
                equation
            }))
        );
        // The second count: the equations the front matter of each slide file writes, parsed
        // without the reader under test.
        const written = withDecks.flatMap((project) =>
            globSync('*.md', { cwd: join(hub, project.folder, 'present') }).map((file) =>
                writtenEquations(readFileSync(join(hub, project.folder, 'present', file), 'utf8'))
            )
        );
        expect(equations.length).toBeGreaterThanOrEqual(SLIDES_WITH_EQUATION);
        expect(equations.length).toBe(written.reduce((sum, one) => sum + one, 0));
        for (const { id, equation } of equations) {
            expect(equation, id).not.toMatch(/\.(?:png|jpe?g|svg|webp)\s*$/i);
            expect(tex(equation, true), id).not.toContain('katex-error');
        }
    });

    it('reads the portfolio deck with every named deck found', () => {
        const projects = Object.values(snapshot?.entities.projects ?? {});
        const root = { key: 'hub', dir: hub };
        const deck = createReader({
            hub: root,
            projects: deckProjects(projects),
            domains: config.domains,
            tagTones: config.tagTones,
            catalog: textCatalog(merged)
        }).read(root, config.portfolioDeck ?? '');
        expect(deck.state).toBe('ok');
        expect(deck.findings).toEqual([]);
        expect(deck.groups.length).toBeGreaterThan(0);
        for (const group of deck.groups) expect(group.missing, group.name).toEqual([]);
    });
});

// The count above is only as good as its agreement with the reader on the shapes a file can take,
// which the hub does not hold today: several slides in one file, a blank `equation:`, and a value
// that is not text. This runs both on a planted deck in a temporary directory.
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
            catalog: textCatalog(merged)
        }).read(root, 'projects/active/alpha/present');
        const drawn = drawnEquations(deck).length;
        expect(drawn).toBe(2);
        expect(writtenEquations(text)).toBe(2);
    });
});
