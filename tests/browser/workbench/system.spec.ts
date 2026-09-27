// The System group in Chrome: the manual, the configuration and a document of the hub.
//
// These are the three surfaces whose content only a server answers, and no server rendering runs
// the fetch: the manual is read from the engine directory, each configuration card reads its file
// through the file route under the `engine` root, the machine's own local.yml of that folder
// included, and a hub document is rendered from the hub the run serves. The document is written
// into that hub, which is the run's own copy of demo/ under the system temporary directory, and
// removed again at the end.
//
// A hub document keeps the heading node it drew while writes elsewhere under the hub are read,
// each re-read answered 304 and none of them drawing the loading words; a saved document tab whose
// path left the `docs:` list follows the entry carrying its label and writes the entry's path into
// the saved layout, and closes into the tab that already shows that entry when there is one; one
// matching no entry names the path it asked for.
//
// The manual shows every diagram of docs/diagrams/, each drawn in the prose's own colour from
// the diagram route under a light theme and a dark one; a diagram file that carries a script is
// drawn as its drawing alone; a diagram whose view closes while its answer is held back aborts its
// fetch; and the route refuses a name that is not one of that folder's `.svg` files.
//
// What this does NOT cover: saving a configuration edit, which is the source tab's own write and is
// covered by tests/browser/sources/source.spec.ts.

import { expect, test, type Page, type Request, type Route } from '@playwright/test';
import { SHOWN_VIEW, boot, openView, pickTheme, showRailPage } from '../helpers/rail.ts';
import { removeFromHub, writeHubFile } from '../helpers/hub.ts';
import { t, tabNamed } from '../helpers/words.ts';
import { engineDir, loadConfig } from '../../../src/lib/data/sources/config.ts';
import { NAMES } from '../../../bin/diagrams/diagrams.mjs';
import { LAYOUT_KEY } from '../../../src/lib/state/workbench/layout/saved/storage.ts';

const merged = loadConfig(engineDir()).config;

/** One entry of the `docs:` list of config/layout.yml, by the path it names. */
function entry(path: string): { label: string; path: string; group: string } {
    const docs = merged.docs as { label: string; path: string; group: string }[];
    const found = docs.find((one) => one.path === path);
    if (found === undefined) throw new Error(`config/layout.yml names no document ${path}`);
    return found;
}

const HPC = entry('docs/HPC-UTwente-howto.md');

const HOWTO = '# The cluster\n\nSubmit every job with sbatch.\n';

/** The card one configuration file is drawn as. */
function card(page: Page, name: string): ReturnType<Page['locator']> {
    return page.locator(`[data-card="${name}"]`);
}

test('the manual is drawn from the file beside DESIGN.md', async ({ page }) => {
    await boot(page);
    await openView(page, 'help', t('views.help'));

    await expect(page.getByRole('heading', { name: 'The views', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'The keys', exact: true })).toBeVisible();
    // The manual names every listed view by its id, the Config view among them, in its table.
    await expect(page.getByRole('cell', { name: 'config', exact: true })).toBeVisible();
});

/** The colour of one diagram's lines and letters, and the colour of the prose beside it. */
async function paint(
    page: Page,
    name: string
): Promise<{ line: string; letter: string; text: string }> {
    return page.locator(`[data-diagram="${name}"] svg`).evaluate((node) => {
        const prose = document.querySelector('.doc');
        const edge = node.querySelector('path');
        const label = node.querySelector('text');
        return {
            line: edge === null ? '' : getComputedStyle(edge).stroke,
            letter: label === null ? '' : getComputedStyle(label).fill,
            text: prose === null ? '' : getComputedStyle(prose).color
        };
    });
}

test('the manual draws every diagram in the colour of its prose, light and dark', async ({
    page
}) => {
    // revert: src/lib/views/system/help/Diagram.svelte "color: var(--ink-txt, var(--ink));" => color: black;
    await boot(page);
    const colours: string[] = [];
    for (const theme of ['light', 'dark']) {
        await pickTheme(page, theme);
        await openView(page, 'help', t('views.help'));
        await expect(page.locator('[data-diagram]')).toHaveCount(NAMES.length);
        for (const name of NAMES) {
            const figure = page.locator(`[data-diagram="${name}"]`);
            await expect(figure.locator('svg text').first()).toBeVisible();
            const drawn = await paint(page, name);
            expect(drawn.line).toBe(drawn.text);
            expect(drawn.letter).toBe(drawn.text);
            colours.push(drawn.text);
        }
    }
    // The two themes paint their prose differently, so the diagrams followed the page, not a colour
    // of their own.
    expect(new Set(colours).size).toBe(2);
});

