// The manual: the view that draws it, and the manual itself against the application it describes.
//
// The source half is the gate that keeps HELP.md true as the tool changes: every listed view is
// named there by its id, every key of the sheet is in its table, every letter a group is reached by
// is written down, and every configuration file is described in the same words the Config view
// shows. A view, a key or a file added without a line here fails this file rather than leaving the
// manual quietly wrong.

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import Help from '../../../src/lib/views/system/help/Help.svelte';
import { splitManual } from '../../../src/lib/views/system/help/manual.ts';
import { newestAnswer } from '../../../src/lib/views/system/help/newest.ts';
import { NAMES, OUT } from '../../../bin/diagrams/diagrams.mjs';
import { renderManual, renderMarkdown } from '../../../src/lib/server/content/docs.ts';
import { portfolioConfigFrom } from '../../../src/lib/data/index.ts';
import { descriptionKey } from '../../../src/lib/views/system/config/files.ts';
import { sheetRows } from '../../../src/lib/ui/menu/key-rows.ts';
import {
    collectionKeys,
    engineDir,
    glyphCatalog,
    loadConfig,
    textCatalog
} from '../../../src/lib/data/sources/config.ts';
import { setCatalog, setGlyphs } from '../../../src/lib/state/shared/words/text.ts';
import type { DocState } from '../../../src/lib/state/system/docs.svelte.ts';
import type { Instance } from '../../../src/lib/state/workbench/layout/index.ts';
import { registerAll, registerCollections } from '../../../src/routes/views.ts';
import { clientContext, createClientState, type ClientState } from '../../fixtures/client.ts';

let client: ClientState;

beforeEach(() => {
    client = createClientState();
    registerAll(client.registry);
    registerCollections(client.registry, collectionKeys(config));
});

const { config } = loadConfig(engineDir());
const catalog = textCatalog(config);
setCatalog(catalog);
setGlyphs(glyphCatalog(config));

const MANUAL = readFileSync(join(engineDir(), 'HELP.md'), 'utf8');

const instance: Instance = { id: 'help-one', view: 'help', state: {} };

/** The view with a doubled document store, so a case draws the manual without a server. */
function drawn(doc: DocState): string {
    const context = clientContext({ ...client, docs: { ...client.docs, manual: () => doc } });
    return render(Help, { context, props: { instance } }).body;
}

describe('the Help view', () => {
    it('draws the manual the store holds', () => {
        const body = drawn({
            html: '<h1>Oculus</h1>',
            frontmatter: null,
            error: '',
            loading: false
        });

        expect(body).toContain('Help');
        expect(body).toContain('<h1>Oculus</h1>');
    });

    it('says the manual is being read, and says what a failed read failed with', () => {
        expect(drawn({ html: '', frontmatter: null, error: '', loading: true })).toContain(
            'Reading the manual...'
        );
        expect(
            drawn({ html: '', frontmatter: null, error: 'no such file', loading: false })
        ).toContain('The manual could not be read: no such file');
    });
});

/** The diagrams one rendered manual shows, in order, as the Help view cuts it. */
function diagramsOf(html: string): string[] {
    return splitManual(html).flatMap((part) => (part.kind === 'diagram' ? [part.name] : []));
}

