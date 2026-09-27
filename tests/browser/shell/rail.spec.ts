// The rail as a reader meets it on a served page, drawn as VS Code's activity bar: its width and
// its square items under a light, a dark and a terminal theme; an item named by its page with the
// page's name and digit on hover; the one badge inside its item; the Bookmarks menu at the foot,
// which the served run starts holding two manuals and a bookmark the Files view adds joins, and
// which a bookmark written into the file from outside joins on the open page; a page
// button dragged to a new place and one hidden from its right-click menu, each written to the
// engine's layout.yml; and Settings in that menu. Also the facts only a rendered page holds: a
// pseudo-element's content, the room a glyph's stand-in needs inside its box, and which element a
// pointer would reach at a point, which says whether a tooltip is painted over the panes or under.
//
// The cases that write layout.yml put it back as they found it, and wait for the rail to redraw
// from it, so the specs after them find the rail the run started with.

import { expect, test, type Locator, type Page } from '@playwright/test';
import {
    SHOWN_VIEW,
    bookmarkFiles,
    boot,
    openView,
    pickTheme,
    showRailPage
} from '../helpers/rail.ts';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
    readEngineFile,
    removeFromHub,
    servedHomeDir,
    writeEngineFile,
    writeHubFile
} from '../helpers/hub.ts';
import { t } from '../helpers/words.ts';

/** The engine's layout file, whose rail list the drag and the Hide cases write. */
const LAYOUT = 'config/layout.yml';

/** VS Code's activity bar width and the side of each of its items, in CSS pixels. */
const RAIL = 48;

/** The board behind the rail, under the terminal palette that also carries the wallpaper. */
async function board(page: Page): Promise<void> {
    await boot(page);
    await pickTheme(page, 'mocha');
    await expect(page.locator('.wallpaper')).toHaveCount(1);
    // The blur is what makes the rail the containing block and the stacking context of the fixed
    // things inside it, so a page without it reaches none of what these tests are for.
    const blur = await page
        .locator('nav.rail')
        .evaluate((el) => getComputedStyle(el).backdropFilter);
    expect(blur).not.toBe('none');
    await openView(page, 'projects', t('views.projects'));
}

/** One page button of the rail, by its arrangement key. */
function railButton(page: Page, key: string): Locator {
    return page.locator(`nav [data-rail-page="${key}"] button`);
}

/**
 * Whether the element a pointer reaches at the centre of a box is inside that box. A box painted
 * under the panes beside it answers with whatever the pane draws there instead.
 */
async function centreIsInside(target: Locator): Promise<boolean> {
    return target.evaluate((el) => {
        const rect = el.getBoundingClientRect();
        const at = document.elementFromPoint(
            rect.left + rect.width / 2,
            rect.top + rect.height / 2
        );
        return at !== null && el.contains(at);
    });
}

/**
 * The one open bubble: its rectangle, the window it is laid out in, and what is drawn at its
 * centre.
 */
async function bubbleShape(page: Page): Promise<{
    left: number;
    top: number;
    right: number;
    bottom: number;
    width: number;
    height: number;
    inside: boolean;
    window: { width: number; height: number };
}> {
    const bubble = page.locator('[role="tooltip"]:not([hidden])').first();
    await expect(bubble).toBeVisible();
    // The bubble takes no pointer events, so the hit test at its centre would answer with whatever
    // is under it whatever the paint order is; it takes them for the length of the measurement.
    return bubble.evaluate((el) => {
        const box = el as HTMLElement;
        const rect = box.getBoundingClientRect();
        box.style.pointerEvents = 'auto';
        const at = document.elementFromPoint(
            rect.left + rect.width / 2,
            rect.top + rect.height / 2
        );
        box.style.pointerEvents = '';
        return {
            left: rect.left,
            top: rect.top,
            right: rect.right,
            bottom: rect.bottom,
            width: rect.width,
            height: rect.height,
            inside: at !== null && box.contains(at),
            window: { width: window.innerWidth, height: window.innerHeight }
        };
    });
}

