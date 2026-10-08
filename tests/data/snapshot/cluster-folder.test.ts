// Layer 1, data tests. A manifest's `paths.cluster`, the folder on the cluster that holds the
// project's code, read the way the server reads a hub: a hub planted in a scratch directory, built
// through buildPortfolioWithSchemas, and the findings and the project list asserted. The sentence
// is looked up in the shipped catalog, so a finding whose catalog key is missing fails.

import { join } from 'node:path';
import { describe, expect } from 'vitest';
import { buildPortfolioWithSchemas, portfolioConfigFrom } from '../../../src/lib/data/index.ts';
import { findingText } from '../../../src/lib/data/helpers/finding-text.ts';
import { engineDir, loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';
import { it, plantScratch } from '../../fixtures/scratch.ts';

const ENGINE = engineDir();
const LOADED = loadConfig(ENGINE).config;
const CATALOG = textCatalog(LOADED);
const CONFIG = portfolioConfigFrom(LOADED);

const ROWS = [
    { row: 'a folder with a space', written: '"~/a b"', shown: '"~/a b"', found: true },
    { row: 'a folder with a semicolon', written: '"~/a;rm"', shown: '"~/a;rm"', found: true },
    {
        row: 'a folder that climbs out',
        written: '"~/projects/../x"',
        shown: '"~/projects/../x"',
        found: true
    },
    {
        row: 'a folder with no ~/ or /',
        written: '"projects/x"',
        shown: '"projects/x"',
        found: true
    },
    { row: 'a value that is no text', written: '7', shown: '7', found: true },
    {
        row: 'the code folder written from the home folder',
        written: '"~/projects/x/code"',
        shown: '',
        found: false
    },
    { row: 'an absolute folder', written: '"/home/u/p"', shown: '', found: false }
];

describe("a manifest's paths.cluster", () => {
    it.each(ROWS)('$row', ({ written, shown, found }) => {
        const file = join('projects/active/alpha/project.yml');
        const { snapshot } = buildPortfolioWithSchemas(
            plantScratch(
                'oculus-cluster-hub-',
                {
                    [file]: `id: alpha\ntype: active\ntitle: alpha\npaths:\n  cluster: ${written}\n`
                },
                ['projects/active']
            ),
            CONFIG
        );
        const about = snapshot.findings.filter((finding) => finding.key === 'paths.cluster');
        expect(CATALOG['findings.validate.bad_cluster']).toBeDefined();
        if (found) {
            expect(
                about.map((finding) => [
                    finding.file.split('/').slice(-3).join('/'),
                    finding.message
                ])
            ).toEqual([
                [
                    file.split('/').slice(-3).join('/'),
                    findingText(CATALOG, 'findings.validate.bad_cluster', shown)
                ]
            ]);
        } else {
            expect(about).toEqual([]);
        }
        expect(Object.keys(snapshot.entities.projects)).toEqual(['alpha']);
    });
});