test('a diagram file carrying a script and a handler is drawn as a drawing alone', async ({
    page
}) => {
    // revert: src/lib/views/system/help/Diagram.svelte "{@html sanitiseGraph(shown.svg)}" => {@html shown.svg}
    const seen: string[] = [];
    page.on('dialog', (dialog) => {
        seen.push(dialog.message());
        void dialog.dismiss();
    });
    await page.route('**/api/diagrams/layers.svg', (route) =>
        route.fulfill({
            contentType: 'image/svg+xml',
            body: [
                '<svg xmlns="http://www.w3.org/2000/svg" width="80pt" height="20pt" onload="alert(1)">',
                '<script>alert(2)</script>',
                '<foreignObject><div>outside</div></foreignObject>',
                '<g id="clobber"><text fill="currentColor" x="4" y="14">kept</text></g>',
                '</svg>'
            ].join('')
        })
    );
    await boot(page);
    await openView(page, 'help', t('views.help'));
    const figure = page.locator('[data-diagram="layers"]');
    await expect(figure.locator('svg text')).toHaveText('kept');
    // The filter keeps the drawing's own elements and drops everything that runs or embeds.
    await expect(figure.locator('script, foreignObject, [onload], [id]')).toHaveCount(0);
    expect(seen).toEqual([]);
});

test('a write edge names the functions it calls on hover, and no style of the file is drawn', async ({
    page
}) => {
    // revert: src/lib/ui/html.ts "export const GRAPH_TAGS = ['svg', 'g', 'title', 'polygon', 'polyline', 'path', 'ellipse', 'text'];" => export const GRAPH_TAGS = ['svg', 'g', 'polygon', 'polyline', 'path', 'ellipse', 'text'];
    // revert: src/lib/ui/html.ts "export const GRAPH_TAGS = ['svg', 'g', 'title', 'polygon', 'polyline', 'path', 'ellipse', 'text'];" => export const GRAPH_TAGS = ['svg', 'style', 'g', 'title', 'polygon', 'polyline', 'path', 'ellipse', 'text'];
    await boot(page);
    await openView(page, 'help', t('views.help'));
    const figure = page.locator('[data-diagram="writes"]');
    await expect(figure.locator('svg text').first()).toBeVisible();
    const titles = await figure.locator('g.edge > title').allTextContents();
    expect(titles.some((one) => one.includes('logChanges'))).toBe(true);
    // The file's own grey is for a viewer outside oculus; in the page the filter leaves it out.
    await expect(figure.locator('svg style')).toHaveCount(0);
});

/**
 * Let a held request go on to the server. A request the page aborted while it was held has no
 * route left to continue, which is what a stopped fetch looks like here, so a refusal is kept.
 */
async function passOn(route: Route): Promise<void> {
    try {
        await route.continue();
    } catch {
        // The page aborted the request while it was held.
    }
}

/** Close the Help tab by its own close control. */
async function closeHelp(page: Page): Promise<void> {
    await page
        .locator('.tab', { has: page.getByRole('tab', { name: tabNamed(t('views.help')) }) })
        .getByRole('button', { name: t('ui.close_tab') })
        .click();
}

