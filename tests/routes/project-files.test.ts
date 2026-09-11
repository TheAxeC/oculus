// What the /api/project-files route answers. The route itself is a single line handing the request
// to lib/server/project-files.ts with the hub of local.yml, which is what this calls:
// handleProjectFiles takes a Request and the hub to read, so every case here is one Request object.
//
// The hub is synthetic, under the system temporary directory, and every path written is asserted to
// be inside it first. What this does NOT cover: filesTarget() reading the machine's own local.yml,
// which is exercised by the curl in the package's verification.

import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { describe, expect, it } from 'vitest';
import { handleProjectFiles } from '../../src/lib/server/project-files.ts';
import { portfolioConfigFrom } from '../../src/lib/data/index.ts';
import { engineDir, loadConfig } from '../../src/lib/data/sources/config.ts';
import type { FilesTarget } from '../../src/lib/server/project-files.ts';

const MANIFEST = 'id: alpha\ntype: manuscript\ntitle: "A title"\n';

const HOST = '127.0.0.1:8791';

/** A hub holding one project with the files named, each with the same body. */
function target(files: string[] = ['README.md', 'code/run.py']): FilesTarget {
    const dir = mkdtempSync(join(tmpdir(), 'oculus-pfiles-'));
    expect(resolve(dir).startsWith(resolve(tmpdir()) + sep)).toBe(true);
    const folder = join(dir, 'projects', 'manuscripts', 'alpha');
    expect(resolve(folder).startsWith(resolve(dir) + sep)).toBe(true);
    mkdirSync(join(folder, 'code'), { recursive: true });
    writeFileSync(join(folder, 'project.yml'), MANIFEST);
    for (const name of files) {
        const path = join(folder, name);
        expect(resolve(path).startsWith(resolve(folder) + sep)).toBe(true);
        writeFileSync(path, 'a body\n');
    }
    const real = portfolioConfigFrom(loadConfig(engineDir()).config);
    return {
        hub: dir,
        config: { ...real, scan: [{ dir: 'projects/manuscripts', type: 'manuscript' }] },
        settings: { file_index: { enabled: true, max_per_project: 400, ext: ['.md', '.py'] } }
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

describe('the project-files route', () => {
    it('answers 400 when the request names no project', async () => {
        const response = handleProjectFiles(request(''), target());

        expect(response.status).toBe(400);
        expect(await body(response)).toEqual({ error: 'no project id' });
    });

    it('answers 404 for an id the hub does not hold', async () => {
        const response = handleProjectFiles(request('id=no-such'), target());

        expect(response.status).toBe(404);
        expect((await body(response)).error).toBe('no project with the id no-such');
    });

    it('answers the rows of the project it names', async () => {
        const response = handleProjectFiles(request('id=alpha'), target());
        const answer = await body(response);

        expect(response.status).toBe(200);
        expect(answer.folder).toBe('projects/manuscripts/alpha');
        expect(answer.truncated).toBe(false);
        const rows = answer.rows as { path: string; size: number; mtime: number }[];
        expect(rows.map((row) => row.path).sort()).toEqual(['README.md', 'code/run.py']);
        expect(rows.every((row) => row.size > 0 && row.mtime > 0)).toBe(true);
    });

    it('answers 200 with no rows for a project whose folder holds nothing listed', async () => {
        const response = handleProjectFiles(request('id=alpha'), target([]));

        expect(response.status).toBe(200);
        expect(await body(response)).toMatchObject({ rows: [], truncated: false });
    });

    it('refuses a request from another origin', async () => {
        const response = handleProjectFiles(
            request('id=alpha', { origin: 'http://example.invalid' }),
            target()
        );

        expect(response.status).toBe(403);
    });
});
