// What the /api/docs route answers. The route itself is a single line handing the request to
// lib/server/content/docs.ts with the hub of local.yml, which is what this calls: handleDocs takes
// a Request and the hub to read, so every case here is one Request object.
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
// what the `docs:` list of config/layout.yml lists in the view catalogue, and the manual, which is
// the one path of the engine directory this route opens.

import {
    cpSync,
    mkdirSync,
    rmSync,
    statSync,
    symlinkSync,
    utimesSync,
    writeFileSync
} from 'node:fs';
import { join, resolve, sep } from 'node:path';
import { describe, expect } from 'vitest';
import { PROCESS_TAG, handleDocs } from '../../../src/lib/server/content/docs.ts';
import { portfolioConfigFrom } from '../../../src/lib/data/index.ts';
import {
    LOCAL_NAME,
    engineDir,
    loadConfig,
    textCatalog
} from '../../../src/lib/data/sources/config.ts';
import type { DocTarget } from '../../../src/lib/server/content/docs.ts';
import type { Project } from '../../../src/lib/data/model/index.ts';
import { fields } from '../../../src/lib/data/helpers/guards.ts';
import { it, scratchDir } from '../../fixtures/scratch.ts';

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
    const dir = scratchDir('oculus-docs-');
    const folder = join(dir, 'projects', 'manuscripts', 'alpha');
    expect(resolve(folder).startsWith(resolve(dir) + sep)).toBe(true);
    mkdirSync(join(folder, 'code'), { recursive: true });
    writeFileSync(join(folder, 'project.yml'), MANIFEST);
    for (const [name, body] of Object.entries(docs)) {
        const path = join(folder, name);
        expect(resolve(path).startsWith(resolve(folder) + sep)).toBe(true);
        writeFileSync(path, body);
    }
    const real = portfolioConfigFrom(loadConfig(engineDir()).config, engineDir());
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
        expect(body.html).toContain('<h1 id="user-content-alpha">Alpha</h1>');
        expect(body.html).toContain('<li>first</li>');
        expect(body.frontmatter).toBe(null);
    });

    it('gives back the frontmatter block, and renders what follows it', async () => {
        const into = target({ 'README.md': WITH_FRONTMATTER });
        const response = handleDocs(request('project=alpha&name=README.md'), into);
        expect(response.status).toBe(200);
        const body = (await response.json()) as { html: string; frontmatter: unknown };
        expect(body.frontmatter).toEqual({ stage: 'run' });
        expect(body.html).toContain('<h1 id="user-content-alpha">Alpha</h1>');
        expect(body.html).not.toContain('stage');
    });

    it('serves a document inside the project, not only the ones at its root', async () => {
        const into = target({ 'code/README.md': '# Deposit\n' });
        const response = handleDocs(request('project=alpha&name=code%2FREADME.md'), into);
        expect(response.status).toBe(200);
        expect(fields(await response.json()).html).toContain(
            '<h1 id="user-content-deposit">Deposit</h1>'
        );
    });

    it('answers 404 for an id the reader does not know', async () => {
        const response = handleDocs(request('project=beta&name=README.md'), target());
        expect(response.status).toBe(404);
        expect(fields(await response.json()).error).toBe('no project with the id beta');
    });

    it("serves a project's PRESENT.md as its narrative, the front matter split off", async () => {
        const into = target({
            'README.md': README,
            'PRESENT.md': '---\npresent:\n  title: A headline\n---\n\n# PRESENT\n\nThe narrative.\n'
        });
        const response = handleDocs(request('project=alpha&name=PRESENT.md'), into);
        expect(response.status).toBe(200);
        const body = fields(await response.json());
        expect(body.html).toContain('The narrative.');
        expect(body.html).not.toContain('A headline');
        expect(fields(body.frontmatter).present).toEqual({ title: 'A headline' });
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
        expect(fields(await response.json()).html).toContain(
            '<h1 id="user-content-alpha">Alpha</h1>'
        );
    });

    it('finds the folder under a nested scan rule when no portfolio was published', async () => {
        const dir = scratchDir('oculus-docs-');
        const folder = join(dir, 'projects', 'coauthor', 'active', 'alpha');
        expect(resolve(folder).startsWith(resolve(dir) + sep)).toBe(true);
        mkdirSync(folder, { recursive: true });
        writeFileSync(join(folder, 'project.yml'), MANIFEST);
        writeFileSync(join(folder, 'README.md'), README);
        const real = portfolioConfigFrom(loadConfig(engineDir()).config, engineDir());
        const into: DocTarget = {
            hub: dir,
            engine: engineDir(),
            config: { ...real, scan: [{ dir: 'projects/coauthor', nested: true }] }
        };
        const response = handleDocs(request('project=alpha&name=README.md'), into);
        expect(response.status).toBe(200);
        expect(fields(await response.json()).html).toContain(
            '<h1 id="user-content-alpha">Alpha</h1>'
        );
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
        const outside = scratchDir('oculus-docs-outside-');
        writeFileSync(join(outside, 'secret.md'), '# Secret\n');
        const folder = join(into.hub, 'projects', 'manuscripts', 'alpha');
        rmSync(join(folder, 'README.md'), { force: true });
        symlinkSync(join(outside, 'secret.md'), join(folder, 'README.md'));

        const response = handleDocs(request('project=alpha&name=README.md'), into);
        expect(response.status).toBe(404);
        rmSync(outside, { recursive: true, force: true });
    });
});