test('a diagram whose view closes with its answer held back stops its fetch, and nothing lands', async ({
    page
}) => {
    // revert: src/lib/views/system/help/Diagram.svelte "return ask((signal) => load(asked, signal));" => void ask((signal) => load(asked, signal));
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    const failed: Request[] = [];
    const finished: Request[] = [];
    const layers = (url: string): boolean => url.endsWith('/api/diagrams/layers.svg');
    page.on('requestfailed', (request) => {
        if (layers(request.url())) failed.push(request);
    });
    page.on('requestfinished', (request) => {
        if (layers(request.url())) finished.push(request);
    });
    // The first ask of the file is the one the route holds back.
    let first: Request | null = null;
    let release: () => void = () => undefined;
    const held = new Promise<void>((resolve) => {
        release = resolve;
    });
    let passed: Promise<void> = Promise.resolve();
    await page.route('**/api/diagrams/layers.svg', async (route) => {
        first ??= route.request();
        await held;
        passed = passOn(route);
        await passed;
    });
    await boot(page);
    await openView(page, 'help', t('views.help'));
    await expect(page.getByText(t('help.diagram_loading', 'layers'))).toBeVisible();

    await closeHelp(page);
    // The closed Help tab took its figures with it, so nothing is left for the answer to fill.
    await expect(page.locator('[data-diagram]')).toHaveCount(0);
    // The cleanup aborted the fetch as the view closed, before any answer was let through.
    await expect.poll(() => failed.length).toBe(1);
    release();
    await passed;
    // A second ask of the same file after the release passes the route at once. The one request
    // that finishes is that second ask; the held one is the request that failed, and a request
    // that failed never finishes.
    const again = await page.evaluate(
        async (url) => (await fetch(url)).status,
        '/api/diagrams/layers.svg'
    );
    expect(again).toBe(200);
    await expect.poll(() => finished.length).toBe(1);
    expect(failed).toEqual([first]);
    // The held request was aborted by the view's cleanup before its answer was let through.
    expect(finished).not.toContain(first);
    expect(errors).toEqual([]);
});

test('a diagram says it is drawing while its answer is out, and a view closed then opens whole', async ({
    page
}) => {
    // revert: src/lib/views/system/help/Diagram.svelte "<p class=\"note\">{t('help.diagram_loading', name)}</p>" => delete
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    let release: () => void = () => undefined;
    const held = new Promise<void>((resolve) => {
        release = resolve;
    });
    await page.route('**/api/diagrams/layers.svg', async (route) => {
        await held;
        await passOn(route);
    });
    await boot(page);
    await openView(page, 'help', t('views.help'));
    await expect(page.getByText(t('help.diagram_loading', 'layers'))).toBeVisible();

    // The view closes with the answer still out; the answer then lands on nothing.
    await closeHelp(page);
    // Closing the Help tab takes its figures with it, so there is none left for the answer to fill.
    await expect(page.locator('[data-diagram]')).toHaveCount(0);
    release();

    // Opened again, the view asks again and draws the diagram the route now answers with.
    await openView(page, 'help', t('views.help'));
    await expect(page.locator('[data-diagram="layers"] svg text').first()).toBeVisible();
    expect(errors).toEqual([]);
});

test('the diagram route serves only the svg files of docs/diagrams', async ({ page }) => {
    // revert: src/lib/server/content/diagrams.ts "export const DIAGRAM_NAME = /^[a-z0-9][a-z0-9-]*\\.svg$/;" => export const DIAGRAM_NAME = /\.(svg|dot|json)$/;
    await boot(page);
    const served = await page.request.get('/api/diagrams/layers.svg');
    expect(served.status()).toBe(200);
    expect(served.headers()['content-type']).toBe('image/svg+xml');
    for (const name of [
        'layers.dot',
        '..%2Fpackage.json',
        '%2E%2E%2Fpackage.json',
        'nothing.svg'
    ]) {
        expect((await page.request.get(`/api/diagrams/${name}`)).status(), name).toBe(404);
    }
});

test('the configuration is one card per file, each opening its own text', async ({ page }) => {
    await boot(page);
    await openView(page, 'config', t('views.config'));

    const layout = card(page, 'layout.yml');
    await expect(layout).toBeVisible();
    await expect(card(page, 'catalogs/vocab.yml')).toBeVisible();
    await expect(layout.getByText(t('config.desc_layout'))).toBeVisible();

    // The line count is the file's own, read through the file route under the engine root.
    const reveal = layout.locator('button[aria-expanded]');
    await expect(reveal).toHaveAttribute('aria-expanded', 'false');
    // the card is closed, so the raw text of the file is not drawn
    await expect(page.locator('pre[data-file="layout.yml"]')).toHaveCount(0);

    await reveal.click();
    await expect(reveal).toHaveAttribute('aria-expanded', 'true');
    const preview = page.locator('pre[data-file="layout.yml"]');
    await expect(preview).toBeVisible();
    await expect(preview).toContainText('nav_groups');
});

