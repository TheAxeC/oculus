// Layer 1, data tests. The snapshot build's read of a hub's decks
// (data/sources/documents/decks.ts): the findings a slide's `{{project.<field>}}` raises, which the
// Findings view lists, are the ones the deck route's read of the same deck raises, for a field
// whose record a second hub of the workspace holds too. The workspace is planted in a temporary
// directory (tests/fixtures/hubs/deck-hub.ts); nothing outside it is read or written.
// @module-tag slow: it builds two copies of the demo hub.

import { describe, expect } from 'vitest';
import { readDeck } from '../../../src/lib/server/content/deck/read.ts';
import { factsWorkspace } from '../../fixtures/hubs/deck-hub.ts';
import { it } from '../../fixtures/scratch.ts';

describe("the snapshot build's read of the decks", () => {
    it('raises for each {{project.<field>}} the finding the deck route raises, and none for a field with a value', () => {
        const { findings, source } = factsWorkspace();
        const placeholder = (message: string) => message.startsWith('{{project.');
        /** A finding by its place in the hub `hub` and its message, the deck route's paths real. */
        const line = (found: { file: string; line?: number; message: string }) =>
            `${found.file.slice(found.file.lastIndexOf('/hub/') + 5)}:${String(found.line)} ${found.message}`;
        const built = findings
            .filter((one) => placeholder(one.message))
            .map(line)
            .sort();
        const rows = [
            {
                row: 'a project whose venue holds a value',
                path: 'projects/manuscripts/hccnet/present',
                findings: [] as string[],
                title: 'At A*B_<x>'
            },
            {
                row: 'a project with no venue',
                path: 'projects/ideas/quantum/present',
                findings: [
                    'projects/ideas/quantum/present/main.md:1 {{project.venue}} holds no value for the project quantum; it is filled with nothing'
                ],
                title: 'Quantum'
            },
            {
                row: 'a project whose venue no registry holds',
                path: 'projects/manuscripts/ghost/present',
                findings: [
                    'projects/manuscripts/ghost/present/main.md:1 {{project.venue}} holds no value for the project ghost; it is filled with nothing'
                ],
                title: 'Ghost'
            },
            {
                row: 'a project with empty values',
                path: 'projects/manuscripts/empty/present',
                findings: [
                    'projects/manuscripts/empty/present/main.md:1 {{project.lead}} holds no value for the project empty; it is filled with nothing',
                    'projects/manuscripts/empty/present/main.md:1 {{project.venue}} holds no value for the project empty; it is filled with nothing',
                    'projects/manuscripts/empty/present/main.md:1 {{project.year}} holds no value for the project empty; it is filled with nothing'
                ],
                title: 'Empty'
            },
            {
                row: "a project whose venue and lead only a second hub's registries hold",
                path: 'projects/manuscripts/crossp/present',
                findings: [],
                title: 'At Lab J'
            }
        ];
        for (const one of rows) {
            const deck = readDeck(source, 'hub', one.path);
            if (deck === 'outside') throw new Error(`${one.path} is outside`);
            const read = deck.findings
                .filter((found) => placeholder(found.message))
                .map(line)
                .sort();
            expect(read, one.row).toEqual(one.findings);
            expect(
                built.filter((held) => held.startsWith(one.path)),
                one.row
            ).toEqual(one.findings);
            expect(deck.slides[0]?.title, one.row).toBe(one.title);
        }
    });
});