/**
 * The rail's width, every rail item's box, and every page button's badges with each badge's box,
 * measured on the page.
 */
async function railShape(page: Page): Promise<{
    width: number;
    items: { width: number; height: number }[];
    badges: { count: number; inside: boolean }[];
}> {
    return page.locator('nav.rail').evaluate((nav) => {
        const items = [...nav.querySelectorAll('[data-stop]')].map((node) => {
            const rect = node.getBoundingClientRect();
            return { width: rect.width, height: rect.height };
        });
        const badges = [...nav.querySelectorAll('[data-rail-page]')].map((control) => {
            const button = control.querySelector('button')?.getBoundingClientRect();
            const found = [...control.querySelectorAll('[data-rail-badge]')];
            const inside = found.every((badge) => {
                const box = badge.getBoundingClientRect();
                return (
                    button !== undefined &&
                    box.left >= button.left &&
                    box.right <= button.right &&
                    box.top >= button.top &&
                    box.bottom <= button.bottom
                );
            });
            return { count: found.length, inside };
        });
        return { width: nav.getBoundingClientRect().width, items, badges };
    });
}

test('the rail is 48 px wide with square items and at most one badge, inside its button, under every kind of theme', async ({
    page
}) => {
    // revert: src/lib/themes/tokens.css "--rail-width: 48px;" => --rail-width: 98px;
    // revert: src/lib/shell/rail/RailPages.svelte "top: 24px;" => top: 40px;
    await boot(page);
    for (const theme of ['light', 'dark', 'mocha']) {
        await pickTheme(page, theme);
        const shape = await railShape(page);
        expect(shape.width, theme).toBe(RAIL);
        expect(shape.items.length, theme).toBeGreaterThan(3);
        for (const item of shape.items) {
            expect(item, theme).toEqual({ width: RAIL, height: RAIL });
        }
        // The demo hub counts on some pages, and every badge sits inside its own button's box.
        expect(
            shape.badges.some((one) => one.count === 1),
            theme
        ).toBe(true);
        expect(
            shape.badges.every((one) => one.count <= 1 && one.inside),
            theme
        ).toBe(true);
    }
});

test('a page button is its icon alone, named by its page, with its name and digit on hover', async ({
    page
}) => {
    // revert: src/lib/shell/rail/RailPages.svelte "<ToolButton" +1 => label={entry.page}
    await boot(page);
    const projects = page.locator('nav').getByRole('button', { name: 'Projects', exact: true });
    await expect(projects).toHaveCount(1);
    // The item is its icon alone, as VS Code's is: the name is the tooltip and the accessible name.
    await expect(projects.locator('.label')).toHaveCount(0);
    await expect(projects.locator('.glyph svg')).toHaveCount(1);
    await page.mouse.move(700, 400);
    await projects.hover();
    await expect(page.locator('[role="tooltip"]:not([hidden])')).toContainText(
        t('ui.page_shortcut', 'Projects', 2)
    );
});

test('a rail tooltip opens beside its button, centred on the button as VS Code centres its hover', async ({
    page
}) => {
    // revert: src/lib/ui/menu/Tooltip.svelte "if (placement === 'beside') void tick().then(centre);" => delete
    await boot(page);
    const button = railButton(page, 'projects');
    await page.mouse.move(700, 400);
    await button.hover();
    const bubble = await bubbleShape(page);
    const box = await button.boundingBox();
    expect(box).not.toBeNull();
    if (box === null) return;
    expect(bubble.left).toBeGreaterThanOrEqual(box.x + box.width);
    expect(Math.abs((bubble.top + bubble.bottom) / 2 - (box.y + box.height / 2))).toBeLessThan(1);
});

