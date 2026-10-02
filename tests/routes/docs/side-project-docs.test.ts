// What the /api/docs route answers for the slug of a side project: nothing, since the document
// reader looks a project up in the research tiers. The hub is synthetic, under the system
// temporary directory, and every path written is asserted to be inside it first.

import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';
import { describe, expect } from 'vitest';
import { handleDocs } from '../../../src/lib/server/content/docs.ts';
import type { DocTarget } from '../../../src/lib/server/content/docs.ts';
import { portfolioConfigFrom } from '../../../src/lib/data/index.ts';
import { engineDir, loadConfig } from '../../../src/lib/data/sources/config.ts';
import { fields } from '../../../src/lib/data/helpers/guards.ts';
import { it, scratchDir } from '../../fixtures/scratch.ts';

const HOST = '127.0.0.1:8791';

const README = '# Alpha\n\nA paragraph.\n';

/** A request as the page makes it. */
function request(query: string): Request {
    return new Request(`http://${HOST}/api/docs?${query}`, {
        headers: { host: HOST, origin: `http://${HOST}`, 'sec-fetch-site': 'same-origin' }
    });
}

/** A hub holding a manuscript and a side project, each with a README, under a scan of both. */
function hubWithSide(): DocTarget {
    const dir = scratchDir('oculus-side-docs-');
    for (const [folder, manifest] of [
        [join(dir, 'projects', 'manuscripts', 'alpha'), 'id: alpha\ntype: manuscript\n'],
        [join(dir, 'side-projects', 'x'), 'title: X\nstatus: idea\n']
    ]) {
        expect(resolve(folder).startsWith(resolve(dir) + sep)).toBe(true);
        mkdirSync(folder, { recursive: true });
        writeFileSync(join(folder, 'project.yml'), manifest);
        writeFileSync(join(folder, 'README.md'), README);
    }
    const real = portfolioConfigFrom(loadConfig(engineDir()).config, engineDir());
    return {
        hub: dir,
        engine: engineDir(),
        config: {
            ...real,
            scan: [
                { dir: 'projects/manuscripts', type: 'manuscript' },
                { dir: 'side-projects', type: 'side-project', optional: true }
            ]
        }
    };
}

describe('the document endpoint over a side project', () => {
    it('answers 404 for the slug of a side project when no portfolio was published', async () => {
        const into = hubWithSide();
        const response = handleDocs(request('project=x&name=README.md'), into);
        expect(response.status).toBe(404);
        expect(fields(await response.json()).error).toBe('no project with the id x');
        expect(handleDocs(request('project=alpha&name=README.md'), into).status).toBe(200);
    });
});
