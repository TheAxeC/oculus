// What the /api/docs route answers. The route itself is a single line handing the request to
// lib/server/docs.ts with the hub of local.yml, which is what this calls: handleDocs takes a Request
// and the hub to read, so every case here is one Request object.
//
// The hub is synthetic, under the system temporary directory, and every path written is asserted to
// be inside it first. What this does NOT cover: the browser painting the HTML, and target() reading
// the machine's own local.yml, which is exercised by the curl in the package's verification.

import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { describe, expect, it } from 'vitest';
import { handleDocs } from '../../src/lib/server/docs.ts';
import { portfolioConfigFrom } from '../../src/lib/data/index.ts';
import { engineDir, loadConfig } from '../../src/lib/data/sources/config.ts';
import type { DocTarget } from '../../src/lib/server/docs.ts';

const MANIFEST = 'id: alpha\ntype: manuscript\ntitle: "A title"\n';

const README = '# Alpha\n\nA paragraph.\n\n- first\n- second\n';

const WITH_FRONTMATTER = '---\nstage: run\n---\n\n# Alpha\n\nA paragraph.\n';

const HOST = '127.0.0.1:8791';

/** A hub holding one project with the documents named, each with the same body. */
function target(docs: Record<string, string> = { 'README.md': README }): DocTarget {
    const dir = mkdtempSync(join(tmpdir(), 'oculus-docs-'));
    expect(resolve(dir).startsWith(resolve(tmpdir()) + sep)).toBe(true);
    const folder = join(dir, 'projects', 'manuscripts', 'alpha');
    expect(resolve(folder).startsWith(resolve(dir) + sep)).toBe(true);
    mkdirSync(join(folder, 'code'), { recursive: true });
    writeFileSync(join(folder, 'project.yml'), MANIFEST);
    for (const [name, body] of Object.entries(docs)) {
        const path = join(folder, name);
        expect(resolve(path).startsWith(resolve(folder) + sep)).toBe(true);
        writeFileSync(path, body);
    }
    const real = portfolioConfigFrom(loadConfig(engineDir()).config);
    return {
        hub: dir,
        config: { ...real, scan: [{ dir: 'projects/manuscripts', type: 'manuscript' }] }
    };
}

/** A request as the page makes it, with whatever headers a case wants instead. */
function request(query: string, headers: Record<string, string> = {}): Request {
    return new Request(`http://${HOST}/api/docs?${query}`, {
        headers: {
            host: HOST,
            origin: `http://${HOST}`,
            'sec-fetch-site': 'same-origin',
            ...headers
        }
    });
}

describe('the document endpoint', () => {
    it('renders a README as HTML', async () => {
        const response = handleDocs(request('project=alpha&name=README.md'), target());
        expect(response.status).toBe(200);
        expect(response.headers.get('cache-control')).toBe('no-store');
        const body = (await response.json()) as { html: string; frontmatter: unknown };
        expect(body.html).toContain('<h1>Alpha</h1>');
        expect(body.html).toContain('<li>first</li>');
        expect(body.frontmatter).toBe(null);
    });

    it('gives back the frontmatter block, and renders what follows it', async () => {
        const into = target({ 'README.md': WITH_FRONTMATTER });
        const response = handleDocs(request('project=alpha&name=README.md'), into);
        expect(response.status).toBe(200);
        const body = (await response.json()) as { html: string; frontmatter: unknown };
        expect(body.frontmatter).toEqual({ stage: 'run' });
        expect(body.html).toContain('<h1>Alpha</h1>');
        expect(body.html).not.toContain('stage');
    });

    it('serves a document inside the project, not only the ones at its root', async () => {
        const into = target({ 'code/README.md': '# Deposit\n' });
        const response = handleDocs(request('project=alpha&name=code%2FREADME.md'), into);
        expect(response.status).toBe(200);
        expect((await response.json()).html).toContain('<h1>Deposit</h1>');
    });

    it('answers 404 for an id the reader does not know', async () => {
        const response = handleDocs(request('project=beta&name=README.md'), target());
        expect(response.status).toBe(404);
        expect((await response.json()).error).toBe('no project with the id beta');
    });

    it('answers 404 for a name outside the list, a path of its own included', async () => {
        const into = target();
        for (const name of ['NOTES.md', 'manuscript/main.pdf', '../../etc/passwd']) {
            const response = handleDocs(
                request(`project=alpha&name=${encodeURIComponent(name)}`),
                into
            );
            expect(response.status).toBe(404);
            expect((await response.json()).error).toBe(`not a document this route serves: ${name}`);
        }
    });

    it('answers 404 for a document the project does not have', async () => {
        const response = handleDocs(request('project=alpha&name=RESULTS.md'), target());
        expect(response.status).toBe(404);
        expect((await response.json()).error).toBe('document does not exist');
    });

    it('refuses a request from another origin', async () => {
        const response = handleDocs(
            request('project=alpha&name=README.md', {
                origin: 'http://example.test',
                'sec-fetch-site': 'cross-site'
            }),
            target()
        );
        expect(response.status).toBe(403);
        expect((await response.json()).error).toBe('the request did not come from this page');
    });
});