test('a rail button tooltip and the Settings theme list paint over what is beside them', async ({
    page
}) => {
    // revert: src/lib/ui/frame/on-body.ts "document.body.append(node);" => void node;
    await board(page);

    await railButton(page, 'projects').hover();
    expect((await bubbleShape(page)).inside).toBe(true);

    await showRailPage(page, 'views');
    await page
        .locator(`${SHOWN_VIEW} [data-settings-view]`)
        .getByRole('button', { name: t('ui.theme') })
        .click();
    const themes = page.getByRole('menu', { name: t('ui.theme') });
    await expect(themes).toBeVisible();
    expect(await centreIsInside(themes)).toBe(true);
    await page.keyboard.press('Escape');
});

test('a rail button under a terminal palette is its stand-in whole inside the square, clear of its badge, with no brackets', async ({
    page
}) => {
    // revert: src/lib/ui/controls/ToolButton.svelte ":global(body.rice) .tool.rail-control :global(.glyph:not(:has(svg))) {" +1 => font-size: var(--fs-3xl);
    // revert: src/lib/shell/rail/RailPages.svelte "top: 31px;" => top: 24px;
    await board(page);

    const shape = await railButton(page, 'projects').evaluate((el) => {
        const glyph = el.querySelector('.glyph');
        const box = el.getBoundingClientRect();
        const inner = glyph?.getBoundingClientRect();
        const badge = el.parentElement
            ?.closest('[data-rail-page]')
            ?.querySelector('[data-rail-badge]')
            ?.getBoundingClientRect();
        return {
            width: box.width,
            height: box.height,
            before: getComputedStyle(el, '::before').content,
            after: getComputedStyle(el, '::after').content,
            text: glyph?.textContent ?? '',
            inside: inner !== undefined && inner.left >= box.left && inner.right <= box.right,
            // The badge and the stand-in share no pixel, so the stand-in is read whole.
            clear:
                inner !== undefined &&
                badge !== undefined &&
                (badge.top >= inner.bottom ||
                    badge.bottom <= inner.top ||
                    badge.left >= inner.right ||
                    badge.right <= inner.left),
            scrollWidth: glyph === null ? -1 : glyph.scrollWidth,
            clientWidth: glyph === null ? -1 : glyph.clientWidth
        };
    });

    expect(shape.width).toBe(RAIL);
    expect(shape.height).toBe(RAIL);
    expect(shape.before).toBe('none');
    expect(shape.after).toBe('none');
    expect(shape.text).not.toBe('');
    expect(shape.inside).toBe(true);
    expect(shape.clear).toBe(true);
    expect(shape.clientWidth).toBeGreaterThan(0);
    expect(shape.scrollWidth).toBeLessThanOrEqual(shape.clientWidth);
});

test('a card control tooltip is whole, inside the window and on top', async ({ page }) => {
    await board(page);

    // A card's controls are drawn under the pointer, and the ones that do not fit sit behind More,
    // so the pointer rests on the card before it moves onto the first control the line holds.
    const card = page.locator('.cards .slot').first();
    await card.locator('.title').hover();
    await card.locator('[data-card-actions] [data-action] button').first().hover();
    const shape = await bubbleShape(page);

    expect(shape.width).toBeGreaterThan(0);
    expect(shape.height).toBeGreaterThan(0);
    expect(shape.left).toBeGreaterThanOrEqual(0);
    expect(shape.top).toBeGreaterThanOrEqual(0);
    expect(shape.right).toBeLessThanOrEqual(shape.window.width);
    expect(shape.bottom).toBeLessThanOrEqual(shape.window.height);
    expect(shape.inside).toBe(true);
});

test('a tooltip inside an overlay is drawn over it', async ({ page }) => {
    await board(page);

    await page.getByRole('button', { name: t('app.update'), exact: true }).click();
    const tray = page.getByRole('dialog', { name: t('app.tasks.update_tasks') });
    await expect(tray).toBeVisible();
    await tray.getByRole('button', { name: t('app.tasks.close') }).hover();

    expect((await bubbleShape(page)).inside).toBe(true);
});