test('a configuration file opens in a source tab from its card', async ({ page }) => {
    await boot(page);
    await openView(page, 'config', t('views.config'));

    await card(page, 'catalogs/meta.yml')
        .getByRole('button', { name: t('views.open_source') })
        .click();

    await expect(page.getByRole('tab', { name: 'meta.yml' })).toBeVisible();
    await expect(page.locator('[data-root="engine"][data-path="catalogs/meta.yml"]')).toBeVisible();
});

test('the machine own file is the last card and opens in a source tab', async ({ page }) => {
    await boot(page);
    await openView(page, 'config', t('views.config'));

    const own = card(page, 'local.yml');
    await expect(own).toBeVisible();
    // Exact: the description below the tag opens with the same two words.
    await expect(own.getByText(t('config.local_tag'), { exact: true })).toBeVisible();
    await expect(own.getByText(t('config.desc_local'))).toBeVisible();

    // Last of this view's own list, read inside the pane it is drawn in rather than off the page,
    // which would hold any other open pane's cards as well.
    const names = await page
        .locator('[data-pane-view="config"] [data-card]')
        .evaluateAll((cards) => cards.map((one) => one.getAttribute('data-card')));
    expect(names[names.length - 1]).toBe('local.yml');
    expect(names.length).toBeGreaterThan(1);

    await own.getByRole('button', { name: t('views.open_source') }).click();
    await expect(page.getByRole('tab', { name: 'local.yml' })).toBeVisible();
    await expect(page.locator('[data-root="engine"][data-path="local.yml"]')).toBeVisible();
});

// Revert: size the rows of the card list to the room the pane leaves, as a flex column does.
test('every configuration card is as tall as what it holds, and the list scrolls', async ({
    page
}) => {
    // revert: src/lib/views/system/config/Config.svelte "grid-auto-rows: max-content;" => delete
    await boot(page);
    await openView(page, 'config', t('views.config'));
    await expect(card(page, 'local.yml').locator('button[aria-expanded]')).toBeVisible();

    // A card clips what overflows it, so a card squeezed under its content hides its line count
    // and its control while toBeVisible still passes on the part left showing.
    const cut = await page
        .locator('[data-pane-view="config"] [data-card]')
        .evaluateAll((cards) =>
            cards
                .filter((one) => one.scrollHeight > one.clientHeight + 1)
                .map((one) => one.getAttribute('data-card'))
        );
    expect(cut).toEqual([]);
});

test('a hub document opens from its group in the catalogue', async ({ page }) => {
    writeHubFile(HPC.path, HOWTO);
    try {
        await boot(page);
        await showRailPage(page, 'views');
        await page.locator(`${SHOWN_VIEW} [data-catalogue] button[data-doc="${HPC.path}"]`).click();

        await expect(page.getByRole('tab', { name: HPC.label })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'The cluster' })).toBeVisible();
        await expect(page.getByText('Submit every job with sbatch.')).toBeVisible();
    } finally {
        removeFromHub(HPC.path);
    }
});

test('a hub document keeps its drawn heading while writes under the hub are read', async ({
    page
}) => {
    // revert: src/lib/state/system/docs.svelte.ts "return doc ?? PENDING;" => return askedAt[key] !== (marks[key] ?? 0) ? PENDING : (doc ?? PENDING);
    writeHubFile(HPC.path, HOWTO);
    try {
        const rereads: number[] = [];
        page.on('response', (response) => {
            if (response.url().includes(`hub=${encodeURIComponent(HPC.path)}`)) {
                rereads.push(response.status());
            }
        });
        await boot(page);
        await showRailPage(page, 'views');
        await page.locator(`${SHOWN_VIEW} [data-catalogue] button[data-doc="${HPC.path}"]`).click();
        const heading = page.getByRole('heading', { name: 'The cluster' });
        await expect(heading).toBeVisible();

        // The node drawn now is marked once, and every appearance of the loading words is counted
        // from here on.
        await heading.evaluate((node) => node.setAttribute('data-kept', 'first'));
        const loading = t('doc.loading');
        await page.evaluate((words) => {
            const seen = { count: 0 };
            (window as unknown as { loadingSeen: { count: number } }).loadingSeen = seen;
            new MutationObserver(() => {
                if (document.body.innerText.includes(words)) seen.count += 1;
            }).observe(document.body, { childList: true, subtree: true, characterData: true });
        }, loading);

        // Each write lands under the served hub, which is the root the document lies under, so each
        // is a `files` message the document is asked for again on; the watcher reads a root at most
        // once in two seconds, so the writes are spaced past that.
        const before = rereads.length;
        for (let at = 0; at < 3; at += 1) {
            writeHubFile(`notes/tick-${String(at)}.md`, `# Tick ${String(at)}\n`);
            await expect
                .poll(() => rereads.length, { timeout: 10000 })
                .toBeGreaterThan(before + at);
        }
        // An unchanged file is answered 304 every time, so nothing was rendered again.
        expect(rereads.slice(before).every((status) => status === 304)).toBe(true);
        await expect(page.locator('[data-kept="first"]')).toHaveText('The cluster');
        const seen = await page.evaluate(
            () => (window as unknown as { loadingSeen: { count: number } }).loadingSeen.count
        );
        // The re-reads kept what was drawn, so the loading words never came back.
        expect(seen).toBe(0);

        // A write to the document itself is drawn once its answer lands.
        writeHubFile(HPC.path, '# The cluster, edited\n');
        await expect(page.getByRole('heading', { name: 'The cluster, edited' })).toBeVisible();
    } finally {
        removeFromHub(HPC.path);
        for (let at = 0; at < 3; at += 1) removeFromHub(`notes/tick-${String(at)}.md`);
    }
});