describe('the diagrams in the manual', () => {
    const html = [
        '<h2>Before</h2>',
        '<p><img src="docs/diagrams/layers.svg" alt="The layers &amp; imports"></p>',
        '<p>Between.</p>',
        '<p><img src="pictures/photo.png" alt="A photo"></p>'
    ].join('\n');

    it('draws a diagram of docs/diagrams from the route, with the prose around it', () => {
        // revert: src/lib/views/system/help/Help.svelte:63 => {#if false}
        const body = drawn({ html, frontmatter: null, error: '', loading: false });
        expect(body).toContain('data-diagram="layers"');
        expect(body).toContain('aria-label="The layers &amp; imports"');
        expect(body).toContain('Drawing the diagram layers...');
        // The manual's own image of the file is taken out and drawn inline instead, since an image
        // keeps its own black under a dark theme.
        expect(body).not.toContain('src="docs/diagrams/layers.svg"');
        expect(body).toContain('<h2>Before</h2>');
        expect(body).toContain('<p>Between.</p>');
    });

    it('audits that the manual is cut at a diagram alone, and every other image stays in the prose', () => {
        // revert: src/lib/views/system/help/manual.ts:18 => const SOURCE = /^(?:docs\/diagrams\/)?([^.]*)\.(?:svg|png)$/;
        expect(splitManual(html)).toEqual([
            { kind: 'html', html: '<h2>Before</h2>\n' },
            { kind: 'diagram', name: 'layers', alt: 'The layers & imports' },
            {
                kind: 'html',
                html: '\n<p>Between.</p>\n<p><img src="pictures/photo.png" alt="A photo"></p>'
            }
        ]);
        expect(splitManual('<p>No picture.</p>')).toEqual([
            { kind: 'html', html: '<p>No picture.</p>' }
        ]);
    });

    it('audits that an image written inside a code block is no diagram', () => {
        // revert: src/lib/server/content/docs.ts:248 => if (base === null) return text.replace(/!\[([^\]]*)\]\(([^)]*)\)/g, '<img src="$2" alt="$1">');
        const fenced = renderMarkdown('```\n![Layers](docs/diagrams/layers.svg)\n```\n', null);
        expect(diagramsOf(fenced)).toEqual([]);
        expect(diagramsOf(renderMarkdown('![Layers](docs/diagrams/layers.svg)\n', null))).toEqual([
            'layers'
        ]);
    });

    it('audits that the alternative text is read as it was written', () => {
        // revert: src/lib/views/system/help/manual.ts:33 => return found[1];
        const [part] = splitManual(
            '<img alt="a &lt;b&gt; &quot;c&quot; &#39;d&#39;" src="docs/diagrams/w.svg">'
        );
        expect(part).toEqual({ kind: 'diagram', name: 'w', alt: 'a <b> "c" \'d\'' });
    });

    it('audits that the manual shows every diagram the generator writes, each one committed', async () => {
        // revert: bin/diagrams/diagrams.mjs:59 => 'writes', 'calls'
        const answer = renderManual({
            hub: engineDir(),
            engine: engineDir(),
            config: portfolioConfigFrom(config, engineDir())
        });
        const { html } = (await answer.json()) as { html: string };
        expect([...diagramsOf(html)].sort()).toEqual([...NAMES].sort());
        for (const name of NAMES) {
            expect(readdirSync(join(engineDir(), OUT))).toContain(`${name}.svg`);
        }
    });
});

/**
 * A question still out: the work newestAnswer starts, the function that answers it, and the signal
 * the work was handed once it started.
 */
function deferred(): {
    work: (signal: AbortSignal) => Promise<string>;
    settle: (answer: string) => void;
    signal: () => AbortSignal | null;
} {
    let settle: (answer: string) => void = () => undefined;
    let handed: AbortSignal | null = null;
    const answer = new Promise<string>((resolve) => {
        settle = resolve;
    });
    const work = (signal: AbortSignal): Promise<string> => {
        handed = signal;
        return answer;
    };
    return { work, settle, signal: () => handed };
}

/** Every answer already settled has been handed on once this resolves. */
function landed(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, 0));
}

describe('the newest answer a diagram takes', () => {
    it('audits that an answer for a name a later one replaced is dropped', async () => {
        // revert: src/lib/views/system/help/newest.ts:22 => take(answer);
        const taken: string[] = [];
        const ask = newestAnswer<string>((answer) => taken.push(answer));
        const earlier = deferred();
        const stopEarlier = ask(earlier.work);
        stopEarlier();
        const later = deferred();
        ask(later.work);
        later.settle('writes');
        await landed();
        earlier.settle('layers');
        await landed();
        expect(taken).toEqual(['writes']);
    });

    it('audits that an answer landing after the view closed is dropped', async () => {
        // revert: src/lib/views/system/help/newest.ts:22 => take(answer);
        const taken: string[] = [];
        const ask = newestAnswer<string>((answer) => taken.push(answer));
        const out = deferred();
        const close = ask(out.work);
        close();
        out.settle('layers');
        await landed();
        expect(taken).toEqual([]);
    });

    it('audits that a stop aborts the signal its work was handed, and only that one', () => {
        // revert: src/lib/views/system/help/newest.ts:25 => delete
        const ask = newestAnswer<string>(() => undefined);
        const first = deferred();
        const second = deferred();
        const stopFirst = ask(first.work);
        ask(second.work);
        expect(first.signal()?.aborted).toBe(false);
        stopFirst();
        expect(first.signal()?.aborted).toBe(true);
        expect(second.signal()?.aborted).toBe(false);
    });
});

