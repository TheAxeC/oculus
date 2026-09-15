// One file as its own tab, rendered to HTML on the server: what each type of file is drawn as, and
// the code window's numbered, highlighted lines.
//
// The catalog and the glyphs are the real config; the instance state is synthetic. What this does
// NOT cover: the fetch state/fs.svelte.ts makes for a text file, which needs a server and is
// exercised by tests/browser/files.spec.ts, so the text cases here render the code window directly.

import { beforeEach, describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import File from '../../src/lib/views/File.svelte';
import Code from '../../src/lib/views/file/Code.svelte';
import { codeHtml, lineNumbers } from '../../src/lib/views/file/languages.ts';
import {
    engineDir,
    glyphCatalog,
    loadConfig,
    textCatalog
} from '../../src/lib/data/sources/config.ts';
import { setCatalog, setGlyphs } from '../../src/lib/state/text.ts';
import type { Instance } from '../../src/lib/state/layout/index.ts';
import { clientContext, createClientState, type ClientState } from '../client.ts';

let client: ClientState;

beforeEach(() => {
    client = createClientState();
});

const { config } = loadConfig(engineDir());
setCatalog(textCatalog(config));
setGlyphs(glyphCatalog(config));

function instance(state: unknown): Instance {
    return { id: 'file-one', view: 'file', state };
}

function drawn(state: unknown): string {
    return render(File, { context: clientContext(client), props: { instance: instance(state) } })
        .body;
}

describe('one file as its own tab', () => {
    it('draws nothing and says so when the instance names no file', () => {
        const body = drawn({});

        expect(body).toContain('No file chosen.');
        expect(body).not.toContain('<img');
    });

    it('draws an image as a picture over the file route', () => {
        const body = drawn({ root: 'hub', path: 'docs/plot.png', label: 'plot.png' });

        expect(body).toContain('<img');
        expect(body).toContain('src="/api/file/hub/docs/plot.png"');
        expect(body).toContain('alt="plot.png"');
    });

    it("draws a PDF in a frame Chrome's own viewer can draw, which a sandboxed one is not", () => {
        const body = drawn({ root: 'hub', path: 'paper.pdf', label: 'paper.pdf' });

        const frame = /<iframe[^>]*>/.exec(body)?.[0] ?? '';
        expect(frame).not.toBe('');
        expect(frame).not.toContain('sandbox');
        expect(body).toContain('src="/api/file/hub/paper.pdf"');
    });

    it('draws an unknown type as its extension, its size and a link that saves it', () => {
        const body = drawn({ root: 'hub', path: 'data/set.npz', label: 'set.npz', size: 2097152 });

        expect(body).toContain('.npz');
        expect(body).toContain('2.0 MB');
        expect(body).toContain('download="set.npz"');
        expect(body).toContain('href="/api/file/hub/data/set.npz"');
    });

    it('says it is reading a text file while its bytes have not arrived', () => {
        const body = drawn({ root: 'hub', path: 'code/run.py', label: 'run.py' });

        expect(body).toContain('Reading...');
    });

    it('offers the control that opens the same address in a browser tab', () => {
        expect(drawn({ root: 'hub', path: 'paper.pdf' })).toContain('Open in a browser tab');
    });

    it('is one instance per root and path, so opening the same file twice is one tab', () => {
        const { openView } = client.layout;
        const first = openView('file', { root: 'hub', path: 'code/run.py', label: 'run.py' });
        const again = openView('file', { root: 'hub', path: 'code/run.py', label: 'run.py' });
        const other = openView('file', { root: 'hub', path: 'README.md', label: 'README.md' });

        expect(first).not.toBe('');
        expect(again).toBe(first);
        expect(other).not.toBe(first);
    });
});

describe('the code window', () => {
    const PYTHON = 'import sys\n\n\ndef main():\n    return "one"\n';

    it('numbers every line of the file', () => {
        const { body } = render(Code, {
            props: { text: PYTHON, language: 'python', path: 'code/run.py' }
        });

        expect(lineNumbers(PYTHON)).toEqual([1, 2, 3, 4, 5, 6]);
        expect(body).toContain('1\n2\n3\n4\n5\n6');
    });

    it('paints the highlighter classes the theme colours, and escapes the file text', () => {
        const painted = codeHtml('if (a < b) return "<b>";\n', 'javascript');

        expect(painted).toContain('hljs-keyword');
        expect(painted).toContain('hljs-string');
        expect(painted).not.toContain('<b>');
        expect(painted).toContain('&lt;b&gt;');
    });

    it('names the window by the file and says which language it painted', () => {
        const { body } = render(Code, {
            props: { text: PYTHON, language: 'python', path: 'code/run.py' }
        });

        expect(body).toContain('data-fs-code="code/run.py"');
        expect(body).toContain('data-language="python"');
        expect(body).toContain('aria-label="code/run.py, read only"');
    });

    it('draws a language it has none for as plain escaped text', () => {
        expect(codeHtml('a < b\n', 'klingon')).toBe('a &lt; b\n');
    });
});