type SavedTab = { id: string; view: string; state: Record<string, string> | null };

/**
 * Open the application on a saved layout whose page holds the Status tab, the tabs given, and one
 * document tab with the state given, that tab shown. `statusSecond` puts the Status tab after the
 * tabs given, so it is the document tab's neighbour; `other` is a second page's tabs and the one
 * active there, the page not shown.
 */
async function bootWithDocTab(
    page: Page,
    state: Record<string, string>,
    before: SavedTab[] = [],
    {
        statusSecond = false,
        other
    }: { statusSecond?: boolean; other?: { tabs: SavedTab[]; active: string } } = {}
): Promise<void> {
    const status: SavedTab = { id: 'status-tab', view: 'status', state: null };
    const pages: unknown[] = [
        {
            id: 'doc-page',
            label: t('ui.page_default', 1),
            workbench: {
                root: {
                    kind: 'pane',
                    tabs: [
                        ...(statusSecond ? [...before, status] : [status, ...before]),
                        { id: 'doc-tab', view: 'doc', state }
                    ],
                    active: 'doc-tab'
                }
            }
        }
    ];
    if (other !== undefined) {
        pages.push({
            id: 'other-page',
            label: t('ui.page_default', 2),
            workbench: { root: { kind: 'pane', tabs: other.tabs, active: other.active } }
        });
    }
    const saved = JSON.stringify({ version: 4, pages, current: 'doc-page' });
    await boot(page, saved);
}

/** The state the saved layout holds for the seeded document tab, or null when it holds none. */
async function savedDocState(page: Page): Promise<unknown> {
    return page.evaluate((key) => {
        const find = (node: unknown): unknown => {
            if (Array.isArray(node)) {
                for (const one of node) {
                    const found = find(one);
                    if (found !== null) return found;
                }
                return null;
            }
            if (typeof node !== 'object' || node === null) return null;
            const held = node as Record<string, unknown>;
            if (held.id === 'doc-tab' && held.view === 'doc') return held.state;
            return find(Object.values(held));
        };
        return find(JSON.parse(localStorage.getItem(key) ?? 'null'));
    }, LAYOUT_KEY);
}

test('a saved document tab whose path left the list follows the entry carrying its label', async ({
    page
}) => {
    // revert: src/lib/views/sources/doc/Doc.svelte "restateInstance(instance.id, { ...held(instance.state), ...docState(entry) });" => delete
    const stale = HPC.path.slice(HPC.path.lastIndexOf('/') + 1);
    expect(stale).not.toBe(HPC.path);
    writeHubFile(HPC.path, HOWTO);
    try {
        await bootWithDocTab(page, { id: stale, path: stale, label: HPC.label });

        await expect(page.getByRole('heading', { name: 'The cluster' })).toBeVisible();
        await expect
            .poll(() => savedDocState(page))
            .toEqual({ id: HPC.path, path: HPC.path, label: HPC.label });
    } finally {
        removeFromHub(HPC.path);
    }
});

