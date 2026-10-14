// Layer 4, test helper. A small hub planted in a scratch directory for the reference index and the
// rename of a hub key: one file of each kind that names a key or defines one, and an engine folder
// holding the two configuration files the index reads (`behavior.yml` and `catalogs/vocab.yml`).
// The texts are synthetic; none of them is a file of the hub.

import { buildPortfolioWithSchemas, portfolioConfigFrom } from '../../../src/lib/data/index.ts';
import { engineDir, loadConfig } from '../../../src/lib/data/sources/config.ts';
import {
    graphOf,
    hitAt,
    overlay,
    scanOf,
    type Graph,
    type Hit
} from '../../../src/lib/data/snapshot/references/lookup.ts';
import type { FileScan, ReferenceIndex } from '../../../src/lib/data/snapshot/references/model.ts';
import { plantScratch } from '../../fixtures/scratch.ts';
import { join } from 'node:path';

/**
 * The names the planted workspace gives its two folders: the hub and the folder of oculus's config.
 */
const HUB_FOLDER = 'hub';
const CONFIG_FOLDER = 'engine';

/** Where the config folder lies inside the hub when oculus's folder is inside the hub folder. */
const CONFIG_IN_HUB = 'tools/oculus/config';

const LOADED = loadConfig(engineDir()).config;
export const CONFIG = portfolioConfigFrom(LOADED);

/** The files of the planted hub, by their path under the hub root. */
export const HUB_FILES: Record<string, string> = {
    'registries/venues.yml': [
        'schema:',
        '  - { field: id, type: text, required: true, help: The venue key. }',
        '  - { field: name, type: text, required: true, help: The venue name. }',
        'entries:',
        '  - { id: jbhi, name: Journal One }',
        '  - { id: bspc, name: Journal Two }',
        ''
    ].join('\n'),
    'registries/people.yml': [
        'schema:',
        '  - { field: key, type: text, required: true, help: The person key. }',
        '  - { field: name, type: text, required: true, help: The name. }',
        '  - { field: affiliations, type: tags, from: organisations, help: The organisations. }',
        'entries:',
        '  - key: amir',
        '    name: Amir',
        '    affiliations: [utwente, "tue"]',
        '  - key: ann',
        '    name: Ann',
        ''
    ].join('\n'),
    'registries/organisations.yml': [
        'schema:',
        '  - { field: key, type: text, required: true, help: The organisation key. }',
        '  - { field: name, type: text, required: true, help: The name. }',
        'entries:',
        '  - { key: utwente, name: Twente }',
        '  - { key: tue, name: Eindhoven }',
        ''
    ].join('\n'),
    'registries/pillars.yml': [
        'schema:',
        '  - { field: key, type: text, required: true, help: The pillar key. }',
        'entries:',
        '  - key: tensor',
        '  - key: federated',
        ''
    ].join('\n'),
    'registries/domains.yml': [
        'schema:',
        '  - { field: key, type: text, required: true, help: The domain key. }',
        'entries:',
        '  - key: heart',
        '  - key: brain',
        ''
    ].join('\n'),
    'registries/resources.yml': [
        'schema:',
        '  - { field: key, type: text, required: true, help: The resource key. }',
        '  - { field: kind, type: select, options: [cluster, machine], help: The kind. }',
        'entries:',
        '  - { key: hpc, kind: cluster }',
        '  - { key: laptop, kind: machine }',
        ''
    ].join('\n'),
    'registries/data.yml': [
        'schema:',
        '  - { field: key, type: text, required: true, help: The dataset key. }',
        '  - { field: themes, type: tags, options: [{ key: eeg, label: EEG }], help: The themes. }',
        'datasets:',
        '  - key: ds1',
        '    themes: [eeg]',
        ''
    ].join('\n'),
    'funding/funding.yml': [
        'schema:',
        '  - { field: key, type: text, help: The funding key. }',
        '  - { field: name, type: text, help: The name. }',
        'entries:',
        '  - { key: grant-a, name: Grant A }',
        '  - { name: Grant without a key }',
        ''
    ].join('\n'),
    'network/joint-work.yml': [
        'schema:',
        '  - { field: key, type: text, help: The slug. }',
        '  - { field: person, type: select, from: people, required: true, help: The person. }',
        'entries:',
        '  - key: first',
        '    person: "amir"',
        ''
    ].join('\n'),
    'tasks/tasks.yml': [
        'schema:',
        '  - { field: key, type: text, help: The slug. }',
        '  - { field: related, type: tags, from: projects, help: The projects. }',
        'entries:',
        '  - key: one',
        '    related: [alpha, nothing-like-a-project]',
        '  - key: two',
        '    related: []',
        '  - key: three',
        '    related:',
        ''
    ].join('\n'),
    'applications/applications.yml': [
        'schema:',
        '  - { field: key, type: text, help: The slug. }',
        '  - field: budget',
        '    type: records',
        '    help: The budget.',
        '    fields:',
        '      - { field: venue, type: select, from: venues, help: The venue. }',
        'entries:',
        '  - key: app',
        '    budget:',
        '      - venue: bspc',
        ''
    ].join('\n'),
    'feeds/literature-radar.yml': [
        'schema:',
        '  - { field: title, type: text, required: true, help: The title. }',
        '  - { field: url, type: text, required: true, help: The address. }',
        '  - { field: project, type: select, from: projects, help: The project. }',
        '  - { field: maps_to, type: text, from: projects, help: The project or a word. }',
        'entries:',
        '  - { title: One, url: "https://example.org/1", project: alpha, maps_to: new-idea-candidate }',
        '  - { title: Two, url: "https://example.org/2", project: beta, maps_to: alpha }',
        ''
    ].join('\n'),
    'projects/active/alpha/project.yml': [
        'id: alpha',
        'type: active',
        'title: Alpha',
        'venue_id: jbhi',
        'pillar: [tensor, federated]',
        'related: [beta]',
        'waiting-on: [amir, beta]',
        'collaborators: [amir]',
        'datasets: [ds1]',
        ''
    ].join('\n'),
    'projects/active/beta/project.yml': [
        'id: beta',
        'type: active',
        'title: Beta',
        'venue_id: "jbhi"',
        'related:',
        '  - alpha',
        ''
    ].join('\n'),
    'projects/active/alpha/present/present.yml': [
        'deck:',
        '  title: Alpha',
        'groups:',
        '  main:',
        '    slides: [beta]',
        ''
    ].join('\n')
};