describe('a document of the hub', () => {
    const DOC = '# Approach\n\nA paragraph.\n';

    it('renders the Markdown the path names', async () => {
        const into = hubWith({ 'RESEARCH-APPROACH.md': DOC });
        const response = handleDocs(request('hub=RESEARCH-APPROACH.md'), into);
        expect(response.status).toBe(200);
        expect(response.headers.get('cache-control')).toBe('no-store');
        expect(fields(await response.json()).html).toContain(
            '<h1 id="user-content-approach">Approach</h1>'
        );
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
        const outside = scratchDir('oculus-docs-outside-');
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

    it('answers 404 for a missing document while the sentence file does not parse', async () => {
        const engine = scratchDir('oculus-docs-engine-');
        cpSync(join(engineDir(), 'config'), join(engine, 'config'), {
            recursive: true,
            filter: (source) => !source.endsWith(LOCAL_NAME)
        });
        writeFileSync(join(engine, 'config', 'text', 'findings.yml'), 'text: [\n');
        const into = hubWith({});
        const text = textCatalog(loadConfig(engine).config);
        const response = handleDocs(request('hub=nothing.md'), {
            ...into,
            config: { ...into.config, text }
        });
        expect(response.status).toBe(404);
        expect(await response.json()).toEqual({
            error: 'findings.docs.missing',
            file: resolve(join(into.hub, 'nothing.md'))
        });
    });
});

describe('a re-read of an unchanged file', () => {
    const DOC = '# Approach\n\nA paragraph.\n';

    /** The tag a request answered with, asserted to be there. */
    function tagOf(response: Response): string {
        const tag = response.headers.get('etag');
        expect(tag).not.toBe(null);
        return tag ?? '';
    }

    it('answers with a tag of the process, the size and the modification time, and the file', async () => {
        const into = hubWith({ 'docs/one.md': DOC });
        const file = join(into.hub, 'docs', 'one.md');
        const stat = statSync(file);
        const response = handleDocs(request(`hub=${encodeURIComponent('docs/one.md')}`), into);
        expect(response.status).toBe(200);
        expect(tagOf(response)).toBe(
            `"${PROCESS_TAG}-${String(stat.size)}-${String(stat.mtimeMs)}"`
        );
        expect(fields(await response.json()).file).toBe(resolve(file));
    });

    it('answers 304 with no body to a request holding the current tag', async () => {
        const into = hubWith({ 'docs/one.md': DOC });
        const query = `hub=${encodeURIComponent('docs/one.md')}`;
        const tag = tagOf(handleDocs(request(query), into));

        const again = handleDocs(request(query, { 'if-none-match': tag }), into);
        expect(again.status).toBe(304);
        expect(again.headers.get('etag')).toBe(tag);
        expect(await again.text()).toBe('');
    });

    it('renders again for a tag an earlier server process answered with, the file unchanged', async () => {
        const into = hubWith({ 'docs/one.md': DOC });
        const query = `hub=${encodeURIComponent('docs/one.md')}`;
        const stat = statSync(join(into.hub, 'docs', 'one.md'));
        // What a page open across a restart holds: the tag of the same file, rendered by a
        // process whose renderer may differ from this one's.
        const earlier = `"${String(stat.size)}-${String(stat.mtimeMs)}"`;
        const other = `"another-process-${String(stat.size)}-${String(stat.mtimeMs)}"`;
        for (const held of [earlier, other]) {
            const again = handleDocs(request(query, { 'if-none-match': held }), into);
            expect(again.status).toBe(200);
            expect(tagOf(again)).not.toBe(held);
            expect(fields(await again.json()).html).toContain('Approach');
        }
    });

    it('renders again once the file changed under the tag the page holds', async () => {
        const into = hubWith({ 'docs/one.md': DOC });
        const query = `hub=${encodeURIComponent('docs/one.md')}`;
        const tag = tagOf(handleDocs(request(query), into));
        const file = join(into.hub, 'docs', 'one.md');
        expect(resolve(file).startsWith(resolve(into.hub) + sep)).toBe(true);
        writeFileSync(file, '# Approach, longer now\n');
        utimesSync(file, new Date(2030, 0, 1), new Date(2030, 0, 1));

        const again = handleDocs(request(query, { 'if-none-match': tag }), into);
        expect(again.status).toBe(200);
        expect(tagOf(again)).not.toBe(tag);
        expect(fields(await again.json()).html).toContain('longer now');

        // The same request with the new tag is the unchanged file again.
        const settled = handleDocs(request(query, { 'if-none-match': tagOf(again) }), into);
        expect(settled.status).toBe(304);
    });

    it('answers 304 for the manual and a project document the same way', () => {
        const into = target();
        for (const query of ['manual=1', 'project=alpha&name=README.md']) {
            const tag = tagOf(handleDocs(request(query), into));
            expect(handleDocs(request(query, { 'if-none-match': tag }), into).status).toBe(304);
        }
    });

    it('never answers 304 for a file that is not there, whatever tag is sent', async () => {
        const into = hubWith({});
        const response = handleDocs(request('hub=nothing.md', { 'if-none-match': '""' }), into);
        expect(response.status).toBe(404);
        // A refusal carries no tag, so the page holds none for the next request.
        expect(response.headers.get('etag')).toBe(null);
        expect(fields(await response.json()).file).toBe(resolve(join(into.hub, 'nothing.md')));
    });
});

describe('the manual', () => {
    it('is the HELP.md of the engine directory, rendered', async () => {
        const response = handleDocs(request('manual=1'), target());
        expect(response.status).toBe(200);
        const body = fields(await response.json());
        expect(typeof body.html).toBe('string');
        expect(body.html).toContain('<h1 id="user-content-oculus">Oculus</h1>');
    });

    it('takes no path, so a path beside it changes nothing', async () => {
        const response = handleDocs(
            request(`manual=1&hub=${encodeURIComponent('../elsewhere.md')}`),
            target()
        );
        expect(response.status).toBe(200);
        expect(fields(await response.json()).html).toContain(
            '<h1 id="user-content-oculus">Oculus</h1>'
        );
    });
});

describe("a figure's address in a project's README", () => {
    /** The rendered README of a project holding the one Markdown line given. */
    async function drawnReadme(line: string): Promise<string> {
        const response = handleDocs(
            request('project=alpha&name=README.md'),
            target({ 'README.md': `${line}\n` })
        );
        expect(response.status).toBe(200);
        return String(fields(await response.json()).html);
    }

    it('draws a relative source as the file route address, with its alt and its title', async () => {
        expect(await drawnReadme('![a](fig.png "t")')).toContain(
            '<img src="/api/file/hub/projects/manuscripts/alpha/fig.png" alt="a" title="t">'
        );
    });

    it('keeps an address the browser resolves itself', async () => {
        const html = await drawnReadme('![a](https://x.org/p.png)');
        expect(html).toContain('<img src="https://x.org/p.png" alt="a">');
        expect(html).not.toContain('/api/file/');
    });

    it('keeps a source that climbs out of the root as the author wrote it', async () => {
        const html = await drawnReadme('![a](../../../../etc/p.png)');
        expect(html).toContain('<img src="../../../../etc/p.png" alt="a">');
        expect(html).not.toContain('/api/file/');
    });

    it('escapes a quote and an ampersand in the alternative text', async () => {
        expect(await drawnReadme('![a "b" & c](fig.png)')).toContain(
            'alt="a &quot;b&quot; &amp; c"'
        );
    });
});

describe("the manual's parts", () => {
    /** The route's answer for the manual of an engine directory whose HELP.md is the text given. */
    async function manualOf(text: string): Promise<Record<string, unknown>> {
        const into = target();
        const engine = scratchDir('oculus-manual-');
        const help = join(engine, 'HELP.md');
        expect(resolve(help).startsWith(resolve(engine) + sep)).toBe(true);
        writeFileSync(help, text);
        const response = handleDocs(request('manual=1'), { ...into, engine });
        expect(response.status).toBe(200);
        return fields(await response.json());
    }

    /** The kinds of the parts an answer carries, in order. */
    function kinds(answer: Record<string, unknown>): unknown[] {
        const parts = answer.parts;
        return Array.isArray(parts) ? parts.map((part) => fields(part).kind) : [];
    }

    it('cuts the manual at a paragraph holding one diagram and nothing else', async () => {
        const answer = await manualOf('Before.\n\n![Flow](docs/diagrams/flow.svg)\n\nAfter.\n');
        expect(kinds(answer)).toEqual(['html', 'diagram', 'html']);
        const parts = answer.parts as Record<string, unknown>[];
        expect(parts[0].html).toContain('<p>Before.</p>');
        expect(parts[1]).toEqual({ kind: 'diagram', name: 'flow', alt: 'Flow' });
        expect(parts[2].html).toContain('<p>After.</p>');
        expect(String(answer.html)).toContain('<p>Before.</p>');
        expect(String(answer.html)).toContain('<p>After.</p>');
    });

    it('keeps an image of another address, and a diagram inside a sentence, in the prose', async () => {
        const answer = await manualOf(
            'Before.\n\n![Photo](pictures/photo.png)\n\nSee ![Flow](docs/diagrams/flow.svg) here.\n'
        );
        expect(kinds(answer)).toEqual(['html']);
        const [prose] = answer.parts as Record<string, unknown>[];
        expect(prose.html).toContain('src="pictures/photo.png"');
        expect(prose.html).toContain('src="docs/diagrams/flow.svg"');
    });

    it('reads an alternative text holding an ampersand and a quote as written', async () => {
        const answer = await manualOf("![Flow & the 'rest'](docs/diagrams/flow.svg)\n");
        expect(answer.parts).toEqual([{ kind: 'diagram', name: 'flow', alt: "Flow & the 'rest'" }]);
    });

    it('lists every heading in a table of contents written before a diagram', async () => {
        const answer = await manualOf(
            '[TOC]\n\n# One\n\n![Flow](docs/diagrams/flow.svg)\n\n## Two\n'
        );
        expect(kinds(answer)).toEqual(['html', 'diagram', 'html']);
        const [head] = answer.parts as Record<string, unknown>[];
        expect(head.html).toContain('href="#user-content-one"');
        expect(head.html).toContain('href="#user-content-two"');
    });

    it('carries no parts on the answer of any other document', async () => {
        const response = handleDocs(request('project=alpha&name=README.md'), target());
        expect(fields(await response.json())).not.toHaveProperty('parts');
    });
});
