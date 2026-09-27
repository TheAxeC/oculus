// What the /api/diagrams/<name> route serves: one `.svg` file of an engine directory's
// docs/diagrams/, by name, and a 404 for every other name. The route itself is a single line
// handing the request to lib/server/content/diagrams.ts, which is what this reads.
//
// Every case builds its own engine directory under the system temporary directory and asserts each
// write stays inside it; nothing of the checkout's own docs/ is read. This does not cover the Help
// view drawing the answer, which tests/browser/workbench/system.spec.ts does.

import { mkdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import {
    DIAGRAM_DIR,
    diagramPath,
    serveDiagram
} from '../../../src/lib/server/content/diagrams.ts';
import { scratchDir, sweepScratch } from '../../fixtures/scratch.ts';

afterAll(sweepScratch);

const SVG = '<svg xmlns="http://www.w3.org/2000/svg"></svg>\n';

/** An engine directory whose docs/diagrams/ holds the named files, and a file beside the folder. */
function engine(names: string[]): string {
    const dir = scratchDir('oculus-diagrams-');
    expect(resolve(dir).startsWith(resolve(tmpdir()) + sep)).toBe(true);
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

/** The headers a page of the app itself sends. */
function local(): Headers {
    return new Headers({ origin: 'http://127.0.0.1:8790', 'sec-fetch-site': 'same-origin' });
}

describe('the diagram route', () => {
    it('serves a diagram of the folder as an SVG image that loads and runs nothing', async () => {
        // revert: src/lib/server/content/diagrams.ts "'content-type': 'image/svg+xml'," => 'content-type': 'text/html',
        const served = serveDiagram(engine(['layers.svg']), 'layers.svg', local());
        expect(served.status).toBe(200);
        expect(served.headers.get('content-type')).toBe('image/svg+xml');
        expect(served.headers.get('x-content-type-options')).toBe('nosniff');
        expect(served.headers.get('content-security-policy')).toContain("default-src 'none'");
        expect(await served.text()).toBe(SVG);
    });

    it('refuses every name that is not an svg file of the folder', () => {
        // revert: src/lib/server/content/diagrams.ts "export const DIAGRAM_NAME = /^[a-z0-9][a-z0-9-]*\\.svg$/;" => export const DIAGRAM_NAME = /\.(svg|dot)$/;
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
            expect(serveDiagram(dir, name, local()).status, name).toBe(404);
        }
    });

    it('refuses a link in the folder that leads out of it', () => {
        // revert: src/lib/server/content/diagrams.ts "if (dirname(real) !== folder) return null;" => if (dirname(real) === '') return null;
        const dir = engine([]);
        symlinkSync(join(dir, 'outside.svg'), join(dir, DIAGRAM_DIR, 'away.svg'));
        expect(diagramPath(dir, 'away.svg')).toBeNull();
        expect(serveDiagram(dir, 'away.svg', local()).status).toBe(404);
    });

    it('refuses a docs or a diagrams folder that is a link out of the engine directory', () => {
        // revert: src/lib/server/content/diagrams.ts "const folder = join(realpathSync(engine), DIAGRAM_DIR);" => const folder = realpathSync(join(engine, DIAGRAM_DIR));
        const away = engine(['layers.svg']);
        for (const linked of [DIAGRAM_DIR, 'docs']) {
            const dir = scratchDir('oculus-diagrams-linked-');
            expect(resolve(dir).startsWith(resolve(tmpdir()) + sep)).toBe(true);
            mkdirSync(join(dir, 'docs'), { recursive: true });
            if (linked === 'docs') rmSync(join(dir, 'docs'), { recursive: true });
            symlinkSync(join(away, linked), join(dir, linked));
            expect(diagramPath(dir, 'layers.svg'), linked).toBeNull();
            expect(serveDiagram(dir, 'layers.svg', local()).status, linked).toBe(404);
        }
    });

    it('refuses a folder that is not a file, and an engine with no diagrams folder', () => {
        // revert: src/lib/server/content/diagrams.ts "return statSync(real).isFile() ? real : null;" => return real;
        const dir = engine([]);
        mkdirSync(join(dir, DIAGRAM_DIR, 'nested.svg'));
        expect(serveDiagram(dir, 'nested.svg', local()).status).toBe(404);
        const bare = scratchDir('oculus-diagrams-bare-');
        expect(resolve(bare).startsWith(resolve(tmpdir()) + sep)).toBe(true);
        expect(serveDiagram(bare, 'layers.svg', local()).status).toBe(404);
    });

    it('refuses a request from another origin', () => {
        // revert: src/lib/server/content/diagrams.ts "if (!sameOrigin(headers)) return new Response(null, { status: 403 });" => delete
        const other = new Headers({
            origin: 'https://example.com',
            'sec-fetch-site': 'cross-site'
        });
        expect(serveDiagram(engine(['layers.svg']), 'layers.svg', other).status).toBe(403);
    });
});