/** The engine's configuration files the index reads, planted with the keys the rows name. */
export const ENGINE_FILES: Record<string, string> = {
    'behavior.yml': ['usage_refresh_min: 10', 'slurm:', '  resource: hpc', ''].join('\n'),
    'sources.yml': ['scan:', '  - { dir: projects/manuscripts }', ''].join('\n'),
    'catalogs/vocab.yml': [
        'palette:',
        '  "#e2374d": c-red',
        '  "#7c3aed": c-violet',
        'type_color: { active: "#ea580c", manuscript: "#0d9488" }',
        'type_order: [active, manuscript]',
        ''
    ].join('\n')
};

/** What a planted hub gives: its folder, its engine folder, the index, and a way to ask it. */
export type PlantedHub = {
    hub: string;
    engine: string;
    index: ReferenceIndex;
    /** The file of the index at a path under a root. */
    file: (root: 'hub' | 'engine', path: string) => FileScan;
    /** What stands at a position of a file, the open texts laid over the index. */
    hit: (
        root: 'hub' | 'engine',
        path: string,
        at: { line: number; character: number },
        open?: Record<string, string>
    ) => { hit: Hit | null; graph: Graph };
};

/** How a planted hub differs from the standard one besides its files. */
export type PlantOptions = {
    /** The folder the config's `portfolio_deck` names, or null for none; the standard config's. */
    deck?: string | null;
    /** The engine's config folder is the hub's own `tools/oculus/config`, not another folder. */
    engineInHub?: boolean;
};

/**
 * Plant the hub (and the given changes to its files) and build its reference index. In the texts
 * held open (`hit`), a name written `root:path` is a file of that root; a name alone is a file of
 * the root asked.
 */
export function plantHub(
    changes: Record<string, string> = {},
    engineChanges: Record<string, string> = {},
    options: PlantOptions = {}
): PlantedHub {
    const engineFiles = { ...ENGINE_FILES, ...engineChanges };
    const inHub = options.engineInHub === true;
    const placed = Object.fromEntries(
        Object.entries(engineFiles).map(([name, text]) => [`${CONFIG_IN_HUB}/${name}`, text])
    );
    const hub = plantScratch(
        'oculus-reference-hub-',
        { ...HUB_FILES, ...changes, ...(inHub ? placed : {}) },
        ['secrets']
    );
    const engine = inHub
        ? join(hub, CONFIG_IN_HUB)
        : plantScratch('oculus-reference-engine-', engineFiles);
    const config = options.deck === undefined ? CONFIG : { ...CONFIG, portfolioDeck: options.deck };
    const held = inHub
        ? { root: HUB_FOLDER, path: CONFIG_IN_HUB }
        : { root: CONFIG_FOLDER, path: '' };
    const index = buildPortfolioWithSchemas(
        hub,
        config,
        0,
        [],
        undefined,
        { dir: engine, held: [held] },
        HUB_FOLDER
    ).references;
    const roots = [
        { key: HUB_FOLDER, dir: hub },
        ...(inHub ? [] : [{ key: CONFIG_FOLDER, dir: engine }])
    ];
    const file = (root: 'hub' | 'engine', path: string): FileScan => {
        const found = index.files.find((one) => one.file.root === root && one.file.path === path);
        if (found === undefined) throw new Error(`the index holds no ${root}:${path}`);
        return found;
    };
    return {
        hub,
        engine,
        index,
        file,
        hit: (root, path, at, open = {}) => {
            const texts = Object.entries(open).map(([name, text]) => {
                const [home, rest] = /^(hub|engine):/.test(name)
                    ? [name.slice(0, name.indexOf(':')), name.slice(name.indexOf(':') + 1)]
                    : [root, name];
                return { real: join(home === 'hub' ? hub : engine, rest), text };
            });
            const laid = overlay(index, roots, texts);
            const graph = graphOf(laid, HUB_FOLDER);
            const scan = scanOf(laid, roots, join(root === 'hub' ? hub : engine, path));
            if (scan === undefined) throw new Error(`the index holds no ${root}:${path}`);
            return { hit: hitAt(graph, scan, at), graph };
        }
    };
}
