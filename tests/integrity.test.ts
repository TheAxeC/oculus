// The one test that reads the real hub, read only. It opens files for reading and writes nothing,
// which is the exception the standing spec grants; every other test uses synthetic fixtures in a
// temporary directory.
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

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';
import { buildPortfolio, portfolioConfigFrom } from '../src/lib/data/index.ts';
import { ENTITY_KINDS } from '../src/lib/data/normalise.ts';
import { engineDir, loadConfig, loadLocal } from '../src/lib/data/sources/config.ts';
import { isMap } from '../src/lib/data/guards.ts';

/**
 * How many projects of the hub carry a PRESENT.md front matter. It is a floor rather than a count:
 * a slide written for one more project is not a reason for this file to fail, and the reader losing
 * the ones there are is.
 */
const FILES_WITH_SLIDES = 14;

const engine = engineDir();
const hub = loadLocal(engine).hub;
const present = existsSync(hub);
if (!present) {
    console.warn(`integrity: skipped, the hub ${hub} does not exist on this machine`);
}

const merged = loadConfig(engine).config;
const config = portfolioConfigFrom(merged, engine);

/** Folders a project.yml never sits under: a project's own code deposit and its attic. */
const NEVER_DESCEND = ['code', 'attic'];

/** The registries, and the key each file's entry list is under. */
const REGISTRY_LISTS: Record<string, string> = {
    venues: 'entries',
    datasets: 'datasets',
    programs: 'entries',
    domains: 'entries',
    funding: 'entries'
};

/** Every project.yml under `dir`, at any depth, counted by walking the tree and nothing else. */
function countManifests(dir: string): number {
    let entries;
    try {
        entries = readdirSync(dir, { withFileTypes: true });
    } catch {
        return 0;
    }
    let found = 0;
    for (const entry of entries) {
        if (entry.name.startsWith('.')) continue;
        if (entry.isFile() && entry.name === 'project.yml') found += 1;
        if (entry.isDirectory() && !NEVER_DESCEND.includes(entry.name)) {
            found += countManifests(join(dir, entry.name));
        }
    }
    return found;
}

/** The length of one registry file's entry list, read straight out of the YAML. */
function countEntries(relative: string, listKey: string): number {
    const parsed: unknown = parse(readFileSync(join(hub, relative), 'utf8'));
    const list = (parsed as Record<string, unknown>)[listKey];
    return Array.isArray(list) ? list.length : -1;
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
    const snapshot = present ? buildPortfolio(hub, config) : null;
    const counts = present ? derivedCounts() : {};

    it('validates with no findings', () => {
        expect(snapshot?.findings).toEqual([]);
    });

    it('reads the config with no findings', () => {
        expect(loadConfig(engine).findings).toEqual([]);
    });

    it('names the nine lanes and the holding backlog as what a focus may be', () => {
        expect(config.vocab.lanes).toEqual([
            'run',
            'push',
            'revise',
            'review',
            'blocked',
            'backburner',
            'scope',
            'derisk',
            'build',
            'holding'
        ]);
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

    it('survives JSON.stringify and JSON.parse unchanged', () => {
        expect(JSON.parse(JSON.stringify(snapshot))).toStrictEqual(snapshot);
    });

    it('reads a front-matter slide out of every PRESENT.md that declares one', () => {
        const projects = Object.values(snapshot?.entities.projects ?? {});
        // A slide made from front matter carries no body; a narrative-only file's one slide does.
        const withSlides = projects.filter((project) =>
            (project.present ?? []).some((slide) => slide.body === undefined)
        );
        expect(withSlides.length).toBeGreaterThanOrEqual(FILES_WITH_SLIDES);
    });

    it('reads the covert-theory slide with its diagram panel and its equation', () => {
        const slides = snapshot?.entities.projects['covert-theory']?.present ?? [];
        expect(slides).toHaveLength(1);
        expect(slides[0].id).toBe('covert-theory');
        expect(slides[0].equation).toBeDefined();
        expect(slides[0].panels.some((panel) => panel.diagramHtml !== undefined)).toBe(true);
        expect(slides[0].method.length).toBeGreaterThan(0);
        expect(slides[0].results.length).toBeGreaterThan(0);
    });

    it('resolves every project entry of the shipped deck order to a slide of this hub', () => {
        const ids = new Set(
            Object.values(snapshot?.entities.projects ?? {}).flatMap((project) =>
                (project.present ?? []).map((slide) => slide.id)
            )
        );
        const deck = merged.deck;
        const order = isMap(deck) && Array.isArray(deck.order) ? deck.order : [];
        const refs = order
            .filter((entry): entry is Record<string, unknown> => isMap(entry))
            .filter((entry) => entry.slide === 'project')
            .map((entry) => String(entry.ref));
        expect(refs.length).toBeGreaterThan(0);
        expect(refs.filter((ref) => !ids.has(ref))).toEqual([]);
    });
});