test('the Bookmarks menu lists the bookmarks by name over the panes, opens one, and takes one Files adds', async ({
    page
}) => {
    // revert: src/lib/shell/rail/RailFoot.svelte "{items}" => items={[]}
    await board(page);
    // The bookmarks are the menu's choices and no longer buttons of the rail's list.
    await expect(page.locator('nav button[data-bookmark]')).toHaveCount(0);
    // Nor is there a heading over them: the word is the opener's name, which is not drawn.
    await expect(page.locator('nav').getByText(t('ui.docs'), { exact: true })).toHaveCount(0);

    const opener = page.locator('nav').getByRole('button', { name: t('ui.docs'), exact: true });
    await opener.click();
    const menu = page.getByRole('menu', { name: t('ui.docs') });
    await expect(menu).toBeVisible();
    expect(await centreIsInside(menu)).toBe(true);
    await expect(menu.getByRole('menuitem')).toHaveText(['cathedra manual', 'game-engine manual']);
    await menu.getByRole('menuitem', { name: 'cathedra manual' }).click();
    // A choice closes the menu as it opens the bookmark.
    await expect(menu).toHaveCount(0);
    await expect(page.getByRole('tab', { name: 'cathedra manual' })).toBeVisible();

    // The bookmark this case adds is taken out again, so the specs after it find the file as the
    // run wrote it.
    const file = join(servedHomeDir(), '.oculus', 'bookmarks.yml');
    const held = readFileSync(file, 'utf8');
    try {
        await openView(page, 'files', t('views.files'));
        await page.locator('[data-fs-row="hub:"]').getByRole('button').first().click();
        const readme = page.locator('[data-fs-row="hub:README.md"]');
        await readme.hover();
        await readme.getByRole('button', { name: t('files.row_bookmark'), exact: true }).click();
        await opener.click();
        await expect(menu.getByRole('menuitem', { name: 'README.md' })).toHaveCount(1);
        await page.keyboard.press('Escape');
        // Escape closes the menu and hands the keyboard back to its opener.
        await expect(menu).toHaveCount(0);
        await expect(opener).toBeFocused();
    } finally {
        writeFileSync(file, held);
    }
});

test('a bookmark written into the file from outside joins the open menu without a reload', async ({
    page
}) => {
    // revert: src/lib/state/sources/fs.svelte.ts "if (named === true && message.version > onDisk) onDisk = message.version;" => delete
    // What the socket carried on the `files` channel, in order, read off the wire.
    const files: { root?: string; bookmarks?: boolean }[] = [];
    page.on('websocket', (socket) => {
        socket.on('framereceived', ({ payload }) => {
            const message = JSON.parse(String(payload)) as { channel?: string; payload?: object };
            if (message.channel === 'files') files.push(message.payload ?? {});
        });
    });
    await boot(page);
    // The menu has read the file once, so what it lists later is a second read or none.
    expect(await bookmarkFiles(page)).not.toContain('hub/CAREER.yml');

    const file = join(servedHomeDir(), '.oculus', 'bookmarks.yml');
    const held = readFileSync(file, 'utf8');
    const outside = 'outside-write.txt';
    try {
        writeFileSync(file, `${held}  - label: career\n    root: hub\n    path: CAREER.yml\n`);
        await expect.poll(() => files.findIndex((one) => one.bookmarks === true)).not.toBe(-1);
        // A write under a root is the next message on the channel, as a busy hub's writes are,
        // and the page holds one message a channel: the word about the bookmarks is replaced.
        writeHubFile(outside, 'x\n');
        await expect
            .poll(() => {
                const said = files.findIndex((one) => one.bookmarks === true);
                return files.slice(said + 1).some((one) => one.root !== '');
            })
            .toBe(true);
        await expect.poll(() => bookmarkFiles(page)).toContain('hub/CAREER.yml');
    } finally {
        writeFileSync(file, held);
        removeFromHub(outside);
    }
});

