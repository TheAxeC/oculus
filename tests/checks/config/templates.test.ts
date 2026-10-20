// Layer 4, tree check. docs/templates.md against the lists whose keys its templates show: the
// config.yml template holds every key a hub's settings file may set (`hubKeys` of
// data/helpers/hub-names.ts) and no other, the local.yml template every key the options folder
// lists for local.yml (config/options/local.yml), and the project.yml template every field of
// config/schemas/manifest-schema.yml but the read-only ones, which the project's folder gives and
// no file holds. A key added to a list without its template line, or a template line whose key is
// gone from its list, fails its case. tests/checks/config/template-keys.ts reads the blocks.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';
import { engineDir } from '../../../src/lib/data/sources/config.ts';
import { hubKeys } from '../../../src/lib/data/helpers/hub-names.ts';
import { keyDifference, templateBlock, templateKeys } from './template-keys.ts';

const ENGINE = engineDir();
const PAGE = readFileSync(join(ENGINE, 'docs', 'templates.md'), 'utf8');

/** A YAML file of the engine folder, parsed. */
function engineYaml(path: string): Record<string, unknown> {
    return parse(readFileSync(join(ENGINE, path), 'utf8')) as Record<string, unknown>;
}

/** The keys of a map, or none for a value that is no map. */
function keysOf(value: unknown): string[] {
    return typeof value === 'object' && value !== null ? Object.keys(value) : [];
}

describe('the keys of a template', () => {
    it('are the leaves of a block, commented or not, with its examples left out', () => {
        const block = [
            '# A sentence: with a colon in it.',
            'tier: projects          # set',
            '# scan:',
            '#   - { dir: projects }',
            '# slurm:',
            '#   resource: ""',
            '# docs: []',
            '#   example:',
            '#   heart: { color: "#dc2626" }',
            '# wallpaper:',
            '#   image: ""'
        ].join('\n');
        expect(templateKeys(block)).toEqual([
            'docs',
            'scan',
            'slurm.resource',
            'tier',
            'wallpaper.image'
        ]);
    });

    it('differ from a list by the keys each lacks', () => {
        expect(
            keyDifference(['scan', 'slurm.resource', 'gone'], ['scan', 'slurm.resource', 'new'])
        ).toEqual({ missing: ['gone'], extra: ['new'] });
    });
});

describe('docs/templates.md', () => {
    it('shows every key of a hub settings file in the config.yml template, and no other', () => {
        const shown = templateKeys(templateBlock(PAGE, '## config.yml'));
        expect(keyDifference(hubKeys(), shown)).toEqual({ missing: [], extra: [] });
    });

    it('shows every local.yml key of the options folder in the local.yml template, and no other', () => {
        const listed = keysOf(engineYaml('config/options/local.yml').options);
        const shown = templateKeys(templateBlock(PAGE, '## local.yml'));
        expect(listed.length).toBeGreaterThan(0);
        expect(keyDifference(listed, shown)).toEqual({ missing: [], extra: [] });
    });

    it('shows every field of the manifest schema a file holds in the project.yml template', () => {
        const schema = engineYaml('config/schemas/manifest-schema.yml').manifest_schema as {
            fields: Record<string, { type?: string }>;
        };
        const held = Object.entries(schema.fields)
            .filter(([, field]) => field.type !== 'readonly')
            .map(([key]) => key);
        const shown = templateKeys(templateBlock(PAGE, '## project.yml'));
        expect(keyDifference(held, shown)).toEqual({ missing: [], extra: [] });
    });
});
