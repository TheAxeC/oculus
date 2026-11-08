// Layer 1, data tests. The store of folder-glob matches the deck readers read through
// (data/sources/documents/folder-globs.ts): one walk of a pattern serves every reader over the
// store, and each reader raises its own findings and tests each matched folder for its
// `present.yml`, so what a read through a held key gives is what a fresh walk gives. The hub is
// planted in a temporary directory; nothing outside it is read or written.

import { globSync, mkdirSync, realpathSync, symlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect } from 'vitest';
import type { Deck } from '../../../src/lib/data/model/index.ts';
import { deckOrderOf } from '../../../src/lib/data/shapes/boards/order.ts';
import { engineDir, loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';
import type { DeckProject } from '../../../src/lib/data/sources/deck/kinds.ts';
import { createReader } from '../../../src/lib/data/sources/deck/read.ts';
import {
    folderGlobs,
    type FolderGlobs,
    type Walk
} from '../../../src/lib/data/sources/documents/folder-globs.ts';
import { it, plantScratch, scratchDir } from '../../fixtures/scratch.ts';

/** oculus's own merged config, read as the server reads it. */
const VOCAB = loadConfig(engineDir()).config;

/** One project of the hub, its deck at `projects/active/<id>/present`. */
function project(id: string): DeckProject {
    return {
        id,
        file: `projects/active/${id}/project.yml`,
        folder: `projects/active/${id}`,
        tier: 'research',
        chips: [],
        short: id,
        title: id,
        facts: []
    };
}

/** The deck of a project: one slide file. */
function deckFiles(id: string): Record<string, string> {
    return {
        [`projects/active/${id}/present/present.yml`]: 'order: [main.md]\n',
        [`projects/active/${id}/present/main.md`]: `# The ${id} slide\n`
    };
}

/** A portfolio deck whose one group finds its members by the globs `folders`. */
function portfolio(folders: string[]): Record<string, string> {
    return {
        'deck/present.yml': [
            'groups:',
            '    found:',
            `        find: { folders: [${folders.map((one) => `'${one}'`).join(', ')}] }`,
            '        discover: true',
            'order:',
            '    - title.md',
            '    - { slides: found }',
            ''
        ].join('\n'),
        'deck/title.md': '# Portfolio\n'
    };
}

/** A walk that counts its runs. */
function counted(): { walk: Walk; runs: () => number } {
    let runs = 0;
    return {
        walk: (pattern, options) => {
            runs += 1;
            return globSync(pattern, options);
        },
        runs: () => runs
    };
}

/** The portfolio deck of the hub at `dir`, read by a reader of its own over `globs`. */
function read(
    dir: string,
    ids: string[],
    globs: FolderGlobs,
    extra: { drafts?: ReadonlyMap<string, string>; keep?: ReadonlySet<string> } = {}
): Deck {
    const reader = createReader({
        hub: { key: 'hub', dir },
        projects: ids.map(project),
        tagTones: {},
        catalog: textCatalog(VOCAB),
        order: deckOrderOf(VOCAB),
        globs,
        ...extra
    });
    return reader.read({ key: 'hub', dir }, 'deck');
}

/** The folders of the members of the deck's group `found`. */
function members(deck: Deck): string[] {
    return (deck.groups.find((one) => one.name === 'found')?.members ?? [])
        .map((one) => one.path)
        .sort();
}

describe('the folder globs a deck group finds its members by, read through one store', () => {
    it('walks a pattern once for two readers over one store (case C1)', () => {
        const dir = plantScratch('oculus-deck-globs-', {
            ...portfolio(['projects/**/present']),
            ...deckFiles('a'),
            ...deckFiles('b')
        });
        const walks = counted();
        const globs = folderGlobs({ walk: walks.walk });
        const first = read(dir, ['a', 'b'], globs);
        const second = read(dir, ['a', 'b'], globs);
        expect(walks.runs()).toBe(1);
        expect(members(first)).toEqual(['projects/active/a/present', 'projects/active/b/present']);
        expect(second).toEqual(first);
    });

    it('gives the decks and the findings of a fresh walk through a held key, a pattern ending in present.yml among them (case C2)', () => {
        const dir = plantScratch('oculus-deck-globs-', {
            ...portfolio([
                'projects/active/a/present',
                'projects/active/b/present',
                'projects/*/c/present/present.yml'
            ]),
            ...deckFiles('a'),
            ...deckFiles('b'),
            ...deckFiles('c'),
            'projects/active/b/present/main.md': '---\nkind: text\n---\nno heading\n'
        });
        const globs = folderGlobs();
        read(dir, ['a', 'b', 'c'], globs);
        const held = read(dir, ['a', 'b', 'c'], globs);
        const fresh = read(dir, ['a', 'b', 'c'], folderGlobs());
        expect(members(held)).toEqual([
            'projects/active/a/present',
            'projects/active/b/present',
            'projects/active/c/present'
        ]);
        expect(held.findings.length).toBeGreaterThan(0);
        expect(held).toEqual(fresh);
    });

    it('reads a deck whose matched folder gets its present.yml after the walk, with no drop (case C8)', () => {
        const dir = plantScratch(
            'oculus-deck-globs-',
            { ...portfolio(['projects/*/*/present']), ...deckFiles('a') },
            ['projects/active/b/present']
        );
        const walks = counted();
        const globs = folderGlobs({ walk: walks.walk });
        expect(members(read(dir, ['a', 'b'], globs))).toEqual(['projects/active/a/present']);
        for (const [path, text] of Object.entries(deckFiles('b'))) {
            writeFileSync(join(dir, path), text);
        }
        expect(members(read(dir, ['a', 'b'], globs))).toEqual([
            'projects/active/a/present',
            'projects/active/b/present'
        ]);
        expect(walks.runs()).toBe(1);
    });

    it('raises the finding of a match that leaves the root through a link on every reader of the key (case C10)', () => {
        const outside = scratchDir('oculus-deck-globs-outside-');
        mkdirSync(join(outside, 'present'));
        writeFileSync(join(outside, 'present', 'present.yml'), 'order: [main.md]\n');
        const dir = plantScratch('oculus-deck-globs-', {
            ...portfolio(['projects/*/*/present']),
            ...deckFiles('a')
        });
        mkdirSync(join(dir, 'projects', 'active', 'away'));
        symlinkSync(join(outside, 'present'), join(dir, 'projects', 'active', 'away', 'present'));
        const globs = folderGlobs();
        const outsideOf = (deck: Deck): string[] =>
            deck.findings
                .filter((one) => one.key === 'find' && one.message.includes('away'))
                .map((one) => one.file);
        const first = read(dir, ['a'], globs);
        const second = read(dir, ['a'], globs);
        expect(outsideOf(first)).toEqual([join(realpathSync(dir), 'deck', 'present.yml')]);
        expect(outsideOf(second)).toEqual(outsideOf(first));
        expect(members(second)).toEqual(['projects/active/a/present']);
    });

    it('gives the slides of a fresh walk through a held key, for a read with drafts and a read with keep (case C12)', () => {
        const dir = plantScratch('oculus-deck-globs-', {
            ...portfolio(['projects/**/present']),
            ...deckFiles('a'),
            ...deckFiles('b')
        });
        const globs = folderGlobs();
        read(dir, ['a', 'b'], globs);
        const drafted = join(realpathSync(dir), 'projects/active/a/present/main.md');
        const drafts = new Map([[drafted, '# Drafted\n']]);
        const keep = new Set(['b']);
        const projects = (deck: Deck): (string | undefined)[] =>
            deck.slides.map((one) => one.project);
        const withDrafts = read(dir, ['a', 'b'], globs, { drafts });
        expect(JSON.stringify(withDrafts.slides)).toContain('Drafted');
        expect(withDrafts).toEqual(read(dir, ['a', 'b'], folderGlobs(), { drafts }));
        const kept = read(dir, ['a', 'b'], globs, { keep });
        expect(projects(kept)).toContain('b');
        expect(projects(kept)).not.toContain('a');
        expect(kept).toEqual(read(dir, ['a', 'b'], folderGlobs(), { keep }));
    });
});
