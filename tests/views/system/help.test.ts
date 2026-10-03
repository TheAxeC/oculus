// The manual: the view that draws it, and the manual itself against the application it describes.
//
// The source half is the gate that keeps HELP.md true as the tool changes: every listed view is
// named there by its id, every key of the sheet is in its table, every letter a group is reached by
// is written down, and every configuration file is described in the same words the Config view
// shows. A view, a key or a file added without a line here fails this file rather than leaving the
// manual quietly wrong.

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'svelte/server';
import Help from '../../../src/lib/views/system/help/Help.svelte';
import { newestAnswer } from '../../../src/lib/views/system/help/newest.ts';
import { loadDiagram } from '../../../src/lib/views/system/help/manual.ts';
import { NAMES, OUT } from '../../../utils/diagrams/diagrams.mjs';
import { renderManual, renderManualParts } from '../../../src/lib/server/content/docs.ts';
import { portfolioConfigFrom } from '../../../src/lib/data/index.ts';
import { LOCAL_KEYS } from '../../../src/lib/data/sources/config/local.ts';
import { descriptionKey } from '../../../src/lib/views/system/config/files.ts';
import { sheetRows } from '../../../src/lib/ui/menu/keys/key-rows.ts';
import {
    collectionKeys,
    engineDir,
    glyphCatalog,
    loadConfig,
    textCatalog
} from '../../../src/lib/data/sources/config.ts';
import { setCatalog, setGlyphs, t } from '../../../src/lib/state/shared/words/text.ts';
import type { DocState } from '../../../src/lib/state/system/docs.svelte.ts';
import {
    railOrder,
    readChord,
    readDocs,
    readGroups
} from '../../../src/lib/state/workbench/navigation/catalogue.ts';
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

/** The catalogue's order as the key table counts it: each chord letter and what it reaches. */
function chordOrder(): ReturnType<typeof railOrder> {
    return railOrder(
        client.registry.views().filter((view) => view.listed !== false),
        readGroups(config.nav_groups),
        readChord(config.direct_chord),
        readDocs(config.docs)
    );
}

/**
 * The keys a chord letter reaches, as the key table writes them: `x1` for a group of one entry,
 * `x1-xn` for a group of n entries up to nine, and `x1-x9` for a larger one, which is the range
 * that says exactly which keys open something.
 */
function range(letter: string): string {
    const count = Math.min(chordOrder().chords[letter]?.length ?? 0, 9);
    return count === 1 ? `${letter}1` : `${letter}1-${letter}${String(count)}`;
}

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
            loading: false,
            parts: [{ kind: 'html', html: '<h1>Oculus</h1>' }]
        });

        expect(body).toContain('Help');
        expect(body).toContain('<h1>Oculus</h1>');
    });

    it('says the manual is being read, and says what a failed read failed with', () => {
        expect(
            drawn({ html: '', frontmatter: null, error: '', loading: true, parts: [] })
        ).toContain('Reading the manual...');
        expect(
            drawn({ html: '', frontmatter: null, error: 'no such file', loading: false, parts: [] })
        ).toContain('The manual could not be read: no such file');
    });
});

/** The diagrams one manual's text shows, in order, as the server cuts it. */
function diagramsOf(text: string): string[] {
    return (
        renderManualParts(text).parts?.flatMap((part) =>
            part.kind === 'diagram' ? [part.name] : []
        ) ?? []
    );
}

