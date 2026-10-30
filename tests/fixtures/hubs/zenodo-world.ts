// Layer 4, test helper. The world of tests/routes/git/zenodo.test.ts: a fixture hub in a scratch
// folder holding the project `alpha`, its settings laying `deposit.zenodo.address` at the fake
// Zenodo of zenodo-answers.ts, a second hub beside it, the people, organisations and funding a
// Publish credits, and a press through lib/server/git/deposit/deposit-routes.ts. The Zenodo token
// is a fixture word in a `downloads` row handed to the route as the machine's rows. Git is a fake
// behind the deposit's `git` option that lists the files of the review copy as they lie, so no git
// process runs.

import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { parse } from 'yaml';
import { portfolioConfigFrom } from '../../../src/lib/data/index.ts';
import { engineDir, loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';
import { mintToken } from '../../../src/lib/server/core/auth.ts';
import type { RunningGit } from '../../../src/lib/server/core/git/running.ts';
import { fsWrites } from '../../../src/lib/server/core/json.ts';
import type { Account } from '../../../src/lib/server/core/reader/request.ts';
import { words } from '../../../src/lib/server/core/words.ts';
import type { WriteTarget } from '../../../src/lib/server/edit/writes.ts';
import type { GitRunner } from '../../../src/lib/server/git/deposit/deposit-git.ts';
import { handleDeposit } from '../../../src/lib/server/git/deposit/deposit-routes.ts';
import { noCredentials } from '../doubles.ts';
import { plantFile, scratchDir } from '../scratch.ts';
import { depositTarget } from './deposit-world.ts';
import { ZENODO_ADDRESS, type FakeZenodo } from './zenodo-answers.ts';

/** The page's write token of the fixture's requests. */
export const TOKEN = mintToken();

/** The host the fixture's requests name. */
export const HOST = '127.0.0.1:8791';

/** The Zenodo token of the fixture's `downloads` row: a fixture word, no person's token. */
export const ZENODO_TOKEN = 'fixture-zenodo-token-5e1f';

/** The fixture's project as a request names it. */
export const PROJECT = 'hub:alpha';

/** The terms every case anonymises unless it names its own: invented words. */
const TERMS = [{ term: 'Quillmore' }, { term: 'Northbridge Institute', as: 'an institute' }];

const TEXT = textCatalog(loadConfig(engineDir()).config);

/** One sentence of the server's catalog. */
export function said(key: string, ...args: (string | number)[]): string {
    return words(TEXT, key, ...args);
}

/** Today, as the manifest's dates are written. */
export function today(): string {
    return new Date().toISOString().slice(0, 10);
}

/** What a fixture project's manifest holds beside its id, and the hub's settings around it. */
export type ManifestSetup = {
    title?: string;
    anonymize?: { term: string; as?: string }[];
    code?: Record<string, string>;
    /** YAML lines of the manifest's top level. */
    lines?: string[];
    /** The hub's `deposit.zenodo.address`, the fake's when absent. */
    address?: string;
    /** YAML lines of the hub's settings file after its `deposit` block. */
    settings?: string[];
};

/** A fixture hub: its folder, its project's manifest file, and the scratch folder it is in. */
export type Fixture = { dir: string; hub: string; manifest: string; into: WriteTarget };

/** The hub's settings file of a fixture, the `deposit` block first. */
function settingsText(setup: ManifestSetup): string {
    const address = setup.address ?? ZENODO_ADDRESS;
    return [
        'deposit:',
        '    zenodo:',
        `        address: ${address}`,
        ...(setup.settings ?? []),
        ''
    ].join('\n');
}

/** The manifest of the fixture project `alpha`, written as YAML lines. */
function manifestText(setup: ManifestSetup): string {
    const terms = setup.anonymize ?? TERMS;
    const rows = terms.map((one) =>
        one.as === undefined
            ? `    - { term: ${JSON.stringify(one.term)} }`
            : `    - { term: ${JSON.stringify(one.term)}, as: ${JSON.stringify(one.as)} }`
    );
    const code = Object.entries({
        status: 'none',
        description: 'Code of the paper.',
        ...setup.code
    }).map(([key, value]) => `  ${key}: ${JSON.stringify(value)}`);
    return [
        'id: alpha',
        'tier: research',
        'stage: exploring',
        `title: ${JSON.stringify(setup.title ?? 'The alpha tools')}`,
        ...(setup.lines ?? []),
        'code_availability:',
        ...code,
        ...(rows.length === 0 ? [] : ['  anonymize:', ...rows]),
        ''
    ].join('\n');
}

/** A hub holding the project `alpha` with these files under its `code/`. */
export function fixture(
    files: Record<string, string | Uint8Array>,
    setup: ManifestSetup = {}
): Fixture {
    const dir = scratchDir('oculus-zenodo-');
    const hub = join(dir, 'hub');
    plantFile(hub, '.oculus/config.yml', settingsText(setup));
    const manifest = plantFile(hub, 'projects/alpha/project.yml', manifestText(setup));
    plantFile(hub, 'projects/alpha/code/README.md', '# The tools\n');
    for (const [name, body] of Object.entries(files)) {
        plantFile(hub, join('projects/alpha/code', name), Buffer.from(body));
    }
    const merged = loadConfig(engineDir(), { hub }).config;
    const target = depositTarget(dir, hub, {
        ...portfolioConfigFrom(merged),
        scan: [{ dir: 'projects' }]
    });
    const history = join(dir, 'history');
    return {
        dir,
        hub,
        manifest,
        into: {
            ...target,
            changes: {
                file: join(history, 'changes.jsonl'),
                keep: 50,
                writes: fsWrites(),
                undoDir: join(history, 'undo')
            }
        }
    };
}

/**
 * The fixture with a second hub `lab` beside its primary, holding a project `alpha` of its own
 * under the settings `setup` names; the fixture's manifest is the lab's.
 */
export function withLab(primary: ManifestSetup, setup: ManifestSetup): Fixture {
    const at = fixture({}, primary);
    const lab = join(at.dir, 'lab');
    plantFile(lab, '.oculus/config.yml', settingsText(setup));
    const manifest = plantFile(lab, 'projects/alpha/project.yml', manifestText(setup));
    plantFile(lab, 'projects/alpha/code/README.md', '# The tools\n');
    const merged = loadConfig(engineDir(), { hub: lab }).config;
    const config = { ...portfolioConfigFrom(merged), scan: [{ dir: 'projects' }] };
    return { ...at, manifest, into: { ...at.into, hubs: [{ key: 'lab', hub: lab, config }] } };
}

/** The settings lines that name the hub's three registries. */
const REGISTRIES = [
    'collections:',
    '    - { key: people, file: .oculus/data/people/people.yml, registry: people, primary_key: key }',
    '    - { key: organisations, file: .oculus/data/people/organisations.yml, registry: organisations, primary_key: key }',
    '    - { key: funding, file: .oculus/data/academic/funding.yml, registry: funding, primary_key: key }'
];

/** The manifest lines of a project with a team of three, one person named twice, and two grants. */
const TEAM = [
    'lead: [ana-rivera]',
    'collaborators: [ben-okafor]',
    'supervisors: [ana-rivera, cleo-lindqvist]',
    'funding: [first-grant, second-grant]'
];

/** The creators the manifest of `TEAM` gives. */
export const CREATORS = [
    {
        person_or_org: {
            type: 'personal',
            given_name: 'Ana',
            family_name: 'Rivera',
            identifiers: [{ scheme: 'orcid', identifier: '0000-0002-1825-0097' }]
        },
        affiliations: [{ name: 'Northbridge University' }]
    },
    { person_or_org: { type: 'personal', given_name: 'Ben', family_name: 'Okafor' } },
    { person_or_org: { type: 'personal', given_name: 'Cleo', family_name: 'Lindqvist' } }
];

/** The funding the manifest of `TEAM` gives. */
export const FUNDING = [
    {
        funder: { name: 'The Science Council' },
        award: { title: { en: 'A first grant' }, number: 'SC-12' }
    },
    { funder: { name: 'The Science Council' } }
];

/** A fixture whose hub holds the people, organisations and funding of `TEAM`. */
export function credited(
    files: Record<string, string | Uint8Array>,
    code: Record<string, string> = {}
): Fixture {
    const at = fixture(files, { lines: TEAM, settings: REGISTRIES, code });
    plantFile(
        at.hub,
        '.oculus/data/people/people.yml',
        [
            'entries:',
            '  - { key: ana-rivera, name: Ana Rivera, family: Rivera, orcid: 0000-0002-1825-0097, affiliations: [northbridge] }',
            '  - { key: ben-okafor, name: Ben Okafor, family: Okafor }',
            '  - { key: cleo-lindqvist, name: Cleo Lindqvist, family: Lindqvist }',
            ''
        ].join('\n')
    );
    plantFile(
        at.hub,
        '.oculus/data/people/organisations.yml',
        [
            'entries:',
            '  - { key: northbridge, name: Northbridge University, kind: university }',
            '  - { key: council, name: The Science Council, kind: funder }',
            ''
        ].join('\n')
    );
    plantFile(
        at.hub,
        '.oculus/data/academic/funding.yml',
        [
            'entries:',
            '  - { key: first-grant, title: A first grant, funder: council, award: SC-12 }',
            '  - { key: second-grant, title: A second grant, funder: council }',
            ''
        ].join('\n')
    );
    return at;
}

/** Every file under a folder, by its path relative to it, `.git` left out. */
export function filesUnder(root: string): string[] {
    return readdirSync(root, { recursive: true, withFileTypes: true })
        .filter((one) => one.isFile())
        .map((one) => relative(root, join(one.parentPath, one.name)))
        .filter((path) => path !== '.git' && !path.startsWith('.git/'))
        .sort();
}

/** A git that lists the files of the folder it is pointed at as they lie, and runs nothing. */
const listing: GitRunner = (argv) => {
    if (argv[2] !== 'ls-files') return Promise.resolve({ ok: true, output: '', error: '' });
    return Promise.resolve({ ok: true, output: filesUnder(argv[1]).join('\0'), error: '' });
};

/** A POST of one deposit action as the page sends it from the confirm dialog. */
function post(action: string, id: string): Request {
    return new Request(`http://${HOST}/api/deposit`, {
        method: 'POST',
        headers: {
            host: HOST,
            origin: `http://${HOST}`,
            'sec-fetch-site': 'same-origin',
            'content-type': 'application/json',
            'x-oculus-token': TOKEN
        },
        body: JSON.stringify({ action, id, confirm: true })
    });
}

/** What a press answered. */
export type Pressed = { status: number; body: { ok?: boolean; output?: string; error?: string } };

/** The project a press names, and the registry of runs a case cancels through. */
type Aimed = { id?: string; running?: RunningGit };

/** The options of a request of the fixture's project, the machine's `downloads` rows given. */
export function depositOptions(at: Fixture, downloads: Account[], zenodo?: FakeZenodo) {
    return {
        into: at.into,
        mirrors: join(at.dir, 'mirrors'),
        credentials: noCredentials(),
        git: listing,
        ...(zenodo === undefined ? {} : { fetch: zenodo.fetch }),
        downloads: () => downloads
    };
}

/** Press one Zenodo action of the fixture's project against a fake Zenodo. */
export async function press(
    at: Fixture,
    action: string,
    zenodo: FakeZenodo,
    { id = PROJECT, running }: Aimed = {}
): Promise<Pressed> {
    const rows = [{ service: 'zenodo', secret: ZENODO_TOKEN }];
    const response = await handleDeposit(post(action, id), TOKEN, {
        idsFor: () => [id],
        ...(running === undefined ? {} : { running }),
        deposit: depositOptions(at, rows, zenodo)
    });
    return { status: response.status, body: (await response.json()) as Pressed['body'] };
}

/** The `code_availability` block of the fixture's manifest as it stands. */
export function codeBlock(at: Fixture): Record<string, unknown> {
    const read = parse(readFileSync(at.manifest, 'utf8')) as {
        code_availability: Record<string, unknown>;
    };
    return read.code_availability;
}
