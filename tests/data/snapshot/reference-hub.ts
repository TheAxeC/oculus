// Layer 4, test helper. A small hub planted in a scratch directory for the reference index and the
// rename of a hub key: one file of each kind that names a key or defines one, an engine folder
// holding the configuration files the index reads (`defaults/behavior.yml`, `defaults/sources.yml`
// and `catalogs/vocab.yml`), and where a row asks for one, the open workspace file, in the hub or
// in a second workspace folder `lab`. The hub is built as a workspace's primary hub is, so a
// `.oculus/local.yml` a row plants is read for its `self`.
// The texts are synthetic; none of them is a file of the hub.

import { builtHub, portfolioConfigFrom, readHub } from '../../../src/lib/data/index.ts';
import { createChecker } from '../../../src/lib/data/snapshot/schema/check.ts';
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

/** The name of the second workspace folder, which holds only the open workspace file. */
const LAB_FOLDER = 'lab';

/** The roots a row names a file of. */
export type PlantedRoot = 'hub' | 'engine' | 'lab';

/** Where the config folder lies inside the hub when oculus's folder is inside the hub folder. */
const CONFIG_IN_HUB = 'tools/oculus/config';

export const CONFIG = portfolioConfigFrom(loadConfig(engineDir()).config);

/** The planted hub's files by their path under the hub root, the data at oculus's own paths. */
export const HUB_FILES: Record<string, string> = {
    '.oculus/data/research/venues.yml': [
        'schema:',
        '  - { field: id, type: text, primary_key: true, required: true, help: The venue key. }',
        '  - { field: name, type: text, display: 1, required: true, help: The venue name. }',
        'entries:',
        '  - { id: jbhi, name: Journal One }',
        '  - { id: bspc, name: Journal Two }',
        ''
    ].join('\n'),
    '.oculus/data/people/people.yml': [
        'schema:',
        '  - { field: key, type: text, primary_key: true, required: true, help: The person key. }',
        '  - { field: name, type: text, display: 1, required: true, help: The name. }',
        '  - { field: affiliations, type: tags, foreign_key: organisations, help: The organisations. }',
        'entries:',
        '  - key: amir',
        '    name: Amir',
        '    affiliations: [utwente, "tue"]',
        '  - key: ann',
        '    name: Ann',
        ''
    ].join('\n'),
    '.oculus/data/people/organisations.yml': [
        'schema:',
        '  - { field: key, type: text, primary_key: true, required: true, help: The organisation key. }',
        '  - { field: name, type: text, display: 1, required: true, help: The name. }',
        'entries:',
        '  - { key: utwente, name: Twente }',
        '  - { key: tue, name: Eindhoven }',
        ''
    ].join('\n'),
    '.oculus/data/pillars/pillars.yml': [
        'schema:',
        '  - { field: key, type: text, primary_key: true, display: 1, required: true, help: The pillar key. }',
        'entries:',
        '  - key: tensor',
        '  - key: federated',
        ''
    ].join('\n'),
    '.oculus/data/pillars/domains.yml': [
        'schema:',
        '  - { field: key, type: text, primary_key: true, display: 1, required: true, help: The domain key. }',
        'entries:',
        '  - key: heart',
        '  - key: brain',
        ''
    ].join('\n'),
    '.oculus/data/research/resources.yml': [
        'schema:',
        '  - { field: key, type: text, primary_key: true, display: 1, required: true, help: The resource key. }',
        '  - { field: kind, type: select, options: [cluster, machine], help: The kind. }',
        'entries:',
        '  - { key: hpc, kind: cluster }',
        '  - { key: laptop, kind: machine }',
        ''
    ].join('\n'),
    '.oculus/data/research/data.yml': [
        'schema:',
        '  - { field: key, type: text, primary_key: true, display: 1, required: true, help: The dataset key. }',
        '  - { field: themes, type: tags, options: [{ key: eeg, label: EEG }], help: The themes. }',
        'datasets:',
        '  - key: ds1',
        '    themes: [eeg]',
        ''
    ].join('\n'),
    '.oculus/data/academic/funding.yml': [
        'schema:',
        '  - { field: key, type: text, primary_key: true, help: The funding key. }',
        '  - { field: name, type: text, display: 1, help: The name. }',
        'entries:',
        '  - { key: grant-a, name: Grant A }',
        '  - { name: Grant without a key }',
        ''
    ].join('\n'),
    '.oculus/data/academic/joint-work.yml': [
        'schema:',
        '  - { field: key, type: text, primary_key: true, help: The slug. }',
        '  - { field: person, type: select, foreign_key: people, required: true, help: The person. }',
        'entries:',
        '  - key: first',
        '    person: "amir"',
        ''
    ].join('\n'),
    '.oculus/data/academic/tasks.yml': [
        'schema:',
        '  - { field: key, type: text, primary_key: true, help: The slug. }',
        '  - { field: related, type: tags, foreign_key: projects, help: The projects. }',
        'entries:',
        '  - key: one',
        '    related: [alpha, nothing-like-a-project]',
        '  - key: two',
        '    related: []',
        '  - key: three',
        '    related:',
        ''
    ].join('\n'),
    '.oculus/data/academic/applications.yml': [
        'schema:',
        '  - { field: key, type: text, primary_key: true, help: The slug. }',
        '  - field: budget',
        '    type: records',
        '    help: The budget.',
        '    fields:',
        '      - { field: venue, type: select, foreign_key: venues, help: The venue. }',
        'entries:',
        '  - key: app',
        '    budget:',
        '      - venue: bspc',
        ''
    ].join('\n'),
    '.oculus/data/academic/events.yml': [
        'schema:',
        '  - { field: key, type: text, primary_key: true, help: The slug. }',
        '  - { field: title, type: text, display: 1, help: The event. }',
        'entries:',
        '  - { key: talk, title: A talk }',
        ''
    ].join('\n'),
    '.oculus/data/academic/education.yml': [
        'schema:',
        '  - { field: key, type: text, primary_key: true, help: The slug. }',
        '  - { field: event, type: select, foreign_key: events, help: The event. }',
        'entries:',
        '  - key: course',
        '    event: talk',
        ''
    ].join('\n'),
    '.oculus/data/literature/radar.yml': [
        'schema:',
        '  - { field: title, type: text, primary_key: true, required: true, help: The title. }',
        '  - { field: url, type: text, required: true, help: The address. }',
        '  - { field: project, type: select, foreign_key: projects, help: The project. }',
        '  - { field: maps_to, type: text, foreign_key: projects, help: The project or a word. }',
        'entries:',
        '  - { title: One, url: "https://example.org/1", project: alpha, maps_to: new-idea-candidate }',
        '  - { title: Two, url: "https://example.org/2", project: beta, maps_to: alpha }',
        ''
    ].join('\n'),
    'projects/active/alpha/project.yml': [
        'id: alpha',
        'stage: in-prep',
        'title: Alpha',
        'venue: jbhi',
        'pillars: [tensor, federated]',
        'related: [beta]',
        'waiting-on: [amir, beta]',
        'collaborators: [amir]',
        'datasets: [ds1]',
        ''
    ].join('\n'),
    'projects/active/beta/project.yml': [
        'id: beta',
        'stage: in-prep',
        'title: Beta',
        'venue: "jbhi"',
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
    'defaults/behavior.yml': ['usage_refresh_min: 10', 'slurm:', '  resource: hpc', ''].join('\n'),
    'defaults/sources.yml': ['scan:', '  - { dir: projects/manuscripts }', ''].join('\n'),
    'catalogs/vocab.yml': [
        'palette:',
        '  "#e2374d": c-red',
        '  "#7c3aed": c-violet',
        'stages:',
        '  in-prep: { color: "#ea580c" }',
        '  manuscript: { color: "#0d9488" }',
        ''
    ].join('\n')
};

/** What a planted hub gives: its folder, its engine folder, the index, and a way to ask it. */
export type PlantedHub = {
    hub: string;
    engine: string;
    /** The second workspace folder, when the row plants the workspace file there; else null. */
    lab: string | null;
    index: ReferenceIndex;
    /** The file of the index at a path under a root. */
    file: (root: PlantedRoot, path: string) => FileScan;
    /** What stands at a position of a file, the open texts laid over the index. */
    hit: (
        root: PlantedRoot,
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
    /**
     * The open workspace file the build reads, planted at `WORKSPACE_FILE` with this text, in the
     * hub's folder or in the second workspace folder `lab`.
     */
    workspace?: { text: string; folder: 'hub' | 'lab' };
};

/** Where a planted workspace file lies in its folder, in the folder of a hub's workspace files. */
export const WORKSPACE_FILE = '.oculus/workspaces/lab.yml';

/**
 * A workspace file whose setting `slurm.resource` names the cluster `hpc`, with bytes around it to
 * keep.
 */
export const WORKSPACE_TEXT = [
    'folders:',
    '  - { name: hub, path: ~/hub }',
    'primary: hub',
    '# what this workspace sets',
    'settings:',
    '  slurm: { resource: hpc }   # the cluster',
    '  code_theme: vscode-dark-2026',
    ''
].join('\n');

/** The hub's own `local.yml`, whose `self` names the person `amir`, with other keys to keep. */
export const LOCAL_TEXT = [
    '# this machine',
    'port: 8791',
    'self: amir   # me',
    'claude_bin: claude',
    ''
].join('\n');

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
        {
            ...HUB_FILES,
            ...changes,
            ...(inHub ? placed : {}),
            ...(options.workspace?.folder === 'hub'
                ? { [WORKSPACE_FILE]: options.workspace.text }
                : {})
        },
        ['secrets']
    );
    const lab =
        options.workspace?.folder === 'lab'
            ? plantScratch('oculus-reference-lab-', { [WORKSPACE_FILE]: options.workspace.text })
            : null;
    const folderOf = (root: PlantedRoot): string => {
        if (root === 'hub') return hub;
        if (root === 'engine') return engine;
        if (lab === null) throw new Error('the row plants no folder lab');
        return lab;
    };
    const engine = inHub
        ? join(hub, CONFIG_IN_HUB)
        : plantScratch('oculus-reference-engine-', engineFiles);
    const config = options.deck === undefined ? CONFIG : { ...CONFIG, portfolioDeck: options.deck };
    const held = inHub
        ? { root: HUB_FOLDER, path: CONFIG_IN_HUB }
        : { root: CONFIG_FOLDER, path: '' };
    // The hub is built as the primary is, so its own `.oculus/local.yml` is read for `self`.
    const index = builtHub(readHub(hub, config, [], HUB_FOLDER), {
        version: 0,
        checker: createChecker(),
        engine: { dir: engine, held: [held] },
        workspace:
            options.workspace === undefined
                ? null
                : {
                      file: join(lab ?? hub, WORKSPACE_FILE),
                      root: lab === null ? HUB_FOLDER : LAB_FOLDER,
                      path: WORKSPACE_FILE
                  },
        others: {},
        local: true
    }).references;
    const roots = [
        { key: HUB_FOLDER, dir: hub },
        ...(inHub ? [] : [{ key: CONFIG_FOLDER, dir: engine }]),
        ...(lab === null ? [] : [{ key: LAB_FOLDER, dir: lab }])
    ];
    const file = (root: PlantedRoot, path: string): FileScan => {
        const found = index.files.find((one) => one.file.root === root && one.file.path === path);
        if (found === undefined) throw new Error(`the index holds no ${root}:${path}`);
        return found;
    };
    return {
        hub,
        engine,
        lab,
        index,
        file,
        hit: (root, path, at, open = {}) => {
            const texts = Object.entries(open).map(([name, text]) => {
                const [home, rest] = /^(hub|engine|lab):/.test(name)
                    ? [
                          name.slice(0, name.indexOf(':')) as PlantedRoot,
                          name.slice(name.indexOf(':') + 1)
                      ]
                    : [root, name];
                return { real: join(folderOf(home), rest), text };
            });
            const laid = overlay(index, roots, texts);
            const graph = graphOf(laid);
            const scan = scanOf(laid, roots, join(folderOf(root), path));
            if (scan === undefined) throw new Error(`the index holds no ${root}:${path}`);
            return { hit: hitAt(graph, scan, at), graph };
        }
    };
}
