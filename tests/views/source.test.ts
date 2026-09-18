// The source tab rendered on the server: the escaped highlight mirror, the save status words from
// the catalog, the rendered half a Markdown tab draws beside the editor, and the code window it
// draws instead of an editor for a file it may not write. The code window's own languages are here
// too, since it is the source tab that reaches them.
//
// What this does NOT cover: what the sanitiser does to markup a file carries. The suite runs in
// node, where DOMPurify has no document and ui/html.ts hands the text back, which its own head
// comment says; the filtering is exercised in Chrome, by the preview case of
// tests/browser/source.spec.ts and by tests/browser/sanitise.spec.ts.

import { render } from 'svelte/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Code from '../../src/lib/views/source/Code.svelte';
import Editor from '../../src/lib/views/source/Editor.svelte';
import Source from '../../src/lib/views/Source.svelte';
import { codeHtml, lineNumbers, registered } from '../../src/lib/state/languages.ts';
import { paintLimit, requirePaintLimit } from '../../src/lib/data/editor.ts';
import { TEXT_LIMIT, languageOf } from '../../src/lib/state/fs.ts';
import { lineStart, sourceTabState } from '../../src/lib/state/source.svelte.ts';
import {
    engineDir,
    glyphCatalog,
    loadConfig,
    textCatalog
} from '../../src/lib/data/sources/config.ts';
import { setCatalog, setGlyphs } from '../../src/lib/state/text.ts';
import { noop } from '../doubles.ts';
import { clientContext, createClientState, type ClientState } from '../client.ts';

let client: ClientState;
let receive: ClientState['entities']['receive'];
let loadUi: ClientState['ui']['loadUi'];
let instanceState: ClientState['ui']['instanceState'];
let revertSourceDraft: ClientState['source']['revertSourceDraft'];
let editSourceDraft: ClientState['source']['editSourceDraft'];
let loadSourceDraft: ClientState['source']['loadSourceDraft'];
let saveSourceDraft: ClientState['source']['saveSourceDraft'];
let toggleSourceRendered: ClientState['source']['toggleSourceRendered'];
let setToken: ClientState['writes']['setToken'];

beforeEach(() => {
    client = createClientState();
    ({ receive } = client.entities);
    ({ loadUi, instanceState } = client.ui);
    ({
        revertSourceDraft,
        editSourceDraft,
        loadSourceDraft,
        saveSourceDraft,
        toggleSourceRendered
    } = client.source);
    ({ setToken } = client.writes);
    installFixture();
});

const { config } = loadConfig(engineDir());
const catalog = textCatalog(config);
setCatalog(catalog);
setGlyphs(glyphCatalog(config));
/** What every case here starts from, installed into the case's own client. */
function installFixture(): void {
    receive({ channel: 'config', version: 1, payload: { config, text: catalog, findings: [] } });
}

beforeEach(() => loadUi({ getItem: () => null, setItem: noop }));
afterEach(() => vi.unstubAllGlobals());

const actions = { oninput: noop, onsave: noop, onrevert: noop, onrendered: noop };