describe('the diagrams in the manual', () => {
    const MARKDOWN = [
        '## Before',
        '',
        '![The layers & imports](docs/diagrams/layers.svg)',
        '',
        'Between.',
        '',
        '![A photo](pictures/photo.png)',
        ''
    ].join('\n');

    it('draws a diagram part from the route, with the prose parts around it', () => {
        const { html, parts = [] } = renderManualParts(MARKDOWN);
        const body = drawn({ html, frontmatter: null, error: '', loading: false, parts });
        expect(body).toContain('data-diagram="layers"');
        expect(body).toContain('aria-label="The layers &amp; imports"');
        expect(body).toContain('Drawing the diagram layers...');
        // The manual's own image of the file is taken out and drawn inline instead, since an image
        // keeps its own black under a dark theme.
        expect(body).not.toContain('src="docs/diagrams/layers.svg"');
        expect(body).toContain('<h2 id="user-content-before">Before</h2>');
        expect(body).toContain('<p>Between.</p>');
        expect(body).toContain('src="pictures/photo.png"');
    });

    it('audits that the manual is cut at a diagram alone, and every other image stays in the prose', () => {
        expect(renderManualParts(MARKDOWN).parts).toEqual([
            { kind: 'html', html: '<h2 id="user-content-before">Before</h2>\n' },
            { kind: 'diagram', name: 'layers', alt: 'The layers & imports' },
            {
                kind: 'html',
                html: '<p>Between.</p>\n<p><img src="pictures/photo.png" alt="A photo"></p>\n'
            }
        ]);
        expect(renderManualParts('No picture.\n').parts).toEqual([
            { kind: 'html', html: '<p>No picture.</p>\n' }
        ]);
    });

    it('audits that the answer keeps the diagram in its HTML, as one parse drew it', () => {
        const { html } = renderManualParts(MARKDOWN);
        expect(html).toContain(
            '<p><img src="docs/diagrams/layers.svg" alt="The layers &amp; imports"></p>'
        );
        expect(html).toContain('<p>Between.</p>');
    });

    it('audits that an image written inside a code block, a list or a quote is no diagram', () => {
        expect(diagramsOf('```\n![Layers](docs/diagrams/layers.svg)\n```\n')).toEqual([]);
        expect(diagramsOf('- one\n\n  ![Layers](docs/diagrams/layers.svg)\n')).toEqual([]);
        expect(diagramsOf('> ![Layers](docs/diagrams/layers.svg)\n')).toEqual([]);
        expect(diagramsOf('![Layers](docs/diagrams/layers.svg)\n')).toEqual(['layers']);
    });

    it('audits that the alternative text is read as it was written', () => {
        expect(renderManualParts('![a <b> "c" \'d\'](docs/diagrams/w.svg)\n').parts).toEqual([
            { kind: 'diagram', name: 'w', alt: 'a <b> "c" \'d\'' }
        ]);
    });

    it('audits that an ampersand and an apostrophe written as entities in the alt text read as written', () => {
        const [part] =
            renderManualParts('![Reader &amp; writer&#39;s view](docs/diagrams/w.svg)\n').parts ??
            [];
        expect(part).toEqual({ kind: 'diagram', name: 'w', alt: "Reader & writer's view" });
    });

    it('audits that the manual shows every diagram the generator writes, each one committed', async () => {
        const answer = renderManual({
            hub: engineDir(),
            engine: engineDir(),
            config: portfolioConfigFrom(config, engineDir())
        });
        const { parts } = (await answer.json()) as { parts: { kind: string; name?: string }[] };
        const shown = parts.flatMap((part) => (part.kind === 'diagram' ? [part.name] : []));
        expect([...shown].sort()).toEqual([...NAMES].sort());
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
                        row.key === range(group.chord ?? '') && row.meaning.includes(group.label)
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
        const missing = Object.keys(chordOrder().chords).filter(
            (letter) => !MANUAL.includes(`| ${range(letter)} |`)
        );
        expect(missing).toEqual([]);
    });

    it('gives no row to a chord letter that reaches nothing', () => {
        const letters = [
            config.direct_chord as string,
            ...Object.values(config.nav_groups as Record<string, { chord?: string }>).map(
                (group) => group.chord ?? ''
            )
        ].filter((letter) => letter !== '' && chordOrder().chords[letter] === undefined);
        // Every view sits in a group with a letter of its own, so the direct chord reaches none.
        expect(letters).toEqual([config.direct_chord]);
        const rows = sheetRows(catalog['app.keys.rows']).map((row) => row.key);
        const drawn = letters.filter(
            (letter) =>
                rows.some((key) => key.startsWith(`${letter}1`)) || MANUAL.includes(`| ${letter}1`)
        );
        expect(drawn).toEqual([]);
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
        const keys = [...LOCAL_KEYS];
        expect(keys).toContain('claude_bin');
        const paragraph = MANUAL.split('\n\n').filter((one) => one.includes('`local.yml` sits'));
        expect(paragraph).toHaveLength(1);
        const missing = keys.filter((key) => !paragraph[0].includes(`\`${key}\``));
        expect(missing).toEqual([]);
        // Where the file is, and when it is read: whenever it changes, every key holding at once.
        expect(paragraph[0]).toContain('`config/` folder');
        expect(paragraph[0]).toContain('read again whenever it changes');
        expect(paragraph[0]).toContain('a changed `port` moves the server');
    });

    it('names the machine-local file, the checks and where the hub comes from', () => {
        expect(MANUAL).toContain('`local.yml`');
        expect(MANUAL).toContain('`npm test`');
        expect(MANUAL).toContain('`npm run check`');
        expect(MANUAL).toContain('`hub` key of `local.yml`');
    });
});

describe('the diagram the manual fetches', () => {
    afterEach(() => vi.unstubAllGlobals());

    it('audits that the diagram is the text of the file, and the refused sentence with the status when the route refuses', async () => {
        const signal = new AbortController().signal;
        vi.stubGlobal('fetch', () => Promise.resolve(new Response('<svg/>')));
        expect(await loadDiagram('flow', signal)).toEqual({
            name: 'flow',
            svg: '<svg/>',
            error: ''
        });
        vi.stubGlobal('fetch', () => Promise.resolve(new Response('no', { status: 404 })));
        expect(await loadDiagram('flow', signal)).toEqual({
            name: 'flow',
            svg: '',
            error: t('ui.answer_refused', 404)
        });
    });

    it('audits that a failed fetch says what it failed with when no answer came', async () => {
        vi.stubGlobal('fetch', () => Promise.reject(new Error('offline')));
        const held = await loadDiagram('flow', new AbortController().signal);
        expect(held).toEqual({ name: 'flow', svg: '', error: 'offline' });
    });
});
