// What writeManifest does over a hub of its own: which requests it refuses, how a form value becomes
// a manifest value, and when the file is touched at all.
//
// The hub here is a synthetic one under the system temporary directory, and every path this file
// writes is asserted to be inside it before it is written; nothing in this file opens the real hub
// for writing, and the schema it checks against is the real config/manifest-schema.yml, so what the
// form offers and what the write accepts are the same list.

import { mkdirSync, mkdtempSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { describe, expect, it } from 'vitest';
import { coerce, insideHub, writeManifest } from '../../src/lib/server/writes.ts';
import { portfolioConfigFrom } from '../../src/lib/data/index.ts';
import { engineDir, loadConfig } from '../../src/lib/data/sources/config.ts';
import type { PortfolioConfig } from '../../src/lib/data/model.ts';

const MANIFEST = [
    'id: alpha',
    'type: manuscript',
    'title: "A title"',
    'pin: true',
    'year: 2026',
    'status:',
    '  chips: [submitted, lead]',
    '  line: "the line"',
    'program: [tensor]',
    ''
].join('\n');

/** The real schema and vocabulary over a scan that names one synthetic tier. */
function configFor(): PortfolioConfig {
    const real = portfolioConfigFrom(loadConfig(engineDir()).config);
    return { ...real, scan: [{ dir: 'projects/manuscripts', type: 'manuscript' }] };
}

/** A hub with one project in it, under the system temporary directory. */
function hub(manifest = MANIFEST): string {
    const dir = mkdtempSync(join(tmpdir(), 'oculus-writes-'));
    expect(resolve(dir).startsWith(resolve(tmpdir()) + sep)).toBe(true);
    const folder = join(dir, 'projects', 'manuscripts', 'alpha');
    expect(resolve(folder).startsWith(resolve(dir) + sep)).toBe(true);
    mkdirSync(folder, { recursive: true });
    writeFileSync(join(folder, 'project.yml'), manifest);
    return dir;
}

function manifestOf(root: string): string {
    return readFileSync(join(root, 'projects', 'manuscripts', 'alpha', 'project.yml'), 'utf8');
}

describe('what a write refuses', () => {
    it('says an id the hub does not hold was not found, and writes nothing', () => {
        const root = hub();
        const out = writeManifest(root, configFor(), 'nobody', { title: 'x' });
        expect(out).toEqual({ found: false, changed: [], refused: [] });
        expect(manifestOf(root)).toBe(MANIFEST);
    });

    it('refuses a field the manifest schema does not name', () => {
        const root = hub();
        const out = writeManifest(root, configFor(), 'alpha', { nonesuch: 'x' });
        expect(out.changed).toEqual([]);
        expect(out.refused).toEqual([
            { field: 'nonesuch', reason: 'the manifest schema does not name the field' }
        ]);
    });

    it('refuses the read-only fields and the map field', () => {
        const root = hub();
        const out = writeManifest(root, configFor(), 'alpha', {
            id: 'other',
            tier: 'archive',
            paths: 'x'
        });
        expect(out.changed).toEqual([]);
        expect(out.refused.map((one) => one.field).sort()).toEqual(['id', 'paths', 'tier']);
        expect(manifestOf(root)).toBe(MANIFEST);
    });

    it('writes only inside the hub scan directories', () => {
        const config = configFor();
        expect(insideHub('/hub', config, '/hub/projects/manuscripts/a/project.yml')).toBe(true);
        expect(insideHub('/hub', config, '/hub/projects/ideas/a/project.yml')).toBe(false);
        expect(insideHub('/hub', config, '/etc/project.yml')).toBe(false);
        expect(insideHub('/hub', config, '/hub/projects/manuscripts/a/notes.yml')).toBe(false);
    });
});

describe('what a form value becomes', () => {
    it('makes a checkbox true or takes the key away', () => {
        expect(coerce('checkbox', 'on', undefined)).toEqual({ value: true });
        expect(coerce('checkbox', true, undefined)).toEqual({ value: true });
        expect(coerce('checkbox', false, true)).toEqual({ value: null });
        expect(coerce('checkbox', '', true)).toEqual({ value: null });
    });

    it('makes an empty text clear the field', () => {
        expect(coerce('text', '  ', 'held')).toEqual({ value: null });
        expect(coerce('textarea', '', 'held')).toEqual({ value: null });
    });

    it('keeps a number a number where the manifest holds one', () => {
        expect(coerce('text', '2027', 2026)).toEqual({ value: 2027 });
        expect(coerce('text', '2027', 'held')).toEqual({ value: '2027' });
    });

    it('splits a list widget into its items, dropping the empty ones', () => {
        expect(coerce('lines', 'one\n\n two ', undefined)).toEqual({ value: ['one', 'two'] });
        expect(coerce('chips', ['a', 'b'], undefined)).toEqual({ value: ['a', 'b'] });
        expect(coerce('tags', '', undefined)).toEqual({ value: null });
    });

    it('refuses a type it does not know', () => {
        expect(coerce('nonesuch', 'x', undefined)).toEqual({
            reason: 'unknown field type nonesuch'
        });
    });
});

describe('the file itself', () => {
    it('writes the changed field and nothing else', () => {
        const root = hub();
        const out = writeManifest(root, configFor(), 'alpha', { 'status.line': 'a new line' });
        expect(out).toEqual({ found: true, changed: ['status.line'], refused: [] });
        expect(manifestOf(root)).toBe(MANIFEST.replace('"the line"', '"a new line"'));
    });

    it('takes a ticked box off the file when it is unticked', () => {
        const root = hub();
        const out = writeManifest(root, configFor(), 'alpha', { pin: false });
        expect(out.changed).toEqual(['pin']);
        expect(manifestOf(root)).toBe(MANIFEST.replace('pin: true\n', ''));
    });

    it('does not touch the file when nothing changed', async () => {
        const root = hub();
        const before = statSync(join(root, 'projects', 'manuscripts', 'alpha', 'project.yml'));
        await new Promise((wake) => setTimeout(wake, 20));
        const out = writeManifest(root, configFor(), 'alpha', {
            title: 'A title',
            pin: true,
            'status.chips': ['submitted', 'lead']
        });
        const after = statSync(join(root, 'projects', 'manuscripts', 'alpha', 'project.yml'));
        expect(out).toEqual({ found: true, changed: [], refused: [] });
        expect(after.mtimeMs).toBe(before.mtimeMs);
    });
});
