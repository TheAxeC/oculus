// Layer 2, route tests. What the /api/project-files route answers. The route itself is a single
// line handing the request to lib/server/files/project/project-files.ts with the primary hub of the
// open workspace, which is what this calls: handleProjectFiles takes a Request and the hub to read,
// so every case here is one Request object, and the walk under it (`projectFiles`), which leaves
// out the folders `file_index.skip_folders` names.
//
// The hub is synthetic, under the system temporary directory, and every path written is asserted to
// be inside it first. What this does NOT cover: filesTarget() reading the open workspace.
//
// A hook loads the configuration once, since the first load costs more than a later one, so no
// case pays for it.

import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';
import { describe, expect } from 'vitest';
import { warmConfig } from '../edit/write-fixture.ts';
import {
    handleProjectFiles,
    projectFiles
} from '../../../src/lib/server/files/project/project-files.ts';
import { portfolioConfigFrom } from '../../../src/lib/data/index.ts';
import { engineDir, loadConfig } from '../../../src/lib/data/sources/config.ts';
import type { FilesTarget } from '../../../src/lib/server/files/project/project-files.ts';
import { it, scratchDir, test } from '../../fixtures/scratch.ts';

const MANIFEST = 'id: alpha\ntier: research\nstage: exploring\ntitle: "A title"\n';

const HOST = '127.0.0.1:8791';

/** A hub holding one project with the files named, each with the same body. */
function target(files: string[] = ['README.md', 'code/run.py']): FilesTarget {
    const dir = scratchDir('oculus-pfiles-');
    const folder = join(dir, 'projects', 'manuscripts', 'alpha');
    expect(resolve(folder).startsWith(resolve(dir) + sep)).toBe(true);
    mkdirSync(join(folder, 'code'), { recursive: true });
    writeFileSync(join(folder, 'project.yml'), MANIFEST);
    for (const name of files) {
        const path = join(folder, name);
        expect(resolve(path).startsWith(resolve(folder) + sep)).toBe(true);
        writeFileSync(path, 'a body\n');
    }
    const shipped = loadConfig(engineDir()).config;
    const real = portfolioConfigFrom(shipped);
    return {
        primary: { key: 'hub', dir },
        config: { ...real, scan: [{ dir: 'projects/manuscripts' }] },
        settings: {
            ...shipped,
            file_index: { enabled: true, max_per_project: 400, ext: ['.md', '.py'] }
        }
    };
}

/** A request as the page makes it, with whatever headers a case wants instead. */
function request(query: string, headers: Record<string, string> = {}): Request {
    return new Request(`http://${HOST}/api/project-files?${query}`, {
        headers: { host: HOST, origin: `http://${HOST}`, ...headers }
    });
}

async function body(response: Response): Promise<Record<string, unknown>> {
    return (await response.json()) as Record<string, unknown>;
}

test.beforeAll(warmConfig);

describe('the project-files route', () => {
    it('answers 404 for an id the hub does not hold', async () => {
        const response = handleProjectFiles(request('id=no-such'), target());

        expect(response.status).toBe(404);
        expect((await body(response)).error).toBe('no project with the id no-such');
    });
});

describe('the walk of a project folder', () => {
    it('enters no folder the skip folders setting names, and enters the others (G13)', () => {
        const folder = scratchDir('oculus-pfiles-skip-');
        for (const name of ['a.md', 'vendor/v.md', 'node_modules/p/x.md']) {
            const path = join(folder, name);
            expect(resolve(path).startsWith(resolve(folder) + sep)).toBe(true);
            mkdirSync(join(path, '..'), { recursive: true });
            writeFileSync(path, 'a body\n');
        }
        const shipped = loadConfig(engineDir()).config;
        const index = { enabled: true, max_per_project: 400, ext: ['.md'] };
        const listed = projectFiles(folder, {
            ...shipped,
            file_index: { ...index, skip_folders: ['vendor'] }
        });
        expect(listed.rows.map((row) => row.path).sort()).toEqual(['a.md', 'node_modules/p/x.md']);
    });
});