test('the Bookmarks menu says there is none when the file holds none', async ({ page }) => {
    // revert: src/lib/shell/rail/rail.ts "return [{ id: 'none', label: t('ui.bookmarks_none'), title: t('ui.bookmarks_none_tip') }];" => return [];
    const file = join(servedHomeDir(), '.oculus', 'bookmarks.yml');
    const held = readFileSync(file, 'utf8');
    try {
        writeFileSync(file, held.replace(/^entries:[\s\S]*$/m, 'entries: []\n'));
        await boot(page);
        await page
            .locator('nav')
            .getByRole('button', { name: t('ui.docs'), exact: true })
            .click();
        await expect(
            page.getByRole('menu', { name: t('ui.docs') }).getByRole('menuitem')
        ).toHaveText([t('ui.bookmarks_none')]);
    } finally {
        writeFileSync(file, held);
    }
});

/** The order of the rail's entries in the engine's layout file, by page. */
function fileOrder(): string[] {
    return [...readEngineFile(LAYOUT).matchAll(/^ {2}- \{[^}]*\bpage: (\w+) \}$/gm)].map(
        (found) => found[1]
    );
}

/** The order of the page buttons the rail draws, by page. */
async function drawnOrder(page: Page): Promise<string[]> {
    return page
        .locator('nav [data-rail-page]')
        .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-rail-page') ?? ''));
}

/** Undo the newest write from the History view, and wait for its sentence. */
async function undoNewest(page: Page): Promise<void> {
    await openView(page, 'history', t('views.history'));
    const row = page.locator('[data-change]').first();
    await expect(row).toContainText(LAYOUT);
    await row.getByRole('button', { name: t('history.undo') }).click();
}

test('a page button dragged above another moves its entry there in layout.yml, the rail follows, and History undoes it', async ({
    page
}) => {
    // revert: src/lib/shell/rail/RailPages.svelte "onmove(held.page, pages.at(held.at)?.page ?? null);" => delete
    // revert: src/lib/server/edit/writes/undo.ts "const outcome = writeRail(into.layoutFile, railRows(change.before) ?? [], into.glyphs);" => const outcome = writeRail(into.layoutFile, railRows(change.after) ?? [], into.glyphs);
    const before = readEngineFile(LAYOUT);
    const order = fileOrder();
    try {
        await boot(page);
        await expect.poll(() => drawnOrder(page)).toEqual(order);
        const from = await railButton(page, 'inbox').boundingBox();
        const onto = await railButton(page, 'focus').boundingBox();
        expect(from).not.toBeNull();
        expect(onto).not.toBeNull();
        if (from === null || onto === null) return;
        await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
        await page.mouse.down();
        await page.mouse.move(onto.x + onto.width / 2, onto.y + 4, { steps: 12 });
        // The line between two buttons says where it lands while the drag is held.
        await expect(page.locator('nav [data-rail-insert]')).toHaveCount(1);
        await page.mouse.up();
        const moved = ['inbox', ...order.filter((key) => key !== 'inbox')];
        await expect.poll(fileOrder).toEqual(moved);
        await expect.poll(() => drawnOrder(page)).toEqual(moved);
        // The release was the drop, not a press: the page on screen did not change.
        await expect(railButton(page, 'inbox')).not.toHaveClass(/\bactive\b/);

        // The move is a write of the change log, and its undo puts the order back.
        await undoNewest(page);
        await expect.poll(fileOrder).toEqual(order);
        await expect.poll(() => drawnOrder(page)).toEqual(order);
    } finally {
        writeEngineFile(LAYOUT, before);
        await expect.poll(() => drawnOrder(page)).toEqual(order);
    }
});

