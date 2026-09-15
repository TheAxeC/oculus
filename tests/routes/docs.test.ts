// What the /api/docs route answers. The route itself is a single line handing the request to
// lib/server/docs.ts with the hub of local.yml, which is what this calls: handleDocs takes a Request
// and the hub to read, so every case here is one Request object.
//
// The hub is synthetic, under the system temporary directory, and every path written is asserted to
// be inside it first. What this does NOT cover: the browser painting the HTML, and target() reading
// the machine's own local.yml, which is exercised by the curl in the package's verification.
//
// The project a request names is read from the portfolio the server holds, which the route takes
// from its own locals; the case below passes that reader itself, and the ones that pass none
// exercise the fallback that finds the folder under the scan rules.
//
// The other two shapes the route answers are here as well: a Markdown document of the hub, which is
// what the `docs:` list of config/layout.yml offers in the rail, and the manual, which is the one
// path of the engine directory this route opens.

import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { describe, expect, it } from 'vitest';
import { handleDocs } from '../../src/lib/server/docs.ts';
import { portfolioConfigFrom } from '../../src/lib/data/index.ts';
import { engineDir, loadConfig } from '../../src/lib/data/sources/config.ts';
import type { DocTarget } from '../../src/lib/server/docs.ts';
import type { Project } from '../../src/lib/data/model.ts';
import { fields } from '../../src/lib/data/guards.ts';

/** The one field of a project the document reader asks for, on an otherwise empty record. */
function project(folder: string): Project {
    return { folder } as Project;
}

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
        engine: engineDir(),
        config: { ...real, scan: [{ dir: 'projects/manuscripts', type: 'manuscript' }] }
    };
}

/** A hub holding the files named at its own top level, which is where a hub document sits. */
function hubWith(files: Record<string, string>): DocTarget {
    const into = target();
    for (const [name, body] of Object.entries(files)) {
        const path = join(into.hub, name);
        expect(resolve(path).startsWith(resolve(into.hub) + sep)).toBe(true);
        mkdirSync(join(path, '..'), { recursive: true });
        writeFileSync(path, body);
    }
    return into;
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
        expect(fields(await response.json()).html).toContain('<h1>Deposit</h1>');
    });

    it('answers 404 for an id the reader does not know', async () => {
        const response = handleDocs(request('project=beta&name=README.md'), target());
        expect(response.status).toBe(404);
        expect(fields(await response.json()).error).toBe('no project with the id beta');
    });

    it('answers 404 for a name outside the list, a path of its own included', async () => {
        const into = target();
        for (const name of ['NOTES.md', 'manuscript/main.pdf', '../../etc/passwd']) {
            const response = handleDocs(
                request(`project=alpha&name=${encodeURIComponent(name)}`),
                into
            );
            expect(response.status).toBe(404);
            expect(fields(await response.json()).error).toBe(
                `not a document this route serves: ${name}`
            );
        }
    });

    it('answers 404 for a document the project does not have', async () => {
        const into = target({ 'code/README.md': README });
        const response = handleDocs(request('project=alpha&name=README.md'), into);
        expect(response.status).toBe(404);
        expect(fields(await response.json()).error).toBe('document does not exist');
    });

    it('reads the folder from the portfolio the request carries, and no manifest at all', async () => {
        const into = target();
        // Nothing on this hub is a manifest any more, so a reader that scanned the tree would find
        // no project at all; the snapshot the server holds names the folder on its own.
        rmSync(join(into.hub, 'projects', 'manuscripts', 'alpha', 'project.yml'));
        const held: DocTarget = {
            ...into,
            project: (id) => (id === 'alpha' ? project('projects/manuscripts/alpha') : null)
        };
        const response = handleDocs(request('project=alpha&name=README.md'), held);
        expect(response.status).toBe(200);
        expect(fields(await response.json()).html).toContain('<h1>Alpha</h1>');
    });

    it('finds the folder under a nested scan rule when no portfolio was published', async () => {
        const dir = mkdtempSync(join(tmpdir(), 'oculus-docs-'));
        expect(resolve(dir).startsWith(resolve(tmpdir()) + sep)).toBe(true);
        const folder = join(dir, 'projects', 'coauthor', 'active', 'alpha');
        expect(resolve(folder).startsWith(resolve(dir) + sep)).toBe(true);
        mkdirSync(folder, { recursive: true });
        writeFileSync(join(folder, 'project.yml'), MANIFEST);
        writeFileSync(join(folder, 'README.md'), README);
        const real = portfolioConfigFrom(loadConfig(engineDir()).config);
        const into: DocTarget = {
            hub: dir,
            engine: engineDir(),
            config: { ...real, scan: [{ dir: 'projects/coauthor', nested: true }] }
        };
        const response = handleDocs(request('project=alpha&name=README.md'), into);
        expect(response.status).toBe(200);
        expect(fields(await response.json()).html).toContain('<h1>Alpha</h1>');
    });

    it('answers 404 for an id that is a path rather than a folder name', async () => {
        const response = handleDocs(
            request(`project=${encodeURIComponent('../alpha')}&name=README.md`),
            target()
        );
        expect(response.status).toBe(404);
        expect(fields(await response.json()).error).toBe('no project with the id ../alpha');
    });

    it('draws a figure beside a README through the file route', async () => {
        const response = handleDocs(
            request('project=alpha&name=README.md'),
            target({ 'README.md': '![one](figures/one.png)\n' })
        );
        expect(response.status).toBe(200);
        expect(fields(await response.json()).html).toContain(
            'src="/api/file/hub/projects/manuscripts/alpha/figures/one.png"'
        );
    });

    it('refuses a project document reached through a link out of the hub', () => {
        const into = target();
        const outside = mkdtempSync(join(tmpdir(), 'oculus-docs-outside-'));
        expect(resolve(outside).startsWith(resolve(tmpdir()) + sep)).toBe(true);
        writeFileSync(join(outside, 'secret.md'), '# Secret\n');
        const folder = join(into.hub, 'projects', 'manuscripts', 'alpha');
        rmSync(join(folder, 'README.md'), { force: true });
        symlinkSync(join(outside, 'secret.md'), join(folder, 'README.md'));

        const response = handleDocs(request('project=alpha&name=README.md'), into);
        expect(response.status).toBe(404);
        rmSync(outside, { recursive: true, force: true });
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
        expect(fields(await response.json()).error).toBe('the request did not come from this page');
    });
});