test('a saved document tab matching no entry names the path it asked for', async ({ page }) => {
    // revert: src/lib/views/sources/doc/Doc.svelte "<Empty message={t('doc.unlisted', path)} glyph={t('doc.none_glyph')} />" => <Empty message={t('doc.none')} glyph={t('doc.none_glyph')} />
    await bootWithDocTab(page, { id: 'GONE.md', path: 'GONE.md', label: 'Gone' });

    await expect(page.getByText(t('doc.unlisted', 'GONE.md'))).toBeVisible();
    // No entry matched, so the tab keeps the path it was saved with.
    expect(await savedDocState(page)).toEqual({ id: 'GONE.md', path: 'GONE.md', label: 'Gone' });
});

/** The state of every document tab the saved layout holds, by tab id. */
async function savedDocTabs(page: Page): Promise<Record<string, unknown>> {
    return page.evaluate((key) => {
        const found: Record<string, unknown> = {};
        const walk = (node: unknown): void => {
            if (Array.isArray(node)) {
                for (const one of node) walk(one);
                return;
            }
            if (typeof node !== 'object' || node === null) return;
            const held = node as Record<string, unknown>;
            if (held.view === 'doc' && typeof held.id === 'string') found[held.id] = held.state;
            for (const value of Object.values(held)) walk(value);
        };
        walk(JSON.parse(localStorage.getItem(key) ?? 'null'));
        return found;
    }, LAYOUT_KEY);
}

test('a saved document tab whose entry another tab already shows closes into that tab', async ({
    page
}) => {
    // revert: src/lib/views/sources/doc/Doc.svelte "const open = openElsewhere(entry.path);" => const open = openElsewhere('');
    const stale = HPC.path.slice(HPC.path.lastIndexOf('/') + 1);
    expect(stale).not.toBe(HPC.path);
    const current = { id: HPC.path, path: HPC.path, label: HPC.label };
    writeHubFile(HPC.path, HOWTO);
    try {
        // The Status tab sits between the two, so the pane settling on a neighbour after the close
        // would show Status: the document drawn means the other tab was made active.
        // revert: src/lib/views/sources/doc/Doc.svelte "activateInstance(open);" => delete
        await bootWithDocTab(
            page,
            { id: stale, path: stale, label: HPC.label },
            [{ id: 'doc-current', view: 'doc', state: current }],
            { statusSecond: true }
        );

        await expect(page.getByRole('heading', { name: 'The cluster' })).toBeVisible();
        await expect(page.getByRole('tab', { name: HPC.label })).toHaveCount(1);
        await expect(page.getByRole('tab', { name: HPC.label })).toHaveAttribute(
            'aria-selected',
            'true'
        );
        // The stale tab went, and the one left is the tab that already held the path.
        await expect.poll(() => savedDocTabs(page)).toEqual({ 'doc-current': current });
    } finally {
        removeFromHub(HPC.path);
    }
});

test("a saved document tab whose entry a tab on another page shows closes, and that tab becomes its page's active one", async ({
    page
}) => {
    // revert: src/lib/views/sources/doc/Doc.svelte "activateInstance(open);" => delete
    const stale = HPC.path.slice(HPC.path.lastIndexOf('/') + 1);
    const current = { id: HPC.path, path: HPC.path, label: HPC.label };
    writeHubFile(HPC.path, HOWTO);
    try {
        await bootWithDocTab(page, { id: stale, path: stale, label: HPC.label }, [], {
            other: {
                tabs: [
                    { id: 'doc-current', view: 'doc', state: current },
                    { id: 'status-other', view: 'status', state: null }
                ],
                active: 'status-other'
            }
        });

        await expect.poll(() => savedDocTabs(page)).toEqual({ 'doc-current': current });
        await expect.poll(() => activeOf(page, 'other-page')).toBe('doc-current');
    } finally {
        removeFromHub(HPC.path);
    }
});

/** The id of the active tab the saved layout holds for one page's single pane. */
async function activeOf(page: Page, id: string): Promise<string | null> {
    return page.evaluate(
        ({ key, id }) => {
            const saved = JSON.parse(localStorage.getItem(key) ?? 'null') as {
                pages?: { id: string; workbench: { root: { active?: string } } }[];
            } | null;
            const held = saved?.pages?.find((one) => one.id === id);
            return held?.workbench.root.active ?? null;
        },
        { key: LAYOUT_KEY, id }
    );
}