test('Hide in a page button right-click menu takes its entry out of layout.yml, and History puts it back', async ({
    page
}) => {
    // revert: src/lib/shell/rail/ActivityRail.svelte "void write((rail) => railHidden(rail, page));" => void write((rail) => rail);
    // revert: src/lib/server/edit/writes/undo.ts "const outcome = writeRail(into.layoutFile, railRows(change.before) ?? [], into.glyphs);" => const outcome = writeRail(into.layoutFile, railRows(change.after) ?? [], into.glyphs);
    const before = readEngineFile(LAYOUT);
    const order = fileOrder();
    try {
        await boot(page);
        await railButton(page, 'inbox').click({ button: 'right' });
        const menu = page.getByRole('menu', { name: 'Inbox' });
        await expect(menu).toBeVisible();
        await expect(menu.getByRole('menuitem')).toHaveText([
            t('ui.rail_hide'),
            t('ui.rail_settings')
        ]);
        await menu.getByRole('menuitem', { name: t('ui.rail_hide') }).click();
        // Hide took the entry out of the file's list, and the rail redraws from the file.
        await expect.poll(fileOrder).not.toContain('inbox');
        // The watcher pushed the file back, and the rail draws no button for the hidden page.
        await expect(page.locator('nav [data-rail-page="inbox"]')).toHaveCount(0);

        await undoNewest(page);
        await expect.poll(fileOrder).toEqual(order);
        await expect(page.locator('nav [data-rail-page="inbox"]')).toHaveCount(1);
    } finally {
        writeEngineFile(LAYOUT, before);
        await expect(page.locator('nav [data-rail-page="inbox"]')).toHaveCount(1);
    }
});

test.describe('Settings from a page button menu', () => {
    // Short enough that the Settings view's appearance rows push the rail list below its fold.
    test.use({ viewport: { width: 1280, height: 520 } });

    test('the keyboard opens the menu, and Settings shows the rail list scrolled into view', async ({
        page
    }) => {
        // revert: src/lib/views/system/workbench/RailEditor.svelte "section.scrollIntoView({ block: 'start' });" => delete
        await boot(page);
        await railButton(page, 'projects').focus();
        await page.keyboard.press('Shift+F10');
        const keyed = page.getByRole('menu', { name: 'Projects' });
        await expect(keyed.getByRole('menuitem').first()).toBeFocused();
        await keyed.getByRole('menuitem', { name: t('ui.rail_settings') }).click();
        await expect(railButton(page, 'views')).toHaveClass(/\bactive\b/);
        // The Settings view is taller than its pane here, so the list is in view only because the
        // view was scrolled down to it.
        const heading = page.locator(`${SHOWN_VIEW} [data-settings="rail"] h3`);
        const scrolled = (): Promise<number> =>
            heading.evaluate((el) => {
                let total = 0;
                for (let at = el.parentElement; at !== null; at = at.parentElement) {
                    total += at.scrollTop;
                    if (at.hasAttribute('data-pane')) break;
                }
                return total;
            });
        await expect.poll(scrolled).toBeGreaterThan(0);
        await expect(heading).toBeInViewport();
    });
});

test('the rail draws no BOOKMARKS group: the bookmarks are the choices of the menu at its foot', async ({
    page
}) => {
    // revert: src/lib/shell/rail/ActivityRail.svelte "<RailPages {pages} {stopIndex} {ringKeys} onmove={moved} onmenu={menuPick} />" => <RailPages {pages} {stopIndex} {ringKeys} onmove={moved} onmenu={menuPick} /><p class="group">{t('ui.docs')}</p>
    await boot(page);
    // No button of the list draws a bookmark: they are menu choices, drawn when it opens.
    await expect(page.locator('nav button[data-bookmark]')).toHaveCount(0);
    // No heading names them either: the word is the foot opener's accessible name, not drawn.
    await expect(page.locator('nav').getByText(t('ui.docs'), { exact: true })).toHaveCount(0);
    await expect(
        page.locator('nav [data-foot]').getByRole('button', { name: t('ui.docs'), exact: true })
    ).toHaveAttribute('aria-haspopup', 'menu');
});

/** The resolved value of a colour token, in the form getComputedStyle answers. */
async function resolved(page: Page, token: string): Promise<string> {
    return page.evaluate((name) => {
        const probe = document.createElement('span');
        document.body.append(probe);
        probe.style.color = `var(${name})`;
        const colour = getComputedStyle(probe).color;
        probe.remove();
        return colour;
    }, token);
}