describe('the source editor', () => {
    it('restores the working and saved copies when Source is rendered again after another tab', async () => {
        const fetcher = vi.fn(() => Promise.resolve(new Response('saved original')));
        vi.stubGlobal('fetch', fetcher);
        const instance = {
            id: 'source-one',
            view: 'source',
            state: sourceTabState('hub', 'notes.md')
        };
        await loadSourceDraft(instance.id, 'hub', 'notes.md');
        expect(
            render(Source, { context: clientContext(client), props: { instance } }).body
        ).toContain('saved original');
        editSourceDraft(instance.id, 'unsaved working copy');
        const other = {
            id: 'source-two',
            view: 'source',
            state: sourceTabState('hub', 'other.md')
        };
        await loadSourceDraft(other.id, 'hub', 'other.md');
        render(Source, { context: clientContext(client), props: { instance: other } });
        await loadSourceDraft(instance.id, 'hub', 'notes.md');
        const restored = render(Source, {
            context: clientContext(client),
            props: { instance }
        }).body;
        expect(restored).toContain('unsaved working copy');
        // the draft is the unsaved working copy, which is what the editor opens on rather than the saved text
        expect(restored).not.toContain('saved original');
        expect(instanceState(instance.id)).toMatchObject({
            text: 'unsaved working copy',
            saved: 'saved original'
        });
        // Two reads per instance: its text, and what the route says about the file.
        expect(fetcher).toHaveBeenCalledTimes(4);
        revertSourceDraft(instance.id);
        expect(
            render(Source, { context: clientContext(client), props: { instance } }).body
        ).toContain('saved original');
    });

    it('renders Source with the saved word after a save of the working copy', async () => {
        vi.stubGlobal('fetch', (_url: string, init?: RequestInit) =>
            Promise.resolve(
                new Response(init === undefined ? 'complete text' : JSON.stringify({ ok: true }))
            )
        );
        setToken('source-token');
        const instance = {
            id: 'source-edit',
            view: 'source',
            state: sourceTabState('hub', 'notes.md')
        };
        await loadSourceDraft(instance.id, 'hub', 'notes.md');
        await saveSourceDraft(instance.id, 'hub', 'notes.md');
        const editable = render(Source, {
            context: clientContext(client),
            props: { instance }
        }).body;
        expect(editable).toMatch(/class="mirror(?:\s|")/);
        expect(editable).toContain(`>${catalog['editor.save']}</span>`);
        expect(editable).toContain(catalog['source.saved']);
    });

    it('draws the highlight mirror, editable textarea, Save, Revert, and saved word', () => {
        const { body } = render(Editor, {
            context: clientContext(client),
            props: {
                path: 'notes.yml',
                text: 'title: "A < B"',
                message: catalog['source.saved'],
                ...actions
            }
        });
        expect(body).toMatch(/class="mirror(?:\s|")/);
        expect(body).toContain('hljs-attr');
        expect(body).toContain('&lt; B');
        expect(body).toContain(`>${catalog['editor.save']}</span>`);
        expect(body).toContain(`>${catalog['editor.revert']}</span>`);
        expect(body).toContain(glyphCatalog(config)[catalog['editor.revert_glyph']]);
        expect(body).toContain(catalog['source.saved']);
        // a file the reader may change is drawn without the flag that locks the editor
        expect(body).not.toContain('readonly');
    });

    it('carries the program control in its bar for a listed .rtf, and none for a Markdown file', () => {
        const tab = (path: string): string =>
            render(Source, {
                context: clientContext(client),
                props: {
                    instance: {
                        id: `source-${path}`,
                        view: 'source',
                        state: sourceTabState('hub', path)
                    }
                }
            }).body;
        const words = `<span class="label">${catalog['file.open_program']}</span>`;
        expect(tab('letters/cover.rtf')).toContain(words);
        // a .md is read in the tab itself, so it is offered no program control
        expect(tab('notes.md')).not.toContain(words);
    });

    // The mirror is the code window's highlighter, so a file being written is coloured exactly as the
    // same file shown read only is, for every language the highlighter has registered.
    it('paints the mirror of a writable file through the highlighter of the code window', () => {
        const painted = (path: string, text: string): string =>
            render(Editor, {
                context: clientContext(client),
                props: { path, text, ...actions }
            }).body;

        expect(painted('code/run.py', 'import sys\n\n\ndef main():\n    return "one"\n')).toContain(
            'hljs-keyword'
        );
        expect(painted('paper/main.tex', '\\section{One}\n')).toContain('hljs-keyword');
        expect(painted('fit.R', 'fit <- lm(y ~ x, data = frame)\n')).toContain('hljs-operator');
        expect(painted('Makefile', 'all:\n\techo one\n')).toContain('hljs-section');
        // Nothing of the retired mirror's own vocabulary is left on the page.
        expect(painted('notes.yml', 'title: one\n')).not.toContain('source-key');
    });

    it('paints a file past the configured cap as escaped text, since it is painted on every keystroke', () => {
        const painted = (text: string): string =>
            render(Editor, {
                context: clientContext(client),
                props: { path: 'code/run.py', text, ...actions }
            }).body;
        const cap = requirePaintLimit(config);
        const line = 'import sys  # <one>\n';
        const small = line.repeat(Math.ceil(cap / line.length) - 1);
        const large = line.repeat(Math.ceil(cap / line.length) + 1);
        expect(small.length).toBeLessThanOrEqual(cap);
        expect(large.length).toBeGreaterThan(cap);
        expect(painted(small)).toContain('hljs-keyword');
        const plain = painted(large);
        // the file is over the paint limit, so it is drawn as plain text
        expect(plain).not.toContain('hljs-keyword');
        expect(plain).toContain('&lt;one&gt;');
    });

    // The cap is a key of the configuration rather than a constant, so a client that has been sent a
    // smaller one paints the same file plain, and one sent nothing at all paints plain as well.
    it('paints under the cap the configuration it was sent carries, and plain before there is one', () => {
        const text = 'import sys  # <one>\n'.repeat(4);
        const painted = (): string =>
            render(Editor, {
                context: clientContext(client),
                props: { path: 'code/run.py', text, ...actions }
            }).body;
        expect(painted()).toContain('hljs-keyword');

        receive({
            channel: 'config',
            version: 2,
            payload: {
                config: { ...config, editor: { paint_limit_kb: 0.01 } },
                text: catalog,
                findings: []
            }
        });
        expect(paintLimit({ ...config, editor: { paint_limit_kb: 0.01 } })).toBe(10.24);
        // the limit the configuration carries is under the file's size, so nothing is painted
        expect(painted()).not.toContain('hljs-keyword');

        const bare = createClientState();
        expect(bare.selectors.paintLimit()).toBeNull();
        expect(
            render(Editor, {
                context: clientContext(bare),
                props: { path: 'code/run.py', text, ...actions }
            }).body
            // a client that was sent no configuration has no limit to paint under
        ).not.toContain('hljs-keyword');
    });

    it("keeps one mirror line under the textarea's empty last line", () => {
        const body = render(Editor, {
            context: clientContext(client),
            props: { path: 'notes.txt', text: 'one\n', ...actions }
        }).body;
        expect(body).toMatch(/one\n\n(<!---->)?<\/code>/);
    });

    it('draws the rendered half beside a Markdown file and nothing beside a YAML one', () => {
        const drawn = (path: string): string =>
            render(Editor, {
                context: clientContext(client),
                props: { path, text: '# A heading\n\ntext of it\n', ...actions }
            }).body;

        const markdown = drawn('notes.md');
        expect(markdown).toContain('data-source-preview="notes.md"');
        expect(markdown).toContain('<h1>A heading</h1>');
        expect(markdown).toContain(`>${catalog['source.preview']}</span>`);

        const yaml = drawn('notes.yml');
        // a .yml has no rendered form, so no preview is drawn for it
        expect(yaml).not.toContain('data-source-preview');
        // and the control that would open one is not drawn either
        expect(yaml).not.toContain(`>${catalog['source.preview']}</span>`);
    });

    it('leaves a front matter block out of the rendered half and a relative image as written', () => {
        const body = render(Editor, {
            context: clientContext(client),
            props: {
                path: 'PRESENT.md',
                text: '---\ntitle: A deck\nlevel: 2\n---\n\n# Prose\n\n![fig](figures/a.png)\n',
                ...actions
            }
        }).body;
        const preview = body.slice(body.indexOf('data-source-preview'));
        expect(preview).toContain('<h1>Prose</h1>');
        // the front matter is the deck's own data, so the preview draws the prose alone
        expect(preview).not.toContain('title: A deck');
        // and no rule where the front matter ended
        expect(preview).not.toContain('<hr');
        expect(preview).toContain('src="figures/a.png"');
    });

    it('takes the rendered half away when the instance state says the toggle is off', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn(() => Promise.resolve(new Response('# A heading\n')))
        );
        const instance = {
            id: 'source-preview',
            view: 'source',
            state: sourceTabState('hub', 'notes.md')
        };
        await loadSourceDraft(instance.id, 'hub', 'notes.md');
        const shown = render(Source, { context: clientContext(client), props: { instance } }).body;
        expect(shown).toContain('<h1>A heading</h1>');

        toggleSourceRendered(instance.id);
        expect(instanceState(instance.id)).toMatchObject({ rendered: false });
        const hidden = render(Source, { context: clientContext(client), props: { instance } }).body;
        // the instance was toggled to the plain form, so the preview is not drawn
        expect(hidden).not.toContain('data-source-preview');
        expect(hidden).toContain(catalog['source.preview']);
    });
});

