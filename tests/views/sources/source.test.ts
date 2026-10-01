// The source tab rendered on the server: the editor's host with the language it opens under, the
// save status words from the catalog, the rendered half a Markdown tab draws beside the editor, and
// the code window it draws instead of an editor for a file it may not write. The code window's own
// languages are here too, since it is the source tab that reaches them.
//
// The editor itself is Monaco, which mounts in the browser alone; what it does with the text, the
// keys and the gutter is the look's, and its pure parts are tests/ui/controls/editor/.
//
// What this does NOT cover: what the sanitiser does to markup a file carries. The suite runs in
// node, where DOMPurify has no document and ui/html.ts hands the text back, which its own head
// comment says; the filtering needs a DOM and is not run here.

import { render } from 'svelte/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Code from '../../../src/lib/views/shared/code/Code.svelte';
import Editor from '../../../src/lib/views/sources/source/Editor.svelte';
import Source from '../../../src/lib/views/sources/source/Source.svelte';
import {
    codeHtml,
    lineNumbers,
    registered
} from '../../../src/lib/state/shared/words/languages.ts';
import { paintLimit, requirePaintLimit } from '../../../src/lib/data/helpers/editor.ts';
import { TEXT_LIMIT, languageOf } from '../../../src/lib/state/sources/fs.ts';
import { languageMap } from '../../../src/lib/data/helpers/files/languages.ts';
import { codeColour, languageNamed } from '../../../src/lib/data/prose/languages.ts';
import { Marked } from 'marked';
import { sourceTabState } from '../../../src/lib/state/sessions/source.svelte.ts';
import {
    engineDir,
    glyphCatalog,
    loadConfig,
    textCatalog
} from '../../../src/lib/data/sources/config.ts';
import { setCatalog, setGlyphs } from '../../../src/lib/state/shared/words/text.ts';
import { noop } from '../../fixtures/doubles.ts';
import { clientContext, createClientState, type ClientState } from '../../fixtures/client.ts';
import { barOf, headerOf, toolsOf } from '../shared/pane-parts.ts';

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