test('every rail badge is one colour, the accent with its own ink, in the UI face at 9 px, though the views it counts carry different tones', async ({
    page
}) => {
    // revert: src/lib/shell/rail/RailPages.svelte "<span class=\"badge\" aria-hidden=\"true\" data-rail-badge>" => <span class="badge" aria-hidden="true" data-rail-badge style={badge.tone === undefined ? undefined : `background: var(--c-${badge.tone})`}>
    // revert: src/lib/shell/rail/RailPages.svelte "font-family: var(--font-ui);" => font-family: var(--font-num);
    // revert: src/lib/shell/rail/RailPages.svelte "font-size: var(--rail-badge-text);" => font-size: var(--fs-sm);
    await boot(page);
    await showRailPage(page, 'views');
    // The catalogue draws each view's badge in its view's tone, and the demo hub has more than one.
    const tones = await page
        .locator(`${SHOWN_VIEW} [data-catalogue] .badge`)
        .evaluateAll((badges) => badges.map((one) => getComputedStyle(one).backgroundColor));
    expect(new Set(tones).size).toBeGreaterThan(1);
    const accent = await resolved(page, '--accent');
    const ink = await resolved(page, '--on-accent');
    const face = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
    const badges = await page.locator('nav [data-rail-badge]').evaluateAll((all) =>
        all.map((one) => {
            const style = getComputedStyle(one);
            return {
                background: style.backgroundColor,
                colour: style.color,
                family: style.fontFamily,
                size: style.fontSize,
                weight: style.fontWeight
            };
        })
    );
    expect(badges.length).toBeGreaterThan(1);
    for (const badge of badges) {
        expect(badge).toEqual({
            background: accent,
            colour: ink,
            family: face,
            size: '9px',
            weight: '600'
        });
    }
});

test("the rail is drawn in the ground's colour with a border on its right, as VS Code's Modern themes draw their activity bar", async ({
    page
}) => {
    // revert: src/lib/shell/rail/ActivityRail.svelte "background: var(--bg);" => background: var(--panel);
    // revert: src/lib/shell/rail/ActivityRail.svelte "box-shadow: inset -1px 0 0 var(--line);" => box-shadow: none;
    await boot(page);
    // VS Code's own theme files: activityBar.background and activityBar.border.
    const vscode = {
        'vscode-dark-modern': { bar: 'rgb(24, 24, 24)', border: 'rgb(43, 43, 43)' },
        'vscode-light-modern': { bar: 'rgb(248, 248, 248)', border: 'rgb(229, 229, 229)' }
    };
    for (const [theme, want] of Object.entries(vscode)) {
        await pickTheme(page, theme);
        const paint = await page.evaluate(() => {
            const rail = document.querySelector('nav.rail');
            const style = rail === null ? null : getComputedStyle(rail);
            return { bar: style?.backgroundColor ?? '', edge: style?.boxShadow ?? '' };
        });
        expect(paint.bar, theme).toBe(want.bar);
        expect(paint.edge, theme).toContain(want.border);
    }
});

