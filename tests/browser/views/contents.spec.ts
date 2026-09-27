// A document's table of contents in Chrome: a `[TOC]` paragraph drawn as links to the document's
// headings, and a press on one of them scrolling the box of the view it is drawn in and nothing
// else, in a hub document, in the manual, in a project's document and in the source tab's preview.
// A heading whose words name a property of the page (`Method`) keeps its prefixed id through the
// sanitiser and is reached through the list and through a link written by hand to `#method`; a
// document too short to scroll scrolls nothing of the shell around its pane.
//
// The hub document and the project's README are written into the run's own copy of demo/ under the
// system temporary directory, and the manual into the run's own engine directory, each put back at
// the end. The manual beside the hub document is the engine's own HELP.md, whose contents list and
// heading ids are what the second tab holds.
//
// What this does NOT cover: the list's own markup (the nesting, the escaping, a `[TOC]` left as
// text), which tests/data/prose/markdown.test.ts reads off the document rule.

import { expect, test, type Locator, type Page } from '@playwright/test';
import { SHOWN_VIEW, boot, openProjectTab, openView } from '../helpers/rail.ts';
import { keepServedFiles } from '../helpers/files.ts';
import {
    readEngineFile,
    readHubFile,
    removeFromHub,
    shortOf,
    writeEngineFile,
    writeHubFile
} from '../helpers/hub.ts';
import { t } from '../helpers/words.ts';
import { engineDir, loadConfig } from '../../../src/lib/data/sources/config.ts';

keepServedFiles();

const merged = loadConfig(engineDir()).config;

/** What every heading id of a rendered document starts with. */
const PREFIX = 'user-content-';

/** The hub document of the `docs:` list these cases write, by the path config/layout.yml names. */
const HPC = (merged.docs as { label: string; path: string }[]).find(
    (one) => one.path === 'docs/HPC-UTwente-howto.md'
);

const BANDITS = 'projects/active/graph-bandits';

/** Paragraphs enough to let a heading above them scroll to the top of any box on the page. */
function filler(count: number): string {
    return Array.from(
        { length: count },
        (_, at) => `Line ${String(at)} of the prose that fills the box below a heading.`
    ).join('\n\n');
}

/**
 * The hub document: a contents list, a deep heading named as one of the manual's is, so the two
 * tabs hold the same id, and a link to a fragment no heading carries.
 */
const HOWTO = [
    '[TOC]',
    '# The cluster',
    filler(8),
    '## Submitting',
    filler(8),
    '### The keys',
    filler(80),
    '[nowhere](#no-such-heading)'
].join('\n\n');

/**
 * A manual of the served engine directory: its contents list, one diagram, which cuts the prose
 * into two runs, and a heading after it with prose enough below to reach the top of the box.
 */
const MANUAL = [
    '# Manual',
    '[TOC]',
    filler(4),
    '![The layers](docs/diagrams/layers.svg)',
    '## After the diagram',
    filler(80)
].join('\n\n');

/**
 * A hub document whose heading `Method` would be an id the sanitiser drops without its prefix, a
 * link written by hand to it at the top, and prose enough below it to reach the top of the box.
 */
const METHOD = [
    '[TOC]',
    '[the method, by hand](#method)',
    '# The study',
    filler(12),
    '## Method',
    filler(80)
].join('\n\n');

/** How far a heading sits below the top of the box given, in pixels. */
async function offset(scroller: Locator, id: string): Promise<number> {
    return scroller.evaluate((box, wanted) => {
        const heading = [...box.querySelectorAll('[id]')].find((one) => one.id === wanted);
        if (heading === undefined) return Number.NaN;
        return heading.getBoundingClientRect().top - box.getBoundingClientRect().top;
    }, id);
}

function scrollTop(box: Locator): Promise<number> {
    return box.evaluate((node) => node.scrollTop);
}