describe('the key sheet', () => {
    it('names every catalogue group that has a chord, by its label and its letter', () => {
        const groups = Object.values(
            config.nav_groups as Record<string, { label: string; chord?: string }>
        ).filter((group) => group.chord !== undefined);
        expect(groups.length).toBeGreaterThan(0);
        const rows = sheetRows(catalog['app.keys.rows']);
        const missing = groups.filter(
            (group) =>
                !rows.some(
                    (row) =>
                        row.key.includes(`${group.chord}1-${group.chord}9`) &&
                        row.meaning.includes(group.label)
                )
        );
        expect(missing.map((group) => group.label)).toEqual([]);
    });
});

describe('the manual itself', () => {
    it('names every view the catalogue lists, by its id', () => {
        const missing = client.registry
            .views()
            .filter((view) => view.listed !== false)
            .map((view) => view.id)
            .filter((id) => !MANUAL.includes(`\`${id}\``));
        expect(missing).toEqual([]);
    });

    it('holds every key of the sheet in its table', () => {
        const missing = sheetRows(catalog['app.keys.rows'])
            .map((row) => row.key)
            .filter((key) => !MANUAL.includes(`| ${key} |`));
        expect(missing).toEqual([]);
    });

    it('writes down every letter a catalogue group is reached by', () => {
        const groups = config.nav_groups as Record<string, { chord?: string }>;
        const letters = [
            config.direct_chord as string,
            ...Object.values(groups)
                .map((group) => group.chord)
                .filter((chord): chord is string => chord !== undefined)
        ];
        const missing = letters.filter((letter) => !MANUAL.includes(`${letter}1-${letter}9`));
        expect(missing).toEqual([]);
    });

    it('describes every configuration file in the words the Config view shows', () => {
        const files = readdirSync(join(engineDir(), 'config')).filter((name) =>
            name.endsWith('.yml')
        );
        expect(files.length).toBeGreaterThan(0);
        const missing = files.filter(
            (name) =>
                !MANUAL.includes(`\`${name}\``) || !MANUAL.includes(catalog[descriptionKey(name)])
        );
        expect(missing).toEqual([]);
    });

    it('names every key the machine-local file may carry', () => {
        const source = readFileSync(
            join(engineDir(), 'src', 'lib', 'data', 'sources', 'config', 'local.ts'),
            'utf8'
        );
        const block = /const LOCAL_KEYS = \[([^\]]*)\]/.exec(source)?.[1] ?? '';
        const keys = [...block.matchAll(/'([a-z_]+)'/g)].map((found) => found[1]);
        expect(keys).toContain('claude_bin');
        const paragraph = MANUAL.split('\n\n').filter((one) => one.includes('`local.yml` sits'));
        expect(paragraph).toHaveLength(1);
        const missing = keys.filter((key) => !paragraph[0].includes(`\`${key}\``));
        expect(missing).toEqual([]);
        // Where the file is, and which keys a running server would have to be restarted to pick up.
        expect(paragraph[0]).toContain('`config/` folder');
        expect(paragraph[0]).toContain('read once when the server starts');
        expect(paragraph[0]).toContain('read again on every write');
    });

    it('names the machine-local file, the checks and where the hub comes from', () => {
        expect(MANUAL).toContain('`local.yml`');
        expect(MANUAL).toContain('`npm test`');
        expect(MANUAL).toContain('`npm run check`');
        expect(MANUAL).toContain('`npm run test:browser`');
        expect(MANUAL).toContain('`hub` key of `local.yml`');
    });
});
