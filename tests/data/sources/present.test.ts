// Layer 1, data tests. readPresent against synthetic files in a temporary directory. Nothing
// outside it is read or written, and every write asserts its path is inside the temporary
// directory first.

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';
import { describe, expect } from 'vitest';
import { readPresent } from '../../../src/lib/data/sources/present.ts';
import { engineDir, loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';
import { it, scratchDir } from '../../fixtures/scratch.ts';

/** The catalog the findings are worded from: the one oculus ships, read as the server reads it. */
const CATALOG = textCatalog(loadConfig(engineDir()).config);

function scratch(): string {
    const dir = scratchDir('oculus-present-');
    return dir;
}

function write(root: string, rel: string, body: string): string {
    const full = join(root, rel);
    expect(resolve(full).startsWith(resolve(root) + sep)).toBe(true);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, body);
    return full;
}

/** A hub holding one project folder whose PRESENT.md is the body given. */
function project(body: string[]): { hub: string; folder: string } {
    const hub = scratch();
    write(hub, join('projects', 'active', 'alpha', 'PRESENT.md'), body.join('\n'));
    return { hub, folder: 'projects/active/alpha' };
}

const RICH = [
    '---',
    'present:',
    '  tag: { class: measured, text: Measured }',
    '  title: A headline',
    '  sub: A subtitle',
    '  hook: One sentence of framing.',
    '  eli5:',
    '    purpose: Why it is done.',
    '    plain: What it does.',
    "  equation: '\\min_{x} f(x)'",
    '  specs:',
    '    - { label: Model, value: "rank-(L,L,1)" }',
    '  panels:',
    '    - { diagram_html: "<div>a</div>", caption: A caption, explain: An explanation }',
    '  method:',
    '    - The first step.',
    '  results:',
    '    - The measured number.',
    '---',
    '',
    '# PRESENT, the narrative',
    '',
    'The body.',
    ''
];

describe('readPresent', () => {
    it('reads the front matter into one slide under the project id', () => {
        const paths = project(RICH);
        const { slides, findings } = readPresent(paths, 'alpha', CATALOG);
        expect(findings).toEqual([]);
        expect(slides).toHaveLength(1);
        expect(slides[0]).toMatchObject({
            id: 'alpha',
            projectId: 'alpha',
            tag: { class: 'measured', text: 'Measured' },
            title: 'A headline',
            sub: 'A subtitle',
            hook: 'One sentence of framing.',
            eli5: { purpose: 'Why it is done.', plain: 'What it does.' },
            equation: '\\min_{x} f(x)',
            specs: [{ label: 'Model', value: 'rank-(L,L,1)' }],
            panels: [
                { diagramHtml: '<div>a</div>', caption: 'A caption', explain: 'An explanation' }
            ],
            method: ['The first step.'],
            results: ['The measured number.']
        });
        // A slide was declared, so its narrative stays on disk and out of the snapshot.
        expect(slides[0].body).toBe(undefined);
    });
});
