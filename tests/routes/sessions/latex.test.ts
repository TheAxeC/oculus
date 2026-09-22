// GET /api/latex: the origin check, the id checked against the snapshot, and the answer for one
// project. The hub is a synthetic folder under the system temporary directory and the snapshot is
// the case's own, so nothing of the real hub is read and nothing at all is written outside it.

import { mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve, sep } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import {
    handleLatex,
    type LatexAnswer,
    type LatexTarget
} from '../../../src/lib/server/content/latex.ts';
import { scratchDir, sweepScratch } from '../../fixtures/scratch.ts';

afterAll(sweepScratch);

const HOST = '127.0.0.1:8791';

const HUB = scratchDir('oculus-latex-route-');
expect(resolve(HUB).startsWith(resolve(tmpdir()) + sep)).toBe(true);

const FOLDER = 'projects/manuscripts/alpha';

/** Write one file under the synthetic hub, checked to be inside it before anything is written. */
function write(rel: string, body: string): void {
    const full = join(HUB, rel);
    expect(resolve(full).startsWith(resolve(HUB) + sep)).toBe(true);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, body);
}

write(`${FOLDER}/manuscript/main.tex`, '\\documentclass{article}\n');
write(`${FOLDER}/manuscript/supplement.tex`, '\\documentclass{article}\n');
write(`${FOLDER}/manuscript/main.log`, './main.tex:5: Undefined control sequence.\n');

const TARGET: LatexTarget = {
    hub: HUB,
    project: (id) => (id === 'alpha' ? { folder: FOLDER } : null)
};

function request(query: string, origin = 'same-origin'): Request {
    return new Request(`http://${HOST}/api/latex${query}`, {
        headers: { host: HOST, 'sec-fetch-site': origin }
    });
}

async function answer(response: Response): Promise<Record<string, unknown>> {
    return (await response.json()) as Record<string, unknown>;
}

describe('GET /api/latex', () => {
    it('refuses a request from another origin', async () => {
        const response = handleLatex(request('?id=alpha', 'cross-site'), TARGET);

        expect(response.status).toBe(403);
        expect((await answer(response)).error).toBe('the request did not come from this page');
    });

    it('refuses a request naming no project', async () => {
        const response = handleLatex(request(''), TARGET);

        expect(response.status).toBe(400);
        expect((await answer(response)).error).toBe('no project id');
    });

    it('refuses an id the snapshot does not hold', async () => {
        const response = handleLatex(request('?id=nobody'), TARGET);

        expect(response.status).toBe(404);
        expect((await answer(response)).error).toBe('no project with the id nobody');
    });

    it('answers one row per main file, with the folder and the errors of the last build', async () => {
        const response = handleLatex(request('?id=alpha'), TARGET);

        expect(response.status).toBe(200);
        const body = (await response.json()) as LatexAnswer;
        expect(body.folder).toBe(FOLDER);
        expect(body.mains.map((one) => one.main)).toEqual(['main.tex', 'supplement.tex']);
        expect(body.mains[0].errors).toEqual([
            { file: 'main.tex', line: 5, message: 'Undefined control sequence.' }
        ]);
        expect(body.mains[0].pdf).toBeNull();
        expect(body.mains[1].log).toBeNull();
    });

    it('answers no rows for a project whose folder holds no manuscript', async () => {
        const target: LatexTarget = {
            hub: HUB,
            project: () => ({ folder: 'projects/ideas/beta' })
        };
        const response = handleLatex(request('?id=beta'), target);

        expect(response.status).toBe(200);
        expect((await answer(response)).mains).toEqual([]);
    });

    it('refuses a folder that would leave the hub', async () => {
        const target: LatexTarget = { hub: HUB, project: () => ({ folder: '../elsewhere' }) };
        const response = handleLatex(request('?id=away'), target);

        expect(response.status).toBe(404);
        expect((await answer(response)).error).toBe('the folder is not inside the hub');
    });
});