/**
 * Open the application on a saved page split in two: the Status tab and the manual on the left,
 * the manual shown, and the hub document on the right, so the manual's box is a second tab whose
 * scroll can be read while the document is pressed.
 */
async function bootSplit(page: Page, path: string, label: string): Promise<void> {
    const tab = (id: string, view: string, state: Record<string, string> | null) => ({
        id,
        view,
        state
    });
    const saved = JSON.stringify({
        version: 4,
        pages: [
            {
                id: 'contents-page',
                label: t('ui.page_default', 1),
                workbench: {
                    root: {
                        kind: 'split',
                        dir: 'row',
                        sizes: [0.5, 0.5],
                        children: [
                            {
                                kind: 'pane',
                                tabs: [
                                    tab('status-tab', 'status', null),
                                    tab('help-tab', 'help', null)
                                ],
                                active: 'help-tab'
                            },
                            {
                                kind: 'pane',
                                tabs: [tab('doc-tab', 'doc', { id: path, path, label })],
                                active: 'doc-tab'
                            }
                        ]
                    }
                }
            }
        ],
        current: 'contents-page'
    });
    await boot(page, saved);
}

test('a contents entry of a hub document scrolls its own box to the heading and nothing else', async ({
    page
}) => {
    // revert: src/lib/views/shared/prose/jump.ts "const box = link.closest('[data-instance]');" => const box = document.body;
    // revert: src/lib/views/shared/prose/jump.ts "event.preventDefault();" => delete
    if (HPC === undefined) throw new Error('config/layout.yml names no HPC document');
    writeHubFile(HPC.path, HOWTO);
    try {
        await bootSplit(page, HPC.path, HPC.label);
        const doc = page.locator(`[data-instance][data-path="${HPC.path}"]`);
        const manual = page.locator(`[data-pane-view="help"] ${SHOWN_VIEW} [data-instance]`);
        await expect(doc.getByRole('heading', { name: 'The keys' })).toBeVisible();
        await expect(manual.getByRole('heading', { name: 'The keys', exact: true })).toHaveCount(1);
        // HELP.md opens with its own contents list, which reaches the same heading.
        await expect(manual.locator(`ul.toc a[href="#${PREFIX}the-keys"]`)).toHaveCount(1);
        // The manual carries a heading of the same name, so both tabs hold the id pressed for.
        expect(await manual.locator(`[id="${PREFIX}the-keys"]`).count()).toBe(1);
        await manual.evaluate((node) => {
            node.scrollTop = 150;
        });
        await expect.poll(() => scrollTop(manual)).toBe(150);
        const address = page.url();

        const entry = doc.locator('ul.toc a', { hasText: 'The keys' });
        await expect(entry).toHaveAttribute('href', `#${PREFIX}the-keys`);
        await entry.click();

        await expect
            .poll(async () => Math.abs(await offset(doc, `${PREFIX}the-keys`)))
            .toBeLessThan(1);
        expect(await scrollTop(doc)).toBeGreaterThan(0);
        expect(await scrollTop(manual)).toBe(150);
        expect(page.url()).toBe(address);
    } finally {
        removeFromHub(HPC.path);
    }
});

test('a link to a fragment no heading of the document carries changes nothing', async ({
    page
}) => {
    // revert: src/lib/views/shared/prose/jump.ts "event.preventDefault();" => delete
    if (HPC === undefined) throw new Error('config/layout.yml names no HPC document');
    writeHubFile(HPC.path, HOWTO);
    try {
        await bootSplit(page, HPC.path, HPC.label);
        const doc = page.locator(`[data-instance][data-path="${HPC.path}"]`);
        const link = doc.getByRole('link', { name: 'nowhere' });
        await link.scrollIntoViewIfNeeded();
        const before = await scrollTop(doc);
        const address = page.url();

        await link.click();

        expect(page.url()).toBe(address);
        expect(await scrollTop(doc)).toBe(before);
    } finally {
        removeFromHub(HPC.path);
    }
});

