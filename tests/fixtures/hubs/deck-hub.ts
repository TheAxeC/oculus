// Layer 4, test helper. A workspace for the cases of a deck's projects, their facts, their
// domains and their slides' `{{project.<field>}}`: two hubs copied from the demo hub, a third hub
// that holds a domains file alone and a repository folder, built as the portfolio watcher builds
// them, with the deck source the deck route reads over the snapshot and the deck reader of each
// hub over the build's own input.
//
// The hub `hub` holds the demo's projects and ten planted ones, each with a deck: `hccnet` with
// every field the strip shows, `quantum` with a few, `failedp` and `stoppedp` at the two dead
// stages, `ghost` naming a person and a venue no registry holds and a person with no name, `empty`
// with empty values and an empty domain, `crossp` naming a venue and a person only the hub `lab`
// holds, `crossd` naming the domain `labonly` only `lab` holds, `stray` naming the domain
// `nowhere` no hub holds, and `twind` naming the domain `twin` that `lab` and `far` hold and `hub`
// does not; each of the last three has a project slide. Its portfolio deck places the decks of
// `hccnet`, `crossd`, `stray` and `twind` as one group, with the group's legend, summary and grid,
// and the repository's deck. The venue `intelmed` has the short name `A*B_<x>`, and the domain
// `hubonly` is the hub's alone. The repository folder `kit` holds a project of the primary hub
// naming the domain `graphs`, which `hub` and `lab` both hold. The hub `lab` names the stage
// `submitted` "sent out" and the person `dana-example` "Dana of Lab", holds the person `lab-only`,
// the venue `labjournal` with the short name `Lab J` and the domains `labonly` and `twin`, and
// holds the project `labp`, naming the domain `hubonly`. The hubs are planted in a temporary
// directory, and every file planted or edited in them goes through `plantFile`.
//
// A second workspace, of one hub (`orderHub`), is for the order of the decks a group discovers:
// the hub's settings give its own deck order and a `publications` row of its own, and the deck
// reader of the hub reads them from the hub's merged settings.

import { cpSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { readHubBeforeDecks, readOtherHub } from '../../../src/lib/data/index.ts';
import { engineDir, loadConfig } from '../../../src/lib/data/sources/config.ts';
import type { DeckReader } from '../../../src/lib/data/sources/deck/read.ts';
import { deckReader } from '../../../src/lib/data/sources/documents/decks.ts';
import { hubProjects } from '../../../src/lib/data/snapshot/hubs/deck-facts.ts';
import { factRecords } from '../../../src/lib/data/snapshot/normalise.ts';
import { createChecker } from '../../../src/lib/data/snapshot/schema/check.ts';
import type {
    Finding,
    PortfolioConfig,
    RepositoryRoot,
    Snapshot
} from '../../../src/lib/data/model/index.ts';
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

/** A project slide titled `title`, with a tag of the class `tag` when one is given. */
function projectSlide(title: string, tag?: string): string {
    const tagged = tag === undefined ? [] : [`tag: { text: ${tag}, class: ${tag} }`];
    return ['---', 'kind: project', `title: ${title}`, ...tagged, '---', ''].join('\n');
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
            'domain: ""',
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
    },
    'projects/manuscripts/crossd': {
        manifest: ['stage: exploring', 'tier: research', 'title: Cross domain', 'domain: labonly'],
        slide: projectSlide('Cross domain', 'measured')
    },
    'projects/manuscripts/stray': {
        manifest: ['stage: exploring', 'tier: research', 'title: Stray', 'domain: nowhere'],
        slide: projectSlide('Stray')
    },
    'projects/manuscripts/twind': {
        manifest: ['stage: exploring', 'tier: research', 'title: Twin', 'domain: twin'],
        slide: projectSlide('Twin')
    }
};