test('a rail tooltip points at its item, and none opens during a drag or on a focus a closing menu gives back', async ({
    page
}) => {
    // revert: src/lib/ui/menu/Tooltip.svelte "class:beside={placement === 'beside'}" => delete
    // revert: src/lib/ui/menu/Tooltip.svelte "if (text === '' || event.buttons !== 0) return;" => if (text === '') return;
    // revert: src/lib/ui/menu/Tooltip.svelte "if (!(target instanceof Element) || target.closest(`[${QUIET_FOCUS}]`) !== null) return;" => if (!(target instanceof Element)) return;
    await boot(page);
    const bubble = page.locator('[role="tooltip"]:not([hidden])');
    await page.mouse.move(700, 400);
    await railButton(page, 'projects').hover();
    await expect(bubble).toHaveCount(1);
    const arrow = await bubble.evaluate((el) => {
        const style = getComputedStyle(el, '::before');
        return { content: style.content, colour: style.borderRightColor };
    });
    expect(arrow.content).toBe('""');
    expect(arrow.colour).toBe(await resolved(page, '--line'));

    // A drag passing over the other buttons opens none of their words.
    await page.mouse.move(700, 400);
    // The pointer left the button, which puts its words away before the drag starts.
    await expect(bubble).toHaveCount(0);
    const from = await railButton(page, 'inbox').boundingBox();
    const over = await railButton(page, 'focus').boundingBox();
    if (from === null || over === null) throw new Error('no rail buttons');
    await page.mouse.move(from.x + 24, from.y + 24);
    await page.mouse.down();
    await page.mouse.move(over.x + 24, over.y + 30, { steps: 12 });
    await page.waitForTimeout(400);
    // The pointer rests on a button with its button held, which is a drag and asks for no words.
    await expect(bubble).toHaveCount(0);
    await page.keyboard.press('Escape');
    await page.mouse.up();

    // A context menu closed by the keyboard hands the focus back without opening the words.
    await page.mouse.move(700, 400);
    await railButton(page, 'projects').focus();
    await page.keyboard.press('Shift+F10');
    await expect(page.getByRole('menu', { name: 'Projects' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(railButton(page, 'projects')).toBeFocused();
    await page.waitForTimeout(400);
    // The focus came back from the menu, not from a move of the reader's, so no words open.
    await expect(bubble).toHaveCount(0);
    // A move of the reader's own along the rail opens the words of the button it lands on.
    await page.keyboard.press('ArrowDown');
    await expect(bubble).toHaveCount(1);
});

test('the Bookmarks menu opens upward from the star, inside the window', async ({ page }) => {
    // revert: src/lib/ui/menu/Menu.svelte "rise={onBody}" => delete
    await boot(page);
    const star = page.locator('nav').getByRole('button', { name: t('ui.docs'), exact: true });
    await star.click();
    const menu = page.getByRole('menu', { name: t('ui.docs') });
    await expect(menu).toBeVisible();
    const box = await menu.boundingBox();
    const opener = await star.boundingBox();
    const height = page.viewportSize()?.height ?? 0;
    if (box === null || opener === null) throw new Error('no menu or opener box');
    expect(Math.abs(box.y + box.height - (opener.y + opener.height))).toBeLessThanOrEqual(1);
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.y + box.height).toBeLessThanOrEqual(height);
    expect(box.x).toBeGreaterThanOrEqual(opener.x + opener.width);
});

test('the Bookmarks menu in a window too short for it ends on the star and scrolls', async ({
    page
}) => {
    // revert: src/lib/ui/menu/MenuList.svelte "(rise" .. ": '') +" => (rise ? '' : '') +
    // The foot's three icons fill the rail's lowest 144 px, so the star's bottom is 64 px down, and
    // the two bookmarks' list is taller than the 56 px above that.
    await page.setViewportSize({ width: 1280, height: 160 });
    await boot(page);
    const star = page.locator('nav').getByRole('button', { name: t('ui.docs'), exact: true });
    await star.click();
    const menu = page.getByRole('menu', { name: t('ui.docs') });
    await expect(menu).toBeVisible();
    const box = await menu.boundingBox();
    const opener = await star.boundingBox();
    if (box === null || opener === null) throw new Error('no menu or opener box');
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(Math.abs(box.y + box.height - (opener.y + opener.height))).toBeLessThanOrEqual(1);
    expect(box.y + box.height).toBeLessThanOrEqual(160);
});

test('the icon stays 24 px at a larger text scale, clear of the badge', async ({ page }) => {
    // revert: src/lib/themes/tokens.css "--rail-icon: 24px;" => --rail-icon: calc(24px * var(--text-scale, 1));
    await boot(page);
    await page.evaluate(() => document.documentElement.style.setProperty('--text-scale', '1.5'));
    const icon = await railButton(page, 'projects').locator('.glyph svg').boundingBox();
    if (icon === null) throw new Error('no icon');
    expect(icon.width).toBe(24);
    expect(icon.height).toBe(24);
});