test('a contents entry of the manual reaches a heading drawn in a later run of its prose', async ({
    page
}) => {
    // revert: src/lib/views/shared/prose/jump.ts "const box = link.closest('[data-instance]');" => const box = link.closest('.doc');
    const kept = readEngineFile('HELP.md');
    writeEngineFile('HELP.md', MANUAL);
    try {
        await boot(page);
        await openView(page, 'help', t('views.help'));
        const manual = page.locator(`[data-pane-view="help"] ${SHOWN_VIEW} [data-instance]`);
        const id = `${PREFIX}after-the-diagram`;
        await expect(manual.locator('[data-diagram="layers"]')).toHaveCount(1);
        await expect(manual.getByRole('heading', { name: 'After the diagram' })).toHaveCount(1);
        // The contents list and the heading are drawn by two runs of prose, the diagram between.
        const runs = await manual.evaluate((box, wanted) => {
            const docs = [...box.querySelectorAll('.doc')];
            return {
                list: docs.findIndex((one) => one.querySelector('ul.toc') !== null),
                heading: docs.findIndex((one) => one.querySelector(`[id="${wanted}"]`) !== null)
            };
        }, id);
        expect(runs).toEqual({ list: 0, heading: 1 });
        const address = page.url();

        await manual.locator('ul.toc a', { hasText: 'After the diagram' }).click();

        await expect.poll(async () => Math.abs(await offset(manual, id))).toBeLessThan(1);
        expect(await scrollTop(manual)).toBeGreaterThan(0);
        expect(page.url()).toBe(address);
    } finally {
        writeEngineFile('HELP.md', kept);
    }
});

test("a contents entry of a project's document scrolls the project tab to the heading", async ({
    page
}) => {
    // revert: src/lib/views/shared/prose/jump.ts "const scroller = scrollerOf(heading, box);" => const scroller = box as HTMLElement;
    const readme = `${BANDITS}/README.md`;
    const kept = readHubFile(readme);
    writeHubFile(readme, ['[TOC]', kept, '## Deep in the readme', filler(80)].join('\n\n'));
    try {
        await boot(page);
        await openProjectTab(page, shortOf(BANDITS));
        const project = page.locator('[data-project] .doc');
        await expect(project.locator('ul.toc')).toBeVisible();
        // The project tab's box does not scroll itself; the pane's body around it does.
        const scroller = page.locator('[data-scroll]:has([data-project])').last();
        const address = page.url();

        await project.locator('ul.toc a', { hasText: 'Deep in the readme' }).click();

        await expect
            .poll(async () => Math.abs(await offset(scroller, `${PREFIX}deep-in-the-readme`)))
            .toBeLessThan(1);
        expect(await scrollTop(scroller)).toBeGreaterThan(0);
        expect(page.url()).toBe(address);
    } finally {
        writeHubFile(readme, kept);
    }
});

test('a heading named Method keeps its id and is reached from the list and from a link by hand', async ({
    page
}) => {
    // revert: src/lib/data/prose/markdown.ts "export const HEADING_PREFIX = 'user-content-';" => export const HEADING_PREFIX = '';
    // revert: src/lib/views/shared/prose/jump.ts "const wanted = [...plain, ...plain.map((one) => `${HEADING_ID_PREFIX}${one}`)];" => const wanted = plain;
    if (HPC === undefined) throw new Error('config/layout.yml names no HPC document');
    writeHubFile(HPC.path, METHOD);
    try {
        await bootSplit(page, HPC.path, HPC.label);
        const doc = page.locator(`[data-instance][data-path="${HPC.path}"]`);
        const id = `${PREFIX}method`;
        // The sanitiser drops an id that names a property of the page; the prefixed one stays.
        await expect(doc.locator(`h2[id="${id}"]`)).toHaveCount(1);
        const address = page.url();

        await doc.locator('ul.toc a', { hasText: 'Method' }).click();
        await expect.poll(async () => Math.abs(await offset(doc, id))).toBeLessThan(1);

        await doc.evaluate((node) => {
            node.scrollTop = 0;
        });
        await expect.poll(() => scrollTop(doc)).toBe(0);
        await doc.getByRole('link', { name: 'the method, by hand' }).click();
        await expect.poll(async () => Math.abs(await offset(doc, id))).toBeLessThan(1);
        expect(page.url()).toBe(address);
    } finally {
        removeFromHub(HPC.path);
    }
});