/**
 * The portfolio deck of the hub `hub`: the group `project` of the decks of `hccnet`, `crossd`,
 * `stray` and `twind`, with its legend on the title slide, its slides, its summary and its grid,
 * and the group `kit` of the repository's deck.
 */
const PORTFOLIO: Record<string, string> = {
    'deck/present.yml': [
        'deck: { title: Portfolio }',
        'groups:',
        '    project:',
        '        find: { folders: projects/*/*/present }',
        '        slides: [hccnet, crossd, stray, twind]',
        '    kit:',
        '        slides: [kit]',
        'order:',
        '    - title.md',
        '    - { slides: project }',
        '    - { kind: summary, of: project, title: Overview }',
        '    - { kind: grid, of: project, title: Cards }',
        '    - { slides: kit }'
    ].join('\n'),
    'deck/title.md': '---\nkind: title\nlegend: project\n---\n# Portfolio\n'
};

/** The domains file of a hub copied from the demo hub. */
const DOMAINS = '.oculus/data/pillars/domains.yml';

/** The hub `far`: its settings, naming its domains file alone, and that file. */
const FAR: Record<string, string> = {
    '.oculus/config.yml':
        'collections:\n  - { key: domains, file: domains.yml, registry: domains }\n',
    'domains.yml': [
        'schema:',
        '  - { field: key, type: text, primary_key: true, required: true }',
        '  - { field: title, type: text, required: true }',
        'entries:',
        '  - key: twin',
        '    title: Twin of Far',
        ''
    ].join('\n')
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

/**
 * What the workspace is built into, the deck source the deck route reads over it, and the deck
 * reader of each hub over the build's own input: the hub's projects as the build makes them from
 * its manifests and every hub's records, and their words.
 */
export type FactsWorkspace = {
    hub: string;
    lab: string;
    kit: string;
    snapshot: Snapshot;
    findings: Finding[];
    source: DeckSource;
    built: (key: string) => DeckReader;
};

/** One hub of the workspace as the build reads it before its decks. */
type HubAt = { key: string; dir: string; config: PortfolioConfig; roots: RepositoryRoot[] };

/** The deck reader of each hub of `hubs` over the build's own input. */
function buildReaders(hubs: readonly HubAt[]): (key: string) => DeckReader {
    const reads = hubs.map((one) => ({
        ...one,
        raw: readHubBeforeDecks(one.dir, one.config, one.roots, one.key).raw
    }));
    const records = reads.map((one) => ({
        key: one.key,
        records: factRecords(one.raw.registries)
    }));
    return (key) => {
        const at = reads.findIndex((one) => one.key === key);
        if (at < 0) throw new Error(`no hub ${key}`);
        const one = reads[at];
        const others = records.filter((_, index) => index !== at);
        const made = hubProjects(one.raw.manifests, records[at], others, one.config);
        const hub = { key, dir: one.dir, config: one.config };
        return deckReader({ hub, projects: made.projects, words: made.words });
    };
}

/** The workspace of the two hubs and the repository folder, built. */
export function factsWorkspace(): FactsWorkspace {
    const root = scratchDir('oculus-deck-facts-');
    const hub = join(root, 'hub');
    const lab = join(root, 'lab');
    const kit = join(root, 'kit');
    const far = join(root, 'far');
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
    edit(hub, DOMAINS, 'entries:\n', 'entries:\n  - key: hubonly\n    title: Hub only\n');
    put(kit, {
        '.oculus/project.yml':
            'title: Kit\ntier: research\nstage: submitted\ndomain: graphs\nlead: [dana-example]\n',
        ...deck(projectSlide('Kit'))
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
    edit(
        lab,
        DOMAINS,
        'entries:\n',
        'entries:\n  - key: labonly\n    title: Lab only\n  - key: twin\n    title: Twin of Lab\n'
    );
    put(join(lab, 'projects/manuscripts/labp'), {
        'project.yml':
            'id: labp\ntier: research\nstage: submitted\ndomain: hubonly\nlead: [dana-example]\n',
        ...deck(projectSlide('Lab'))
    });
    put(far, FAR);
    const folders = [
        { name: 'hub', dir: hub },
        { name: 'lab', dir: lab },
        { name: 'far', dir: far },
        { name: 'kit', dir: kit }
    ];
    const open = workspaceWith(folders, 'hub').open();
    const settings = (dir: string) => loadConfig(engineDir(), { hub: dir });
    const { config, from } = settings(hub);
    const portfolio = primaryConfig(config, open, settings, from);
    const others = [
        readOtherHub({ key: 'lab', dir: lab }, settings(lab)),
        readOtherHub({ key: 'far', dir: far }, settings(far))
    ];
    const built = buildHubs(
        {
            primary: { key: 'hub', dir: hub, portfolio, workspace: null },
            others,
            config: portfolio,
            order: ['hub', 'lab', 'far', 'kit'],
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
    const readers = buildReaders([
        { key: 'hub', dir: hub, config: portfolio, roots: portfolio.repositories },
        ...others.map((one) => ({ key: one.key, dir: one.dir, config: one.portfolio, roots: [] }))
    ]);
    return { hub, lab, kit, snapshot, findings: snapshot.findings, source, built: readers };
}

/**
 * The settings the hub of `orderHub` lays over oculus's: its own `publications` row, ordered by
 * title alone, and its own deck order, which leaves out every category but three.
 */
const ORDER_SETTINGS = [
    'categories:',
    '  - { key: publications, label: publications, stages: { words: [accepted, published] }, forms: { words: [journal, conference] }, color: "#db2777", sort: [title] }',
    'deck_order: [idea, publications, in-flight]',
    '',
    ''
].join('\n');

/**
 * The projects of `orderHub` under side-projects/, a scan folder of oculus's that the demo hub
 * leaves empty, by folder: the manifest's lines.
 */
const ORDER_PROJECTS: Record<string, string[]> = {
    'a-review': ['stage: submitted', 'title: Review'],
    'b-flight': ['stage: exploring', 'title: Flight'],
    'c-zeta': ['stage: published', 'form: journal', 'year: 2025', 'title: Zeta'],
    'd-alpha': ['stage: published', 'form: journal', 'year: 2020', 'title: Alpha'],
    'e-idea': ['stage: nascent', 'title: Idea']
};

/**
 * A hub copied from the demo hub whose settings give its own `publications` row and deck order
 * (ORDER_SETTINGS), with five projects at the stages of five categories, each with a deck, and a
 * deck `talks/order` whose one group discovers them, read through the deck reader of the hub over
 * the build's own input, as the build reads it.
 */
export function orderHub(): { dir: string; reader: DeckReader } {
    const dir = join(scratchDir('oculus-deck-order-'), 'hub');
    cpSync(DEMO, dir, { recursive: true });
    edit(
        dir,
        '.oculus/config.yml',
        "# The hub's data files",
        `${ORDER_SETTINGS}# The hub's data files`
    );
    for (const [folder, manifest] of Object.entries(ORDER_PROJECTS)) {
        put(join(dir, 'side-projects', folder), {
            'project.yml': [
                `id: ${folder}`,
                'tier: personal',
                'lead: [dana-example]',
                ...manifest,
                ''
            ].join('\n'),
            ...deck(`# ${folder}\n`)
        });
    }
    put(dir, {
        'talks/order/present.yml': [
            'deck: { title: Order }',
            'groups:',
            '    found:',
            '        find: { folders: side-projects/*/present }',
            '        discover: true',
            'order: [{ slides: found }]',
            ''
        ].join('\n')
    });
    const config = readOtherHub(
        { key: 'hub', dir },
        loadConfig(engineDir(), { hub: dir })
    ).portfolio;
    return { dir, reader: buildReaders([{ key: 'hub', dir, config, roots: [] }])('hub') };
}
