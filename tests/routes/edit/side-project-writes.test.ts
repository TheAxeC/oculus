// Layer 2, route tests. The writes that look a project up by its id, over a hub whose scan carries
// the side-projects tier: none of them finds a side project under its slug, and none touches its
// manifest. The hub is synthetic, under the system temporary directory, and every path written is
// asserted to be inside it first.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';
import { describe, expect } from 'vitest';
import {
    writeManifest,
    writeSubtask,
    writeSubtaskAdd
} from '../../../src/lib/server/edit/writes.ts';
import { manifestValue } from '../../../src/lib/server/edit/writes/manifest.ts';
import type { PortfolioConfig } from '../../../src/lib/data/model/index.ts';
import { it } from '../../fixtures/scratch.ts';
import { configFor, hub } from '../../server/edit/writes-fixture.ts';

describe('a side project', () => {
    const SIDE = [
        'title: "A side project"',
        'status: idea',
        'eli5: ""',
        'next: ""',
        'links: []',
        ''
    ].join('\n');

    /** The hub with a side project beside the manuscript, and a scan that carries the tier. */
    function withSide(): { root: string; config: PortfolioConfig; file: string } {
        const root = hub();
        const file = join(root, 'side-projects', 'x', 'project.yml');
        expect(resolve(file).startsWith(resolve(root) + sep)).toBe(true);
        mkdirSync(join(root, 'side-projects', 'x'), { recursive: true });
        writeFileSync(file, SIDE);
        const config = configFor();
        const scan = [
            ...config.scan,
            { dir: 'side-projects', type: 'side-project', optional: true as const }
        ];
        return { root, config: { ...config, scan }, file };
    }

    it('is not found by the manifest write under its slug', () => {
        const { root, config, file } = withSide();
        const out = writeManifest(root, config, 'x', { title: 'Changed' });
        expect(out).toEqual({ found: false, changed: [], refused: [] });
        expect(readFileSync(file, 'utf8')).toBe(SIDE);
    });

    it('is not found by the subtask writes under its slug', () => {
        const { root, config, file } = withSide();
        const none = { found: false, changed: [], refused: [] };
        expect(writeSubtaskAdd(root, config, { id: 'x' }, { do: 'a' })).toEqual(none);
        expect(writeSubtask(root, config, { id: 'x' }, '0', 'done')).toEqual(none);
        expect(readFileSync(file, 'utf8')).toBe(SIDE);
    });

    it('is not a manifest the undo of a change record looks up', () => {
        const { root, config } = withSide();
        expect(manifestValue(root, config, 'x', 'title')).toEqual({ found: false, value: null });
        expect(manifestValue(root, config, 'alpha', 'title').found).toBe(true);
    });
});
