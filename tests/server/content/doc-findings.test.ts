// The `docs:` list of config/layout.yml against the hub on disk: which entry is a finding and what
// each finding names. Every hub here is synthetic, under the system temporary directory, and every
// path written is asserted to be inside it first.

import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';
import { describe, expect } from 'vitest';
import { docFindings } from '../../../src/lib/server/content/docs.ts';
import { it, scratchDir } from '../../fixtures/scratch.ts';

function scratch(): string {
    const dir = scratchDir('oculus-docs-');
    return dir;
}

describe('the documents of layout.yml against the disk', () => {
    const FILE = '/engine/config/layout.yml';

    /** A hub holding the files named, under the temporary directory. */
    function hubWith(names: string[]): string {
        const dir = scratch();
        for (const name of names) {
            const file = join(dir, name);
            expect(resolve(file).startsWith(resolve(dir) + sep)).toBe(true);
            mkdirSync(join(file, '..'), { recursive: true });
            writeFileSync(file, '# One\n');
        }
        return dir;
    }

    it('reports nothing for a list whose every file is there, and nothing for no list at all', () => {
        const hub = hubWith(['ONE.md', 'notes/two.md']);
        const config = {
            docs: [
                { label: 'One', path: 'ONE.md', group: 'personal' },
                { label: 'Two', path: 'notes/two.md', group: 'system' }
            ]
        };
        expect(docFindings(config, hub, FILE)).toEqual([]);
        expect(docFindings({}, hub, FILE)).toEqual([]);
    });

    it('reports a path with no file at it, naming the document and the file it is configured in', () => {
        const hub = hubWith([]);
        const found = docFindings(
            { docs: [{ label: 'Gone', path: 'GONE.md', group: 'personal' }] },
            hub,
            FILE
        );
        expect(found).toHaveLength(1);
        expect(found[0].file).toBe(FILE);
        expect(found[0].key).toBe('Gone');
        expect(found[0].message).toContain('this document draws nothing');
    });

    it('reports a path that leaves the hub rather than reading it', () => {
        const hub = hubWith([]);
        const found = docFindings(
            { docs: [{ label: 'Out', path: '../elsewhere.md', group: 'personal' }] },
            hub,
            FILE
        );
        expect(found.map((finding) => finding.message)).toEqual([
            'the path ../elsewhere.md is not inside the hub'
        ]);
    });

    it('reports a group nav_groups does not name, a path that is not Markdown, and a directory', () => {
        const hub = hubWith(['ONE.md', 'ONE.yml', 'notes/two.md']);
        const groups = { nav_groups: { personal: { label: 'Personal' } } };
        expect(
            docFindings(
                { ...groups, docs: [{ label: 'One', path: 'ONE.md', group: 'nowhere' }] },
                hub,
                FILE
            ).map((one) => one.message)
        ).toEqual(['nav_groups names no group nowhere; this document trails the groups']);
        expect(
            docFindings(
                { ...groups, docs: [{ label: 'One', path: 'ONE.md', group: 'personal' }] },
                hub,
                FILE
            )
        ).toEqual([]);
        expect(
            docFindings(
                { docs: [{ label: 'Yaml', path: 'ONE.yml', group: 'personal' }] },
                hub,
                FILE
            )
                .filter((one) => one.message.includes('Markdown'))
                .map((one) => one.message)
        ).toEqual(['ONE.yml is not a Markdown file; this document draws nothing']);
        expect(
            docFindings({ docs: [{ label: 'Dir', path: 'notes', group: 'personal' }] }, hub, FILE)
                .filter((one) => one.message.includes('directory'))
                .map((one) => one.message)
        ).toEqual([`${join(hub, 'notes')} is a directory; this document draws nothing`]);
    });

    it('reports an entry that is not a list, a map, or three strings', () => {
        const hub = hubWith([]);
        expect(docFindings({ docs: 'ONE.md' }, hub, FILE).map((one) => one.message)).toEqual([
            'docs is not a list'
        ]);
        expect(docFindings({ docs: ['ONE.md'] }, hub, FILE).map((one) => one.message)).toEqual([
            'a document is not a map of label, path and group'
        ]);
        expect(
            docFindings({ docs: [{ path: 'ONE.md' }] }, hub, FILE).map((one) => one.message)
        ).toEqual(['a document names no label or no group']);
        expect(
            docFindings({ docs: [{ label: 'One', group: 'personal' }] }, hub, FILE).map(
                (one) => one.message
            )
        ).toEqual(['the document names no path']);
    });
});
