// Layer 2, route tests. What the /api/diagrams/<name> route serves: one `.svg` file of an engine
// directory's docs/diagrams/, by name, and a 404 for every other name. The route itself is a single
// line handing the request to lib/server/content/diagrams.ts, which is what this reads.
//
// Every case builds its own engine directory under the system temporary directory and asserts each
// write stays inside it; nothing of the checkout's own docs/ is read. This does not cover the Help
// view drawing the answer.

import { mkdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';
import { describe, expect } from 'vitest';
import {
    DIAGRAM_DIR,
    diagramPath,
    serveDiagram
} from '../../../src/lib/server/content/diagrams.ts';
import { it, scratchDir } from '../../fixtures/scratch.ts';

const SVG = '<svg xmlns="http://www.w3.org/2000/svg"></svg>\n';

/** An engine directory whose docs/diagrams/ holds the named files, and a file beside the folder. */
function engine(names: string[]): string {
    const dir = scratchDir('oculus-diagrams-');
    const folder = join(dir, DIAGRAM_DIR);
    mkdirSync(folder, { recursive: true });
    for (const name of names) {
        const full = join(folder, name);
        expect(resolve(full).startsWith(resolve(folder) + sep)).toBe(true);
        writeFileSync(full, SVG);
    }
    writeFileSync(join(dir, 'outside.svg'), SVG);
    return dir;
}

describe('the diagram route', () => {
    it('serves a diagram of the folder as an SVG image that loads and runs nothing', async () => {
        const served = serveDiagram(engine(['layers.svg']), 'layers.svg');
        expect(served.status).toBe(200);
        expect(served.headers.get('content-type')).toBe('image/svg+xml');
        expect(served.headers.get('x-content-type-options')).toBe('nosniff');
        expect(served.headers.get('content-security-policy')).toContain("default-src 'none'");
        expect(await served.text()).toBe(SVG);
    });

    it('refuses every name that is not an svg file of the folder', () => {
        const dir = engine(['layers.svg', 'layers.dot', '.hidden.svg']);
        for (const name of [
            'layers.dot',
            '.hidden.svg',
            '../outside.svg',
            '..%2Foutside.svg',
            'Layers.svg',
            'layers.svg.dot',
            '',
            'missing.svg'
        ]) {
            expect(serveDiagram(dir, name).status, name).toBe(404);
        }
    });

    it('refuses a link in the folder that leads out of it', () => {
        const dir = engine([]);
        symlinkSync(join(dir, 'outside.svg'), join(dir, DIAGRAM_DIR, 'away.svg'));
        expect(diagramPath(dir, 'away.svg')).toBeNull();
        expect(serveDiagram(dir, 'away.svg').status).toBe(404);
    });

    it('refuses a docs or a diagrams folder that is a link out of the engine directory', () => {
        const away = engine(['layers.svg']);
        for (const linked of [DIAGRAM_DIR, 'docs']) {
            const dir = scratchDir('oculus-diagrams-linked-');
            mkdirSync(join(dir, 'docs'), { recursive: true });
            if (linked === 'docs') rmSync(join(dir, 'docs'), { recursive: true });
            symlinkSync(join(away, linked), join(dir, linked));
            expect(diagramPath(dir, 'layers.svg'), linked).toBeNull();
            expect(serveDiagram(dir, 'layers.svg').status, linked).toBe(404);
        }
    });

    it('refuses a folder that is not a file, and an engine with no diagrams folder', () => {
        const dir = engine([]);
        mkdirSync(join(dir, DIAGRAM_DIR, 'nested.svg'));
        expect(serveDiagram(dir, 'nested.svg').status).toBe(404);
        const bare = scratchDir('oculus-diagrams-bare-');
        expect(serveDiagram(bare, 'layers.svg').status).toBe(404);
    });
});
