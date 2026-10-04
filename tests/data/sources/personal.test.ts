// Layer 1, data tests. readPersonal and the Personal entities against synthetic hubs and roots in
// temporary directories. Nothing outside them is read or written, and every file is planted through
// plantScratch, which refuses a path that leaves its directory.
//
// Covered: the hub tier's reading and its absence from every research reader, the roots (a
// repository with and without `.oculus/project.yml`, a root that is not on this machine, the roots
// read as handed), the file kinds that are never read, the size bound, and each field of the
// manifest read into a SideProject with its finding.
// Not covered: which roots of the file browser are handed to the reader (the hub under another
// key, a second key or a link to one directory, the engine's config folder, `~`), which is
// personalRoots in tests/server/root/watch/portfolio/personal-roots.test.ts, the watcher
// (tests/server/root/watch/portfolio/) and the card on screen
// (tests/views/boards/personal.test.ts).
//
// The case that makes a named pipe starts `mkfifo` and is tagged slow; every other case runs in
// npm test.

import { execFileSync } from 'node:child_process';
import { mkdirSync, symlinkSync, writeFileSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';
import { describe, expect } from 'vitest';
import { buildPortfolio, portfolioConfigFrom } from '../../../src/lib/data/index.ts';
import { findingText } from '../../../src/lib/data/helpers/finding-text.ts';
import { engineDir, loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';
import {
    PERSONAL_MAX_BYTES,
    readManifests,
    readPersonal
} from '../../../src/lib/data/sources/manifests.ts';
import {
    personalFindings,
    sideProject
} from '../../../src/lib/data/snapshot/normalise-personal.ts';
import type {
    PersonalRoot,
    PortfolioConfig,
    RawPersonal,
    ScanRule,
    Snapshot
} from '../../../src/lib/data/model/index.ts';
import { auditFindings, auditRules } from '../../../src/lib/server/content/audit.ts';
import { boardItems, presetFor } from '../../../src/lib/state/boards/board/index.ts';
import { it, plantScratch, scratchDir } from '../../fixtures/scratch.ts';

const MERGED = loadConfig(engineDir()).config;
const CATALOG = textCatalog(MERGED);

/** The statuses the shipped vocabulary names, in its order. */
const STATUSES = ['running', 'building', 'idea', 'parked'];

const SIDE: ScanRule = { dir: 'side-projects', type: 'side-project', optional: true };

const SCAN: ScanRule[] = [
    { dir: 'projects/ideas', type: 'idea' },
    { dir: 'projects/active', type: 'active' },
    SIDE
];

/** A manifest body with the five fields and the given overrides, as the hub's own files read. */
function manifest(over: Record<string, string> = {}): string {
    const fields: Record<string, string> = {
        title: '"A side project"',
        status: 'idea',
        eli5: '"What it is."',
        next: '"What comes next."',
        links: '[]',
        ...over
    };
    return Object.entries(fields)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n')
        .concat('\n');
}

/** A hub with the given files under it. */
function hubWith(files: Record<string, string>, folders: string[] = []): string {
    return plantScratch('oculus-personal-', files, folders);
}

function insideScratch(dir: string, path: string): string {
    expect(resolve(path).startsWith(resolve(dir) + sep)).toBe(true);
    return path;
}

/** The portfolio config of the shipped engine over a scan that carries the hub tier. */
function configOver(scan: ScanRule[] = SCAN): PortfolioConfig {
    return { ...portfolioConfigFrom(MERGED, engineDir()), scan };
}

/** The findings of a snapshot that are about a side project: its folder or a root's .oculus. */
function aboutSide(snapshot: Snapshot): Snapshot['findings'] {
    return snapshot.findings.filter(
        (one) => one.file.includes('side-projects') || one.file.includes('.oculus')
    );
}

function ids(snapshot: Snapshot): string[] {
    return Object.keys(snapshot.entities.personal);
}

describe('the hub tier', () => {
    it("is read as one raw record per folder, in the folder's own place", () => {
        const hub = hubWith({
            'side-projects/alpha/project.yml': manifest(),
            'side-projects/beta/project.yml': manifest({ title: 'Beta' }),
            'side-projects/gamma/project.yml': manifest({ status: 'building' })
        });
        const read = readPersonal(hub, SCAN, [], CATALOG);
        expect(read.findings).toEqual([]);
        expect(read.personal.map((one) => one.source)).toEqual([
            { kind: 'hub', folder: 'side-projects/alpha' },
            { kind: 'hub', folder: 'side-projects/beta' },
            { kind: 'hub', folder: 'side-projects/gamma' }
        ]);
        expect(read.personal[0].file).toBe(join(hub, 'side-projects/alpha/project.yml'));
    });

    it('gives three cards for three folders, each id side:<slug>, none a research project', () => {
        const hub = hubWith({
            'side-projects/alpha/project.yml': manifest(),
            'side-projects/beta/project.yml': manifest(),
            'side-projects/gamma/project.yml': manifest(),
            'projects/ideas/y/project.yml': 'title: Y\n'
        });
        const snapshot = buildPortfolio(hub, configOver());
        expect(ids(snapshot)).toEqual(['side:alpha', 'side:beta', 'side:gamma']);
        expect(Object.keys(snapshot.entities.projects)).toEqual(['y']);
        expect(snapshot.findings.filter((one) => one.file.includes('side-projects'))).toEqual([]);
    });

    it('is invisible to readManifests: no record, no ghost, no finding', () => {
        const hub = hubWith(
            {
                'side-projects/x/project.yml': manifest(),
                'side-projects/bare/README.md': 'no manifest here\n',
                'projects/ideas/y/project.yml': 'title: Y\n'
            },
            ['projects/active']
        );
        const read = readManifests(hub, SCAN, CATALOG);
        expect(read.manifests.map((one) => one.id)).toEqual(['y']);
        expect(read.findings).toEqual([]);
    });

    it('costs nothing when the hub has no side-projects folder', () => {
        const hub = hubWith({ 'projects/ideas/y/project.yml': 'title: Y\n' });
        expect(readPersonal(hub, SCAN, [], CATALOG)).toEqual({ personal: [], findings: [] });
        expect(ids(buildPortfolio(hub, configOver()))).toEqual([]);
    });

    it('reports a tier that is not optional and not there, as readManifests does', () => {
        const hub = hubWith({}, ['projects/ideas']);
        const strict: ScanRule[] = [{ dir: 'side-projects', type: 'side-project' }];
        const read = readPersonal(hub, strict, [], CATALOG);
        expect(read.personal).toEqual([]);
        expect(read.findings).toEqual([
            {
                file: join(hub, 'side-projects'),
                key: 'scan',
                message: findingText(CATALOG, 'findings.manifests.scan_missing')
            }
        ]);
    });

    it('names a folder with no project.yml and draws no card for it', () => {
        const hub = hubWith({
            'side-projects/ok/project.yml': manifest(),
            'side-projects/bare/notes.md': 'notes\n'
        });
        const read = readPersonal(hub, SCAN, [], CATALOG);
        expect(read.personal.map((one) => one.source)).toEqual([
            { kind: 'hub', folder: 'side-projects/ok' }
        ]);
        expect(read.findings).toEqual([
            {
                file: join(hub, 'side-projects/bare/project.yml'),
                key: '',
                message: findingText(CATALOG, 'findings.manifests.personal_no_manifest')
            }
        ]);
    });

    it('keeps a side project that has the slug of a research project, each in its own kind', () => {
        const hub = hubWith({
            'side-projects/shared/project.yml': manifest({ title: 'Side shared' }),
            'projects/ideas/shared/project.yml': 'title: Research shared\n'
        });
        const snapshot = buildPortfolio(hub, configOver());
        expect(Object.keys(snapshot.entities.projects)).toEqual(['shared']);
        expect(ids(snapshot)).toEqual(['side:shared']);
        expect(snapshot.entities.projects.shared.title).toBe('Research shared');
        expect(snapshot.entities.personal['side:shared'].title).toBe('Side shared');
        expect(snapshot.findings.filter((one) => one.file.includes('shared'))).toEqual([]);
    });

    it('reads a folder named like an object key as an ordinary id', () => {
        const hub = hubWith({ 'side-projects/__proto__/project.yml': manifest() });
        const snapshot = buildPortfolio(hub, configOver());
        expect(ids(snapshot)).toEqual(['side:__proto__']);
        expect(Object.getPrototypeOf(snapshot.entities.personal)).toBe(Object.prototype);
    });
});

describe('the file kinds that are never read', () => {
    /** One side project whose project.yml is made by `plant`, and what the read answered. */
    function readWith(plant: (folder: string) => void): ReturnType<typeof readPersonal> {
        const hub = hubWith({}, ['side-projects/x']);
        plant(insideScratch(hub, join(hub, 'side-projects/x')));
        return readPersonal(hub, SCAN, [], CATALOG);
    }

    function notFile(read: ReturnType<typeof readPersonal>): void {
        expect(read.personal).toEqual([]);
        expect(read.findings).toHaveLength(1);
        expect(read.findings[0].message).toBe(
            findingText(CATALOG, 'findings.manifests.personal_not_file')
        );
        expect(read.findings[0].file.endsWith('side-projects/x/project.yml')).toBe(true);
    }

    it('is named for a directory called project.yml', () => {
        notFile(readWith((folder) => mkdirSync(join(folder, 'project.yml'))));
    });

    it('is named for a symbolic link called project.yml, whatever it points at', () => {
        notFile(
            readWith((folder) => {
                writeFileSync(join(folder, 'real.yml'), manifest());
                symlinkSync(join(folder, 'real.yml'), join(folder, 'project.yml'));
            })
        );
    });

    it('is named for a named pipe, and is not opened', { tags: ['slow'] }, () => {
        notFile(readWith((folder) => execFileSync('mkfifo', [join(folder, 'project.yml')])));
    });

    it('is named for a file over the size bound, and a file at the bound is read', () => {
        const padding = (size: number): string => {
            const head = manifest();
            return head + `# ${'x'.repeat(size - head.length - 3)}\n`;
        };
        const over = readWith((folder) =>
            writeFileSync(join(folder, 'project.yml'), padding(PERSONAL_MAX_BYTES + 6 * 1024))
        );
        expect(over.personal).toEqual([]);
        expect(over.findings).toHaveLength(1);
        expect(over.findings[0].message).toBe(
            findingText(CATALOG, 'findings.manifests.personal_too_large', PERSONAL_MAX_BYTES)
        );
        const exact = readWith((folder) =>
            writeFileSync(join(folder, 'project.yml'), padding(PERSONAL_MAX_BYTES))
        );
        expect(exact.findings).toEqual([]);
        expect(exact.personal).toHaveLength(1);
    });

    it('is a finding and no card for text that does not parse, an empty file and a list', () => {
        const parse = readWith((folder) => writeFileSync(join(folder, 'project.yml'), 'a: [\n'));
        expect(parse.personal).toEqual([]);
        expect(parse.findings).toHaveLength(1);
        expect(
            parse.findings[0].message.startsWith(
                CATALOG['findings.file.does_not_parse'].split('{0}')[0]
            )
        ).toBe(true);

        const empty = readWith((folder) => writeFileSync(join(folder, 'project.yml'), ''));
        expect(empty.personal).toEqual([]);
        expect(empty.findings.map((one) => one.message)).toEqual([
            findingText(CATALOG, 'findings.file.not_a_map')
        ]);

        const list = readWith((folder) => writeFileSync(join(folder, 'project.yml'), '- a\n- b\n'));
        expect(list.personal).toEqual([]);
        expect(list.findings.map((one) => one.message)).toEqual([
            findingText(CATALOG, 'findings.file.not_a_map')
        ]);
    });
});

describe('the roots', () => {
    /** A repository directory holding `.oculus/project.yml` with the given body. */
    function repository(body: string | null, name = 'repo'): { hub: string; dir: string } {
        const hub = hubWith({});
        const dir = join(scratchDir('oculus-root-'), name);
        mkdirSync(dir, { recursive: true });
        if (body !== null) {
            mkdirSync(join(dir, '.oculus'));
            writeFileSync(join(dir, '.oculus', 'project.yml'), body);
        }
        return { hub, dir };
    }

    it('gives a card root:<key> for a root whose manifest says running', () => {
        const { hub, dir } = repository(manifest({ status: 'running', title: 'Ordo' }));
        const roots: PersonalRoot[] = [{ key: 'ordo', dir }];
        const read = readPersonal(hub, SCAN, roots, CATALOG);
        expect(read.findings).toEqual([]);
        expect(read.personal).toHaveLength(1);
        expect(read.personal[0].source).toEqual({ kind: 'root', key: 'ordo', dir });
        expect(read.personal[0].file).toBe(join(dir, '.oculus', 'project.yml'));

        const snapshot = buildPortfolio(hub, configOver(), 0, roots);
        expect(snapshot.entities.personal['root:ordo']).toMatchObject({
            id: 'root:ordo',
            title: 'Ordo',
            status: 'running',
            source: { kind: 'root', key: 'ordo', dir }
        });
    });

    it('gives nothing, and no finding, for a root without .oculus', () => {
        const { hub, dir } = repository(null);
        const snapshot = buildPortfolio(hub, configOver(), 0, [{ key: 'bare', dir }]);
        expect(ids(snapshot)).toEqual([]);
        expect(aboutSide(snapshot)).toEqual([]);
    });

    it('gives nothing, and no finding, for a .oculus that is a file or holds no project.yml', () => {
        const hub = hubWith({});
        const base = scratchDir('oculus-root-');
        mkdirSync(join(base, 'a'), { recursive: true });
        writeFileSync(join(base, 'a', '.oculus'), 'a file\n');
        mkdirSync(join(base, 'b', '.oculus'), { recursive: true });
        const roots: PersonalRoot[] = [
            { key: 'a', dir: join(base, 'a') },
            { key: 'b', dir: join(base, 'b') }
        ];
        expect(readPersonal(hub, SCAN, roots, CATALOG)).toEqual({ personal: [], findings: [] });
    });

    it('gives nothing, no finding and no throw for a root that is not on this machine', () => {
        const hub = hubWith({});
        const gone = join(scratchDir('oculus-root-'), 'never', 'made');
        const roots: PersonalRoot[] = [{ key: 'gone', dir: gone }];
        expect(() => readPersonal(hub, SCAN, roots, CATALOG)).not.toThrow();
        expect(readPersonal(hub, SCAN, roots, CATALOG)).toEqual({ personal: [], findings: [] });
        expect(aboutSide(buildPortfolio(hub, configOver(), 0, roots))).toEqual([]);
    });

    it('reads every root it is given, in order, and filters none', () => {
        const { hub, dir } = repository(manifest({ title: 'Once' }));
        const roots: PersonalRoot[] = [
            { key: 'first', dir },
            { key: 'second', dir: join(dir, '..', 'repo') }
        ];
        const read = readPersonal(hub, SCAN, roots, CATALOG);
        expect(read.personal.map((one) => one.source)).toEqual([
            { kind: 'root', key: 'first', dir },
            { kind: 'root', key: 'second', dir: join(dir, '..', 'repo') }
        ]);
    });

    it('draws a root whose path holds a space, with the key and the directory as given', () => {
        const { hub, dir } = repository(manifest({ title: 'Spaced' }), 'my repo');
        const snapshot = buildPortfolio(hub, configOver(), 0, [{ key: 'my-repo', dir }]);
        expect(snapshot.entities.personal['root:my-repo'].source).toEqual({
            kind: 'root',
            key: 'my-repo',
            dir
        });
        expect(snapshot.entities.personal['root:my-repo'].file).toBe(
            join(dir, '.oculus', 'project.yml')
        );
    });

    it('keeps a root key that is also a hub slug as two cards', () => {
        const { dir } = repository(manifest({ title: 'Root x' }));
        const hub = hubWith({ 'side-projects/x/project.yml': manifest({ title: 'Hub x' }) });
        const snapshot = buildPortfolio(hub, configOver(), 0, [{ key: 'x', dir }]);
        expect(ids(snapshot)).toEqual(['root:x', 'side:x']);
    });
});

describe('the fields of a manifest', () => {
    /** The first side project of a hub whose one folder holds this body, with its findings. */
    function readBody(body: string): {
        project: Snapshot['entities']['personal'][string];
        messages: string[];
    } {
        const hub = hubWith({ 'side-projects/slug/project.yml': body });
        const snapshot = buildPortfolio(hub, configOver());
        return {
            project: snapshot.entities.personal['side:slug'],
            messages: snapshot.findings
                .filter((one) => one.file.endsWith('side-projects/slug/project.yml'))
                .map((one) => one.message)
        };
    }

    const word = (key: string, ...args: (string | number)[]): string =>
        findingText(CATALOG, `findings.manifests.${key}`, ...args);

    it('reads the five fields', () => {
        const { project, messages } = readBody(
            manifest({ links: '[https://x.org, notes.md]', status: 'building' })
        );
        expect(messages).toEqual([]);
        expect(project).toEqual({
            id: 'side:slug',
            title: 'A side project',
            status: 'building',
            eli5: 'What it is.',
            next: 'What comes next.',
            links: ['https://x.org', 'notes.md'],
            source: { kind: 'hub', folder: 'side-projects/slug' },
            file: expect.stringMatching(/side-projects\/slug\/project\.yml$/) as string
        });
    });

    it('trims the title and keeps eli5 and next as the text they are', () => {
        const { project } = readBody(
            manifest({ title: '"  Spaced title  "', eli5: "'<b>x</b>'", next: '""' })
        );
        expect(project.title).toBe('Spaced title');
        expect(project.eli5).toBe('<b>x</b>');
        expect(project.next).toBe('');
    });

    it.each(['done', 'Running', '3', '""', 'null'])(
        'names status %s and draws it as unknown',
        (value) => {
            const { project, messages } = readBody(manifest({ status: value }));
            expect(project.status).toBe('unknown');
            expect(messages).toHaveLength(1);
            const shown = value === '""' || value === 'null' ? '' : value;
            expect(messages[0]).toBe(word('personal_status', shown, STATUSES.join(', ')));
        }
    );

    it('names a manifest with no status at all', () => {
        const hub = hubWith({
            'side-projects/slug/project.yml': 'title: T\neli5: e\nnext: n\nlinks: []\n'
        });
        const snapshot = buildPortfolio(hub, configOver());
        expect(snapshot.entities.personal['side:slug'].status).toBe('unknown');
        expect(aboutSide(snapshot).map((one) => one.message)).toEqual([
            word('personal_status', '', STATUSES.join(', '))
        ]);
    });

    it('reads a status of the vocabulary exactly', () => {
        for (const status of STATUSES) {
            const { project, messages } = readBody(manifest({ status }));
            expect(project.status).toBe(status);
            expect(messages).toEqual([]);
        }
    });

    it.each([
        ['missing', null],
        ['empty', "''"],
        ['blank', "'   '"],
        ['a list', '[a]'],
        ['a number', '3']
    ])('falls back to the folder name for a title that is %s', (_name, value) => {
        const body =
            value === null
                ? 'status: idea\neli5: e\nnext: n\nlinks: []\n'
                : manifest({ title: value });
        const { project, messages } = readBody(body);
        expect(project.title).toBe('slug');
        expect(messages).toEqual([word('personal_no_title', 'slug')]);
    });

    it.each(['venue', 'type', 'id'])('names key %s once, with no research finding', (key) => {
        const { project, messages } = readBody(`${manifest()}${key}: slug\n`);
        expect(project.title).toBe('A side project');
        expect(messages).toEqual([word('personal_key', key)]);
    });

    it.each(['eli5', 'next'])('reads %s that is not a text as empty and names it', (field) => {
        const { project, messages } = readBody(manifest({ [field]: '[a]' }));
        expect((project as unknown as Record<string, string>)[field]).toBe('');
        expect(messages).toEqual([word('personal_field_type', field)]);
    });

    it('keeps the links that are texts and names the rest', () => {
        const mixed = readBody(manifest({ links: '[https://x.org, 3, javascript:alert(1)]' }));
        expect(mixed.project.links).toEqual(['https://x.org', 'javascript:alert(1)']);
        expect(mixed.messages).toEqual([word('personal_links')]);

        const scalar = readBody(manifest({ links: 'x' }));
        expect(scalar.project.links).toEqual([]);
        expect(scalar.messages).toEqual([word('personal_links')]);
    });
});

describe('sideProject', () => {
    const raw = (data: Record<string, unknown>): RawPersonal => ({
        source: { kind: 'hub', folder: 'side-projects/s' },
        file: '/hub/side-projects/s/project.yml',
        data
    });

    it('is the same reading for both sources: the repository takes the key as its fallback title', () => {
        const root: RawPersonal = {
            source: { kind: 'root', key: 'k', dir: '/r' },
            file: '/r/.oculus/project.yml',
            data: { status: 'idea' }
        };
        const one = sideProject(root, STATUSES);
        expect(one.project.id).toBe('root:k');
        expect(one.project.title).toBe('k');
        expect(one.problems.map((problem) => problem.word)).toEqual(['no_title']);
    });

    it('checks no status when the config holds no vocabulary', () => {
        const one = sideProject(raw({ title: 'T', status: 'anything' }), undefined);
        expect(one.project.status).toBe('anything');
        expect(one.problems).toEqual([]);
    });

    it('words every problem from the catalog, sorted by file then key', () => {
        const findings = personalFindings(
            [raw({ status: 'x', venue: 1, links: 'l' })],
            STATUSES,
            CATALOG
        );
        expect(findings.map((one) => one.key)).toEqual(['links', 'status', 'title', 'venue']);
        expect(findings.every((one) => one.file === '/hub/side-projects/s/project.yml')).toBe(true);
        expect(findings.every((one) => !one.message.startsWith('findings.'))).toBe(true);
    });
});

describe('a side project on the research surfaces', () => {
    it('is on no board, no lane and no audit scan, and the idea beside it is on all of them', () => {
        const hub = hubWith({
            'side-projects/x/project.yml': manifest({ title: 'X Tool' }),
            'projects/ideas/y/project.yml': 'title: Y\ntype: idea\nfocus: run\n',
            'site/publications.yml': 'journal:\n  papers:\n    - { title: "X Tool" }\n'
        });
        const snapshot = buildPortfolio(hub, configOver());
        const boards = ['projects', 'coauthor', 'archive'].flatMap((view) =>
            boardItems(snapshot, presetFor(view, MERGED)).map((item) => item.id)
        );
        expect(boards).toEqual(['y']);
        expect(Object.values(snapshot.entities.projects).map((one) => one.id)).toEqual(['y']);
        expect(Object.keys(snapshot.entities.personal)).toEqual(['side:x']);

        const found = auditFindings({
            hub,
            projects: Object.values(snapshot.entities.projects),
            collections: Object.values(snapshot.entities.collections),
            rules: { ...auditRules(MERGED), publicationsFile: 'site/publications.yml' },
            catalog: CATALOG
        });
        const unmatched = found.find((one) =>
            one.message.includes('not matched to any hub project')
        );
        expect(unmatched?.message).toContain('"X Tool"');
    });
});