test('a document too short to scroll scrolls nothing of the shell around its pane', async ({
    page
}) => {
    // revert: src/lib/views/shared/prose/jump.ts "const limit = box.closest('[data-scroll]') ?? box;" => const limit = document.documentElement;
    if (HPC === undefined) throw new Error('config/layout.yml names no HPC document');
    writeHubFile(
        HPC.path,
        ['[TOC]', '# Short', 'One line.', '## End', 'Another line.'].join('\n\n')
    );
    try {
        await bootSplit(page, HPC.path, HPC.label);
        const doc = page.locator(`[data-instance][data-path="${HPC.path}"]`);
        await expect(doc.locator('ul.toc')).toBeVisible();
        // The shell's box around the pane is made to scroll, with room to, so a press that climbed
        // past the pane's own body would move it.
        const shell = page.locator(`[data-pane]:has([data-path="${HPC.path}"])`).last();
        await shell.evaluate((node) => {
            node.style.height = `${String(node.clientHeight)}px`;
            node.style.overflowY = 'auto';
            node.style.position = 'relative';
            const room = document.createElement('div');
            room.style.position = 'absolute';
            room.style.top = '0';
            room.style.width = '1px';
            room.style.height = '4000px';
            room.style.pointerEvents = 'none';
            room.dataset.specRoom = '';
            node.append(room);
        });
        expect(await shell.evaluate((node) => node.scrollHeight > node.clientHeight)).toBe(true);
        const address = page.url();

        await doc.locator('ul.toc a', { hasText: 'End' }).click();

        // Every box from the document out to the page, the shell's included, is where it was.
        const moved = await doc.evaluate((node) => {
            const scrolled: string[] = [];
            for (let at: Element | null = node; at !== null; at = at.parentElement) {
                if (at.scrollTop !== 0) scrolled.push(at.tagName);
            }
            return scrolled;
        });
        expect(moved).toEqual([]);
        expect(page.url()).toBe(address);
    } finally {
        removeFromHub(HPC.path);
    }
});

test("a contents entry of the source tab's preview scrolls the preview to the heading", async ({
    page
}) => {
    // revert: src/lib/ui/html.ts "return sanitise(renderDocument(text));" => return sanitise(marked.parse(text, { async: false }));
    await boot(page);
    await openView(page, 'files', t('views.files'));
    await page.locator('[data-fs-row="hub:"]').getByRole('button').first().click();
    await page.locator('[data-fs-row="hub:README.md"]').getByRole('button').first().click();
    const editor = page.locator('[data-source-editor="README.md"]');
    const preview = page.locator('[data-source-preview="README.md"]');
    await expect(preview).toBeVisible();
    // Typed, never saved: the preview renders the working text on the page.
    await editor
        .getByRole('textbox')
        .fill(['[TOC]', '# Typed', filler(8), '## Far down', filler(80)].join('\n\n'));
    const id = `${PREFIX}far-down`;
    await expect(preview.locator(`h2[id="${id}"]`)).toHaveCount(1);
    const address = page.url();

    await preview.locator('ul.toc a', { hasText: 'Far down' }).click();

    await expect.poll(async () => Math.abs(await offset(preview, id))).toBeLessThan(1);
    expect(await scrollTop(preview)).toBeGreaterThan(0);
    expect(page.url()).toBe(address);
});