const actions = { oninput: noop };

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
        // the draft is the unsaved working copy, which is what the editor opens on rather than the
        // saved text
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

    // Red when a saved writable file is drawn without the editor's host.
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
        expect(editable).toContain('data-editor-host');
        expect(editable).toContain(`>${catalog['editor.save']}</span>`);
        expect(editable).toContain(catalog['source.saved']);
    });

    // Red when the editor's host drops the text it shows before the editor has loaded, or grows a
    // bar of its own.
    it('draws the editor host with the text escaped until the editor loads, and no control row', () => {
        const { body } = render(Editor, {
            context: clientContext(client),
            props: { path: 'notes.md', text: 'title: "A < B"', ...actions }
        });
        expect(body).toContain('data-editor-host');
        expect(body).toContain('&lt; B');
        // Save and Revert are the pane's header actions and the rendered half is its bar, which
        // Source draws, so the editor draws no bar of its own
        expect(body).not.toContain('role="toolbar"');
        // nor the save control that the header carries
        expect(body).not.toContain(`>${catalog['editor.save']}</span>`);
        // nor the control that takes the rendered half away
        expect(body).not.toContain(`>${catalog['source.preview']}</span>`);
        // a file the reader may change is handed to the editor as writable
        expect(body).toContain('data-editor-writable="true"');
    });

    it('draws a refused save with the cross glyph beside its words, and a later word without it', async () => {
        let refuse = true;
        vi.stubGlobal('fetch', (_url: string, init?: RequestInit) =>
            Promise.resolve(
                init === undefined
                    ? new Response('# notes')
                    : new Response(JSON.stringify(refuse ? { error: 'disk full' } : { ok: true }), {
                          status: refuse ? 500 : 200
                      })
            )
        );
        setToken('source-token');
        const instance = {
            id: 'source-refused',
            view: 'source',
            state: sourceTabState('hub', 'notes.md')
        };
        const message = (): string => {
            const body = render(Source, {
                context: clientContext(client),
                props: { instance }
            }).body;
            // The message is the last thing on the pane's bar, so it runs to the bar's end.
            const from = body.indexOf('class="message');
            return from === -1 ? '' : body.slice(from, body.indexOf('</div>', from));
        };
        await loadSourceDraft(instance.id, 'hub', 'notes.md');
        editSourceDraft(instance.id, '# notes, typed');
        await saveSourceDraft(instance.id, 'hub', 'notes.md');
        const refused = message();
        expect(refused).toContain('data-glyph="cross"');
        expect(refused.indexOf('data-glyph="cross"')).toBeLessThan(refused.indexOf('disk full'));
        expect(refused).not.toMatch(/[^\t\n\r\x20-\x7E]/);

        refuse = false;
        await saveSourceDraft(instance.id, 'hub', 'notes.md');
        const saved = message();
        expect(saved).toContain(catalog['source.saved']);
        // a save that went through is said as a plain word, so the refusal's mark goes with it
        expect(saved).not.toContain('data-glyph="cross"');
    });

    it('puts Save, Revert and the star in the header as bare icons, and Preview and the saved word in the bar', async () => {
        vi.stubGlobal('fetch', (_url: string, init?: RequestInit) =>
            Promise.resolve(
                new Response(init === undefined ? '# notes' : JSON.stringify({ ok: true }))
            )
        );
        setToken('source-token');
        const instance = {
            id: 'source-bar',
            view: 'source',
            state: sourceTabState('hub', 'notes.md')
        };
        await loadSourceDraft(instance.id, 'hub', 'notes.md');
        await saveSourceDraft(instance.id, 'hub', 'notes.md');
        const body = render(Source, { context: clientContext(client), props: { instance } }).body;
        const header = headerOf(body);
        const bar = barOf(body);

        const tools = toolsOf(header);
        expect(tools.length).toBe(3);
        for (const tool of tools) expect(tool).toMatch(/\bbare\b/);
        expect(tools[0]).toContain(`aria-label="${catalog['editor.save']}"`);
        expect(tools[1]).toContain(`aria-label="${catalog['editor.revert']}"`);
        expect(tools[2]).toContain(`aria-label="${catalog['file.bookmark']}"`);
        expect(header).toContain(`data-glyph="${catalog['editor.revert_glyph']}"`);
        // an icon action carries its words as the name and draws none beside the icon
        expect(header).not.toContain('<span class="label">');

        // the toggle is a pressable chip and the saved word ends the bar; the star is the header's
        const preview = bar.indexOf(`>${catalog['source.preview']}</span>`);
        expect(bar).toMatch(
            /<button[^>]*class="chip[^"]*pressable[^"]*"[^>]*aria-pressed="(true|false)"/
        );
        expect(preview).toBeGreaterThan(-1);
        // the bookmark star is a header icon, so the bar does not repeat it
        expect(bar).not.toContain(catalog['file.bookmark']);
        expect(bar.indexOf(catalog['source.saved'])).toBeGreaterThan(preview);
        // Save is a header icon, so no word of it sits in the bar
        expect(bar).not.toContain(`>${catalog['editor.save']}</span>`);
        // the header and the bar are the two rows of controls: the body under them holds none
        expect(body.split('role="toolbar"').length - 1).toBe(2);
    });

    it('draws the Preview chip pressed while the rendered half is shown and not pressed after it is taken away', async () => {
        vi.stubGlobal('fetch', () => Promise.resolve(new Response('# notes')));
        const instance = {
            id: 'source-pressed',
            view: 'source',
            state: sourceTabState('hub', 'notes.md')
        };
        await loadSourceDraft(instance.id, 'hub', 'notes.md');
        const pressedWhile = (): string => {
            const body = render(Source, {
                context: clientContext(client),
                props: { instance }
            }).body;
            const chip =
                /<button[^>]*class="chip[^"]*pressable[^"]*"[^>]*>/.exec(barOf(body))?.[0] ?? '';
            return /aria-pressed="(true|false)"/.exec(chip)?.[1] ?? 'none';
        };
        const before = (instanceState(instance.id) as { rendered: boolean }).rendered;
        expect(pressedWhile()).toBe(String(before));
        toggleSourceRendered(instance.id);
        expect(pressedWhile()).toBe(String(!before));
    });

    it('draws a file that could not be read as the message box with a control that reads it again', async () => {
        vi.stubGlobal('fetch', () => Promise.resolve(new Response('gone', { status: 404 })));
        const instance = {
            id: 'source-refused-read',
            view: 'source',
            state: sourceTabState('hub', 'link.md')
        };
        await loadSourceDraft(instance.id, 'hub', 'link.md');
        const body = render(Source, { context: clientContext(client), props: { instance } }).body;

        const box =
            /<p class="empty[^"]*\berror\b[^"]*"[^>]*role="alert"[^>]*>[\s\S]*?<\/p>/.exec(
                body
            )?.[0] ?? '';
        expect(box).not.toBe('');
        expect(box).toContain('Cannot open: ');
        expect(box).toContain(`<span class="label">${catalog['source.retry']}</span>`);
        // the box is where the editor would be, so there is no editor under it
        expect(body).not.toContain('data-editor-host');
    });

    it('draws a tab that names no file as the message box with no control to read it again', () => {
        const body = render(Source, {
            context: clientContext(client),
            props: { instance: { id: 'source-none', view: 'source', state: {} } }
        }).body;
        expect(body).toMatch(/<p class="empty[^"]*\berror\b/);
        // a tab that names no file has nothing to read again
        expect(body).not.toContain(`<span class="label">${catalog['source.retry']}</span>`);
    });

    it('carries the program control in its header for a listed .rtf, and none for a Markdown file', () => {
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
        const words = `aria-label="${catalog['file.open_program']}"`;
        expect(tab('letters/cover.rtf')).toContain(words);
        // a .md is read in the tab itself, so it is offered no program control
        expect(tab('notes.md')).not.toContain(words);
    });

    // Red when the editor is handed a language other than the one the file name gives, as a
    // `data-language` other than python, latex, r or makefile for these four names.
    it('opens a writable file in the editor under the language its name gives', () => {
        const opened = (path: string, text: string): string =>
            render(Editor, {
                context: clientContext(client),
                props: { path, text, ...actions }
            }).body;

        expect(opened('code/run.py', 'import sys\n')).toContain('data-language="python"');
        expect(opened('paper/main.tex', '\\section{One}\n')).toContain('data-language="latex"');
        expect(opened('fit.R', 'fit <- lm(y ~ x)\n')).toContain('data-language="r"');
        expect(opened('Makefile', 'all:\n\techo one\n')).toContain('data-language="makefile"');
    });

    // Red when the editor colours a file past the configured cap, which is what the key exists to
    // stop.
    it('opens a file past the configured cap as plaintext, and one under it in its language', () => {
        const opened = (text: string): string =>
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
        expect(opened(small)).toContain('data-language="python"');
        expect(opened(large)).toContain('data-language="plaintext"');
    });

    // Red when the limit is a constant rather than the key of the configuration the client was
    // sent: a smaller key opens the same file as plaintext, and no configuration yet does too.
    it('opens under the cap the configuration it was sent carries, and plaintext before there is one', () => {
        const text = 'import sys  # <one>\n'.repeat(4);
        const opened = (): string =>
            render(Editor, {
                context: clientContext(client),
                props: { path: 'code/run.py', text, ...actions }
            }).body;
        expect(opened()).toContain('data-language="python"');

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
        expect(opened()).toContain('data-language="plaintext"');

        const bare = createClientState();
        expect(bare.selectors.paintLimit()).toBeNull();
        expect(
            render(Editor, {
                context: clientContext(bare),
                props: { path: 'code/run.py', text, ...actions }
            }).body
        ).toContain('data-language="plaintext"');
    });

    it('opens a file under the language the config map gives its name, plaintext before the config arrives and when the map drops it', () => {
        const text = 'x = 1\n';
        const opened = (state: ClientState, path: string): string =>
            render(Editor, {
                context: clientContext(state),
                props: { path, text, ...actions }
            }).body;
        expect(opened(client, 'code/stubs.pyi')).toContain('data-language="python"');
        expect(opened(client, 'ui/View.svelte')).toContain('data-language="svelte"');
        expect(opened(client, 'src/main.cpp')).toContain('data-language="cpp"');
        expect(opened(client, 'graph.dot')).toContain('data-language="plaintext"');

        expect(opened(createClientState(), 'code/stubs.pyi')).toContain(
            'data-language="plaintext"'
        );

        receive({
            channel: 'config',
            version: 2,
            payload: {
                config: { ...config, languages: { python: ['.py'] } },
                text: catalog,
                findings: []
            }
        });
        expect(opened(client, 'code/stubs.pyi')).toContain('data-language="plaintext"');
        expect(opened(client, 'code/run.py')).toContain('data-language="python"');
    });

    it('draws the rendered half beside a Markdown file and nothing beside a YAML one', () => {
        const drawn = (path: string): string =>
            render(Editor, {
                context: clientContext(client),
                props: { path, text: '# A heading\n\ntext of it\n', ...actions }
            }).body;

        const markdown = drawn('notes.md');
        expect(markdown).toContain('data-source-preview="notes.md"');
        expect(markdown).toContain('<h1 id="user-content-a-heading">A heading</h1>');

        const yaml = drawn('notes.yml');
        // a .yml has no rendered form, so no preview is drawn for it
        expect(yaml).not.toContain('data-source-preview');
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
        expect(preview).toContain('<h1 id="user-content-prose">Prose</h1>');
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
        expect(shown).toContain('<h1 id="user-content-a-heading">A heading</h1>');

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

    it('carries a line only when the tab names a finite number above zero', async () => {
        const instance = await holding('lines', 'notes.md', 'one\ntwo\nthree\n', false);
        const lineOf = (line: unknown): string | undefined => {
            const opened = {
                ...instance,
                state: { ...(sourceTabState('hub', 'notes.md') as object), line }
            };
            const body = render(Source, {
                context: clientContext(client),
                props: { instance: opened }
            }).body;
            return /data-source-line="([^"]*)"/.exec(body)?.[1];
        };
        expect([NaN, Infinity, -1, 0, '12', 12].map(lineOf)).toEqual([
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            '12'
        ]);
    });

    it('draws the code window and the sentence for a file this machine locks', async () => {
        const instance = await holding('locked', 'code/run.py', 'print("hello")\n', true);
        const body = render(Source, { context: clientContext(client), props: { instance } }).body;

        expect(body).toContain(catalog['source.readonly']);
        expect(body).toContain('data-fs-code="code/run.py"');
        expect(body).toContain('data-language="python"');
        // No editor at all: nothing to type into and no Save to press.
        expect(body).not.toContain('data-source-editor');
        // this machine locks the file, so there is nothing to save
        expect(body).not.toContain(`>${catalog['editor.save']}</span>`);
    });

    it('draws the same window and its own sentence for a file the read had to cut', async () => {
        const instance = await holding('cut', 'big.log', 'x'.repeat(TEXT_LIMIT + 10), false);
        const body = render(Source, { context: clientContext(client), props: { instance } }).body;

        expect(body).toContain(catalog['source.truncated']);
        expect(body).toContain('data-fs-code="big.log"');
        // the read was cut, so what is drawn is the code window rather than an editor over half a
        // file
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

    it('audits that draws a language it has none for as plain escaped text', () => {
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
        ['View.svelte', 'svelte']
    ];

    const MAP = languageMap(loadConfig(engineDir()).config);

    it('paints each of them under a language the highlighter has registered', () => {
        for (const [name, language] of NAMED) {
            expect([name, languageOf(name, MAP)]).toEqual([name, language]);
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

    it('audits that paints a snippet of each language the editor colours beyond the first eighteen', () => {
        const snippets: [string, string][] = [
            ['c', '#include <stdio.h>\nint main(void) { return 0; }\n'],
            ['cpp', 'template <typename T> class Box { public: T value; };\n'],
            ['cmake', 'cmake_minimum_required(VERSION 3.20)\nproject(demo)\n'],
            ['lua', 'local function add(a, b) return a + b end\n'],
            ['ruby', 'def add(a, b)\n  a + b\nend\n'],
            ['scss', '$gap: 4px;\n.a { .b { margin: $gap; } }\n'],
            ['java', 'public class A { public static void main(String[] a) {} }\n'],
            ['dart', 'void main() { final x = 1; print(x); }\n'],
            ['fortran', 'program demo\n  implicit none\n  integer :: i\nend program demo\n'],
            ['fortran-fixed', '      PROGRAM DEMO\n      INTEGER I\n      END\n'],
            ['jinja', '{% for item in items %}{{ item.name }}{% endfor %}\n']
        ];
        for (const [language, snippet] of snippets) {
            expect([language, codeHtml(snippet, language).includes('hljs-')]).toEqual([
                language,
                true
            ]);
        }
    });

    it('audits that paints a Svelte component with the grammar of xml, and a rite file as plain text', () => {
        const component = '<script lang="ts">let x = 1;</script>\n<p class="a">{x}</p>\n';
        expect(codeHtml(component, 'svelte')).toBe(codeHtml(component, 'xml'));
        expect(codeHtml(component, 'svelte')).toContain('hljs-tag');
        expect(codeHtml('(def x "a")\n', 'rite')).toBe('(def x &quot;a&quot;)\n');
    });

    it('audits that registers the languages of the map and plaintext, and no other', () => {
        const names = [...new Set(MAP.values())].sort();
        expect(names).toEqual([...registered()].sort());
    });

    it('audits that resolves a fence by highlight.js names and aliases, every alias keeping its owner', () => {
        const answers = ['html', 'svg', 'xhtml', 'f90', 'f95', 'h', 'c', 'cpp', 'hpp', 'jinja'].map(
            (alias) => [alias, languageNamed(alias)]
        );
        expect(answers).toEqual([
            ['html', 'xml'],
            ['svg', 'xml'],
            ['xhtml', 'xml'],
            ['f90', 'fortran'],
            ['f95', 'fortran'],
            ['h', 'c'],
            ['c', 'c'],
            ['cpp', 'cpp'],
            ['hpp', 'cpp'],
            ['jinja', 'jinja']
        ]);
        expect(['django', 'cobol', ''].map((name) => languageNamed(name))).toEqual([
            null,
            null,
            null
        ]);
        expect(languageNamed('svelte')).toBe('svelte');
        expect(languageNamed('fortran-fixed')).toBe('fortran-fixed');
        expect(languageNamed('rite')).toBe('rite');
    });

    it('audits that paints a Markdown fence by its language: highlight.js names, django and rite as plain text', () => {
        const marked = new Marked(codeColour);
        const fenced = (language: string, code: string): string =>
            marked.parse(['```' + language, code, '```', ''].join('\n')) as string;
        const cpp = fenced('cpp', 'class A { public: int x; };');
        expect(cpp).toContain('<code class="hljs language-cpp">');
        expect(cpp).toContain('hljs-keyword');
        expect(fenced('c', 'int x;')).toBe(
            fenced('h', 'int x;').replace('language-h', 'language-c')
        );
        expect(fenced('c', 'int x;')).toContain('hljs-type');
        expect(fenced('jinja', '{% if a %}x{% endif %}')).toContain('hljs-template-tag');
        // The highlighter registers jinja and no name django, so a fence of django stays plain.
        expect(fenced('django', '{% if a %}x{% endif %}')).not.toContain('hljs-');
        // The highlighter holds no grammar of rite's own, so a fence of rite stays plain.
        expect(fenced('rite', '(def x 1)')).not.toContain('hljs-');
        const svelte = '<p class="a">{x}</p>';
        expect(fenced('svelte', svelte).replace('language-svelte', 'language-html')).toBe(
            fenced('html', svelte)
        );
    });
});