// A file the tab holds but may not write: this machine's mode locks it, or the read had to cut it.
// Neither draws an editor, since typing into one would be typing into something that saves nothing.
describe('a file the source tab may not write', () => {
    /** A client whose draft for one instance is the text, the mode and the cut a case names. */
    async function holding(
        id: string,
        path: string,
        text: string,
        readonly: boolean
    ): Promise<{ id: string; view: string; state: unknown }> {
        vi.stubGlobal(
            'fetch',
            vi.fn((url: string) =>
                Promise.resolve(
                    url.startsWith('/api/source')
                        ? new Response(JSON.stringify({ ok: true, readonly }), {
                              headers: { 'content-type': 'application/json' }
                          })
                        : new Response(text)
                )
            )
        );
        const instance = { id, view: 'source', state: sourceTabState('hub', path) };
        await loadSourceDraft(id, 'hub', path);
        return instance;
    }

    it('draws the code window and the sentence for a file this machine locks', async () => {
        const instance = await holding('locked', 'code/run.py', 'print("hello")\n', true);
        const body = render(Source, { context: clientContext(client), props: { instance } }).body;

        expect(body).toContain(catalog['source.readonly']);
        expect(body).toContain('data-fs-code="code/run.py"');
        expect(body).toContain('data-language="python"');
        // No editor at all: no textarea to type into and no Save to press.
        expect(body).not.toContain('data-source-editor');
        // this machine locks the file, so there is nothing to save
        expect(body).not.toContain(`>${catalog['editor.save']}</span>`);
    });

    it('draws the same window and its own sentence for a file the read had to cut', async () => {
        const instance = await holding('cut', 'big.log', 'x'.repeat(TEXT_LIMIT + 10), false);
        const body = render(Source, { context: clientContext(client), props: { instance } }).body;

        expect(body).toContain(catalog['source.truncated']);
        expect(body).toContain('data-fs-code="big.log"');
        // the read was cut, so what is drawn is the code window rather than an editor over half a file
        expect(body).not.toContain('data-source-editor');
    });

    it('draws the editor for a file the mode leaves writable', async () => {
        const instance = await holding('open', 'notes.md', '# A heading\n', false);
        const body = render(Source, { context: clientContext(client), props: { instance } }).body;

        expect(body).toContain('data-source-editor="notes.md"');
        expect(body).toContain(`>${catalog['editor.save']}</span>`);
        // the mode leaves the file writable, so the read-only sentence is not drawn
        expect(body).not.toContain(catalog['source.readonly']);
    });

    it('carries the line a tab was opened at into the editor, and none for a tab opened at none', async () => {
        const instance = await holding('at-line', 'notes.md', 'one\ntwo\nthree\n', false);
        const plain = render(Source, { context: clientContext(client), props: { instance } }).body;
        // this tab was opened at no line
        expect(plain).not.toContain('data-source-line');

        const opened = {
            ...instance,
            state: sourceTabState('hub', 'notes.md', 2)
        };
        const body = render(Source, {
            context: clientContext(client),
            props: { instance: opened }
        }).body;
        expect(body).toContain('data-source-line="2"');
        // The cursor the editor places is the offset of that line, which is what the browser
        // suite presses through; the offset rule itself is tests/state/source.test.ts.
        expect(lineStart('one\ntwo\nthree\n', 2)).toBe(4);
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
        // the file's own text is escaped, so its angle brackets reach the reader as words
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

// What a name of the research tree resolves to, and what the grammars beyond the first set paint.
// The extension map and the highlighter's registry are two files, so each pair is checked in both.
describe('the languages a research tree asks for', () => {
    /** One name per extension the tree holds, with the language the code window paints it as. */
    const NAMED: [string, string][] = [
        ['core.lisp', 'lisp'],
        ['macros.el', 'lisp'],
        ['boot.scm', 'lisp'],
        ['solver.ml', 'ocaml'],
        ['solver.mli', 'ocaml'],
        ['fit.R', 'r'],
        ['fit.r', 'r'],
        ['filter.m', 'matlab'],
        ['sweep.jl', 'julia'],
        ['pyproject.toml', 'ini'],
        ['setup.ini', 'ini'],
        ['Makefile', 'makefile'],
        ['code/Makefile', 'makefile'],
        ['job.slurm', 'bash'],
        ['refs.bib', 'latex'],
        ['run.ipynb', 'json'],
        ['View.svelte', 'xml']
    ];

    it('paints each of them under a language the highlighter has registered', () => {
        for (const [name, language] of NAMED) {
            expect([name, languageOf(name)]).toEqual([name, language]);
            expect([name, registered().includes(language)]).toEqual([name, true]);
        }
    });

    it('paints a Lisp, an OCaml, an R and a MATLAB snippet with the highlighter classes', () => {
        expect(codeHtml('(defun add (a b) (+ a b))\n', 'lisp')).toContain('hljs-name');
        expect(codeHtml('let add a b = a + b\n', 'ocaml')).toContain('hljs-keyword');
        expect(codeHtml('fit <- lm(y ~ x, data = frame)\n', 'r')).toContain('hljs-operator');
        expect(codeHtml('function y = scale(x)\ny = x * 2;\nend\n', 'matlab')).toContain(
            'hljs-keyword'
        );
    });

    it('paints the three that carry a research tree to its build and its settings', () => {
        expect(codeHtml('function add(a, b)\nend\n', 'julia')).toContain('hljs-keyword');
        expect(codeHtml('name = "oculus"\n', 'ini')).toContain('hljs-attr');
        expect(codeHtml('all:\n\techo one\n', 'makefile')).toContain('hljs-section');
    });
});
