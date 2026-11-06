// Layer 4, test helper. A workspace for the cases of a project's facts and its slides'
// `{{project.<field>}}`: two hubs copied from the demo hub and a repository folder, built as the
// portfolio watcher builds them, with the deck source the deck route reads over the snapshot.
//
// The hub `hub` holds the demo's projects and seven planted ones, each with a deck: `hccnet` with
// every field the strip shows, `quantum` with a few, `failedp` and `stoppedp` at the two dead
// stages, `ghost` naming a person and a venue no registry holds and a person with no name, `empty`
// with empty values, and `crossp` naming a venue and a person only the hub `lab` holds; its
// portfolio deck places `hccnet`'s deck and the repository's. The venue `intelmed` has the short
// name `A*B_<x>`. The repository folder `kit` holds a project of the primary hub. The hub `lab`
// names the stage `submitted` "sent out" and the person `dana-example` "Dana of Lab", holds the
// person `lab-only` and the venue `labjournal` with the short name `Lab J`, and holds the project
// `labp`. The two hubs are copies of the demo hub in a temporary directory, and every file planted
// or edited in them goes through `plantFile`.

import { cpSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { readOtherHub } from '../../../src/lib/data/index.ts';
import { engineDir, loadConfig } from '../../../src/lib/data/sources/config.ts';
import { createChecker } from '../../../src/lib/data/snapshot/schema/check.ts';
import type { Finding, Snapshot } from '../../../src/lib/data/model/index.ts';
import { buildHubs } from '../../../src/lib/server/root/watch/build.ts';
import type { DeckSource } from '../../../src/lib/server/content/deck/read.ts';
import { hubTargets, primaryConfig } from '../../../src/lib/server/files/roots.ts';
import { plantFile, scratchDir } from '../scratch.ts';
import { workspaceWith } from './workspace.ts';

/** The demo hub the two hubs are copied from. */
const DEMO = join(import.meta.dirname, 'demo');

/** A project deck of one slide file. */
function deck(slide: string): Record<string, string> {
    return {
        'present/present.yml': 'deck: { title: Facts }\norder: [main.md]\n',
        'present/main.md': slide
    };
}

/** The planted projects of the hub `hub`, by folder: the manifest's lines and the slide. */
const PROJECTS: Record<string, { manifest: string[]; slide: string }> = {
    'projects/manuscripts/hccnet': {
        manifest: [
            'stage: submitted',
            'tier: research',
            'title: HCC net',
            'domain: graphs',
            'pillars: [graphs]',
            'datasets: [synthgraph]',
            'lead: [dana-example, b-coauthor]',
            'collaborators: [c-senior, b-colleague, rivera-lab]',
            'year: 2026',
            'venue: intelmed',
            'funding: [ecf]',
            'compute: [utwente]',
            'code_availability: { status: deposited }'
        ],
        slide: '# At {{project.venue}}\n\nLead {{project.lead}}.\n'
    },
    'projects/ideas/quantum': {
        manifest: [
            'stage: nascent',
            'tier: research',
            'title: Quantum',
            'domain: method',
            'pillars: [graphs, tensors]',
            'lead: [dana-example]'
        ],
        slide: '# Quantum\n\nVenue {{project.venue}}.\n'
    },
    'projects/archive/failedp': {
        manifest: ['stage: failed', 'tier: research', 'title: Failed one'],
        slide: '# Failed\n'
    },
    'projects/archive/stoppedp': {
        manifest: ['stage: stopped', 'tier: research', 'title: Stopped one'],
        slide: '# Stopped\n'
    },
    'projects/manuscripts/ghost': {
        manifest: [
            'stage: exploring',
            'tier: research',
            'title: Ghost',
            'lead: [dana-example, nobody-known, nameless]',
            'venue: unknownvenue',
            'reproduced: { note: rerun }'
        ],
        slide: '# Ghost\n\nVenue {{project.venue}}.\n'
    },
    'projects/manuscripts/empty': {
        manifest: [
            'stage: exploring',
            'tier: research',
            'title: Empty',
            'venue: ""',
            'year: ""',
            'lead: []'
        ],
        slide: '# Empty\n\n{{project.venue}}{{project.year}}{{project.lead}}\n'
    },
    'projects/manuscripts/crossp': {
        manifest: [
            'stage: exploring',
            'tier: research',
            'title: Cross',
            'venue: labjournal',
            'lead: [lab-only]'
        ],
        slide: '# At {{project.venue}}\n\nLead {{project.lead}}.\n'
    }
};

/** The portfolio deck of the hub `hub`: `hccnet`'s deck and the repository's, each a group. */
const PORTFOLIO: Record<string, string> = {
    'deck/present.yml': [
        'deck: { title: Portfolio }',
        'groups:',
        '    project:',
        '        find: { folders: projects/*/*/present }',
        '        slides: [hccnet]',
        '    kit:',
        '        slides: [kit]',
        'order:',
        '    - title.md',
        '    - { slides: project }',
        '    - { slides: kit }'
    ].join('\n'),
    'deck/title.md': '# Portfolio\n'
};

/** Write each file under `dir`, its folders made, each path checked to stay inside `dir`. */
function put(dir: string, files: Record<string, string>): void {
    for (const [path, text] of Object.entries(files)) plantFile(dir, path, text);
}

/** Replace `from` with `to` in the file at `path` under `dir`, once. */
function edit(dir: string, path: string, from: string, to: string): void {
    const text = readFileSync(join(dir, path), 'utf8');
    if (!text.includes(from)) throw new Error(`${path} holds no ${from}`);
    plantFile(dir, path, text.replace(from, to));
}

/** The people file of a demo copy. */
const PEOPLE = '.oculus/data/people/people.yml';

/** What the workspace is built into, and the deck source the deck route reads over it. */
export type FactsWorkspace = {
    hub: string;
    lab: string;
    kit: string;
    snapshot: Snapshot;
    findings: Finding[];
    source: DeckSource;
};

/** The workspace of the two hubs and the repository folder, built. */
export function factsWorkspace(): FactsWorkspace {
    const root = scratchDir('oculus-deck-facts-');
    const hub = join(root, 'hub');
    const lab = join(root, 'lab');
    const kit = join(root, 'kit');
    cpSync(DEMO, hub, { recursive: true });
    cpSync(DEMO, lab, { recursive: true });
    for (const [folder, one] of Object.entries(PROJECTS)) {
        const id = folder.split('/').at(-1) ?? '';
        put(join(hub, folder), {
            'project.yml': [`id: ${id}`, ...one.manifest, ''].join('\n'),
            ...deck(one.slide)
        });
    }
    put(hub, PORTFOLIO);
    edit(
        hub,
        '.oculus/data/research/venues.yml',
        '  - id: jmlr\n',
        '  - id: intelmed\n    name: Intelligent Medicine\n    short: "A*B_<x>"\n  - id: jmlr\n'
    );
    edit(hub, PEOPLE, 'entries:\n', 'entries:\n  - key: "nameless"\n    name: ""\n');
    put(kit, {
        '.oculus/project.yml':
            'title: Kit\ntier: research\nstage: submitted\nlead: [dana-example]\n',
        ...deck('# Kit\n')
    });
    edit(
        lab,
        '.oculus/config.yml',
        "# The hub's data files",
        'stages:\n  submitted: { label: "sent out", icon: brown, color: "#0ea5e9" }\n\n# The hub\'s data files'
    );
    edit(lab, PEOPLE, 'name: "Dr. Dana Example"', 'name: "Dana of Lab"');
    edit(lab, PEOPLE, 'entries:\n', 'entries:\n  - key: "lab-only"\n    name: "Lee of Lab"\n');
    edit(
        lab,
        '.oculus/data/research/venues.yml',
        '  - id: jmlr\n',
        '  - id: labjournal\n    name: Lab Journal\n    short: "Lab J"\n  - id: jmlr\n'
    );
    put(join(lab, 'projects/manuscripts/labp'), {
        'project.yml': 'id: labp\ntier: research\nstage: submitted\nlead: [dana-example]\n',
        ...deck('# Lab\n')
    });
    const folders = [
        { name: 'hub', dir: hub },
        { name: 'lab', dir: lab },
        { name: 'kit', dir: kit }
    ];
    const open = workspaceWith(folders, 'hub').open();
    const settings = (dir: string) => loadConfig(engineDir(), { hub: dir });
    const { config, from } = settings(hub);
    const portfolio = primaryConfig(config, open, settings, from);
    const built = buildHubs(
        {
            primary: { key: 'hub', dir: hub, portfolio, workspace: null },
            others: [readOtherHub({ key: 'lab', dir: lab }, settings(lab))],
            config: portfolio,
            order: ['hub', 'lab', 'kit'],
            self: ''
        },
        0,
        createChecker(),
        null
    );
    const snapshot = built.snapshot;
    const source: DeckSource = {
        roots: open.roots,
        primary: { key: 'hub', dir: hub },
        config: portfolio,
        projects: Object.values(snapshot.entities.projects),
        entities: (kind) => snapshot.entities[kind],
        hubs: hubTargets(open, settings)
    };
    return { hub, lab, kit, snapshot, findings: snapshot.findings, source };
}
