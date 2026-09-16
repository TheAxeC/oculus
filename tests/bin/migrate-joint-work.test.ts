// Layer 4, test. The split of a collaborations collection into the two registries and the joint-work
// collection, over a scratch hub: a row naming two organisations gives its person both keys, a second
// run writes the same bytes, and `--from` carries the rows of a file the hub no longer has onto people
// the registry already holds.

import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve, sep } from 'node:path';
import { spawnSync } from 'node:child_process';
import { parse } from 'yaml';
import { afterEach, describe, expect, it } from 'vitest';

const made: string[] = [];

function scratch(): string {
    const dir = mkdtempSync(join(tmpdir(), 'oculus-migrate-'));
    expect(resolve(dir).startsWith(resolve(tmpdir()) + sep)).toBe(true);
    made.push(dir);
    return dir;
}

afterEach(() => {
    for (const dir of made.splice(0)) rmSync(dir, { recursive: true, force: true });
});

function write(dir: string, relative: string, body: string): string {
    const file = join(dir, relative);
    expect(resolve(file).startsWith(resolve(dir) + sep)).toBe(true);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, body, 'utf8');
    return file;
}

/** One collaborations file with a two-organisation row, a one-organisation row and no row at all. */
const COLLABORATIONS = `title: Collaborations
schema: []
entries:
  - key: naesens
    title: "Maarten Naesens - KU Leuven / UZ Leuven"
    sub: "Transplant nephrology"
    status: exploring
    meta:
      - { label: Institution, value: "KU Leuven / UZ Leuven - Microbiology" }
      - { label: Role, value: "host candidate" }
    tags: [federated]

  - key: moreau
    title: "Yves Moreau - KU Leuven (ESAT-STADIUS)"
    sub: "Privacy-preserving ML"
    status: active
    meta:
      - { label: Institution, value: "KU Leuven - ESAT-STADIUS" }

  - key: pirmani
    title: "Ashkan Pirmani"
    sub: "Federated learning frameworks"
    status: active
`;

type PersonEntry = { key: string; affiliations?: string[] };

function people(hub: string): PersonEntry[] {
    const parsed: unknown = parse(readFileSync(join(hub, 'registries/people.yml'), 'utf8'));
    const entries = (parsed as { entries?: unknown }).entries;
    return Array.isArray(entries) ? (entries as PersonEntry[]) : [];
}

function run(...args: string[]): { status: number | null; stdout: string; stderr: string } {
    const out = spawnSync('node', ['bin/migrate-joint-work.mjs', ...args], {
        cwd: process.cwd(),
        encoding: 'utf8'
    });
    return { status: out.status, stdout: out.stdout, stderr: out.stderr };
}

describe('migrate-joint-work.mjs', () => {
    it('gives a person every organisation their Institution row names, the first one primary', () => {
        const hub = scratch();
        write(hub, 'network/collaborations.yml', COLLABORATIONS);

        const first = run(hub);
        expect(first.stderr).toBe('');
        expect(first.status).toBe(0);
        expect(first.stdout).toContain('registries/people.yml: 4 entries');

        const held = people(hub);
        expect(held.map((one) => one.key)).toEqual(['naesens', 'moreau', 'pirmani', 'axel-faes']);
        expect(held[0].affiliations).toEqual(['ku-leuven', 'uz-leuven']);
        expect(held[1].affiliations).toEqual(['ku-leuven']);
        expect(held[2].affiliations).toBeUndefined();

        // The second run reads what the first wrote and writes the same bytes back.
        const written = readFileSync(join(hub, 'registries/people.yml'), 'utf8');
        expect(run(hub).status).toBe(0);
        expect(readFileSync(join(hub, 'registries/people.yml'), 'utf8')).toBe(written);
    });

    it('carries the Institution rows of a handed-in file onto people the registry already holds', () => {
        const hub = scratch();
        // A hub already split, whose people carry the one key the list replaced and one organisation.
        write(
            hub,
            'registries/people.yml',
            'schema: []\nentries:\n  - key: "naesens"\n    name: "Maarten Naesens"\n    affiliation: "ku-leuven"\n\n  - key: "me"\n    name: "The Owner"\n    self: true\n'
        );
        write(
            hub,
            'registries/organisations.yml',
            'schema: []\nentries:\n  - key: "ku-leuven"\n    name: "KU Leuven"\n    kind: "university"\n    country: "BE"\n'
        );
        write(
            hub,
            'network/joint-work.yml',
            'schema: []\nentries:\n  - key: "transplant"\n    title: "Transplant nephrology"\n    person: "naesens"\n    status: "exploring"\n'
        );
        const from = write(hub, 'old-collaborations.yml', COLLABORATIONS);

        expect(run(hub, '--from', from).status).toBe(0);
        const held = people(hub);
        expect(held.map((one) => one.key)).toEqual(['naesens', 'me']);
        expect(held[0].affiliations).toEqual(['ku-leuven', 'uz-leuven']);
        // The row's second organisation joined the registry, with the first spelling it was given.
        const organisations: unknown = parse(
            readFileSync(join(hub, 'registries/organisations.yml'), 'utf8')
        );
        expect(
            (organisations as { entries: { key: string }[] }).entries.map((one) => one.key)
        ).toEqual(['ku-leuven', 'uz-leuven']);

        const written = readFileSync(join(hub, 'registries/people.yml'), 'utf8');
        expect(run(hub, '--from', from).status).toBe(0);
        expect(readFileSync(join(hub, 'registries/people.yml'), 'utf8')).toBe(written);
    });

    it('refuses a --from file that is not there, writing nothing', () => {
        const hub = scratch();
        write(hub, 'network/collaborations.yml', COLLABORATIONS);
        const out = run(hub, '--from', join(hub, 'no-such-file.yml'));
        expect(out.status).toBe(2);
        expect(out.stderr).toContain('no such file');
        expect(existsSync(join(hub, 'registries/people.yml'))).toBe(false);
    });
});