describe('a document of the hub', () => {
    const DOC = '# Approach\n\nA paragraph.\n';

    it('renders the Markdown the path names', async () => {
        const into = hubWith({ 'RESEARCH-APPROACH.md': DOC });
        const response = handleDocs(request('hub=RESEARCH-APPROACH.md'), into);
        expect(response.status).toBe(200);
        expect(response.headers.get('cache-control')).toBe('no-store');
        expect(fields(await response.json()).html).toContain('<h1>Approach</h1>');
    });

    it('draws a figure beside it through the file route, under the hub root', async () => {
        const into = hubWith({ 'notes/one.md': '![a](pictures/one.png)\n' });
        const response = handleDocs(request(`hub=${encodeURIComponent('notes/one.md')}`), into);
        expect(fields(await response.json()).html).toContain(
            'src="/api/file/hub/notes/pictures/one.png"'
        );
    });

    it('leaves a figure source that climbs out of the hub as the author wrote it', async () => {
        const into = hubWith({ 'one.md': '![a](../x.png)\n' });
        const response = handleDocs(request('hub=one.md'), into);
        const html = String(fields(await response.json()).html);
        expect(html).toContain('src="../x.png"');
        expect(html).not.toContain('/api/file/');
    });

    it('resolves a figure beside a document in a folder, whatever it climbs on the way', async () => {
        const into = hubWith({ 'notes/deep/one.md': '![a](../pictures/one.png)\n' });
        const response = handleDocs(
            request(`hub=${encodeURIComponent('notes/deep/one.md')}`),
            into
        );
        expect(fields(await response.json()).html).toContain(
            'src="/api/file/hub/notes/pictures/one.png"'
        );
    });

    it('leaves an address the browser resolves itself alone', async () => {
        const into = hubWith({ 'one.md': '![a](https://example.test/one.png)\n' });
        const response = handleDocs(request('hub=one.md'), into);
        expect(fields(await response.json()).html).toContain('src="https://example.test/one.png"');
    });

    it('answers 404 for a path that climbs out of the hub', async () => {
        const response = handleDocs(
            request(`hub=${encodeURIComponent('../elsewhere.md')}`),
            target()
        );
        expect(response.status).toBe(404);
        expect(fields(await response.json()).error).toBe('the document is not inside the hub');
    });

    it('refuses a document the hub reaches only through a link out of it', () => {
        const into = hubWith({});
        const outside = mkdtempSync(join(tmpdir(), 'oculus-docs-outside-'));
        expect(resolve(outside).startsWith(resolve(tmpdir()) + sep)).toBe(true);
        writeFileSync(join(outside, 'secret.md'), '# Secret\n');
        const link = join(into.hub, 'linked.md');
        expect(resolve(link).startsWith(resolve(into.hub) + sep)).toBe(true);
        symlinkSync(join(outside, 'secret.md'), link);

        const response = handleDocs(request('hub=linked.md'), into);
        expect(response.status).toBe(404);
        rmSync(outside, { recursive: true, force: true });
    });

    it('answers 404 for a file that is not Markdown, and for one that is not there', () => {
        const into = hubWith({ 'local.yml': 'hub: /elsewhere\n' });
        expect(handleDocs(request('hub=local.yml'), into).status).toBe(404);
        expect(handleDocs(request('hub=nothing.md'), into).status).toBe(404);
    });
});

describe('the manual', () => {
    it('is the HELP.md of the engine directory, rendered', async () => {
        const response = handleDocs(request('manual=1'), target());
        expect(response.status).toBe(200);
        const body = fields(await response.json());
        expect(typeof body.html).toBe('string');
        expect(body.html).toContain('<h1>Oculus</h1>');
    });

    it('takes no path, so a path beside it changes nothing', async () => {
        const response = handleDocs(
            request(`manual=1&hub=${encodeURIComponent('../elsewhere.md')}`),
            target()
        );
        expect(response.status).toBe(200);
        expect(fields(await response.json()).html).toContain('<h1>Oculus</h1>');
    });

    it('refuses a request from another origin', () => {
        const response = handleDocs(
            request('manual=1', { origin: 'http://example.test', 'sec-fetch-site': 'cross-site' }),
            target()
        );
        expect(response.status).toBe(403);
    });
});
